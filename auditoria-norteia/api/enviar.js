/*
 * FUNCIÓN DE ENVÍO (Vercel serverless): POST /api/enviar
 *
 * Recibe el resumen de una visita desde la tablet y lo envía por email a NorteIA.
 * Envío con la API de Gmail de Google Workspace: una cuenta de servicio con delegación de dominio
 * (permiso único gmail.send) envía como victor@norteia.es usando su alias cuestionarios@norteia.es.
 * Las claves viven en las variables de entorno de Vercel, nunca en la web ni en el repositorio.
 *
 * Variables de entorno (Vercel → proyecto → Settings → Environment Variables):
 *   GOOGLE_SA_EMAIL       correo de la cuenta de servicio (…@….iam.gserviceaccount.com)
 *   GOOGLE_SA_KEY         clave privada del JSON de la cuenta de servicio (private_key)   [secreta]
 *   TABLETAS              claves de envío por tablet, como JSON {"nombre": "sha256 de la clave"}   [secreta]
 *                         Para revocar una tablet, se quita su entrada y se vuelve a desplegar.
 *   ORIGENES_PERMITIDOS   p. ej. "https://norteia-auditoria.vercel.app" (separados por comas)
 *   Opcionales: GMAIL_USUARIO (victor@norteia.es), GMAIL_REMITENTE, GMAIL_DESTINO (separados por comas)
 *
 * Transición: mientras no estén GOOGLE_SA_EMAIL y GOOGLE_SA_KEY, se sigue usando Resend
 * (RESEND_API_KEY, EMAIL_REMITENTE, EMAIL_DESTINO). Al confirmar que Gmail funciona, se borran.
 * La clave única antigua (CLAVE_DISPOSITIVO) solo se acepta si no existe TABLETAS.
 *
 * Respuestas: 200 aceptado · 400/401/403 configuración o petición no válida (la app no reintenta)
 *             429 demasiadas peticiones · 502/503 fallo temporal (la app reintenta)
 */
"use strict";

const crypto = require("crypto");
const C = require("./_comun");

const LIMITE_BYTES = 45 * 1024;
const POR_IP = C.crearLimitador(10, 60 * 1000);          // 10 por minuto e IP
const POR_TABLETA = C.crearLimitador(30, 60 * 60 * 1000); // 30 por hora y tablet

const GMAIL = {
  usuario: "victor@norteia.es",
  remitente: "NorteIA · Cuestionarios <cuestionarios@norteia.es>",
  destino: "victor@norteia.es, luis@norteia.es",
  permiso: "https://www.googleapis.com/auth/gmail.send"
};
const URL_TOKEN = "https://oauth2.googleapis.com/token";
const URL_GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const URL_RESEND = "https://api.resend.com/emails";

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
  observaciones: 1200,
  proximo_paso: 1000
};
const POR_DEFECTO = { contacto_texto: "No recogido", observaciones: "(sin observaciones)" }; // tablets con versiones anteriores

function unaLinea(t) {
  return String(t || "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

// Comprueba y limpia el contenido recibido. Devuelve { datos } o { error }.
function validar(cuerpo) {
  const datos = {};
  for (const campo of Object.keys(CAMPOS)) {
    const v = cuerpo[campo];
    if (v == null || v === "") {
      if (POR_DEFECTO[campo]) { datos[campo] = POR_DEFECTO[campo]; continue; }
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

function cuerpoEmail(d, tablet) {
  return [
    "ESTIMACIÓN RÁPIDA NORTEIA",
    d.tipo_envio,
    "ID: " + d.auditoria_id + " · Revisión: " + d.revision,
    "Fecha de visita: " + d.fecha_local + " (Europe/Madrid)",
    "Fecha original ISO: " + d.fecha_iso,
    "Sector: " + d.nicho_nombre,
    "Cliente: " + d.nombre_cliente,
    "Tablet: " + tablet,
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
    "OBSERVACIONES",
    d.observaciones,
    "",
    "PRÓXIMO PASO",
    d.proximo_paso,
    "",
    "Estimación orientativa basada en las respuestas, no un ahorro garantizado.",
    "El negocio aceptó enviar este resumen a NorteIA desde la app.",
    "Si hay varias revisiones del mismo ID, utilizar la de número más alto."
  ].join("\n");
}

// ---------- Tablets: una clave por tablet, revocable desde Vercel ----------

function tabletas(env) {
  if (env.TABLETAS) {
    try {
      const t = JSON.parse(env.TABLETAS);
      if (t && typeof t === "object" && !Array.isArray(t)) return t;
    } catch (e) { /* mal escrito: ninguna tablet válida */ }
    return {};
  }
  return env.CLAVE_DISPOSITIVO ? { tablet: C.sha256(env.CLAVE_DISPOSITIVO) } : {};
}

// Devuelve el nombre de la tablet cuya clave coincide, o null
function identificarTablet(clave, env) {
  if (!clave || String(clave).length < 8) return null;
  const huella = C.sha256(clave);
  const t = tabletas(env);
  let encontrada = null;
  Object.keys(t).forEach((nombre) => {
    if (C.igualSeguro(huella, String(t[nombre]).toLowerCase())) encontrada = nombre;
  });
  return encontrada;
}

// ---------- Gmail API con cuenta de servicio ----------

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Admite la clave tal cual, con "\n" escritos como texto, o el JSON entero pegado por error
function credencialesGoogle(env) {
  let correo = env.GOOGLE_SA_EMAIL || "";
  let clave = env.GOOGLE_SA_KEY || "";
  if (/^\s*\{/.test(clave)) {
    try { const j = JSON.parse(clave); clave = j.private_key || ""; correo = correo || j.client_email || ""; } catch (e) { clave = ""; }
  }
  clave = clave.replace(/\\n/g, "\n").trim();
  return correo && clave ? { correo, clave } : null;
}

let tokenCache = null; // { token, caduca, correo }

async function tokenGmail(cred, usuario, fetchFn, ahora, renovar) {
  if (!renovar && tokenCache && tokenCache.correo === cred.correo + "|" + usuario && tokenCache.caduca - 60000 > ahora) return { token: tokenCache.token };
  const iat = Math.floor(ahora / 1000);
  const cabecera = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const datos = b64url(JSON.stringify({ iss: cred.correo, scope: GMAIL.permiso, aud: URL_TOKEN, sub: usuario, iat, exp: iat + 3600 }));
  let firma;
  try {
    firma = b64url(crypto.createSign("RSA-SHA256").update(cabecera + "." + datos).sign(cred.clave));
  } catch (e) {
    return { status: 400, error: "Gmail: la clave privada GOOGLE_SA_KEY no es válida" };
  }
  let r;
  try {
    r = await fetchFn(URL_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + cabecera + "." + datos + "." + firma
    });
  } catch (e) {
    return { status: 503, error: "No se pudo contactar con Google" };
  }
  let j = {};
  try { j = await r.json(); } catch (e) { /* sin cuerpo */ }
  if (r.status >= 200 && r.status < 300 && j.access_token) {
    tokenCache = { token: j.access_token, caduca: ahora + (Number(j.expires_in) || 3600) * 1000, correo: cred.correo + "|" + usuario };
    return { token: j.access_token };
  }
  if (r.status >= 500) return { status: 502, error: "Google no disponible" };
  // unauthorized_client = falta autorizar el ID de cliente en la consola de administración
  return { status: 400, error: "Gmail: autorización rechazada (" + unaLinea(j.error || "HTTP " + r.status) + (j.error_description ? ": " + unaLinea(j.error_description).slice(0, 120) : "") + ")" };
}

// Codifica una cabecera con caracteres no ASCII (RFC 2047)
function cabeceraTexto(t) {
  return /^[\x20-\x7e]*$/.test(t) ? t : "=?UTF-8?B?" + Buffer.from(t, "utf8").toString("base64") + "?=";
}

function direccion(t) {
  const m = /^\s*(.*?)\s*<([^<>\s]+@[^<>\s]+)>\s*$/.exec(t);
  if (!m) return unaLinea(t);
  return (m[1] ? cabeceraTexto(unaLinea(m[1].replace(/"/g, ""))) + " " : "") + "<" + m[2] + ">";
}

function mensajeMime({ de, para, asunto, texto, idMensaje, fecha }) {
  const cuerpo = Buffer.from(texto, "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n");
  return [
    "From: " + direccion(de),
    "To: " + para.map(direccion).join(", "),
    "Subject: " + cabeceraTexto(asunto),
    "Date: " + new Date(fecha).toUTCString().replace("GMT", "+0000"),
    "Message-ID: <" + idMensaje + ">",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    cuerpo
  ].join("\r\n");
}

async function enviarGmail(env, correo, fetchFn, ahora) {
  const cred = credencialesGoogle(env);
  const usuario = env.GMAIL_USUARIO || GMAIL.usuario;
  const raw = b64url(mensajeMime({
    de: env.GMAIL_REMITENTE || GMAIL.remitente,
    para: C.lista(env.GMAIL_DESTINO || GMAIL.destino),
    asunto: correo.asunto, texto: correo.texto, idMensaje: correo.idMensaje + "@norteia.es", fecha: ahora
  }));
  for (let intento = 0; intento < 2; intento++) {
    const t = await tokenGmail(cred, usuario, fetchFn, ahora, intento > 0);
    if (t.error) return t;
    let r;
    try {
      r = await fetchFn(URL_GMAIL, {
        method: "POST",
        headers: { Authorization: "Bearer " + t.token, "Content-Type": "application/json" },
        body: JSON.stringify({ raw })
      });
    } catch (e) {
      return { status: 503, error: "No se pudo contactar con Gmail" };
    }
    let j = {};
    try { j = await r.json(); } catch (e) { /* sin cuerpo */ }
    if (r.status >= 200 && r.status < 300) return { id: j.id || null };
    if (r.status === 401 && intento === 0) { tokenCache = null; continue; } // token caducado: se renueva una vez
    const detalle = unaLinea(j.error && (j.error.message || j.error.status)).slice(0, 160);
    if (r.status === 429 || /rate ?limit/i.test(detalle)) return { status: 429, error: "Límite de Gmail" + (detalle ? ": " + detalle : "") };
    if (r.status >= 500) return { status: 502, error: "Gmail no disponible" };
    return { status: 400, error: "Gmail: " + (detalle || "HTTP " + r.status) };
  }
  return { status: 502, error: "Gmail no disponible" };
}

// ---------- Resend (solo durante la transición) ----------

async function enviarResend(env, correo, fetchFn) {
  let r;
  try {
    r = await fetchFn(URL_RESEND, {
      method: "POST",
      headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json", "Idempotency-Key": correo.idMensaje },
      body: JSON.stringify({ from: env.EMAIL_REMITENTE, to: C.lista(env.EMAIL_DESTINO), subject: correo.asunto, text: correo.texto })
    });
  } catch (e) {
    return { status: 503, error: "No se pudo contactar con el servicio de email" };
  }
  let j = {};
  try { j = await r.json(); } catch (e) { /* sin cuerpo */ }
  if (r.status >= 200 && r.status < 300) return { id: j.id || null };
  const detalle = unaLinea(j && (j.message || j.name)).slice(0, 160);
  if (r.status === 429) return { status: 429, error: "Límite del servicio de email" + (detalle ? ": " + detalle : "") };
  if (r.status >= 500) return { status: 502, error: "Servicio de email no disponible" };
  return { status: 400, error: "Servicio de email: " + (detalle || "HTTP " + r.status) };
}

function proveedor(env) {
  if (credencialesGoogle(env)) return "gmail";
  if (env.RESEND_API_KEY && env.EMAIL_REMITENTE && C.lista(env.EMAIL_DESTINO).length) return "resend";
  return null;
}

async function handler(req, res, opciones) {
  const o = opciones || {};
  const env = o.env || process.env;
  const fetchFn = o.fetch || globalThis.fetch;
  const ahora = (o.ahora || Date.now)();

  if (C.origenRechazado(req, env)) return C.responder(res, 403, { error: "Origen no permitido" });
  if (req.method !== "POST") return C.responder(res, 405, { error: "Solo POST" }, { Allow: "POST" });

  const via = proveedor(env);
  if (!via || !Object.keys(tabletas(env)).length) return C.responder(res, 400, { error: "Envío sin configurar en el servidor" });

  // Clave de la tablet (no está en el código de la web; cada tablet tiene la suya)
  const tablet = identificarTablet(req.headers["x-clave-dispositivo"], env);
  if (!tablet) return C.responder(res, 401, { error: "Clave de envío de la tablet incorrecta o ausente" });

  if (!POR_IP.permitir(C.ipDe(req), ahora)) return C.responder(res, 429, { error: "Demasiadas peticiones" }, { "Retry-After": "60" });
  if (!POR_TABLETA.permitir(tablet, ahora)) return C.responder(res, 429, { error: "Demasiados envíos desde esta tablet en la última hora" }, { "Retry-After": "600" });

  const leido = C.leerCuerpo(req, LIMITE_BYTES);
  if (leido.error) return C.responder(res, leido.status, { error: leido.status === 413 ? "Resumen demasiado grande" : leido.error });
  const v = validar(leido.cuerpo);
  if (v.error) return C.responder(res, 400, { error: v.error });
  const d = v.datos;

  // Mismo contenido = mismo identificador: evita duplicados si la app reintenta
  const texto = cuerpoEmail(d, tablet);
  const huella = crypto.createHash("sha256").update(texto).digest("hex").slice(0, 16);
  const correo = {
    texto,
    asunto: unaLinea("[NorteIA] " + d.nombre_cliente + " · " + d.fecha_local + " · " + d.tipo_envio).slice(0, 250),
    idMensaje: "estimacion-" + d.auditoria_id + "-" + d.revision + "-" + huella
  };
  const r = via === "gmail" ? await enviarGmail(env, correo, fetchFn, ahora) : await enviarResend(env, correo, fetchFn);
  if (r.error) return C.responder(res, r.status, { error: r.error }, r.status === 429 ? { "Retry-After": "60" } : undefined);
  return C.responder(res, 200, { ok: true, id: r.id, via });
}

module.exports = handler;
module.exports.handler = handler;
module.exports._interno = {
  validar, cuerpoEmail, mensajeMime, identificarTablet, credencialesGoogle,
  ventanas: POR_IP.ventanas, ventanasTablet: POR_TABLETA.ventanas,
  reiniciar() { POR_IP.ventanas.clear(); POR_TABLETA.ventanas.clear(); tokenCache = null; }
};
