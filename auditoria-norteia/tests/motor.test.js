// Pruebas del motor: cálculo, redondeos, percepción, variantes, validación, resumen, CSV e instantánea de email.
// Ejecutar: node --test tests/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { cargarTodo, cargar, RAIZ } = require("./cargar");

const ctx = cargarTodo();
const M = ctx.MotorNorteIA;
const CL = ctx.NICHOS.clinicas;

const EJEMPLO = {
  tipo: "dental", llamadas: 25, minLlamada: 3, mensajes: 20, minMensaje: 2, gestiones: 10, minGestion: 2,
  personas: 2, repetidas: "muchas", perdidas: "a_veces", software: "si", interes: "mucho", percepcion: "2-4",
  noShows: null, fueraHorario: null
};

function registro(respuestas, extra) {
  const params = M.parametrosEfectivos(ctx.CONFIG, CL);
  const r = Object.assign({
    id: "2026-10-14T08:42:11.000Z", idCorto: "K7F3Q2", fecha: "2026-10-14T08:42:11.000Z", nicho: "clinicas",
    nombreCliente: "Clínica Dental Ejemplo", respuestas,
    preguntasMostradas: ["tipo", "llamadas", "minLlamada", "mensajes", "minMensaje", "gestiones", "minGestion", "personas",
      "repetidas", "perdidas", "software", "interes", "percepcion"],
    calculo: M.calcular(CL, respuestas, params), parametros: params,
    contactoNorteIA: { enlaceCal: ctx.CONFIG.enlaceCal, telefono: ctx.CONFIG.telefono }
  }, extra || {});
  return r;
}

const IDS = ["clinicas", "talleres", "gestorias", "peluquerias", "barberias", "spas", "veterinarias", "inmobiliarias", "restaurantes", "academias"];

test("los 10 nichos están completos, son válidos y visibles", () => {
  assert.deepEqual(Array.from(ctx.NICHOS_LISTA), IDS);
  assert.deepEqual(Array.from(ctx.CONFIG.nichosVisibles), IDS);
  IDS.forEach((id) => {
    const n = ctx.NICHOS[id];
    assert.equal(n.id, id);
    assert.equal(n.completo, true, id + " completo");
    assert.deepEqual(Array.from(M.validarNicho(n).errores), [], id + " válido");
    assert.equal(M.preguntasActivas(n, ctx.CONFIG).length, 10, id + " tiene 10 preguntas");
    assert.equal(n.calculo.lineas.length, 3, id + " tiene 3 líneas de cálculo");
    assert.ok(!JSON.stringify(n).includes("[COMPLETAR]"), id + " sin [COMPLETAR]");
    assert.ok(n.resultado.senales.length >= 2, id + " con señales propias");
  });
});

test("cada nicho calcula, genera resultado, resumen, CSV e instantánea de email", () => {
  IDS.forEach((id) => {
    const n = ctx.NICHOS[id];
    const resp = {};
    n.preguntas.forEach((p) => {
      if (p.tipo === "slider") {
        resp[p.clave] = p.slider.marca;
        if (p.sub) resp[p.sub.clave] = p.sub.opciones[1];
      } else resp[p.clave] = p.opciones[p.opciones.length - 1].valor;
    });
    resp[n.resultado.selectorVariante.clave] = "mucho";
    const params = M.parametrosEfectivos(ctx.CONFIG, n);
    const reg = {
      id: "2026-10-14T08:42:11.000Z", idCorto: "AB12CD", fecha: "2026-10-14T08:42:11.000Z", nicho: id, nombreCliente: "",
      respuestas: resp, calculo: M.calcular(n, resp, params), parametros: params,
      preguntasMostradas: [].concat(...M.preguntasActivas(n, ctx.CONFIG).map((p) => (p.sub ? [p.clave, p.sub.clave] : [p.clave]))),
      contactoNorteIA: { enlaceCal: "https://cal.com/x", telefono: "+34 600" }
    };
    assert.ok(reg.calculo.minutosDia > 0, id + ": con los valores habituales hay minutos");
    const t = M.textosResultado(n, reg, ctx.CONFIG);
    assert.equal(t.variante, "A");
    assert.ok(!/\{\w+\}/.test(t.titular + t.subtitulo + t.impulso + t.contraste.texto + t.pie), id + ": sin variables sin rellenar");
    assert.ok(t.senales.length <= 2);
    const resumen = M.textoResumen(n, reg, ctx.CONFIG);
    assert.ok(!resumen.includes("no recogido"), id + ": resumen completo");
    assert.equal(resumen.split("\n").filter((l) => l.startsWith("- ")).length, 9 + 5, id + ": 9 respuestas + 5 de resultado");
    const inst = M.instantaneaEmail(n, reg, ctx.CONFIG);
    assert.equal(inst.respuestas_texto.split("\n").filter((l) => /^\d+\. /.test(l)).length, 10, id + ": 10 respuestas en el email");
    assert.equal(inst.interes_texto, "Mucho (variante A)");
    assert.match(M.generarCSV([reg]), new RegExp(";\"" + id + "\";"));
  });
});

test("costes por hora de cada sector (valores [DECIDIR])", () => {
  const coste = {};
  IDS.forEach((id) => { coste[id] = M.parametrosEfectivos(ctx.CONFIG, ctx.NICHOS[id]).costeHora; });
  assert.deepEqual(coste, { clinicas: 14, talleres: 15, gestorias: 15, peluquerias: 13, barberias: 13, spas: 13,
    veterinarias: 14, inmobiliarias: 14, restaurantes: 14, academias: 13 });
});

test("ejemplo de la sección 6: 135 min/día, 540 h, 7.560 €, 351 h y 4.914 € (4.910 € mostrado)", () => {
  const c = M.calcular(CL, EJEMPLO, M.parametrosEfectivos(ctx.CONFIG, CL));
  assert.equal(c.minutosDia, 135);
  assert.equal(c.horasDia, 2.25);
  assert.equal(c.horasSemana, 11.25);
  assert.equal(c.horasAno, 540);
  assert.equal(c.costeAno, 7560);
  assert.ok(Math.abs(c.horasRecuperables - 351) < 1e-9);
  assert.ok(Math.abs(c.eurosRecuperables - 4914) < 1e-9);
  assert.equal(c.jornadasAno, 67.5);
  assert.equal(M.fmtEuros(c.eurosRecuperables), "4.910 €");
  assert.equal(M.fmtEuros(c.costeAno), "7.560 €");
  assert.equal(M.fmtHorasRecuperables(c.horasRecuperables), "351");
  assert.equal(M.fmtDecimal(c.horasDia, 1), "2,3");
  assert.equal(c.estadoPercepcion, "coincide");
});

test("máximos: 960 min/día, 3.840 h/año, 53.760 €/año", () => {
  const r = Object.assign({}, EJEMPLO, { llamadas: 100, minLlamada: 5, mensajes: 100, minMensaje: 3, gestiones: 40, minGestion: 4 });
  const c = M.calcular(CL, r, M.parametrosEfectivos(ctx.CONFIG, CL));
  assert.equal(c.minutosDia, 960);
  assert.equal(M.fmtEntero(c.horasAno), "3.840");
  assert.equal(M.fmtEuros(c.costeAno), "53.760 €");
});

test("todo a 0: volumen bajo, sin cifras", () => {
  const r = Object.assign({}, EJEMPLO, { llamadas: 0, mensajes: 0, gestiones: 0 });
  const t = M.textosResultado(CL, registro(r), ctx.CONFIG);
  assert.equal(t.volumenBajo, true);
  assert.equal(t.textoVolumenBajo, "Con estas cifras el volumen de tareas es bajo. Aun así, un diagnóstico puede encontrar otras oportunidades.");
});

test("horas recuperables < 10 se muestran con un decimal", () => {
  assert.equal(M.fmtHorasRecuperables(7.8), "7,8");
  assert.equal(M.fmtHorasRecuperables(9.96), "10,0");
});

test("coste/hora 20 € cambia los euros; parámetros del nicho pisan a CONFIG", () => {
  const nicho = Object.assign({}, CL, { parametros: { costeHora: 20 } });
  const p = M.parametrosEfectivos(ctx.CONFIG, nicho);
  assert.equal(p.costeHora, 20);
  assert.equal(p.porcentajeAhorro, 0.65);
  assert.equal(M.calcular(nicho, EJEMPLO, p).costeAno, 10800);
  const sinPropios = M.parametrosEfectivos({ costeHora: 14, porcentajeAhorro: 0.65, diasSemana: 5, semanasAno: 48 }, { parametros: {} });
  assert.equal(sinPropios.costeHora, 14);
});

test("CONFIG no válida usa los valores por defecto y avisa", () => {
  const c = { costeHora: 0, porcentajeAhorro: 1.5, diasSemana: 5, semanasAno: 48 };
  const avisos = M.validarConfigGlobal(c);
  assert.equal(avisos.length, 2);
  assert.equal(c.costeHora, 14);
  assert.equal(c.porcentajeAhorro, 0.65);
});

test("contraste de percepción: mayor, coincide, menor y bordes", () => {
  const p = M.parametrosEfectivos(ctx.CONFIG, CL);
  const est = (percepcion, extra) => M.calcular(CL, Object.assign({}, EJEMPLO, { percepcion }, extra || {}), p).estadoPercepcion;
  assert.equal(est("lt2"), "mayor");
  assert.equal(est("2-4"), "coincide");
  assert.equal(est("4-6"), "menor");
  assert.equal(est("gt6"), "menor");
  // gt6 nunca es "mayor"; lt2 nunca es "menor"
  assert.equal(est("gt6", { llamadas: 100, minLlamada: 5, mensajes: 100, minMensaje: 3 }), "coincide");
  assert.equal(est("lt2", { llamadas: 0, mensajes: 0, gestiones: 0 }), "coincide");
});

test("variantes A/B/C según el interés y titular sin nombre sin comas", () => {
  const varia = (interes, nombre) => M.textosResultado(CL, registro(Object.assign({}, EJEMPLO, { interes }), { nombreCliente: nombre }), ctx.CONFIG);
  assert.equal(varia("mucho", "Clínica Sol").titular, "Clínica Sol, podéis recuperar 351 horas y 4.910 € al año.");
  assert.equal(varia("bastante", "").titular, "Podéis recuperar 351 horas y 4.910 € al año.");
  assert.equal(varia("poco", "X").variante, "B");
  assert.equal(varia("no_prioritario", "X").titular, "Aunque no sea prioritario: 351 horas y 4.910 € al año.");
  const a = varia("mucho", "");
  assert.equal(a.subtitulo, "Hoy vuestro equipo dedica unas 540 horas al año a llamadas, mensajes y gestiones de citas. Eso son 68 jornadas completas y 7.560 € al año.");
  assert.equal(a.contraste.texto, "Vuestra intuición es buena: 2,3 horas al día, justo lo que pensabais. Lo que quizá no habíais visto es lo que cuesta al año: 7.560 €.");
  assert.equal(a.pie, "Estimación basada en vuestras respuestas. Ahorro calculado sobre un 65 % de recuperación media por automatización.");
});

test("señales: máximo 2, por prioridad", () => {
  const r = Object.assign({}, EJEMPLO, { perdidas: "no_controlado", repetidas: "constantemente", software: "no", fueraHorario: "se_pierden" });
  const t = M.textosResultado(CL, registro(r), ctx.CONFIG);
  assert.equal(t.senales.length, 2);
  assert.match(t.senales[0].texto, /^Llamadas sin contestar/);
  assert.equal(t.senales[1].texto, "Las consultas fuera de horario se pierden.");
  const ninguna = M.textosResultado(CL, registro(EJEMPLO), ctx.CONFIG);
  assert.equal(ninguna.senales.length, 0);
});

test("resumen copiable con el formato exacto de la sección 9.2", () => {
  const texto = M.textoResumen(CL, registro(EJEMPLO), ctx.CONFIG);
  const esperado = [
    "AUDITORÍA RÁPIDA NORTEIA",
    "Fecha: 14/10/2026 10:42",
    "Sector: Clínicas",
    "Clínica: Clínica Dental Ejemplo",
    "Tipo: Dental",
    "",
    "RESPUESTAS",
    "- Llamadas al día: 25 x 3 min",
    "- Mensajes al día: 20 x 2 min",
    "- Gestiones de citas al día: 10 x 2 min",
    "- Personas que se ocupan: 2",
    "- Respuestas repetidas: muchas veces al día",
    "- Llamadas sin contestar: a veces",
    "- Programa de citas: sí",
    "- Interés en fuera de horario: mucho",
    "- Percepción del equipo: de 2 a 4 horas al día",
    "",
    "RESULTADO",
    "- Tiempo en estas tareas: 135 min/día (2,3 h/día)",
    "- Horas perdidas al año: 540 h",
    "- Coste anual (14 €/h): 7.560 €",
    "- Recuperable (65 %): 351 h y 4.910 €/año",
    "- Percepción vs realidad: coincide",
    "",
    "PRÓXIMO PASO: cita con NorteIA -> https://norteia.es/contacto?objetivo=orientacion&utm_source=auditoria-tablet / +34 637 90 58 66"
  ].join("\n");
  assert.equal(texto, esperado);
});

test("resumen con extras activas añade sus líneas", () => {
  const r = Object.assign({}, EJEMPLO, { noShows: "1-2", fueraHorario: "dueno" });
  const reg = registro(r);
  reg.preguntasMostradas = reg.preguntasMostradas.concat(["noShows", "fueraHorario"]);
  const texto = M.textoResumen(CL, reg, ctx.CONFIG);
  assert.match(texto, /- No-shows por semana: 1-2\n- Fuera de horario: el dueño desde casa\n/);
});

test("preguntas activas: 10 por defecto, 12 con las dos extras", () => {
  assert.equal(M.preguntasActivas(CL, ctx.CONFIG).length, 10);
  assert.equal(M.preguntasActivas(CL, { extrasActivas: { noShows: true, fueraHorario: true } }).length, 12);
  assert.equal(M.preguntasActivas(CL, { extrasActivas: { noShows: true } }).length, 11);
});

test("CSV genérico: BOM, columnas exactas, separador ; y comillas duplicadas", () => {
  const reg = registro(EJEMPLO, { nombreCliente: 'Clínica "La Paz"' });
  const csv = M.generarCSV([reg]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  const filas = csv.slice(1).split("\r\n");
  assert.equal(filas[0], "fecha;nicho;nombre_cliente;minutos_dia;horas_ano;coste_ano;horas_recuperables;euros_recuperables;estado_percepcion;coste_hora;porcentaje_ahorro;respuestas");
  const c = filas[1].split(";");
  assert.equal(c.length, 12);
  assert.equal(c[0], '"14/10/2026 10:42"');
  assert.equal(c[1], '"clinicas"');
  assert.equal(c[2], '"Clínica ""La Paz"""');
  assert.deepEqual(c.slice(3, 11), ["135", "540", "7560", "351", "4914", '"coincide"', "14", "0.65"]);
  assert.equal(c[11], '"tipo=dental|llamadas=25|minLlamada=3|mensajes=20|minMensaje=2|gestiones=10|minGestion=2|personas=2|repetidas=muchas|perdidas=a_veces|software=si|interes=mucho|percepcion=2-4"');
});

test("CSV: un nombre que empieza por = no se interpreta como fórmula", () => {
  const csv = M.generarCSV([registro(EJEMPLO, { nombreCliente: "=HYPERLINK(1)" })]);
  assert.match(csv, /"'=HYPERLINK\(1\)"/);
});

test("validación: variante B ausente oculta el nicho con motivo", () => {
  const roto = JSON.parse(JSON.stringify(CL));
  delete roto.resultado.variantes.B;
  const v = M.validarNicho(roto);
  assert.equal(v.ok, false);
  assert.ok(v.errores.includes("falta la variante B"));
});

test("validación: mapa incompleto, rangos con hueco, líneas a claves inexistentes, claves repetidas", () => {
  const roto = JSON.parse(JSON.stringify(CL));
  delete roto.resultado.selectorVariante.mapa.poco;
  roto.calculo.percepcion.rangos[1].min = 2.5;
  roto.calculo.lineas.push({ cantidad: "noExiste", minutos: "minLlamada" });
  roto.preguntas.push({ clave: "tipo", titulo: "x", tipo: "opcion", opciones: [{ valor: 1, etiqueta: "a" }, { valor: 2, etiqueta: "b" }] });
  const errores = M.validarNicho(roto).errores.join(" | ");
  assert.match(errores, /no cubre la opción poco/);
  assert.match(errores, /hueco o solape/);
  assert.match(errores, /cantidad desconocida: noExiste/);
  assert.match(errores, /clave repetida: tipo/);
});

test("un nicho nuevo de prueba (2 líneas, 3 preguntas) funciona sin tocar el motor", () => {
  const c2 = cargar(["niches/index.js", "tests/fixtures/nicho-prueba.js", "almacen.js", "motor.js"], { localStorage: null });
  const N = c2.NICHOS.prueba;
  assert.deepEqual(Array.from(c2.MotorNorteIA.validarNicho(N).errores), []);
  const p = c2.MotorNorteIA.parametrosEfectivos({ costeHora: 14, porcentajeAhorro: 0.65, diasSemana: 5, semanasAno: 48 }, N);
  assert.equal(p.costeHora, 20);
  const calc = c2.MotorNorteIA.calcular(N, { pedidos: 5, minPedido: 6, llamadas: 10, minLlamada: 3, percepcion: "bajo" }, p);
  assert.equal(calc.minutosDia, 60);
  assert.equal(calc.horasAno, 240);
  assert.equal(calc.costeAno, 4800);
  assert.equal(calc.estadoPercepcion, "coincide");
});

test("instantánea de email: 10 respuestas, interés, cálculo y contacto 'No recogido'", () => {
  const inst = M.instantaneaEmail(CL, registro(EJEMPLO), ctx.CONFIG);
  assert.equal(inst.auditoria_id, "K7F3Q2");
  assert.equal(inst.fecha_local, "14/10/2026 10:42");
  assert.equal(inst.fecha_iso, "2026-10-14T08:42:11.000Z");
  assert.equal(inst.nicho_nombre, "Clínicas");
  assert.equal(inst.nombre_cliente, "Clínica Dental Ejemplo");
  const lineas = inst.respuestas_texto.split("\n").filter((l) => /^\d+\. /.test(l));
  assert.equal(lineas.length, 10);
  assert.equal(lineas[0], "1. Tipo de clínica: Dental");
  assert.equal(lineas[4], "5. Personas que se ocupan de estas tareas: 2");
  assert.equal(lineas[7], "8. ¿Programa de gestión de citas?: Sí");
  assert.equal(lineas[9], "10. Horas/día estimadas del equipo en estas tareas: De 2 a 4 horas");
  assert.match(inst.respuestas_texto, /2\. Llamadas al día: 25\n {3}Minutos por llamada: 3 min\n {3}Total: 75 min\/día/);
  assert.equal(inst.interes_texto, "Mucho (variante A)");
  assert.match(inst.calculo_texto, /Recuperable \(65 %\): 351 h y 4\.910 €\/año/);
  assert.match(inst.calculo_texto, /Coste anual: 7\.560 €/);
  assert.match(inst.calculo_texto, /Jornadas de 8 horas al año: 68/);
  assert.match(inst.calculo_texto, /Parámetros: 14 €\/h · 65 % de ahorro · 5 días\/semana · 48 semanas\/año/);
  assert.equal(inst.contacto_texto, "No recogido");
  assert.match(inst.proximo_paso, /norteia\.es\/contacto/);
});

test("instantánea: 0, 'No' y 'No lo sé' se conservan; ausentes = 'No recogido'; sin nombre = ID corto", () => {
  const r = Object.assign({}, EJEMPLO, { llamadas: 0, software: "no_se", interes: "no_prioritario", perdidas: null });
  const inst = M.instantaneaEmail(CL, registro(r, { nombreCliente: "" }), ctx.CONFIG);
  assert.match(inst.respuestas_texto, /2\. Llamadas al día: 0\n/);
  assert.match(inst.respuestas_texto, /8\. ¿Programa de gestión de citas\?: No lo sé/);
  assert.match(inst.respuestas_texto, /7\. ¿Llamadas sin contestar atendiendo pacientes\?: No recogido/);
  assert.equal(inst.interes_texto, "No es prioritario (variante C)");
  assert.equal(inst.nombre_cliente, "Cliente sin nombre (K7F3Q2)");
});

test("instantánea: contacto solo con los campos dados, saneado y limitado", () => {
  const inst = M.instantaneaEmail(CL, registro(EJEMPLO, {
    nombreCliente: "Clínica\nCon salto " + "x".repeat(300),
    contacto: { persona: "Ana\r\nPérez", email: "ana@ejemplo.es", cargo: "" }
  }), ctx.CONFIG);
  assert.equal(inst.contacto_texto, "Persona de contacto: Ana Pérez\nEmail: ana@ejemplo.es");
  assert.ok(!/[\r\n]/.test(inst.nombre_cliente));
  assert.equal(inst.nombre_cliente.length, 150);
});

test("ningún archivo del motor contiene textos de un nicho", () => {
  ["app.js", "motor.js", "email.js"].forEach((a) => {
    const s = fs.readFileSync(path.join(RAIZ, a), "utf8");
    ["Tipo de clínica", "minLlamada", "Dental", "pacientes", "no_prioritario", "Peluquer", "taller", "Idealista"].forEach((t) => {
      assert.ok(!s.includes(t), a + " contiene «" + t + "»");
    });
  });
});

test("no hay identificadores reales de EmailJS en el repositorio", () => {
  const cfg = fs.readFileSync(path.join(RAIZ, "config.js"), "utf8");
  assert.match(cfg, /serviceId: ""/);
  assert.match(cfg, /publicKey: ""/);
  assert.match(cfg, /habilitado: false/);
  const ignore = fs.readFileSync(path.join(RAIZ, ".gitignore"), "utf8");
  assert.match(ignore, /^config\.local\.js$/m);
});
