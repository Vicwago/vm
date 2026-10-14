/*
 * FUNCIÓN DE ENVÍO (Vercel serverless): POST /api/enviar
 *
 * Recibe el resumen de una visita desde la app de la tablet y lo envía por email con Resend
 * a los correos de NorteIA. Los destinatarios y la clave de Resend NO están en la web:
 * viven en las variables de entorno del proyecto en Vercel.
 *
 * Variables de entorno (Vercel → proyecto → Settings → Environment Variables):
 *   RESEND_API_KEY        clave de Resend (solo permiso de envío)            [secreta]
 *   CLAVE_DISPOSITIVO     clave que se introduce una vez en cada tablet      [secreta]
 *   EMAIL_REMITENTE       p. ej. "NorteIA · Estimaciones <estimaciones@norteia.es>" (dominio verificado en Resend)
 *   EMAIL_DESTINO         correos separados por comas, p. ej. "victor@norteia.es,luis@norteia.es"
 *   ORIGENES_PERMITIDOS   p. ej. "https://norteia-auditoria.vercel.app" (separados por comas)
 *
 * Respuestas: 200 aceptado · 400/401/403 configuración o petición no válida (la app no reintenta)
 *             429 demasiadas peticiones · 502/503 fallo temporal (la app reintenta)
 */
"use strict";

const crypto = require("crypto");

const URL_RESEND = "https://api.resend.com/emails";
const LIMITE_BYTES = 45 * 1024;
const LIMITE_POR_MINUTO = 10;

// Campos que manda la app y su longitud máxima
const CAMPOS = {
  auditoria_id: 20,
  revision: 6,
  tipo_envio: 20,
  fecha_local: 40,
  fecha_iso: 40,
  nicho_nombre: 80,
  nombre_cliente: 200,
  respuestas_texto: 20000,
  calculo_texto: 6000,
  interes_texto: 300,
  contacto_texto: 1000,
  proximo_paso: 1000
};

// Límite por IP en memoria (orientativo: cada instancia lleva su cuenta)
const ventanas = new Map();
function dentroDelLimite(ip, ahora) {
  const lista = (ventanas.get(ip) || []).filter((t) => ahora - t < 60000);
  if (lista.length >= LIMITE_POR_MINUTO) { ventanas.set(ip, lista); return false; }
  lista.push(ahora);
  ventanas.set(ip, lista);
  if (ventanas.size > 5000) ventanas.clear();
  return true;
}

function responder(res, status, datos, cabeceras) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  Object.keys(cabeceras || {}).forEach((k) => res.setHeader(k, cabeceras[k]));
  res.end(JSON.stringify(datos));
}

function igualSeguro(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

function unaLinea(t) {
  return String(t || "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

function lista(valor) {
  return String(valor || "").split(",").map((s) => s.trim()).filter(Boolean);
}

// Comprueba y limpia el contenido recibido. Devuelve { datos } o { error }.
function validar(cuerpo) {
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) return { error: "Cuerpo no válido" };
  const datos = {};
  for (const campo of Object.keys(CAMPOS)) {
    const v = cuerpo[campo];
    if (v == null || v === "") {
      if (campo === "contacto_texto") { datos[campo] = "No recogido"; continue; }
      return { error: "Falta el campo " + campo };
    }
    if (typeof v !== "string") return { error: "Campo no válido: " + campo };
    if (v.length > CAMPOS[campo]) return { error: "Campo demasiado largo: " + campo };
    datos[campo] = v;
  }
  if (!/^[A-Z0-9-]{3,20}$/i.test(datos.auditoria_id)) return { error: "ID de visita no válido" };
  if (!/^\d{1,6}$/.test(datos.revision)) return { error: "Revisión no válida" };
  return { datos };
}

function cuerpoEmail(d) {
  return [
    "ESTIMACIÓN RÁPIDA NORTEIA",
    d.tipo_envio,
    "ID: " + d.auditoria_id + " · Revisión: " + d.revision,
    "Fecha de visita: " + d.fecha_local + " (Europe/Madrid)",
    "Fecha original ISO: " + d.fecha_iso,
    "Sector: " + d.nicho_nombre,
    "Cliente: " + d.nombre_cliente,
    "",
    "RESPUESTAS",
    d.respuestas_texto,
    "",
    "RESULTADO ESTIMADO",
    d.calculo_texto,
    "",
    "INTERÉS DECLARADO",
    d.interes_texto,
    "",
    "CONTACTO",
    d.contacto_texto,
    "",
    "PRÓXIMO PASO",
    d.proximo_paso,
    "",
    "Estimación orientativa basada en las respuestas, no un ahorro garantizado.",
    "El negocio aceptó enviar este resumen a NorteIA desde la app.",
    "Si hay varias revisiones del mismo ID, utilizar la de número más alto."
  ].join("\n");
}

async function handler(req, res, opciones) {
  const o = opciones || {};
  const env = o.env || process.env;
  const fetchFn = o.fetch || globalThis.fetch;
  const ahora = (o.ahora || Date.now)();

  // 1. Origen permitido (la app llama desde su propia web)
  const permitidos = lista(env.ORIGENES_PERMITIDOS);
  const origen = req.headers.origin || "";
  if (permitidos.length && origen && permitidos.indexOf(origen) < 0) {
    return responder(res, 403, { error: "Origen no permitido" });
  }
  if (req.method !== "POST") return responder(res, 405, { error: "Solo POST" }, { Allow: "POST" });

  // 2. Configuración del servidor
  if (!env.RESEND_API_KEY || !env.CLAVE_DISPOSITIVO || !env.EMAIL_REMITENTE || !lista(env.EMAIL_DESTINO).length) {
    return responder(res, 400, { error: "Envío sin configurar en el servidor" });
  }

  // 3. Clave de la tablet (no está en el código de la web)
  if (!igualSeguro(req.headers["x-clave-dispositivo"], env.CLAVE_DISPOSITIVO)) {
    return responder(res, 401, { error: "Clave de envío de la tablet incorrecta o ausente" });
  }

  // 4. Límite de peticiones
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "desconocida";
  if (!dentroDelLimite(ip, ahora)) {
    return responder(res, 429, { error: "Demasiadas peticiones" }, { "Retry-After": "60" });
  }

  // 5. Contenido
  let cuerpo = req.body;
  if (typeof cuerpo === "string") {
    if (Buffer.byteLength(cuerpo, "utf8") > LIMITE_BYTES) return responder(res, 413, { error: "Resumen demasiado grande" });
    try { cuerpo = JSON.parse(cuerpo); } catch (e) { return responder(res, 400, { error: "JSON no válido" }); }
  } else if (Buffer.byteLength(JSON.stringify(cuerpo || {}), "utf8") > LIMITE_BYTES) {
    return responder(res, 413, { error: "Resumen demasiado grande" });
  }
  const v = validar(cuerpo);
  if (v.error) return responder(res, 400, { error: v.error });
  const d = v.datos;

  // 6. Envío con Resend. La clave de idempotencia evita duplicados si la app reintenta
  //    (mismo contenido = mismo email; contenido nuevo = clave nueva).
  const texto = cuerpoEmail(d);
  const huella = crypto.createHash("sha256").update(texto).digest("hex").slice(0, 16);
  const asunto = unaLinea("[NorteIA] " + d.nombre_cliente + " · " + d.fecha_local + " · " + d.tipo_envio).slice(0, 250);
  let r;
  try {
    r = await fetchFn(URL_RESEND, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
        "Idempotency-Key": "estimacion-" + d.auditoria_id + "-" + d.revision + "-" + huella
      },
      body: JSON.stringify({ from: env.EMAIL_REMITENTE, to: lista(env.EMAIL_DESTINO), subject: asunto, text: texto })
    });
  } catch (e) {
    return responder(res, 503, { error: "No se pudo contactar con el servicio de email" });
  }
  if (r.status >= 200 && r.status < 300) {
    let id = null;
    try { id = (await r.json()).id || null; } catch (e) { /* sin cuerpo */ }
    return responder(res, 200, { ok: true, id: id });
  }
  let detalle = "";
  try { const j = await r.json(); detalle = unaLinea(j && (j.message || j.name)).slice(0, 160); } catch (e) { /* nada */ }
  if (r.status === 429) {
    return responder(res, 429, { error: "Límite del servicio de email" + (detalle ? ": " + detalle : "") }, { "Retry-After": r.headers && r.headers.get ? (r.headers.get("retry-after") || "60") : "60" });
  }
  if (r.status >= 500) return responder(res, 502, { error: "Servicio de email no disponible" });
  // 4xx de Resend (dominio sin verificar, remitente no válido…): es configuración, no se reintenta
  return responder(res, 400, { error: "Servicio de email: " + (detalle || "HTTP " + r.status) });
}

module.exports = handler;
module.exports.handler = handler;
module.exports._interno = { validar, cuerpoEmail, ventanas };
