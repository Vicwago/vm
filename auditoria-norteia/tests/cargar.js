// Carga los scripts de la app en un contexto aislado de Node (sin navegador).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = path.join(__dirname, "..");

function crearStorage(opciones) {
  const datos = new Map();
  const o = opciones || {};
  return {
    datos,
    falla: !!o.falla,
    getItem(k) { if (this.falla) throw new Error("bloqueado"); return datos.has(k) ? datos.get(k) : null; },
    setItem(k, v) { if (this.falla) throw new Error("QuotaExceededError"); datos.set(k, String(v)); },
    removeItem(k) { if (this.falla) throw new Error("bloqueado"); datos.delete(k); }
  };
}

function cargar(archivos, extra) {
  const ctx = Object.assign({ console, Date, Math, JSON, Promise, Intl, TextEncoder, setTimeout, clearTimeout, AbortController }, extra || {});
  ctx.self = ctx;
  ctx.window = ctx;
  vm.createContext(ctx);
  archivos.forEach((a) => {
    const codigo = fs.readFileSync(path.join(RAIZ, a), "utf8");
    vm.runInContext(codigo, ctx, { filename: a });
  });
  return ctx;
}

function cargarTodo(extra) {
  const lista = cargar(["niches/index.js"], {}).NICHOS_LISTA;
  return cargar(["config.js", "niches/index.js"].concat(Array.from(lista, (id) => "niches/" + id + ".js"))
    .concat(["almacen.js", "motor.js", "email.js"]), Object.assign({ localStorage: crearStorage() }, extra || {}));
}

module.exports = { cargar, cargarTodo, crearStorage, RAIZ };
