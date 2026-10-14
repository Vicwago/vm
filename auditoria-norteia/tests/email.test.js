// Pruebas de la cola de email con MOCKS (fetch, reloj y almacenamiento falsos).
// Esto NO comprueba la recepción real en las bandejas: eso se verifica a mano (README, sección 17 y 23).
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargarTodo, crearStorage } = require("./cargar");

const RESPUESTAS = {
  tipo: "dental", llamadas: 25, minLlamada: 3, mensajes: 20, minMensaje: 2, gestiones: 10, minGestion: 2,
  personas: 2, repetidas: "muchas", perdidas: "a_veces", software: "si", interes: "mucho", percepcion: "2-4",
  noShows: null, fueraHorario: null
};

function resp(status, texto, cabeceras) {
  return { status, text: async () => texto || "", headers: { get: (k) => (cabeceras || {})[k] || null } };
}

function entorno(opciones) {
  const o = opciones || {};
  const ctx = cargarTodo({ localStorage: o.storage || crearStorage() });
  Object.assign(ctx.CONFIG.email, {
    habilitado: true,
    serviceId: "service_abc123",
    publicKey: "pk_publica_123",
    destinatarios: [
      { id: "victor", nombre: "Victor", templateId: "template_v1" },
      { id: "luis", nombre: "Luis", templateId: "template_l1" }
    ]
  }, o.email || {});
  const e = {
    ctx, M: ctx.MotorNorteIA, A: ctx.AlmacenNorteIA, CL: ctx.NICHOS.clinicas,
    reloj: Date.parse("2026-10-14T08:00:00Z"),
    llamadas: [], esperas: [], programados: [], timeouts: [],
    responder: () => resp(200, "OK")
  };
  e.E = ctx.crearEmailNorteIA({
    almacen: e.A,
    ahora: () => e.reloj,
    esperar: (ms) => { e.esperas.push(ms); e.reloj += ms; return Promise.resolve(); },
    programar: (fn, ms) => { e.programados.push({ fn, en: e.reloj + ms }); return e.programados.length; },
    cancelarProgramado: () => {},
    temporizador: (fn) => { e.timeouts.push(fn); return e.timeouts.length; },
    cancelarTemporizador: () => {},
    aleatorio: () => 0,
    locks: o.locks || null,
    fetch: (url, init) => {
      const body = JSON.parse(init.body);
      e.llamadas.push({ url, init, body, t: e.reloj });
      return Promise.resolve(e.responder(body, init));
    }
  });
  e.nuevo = (id, cambios) => {
    const params = e.M.parametrosEfectivos(ctx.CONFIG, e.CL);
    const respuestas = Object.assign({}, RESPUESTAS, cambios || {});
    const reg = {
      id, idCorto: "ID" + id.slice(-4), fecha: id, nicho: "clinicas", nombreCliente: "Clínica Prueba Ficticia",
      respuestas, calculo: e.M.calcular(e.CL, respuestas, params), parametros: params,
      contactoNorteIA: { enlaceCal: "https://cal.com/x", telefono: "+34 600" }
    };
    const existente = e.A.obtener(id);
    if (existente) reg.email = existente.email;
    const hay = e.E.prepararRegistro(reg, e.M.instantaneaEmail(e.CL, reg, ctx.CONFIG));
    e.A.guardarRegistro(reg);
    return hay;
  };
  e.reg = (id) => e.A.obtener(id);
  e.destino = (id, quien, rev) => {
    const revs = e.reg(id).email.revisiones;
    return revs[(rev || revs.length) - 1].destinos.find((x) => x.id === quien);
  };
  return e;
}

const ID = "2026-10-14T08:00:00.000Z";

test("envío inmediato a los dos destinatarios, espaciado y sin claves privadas", async () => {
  const e = entorno();
  e.nuevo(ID);
  await e.E.procesar();
  assert.equal(e.llamadas.length, 2);
  assert.equal(e.llamadas[0].url, "https://api.emailjs.com/api/v1.0/email/send");
  assert.equal(e.llamadas[0].init.method, "POST");
  assert.equal(e.llamadas[0].init.mode, undefined, "nunca no-cors");
  assert.deepEqual(e.llamadas.map((l) => l.body.template_id), ["template_v1", "template_l1"]);
  e.llamadas.forEach((l) => {
    assert.equal(l.body.service_id, "service_abc123");
    assert.equal(l.body.user_id, "pk_publica_123");
    assert.equal(l.body.accessToken, undefined);
    assert.equal(l.body.template_params.to_email, undefined, "la PWA no elige destinatario");
    assert.equal(l.body.template_params.tipo_envio, "INICIAL");
    assert.equal(l.body.template_params.revision, "1");
  });
  assert.ok(e.llamadas[1].t - e.llamadas[0].t >= 1500, "separación mínima de 1,5 s");
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: enviado (2/2)");
  assert.ok(e.destino(ID, "victor").aceptadoEn);
});

test("volver al resultado, doble toque o recarga no duplican el envío", async () => {
  const e = entorno();
  e.nuevo(ID);
  await e.E.procesar();
  assert.equal(e.nuevo(ID), false);
  assert.equal(e.nuevo(ID), false);
  await Promise.all([e.E.procesar(), e.E.procesar()]);
  assert.equal(e.llamadas.length, 2);
  assert.equal(e.reg(ID).email.revisiones.length, 1);
});

test("éxito de Victor y fallo de Luis: 1/2 y al reintentar solo sale Luis", async () => {
  const e = entorno();
  e.responder = (b) => (b.template_id === "template_l1" ? resp(503, "caído") : resp(200));
  e.nuevo(ID);
  await e.E.procesar();
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: pendiente (1/2 enviado)");
  const luis = e.destino(ID, "luis");
  assert.equal(luis.estado, "pendiente");
  assert.equal(Date.parse(luis.siguienteIntento) - e.reloj, 60000, "primer reintento a 1 minuto");
  e.responder = () => resp(200);
  e.reloj += 61000;
  await e.E.procesar();
  assert.equal(e.llamadas.length, 3);
  assert.equal(e.llamadas[2].body.template_id, "template_l1");
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: enviado (2/2)");
});

test("reintentos con pausas 1, 5, 15, 60, 360 y después cada 360 minutos", async () => {
  const e = entorno({ email: { destinatarios: [{ id: "victor", nombre: "Victor", templateId: "template_v1" }] } });
  e.responder = () => resp(500);
  e.nuevo(ID);
  const pausas = [];
  for (let i = 0; i < 7; i++) {
    await e.E.procesar();
    const d = e.destino(ID, "victor");
    pausas.push((Date.parse(d.siguienteIntento) - e.reloj) / 60000);
    e.reloj = Date.parse(d.siguienteIntento) + 1;
  }
  assert.deepEqual(pausas, [1, 5, 15, 60, 360, 360, 360]);
  assert.equal(e.destino(ID, "victor").estado, "pendiente", "nunca se descarta por número de intentos");
});

test("error 400/401/403: requiere revisión, sin bucle; tras corregir, reanuda conservando lo enviado", async () => {
  const e = entorno();
  e.responder = (b) => (b.template_id === "template_l1" ? resp(400, "The template ID is invalid") : resp(200));
  e.nuevo(ID);
  await e.E.procesar();
  await e.E.procesar();
  assert.equal(e.llamadas.length, 2);
  const luis = e.destino(ID, "luis");
  assert.equal(luis.estado, "requiere_revision");
  assert.match(luis.ultimoError, /HTTP 400: The template ID is invalid/);
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: pendiente · revisar configuración");
  e.responder = () => resp(200);
  await e.E.reintentarPendientes();
  assert.equal(e.llamadas.length, 3);
  assert.equal(e.llamadas[2].body.template_id, "template_l1");
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: enviado (2/2)");
});

test("sin red (o Wi-Fi sin salida): ningún falso enviado; al volver la conexión se adelanta", async () => {
  const e = entorno();
  e.responder = () => { throw new TypeError("Failed to fetch"); };
  e.nuevo(ID);
  await e.E.procesar();
  const v = e.destino(ID, "victor");
  assert.equal(v.estado, "pendiente");
  assert.equal(v.tipoError, "red");
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: pendiente");
  e.responder = () => resp(200);
  await e.E.alRecuperarConexion();
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: enviado (2/2)");
});

test("timeout de 20 s: queda pendiente y se avisa del posible duplicado", async () => {
  const e = entorno({ email: { destinatarios: [{ id: "victor", nombre: "Victor", templateId: "template_v1" }] } });
  e.ctx.CONFIG.email.timeoutMs = 20000;
  let rechazar;
  e.responder = (b, init) => new Promise((_, rej) => { rechazar = rej; init.signal.addEventListener("abort", () => rej(new Error("abort"))); });
  e.nuevo(ID);
  const p = e.E.procesar();
  await new Promise((r) => setImmediate(r));
  assert.equal(e.destino(ID, "victor").estado, "enviando");
  e.timeouts[e.timeouts.length - 1]();
  await p;
  const v = e.destino(ID, "victor");
  assert.equal(v.estado, "pendiente");
  assert.match(v.ultimoError, /Tiempo de espera agotado \(20 s\).*duplicado/);
  assert.ok(rechazar);
});

test("configuración incompleta: no hay peticiones con placeholders y queda pendiente; al configurar se completa", async () => {
  const e = entorno({ email: { serviceId: "", destinatarios: [
    { id: "victor", nombre: "Victor", templateId: "" }, { id: "luis", nombre: "Luis", templateId: "template_xxxxxxx" }] } });
  e.nuevo(ID);
  await e.E.procesar();
  assert.equal(e.llamadas.length, 0);
  assert.equal(e.destino(ID, "victor").templateId, null);
  assert.equal(e.destino(ID, "luis").templateId, null, "un placeholder no cuenta como ruta");
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: pendiente · revisar configuración");
  assert.equal(e.E.estadoGeneral().configOk, false);
  Object.assign(e.ctx.CONFIG.email, { serviceId: "service_abc123", destinatarios: [
    { id: "victor", nombre: "Victor", templateId: "template_v1" }, { id: "luis", nombre: "Luis", templateId: "template_l1" }] });
  await e.E.procesar();
  assert.equal(e.llamadas.length, 2);
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: enviado (2/2)");
});

test("habilitado: false no crea cola: al activarlo no se envía lo de antes (A3)", async () => {
  const e = entorno({ email: { habilitado: false } });
  assert.equal(e.nuevo(ID), false);
  assert.equal(e.reg(ID).email, undefined);
  await e.E.procesar();
  assert.equal(e.llamadas.length, 0);
  assert.equal(e.E.contarPendientes().total, 0);
  e.ctx.CONFIG.email.habilitado = true;
  await e.E.procesar();
  assert.equal(e.llamadas.length, 0, "nada guardado con el email apagado sale al activarlo");
});

test("colas antiguas creadas con el email apagado se marcan como «no enviar» al iniciar (A3)", async () => {
  const e = entorno();
  e.nuevo(ID); // cola creada (como en versiones anteriores)
  e.ctx.CONFIG.email.habilitado = false;
  await e.E.iniciar();
  assert.equal(e.destino(ID, "victor").estado, "no_enviar");
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: no enviado (desactivado)");
  assert.equal(e.E.contarPendientes().total, 0);
  e.ctx.CONFIG.email.habilitado = true;
  await e.E.procesar();
  assert.equal(e.llamadas.length, 0);
});

test("una ruta ya asignada no se redirige en silencio si cambia la configuración", async () => {
  const e = entorno();
  e.responder = () => { throw new TypeError("offline"); };
  e.nuevo(ID);
  await e.E.procesar();
  e.ctx.CONFIG.email.destinatarios[1].templateId = "template_nuevo";
  e.responder = () => resp(200);
  await e.E.reintentarPendientes();
  assert.ok(e.llamadas.slice(-2).every((l) => l.body.template_id !== "template_nuevo"));
});

test("cuota mensual agotada: se detiene, no insiste y lo indica; Reintentar lo reanuda", async () => {
  const e = entorno();
  e.responder = () => resp(426, "The monthly quota limit has been reached. Please upgrade.");
  e.nuevo(ID);
  await e.E.procesar();
  await e.E.procesar();
  assert.equal(e.llamadas.length, 1, "no se sigue intentando con la cuota agotada");
  assert.equal(e.E.estadoGeneral().cuotaAgotada, true);
  assert.match(e.E.resumenRegistro(e.reg(ID)).texto, /Cuota de email agotada; resumen guardado/);
  e.responder = () => resp(200);
  await e.E.reintentarPendientes();
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: enviado (2/2)");
});

test("429 sin motivo: límite temporal que respeta Retry-After (no se trata como cuota)", async () => {
  const e = entorno({ email: { destinatarios: [{ id: "victor", nombre: "Victor", templateId: "template_v1" }] } });
  e.responder = () => resp(429, "Too many requests", { "Retry-After": "120" });
  e.nuevo(ID);
  await e.E.procesar();
  const v = e.destino(ID, "victor");
  assert.equal(v.estado, "pendiente");
  assert.equal(Date.parse(v.siguienteIntento) - e.reloj, 120000);
  assert.equal(e.E.estadoGeneral().cuotaAgotada, false);
});

test("cambios antes de enviar sustituyen la instantánea (sigue siendo INICIAL)", async () => {
  const e = entorno();
  e.nuevo(ID);
  assert.equal(e.nuevo(ID, { llamadas: 30 }), true);
  const revs = e.reg(ID).email.revisiones;
  assert.equal(revs.length, 1);
  assert.equal(revs[0].instantanea.tipo_envio, "INICIAL");
  assert.match(revs[0].instantanea.respuestas_texto, /Llamadas al día: 30/);
});

test("cambios tras un envío aceptado crean una revisión ACTUALIZACIÓN sin pisar la anterior", async () => {
  const e = entorno();
  e.responder = (b) => (b.template_id === "template_l1" ? resp(503) : resp(200));
  e.nuevo(ID);
  await e.E.procesar();
  assert.equal(e.nuevo(ID, { llamadas: 40 }), true);
  const revs = e.reg(ID).email.revisiones;
  assert.equal(revs.length, 2);
  assert.match(revs[0].instantanea.respuestas_texto, /Llamadas al día: 25/, "la revisión 1 queda inmutable");
  assert.equal(revs[1].instantanea.tipo_envio, "ACTUALIZACIÓN");
  assert.equal(revs[1].instantanea.revision, "2");
  e.responder = () => resp(200);
  e.reloj += 61000;
  await e.E.procesar();
  // Orden: primero Luis de la revisión 1, después la revisión 2 a los dos
  assert.deepEqual(e.llamadas.slice(2).map((l) => l.body.template_id + "#" + l.body.template_params.revision),
    ["template_l1#1", "template_v1#2", "template_l1#2"]);
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: enviado (2/2)");
  assert.equal(e.A.leer().length, 1, "un único registro en el historial");
});

test("un 'enviando' huérfano (cierre a mitad) vuelve a pendiente pasado plazo + 30 s", async () => {
  const e = entorno({ email: { destinatarios: [{ id: "victor", nombre: "Victor", templateId: "template_v1" }] } });
  e.nuevo(ID);
  const lista = e.A.leer();
  const d = lista[0].email.revisiones[0].destinos[0];
  d.estado = "enviando";
  d.intentos = 1;
  d.intentoIniciadoEn = new Date(e.reloj - 40000).toISOString();
  e.A.escribir(lista);
  await e.E.procesar();
  assert.equal(e.llamadas.length, 0, "aún dentro del plazo (20 s + 30 s)");
  e.reloj += 11000;
  await e.E.procesar();
  assert.equal(e.llamadas.length, 1);
  assert.equal(e.destino(ID, "victor").estado, "enviado");
});

test("otra pestaña con el bloqueo: esta no envía", async () => {
  const locks = { request: (nombre, op, fn) => Promise.resolve(fn(null)) };
  const e = entorno({ locks });
  e.nuevo(ID);
  await e.E.procesar();
  assert.equal(e.llamadas.length, 0);
  assert.equal(e.E.estadoGeneral().otraPestana, true);
});

test("sin Web Locks: solo la pestaña líder envía", async () => {
  const storage = crearStorage();
  const a = entorno({ storage });
  a.nuevo(ID);
  storage.setItem("norteia_email_lider_v1", JSON.stringify({ id: "otra", latido: a.reloj }));
  await a.E.procesar();
  assert.equal(a.llamadas.length, 0);
  assert.equal(a.E.estadoGeneral().otraPestana, true);
  a.reloj += 61000; // la otra pestaña dejó de dar señales
  await a.E.procesar();
  assert.equal(a.llamadas.length, 2);
});

test("borrar historial con un envío en curso: se aborta y no rompe nada", async () => {
  const e = entorno();
  e.responder = (b, init) => new Promise((_, rej) => init.signal.addEventListener("abort", () => rej(new Error("abort"))));
  e.nuevo(ID);
  const p = e.E.procesar();
  await new Promise((r) => setImmediate(r));
  e.E.cancelarTodo();
  e.A.borrarTodo();
  await p;
  assert.equal(e.A.leer().length, 0);
  assert.equal(e.llamadas.length, 1);
});

test("localStorage bloqueado: cola en memoria, envío online y aviso de no persistencia", async () => {
  const e = entorno({ storage: crearStorage({ falla: true }) });
  e.nuevo(ID);
  assert.equal(e.A.persistente(), false);
  await e.E.procesar();
  assert.equal(e.llamadas.length, 2);
  assert.equal(e.E.resumenRegistro(e.reg(ID)).texto, "Email: enviado (2/2)");
  assert.equal(e.E.estadoGeneral().persistente, false);
});

test("registros anteriores sin bloque email no se envían", async () => {
  const e = entorno();
  e.A.escribir([{ id: "viejo", fecha: "2026-01-01T00:00:00Z", nicho: "clinicas", respuestas: {}, calculo: {} }]);
  await e.E.procesar();
  assert.equal(e.llamadas.length, 0);
  assert.equal(e.E.resumenRegistro(e.reg("viejo")).texto, "Sin envío por email");
});

test("resumen demasiado grande (> 45 KB): no se trunca, queda con error visible", async () => {
  const e = entorno();
  e.nuevo(ID);
  const lista = e.A.leer();
  e.A.escribir(lista);
  const reg = e.reg(ID);
  const inst = Object.assign({}, reg.email.revisiones[0].instantanea, { respuestas_texto: "x".repeat(50 * 1024) });
  const reg2 = Object.assign({}, reg);
  e.E.prepararRegistro(reg2, inst);
  e.A.guardarRegistro(reg2);
  await e.E.procesar();
  assert.equal(e.llamadas.length, 0);
  assert.match(e.destino(ID, "victor").ultimoError, /demasiado grande/);
});

test("aviso de pendientes con más de 24 horas", async () => {
  const e = entorno();
  e.nuevo(ID);
  e.reloj += 25 * 3600 * 1000;
  const c = e.E.contarPendientes();
  assert.equal(c.total, 1);
  assert.equal(c.antiguos, 1);
});
