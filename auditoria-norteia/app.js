/*
 * APP: motor genérico de pantallas. Dibuja las preguntas, calcula y pinta el resultado
 * leyendo el bloque del nicho elegido (niches/*.js). No contiene preguntas ni textos de un nicho.
 * Usa: CONFIG (config.js), MotorNorteIA (motor.js), AlmacenNorteIA (almacen.js), EmailNorteIA (email.js).
 */
(function () {
  "use strict";

  var CONFIG = window.CONFIG;
  var M = window.MotorNorteIA;
  var A = window.AlmacenNorteIA;
  var E = window.EmailNorteIA;
  var raizApp = document.getElementById("app");

  // Textos genéricos de la interfaz (los de cada nicho están en su archivo)
  var T = {
    empezar: "Empezar",
    atras: "Atrás",
    siguiente: "Siguiente",
    verResultado: "Ver resultado",
    pregunta: "Pregunta {n} de {total}",
    calculando: "Calculando…",
    revisar: "Revisar respuestas",
    guardarResumen: "Guardar resumen",
    nuevaAuditoria: "Nueva estimación",
    llamaAhora: "O llama ahora: {telefono}",
    escaneaQR: "Escanea para agendar desde tu móvil",
    sinConexionCTA: "Sin conexión ahora. Podéis llamar al {telefono} o lo agendamos desde otro dispositivo.",
    habitual: "habitual",
    leyendaSlider: "en un día normal",
    copiar: "Copiar resumen",
    copiado: "Copiado",
    compartir: "Compartir",
    descargarCSV: "Descargar CSV",
    descargarCSVTodo: "Descargar CSV (todo)",
    volverResultado: "Volver al resultado",
    volver: "Volver",
    noGuardado: "No se pudo guardar en el dispositivo. Copia el resumen; el envío pendiente puede perderse al cerrar.",
    confirmarNueva: "¿Empezar una nueva? Esta no se ha guardado.",
    guardarYEmpezar: "Guardar y empezar",
    empezarSinGuardar: "Empezar sin guardar",
    noSePudoGuardar: "No se pudo guardar en el dispositivo. Copia el resumen antes de empezar otra.",
    verResumen: "Ver resumen",
    borrarHistorial: "Borrar historial",
    borrarPaso1: "¿Borrar todas las visitas de este dispositivo?",
    borrarPaso2: "Se borrarán {n} visitas. Esta acción no se puede deshacer.",
    borrarPendientes: "Hay {n} visitas con email pendiente. Borrar también cancela sus envíos locales.",
    siBorrar: "Sí, borrar",
    cancelar: "Cancelar",
    reintentar: "Reintentar pendientes",
    ayudaEnviado: "Aceptado por el servicio; no confirma entrega en bandeja",
    sinConexionEmail: "Sin conexión: queda pendiente. Abre la app con internet para completar los envíos.",
    sinNichos: "No hay ningún nicho disponible. Revisa CONFIG.nichosVisibles en config.js.",
    historial: "Historial de visitas",
    resumen: "Resumen de la estimación",
    todos: "Todos",
    sinAuditorias: "Todavía no hay visitas guardadas en este dispositivo.",
    contactoTitulo: "Datos de contacto (opcional)",
    contactoPersona: "Persona de contacto",
    contactoCargo: "Cargo",
    contactoEmail: "Email",
    contactoTelefono: "Teléfono",
    contactoError: "Revisa el email o el teléfono, o déjalos vacíos."
  };

  var estado = {
    pantalla: null,
    nichosVisibles: [],
    nichoId: null,
    nicho: null,
    preguntas: [],
    indice: -1,
    respuestas: {},
    nombreCliente: "",
    contacto: {},
    sesion: null,
    registro: null,
    guardado: true,
    bloqueoHasta: 0,
    filtro: "todos",
    toquesLogo: [],
    wakeLock: null
  };

  // ---------- Utilidades DOM ----------

  // Crea elementos sin innerHTML (los datos del cliente nunca se interpretan como HTML)
  function h(etiqueta, atributos, hijos) {
    var el = document.createElement(etiqueta);
    Object.keys(atributos || {}).forEach(function (k) {
      var v = atributos[k];
      if (v == null || v === false) return;
      if (k === "clase") el.className = v;
      else if (k === "texto") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "estilo") el.setAttribute("style", v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (hijos || []).forEach(function (hijo) {
      if (hijo == null || hijo === false) return;
      el.appendChild(typeof hijo === "string" ? document.createTextNode(hijo) : hijo);
    });
    return el;
  }

  function f(plantilla, vars) { return M.rellenar(plantilla, vars || {}); }

  function mostrar(seccion, nombre) {
    estado.pantalla = nombre;
    raizApp.textContent = "";
    raizApp.appendChild(seccion);
    var foco = seccion.querySelector("[data-foco]");
    if (foco) { try { foco.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
  }

  // Evita dobles avances por toques rápidos (300 ms)
  function libre() {
    var ahora = Date.now();
    if (ahora < estado.bloqueoHasta) return false;
    estado.bloqueoHasta = ahora + 300;
    return true;
  }

  function boton(contenido, clase, accion, extra) {
    return h("button", Object.assign({ type: "button", clase: "boton " + clase, onclick: accion }, extra || {}),
      Array.isArray(contenido) ? contenido : [contenido]);
  }

  function rutaLogo() { return CONFIG.logo || "assets/logo-norteia.svg"; }

  // Enlaces de NorteIA (web, email, WhatsApp, redes) definidos en CONFIG.contactoNorteIA
  function enlacesNorteIA() {
    var c = CONFIG.contactoNorteIA || {};
    var lista = [];
    if (c.whatsapp) lista.push({ texto: "WhatsApp", href: "https://wa.me/" + String(c.whatsapp).replace(/\D/g, "") });
    if (c.web) lista.push({ texto: String(c.web).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), href: c.web });
    if (c.email) lista.push({ texto: c.email, href: "mailto:" + c.email });
    if (c.instagram) lista.push({ texto: "Instagram", href: c.instagram });
    if (c.linkedin) lista.push({ texto: "LinkedIn", href: c.linkedin });
    if (!lista.length) return null;
    var cont = h("div", { clase: "contacto-norteia" });
    lista.forEach(function (e, i) {
      if (i) cont.appendChild(h("span", { "aria-hidden": "true", texto: "·" }));
      cont.appendChild(h("a", { href: e.href, target: "_blank", rel: "noopener", texto: e.texto }));
    });
    return cont;
  }

  // Icono de línea (assets/iconos.js) con el color de la paleta; si no existe, se muestra el texto tal cual
  function icono(nombre, clase) {
    var span = h("span", { clase: "icono" + (clase ? " " + clase : ""), "aria-hidden": "true" });
    var cuerpo = nombre && window.ICONOS_NORTEIA && window.ICONOS_NORTEIA[nombre];
    if (cuerpo) {
      span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + cuerpo + "</svg>";
    } else if (nombre) {
      span.textContent = nombre;
    }
    return span;
  }

  function telefonoLimpio(tel) { return String(tel || "").replace(/[^\d+]/g, ""); }

  function idCorto() {
    var letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var s = "";
    var aleatorios = new Uint8Array(6);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(aleatorios);
    else for (var i = 0; i < 6; i++) aleatorios[i] = Math.floor(Math.random() * 256);
    for (var j = 0; j < 6; j++) s += letras[aleatorios[j] % letras.length];
    return s;
  }

  // ---------- Diálogo ----------

  function confirmar(texto, botones) {
    return new Promise(function (resolver) {
      var dlg = document.getElementById("dialogo");
      var cont = document.getElementById("dialogo-botones");
      document.getElementById("dialogo-texto").textContent = texto;
      cont.textContent = "";
      botones.forEach(function (b, i) {
        var el = boton(b.texto, b.clase || "boton-secundario", function () {
          dlg.hidden = true;
          resolver(b.valor);
        });
        cont.appendChild(el);
        if (i === 0) setTimeout(function () { el.focus(); }, 0);
      });
      dlg.hidden = false;
    });
  }

  // ---------- Wake Lock (que la pantalla no se apague durante la visita) ----------

  function pedirWakeLock() {
    try {
      if (navigator.wakeLock && !estado.wakeLock) {
        navigator.wakeLock.request("screen").then(function (w) {
          estado.wakeLock = w;
          w.addEventListener("release", function () { estado.wakeLock = null; });
        }).catch(function () { /* ignorar */ });
      }
    } catch (e) { /* ignorar */ }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && estado.pantalla && estado.pantalla !== "bienvenida") pedirWakeLock();
  });

  // ---------- Carga de nichos ----------

  function cargarScript(src) {
    return new Promise(function (resolver) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolver(true); };
      s.onerror = function () { console.error("No se pudo cargar " + src); resolver(false); };
      document.head.appendChild(s);
    });
  }

  function cargarNichos() {
    var lista = (window.NICHOS_LISTA || []).filter(function (id) { return /^[a-z0-9_-]+$/i.test(id); });
    return Promise.all(lista.map(function (id) { return cargarScript("niches/" + id + ".js"); })).then(function () {
      var nichos = window.NICHOS || {};
      var disponibles = {};
      lista.forEach(function (id) {
        var n = nichos[id];
        if (!n) { console.error("Nicho " + id + ": no se encontró window.NICHOS." + id); return; }
        if (n.completo) {
          var v = M.validarNicho(n);
          if (!v.ok) { console.error("Nicho " + id + " oculto por errores de configuración:\n- " + v.errores.join("\n- ")); return; }
        } else if (!CONFIG.modoDesarrollo) {
          return; // incompleto: nunca en producción
        }
        disponibles[id] = n;
      });
      estado.nichosVisibles = (CONFIG.nichosVisibles || []).filter(function (id) { return disponibles[id]; })
        .map(function (id) { return disponibles[id]; });
      var porDefecto = estado.nichosVisibles.filter(function (n) { return n.id === CONFIG.nichoPorDefecto; })[0];
      estado.nicho = porDefecto || estado.nichosVisibles[0] || null;
      estado.nichoId = estado.nicho ? estado.nicho.id : null;
    });
  }

  function nichoPorId(id) {
    return (window.NICHOS || {})[id] || null;
  }

  // ---------- Bienvenida ----------

  function tocarLogo() {
    var ahora = Date.now();
    estado.toquesLogo = estado.toquesLogo.filter(function (t) { return ahora - t < 3000; });
    estado.toquesLogo.push(ahora);
    if (estado.toquesLogo.length >= 5) {
      estado.toquesLogo = [];
      mostrarHistorial();
    }
  }

  function mostrarBienvenida() {
    estado.indice = -1;
    if (estado.wakeLock) { try { estado.wakeLock.release(); } catch (e) { /* nada */ } }
    var n = estado.nicho;
    var eg = E.estadoGeneral();

    var titulo = h("h1", { texto: n ? n.tituloApp : "" });
    var subtitulo = h("p", { clase: "subtitulo", texto: n ? n.subtituloBienvenida : "" });
    var campo = h("input", {
      clase: "campo-nombre seleccionable", type: "text", maxlength: "150",
      autocomplete: "off", autocapitalize: "words", spellcheck: "false", autocorrect: "off",
      placeholder: n ? n.campoNombre : "", "aria-label": n ? n.campoNombre : ""
    });
    campo.value = estado.nombreCliente || "";

    var selector = null;
    if (estado.nichosVisibles.length > 1) {
      var comoPestanas = estado.nichosVisibles.length > 4;
      selector = h("div", { clase: "nichos" + (comoPestanas ? " pestanas" : ""), role: "group", "aria-label": "Sector" });
      estado.nichosVisibles.forEach(function (nicho) {
        var tarjeta = h("button", {
          type: "button", clase: "nicho-tarjeta", "aria-pressed": String(nicho.id === estado.nichoId),
          "aria-label": "Sector: " + nicho.nombre + (nicho.completo ? "" : " (incompleto)"),
          onclick: function () {
            estado.nicho = nicho;
            estado.nichoId = nicho.id;
            Array.prototype.forEach.call(selector.children, function (c) { c.setAttribute("aria-pressed", "false"); });
            tarjeta.setAttribute("aria-pressed", "true");
            titulo.textContent = nicho.tituloApp;
            subtitulo.textContent = nicho.subtituloBienvenida;
            campo.placeholder = nicho.campoNombre;
            campo.setAttribute("aria-label", nicho.campoNombre);
          }
        }, [icono(nicho.icono), h("span", { clase: "nombre-nicho", texto: nicho.nombre }),
            nicho.completo ? null : h("span", { clase: "etiqueta-completar", texto: "[COMPLETAR]" })]);
        selector.appendChild(tarjeta);
      });
    }

    var contacto = eg.capturarContacto ? bloqueContacto() : null;

    var esquina = h("div", { clase: "esquina-version" }, [h("div", { texto: "v" + CONFIG.versionApp })]);
    if (String(CONFIG.enlaceCal || "").indexOf("PENDIENTE") >= 0) {
      esquina.appendChild(h("div", { clase: "alerta", texto: "config: enlace pendiente" }));
    }
    if (CONFIG.modoDesarrollo) esquina.appendChild(h("div", { clase: "alerta", texto: "modo desarrollo" }));
    var contador = h("div", { clase: "pendientes", "data-email-contador": "1" });
    esquina.appendChild(contador);

    var empezar = boton(T.empezar, "boton-principal boton-empezar", function () {
      if (!libre() || !estado.nicho) return;
      estado.nombreCliente = M.unaLinea(campo.value).slice(0, 150);
      if (contacto && !contacto.validar()) return;
      estado.contacto = contacto ? contacto.valores() : {};
      empezarAuditoria();
    }, { disabled: !estado.nicho });

    var seccion = h("section", { clase: "pantalla bienvenida" + (contacto ? " con-scroll" : "") }, [
      h("button", { type: "button", clase: "logo-boton", "aria-label": "NorteIA", onclick: tocarLogo }, [
        h("img", { src: rutaLogo(), alt: "NorteIA", draggable: "false" })
      ]),
      titulo,
      subtitulo,
      selector,
      n ? campo : h("p", { clase: "mensaje-error-nichos", texto: T.sinNichos }),
      contacto ? contacto.elemento : null,
      empezar,
      esquina
    ]);
    mostrar(seccion, "bienvenida");
    refrescarEmail();
  }

  // Bloque opcional de contacto (solo si CONFIG.email.capturarContacto). No es una pregunta numerada.
  function bloqueContacto() {
    var lim = M.LIMITES_CONTACTO;
    var campos = {
      persona: h("input", { type: "text", maxlength: String(lim.persona), autocomplete: "off", autocapitalize: "words", spellcheck: "false" }),
      cargo: h("input", { type: "text", maxlength: String(lim.cargo), autocomplete: "off", spellcheck: "false" }),
      email: h("input", { type: "email", maxlength: String(lim.email), autocomplete: "off", autocapitalize: "off", spellcheck: "false", inputmode: "email" }),
      telefono: h("input", { type: "tel", maxlength: String(lim.telefono), autocomplete: "off", inputmode: "tel" })
    };
    Object.keys(campos).forEach(function (k) { campos[k].value = estado.contacto[k] || ""; });
    var error = h("p", { clase: "error-campo", role: "alert", hidden: true, texto: T.contactoError });
    var detalles = h("details", { clase: "bloque-contacto" }, [
      h("summary", { texto: T.contactoTitulo }),
      h("div", { clase: "campos" }, [
        h("label", {}, [T.contactoPersona, campos.persona]),
        h("label", {}, [T.contactoCargo, campos.cargo]),
        h("label", {}, [T.contactoEmail, campos.email]),
        h("label", {}, [T.contactoTelefono, campos.telefono]),
        error,
        h("p", { clase: "aviso-privacidad", texto: (CONFIG.email && CONFIG.email.avisoContacto) || "" })
      ])
    ]);
    if (Object.keys(estado.contacto || {}).length) detalles.open = true;
    return {
      elemento: detalles,
      valores: function () {
        var v = {};
        Object.keys(campos).forEach(function (k) { v[k] = campos[k].value; });
        return M.limpiarContacto(v);
      },
      validar: function () {
        var em = campos.email.value.trim();
        var tel = campos.telefono.value.trim();
        var emailOk = !em || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
        var telOk = !tel || /^\+?[\d\s().-]{6,20}$/.test(tel);
        campos.email.setAttribute("aria-invalid", String(!emailOk));
        campos.telefono.setAttribute("aria-invalid", String(!telOk));
        error.hidden = emailOk && telOk;
        if (!error.hidden) detalles.open = true;
        return emailOk && telOk;
      }
    };
  }

  function empezarAuditoria() {
    estado.preguntas = M.preguntasActivas(estado.nicho, CONFIG);
    estado.respuestas = {};
    estado.sesion = { id: new Date().toISOString(), idCorto: idCorto(), fecha: null };
    estado.registro = null;
    estado.guardado = true;
    pedirWakeLock();
    mostrarPregunta(0);
  }

  function nuevaAuditoria() {
    if (!libre()) return;
    var reiniciar = function () {
      estado.respuestas = {};
      estado.nombreCliente = "";
      estado.contacto = {};
      estado.sesion = null;
      estado.registro = null;
      estado.guardado = true;
      mostrarBienvenida();
    };
    if (estado.guardado || !estado.registro) { reiniciar(); return; }
    confirmar(T.confirmarNueva, [
      { texto: T.guardarYEmpezar, clase: "boton-principal", valor: "guardar" },
      { texto: T.empezarSinGuardar, clase: "boton-secundario", valor: "sin" }
    ]).then(function (v) {
      if (v === "sin") { reiniciar(); return; }
      if (A.guardarRegistro(estado.registro)) { estado.guardado = true; reiniciar(); return; }
      confirmar(T.noSePudoGuardar, [
        { texto: T.verResumen, clase: "boton-principal", valor: "ver" },
        { texto: T.empezarSinGuardar, clase: "boton-secundario", valor: "sin" }
      ]).then(function (v2) {
        if (v2 === "sin") reiniciar(); else mostrarResumen(estado.registro, "resultado");
      });
    });
  }

  // ---------- Preguntas ----------

  function contestada(p) {
    var r = estado.respuestas;
    if (r[p.clave] == null) return false;
    if (p.tipo === "slider" && p.sub && r[p.sub.clave] == null) return false;
    return true;
  }

  function columnasPara(n) {
    if (n <= 3) return n;
    if (n === 4) return 2;
    return 3;
  }

  function grupoOpciones(opciones, valorActual, alElegir, extraClase, etiquetar, columnas, conLetra) {
    var cont = h("div", { clase: "opciones" + (extraClase ? " " + extraClase : ""), role: "group" });
    cont.style.setProperty("--columnas", String(columnas || columnasPara(opciones.length)));
    var botones = [];
    opciones.forEach(function (op, idx) {
      var valor = typeof op === "object" ? op.valor : op;
      var etiqueta = etiquetar ? etiquetar(op) : op.etiqueta;
      var b = h("button", {
        type: "button", clase: "opcion", "aria-pressed": String(valorActual != null && String(valorActual) === String(valor)),
        onclick: function () {
          botones.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          alElegir(valor);
        }
      }, [
        conLetra ? h("span", { clase: "opcion-letra", "aria-hidden": "true", texto: String.fromCharCode(65 + idx) }) : null,
        h("span", { clase: "opcion-texto", texto: etiqueta }),
        icono("check", "opcion-check")
      ]);
      botones.push(b);
      cont.appendChild(b);
    });
    return cont;
  }

  function crearSlider(p, alCambiar) {
    var s = p.slider;
    var valor = estado.respuestas[p.clave];
    var arrastrando = false;
    var marca = s.marca != null ? s.marca : null;
    var unidad = s.unidad ? " " + s.unidad : "";

    var display = h("div", { clase: "slider-valor", "aria-hidden": "true" });
    var input = h("input", {
      type: "range", min: String(s.min), max: String(s.max), step: "1", "aria-label": p.titulo
    });
    input.value = String(valor != null ? valor : (marca != null ? marca : s.min));

    var pista = h("div", { clase: "slider-pista" }, [input]);
    if (marca != null) {
      var pct = (marca - s.min) / (s.max - s.min);
      var lineaMarca = h("div", { clase: "slider-marca", "aria-hidden": "true" }, [
        h("span", { texto: String(marca) }), h("small", { texto: T.habitual })
      ]);
      lineaMarca.style.left = "calc(28px + " + pct + " * (100% - 56px))";
      pista.appendChild(lineaMarca);
    }

    var atajos = [];
    var valoresAtajo = [s.min];
    if (marca != null && marca !== s.min) valoresAtajo.push(marca);
    var filaAtajos = h("div", { clase: "slider-atajos" });
    valoresAtajo.forEach(function (v) {
      var esHabitual = v === marca;
      var b = h("button", {
        type: "button", clase: "atajo" + (esHabitual ? " habitual" : ""),
        "aria-label": "Poner " + v + (esHabitual ? " (habitual)" : ""),
        onclick: function () { fijar(v); }
      }, [String(v), esHabitual ? h("small", { texto: "Habitual" }) : null]);
      b.dataset.valor = String(v);
      atajos.push(b);
      filaAtajos.appendChild(b);
    });

    function pintar() {
      var hay = valor != null;
      input.classList.toggle("sin-valor", !hay);
      display.textContent = hay ? String(valor) + unidad : "—";
      display.classList.toggle("vacio", !hay);
      input.setAttribute("aria-valuetext", hay ? String(valor) : "Sin contestar");
      var pctRelleno = hay ? ((valor - s.min) / (s.max - s.min)) * 100 : 0;
      input.style.setProperty("--relleno", pctRelleno + "%");
      atajos.forEach(function (b) { b.setAttribute("aria-pressed", String(hay && Number(b.dataset.valor) === valor)); });
    }

    function fijar(v) {
      valor = Math.max(s.min, Math.min(s.max, Math.round(v)));
      input.value = String(valor);
      pintar();
      alCambiar(valor);
    }

    input.addEventListener("pointerdown", function () { arrastrando = true; });
    input.addEventListener("touchstart", function () { arrastrando = true; }, { passive: true });
    input.addEventListener("input", function () { fijar(Number(input.value)); });
    input.addEventListener("change", function () {
      // "Snap" a la marca habitual si se suelta a ±1 (solo al arrastrar, no con +/− ni teclado)
      if (arrastrando && marca != null && valor != null && valor !== marca && Math.abs(valor - marca) <= 1) fijar(marca);
      arrastrando = false;
    });
    input.addEventListener("pointerup", function () {
      if (valor == null) fijar(Number(input.value));
    });

    var menos = h("button", { type: "button", clase: "slider-paso", "aria-label": "Restar uno", onclick: function () {
      fijar(valor == null ? (marca != null ? marca : s.min) : valor - 1);
    } }, [icono("minus")]);
    var mas = h("button", { type: "button", clase: "slider-paso", "aria-label": "Sumar uno", onclick: function () {
      fijar(valor == null ? (marca != null ? marca : s.min) : valor + 1);
    } }, [icono("plus")]);

    pintar();
    return h("div", { clase: "slider" }, [
      h("div", { clase: "slider-cabecera" }, [display, h("span", { clase: "slider-leyenda", texto: T.leyendaSlider })]),
      h("div", { clase: "slider-fila" }, [menos, pista, mas]),
      filaAtajos
    ]);
  }

  function mostrarPregunta(i) {
    estado.indice = i;
    var p = estado.preguntas[i];
    var total = estado.preguntas.length;
    var esUltima = i === total - 1;

    var siguiente = boton([h("span", { texto: esUltima ? T.verResultado : T.siguiente }), icono("arrow-right")], "boton-principal boton-siguiente", function () {
      if (!contestada(p) || !libre()) return;
      if (esUltima) verResultado(); else mostrarPregunta(i + 1);
    });
    function actualizar() { siguiente.disabled = !contestada(p); }

    var contenido;
    if (p.tipo === "slider") {
      var slider = crearSlider(p, function (v) { estado.respuestas[p.clave] = v; actualizar(); });
      if (p.sub) {
        var sub = h("div", { clase: "subpregunta" }, [
          h("h2", { texto: p.sub.titulo }),
          grupoOpciones(p.sub.opciones, estado.respuestas[p.sub.clave], function (v) {
            estado.respuestas[p.sub.clave] = v;
            actualizar();
          }, "compactas", function (op) { return op + " " + (p.sub.unidad || "min"); }, 1, false)
        ]);
        contenido = h("div", { clase: "dos-partes" }, [slider, sub]);
      } else {
        contenido = slider;
      }
    } else {
      contenido = grupoOpciones(p.opciones, estado.respuestas[p.clave], function (v) {
        estado.respuestas[p.clave] = v;
        actualizar();
      }, null, null, null, true);
    }

    var seccion = h("section", { clase: "pantalla pregunta", "aria-label": f(T.pregunta, { n: i + 1, total: total }) }, [
      h("header", { clase: "barra-superior" }, [
        boton([icono("arrow-left"), h("span", { texto: T.atras })], "boton-atras", function () {
          if (!libre()) return;
          if (i === 0) mostrarBienvenida(); else mostrarPregunta(i - 1);
        }, { "aria-label": T.atras }),
        h("div", { clase: "progreso" }, [
          h("div", { clase: "progreso-segmentos", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(i + 1) },
            estado.preguntas.map(function (q, k) {
              return h("span", { clase: "segmento" + (k < i ? " hecho" : k === i ? " actual" : "") });
            })),
          h("span", { clase: "progreso-texto", texto: f(T.pregunta, { n: i + 1, total: total }) })
        ]),
        h("span", { clase: "chip-sector" }, [icono(estado.nicho.icono), h("span", { texto: estado.nicho.nombre })])
      ]),
      h("div", { clase: "pregunta-cuerpo" }, [
        h("div", { clase: "tarjeta-pregunta" + (p.tipo === "slider" ? " con-slider" : "") }, [
          h("div", { clase: "pregunta-encabezado" }, [
            h("h1", { clase: "pregunta-titulo" + (p.titulo.length > 60 ? " largo" : ""), texto: p.titulo, tabindex: "-1", "data-foco": "1" }),
            p.nota ? h("p", { clase: "pregunta-nota", texto: p.nota }) : null
          ]),
          contenido
        ])
      ]),
      h("footer", { clase: "pie-pregunta" }, [siguiente])
    ]);
    actualizar();
    mostrar(seccion, "pregunta");
  }

  // ---------- Resultado ----------

  function construirRegistro() {
    var n = estado.nicho;
    var params = M.parametrosEfectivos(CONFIG, n);
    var respuestas = {};
    (n.preguntas || []).forEach(function (p) {
      respuestas[p.clave] = estado.respuestas[p.clave] != null ? estado.respuestas[p.clave] : null;
      if (p.sub) respuestas[p.sub.clave] = estado.respuestas[p.sub.clave] != null ? estado.respuestas[p.sub.clave] : null;
    });
    var mostradas = [];
    estado.preguntas.forEach(function (p) { mostradas.push(p.clave); if (p.sub) mostradas.push(p.sub.clave); });
    if (!estado.sesion.fecha) estado.sesion.fecha = new Date().toISOString();
    var registro = {
      id: estado.sesion.id,
      idCorto: estado.sesion.idCorto,
      fecha: estado.sesion.fecha,
      nicho: n.id,
      nombreCliente: estado.nombreCliente || "",
      respuestas: respuestas,
      preguntasMostradas: mostradas,
      calculo: M.calcular(n, respuestas, params),
      parametros: params,
      config: { costeHora: params.costeHora, porcentajeAhorro: params.porcentajeAhorro },
      contactoNorteIA: { enlaceCal: CONFIG.enlaceCal, telefono: CONFIG.telefono },
      versionApp: CONFIG.versionApp
    };
    var contacto = M.limpiarContacto(estado.contacto);
    if (Object.keys(contacto).length) registro.contacto = contacto;
    return registro;
  }

  // Al llegar al resultado: registro + cola de email en UNA escritura; después, red.
  function verResultado() {
    var registro = construirRegistro();
    var existente = A.obtener(registro.id) || (estado.registro && estado.registro.id === registro.id ? estado.registro : null);
    if (existente && existente.email) registro.email = existente.email;
    try {
      E.prepararRegistro(registro, M.instantaneaEmail(estado.nicho, registro, CONFIG));
    } catch (e) {
      console.error("No se pudo preparar el email", e);
    }
    estado.guardado = A.guardarRegistro(registro);
    estado.registro = registro;
    E.procesar();
    mostrarCalculando();
  }

  function mostrarCalculando() {
    var hecho = false;
    function seguir() {
      if (hecho) return;
      hecho = true;
      mostrarResultado();
    }
    var seccion = h("section", { clase: "pantalla calculando", onclick: seguir, role: "status" }, [
      h("div", { clase: "indicador", "aria-hidden": "true" }),
      h("div", { texto: T.calculando })
    ]);
    mostrar(seccion, "calculando");
    setTimeout(seguir, Math.max(0, Number(CONFIG.pantallaCalculandoMs) || 0));
  }

  function svgQR(texto) {
    try {
      if (typeof window.qrcode !== "function") return null;
      var qr = window.qrcode(0, "M");
      qr.addData(texto);
      qr.make();
      var n = qr.getModuleCount();
      var margen = 2;
      var d = "";
      for (var y = 0; y < n; y++) {
        for (var x = 0; x < n; x++) {
          if (qr.isDark(y, x)) d += "M" + (x + margen) + " " + (y + margen) + "h1v1h-1z";
        }
      }
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      var lado = n + margen * 2;
      svg.setAttribute("viewBox", "0 0 " + lado + " " + lado);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", T.escaneaQR);
      svg.setAttribute("shape-rendering", "crispEdges");
      var fondo = document.createElementNS(ns, "rect");
      fondo.setAttribute("width", lado);
      fondo.setAttribute("height", lado);
      fondo.setAttribute("fill", "#fff");
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "#1B2429");
      svg.appendChild(fondo);
      svg.appendChild(path);
      return svg;
    } catch (e) {
      return null; // si no se puede generar, se omite sin error
    }
  }

  function animarCifras(elementos, seccion) {
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var terminado = false;
    function finalizar() {
      if (terminado) return;
      terminado = true;
      elementos.forEach(function (x) { x.el.textContent = x.formato(x.valor); });
    }
    if (reducido) { finalizar(); return; }
    seccion.addEventListener("pointerdown", finalizar, { once: true });
    var inicio = null;
    var DURACION = 1500;
    function paso(t) {
      if (terminado) return;
      if (inicio == null) inicio = t;
      var k = Math.min(1, (t - inicio) / DURACION);
      var suave = 1 - Math.pow(1 - k, 3);
      elementos.forEach(function (x) { x.el.textContent = x.formato(x.valor * suave); });
      if (k < 1) requestAnimationFrame(paso); else finalizar();
    }
    elementos.forEach(function (x) { x.el.textContent = x.formato(0); });
    requestAnimationFrame(paso);
  }

  function mostrarResultado() {
    var registro = estado.registro;
    var n = estado.nicho;
    var t = M.textosResultado(n, registro, CONFIG);
    // Que el «€» no se separe de su cifra al partir línea
    ["titular", "subtitulo", "impulso"].forEach(function (k) { t[k] = String(t[k] || "").replace(/(\d) €/g, "$1\u00a0€"); });
    t.contraste.texto = String(t.contraste.texto || "").replace(/(\d) €/g, "$1\u00a0€");
    var vars = t.variables;
    var seccion = h("section", { clase: "pantalla resultado" });
    var contenido = h("div", { clase: "resultado-contenido" });

    contenido.appendChild(h("header", { clase: "resultado-cabecera" }, [
      boton([icono("arrow-left"), h("span", { texto: T.revisar })], "boton-atras", function () {
        if (!libre()) return;
        mostrarPregunta(estado.preguntas.length - 1);
      }),
      h("img", { src: rutaLogo(), alt: "NorteIA" })
    ]));

    var animables = [];
    if (t.volumenBajo) {
      contenido.appendChild(h("div", { clase: "panel" }, [h("p", { clase: "volumen-bajo", texto: t.textoVolumenBajo, "data-foco": "1", tabindex: "-1" })]));
    } else {
      var numHoras = h("span", { clase: "cifra-num", texto: t.cifras.horas.texto });
      var numEuros = h("span", { clase: "cifra-num", texto: t.cifras.euros.texto });
      animables.push({ el: numHoras, valor: t.cifras.horas.valor, formato: M.fmtHorasRecuperables });
      animables.push({ el: numEuros, valor: t.cifras.euros.valor, formato: M.fmtEuros });
      var gancho = h("div", { clase: "panel gancho" }, [
        h("h1", { texto: t.titular, "data-foco": "1", tabindex: "-1" }),
        h("div", { clase: "cifras" }, [
          h("div", { clase: "cifra" }, [numHoras, h("span", { clase: "cifra-etq", texto: t.cifras.horas.etiqueta })]),
          h("div", { clase: "cifra" }, [numEuros, h("span", { clase: "cifra-etq", texto: t.cifras.euros.etiqueta })])
        ]),
        h("p", { texto: t.subtitulo }),
        h("p", { clase: "impulso", texto: t.impulso }),
        t.senales.length ? h("ul", { clase: "senales" }, t.senales.map(function (s) {
          return h("li", {}, [icono(s.icono, "icono-senal"), h("span", { texto: s.texto })]);
        })) : null
      ]);
      var contraste = h("aside", { clase: "panel contraste" }, [
        h("h2", { texto: t.contraste.titulo }),
        h("div", { clase: "contraste-cols" }, [
          h("div", { clase: "contraste-col" }, [h("small", { texto: t.contraste.etiquetaPercepcion }), h("strong", { texto: t.contraste.valorPercepcion })]),
          h("div", { clase: "contraste-col real" }, [h("small", { texto: t.contraste.etiquetaCalculo }), h("strong", { texto: t.contraste.valorCalculo })])
        ]),
        h("p", { texto: t.contraste.texto })
      ]);
      contenido.appendChild(h("div", { clase: "resultado-grid" }, [gancho, contraste]));
    }

    // CTA, teléfono y QR
    var aviso = h("p", { clase: "aviso-sin-conexion", role: "status", hidden: true, texto: f(T.sinConexionCTA, { telefono: vars.telefono }) });
    var cta = h("a", {
      clase: "boton boton-cta", href: vars.enlaceCal, target: "_blank", rel: "noopener",
      onclick: function (ev) {
        if (String(vars.enlaceCal).indexOf("PENDIENTE") >= 0) console.warn("CONFIG.enlaceCal sigue pendiente");
        if (navigator.onLine === false) { ev.preventDefault(); aviso.hidden = false; }
      }
    }, [t.cta]);
    var tel = h("a", { clase: "telefono", href: "tel:" + telefonoLimpio(vars.telefono), texto: f(T.llamaAhora, { telefono: vars.telefono }) });
    var qr = svgQR(vars.enlaceCal);

    contenido.appendChild(h("div", { clase: "acciones-secundarias" }, [
      boton(T.guardarResumen, "boton-discreto", function () { if (libre()) mostrarResumen(estado.registro, "resultado"); }),
      boton(T.nuevaAuditoria, "boton-discreto", nuevaAuditoria)
    ]));
    contenido.appendChild(h("p", { clase: "pie-resultado", texto: t.pie }));
    if (E.estadoGeneral().habilitado) contenido.appendChild(lineaEstadoEmail(registro.id));

    // Barra inferior fija: la cita siempre visible
    seccion.appendChild(contenido);
    seccion.appendChild(h("div", { clase: "cta-zona" }, [
      h("div", { clase: "cta-acciones" }, [cta, h("div", { clase: "cta-secundario" }, [tel, enlacesNorteIA(), aviso])]),
      qr ? h("figure", { clase: "qr" }, [qr, h("figcaption", { texto: T.escaneaQR })]) : null
    ]));

    mostrar(seccion, "resultado");
    if (animables.length) animarCifras(animables, seccion);
    refrescarEmail();
  }

  // ---------- Estado del email en pantalla ----------

  function lineaEstadoEmail(registroId) {
    return h("p", { clase: "estado-email", "data-email-registro": registroId, "data-base": "estado-email", role: "status" });
  }

  function pintarEstadoEmail(el) {
    var id = el.getAttribute("data-email-registro");
    var base = el.getAttribute("data-base") || "estado-email";
    var compacto = base !== "estado-email";
    var reg = A.obtener(id) || (estado.registro && estado.registro.id === id ? estado.registro : null);
    if (!reg) { el.textContent = ""; return; }
    var r = E.resumenRegistro(reg);
    el.textContent = "";
    el.className = base + " " + (r.clase || "");
    el.appendChild(h("span", { texto: r.texto + (compacto && r.antiguo ? " ⚠ +24 h" : "") }));
    if (compacto) return;
    if (r.clase === "ok") el.appendChild(h("span", { clase: "ayuda", title: T.ayudaEnviado, texto: "(" + T.ayudaEnviado + ")" }));
    if (r.pendiente && navigator.onLine === false) el.appendChild(h("span", { texto: "· " + T.sinConexionEmail }));
  }

  function refrescarEmail() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-email-registro]"), pintarEstadoEmail);
    var contador = document.querySelector("[data-email-contador]");
    if (contador) {
      var eg = E.estadoGeneral();
      var c = E.contarPendientes();
      contador.textContent = eg.habilitado && c.total > 0
        ? "✉ " + c.total + (c.total === 1 ? " envío pendiente" : " envíos pendientes") + (c.antiguos ? " (⚠ +24 h)" : "")
        : "";
    }
    if (estado.pantalla === "historial") pintarCabeceraHistorial();
  }

  // ---------- Resumen ----------

  function textoResumenDe(registro) {
    var n = nichoPorId(registro.nicho);
    if (!n) return "Visita " + registro.id + " (sector " + registro.nicho + " no disponible en esta versión)";
    try { return M.textoResumen(n, registro, CONFIG); }
    catch (e) { console.error(e); return "No se pudo generar el resumen de esta visita."; }
  }

  function copiarTexto(texto) {
    function alternativa() {
      var ta = h("textarea", { clase: "seleccionable", readonly: true, estilo: "position:fixed;left:-9999px;top:0;opacity:0" });
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, texto.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }).catch(function () { return alternativa(); });
    }
    return Promise.resolve(alternativa());
  }

  function descargarCSV() {
    var lista = A.leer();
    var csv = M.generarCSV(lista);
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = h("a", { href: url, download: "estimaciones-norteia-" + M.fechaArchivo(new Date().toISOString()) + ".csv" });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function detalleEmail(registro) {
    var revs = E.detalle(registro);
    if (!revs.length) return h("div", { clase: "detalle-email" }, [h("p", { texto: E.resumenRegistro(registro).texto })]);
    var cont = h("div", { clase: "detalle-email" });
    revs.forEach(function (rev) {
      cont.appendChild(h("h2", { texto: "Email · revisión " + rev.revision + " (" + (rev.tipo || "") + ")" }));
      cont.appendChild(h("ul", {}, rev.destinos.map(function (x) {
        var partes = [x.nombre + ": " + x.estado.replace("_", " ")];
        partes.push("intentos " + (x.intentos || 0));
        if (x.aceptadoEn) partes.push("aceptado " + M.fmtFecha(x.aceptadoEn));
        if (x.sinRuta && x.estado !== "enviado") partes.push("sin plantilla configurada");
        if (x.siguienteIntento && x.estado === "pendiente") partes.push("próximo intento " + M.fmtFecha(x.siguienteIntento));
        if (x.ultimoError) partes.push("error: " + x.ultimoError);
        return h("li", { texto: partes.join(" · ") });
      })));
    });
    return cont;
  }

  function mostrarResumen(registro, origen) {
    var texto = textoResumenDe(registro);
    var confirmacion = h("span", { clase: "confirmacion", role: "status" });
    var botones = [
      boton(T.copiar, "boton-principal", function () {
        copiarTexto(texto).then(function (ok) {
          confirmacion.textContent = ok ? T.copiado : "";
          setTimeout(function () { confirmacion.textContent = ""; }, 2000);
        });
      }),
      typeof navigator.share === "function" ? boton(T.compartir, "boton-secundario", function () {
        navigator.share({ title: (nichoPorId(registro.nicho) || {}).nombre || "Estimación NorteIA", text: texto }).catch(function () { /* cancelado */ });
      }) : null,
      origen === "resultado" ? boton(T.descargarCSV, "boton-secundario", descargarCSV) : null,
      origen === "resultado"
        ? boton(T.volverResultado, "boton-secundario", function () { if (libre()) mostrarResultado(); })
        : boton(T.volver, "boton-secundario", function () { if (libre()) mostrarHistorial(); }),
      origen === "resultado" ? boton(T.nuevaAuditoria, "boton-discreto", nuevaAuditoria) : null,
      confirmacion
    ];
    var seccion = h("section", { clase: "pantalla resumen" }, [
      h("div", { clase: "cabecera-pantalla" }, [h("h1", { texto: T.resumen, tabindex: "-1", "data-foco": "1" })]),
      origen === "resultado" && !estado.guardado ? h("p", { clase: "aviso error", role: "alert", texto: T.noGuardado }) : null,
      h("pre", { clase: "resumen-texto seleccionable", tabindex: "0", texto: texto }),
      origen === "historial" ? detalleEmail(registro) : null,
      h("div", { clase: "botonera" }, botones),
      origen === "resultado" && E.estadoGeneral().habilitado ? lineaEstadoEmail(registro.id) : null
    ]);
    mostrar(seccion, "resumen");
    refrescarEmail();
  }

  // ---------- Historial (oculto: 5 toques al logo) ----------

  function pintarCabeceraHistorial() {
    var el = document.querySelector("[data-estado-general]");
    if (!el) return;
    var eg = E.estadoGeneral();
    var c = E.contarPendientes();
    var texto;
    if (!eg.habilitado) texto = "Envío por email desactivado (config). Las visitas quedan pendientes y se enviarán al activarlo.";
    else if (!eg.configOk) texto = "Email sin configurar: " + eg.motivo + ".";
    else if (eg.cuotaAgotada) texto = "Cuota de email agotada; resumen guardado. Revisa el panel de EmailJS y pulsa «Reintentar pendientes».";
    else if (eg.otraPestana) texto = "Hay otra pestaña de la app abierta: ciérrala para enviar desde aquí.";
    else texto = eg.trabajando ? "Email: enviando…" : "Envío por email activo.";
    el.textContent = "";
    el.appendChild(h("strong", { texto: texto }));
    if (c.total) el.appendChild(document.createTextNode(" · " + c.total + " con email pendiente" + (c.antiguos ? " · ⚠ " + c.antiguos + " llevan más de 24 h sin enviarse" : "")));
    if (!eg.persistente) el.appendChild(h("span", { clase: "aviso error", texto: " " + T.noGuardado }));
    var btn = document.querySelector("[data-reintentar]");
    if (btn) btn.hidden = !(eg.habilitado && c.total > 0);
  }

  function mostrarHistorial() {
    var lista = A.leer().slice().sort(function (a, b) { return (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0); });
    var nichosEnLista = [];
    lista.forEach(function (r) { if (nichosEnLista.indexOf(r.nicho) < 0) nichosEnLista.push(r.nicho); });
    if (estado.filtro !== "todos" && nichosEnLista.indexOf(estado.filtro) < 0) estado.filtro = "todos";

    var filtros = null;
    if (nichosEnLista.length > 1) {
      filtros = h("div", { clase: "filtros", role: "group", "aria-label": "Filtrar por sector" });
      ["todos"].concat(nichosEnLista).forEach(function (id) {
        var n = nichoPorId(id);
        filtros.appendChild(h("button", {
          type: "button", clase: "filtro", "aria-pressed": String(estado.filtro === id),
          onclick: function () { estado.filtro = id; mostrarHistorial(); }
        }, id === "todos" ? [T.todos] : [n ? icono(n.icono, "icono-mini") : null, n ? n.nombre : id]));
      });
    }

    var visibles = lista.filter(function (r) { return estado.filtro === "todos" || r.nicho === estado.filtro; });
    var ul = h("ul", { clase: "lista-historial" });
    if (!visibles.length) ul.appendChild(h("li", { clase: "vacio", texto: T.sinAuditorias }));
    visibles.forEach(function (r) {
      var n = nichoPorId(r.nicho);
      var c = r.calculo || {};
      ul.appendChild(h("li", {}, [h("button", {
        type: "button", clase: "fila-historial",
        onclick: function () { if (libre()) mostrarResumen(A.obtener(r.id) || r, "historial"); }
      }, [
        h("span", { clase: "insignia" }, [n ? icono(n.icono, "icono-mini") : null, n ? n.nombre : r.nicho]),
        h("span", { texto: M.fmtFecha(r.fecha) }),
        h("span", { texto: r.nombreCliente || "Sin nombre" }),
        h("span", { clase: "cifras-fila", texto: M.fmtEntero(c.horasAno) + " h / " + M.fmtEuros(c.eurosRecuperables) }),
        h("span", { clase: "email-fila", "data-email-registro": r.id, "data-base": "email-fila" })
      ])]));
    });

    var seccion = h("section", { clase: "pantalla historial" }, [
      h("div", { clase: "cabecera-pantalla" }, [
        boton([icono("arrow-left"), h("span", { texto: T.volver })], "boton-atras", function () { if (libre()) mostrarBienvenida(); }),
        h("h1", { texto: T.historial + " (" + lista.length + ")", tabindex: "-1", "data-foco": "1" })
      ]),
      h("p", { clase: "estado-general-email", "data-estado-general": "1", role: "status" }),
      filtros,
      ul,
      h("div", { clase: "botonera", estilo: "margin-top:14px" }, [
        boton(T.descargarCSVTodo, "boton-principal", descargarCSV, { disabled: !lista.length }),
        boton(T.reintentar, "boton-secundario", function () {
          if (!libre()) return;
          E.reintentarPendientes();
          refrescarEmail();
        }, { "data-reintentar": "1", hidden: true }),
        boton(T.borrarHistorial, "boton-peligro", borrarHistorial, { disabled: !lista.length })
      ])
    ]);
    mostrar(seccion, "historial");
    refrescarEmail();
  }

  function borrarHistorial() {
    if (!libre()) return;
    var total = A.leer().length;
    var pendientes = E.contarPendientes().total;
    confirmar(T.borrarPaso1, [
      { texto: T.cancelar, clase: "boton-secundario", valor: false },
      { texto: T.siBorrar, clase: "boton-peligro", valor: true }
    ]).then(function (paso1) {
      if (!paso1) return null;
      var texto = f(T.borrarPaso2, { n: total }) + (pendientes ? "\n" + f(T.borrarPendientes, { n: pendientes }) : "");
      return confirmar(texto, [
        { texto: T.cancelar, clase: "boton-secundario", valor: false },
        { texto: T.siBorrar, clase: "boton-peligro", valor: true }
      ]);
    }).then(function (paso2) {
      if (!paso2) return;
      E.cancelarTodo();
      A.borrarTodo();
      estado.filtro = "todos";
      mostrarHistorial();
    });
  }

  // ---------- Arranque ----------

  function arrancar() {
    M.validarConfigGlobal(CONFIG).forEach(function (a) { console.warn("CONFIG: " + a); });
    if (String(CONFIG.enlaceCal || "").indexOf("PENDIENTE") >= 0) console.warn("CONFIG.enlaceCal contiene PENDIENTE: pon el enlace real de Cal.com");
    var eg = E.estadoGeneral();
    if (eg.habilitado && !eg.configOk) console.warn("Email habilitado pero sin configurar: " + eg.motivo);

    E.suscribir(refrescarEmail);
    window.addEventListener("online", refrescarEmail);
    window.addEventListener("offline", refrescarEmail);

    cargarNichos().then(function () {
      mostrarBienvenida();
      E.iniciar();
    }).catch(function (e) {
      console.error(e);
      raizApp.textContent = "Error al cargar la aplicación. Recarga la página.";
    });

    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("sw.js").catch(function (e) { console.warn("Service worker no registrado", e); });
    }
  }

  arrancar();
})();
