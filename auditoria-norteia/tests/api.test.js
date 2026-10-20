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
  handler._interno.reiniciar();
  const { res, peticiones } = await llamar();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.cuerpo, { ok: true, id: "em_1", via: "resend" });
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
  handler._interno.reiniciar();
  const a = await llamar();
  const b = await llamar();
  const c = await llamar({ body: Object.assign({}, CUERPO, { calculo_texto: "Horas al año: 600 h" }) });
  assert.equal(a.peticiones[0].init.headers["Idempotency-Key"], b.peticiones[0].init.headers["Idempotency-Key"]);
  assert.notEqual(a.peticiones[0].init.headers["Idempotency-Key"], c.peticiones[0].init.headers["Idempotency-Key"]);
});

test("rechaza sin llamar a Resend: clave ausente o incorrecta (401), otro origen (403), método (405)", async () => {
  handler._interno.reiniciar();
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
  handler._interno.reiniciar();
  const falta = Object.assign({}, CUERPO); delete falta.respuestas_texto;
  assert.equal((await llamar({ body: falta })).res.statusCode, 400);
  assert.equal((await llamar({ body: Object.assign({}, CUERPO, { revision: 2 }) })).res.statusCode, 400);
  assert.equal((await llamar({ body: Object.assign({}, CUERPO, { auditoria_id: "<script>" }) })).res.statusCode, 400);
  assert.equal((await llamar({ body: Object.assign({}, CUERPO, { respuestas_texto: "x".repeat(50 * 1024) }) })).res.statusCode, 413);
  assert.equal((await llamar({ body: "{no es json" })).res.statusCode, 400);
});

test("límite de 10 peticiones por minuto e IP", async () => {
  handler._interno.reiniciar();
  let ultimo;
  for (let i = 0; i < 11; i++) ultimo = await llamar({ ip: "9.9.9.9" });
  assert.equal(ultimo.res.statusCode, 429);
  assert.equal(ultimo.res.cabeceras["retry-after"], "60");
  assert.equal((await llamar({ ip: "8.8.8.8" })).res.statusCode, 200, "otra IP no se ve afectada");
});

test("errores de Resend: 4xx = configuración (400), 5xx o red = temporal (502/503), cuota = 429", async () => {
  handler._interno.reiniciar();
  const dominio = await llamar({ resend: { status: 403, json: { message: "The norteia.es domain is not verified" } } });
  assert.equal(dominio.res.statusCode, 400);
  assert.match(dominio.res.cuerpo.error, /domain is not verified/);
  assert.equal((await llamar({ resend: { status: 500 } })).res.statusCode, 502);
  assert.equal((await llamar({ resend: "red" })).res.statusCode, 503);
  const cuota = await llamar({ resend: { status: 429, json: { name: "daily_quota_exceeded", message: "You have reached your daily email sending quota." } } });
  assert.equal(cuota.res.statusCode, 429);
  assert.match(cuota.res.cuerpo.error, /quota/);
});

test("observaciones: bloque propio en el email; si una tablet antigua no las manda, «(sin observaciones)»", async () => {
  handler._interno.reiniciar();
  const con = await llamar({ body: Object.assign({}, CUERPO, { observaciones: "Llamar el lunes.\nTienen 2 recepcionistas." }) });
  assert.equal(con.res.statusCode, 200);
  assert.match(con.peticiones[0].body.text, /OBSERVACIONES\nLlamar el lunes\.\nTienen 2 recepcionistas\.\n/);
  const sin = await llamar();
  assert.match(sin.peticiones[0].body.text, /OBSERVACIONES\n\(sin observaciones\)\n/);
  const largo = await llamar({ body: Object.assign({}, CUERPO, { observaciones: "x".repeat(1300) }) });
  assert.equal(largo.res.statusCode, 400);
});

// ---------- Gmail API con cuenta de servicio ----------
const crypto = require("crypto");
const PAR = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const CLAVE_PEM = PAR.privateKey.export({ type: "pkcs8", format: "pem" });
const ENV_GMAIL = {
  GOOGLE_SA_EMAIL: "app@norteia-cuestionarios.iam.gserviceaccount.com",
  GOOGLE_SA_KEY: CLAVE_PEM.replace(/\n/g, "\\n"), // como se pega en Vercel: \n escritos como texto
  TABLETAS: JSON.stringify({ cochet: crypto.createHash("sha256").update("clave-cochet-123").digest("hex"),
    prueba: crypto.createHash("sha256").update("clave-prueba-456").digest("hex") }),
  ORIGENES_PERMITIDOS: "https://norteia-auditoria.vercel.app"
};

function llamarGmail(opciones) {
  const o = Object.assign({ body: Object.assign({}, CUERPO, { observaciones: "Llamar el lunes" }), clave: "clave-cochet-123",
    token: { status: 200, json: { access_token: "ya29.prueba", expires_in: 3599 } }, envio: [{ status: 200, json: { id: "msg_1" } }] }, opciones);
  const peticiones = [];
  let n = 0;
  const req = { method: "POST", body: o.body, headers: { origin: "https://norteia-auditoria.vercel.app", "x-clave-dispositivo": o.clave, "x-forwarded-for": o.ip || "5.6.7.8" } };
  const res = { statusCode: 0, cabeceras: {}, cuerpo: null, setHeader(k, v) { this.cabeceras[k.toLowerCase()] = v; }, end(t) { this.cuerpo = JSON.parse(t); } };
  const fetch = async (url, init) => {
    peticiones.push({ url, init });
    if (url.includes("oauth2")) return { status: o.token.status, json: async () => o.token.json };
    const r = o.envio[Math.min(n++, o.envio.length - 1)];
    if (r === "red") throw new Error("ECONNRESET");
    return { status: r.status, json: async () => r.json || {} };
  };
  return handler(req, res, { env: Object.assign({}, ENV_GMAIL, o.env || {}), fetch, ahora: () => 1792500000000 }).then(() => ({ res, peticiones }));
}

function decodificar(b64) { return Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); }

test("Gmail: JWT firmado con sub victor@norteia.es y solo gmail.send; MIME desde cuestionarios@ a Víctor y Luis", async () => {
  handler._interno.reiniciar();
  const { res, peticiones } = await llamarGmail();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.cuerpo, { ok: true, id: "msg_1", via: "gmail" });
  assert.equal(peticiones.length, 2);
  const form = new URLSearchParams(peticiones[0].init.body);
  assert.equal(form.get("grant_type"), "urn:ietf:params:oauth:grant-type:jwt-bearer");
  const [cab, datos, firma] = form.get("assertion").split(".");
  assert.ok(crypto.createVerify("RSA-SHA256").update(cab + "." + datos).verify(PAR.publicKey, Buffer.from(firma.replace(/-/g, "+").replace(/_/g, "/"), "base64")), "firma RS256 válida");
  const claims = JSON.parse(decodificar(datos));
  assert.equal(claims.iss, ENV_GMAIL.GOOGLE_SA_EMAIL);
  assert.equal(claims.sub, "victor@norteia.es");
  assert.equal(claims.scope, "https://www.googleapis.com/auth/gmail.send");
  assert.equal(claims.aud, "https://oauth2.googleapis.com/token");
  assert.equal(claims.exp - claims.iat, 3600);
  assert.equal(peticiones[1].url, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
  assert.equal(peticiones[1].init.headers.Authorization, "Bearer ya29.prueba");
  const mime = decodificar(JSON.parse(peticiones[1].init.body).raw);
  const [cabeceras, cuerpo] = mime.split("\r\n\r\n");
  assert.match(cabeceras, /^From: =\?UTF-8\?B\?[^?]+\?= <cuestionarios@norteia\.es>\r\n/);
  assert.match(cabeceras, /\r\nTo: victor@norteia\.es, luis@norteia\.es\r\n/);
  assert.match(cabeceras, /\r\nMessage-ID: <estimacion-K7F3Q2-1-[0-9a-f]{16}@norteia\.es>\r\n/);
  assert.ok(!/Bcc:/i.test(cabeceras.split("\r\n").filter((l) => !l.startsWith("Subject:")).join("\n")), "sin cabeceras inyectadas");
  const asunto = /\r\nSubject: =\?UTF-8\?B\?([^?]+)\?=/.exec(cabeceras)[1];
  assert.equal(Buffer.from(asunto, "base64").toString("utf8"), "[NorteIA] Clínica Ficticia Bcc: x@y.z · 14/10/2026 10:42 · INICIAL");
  const texto = Buffer.from(cuerpo.replace(/\r\n/g, ""), "base64").toString("utf8");
  assert.match(texto, /Tablet: cochet\n/);
  assert.match(texto, /OBSERVACIONES\nLlamar el lunes\n/);
});

test("Gmail: reutiliza el token y lo renueva una vez si caduca (401)", async () => {
  handler._interno.reiniciar();
  await llamarGmail();
  const b = await llamarGmail({ body: Object.assign({}, CUERPO, { revision: "2" }) });
  assert.equal(b.peticiones.length, 1, "token en caché: solo el envío");
  const c = await llamarGmail({ body: Object.assign({}, CUERPO, { revision: "3" }), envio: [{ status: 401 }, { status: 200, json: { id: "msg_3" } }] });
  assert.equal(c.res.statusCode, 200);
  assert.equal(c.peticiones.filter((p) => p.url.includes("oauth2")).length, 1, "renueva el token");
});

test("Gmail: errores de autorización = configuración (400); 429 y 5xx se reintentan", async () => {
  handler._interno.reiniciar();
  let r = await llamarGmail({ token: { status: 401, json: { error: "unauthorized_client", error_description: "Client is unauthorized to retrieve access tokens using this method" } } });
  assert.equal(r.res.statusCode, 400);
  assert.match(r.res.cuerpo.error, /^Gmail: autorización rechazada \(unauthorized_client/);
  handler._interno.reiniciar();
  r = await llamarGmail({ envio: [{ status: 400, json: { error: { message: "Invalid From header" } } }] });
  assert.deepEqual([r.res.statusCode, r.res.cuerpo.error], [400, "Gmail: Invalid From header"]);
  handler._interno.reiniciar();
  r = await llamarGmail({ envio: [{ status: 429, json: { error: { message: "Rate Limit Exceeded" } } }] });
  assert.equal(r.res.statusCode, 429);
  handler._interno.reiniciar();
  r = await llamarGmail({ envio: [{ status: 503 }] });
  assert.equal(r.res.statusCode, 502);
  handler._interno.reiniciar();
  r = await llamarGmail({ envio: ["red"] });
  assert.equal(r.res.statusCode, 503);
  handler._interno.reiniciar();
  r = await llamarGmail({ env: { GOOGLE_SA_KEY: "no es una clave" } });
  assert.deepEqual([r.res.statusCode, r.res.cuerpo.error], [400, "Gmail: la clave privada GOOGLE_SA_KEY no es válida"]);
});

test("Gmail: acepta el JSON entero de la cuenta de servicio pegado en GOOGLE_SA_KEY", async () => {
  handler._interno.reiniciar();
  const json = JSON.stringify({ type: "service_account", client_email: ENV_GMAIL.GOOGLE_SA_EMAIL, private_key: CLAVE_PEM });
  const r = await llamarGmail({ env: { GOOGLE_SA_EMAIL: "", GOOGLE_SA_KEY: json } });
  assert.equal(r.res.statusCode, 200);
});

test("tablets: cada una con su clave; una revocada o desconocida no envía; límite por tablet", async () => {
  handler._interno.reiniciar();
  let r = await llamarGmail({ clave: "clave-prueba-456" });
  assert.equal(r.res.statusCode, 200);
  r = await llamarGmail({ clave: "clave-que-no-existe" });
  assert.equal(r.res.statusCode, 401);
  assert.equal(r.peticiones.length, 0, "no llama a Google");
  // Revocar = quitar su entrada de TABLETAS
  r = await llamarGmail({ clave: "clave-prueba-456", env: { TABLETAS: JSON.stringify({ cochet: JSON.parse(ENV_GMAIL.TABLETAS).cochet }) } });
  assert.equal(r.res.statusCode, 401);
  // 30 por hora y tablet (con IPs distintas para no tocar el límite por IP)
  handler._interno.reiniciar();
  for (let i = 0; i < 30; i++) {
    r = await llamarGmail({ ip: "10.0.0." + i, body: Object.assign({}, CUERPO, { revision: String(i + 1) }) });
    assert.equal(r.res.statusCode, 200, "envío " + (i + 1));
  }
  r = await llamarGmail({ ip: "10.0.1.1", body: Object.assign({}, CUERPO, { revision: "99" }) });
  assert.equal(r.res.statusCode, 429);
  assert.match(r.res.cuerpo.error, /desde esta tablet/);
  // TABLETAS mal escrito: ninguna tablet vale
  handler._interno.reiniciar();
  r = await llamarGmail({ env: { TABLETAS: "{roto" } });
  assert.equal(r.res.statusCode, 400);
});

// ---------- /api/acceso: PIN del historial en el servidor ----------
const acceso = require("../api/acceso.js");
const HASH_PIN = acceso._interno.crearHuella("24681357", 20000);
const ENV_ACCESO = { ACCESO_PIN_HASH: HASH_PIN, ACCESO_SECRETO: "secreto-de-pruebas-largo-1234567890", ORIGENES_PERMITIDOS: "https://norteia-auditoria.vercel.app" };

function llamarAcceso(cuerpo, opciones) {
  const o = Object.assign({ ip: "9.9.9.9", ahora: 1792500000000, env: ENV_ACCESO }, opciones);
  const req = { method: o.method || "POST", body: cuerpo, headers: { origin: o.origin || "https://norteia-auditoria.vercel.app", "x-forwarded-for": o.ip } };
  const res = { statusCode: 0, cabeceras: {}, cuerpo: null, setHeader(k, v) { this.cabeceras[k.toLowerCase()] = v; }, end(t) { this.cuerpo = JSON.parse(t); } };
  return acceso(req, res, { env: o.env, ahora: () => o.ahora }).then(() => res);
}

test("acceso: PIN correcto = sesión firmada de 8 h; el token se valida y caduca", async () => {
  acceso._interno.reiniciar();
  const ok = await llamarAcceso({ pin: "24681357" });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.cuerpo.caduca, 1792500000000 + 8 * 3600 * 1000);
  assert.equal((await llamarAcceso({ token: ok.cuerpo.token })).statusCode, 200);
  assert.equal((await llamarAcceso({ token: ok.cuerpo.token }, { ahora: 1792500000000 + 8 * 3600 * 1000 + 1 })).statusCode, 401, "caducada");
  const [datos] = ok.cuerpo.token.split(".");
  assert.equal((await llamarAcceso({ token: datos + ".firmafalsa" })).statusCode, 401, "firma falsa");
  assert.equal((await llamarAcceso({ token: ok.cuerpo.token }, { env: Object.assign({}, ENV_ACCESO, { ACCESO_SECRETO: "otro-secreto-distinto-1234567890" }) })).statusCode, 401, "cambiar el secreto cierra las sesiones");
});

test("acceso: 5 fallos = bloqueo de 15 minutos; la huella no está en la respuesta", async () => {
  acceso._interno.reiniciar();
  const r1 = await llamarAcceso({ pin: "11111111" });
  assert.deepEqual([r1.statusCode, r1.cuerpo.intentosRestantes], [401, 4]);
  assert.ok(!JSON.stringify(r1.cuerpo).includes("pbkdf2"));
  for (let i = 0; i < 3; i++) await llamarAcceso({ pin: "11111111" });
  const r5 = await llamarAcceso({ pin: "11111111" });
  assert.equal(r5.statusCode, 429);
  const bloqueado = await llamarAcceso({ pin: "24681357" });
  assert.equal(bloqueado.statusCode, 429, "ni con el PIN correcto mientras dura el bloqueo");
  assert.equal(bloqueado.cabeceras["retry-after"] > 0, true);
  assert.equal((await llamarAcceso({ pin: "24681357" }, { ip: "8.8.8.8" })).statusCode, 200, "otra IP no está bloqueada");
  assert.equal((await llamarAcceso({ pin: "24681357" }, { ahora: 1792500000000 + 15 * 60 * 1000 + 1 })).statusCode, 200, "pasados 15 min vuelve a dejar");
});

test("acceso: sin configurar, otro origen, método o formato no válidos", async () => {
  acceso._interno.reiniciar();
  assert.equal((await llamarAcceso({ pin: "24681357" }, { env: {} })).statusCode, 400);
  assert.equal((await llamarAcceso({ pin: "24681357" }, { origin: "https://malo.example" })).statusCode, 403);
  assert.equal((await llamarAcceso(null, { method: "GET" })).statusCode, 405);
  assert.equal((await llamarAcceso({ pin: "12ab" })).statusCode, 401);
  assert.equal(acceso._interno.comprobarPin("24681357", HASH_PIN), true);
  assert.equal(acceso._interno.comprobarPin("24681358", HASH_PIN), false);
});
