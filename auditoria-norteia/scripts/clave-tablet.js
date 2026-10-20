#!/usr/bin/env node
// Crea la clave de envío de una tablet nueva y la línea para la variable TABLETAS de Vercel.
// Uso: node scripts/clave-tablet.js <nombre>      p. ej. node scripts/clave-tablet.js cochet
// La clave se escribe una vez en la tablet (historial → Clave de envío); en Vercel solo va su huella.
"use strict";
const crypto = require("crypto");
const nombre = (process.argv[2] || "").trim();
if (!/^[a-z0-9_-]{2,30}$/i.test(nombre)) {
  console.error("Uso: node scripts/clave-tablet.js <nombre de la tablet>");
  process.exit(1);
}
const letras = "abcdefghjkmnpqrstuvwxyz23456789";
const grupos = [];
for (let g = 0; g < 5; g++) {
  let t = "";
  for (let i = 0; i < 4; i++) t += letras[crypto.randomInt(letras.length)];
  grupos.push(t);
}
const clave = grupos.join("-");
console.log("Clave para la tablet (escríbela en el historial → Clave de envío):");
console.log("  " + clave);
console.log("Entrada para TABLETAS en Vercel (añádela al JSON existente):");
console.log('  "' + nombre + '": "' + crypto.createHash("sha256").update(clave).digest("hex") + '"');
