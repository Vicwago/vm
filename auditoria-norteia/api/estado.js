/*
 * ESTADO DEL ENVÍO (Vercel serverless): GET /api/estado
 *
 * Diagnóstico sin secretos: dice qué proveedor de email está activo y, con Gmail, si Google
 * acepta la cuenta de servicio (clave válida y delegación autorizada para gmail.send).
 * No envía nada ni devuelve claves, correos de destino ni tablets.
 */
"use strict";

const C = require("./_comun");
const enviar = require("./enviar.js");

const POR_IP = C.crearLimitador(5, 60 * 1000);

async function handler(req, res, opciones) {
  const o = opciones || {};
  const env = o.env || process.env;
  const ahora = (o.ahora || Date.now)();
  if (req.method !== "GET") return C.responder(res, 405, { error: "Solo GET" }, { Allow: "GET" });
  if (!POR_IP.permitir(C.ipDe(req), ahora)) return C.responder(res, 429, { error: "Demasiadas peticiones" }, { "Retry-After": "60" });

  const i = enviar._interno;
  const proveedor = i.proveedor(env);
  const datos = {
    proveedor: proveedor || "sin configurar",
    tablets: Object.keys(i.tabletas(env)).length,
    acceso: Boolean(env.ACCESO_PIN_HASH && env.ACCESO_SECRETO)
  };
  if (proveedor === "gmail") {
    const t = await i.probarGmail(env, o.fetch || globalThis.fetch, ahora);
    datos.gmail = t.error ? { autorizado: false, motivo: t.error } : { autorizado: true };
  }
  return C.responder(res, 200, datos);
}

module.exports = handler;
module.exports.handler = handler;
module.exports._interno = { reiniciar() { POR_IP.ventanas.clear(); } };
