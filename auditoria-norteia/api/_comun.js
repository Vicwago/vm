/*
 * Utilidades compartidas por las funciones de /api (el guion bajo evita que Vercel la publique como ruta).
 */
"use strict";

const crypto = require("crypto");

function responder(res, status, datos, cabeceras) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  Object.keys(cabeceras || {}).forEach((k) => res.setHeader(k, cabeceras[k]));
  res.end(JSON.stringify(datos));
}

function lista(valor) {
  return String(valor || "").split(",").map((s) => s.trim()).filter(Boolean);
}

// Comparación en tiempo constante (no revela cuántos caracteres coinciden)
function igualSeguro(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

function sha256(texto) {
  return crypto.createHash("sha256").update(String(texto)).digest("hex");
}

function ipDe(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "desconocida";
}

// Solo la propia web de la app (si ORIGENES_PERMITIDOS está configurado)
function origenRechazado(req, env) {
  const permitidos = lista(env.ORIGENES_PERMITIDOS);
  const origen = req.headers.origin || "";
  return permitidos.length > 0 && origen !== "" && permitidos.indexOf(origen) < 0;
}

// Lee el cuerpo JSON con límite de tamaño. Devuelve { cuerpo } o { status, error }.
function leerCuerpo(req, limiteBytes) {
  let cuerpo = req.body;
  if (typeof cuerpo === "string") {
    if (Buffer.byteLength(cuerpo, "utf8") > limiteBytes) return { status: 413, error: "Petición demasiado grande" };
    try { cuerpo = JSON.parse(cuerpo); } catch (e) { return { status: 400, error: "JSON no válido" }; }
  } else if (Buffer.byteLength(JSON.stringify(cuerpo || {}), "utf8") > limiteBytes) {
    return { status: 413, error: "Petición demasiado grande" };
  }
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) return { status: 400, error: "Cuerpo no válido" };
  return { cuerpo };
}

// Límite de peticiones en memoria por clave (IP, tablet…). Orientativo: cada instancia lleva su cuenta.
function crearLimitador(maximo, ventanaMs) {
  const ventanas = new Map();
  return {
    ventanas,
    permitir(clave, ahora) {
      const l = (ventanas.get(clave) || []).filter((t) => ahora - t < ventanaMs);
      if (l.length >= maximo) { ventanas.set(clave, l); return false; }
      l.push(ahora);
      ventanas.set(clave, l);
      if (ventanas.size > 5000) ventanas.clear();
      return true;
    }
  };
}

module.exports = { responder, lista, igualSeguro, sha256, ipDe, origenRechazado, leerCuerpo, crearLimitador };
