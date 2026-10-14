// Pruebas de la función del servidor /api/enviar con un Resend simulado (no se envía nada real).
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/enviar.js");

const ENV = {
  RESEND_API_KEY: "re_prueba",
  CLAVE_DISPOSITIVO: "clave-tablet-1234",
  EMAIL_REMITENTE: "NorteIA · Estimaciones <estimaciones@norteia.es>",
  EMAIL_DESTINO: "victor@norteia.es, luis@norteia.es",
  ORIGENES_PERMITIDOS: "https://norteia-auditoria.vercel.app"
};

const CUERPO = {
  destino: "equipo", auditoria_id: "K7F3Q2", revision: "1", tipo_envio: "INICIAL",
  fecha_local: "14/10/2026 10:42", fecha_iso: "2026-10-14T08:42:00.000Z", nicho_nombre: "Clínicas",
  nombre_cliente: "Clínica Ficticia\r\nBcc: x@y.z", respuestas_texto: "1. Tipo de clínica: Dental",
  calculo_texto: "Horas al año: 540 h", interes_texto: "Mucho (variante A)", contacto_texto: "No recogido",
  proximo_paso: "Ofrecer cita"
};

function llamar(opciones) {
  const o = Object.assign({ method: "POST", headers: {}, body: CUERPO, env: ENV, resend: { status: 200, json: { id: "em_1" } } }, opciones);
  const peticiones = [];
  const req = { method: o.method, body: o.body, headers: Object.assign({
    origin: "https://norteia-auditoria.vercel.app", "x-clave-dispositivo": "clave-tablet-1234", "x-forwarded-for": o.ip || "1.2.3.4"
  }, o.headers) };
  const res = { statusCode: 0, cabeceras: {}, cuerpo: null,
    setHeader(k, v) { this.cabeceras[k.toLowerCase()] = v; }, end(t) { this.cuerpo = JSON.parse(t); } };
  const fetch = async (url, init) => {
    peticiones.push({ url, init, body: JSON.parse(init.body) });
    if (o.resend === "red") throw new Error("ECONNRESET");
    return { status: o.resend.status, json: async () => o.resend.json || {}, headers: { get: () => null } };
  };
  return handler(req, res, { env: o.env, fetch }).then(() => ({ res, peticiones }));
}

test("envía con Resend a los correos configurados, sin cabeceras inyectables y con idempotencia", async () => {
  handler._interno.ventanas.clear();
  const { res, peticiones } = await llamar();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.cuerpo, { ok: true, id: "em_1" });
  assert.equal(peticiones.length, 1);
  const p = peticiones[0];
  assert.equal(p.url, "https://api.resend.com/emails");
  assert.equal(p.init.headers.Authorization, "Bearer re_prueba");
  assert.match(p.init.headers["Idempotency-Key"], /^estimacion-K7F3Q2-1-[0-9a-f]{16}$/);
  assert.deepEqual(p.body.to, ["victor@norteia.es", "luis@norteia.es"]);
  assert.equal(p.body.from, ENV.EMAIL_REMITENTE);
  assert.ok(!/[\r\n]/.test(p.body.subject), "el asunto no admite saltos de línea");
  assert.match(p.body.subject, /^\[NorteIA\] Clínica Ficticia Bcc: x@y\.z · 14\/10\/2026 10:42 · INICIAL$/);
  assert.match(p.body.text, /RESPUESTAS\n1\. Tipo de clínica: Dental/);
});

test("mismo contenido = misma clave de idempotencia; contenido nuevo = clave nueva", async () => {
  handler._interno.ventanas.clear();
  const a = await llamar();
  const b = await llamar();
  const c = await llamar({ body: Object.assign({}, CUERPO, { calculo_texto: "Horas al año: 600 h" }) });
  assert.equal(a.peticiones[0].init.headers["Idempotency-Key"], b.peticiones[0].init.headers["Idempotency-Key"]);
  assert.notEqual(a.peticiones[0].init.headers["Idempotency-Key"], c.peticiones[0].init.headers["Idempotency-Key"]);
});

test("rechaza sin llamar a Resend: clave ausente o incorrecta (401), otro origen (403), método (405)", async () => {
  handler._interno.ventanas.clear();
  for (const [opc, estado] of [
    [{ headers: { "x-clave-dispositivo": "" } }, 401],
    [{ headers: { "x-clave-dispositivo": "otra-clave-xx" } }, 401],
    [{ headers: { origin: "https://malo.example" } }, 403],
    [{ method: "GET" }, 405]
  ]) {
    const { res, peticiones } = await llamar(opc);
    assert.equal(res.statusCode, estado);
    assert.equal(peticiones.length, 0);
  }
});

test("sin configurar en Vercel: 400 claro (la app no reintenta en bucle)", async () => {
  const { res, peticiones } = await llamar({ env: Object.assign({}, ENV, { RESEND_API_KEY: "" }) });
  assert.equal(res.statusCode, 400);
  assert.equal(res.cuerpo.error, "Envío sin configurar en el servidor");
  assert.equal(peticiones.length, 0);
});

test("valida el contenido: campos que faltan, tipos y tamaño", async () => {
  handler._interno.ventanas.clear();
  const falta = Object.assign({}, CUERPO); delete falta.respuestas_texto;
  assert.equal((await llamar({ body: falta })).res.statusCode, 400);
  assert.equal((await llamar({ body: Object.assign({}, CUERPO, { revision: 2 }) })).res.statusCode, 400);
  assert.equal((await llamar({ body: Object.assign({}, CUERPO, { auditoria_id: "<script>" }) })).res.statusCode, 400);
  assert.equal((await llamar({ body: Object.assign({}, CUERPO, { respuestas_texto: "x".repeat(50 * 1024) }) })).res.statusCode, 413);
  assert.equal((await llamar({ body: "{no es json" })).res.statusCode, 400);
});

test("límite de 10 peticiones por minuto e IP", async () => {
  handler._interno.ventanas.clear();
  let ultimo;
  for (let i = 0; i < 11; i++) ultimo = await llamar({ ip: "9.9.9.9" });
  assert.equal(ultimo.res.statusCode, 429);
  assert.equal(ultimo.res.cabeceras["retry-after"], "60");
  assert.equal((await llamar({ ip: "8.8.8.8" })).res.statusCode, 200, "otra IP no se ve afectada");
});

test("errores de Resend: 4xx = configuración (400), 5xx o red = temporal (502/503), cuota = 429", async () => {
  handler._interno.ventanas.clear();
  const dominio = await llamar({ resend: { status: 403, json: { message: "The norteia.es domain is not verified" } } });
  assert.equal(dominio.res.statusCode, 400);
  assert.match(dominio.res.cuerpo.error, /domain is not verified/);
  assert.equal((await llamar({ resend: { status: 500 } })).res.statusCode, 502);
  assert.equal((await llamar({ resend: "red" })).res.statusCode, 503);
  const cuota = await llamar({ resend: { status: 429, json: { name: "daily_quota_exceeded", message: "You have reached your daily email sending quota." } } });
  assert.equal(cuota.res.statusCode, 429);
  assert.match(cuota.res.cuerpo.error, /quota/);
});
