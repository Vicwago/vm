/*
 * ACCESO AL HISTORIAL (Vercel serverless): POST /api/acceso
 *
 * El PIN del historial ya no está en la web: se comprueba aquí, contra una huella PBKDF2 guardada
 * solo en Vercel. Si es correcto, devuelve una sesión firmada que dura 8 horas.
 *   { "pin": "12345678" }  -> 200 { token, caduca } · 401 PIN incorrecto · 429 bloqueado 15 min
 *   { "token": "..." }     -> 200 { ok, caduca } si la sesión sigue siendo válida · 401 si no
 *
 * Variables de entorno:
 *   ACCESO_PIN_HASH   pbkdf2_sha256$<iteraciones>$<sal base64>$<huella base64>   [secreta]
 *                     Se genera con: node scripts/hash-pin.js <PIN nuevo>
 *   ACCESO_SECRETO    texto aleatorio largo para firmar las sesiones                [secreta]
 *                     Cambiarlo cierra todas las sesiones abiertas.
 *   ORIGENES_PERMITIDOS
 *
 * Bloqueo: 5 intentos fallidos desde una IP = 15 minutos sin poder probar (y un tope global por
 * instancia). Es orientativo: cada instancia del servidor lleva su propia cuenta.
 */
"use strict";

const crypto = require("crypto");
const C = require("./_comun");

const DURACION_SESION_MS = 8 * 60 * 60 * 1000;
const MAX_FALLOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const MAX_FALLOS_GLOBAL = 50;
const fallos = new Map(); // ip -> { n, desde, hasta }
let global = { n: 0, desde: 0 };

function huellaPin(pin, sal, iteraciones) {
  return crypto.pbkdf2Sync(String(pin), sal, iteraciones, 32, "sha256");
}

function crearHuella(pin, iteraciones) {
  const it = iteraciones || 310000;
  const sal = crypto.randomBytes(16);
  return "pbkdf2_sha256$" + it + "$" + sal.toString("base64") + "$" + huellaPin(pin, sal, it).toString("base64");
}

function comprobarPin(pin, guardada) {
  const p = String(guardada || "").split("$");
  if (p.length !== 4 || p[0] !== "pbkdf2_sha256") return false;
  const it = Number(p[1]);
  if (!(it >= 10000 && it <= 5000000)) return false;
  const esperada = Buffer.from(p[3], "base64");
  const calculada = huellaPin(pin, Buffer.from(p[2], "base64"), it);
  return esperada.length === calculada.length && crypto.timingSafeEqual(esperada, calculada);
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function firmar(datos, secreto) {
  return b64url(crypto.createHmac("sha256", secreto).update(datos).digest());
}

function crearToken(secreto, ahora) {
  const datos = b64url(JSON.stringify({ v: 1, iat: ahora, exp: ahora + DURACION_SESION_MS }));
  return { token: datos + "." + firmar(datos, secreto), caduca: ahora + DURACION_SESION_MS };
}

function comprobarToken(token, secreto, ahora) {
  const partes = String(token || "").split(".");
  if (partes.length !== 2 || !C.igualSeguro(firmar(partes[0], secreto), partes[1])) return null;
  try {
    const d = JSON.parse(Buffer.from(partes[0].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return d && d.exp > ahora ? d.exp : null;
  } catch (e) { return null; }
}

function bloqueadoHasta(ip, ahora) {
  const f = fallos.get(ip);
  if (f && f.hasta > ahora) return f.hasta;
  if (global.n >= MAX_FALLOS_GLOBAL && ahora - global.desde < BLOQUEO_MS) return global.desde + BLOQUEO_MS;
  return 0;
}

function anotarFallo(ip, ahora) {
  let f = fallos.get(ip);
  if (!f || ahora - f.desde > BLOQUEO_MS) f = { n: 0, desde: ahora, hasta: 0 };
  f.n++;
  if (f.n >= MAX_FALLOS) f.hasta = ahora + BLOQUEO_MS;
  fallos.set(ip, f);
  if (fallos.size > 5000) fallos.clear();
  if (ahora - global.desde > BLOQUEO_MS) global = { n: 0, desde: ahora };
  global.n++;
  return Math.max(0, MAX_FALLOS - f.n);
}

async function handler(req, res, opciones) {
  const o = opciones || {};
  const env = o.env || process.env;
  const ahora = (o.ahora || Date.now)();

  if (C.origenRechazado(req, env)) return C.responder(res, 403, { error: "Origen no permitido" });
  if (req.method !== "POST") return C.responder(res, 405, { error: "Solo POST" }, { Allow: "POST" });
  if (!env.ACCESO_PIN_HASH || !env.ACCESO_SECRETO || env.ACCESO_SECRETO.length < 16) {
    return C.responder(res, 400, { error: "Acceso sin configurar en el servidor" });
  }
  const leido = C.leerCuerpo(req, 2048);
  if (leido.error) return C.responder(res, leido.status, { error: leido.error });
  const b = leido.cuerpo;

  // Renovar o comprobar una sesión ya abierta
  if (typeof b.token === "string") {
    const caduca = comprobarToken(b.token, env.ACCESO_SECRETO, ahora);
    return caduca ? C.responder(res, 200, { ok: true, caduca }) : C.responder(res, 401, { error: "Sesión caducada" });
  }

  const ip = C.ipDe(req);
  const hasta = bloqueadoHasta(ip, ahora);
  if (hasta) {
    const seg = Math.ceil((hasta - ahora) / 1000);
    return C.responder(res, 429, { error: "Demasiados intentos. Prueba de nuevo en " + Math.ceil(seg / 60) + " min.", reintentarEn: seg }, { "Retry-After": String(seg) });
  }
  const pin = typeof b.pin === "string" ? b.pin : "";
  if (!/^\d{4,12}$/.test(pin) || !comprobarPin(pin, env.ACCESO_PIN_HASH)) {
    const quedan = anotarFallo(ip, ahora);
    if (!quedan) return C.responder(res, 429, { error: "Demasiados intentos. Prueba de nuevo en 15 min.", reintentarEn: BLOQUEO_MS / 1000 }, { "Retry-After": String(BLOQUEO_MS / 1000) });
    return C.responder(res, 401, { error: "PIN incorrecto", intentosRestantes: quedan });
  }
  fallos.delete(ip);
  return C.responder(res, 200, crearToken(env.ACCESO_SECRETO, ahora));
}

module.exports = handler;
module.exports.handler = handler;
module.exports._interno = {
  crearHuella, comprobarPin, crearToken, comprobarToken,
  reiniciar() { fallos.clear(); global = { n: 0, desde: 0 }; }
};
