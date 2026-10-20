#!/usr/bin/env node
// Genera la huella del PIN del historial para la variable ACCESO_PIN_HASH de Vercel.
// Uso: node scripts/hash-pin.js 12345678      (el PIN no se guarda en ningún sitio)
"use strict";
const { crearHuella } = require("../api/acceso.js")._interno;
const pin = process.argv[2] || "";
if (!/^\d{6,12}$/.test(pin)) {
  console.error("Uso: node scripts/hash-pin.js <PIN de 6 a 12 cifras>");
  process.exit(1);
}
console.log(crearHuella(pin));
