/*
 * MOTOR GENÉRICO: cálculo, validación de nichos, formatos y textos.
 * Funciones puras: no tocan el DOM ni el almacenamiento.
 * No contiene ninguna pregunta, fórmula específica ni texto de un nicho concreto:
 * todo se lee del bloque del nicho (niches/*.js) y de CONFIG.
 */
(function (raiz) {
  "use strict";

  var PARAMETROS_DEFECTO = { costeHora: 11.75, porcentajeAhorroMin: 0.40, porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 };
  var ZONA = "Europe/Madrid";

  // ---------- Formatos (es-ES) ----------

  function agrupar(entero) {
    var signo = entero < 0 ? "-" : "";
    return signo + String(Math.abs(entero)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function fmtEntero(n) {
    return agrupar(Math.round(Number(n) || 0));
  }

  function fmtDecimal(n, decimales) {
    var f = Math.pow(10, decimales);
    var r = Math.round((Number(n) || 0) * f) / f;
    var entero = Math.trunc(r);
    var frac = Math.round(Math.abs(r - entero) * f);
    var texto = agrupar(entero);
    if (r < 0 && entero === 0) texto = "-0";
    if (decimales > 0) texto += "," + String(frac).padStart(decimales, "0");
    return texto;
  }

  // Número "natural": entero si lo es, si no hasta 2 decimales con coma (ej. 62,5).
  function fmtNatural(n) {
    var r = Math.round((Number(n) || 0) * 100) / 100;
    if (Number.isInteger(r)) return agrupar(r);
    return String(r).replace(".", ",");
  }

  function redondear10(n) {
    return Math.round((Number(n) || 0) / 10) * 10;
  }

  function fmtEuros(n) {
    return agrupar(redondear10(n)) + " €";
  }

  function fmtHorasRecuperables(n) {
    return n < 10 ? fmtDecimal(n, 1) : fmtEntero(n);
  }

  function partesFecha(iso) {
    var d = new Date(iso);
    var partes = {};
    try {
      new Intl.DateTimeFormat("es-ES", {
        timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(d).forEach(function (p) { partes[p.type] = p.value; });
    } catch (e) {
      partes = { day: pad(d.getDate()), month: pad(d.getMonth() + 1), year: String(d.getFullYear()),
                 hour: pad(d.getHours()), minute: pad(d.getMinutes()) };
    }
    if (partes.hour === "24") partes.hour = "00";
    return partes;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  // "14/10/2026 10:42" en hora de Madrid
  function fmtFecha(iso) {
    var p = partesFecha(iso);
    return p.day + "/" + p.month + "/" + p.year + " " + p.hour + ":" + p.minute;
  }

  // "2026-10-14" en hora de Madrid (para nombres de archivo)
  function fechaArchivo(iso) {
    var p = partesFecha(iso);
    return p.year + "-" + p.month + "-" + p.day;
  }

  function primeraMinuscula(texto) {
    texto = String(texto);
    if (texto.length > 1 && texto[1] === texto[1].toUpperCase() && texto[1] !== texto[1].toLowerCase()) return texto;
    return texto.charAt(0).toLowerCase() + texto.slice(1);
  }

  function rellenar(plantilla, variables) {
    return String(plantilla || "").replace(/\{(\w+)\}/g, function (m, clave) {
      return Object.prototype.hasOwnProperty.call(variables, clave) && variables[clave] != null ? String(variables[clave]) : m;
    });
  }

  // ---------- Parámetros ----------

  function numeroValido(v, condicion) {
    return typeof v === "number" && isFinite(v) && condicion(v);
  }

  // Valida CONFIG al arrancar (sección 8): valores fuera de rango -> defectos + aviso.
  function validarConfigGlobal(config) {
    var avisos = [];
    if (!numeroValido(config.porcentajeAhorro, function (v) { return v > 0 && v <= 1; })) {
      avisos.push("porcentajeAhorro fuera de rango (" + config.porcentajeAhorro + "); se usa " + PARAMETROS_DEFECTO.porcentajeAhorro);
      config.porcentajeAhorro = PARAMETROS_DEFECTO.porcentajeAhorro;
    }
    if (!numeroValido(config.costeHora, function (v) { return v > 0; })) {
      avisos.push("costeHora no válido (" + config.costeHora + "); se usa " + PARAMETROS_DEFECTO.costeHora);
      config.costeHora = PARAMETROS_DEFECTO.costeHora;
    }
    if (!numeroValido(config.diasSemana, function (v) { return v > 0 && v <= 7; })) config.diasSemana = PARAMETROS_DEFECTO.diasSemana;
    if (!numeroValido(config.semanasAno, function (v) { return v > 0 && v <= 53; })) config.semanasAno = PARAMETROS_DEFECTO.semanasAno;
    return avisos;
  }

  // Los parámetros del nicho pisan a CONFIG. Valores no válidos -> los de CONFIG.
  function parametrosEfectivos(config, nicho) {
    var propios = (nicho && nicho.parametros) || {};
    var reglas = {
      costeHora: function (v) { return v > 0; },
      porcentajeAhorroMin: function (v) { return v > 0 && v <= 1; },
      porcentajeAhorro: function (v) { return v > 0 && v <= 1; },
      diasSemana: function (v) { return v > 0 && v <= 7; },
      semanasAno: function (v) { return v > 0 && v <= 53; }
    };
    var p = {};
    Object.keys(reglas).forEach(function (k) {
      if (propios[k] != null && numeroValido(propios[k], reglas[k])) p[k] = propios[k];
      else if (numeroValido(config[k], reglas[k])) p[k] = config[k];
      else p[k] = PARAMETROS_DEFECTO[k];
    });
    // Rango orientativo: mínimo <= máximo (porcentajeAhorro es el extremo alto)
    if (!(p.porcentajeAhorroMin <= p.porcentajeAhorro)) p.porcentajeAhorroMin = p.porcentajeAhorro;
    return p;
  }

  // ---------- Preguntas ----------

  // Preguntas visibles del nicho según las extras activas
  function preguntasActivas(nicho, config) {
    var extras = (config && config.extrasActivas) || {};
    return (nicho.preguntas || []).filter(function (p) {
      return !p.extra || extras[p.extra] === true;
    });
  }

  function buscarPregunta(nicho, clave) {
    var lista = nicho.preguntas || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].clave === clave) return { pregunta: lista[i], esSub: false };
      if (lista[i].sub && lista[i].sub.clave === clave) return { pregunta: lista[i], esSub: true };
    }
    return null;
  }

  function opcionDe(pregunta, valor) {
    var ops = pregunta.opciones || [];
    for (var i = 0; i < ops.length; i++) {
      if (String(ops[i].valor) === String(valor)) return ops[i];
    }
    return null;
  }

  function etiquetaOpcion(pregunta, valor) {
    var op = opcionDe(pregunta, valor);
    return op ? op.etiqueta : String(valor);
  }

  function unidadSub(sub) {
    return (sub && sub.unidad) || "min";
  }

  // ---------- Validación de nichos (sección 0.1) ----------

  function validarNicho(nicho) {
    var errores = [];
    function err(m) { errores.push(m); }
    if (!nicho || typeof nicho !== "object") return { ok: false, errores: ["el nicho no es un objeto"] };
    if (!nicho.id) err("falta id");
    if (!nicho.nombre) err("falta nombre");
    var preguntas = nicho.preguntas;
    if (!Array.isArray(preguntas) || preguntas.length === 0) {
      err("no hay preguntas");
      return { ok: false, errores: errores };
    }

    var claves = {};
    function registrarClave(c, donde) {
      if (!c) { err("pregunta sin clave (" + donde + ")"); return; }
      if (claves[c]) err("clave repetida: " + c);
      claves[c] = true;
    }
    preguntas.forEach(function (p, i) {
      registrarClave(p.clave, "posición " + (i + 1));
      if (!p.titulo) err("pregunta " + p.clave + " sin título");
      if (p.tipo === "opcion") {
        if (!Array.isArray(p.opciones) || p.opciones.length < 2) err("pregunta " + p.clave + " necesita al menos 2 opciones");
        else {
          var vistos = {};
          p.opciones.forEach(function (o) {
            if (o.valor == null || o.etiqueta == null) err("opción incompleta en " + p.clave);
            if (vistos[String(o.valor)]) err("opción repetida en " + p.clave + ": " + o.valor);
            vistos[String(o.valor)] = true;
          });
        }
      } else if (p.tipo === "slider") {
        var s = p.slider || {};
        if (!(typeof s.min === "number" && typeof s.max === "number" && s.min < s.max)) err("slider " + p.clave + " con rango no válido");
        if (s.marca != null && (s.marca < s.min || s.marca > s.max)) err("marca de " + p.clave + " fuera de rango");
        if (p.sub) {
          registrarClave(p.sub.clave, "subpregunta de " + p.clave);
          if (!Array.isArray(p.sub.opciones) || p.sub.opciones.length === 0) err("subpregunta de " + p.clave + " sin opciones");
        }
      } else {
        err("tipo no válido en " + p.clave + ": " + p.tipo);
      }
    });

    var calculo = nicho.calculo || {};
    var lineas = calculo.lineas;
    if (!Array.isArray(lineas) || lineas.length < 1 || lineas.length > 6) err("calculo.lineas debe tener entre 1 y 6 líneas");
    else lineas.forEach(function (l) {
      if (!claves[l.cantidad]) err("línea de cálculo con cantidad desconocida: " + l.cantidad);
      // minutos: clave de una respuesta, o un número fijo (la respuesta ya son minutos al día)
      if (typeof l.minutos !== "number" && !claves[l.minutos]) err("línea de cálculo con minutos desconocidos: " + l.minutos);
    });

    if (calculo.techo && (!calculo.techo.clave || !claves[calculo.techo.clave])) err("calculo.techo.clave no existe");

    var perc = calculo.percepcion;
    if (!perc || !perc.clave || !claves[perc.clave]) err("calculo.percepcion.clave no existe");
    else {
      var pp = buscarPregunta(nicho, perc.clave).pregunta;
      var rangos = (perc.rangos || []).slice().sort(function (a, b) { return a.min - b.min; });
      if (rangos.length === 0) err("percepcion.rangos vacío");
      else {
        if (rangos[0].min !== 0) err("percepcion.rangos no empieza en 0");
        for (var r = 1; r < rangos.length; r++) {
          if (rangos[r].min !== rangos[r - 1].max) err("percepcion.rangos con hueco o solape entre " + rangos[r - 1].valor + " y " + rangos[r].valor);
        }
        if (rangos[rangos.length - 1].max != null) err("percepcion.rangos no cubre hasta el infinito (último max debe ser null)");
        rangos.forEach(function (rg) {
          if (!rg.texto) err("rango " + rg.valor + " sin texto");
          if (pp.opciones && !opcionDe(pp, rg.valor)) err("rango " + rg.valor + " no es una opción de " + perc.clave);
        });
        (pp.opciones || []).forEach(function (o) {
          if (!rangos.some(function (rg) { return String(rg.valor) === String(o.valor); })) err("la opción " + o.valor + " de " + perc.clave + " no tiene rango");
        });
      }
    }

    var res = nicho.resultado || {};
    var sel = res.selectorVariante;
    if (!sel || !sel.clave || !claves[sel.clave]) err("resultado.selectorVariante.clave no existe");
    else {
      var ps = buscarPregunta(nicho, sel.clave).pregunta;
      (ps.opciones || []).forEach(function (o) {
        var v = sel.mapa && sel.mapa[o.valor];
        if (!v) err("selectorVariante.mapa no cubre la opción " + o.valor);
        else if (["A", "B", "C"].indexOf(v) < 0) err("selectorVariante.mapa apunta a una variante desconocida: " + v);
      });
    }
    ["A", "B", "C"].forEach(function (k) {
      var v = res.variantes && res.variantes[k];
      if (!v) { err("falta la variante " + k); return; }
      ["titular", "subtitulo", "impulso", "cta"].forEach(function (campo) {
        if (!v[campo]) err("variante " + k + " sin " + campo);
      });
    });
    if (!res.volumenBajo) err("falta resultado.volumenBajo");
    if (!res.contraste || !res.contraste.titulo || !res.contraste.mayor || !res.contraste.coincide || !res.contraste.menor) err("resultado.contraste incompleto");
    if (!res.pie) err("falta resultado.pie");
    (res.senales || []).forEach(function (s) {
      if (!s.si || !s.si.clave || !Array.isArray(s.si.en)) err("señal mal definida: " + s.texto);
    });

    var resumen = nicho.resumen;
    if (!resumen || !resumen.titulo || !Array.isArray(resumen.lineas)) err("resumen incompleto");
    else resumen.lineas.forEach(function (l) {
      if (!claves[l[0]]) err("resumen referencia una clave desconocida: " + l[0]);
    });

    return { ok: errores.length === 0, errores: errores };
  }

  // ---------- Cálculo (sección 6) ----------

  function calcular(nicho, respuestas, params) {
    var minutosRespuestas = 0;
    (nicho.calculo.lineas || []).forEach(function (l) {
      var cantidad = Number(respuestas[l.cantidad]) || 0;
      var minutos = typeof l.minutos === "number" ? l.minutos : Number(respuestas[l.minutos]) || 0;
      minutosRespuestas += cantidad * minutos;
    });
    // Tope: no más horas al día de las que caben en la jornada de quienes hacen estas tareas
    var minutosDia = minutosRespuestas;
    var horasDiaMaximo = null;
    var techo = nicho.calculo.techo;
    if (techo && techo.clave && Number(respuestas[techo.clave]) > 0) {
      horasDiaMaximo = Number(respuestas[techo.clave]) * (techo.horasPorUnidad || 8);
      minutosDia = Math.min(minutosRespuestas, horasDiaMaximo * 60);
    }
    var horasDia = minutosDia / 60;
    var horasSemana = horasDia * params.diasSemana;
    var horasAno = horasSemana * params.semanasAno;
    var costeAno = horasAno * params.costeHora;
    var pMin = params.porcentajeAhorroMin != null ? params.porcentajeAhorroMin : params.porcentajeAhorro;
    return {
      minutosDia: minutosDia,
      minutosRespuestas: minutosRespuestas,
      limitado: minutosDia < minutosRespuestas,
      horasDiaMaximo: horasDiaMaximo,
      horasDia: horasDia,
      horasSemana: horasSemana,
      horasAno: horasAno,
      costeAno: costeAno,
      horasRecuperables: horasAno * params.porcentajeAhorro,
      eurosRecuperables: costeAno * params.porcentajeAhorro,
      horasRecuperablesMin: horasAno * pMin,
      eurosRecuperablesMin: costeAno * pMin,
      jornadasAno: horasAno / 8,
      estadoPercepcion: estadoPercepcion(nicho, respuestas, horasDia)
    };
  }

  function rangoPercepcion(nicho, respuestas) {
    var perc = nicho.calculo && nicho.calculo.percepcion;
    if (!perc) return null;
    var valor = respuestas[perc.clave];
    var rangos = perc.rangos || [];
    for (var i = 0; i < rangos.length; i++) {
      if (String(rangos[i].valor) === String(valor)) return rangos[i];
    }
    return null;
  }

  // Rango [min, max): dentro -> coincide; por encima -> mayor; por debajo -> menor.
  function estadoPercepcion(nicho, respuestas, horasDia) {
    var rango = rangoPercepcion(nicho, respuestas);
    if (!rango) return null;
    if (rango.max != null && horasDia >= rango.max) return "mayor";
    if (horasDia < rango.min) return "menor";
    return "coincide";
  }

  var AVISO_LIMITE = "Vuestras respuestas suman {horasDiaRespuestas} horas al día, más de lo que cabe en la jornada de quienes hacen estas tareas. Hemos contado como máximo {horasDiaMaximo} horas al día.";

  function minimo(a, b) { return a != null && isFinite(a) ? a : b; }

  // Nota cuando las respuestas superan la jornada de quienes hacen estas tareas
  function textoLimite(c) {
    if (!c.limitado) return "";
    return " · limitado a la jornada de quienes se ocupan (las respuestas sumaban " + fmtDecimal(c.minutosRespuestas / 60, 1) + " h/día)";
  }

  function rangoPct(p) {
    var max = fmtNatural(p.porcentajeAhorro * 100);
    var min = p.porcentajeAhorroMin != null ? fmtNatural(p.porcentajeAhorroMin * 100) : max;
    return min === max ? max : min + "-" + max;
  }

  var TEXTO_ESTADO = { mayor: "la realidad es mayor", coincide: "coincide", menor: "la realidad es menor" };

  // ---------- Resultado ----------

  function variante(nicho, respuestas) {
    var sel = nicho.resultado && nicho.resultado.selectorVariante;
    var v = sel && sel.mapa ? sel.mapa[respuestas[sel.clave]] : null;
    return v || "A";
  }

  function variablesResultado(nicho, registro, config) {
    var c = registro.calculo;
    var p = registro.parametros;
    var rango = rangoPercepcion(nicho, registro.respuestas);
    return {
      horas: fmtHorasRecuperables(c.horasRecuperables),
      euros: fmtEuros(c.eurosRecuperables),
      horasAno: fmtEntero(c.horasAno),
      horasAnoCalc: fmtEntero(c.horasAno),
      costeAno: fmtEuros(c.costeAno),
      jornadasAno: fmtEntero(c.jornadasAno),
      horasDiaCalc: fmtDecimal(c.horasDia, 1),
      percepcionTexto: rango ? rango.texto : "",
      nombreCliente: registro.nombreCliente || "",
      porcentajeAhorroPct: fmtNatural(p.porcentajeAhorro * 100),
      rangoPct: rangoPct(p),
      horasMin: fmtEntero(minimo(c.horasRecuperablesMin, c.horasRecuperables)),
      horasMax: fmtEntero(c.horasRecuperables),
      eurosMin: fmtEuros(minimo(c.eurosRecuperablesMin, c.eurosRecuperables)),
      eurosMax: fmtEuros(c.eurosRecuperables),
      horasDiaRespuestas: fmtDecimal((c.minutosRespuestas != null ? c.minutosRespuestas : c.minutosDia) / 60, 1),
      horasDiaMaximo: c.horasDiaMaximo != null ? fmtNatural(c.horasDiaMaximo) : "",
      costeHora: fmtNatural(p.costeHora),
      telefono: (registro.contactoNorteIA && registro.contactoNorteIA.telefono) || config.telefono,
      enlaceCal: (registro.contactoNorteIA && registro.contactoNorteIA.enlaceCal) || config.enlaceCal,
      articuloCliente: nicho.articuloCliente || "",
      empresa: config.nombreEmpresa || "NorteIA"
    };
  }

  // Textos de la pantalla de resultado ya rellenos
  function textosResultado(nicho, registro, config) {
    var res = nicho.resultado || {};
    var vars = variablesResultado(nicho, registro, config);
    var bajo = !(registro.calculo.minutosDia > 0);
    var claveVariante = variante(nicho, registro.respuestas);
    var v = (res.variantes && res.variantes[claveVariante]) || (res.variantes && res.variantes.A) || {};
    var titularPlantilla = vars.nombreCliente ? v.titular : (v.titularSinNombre || v.titular);
    var contraste = res.contraste || {};
    var estado = registro.calculo.estadoPercepcion;
    var senales = (res.senales || []).filter(function (s) {
      var valor = registro.respuestas[s.si.clave];
      return valor != null && s.si.en.map(String).indexOf(String(valor)) >= 0;
    }).sort(function (a, b) { return a.prioridad - b.prioridad; }).slice(0, 2);
    return {
      volumenBajo: bajo,
      variante: claveVariante,
      textoVolumenBajo: rellenar(res.volumenBajo, vars),
      titular: rellenar(titularPlantilla, vars),
      subtitulo: rellenar(v.subtitulo, vars),
      impulso: rellenar(v.impulso, vars),
      cta: rellenar(bajo ? (res.ctaVolumenBajo || v.cta) : v.cta, vars),
      cifras: {
        horas: { valor: registro.calculo.horasAno, texto: vars.horasAno, formato: "entero", etiqueta: (res.etiquetasCifras && res.etiquetasCifras.horas) || "" },
        euros: { valor: registro.calculo.costeAno, texto: vars.costeAno, formato: "euros", etiqueta: (res.etiquetasCifras && res.etiquetasCifras.euros) || "" }
      },
      avisoLimite: registro.calculo.limitado ? rellenar(res.avisoLimite || AVISO_LIMITE, vars) : "",
      contraste: {
        titulo: rellenar(contraste.titulo, vars),
        etiquetaPercepcion: rellenar(contraste.etiquetaPercepcion, vars),
        valorPercepcion: rellenar(contraste.valorPercepcion || "{percepcionTexto}", vars),
        etiquetaCalculo: rellenar(contraste.etiquetaCalculo, vars),
        valorCalculo: rellenar(contraste.valorCalculo || "{horasDiaCalc}", vars),
        estado: estado,
        texto: estado ? rellenar(contraste[estado], vars) : ""
      },
      senales: senales.map(function (s) { return { icono: s.icono || "•", texto: rellenar(s.texto, vars) }; }),
      pie: rellenar(res.pie, vars),
      variables: vars
    };
  }

  // ---------- Texto de una respuesta ----------

  // Valor legible de una respuesta (para resumen). null si no hay respuesta.
  function valorLegible(nicho, respuestas, clave, opciones) {
    var info = buscarPregunta(nicho, clave);
    if (!info) return null;
    var p = info.pregunta;
    var v = respuestas[clave];
    if (v == null) return null;
    if (info.esSub) return v + " " + unidadSub(p.sub);
    if (p.tipo === "slider") {
      if (p.sub) {
        var m = respuestas[p.sub.clave];
        return v + " x " + (m == null ? "?" : m) + " " + unidadSub(p.sub);
      }
      return String(v);
    }
    var texto = etiquetaOpcion(p, v);
    texto = (opciones && opciones.literal) ? texto : primeraMinuscula(texto);
    return texto + ((opciones && opciones.sufijo) || "");
  }

  function preguntaMostrada(registro, clave) {
    return !registro.preguntasMostradas || registro.preguntasMostradas.indexOf(clave) >= 0;
  }

  // ---------- Resumen copiable (sección 9.2) ----------

  function textoResumen(nicho, registro, config) {
    var res = nicho.resumen || {};
    var c = registro.calculo;
    var p = registro.parametros;
    var vars = variablesResultado(nicho, registro, config);
    var L = [];
    L.push(res.titulo || "AUDITORÍA RÁPIDA");
    L.push("Fecha: " + fmtFecha(registro.fecha));
    L.push("Sector: " + nicho.nombre);
    L.push((res.etiquetaNombre || "Cliente") + ": " + (registro.nombreCliente || "Sin nombre"));
    (res.cabecera || []).forEach(function (l) {
      var info = buscarPregunta(nicho, l[0]);
      var v = registro.respuestas[l[0]];
      if (info && v != null) L.push(l[1] + ": " + (info.pregunta.tipo === "opcion" ? etiquetaOpcion(info.pregunta, v) : v));
    });
    L.push("");
    L.push("RESPUESTAS");
    (res.lineas || []).forEach(function (l) {
      if (!preguntaMostrada(registro, l[0])) return;
      var texto = valorLegible(nicho, registro.respuestas, l[0], l[2]);
      L.push("- " + l[1] + ": " + (texto == null ? "no recogido" : texto));
    });
    L.push("");
    L.push("RESULTADO");
    L.push("- Tiempo en estas tareas: " + fmtEntero(c.minutosDia) + " min/día (" + fmtDecimal(c.horasDia, 1) + " h/día)" + textoLimite(c));
    L.push("- Horas al año en estas tareas: " + fmtEntero(c.horasAno) + " h");
    L.push("- Coste actual al año (" + fmtNatural(p.costeHora) + " €/h): " + fmtEuros(c.costeAno));
    L.push("- Recuperable orientativo (" + vars.rangoPct + " %): entre " + vars.horasMin + " y " + vars.horasMax + " h, entre " + vars.eurosMin + " y " + vars.eurosMax + " al año");
    L.push("- Percepción vs realidad: " + (TEXTO_ESTADO[c.estadoPercepcion] || "sin dato"));
    L.push("");
    L.push("OBSERVACIONES");
    L.push(textoObservaciones(registro));
    L.push("");
    L.push("PRÓXIMO PASO: cita con " + vars.empresa + " -> " + vars.enlaceCal + " / " + vars.telefono);
    return L.join("\n");
  }

  // ---------- CSV genérico (sección 0.3) ----------

  var COLUMNAS_CSV = ["fecha", "nicho", "nombre_cliente", "minutos_dia", "horas_ano", "coste_ano", "horas_recuperables",
    "euros_recuperables", "estado_percepcion", "coste_hora", "porcentaje_ahorro", "respuestas", "Observaciones"];

  function csvTexto(v) {
    var s = v == null ? "" : String(v);
    // Evitar que Excel interprete un nombre como fórmula
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function csvNumero(n) {
    if (n == null || !isFinite(n)) return "";
    return String(Math.round(n * 100) / 100);
  }

  function respuestasPlano(respuestas) {
    return Object.keys(respuestas || {}).filter(function (k) { return respuestas[k] != null; })
      .map(function (k) { return k + "=" + String(respuestas[k]).replace(/[|=\r\n]/g, " "); }).join("|");
  }

  function generarCSV(historial) {
    var filas = [COLUMNAS_CSV.join(";")];
    historial.forEach(function (r) {
      var c = r.calculo || {};
      var p = r.parametros || r.config || {};
      filas.push([
        csvTexto(fmtFecha(r.fecha)),
        csvTexto(r.nicho),
        csvTexto(r.nombreCliente),
        csvNumero(c.minutosDia),
        csvNumero(c.horasAno),
        csvNumero(c.costeAno),
        csvNumero(c.horasRecuperables),
        csvNumero(c.eurosRecuperables),
        csvTexto(c.estadoPercepcion),
        csvNumero(p.costeHora),
        csvNumero(p.porcentajeAhorro),
        csvTexto(respuestasPlano(r.respuestas)),
        csvTexto(limpiarObservaciones(r.observaciones))
      ].join(";"));
    });
    return "﻿" + filas.join("\r\n") + "\r\n";
  }

  // ---------- Instantánea para el email (addendum, sección 19) ----------

  var LIMITE_NOMBRE = 150;
  var LIMITE_OBSERVACIONES = 1000;
  var SIN_OBSERVACIONES = "(sin observaciones)";

  // Notas libres del comercial: texto multilínea, sin caracteres de control, máximo 1.000 caracteres.
  // Los registros antiguos no tienen el campo: cuentan como vacío.
  function limpiarObservaciones(texto) {
    return String(texto == null ? "" : texto)
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, LIMITE_OBSERVACIONES);
  }

  function textoObservaciones(registro) {
    return limpiarObservaciones(registro && registro.observaciones) || SIN_OBSERVACIONES;
  }
  var LIMITES_CONTACTO = { persona: 100, cargo: 80, email: 120, telefono: 25 };
  var ETIQUETAS_CONTACTO = { persona: "Persona de contacto", cargo: "Cargo", email: "Email", telefono: "Teléfono" };

  function unaLinea(texto) {
    return String(texto == null ? "" : texto).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  function limpiarContacto(contacto) {
    var limpio = {};
    Object.keys(LIMITES_CONTACTO).forEach(function (k) {
      var v = contacto && contacto[k] != null ? unaLinea(contacto[k]).slice(0, LIMITES_CONTACTO[k]) : "";
      if (v) limpio[k] = v;
    });
    return limpio;
  }

  function idCorto(registro) {
    return registro.idCorto || String(registro.id || "").replace(/\D/g, "").slice(-6);
  }

  function textoRespuestasCompleto(nicho, registro) {
    var L = [];
    var n = 0;
    (nicho.preguntas || []).forEach(function (p) {
      if (!preguntaMostrada(registro, p.clave)) return;
      n++;
      var v = registro.respuestas[p.clave];
      var texto;
      if (v == null) texto = "No recogido";
      else if (p.tipo === "opcion") texto = etiquetaOpcion(p, v);
      else texto = String(v) + (p.slider && p.slider.unidad ? " " + p.slider.unidad : "");
      L.push(n + ". " + p.titulo + ": " + texto);
      if (p.sub) {
        var m = registro.respuestas[p.sub.clave];
        L.push("   " + p.sub.titulo + ": " + (m == null ? "No recogido" : m + " " + unidadSub(p.sub)));
        if (v != null && m != null) L.push("   Total: " + fmtEntero(Number(v) * Number(m)) + " " + unidadSub(p.sub) + "/día");
      }
    });
    return L.join("\n");
  }

  function textoCalculoCompleto(registro) {
    var c = registro.calculo;
    var p = registro.parametros;
    return [
      "Tiempo en estas tareas: " + fmtEntero(c.minutosDia) + " min/día (" + fmtDecimal(c.horasDia, 1) + " h/día)" + textoLimite(c),
      "Horas a la semana: " + fmtDecimal(c.horasSemana, 1) + " h",
      "Horas al año: " + fmtEntero(c.horasAno) + " h",
      "Coste actual al año: " + fmtEuros(c.costeAno),
      "Recuperable orientativo (" + rangoPct(p) + " %): entre " + fmtEntero(minimo(c.horasRecuperablesMin, c.horasRecuperables)) + " y " + fmtEntero(c.horasRecuperables) + " h, entre " + fmtEuros(minimo(c.eurosRecuperablesMin, c.eurosRecuperables)) + " y " + fmtEuros(c.eurosRecuperables) + " al año",
      "Jornadas de 8 horas al año: " + fmtEntero(c.jornadasAno),
      "Percepción vs realidad: " + (c.estadoPercepcion ? c.estadoPercepcion + " (" + TEXTO_ESTADO[c.estadoPercepcion] + ")" : "sin dato"),
      "Parámetros: " + fmtNatural(p.costeHora) + " €/h (salario mínimo + Seguridad Social) · " + rangoPct(p) + " % recuperable orientativo · " + fmtNatural(p.diasSemana) + " días/semana · " + fmtNatural(p.semanasAno) + " semanas/año"
    ].join("\n");
  }

  function textoInteres(nicho, registro) {
    var sel = nicho.resultado && nicho.resultado.selectorVariante;
    if (!sel || !sel.clave) return "No recogido";
    var v = registro.respuestas[sel.clave];
    if (v == null) return "No recogido";
    var info = buscarPregunta(nicho, sel.clave);
    var texto = (sel.textos && sel.textos[v]) || (info ? etiquetaOpcion(info.pregunta, v) : String(v));
    var variante = sel.mapa && sel.mapa[v];
    return texto + (variante ? " (variante " + variante + ")" : "");
  }

  function textoContacto(registro) {
    var c = limpiarContacto(registro.contacto);
    var claves = Object.keys(c);
    if (claves.length === 0) return "No recogido";
    return claves.map(function (k) { return ETIQUETAS_CONTACTO[k] + ": " + c[k]; }).join("\n");
  }

  // Variables de la plantilla de EmailJS. Se congela al finalizar la visita.
  function instantaneaEmail(nicho, registro, config) {
    var vars = variablesResultado(nicho, registro, config);
    var nombre = unaLinea(registro.nombreCliente).slice(0, LIMITE_NOMBRE);
    return {
      auditoria_id: idCorto(registro),
      fecha_local: unaLinea(fmtFecha(registro.fecha)),
      fecha_iso: registro.fecha,
      nicho_nombre: unaLinea(nicho.nombre),
      nombre_cliente: nombre || ("Cliente sin nombre (" + idCorto(registro) + ")"),
      respuestas_texto: textoRespuestasCompleto(nicho, registro),
      calculo_texto: textoCalculoCompleto(registro),
      interes_texto: textoInteres(nicho, registro),
      contacto_texto: textoContacto(registro),
      observaciones: textoObservaciones(registro),
      proximo_paso: "Ofrecer cita con " + vars.empresa + ": " + vars.enlaceCal + " · Teléfono " + vars.empresa + ": " + vars.telefono +
        "\n(No se ha agendado ni contactado nada automáticamente.)"
    };
  }

  raiz.MotorNorteIA = {
    PARAMETROS_DEFECTO: PARAMETROS_DEFECTO,
    COLUMNAS_CSV: COLUMNAS_CSV,
    LIMITES_CONTACTO: LIMITES_CONTACTO,
    LIMITE_OBSERVACIONES: LIMITE_OBSERVACIONES,
    limpiarObservaciones: limpiarObservaciones,
    agrupar: agrupar,
    fmtEntero: fmtEntero,
    fmtDecimal: fmtDecimal,
    fmtNatural: fmtNatural,
    fmtEuros: fmtEuros,
    fmtHorasRecuperables: fmtHorasRecuperables,
    fmtFecha: fmtFecha,
    fechaArchivo: fechaArchivo,
    redondear10: redondear10,
    rellenar: rellenar,
    validarConfigGlobal: validarConfigGlobal,
    parametrosEfectivos: parametrosEfectivos,
    preguntasActivas: preguntasActivas,
    buscarPregunta: buscarPregunta,
    etiquetaOpcion: etiquetaOpcion,
    validarNicho: validarNicho,
    calcular: calcular,
    variante: variante,
    textosResultado: textosResultado,
    textoResumen: textoResumen,
    generarCSV: generarCSV,
    limpiarContacto: limpiarContacto,
    unaLinea: unaLinea,
    instantaneaEmail: instantaneaEmail
  };
})(typeof self !== "undefined" ? self : this);
