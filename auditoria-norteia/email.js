/*
 * ENVÍO AUTOMÁTICO DE AUDITORÍAS POR EMAIL (EmailJS, API REST, sin SDK ni CDN).
 *
 * - La cola vive DENTRO de cada registro del historial (registro.email.revisiones[]),
 *   así no hay una segunda copia que se desincronice.
 * - Cada destinatario (Victor, Luis) tiene su propio estado: pendiente | enviando | enviado | requiere_revision.
 * - "enviado" solo tras un 200 de EmailJS (= aceptado por el servicio; NO confirma la entrega en bandeja).
 * - Reintentos con la app abierta o al volver a abrirla. Sin Background Sync.
 * - Una sola petición a la vez, separadas por intervaloMinimoMs. Un solo "trabajador" entre pestañas.
 *
 * app.js solo llama a: prepararRegistro, procesar, reintentarPendientes, cancelarTodo,
 * resumenRegistro, contarPendientes, estadoGeneral, detalle, suscribir, iniciar.
 */
(function (raiz) {
  "use strict";

  var URL_ENVIO = "https://api.emailjs.com/api/v1.0/email/send";
  var CLAVE_ESTADO = "norteia_email_estado_v1";
  var CLAVE_LIDER = "norteia_email_lider_v1";
  var NOMBRE_BLOQUEO = "norteia-email-cola";
  var LIMITE_BYTES = 45 * 1024;          // por debajo de los 50 KB del plan Free
  var MARGEN_RECUPERACION_MS = 30000;    // "enviando" huérfano: plazo de intento + 30 s
  var LIDER_CADUCA_MS = 60000;
  var AVISO_ANTIGUO_MS = 24 * 3600 * 1000;
  var REINTENTO_OTRA_PESTANA_MS = 30000;
  var PLACEHOLDER = /PENDIENTE|xxxx|yyyy|TU_|EJEMPLO|RELLENAR/i;

  var DEFECTOS = {
    habilitado: false,
    proveedor: "emailjs",
    serviceId: "",
    publicKey: "",
    destinatarios: [],
    timeoutMs: 20000,
    intervaloMinimoMs: 1500,
    reintentosMinutos: [1, 5, 15, 60, 360],
    capturarContacto: false
  };

  function idValido(v) {
    return typeof v === "string" && v.trim().length >= 3 && !PLACEHOLDER.test(v);
  }

  function iso(ms) { return new Date(ms).toISOString(); }

  function unaLinea(t) { return String(t == null ? "" : t).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim(); }

  // FNV-1a 32 bits: huella del contenido para detectar cambios
  function huella(obj) {
    var s = JSON.stringify(obj);
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }

  function bytesUtf8(texto) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(texto).length;
    return unescape(encodeURIComponent(texto)).length;
  }

  function parseRetryAfter(valor, ahora) {
    if (!valor) return null;
    var seg = Number(valor);
    if (isFinite(seg) && seg >= 0) return Math.min(seg * 1000, 6 * 3600 * 1000);
    var fecha = Date.parse(valor);
    if (isFinite(fecha)) return Math.max(0, Math.min(fecha - ahora, 6 * 3600 * 1000));
    return null;
  }

  function crearEmail(opciones) {
    var d = Object.assign({
      config: function () { return raiz.CONFIG || {}; },
      almacen: raiz.AlmacenNorteIA,
      fetch: function (url, init) { return raiz.fetch(url, init); },
      ahora: function () { return Date.now(); },
      esperar: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); },
      programar: function (fn, ms) { return setTimeout(fn, ms); },
      cancelarProgramado: function (t) { clearTimeout(t); },
      temporizador: function (fn, ms) { return setTimeout(fn, ms); },
      cancelarTemporizador: function (t) { clearTimeout(t); },
      aleatorio: Math.random,
      locks: raiz.navigator && raiz.navigator.locks ? raiz.navigator.locks : null
    }, opciones || {});

    var local = {
      enCurso: null,
      otraVuelta: false,
      temporizador: null,
      controlador: null,
      ultimoInicio: -Infinity,
      generacion: 0,
      otraPestana: false
    };
    var idPestana = "p" + Math.floor(d.aleatorio() * 1e9).toString(36) + Date.now().toString(36);
    var oyentes = [];

    function notificar() {
      oyentes.slice().forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    }

    function suscribir(fn) {
      oyentes.push(fn);
      return function () { oyentes = oyentes.filter(function (x) { return x !== fn; }); };
    }

    function cfg() {
      var c = (d.config() || {}).email || {};
      var r = Object.assign({}, DEFECTOS, c);
      if (!Array.isArray(r.reintentosMinutos) || r.reintentosMinutos.length === 0) r.reintentosMinutos = DEFECTOS.reintentosMinutos;
      if (!(r.timeoutMs > 0)) r.timeoutMs = DEFECTOS.timeoutMs;
      if (!(r.intervaloMinimoMs >= 1000)) r.intervaloMinimoMs = DEFECTOS.intervaloMinimoMs;
      return r;
    }

    function validarConfig() {
      var c = cfg();
      var motivos = [];
      if (c.proveedor !== "emailjs") motivos.push("proveedor no soportado");
      if (!idValido(c.serviceId)) motivos.push("falta Service ID");
      if (!idValido(c.publicKey)) motivos.push("falta Public Key");
      var dest = Array.isArray(c.destinatarios) ? c.destinatarios : [];
      if (dest.length === 0) motivos.push("no hay destinatarios");
      var ids = {};
      dest.forEach(function (x) {
        if (!x || !x.id) { motivos.push("destinatario sin id"); return; }
        if (ids[x.id]) motivos.push("id de destinatario repetido: " + x.id);
        ids[x.id] = true;
        if (!idValido(x.templateId)) motivos.push("falta Template ID de " + (x.nombre || x.id));
      });
      return { ok: motivos.length === 0, motivo: motivos.join("; ") };
    }

    function nuevasRutas() {
      var c = cfg();
      var dest = Array.isArray(c.destinatarios) ? c.destinatarios : [];
      var vistos = {};
      return dest.filter(function (x) {
        if (!x || !x.id || vistos[x.id]) return false;
        vistos[x.id] = true;
        return true;
      }).map(function (x) {
        return {
          id: x.id,
          nombre: x.nombre || x.id,
          templateId: idValido(x.templateId) ? x.templateId : null,
          serviceId: idValido(c.serviceId) ? c.serviceId : null,
          estado: "pendiente",
          intentos: 0,
          siguienteIntento: null,
          aceptadoEn: null,
          ultimoError: null,
          tipoError: null,
          intentoIniciadoEn: null
        };
      });
    }

    function conCabecera(instantanea, n) {
      return Object.assign({}, instantanea, {
        revision: String(n),
        tipo_envio: n === 1 ? "INICIAL" : "ACTUALIZACIÓN"
      });
    }

    function marcarSiDemasiadoGrande(rev) {
      var aprox = bytesUtf8(JSON.stringify({ service_id: "service_xxxxxxxxxxxx", template_id: "template_xxxxxxxxxxxx",
        user_id: "xxxxxxxxxxxxxxxxxxxxxx", template_params: rev.instantanea }));
      if (aprox <= LIMITE_BYTES) return false;
      rev.destinos.forEach(function (x) {
        if (x.estado === "enviado") return;
        x.estado = "requiere_revision";
        x.tipoError = "tamano";
        x.ultimoError = "Resumen demasiado grande para el plan gratuito (" + Math.ceil(aprox / 1024) + " KB). Copia el resumen a mano.";
      });
      return true;
    }

    /*
     * Crea o actualiza la cola de un registro ANTES de guardarlo (una sola escritura la hace app.js).
     * - Mismo contenido -> no hace nada (volver al resultado, doble toque o recarga no duplican).
     * - Contenido nuevo y la última revisión sin tocar -> sustituye su instantánea.
     * - Contenido nuevo y algún destino ya aceptó o está enviando -> revisión siguiente (ACTUALIZACIÓN).
     * Devuelve true si hay trabajo nuevo.
     */
    function prepararRegistro(registro, instantanea) {
      // Con el email desactivado no se crea ninguna cola (nada se enviará al activarlo)
      if (!cfg().habilitado) return false;
      var email = registro.email && Array.isArray(registro.email.revisiones) ? registro.email : { revisiones: [] };
      registro.email = email;
      var h = huella(instantanea);
      var revs = email.revisiones;
      var ultima = revs[revs.length - 1];
      var ahoraIso = iso(d.ahora());
      if (ultima && ultima.huellaContenido === h) return false;

      var tocada = ultima && ultima.destinos.some(function (x) { return x.estado === "enviado" || x.estado === "enviando"; });
      if (ultima && !tocada) {
        ultima.huellaContenido = h;
        ultima.instantanea = conCabecera(instantanea, ultima.revision);
        ultima.actualizadaEn = ahoraIso;
        if (ultima.destinos.length === 0) ultima.destinos = nuevasRutas();
        ultima.destinos.forEach(function (x) {
          x.estado = "pendiente";
          x.siguienteIntento = null;
          x.ultimoError = null;
          x.tipoError = null;
        });
        marcarSiDemasiadoGrande(ultima);
        return true;
      }

      var n = ultima ? ultima.revision + 1 : 1;
      var rev = {
        revision: n,
        creadaEn: ahoraIso,
        huellaContenido: h,
        instantanea: conCabecera(instantanea, n),
        destinos: nuevasRutas()
      };
      revs.push(rev);
      marcarSiDemasiadoGrande(rev);
      return true;
    }

    // ---------- Estado global (cuota, 429 seguidos) ----------

    function estadoGlobal() {
      return (d.almacen.leerValor(CLAVE_ESTADO)) || {};
    }
    function guardarEstadoGlobal(e) {
      d.almacen.escribirValor(CLAVE_ESTADO, e);
    }

    // ---------- Recuperación y rutas ----------

    function recuperarYCompletar(lista) {
      var c = cfg();
      var ahora = d.ahora();
      var cambios = false;
      var configOk = validarConfig().ok;
      lista.forEach(function (reg) {
        var revs = (reg.email && reg.email.revisiones) || [];
        revs.forEach(function (rev) {
          if (rev.destinos.length === 0 && configOk) { rev.destinos = nuevasRutas(); cambios = true; }
          rev.destinos.forEach(function (x) {
            if (x.estado === "enviando") {
              var inicio = Date.parse(x.intentoIniciadoEn) || 0;
              if (ahora - inicio > c.timeoutMs + MARGEN_RECUPERACION_MS) {
                x.estado = "pendiente";
                x.tipoError = "red";
                x.ultimoError = "Intento interrumpido (cierre o recarga). Si llegó, puede recibirse duplicado.";
                x.siguienteIntento = null;
                x.intentoIniciadoEn = null;
                cambios = true;
              }
            }
            if (x.estado === "pendiente") {
              // Solo se completan rutas vacías: una ruta ya asignada nunca se cambia en silencio.
              var conf = (c.destinatarios || []).filter(function (y) { return y && y.id === x.id; })[0];
              if (!x.templateId && conf && idValido(conf.templateId)) { x.templateId = conf.templateId; cambios = true; }
              if (!x.serviceId && idValido(c.serviceId)) { x.serviceId = c.serviceId; cambios = true; }
            }
          });
        });
      });
      return cambios;
    }

    function fechaRegistro(reg) { return Date.parse(reg.fecha) || 0; }

    // Siguiente destino a enviar. Las revisiones de una visita se envían en orden.
    function siguienteTrabajo(lista, ahora, cuotaAgotada) {
      var proximo = Infinity;
      var ordenados = lista.slice().sort(function (a, b) { return fechaRegistro(a) - fechaRegistro(b); });
      for (var i = 0; i < ordenados.length; i++) {
        var reg = ordenados[i];
        var revs = (reg.email && reg.email.revisiones) || [];
        var rev = null;
        for (var j = 0; j < revs.length; j++) {
          if (revs[j].destinos.some(function (x) { return x.estado === "pendiente" || x.estado === "enviando"; })) { rev = revs[j]; break; }
        }
        if (!rev) continue;
        if (rev.destinos.some(function (x) { return x.estado === "enviando"; })) continue;
        for (var k = 0; k < rev.destinos.length; k++) {
          var x = rev.destinos[k];
          if (x.estado !== "pendiente" || !x.templateId || !x.serviceId) continue;
          if (cuotaAgotada) continue;
          var t = x.siguienteIntento ? Date.parse(x.siguienteIntento) : 0;
          if (!(t > ahora)) return { trabajo: { registroId: reg.id, revision: rev.revision, destinoId: x.id } };
          proximo = Math.min(proximo, t);
        }
      }
      return { trabajo: null, proximo: proximo };
    }

    function localizar(lista, t) {
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].id !== t.registroId) continue;
        var revs = (lista[i].email && lista[i].email.revisiones) || [];
        for (var j = 0; j < revs.length; j++) {
          if (revs[j].revision !== t.revision) continue;
          for (var k = 0; k < revs[j].destinos.length; k++) {
            if (revs[j].destinos[k].id === t.destinoId) return { registro: lista[i], rev: revs[j], destino: revs[j].destinos[k] };
          }
        }
      }
      return null;
    }

    // ---------- Transporte ----------

    function backoff(intentos, c) {
      var lista = c.reintentosMinutos;
      var idx = Math.min(Math.max(intentos, 1) - 1, lista.length - 1);
      var ms = lista[idx] * 60000;
      return ms + Math.min(30000, ms * 0.1) * d.aleatorio();
    }

    function textoBreve(texto, c) {
      var t = unaLinea(texto).slice(0, 120);
      [c.publicKey, c.serviceId].forEach(function (s) { if (s) t = t.split(s).join("…"); });
      return t;
    }

    function clasificar(status, texto, retryAfterMs, c) {
      var t = String(texto || "").toLowerCase();
      var esTamano = /size|kb\b|bytes|too large|demasiado/.test(t);
      var esCuota = !esTamano && /(quota|cuota|monthly|per month|plan limit|limit (has been )?(reached|exceeded)|limit of requests|upgrade)/.test(t);
      if (status === 429) {
        if (esCuota && /(month|quota|plan|upgrade|cuota)/.test(t)) return { tipo: "cuota", mensaje: "Cuota de email agotada; resumen guardado" };
        return { tipo: "temporal", es429: true, retryAfterMs: retryAfterMs, mensaje: "Límite temporal del servicio (HTTP 429)" };
      }
      if (status >= 500) return { tipo: "temporal", retryAfterMs: retryAfterMs, mensaje: "Error del servicio de email (HTTP " + status + ")" };
      if (status >= 400) {
        if (esCuota) return { tipo: "cuota", mensaje: "Cuota de email agotada; resumen guardado" };
        return { tipo: "config", mensaje: "HTTP " + status + (texto ? ": " + textoBreve(texto, c) : "") };
      }
      return { tipo: "temporal", retryAfterMs: retryAfterMs, mensaje: "Respuesta inesperada del servicio (HTTP " + status + ")" };
    }

    function transportar(cuerpo, c, gen) {
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      local.controlador = ctrl;
      var porTimeout = false;
      var temp = d.temporizador(function () { porTimeout = true; if (ctrl) ctrl.abort(); }, c.timeoutMs);
      function fin(r) {
        d.cancelarTemporizador(temp);
        if (local.controlador === ctrl) local.controlador = null;
        return r;
      }
      return Promise.resolve().then(function () {
        // Nunca mode: "no-cors": una respuesta opaca no confirma la aceptación.
        return d.fetch(URL_ENVIO, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: cuerpo,
          signal: ctrl ? ctrl.signal : undefined
        });
      }).then(function (resp) {
        if (resp.status === 200) return fin({ ok: true });
        var ra = parseRetryAfter(resp.headers && resp.headers.get ? resp.headers.get("Retry-After") : null, d.ahora());
        return Promise.resolve().then(function () { return resp.text(); }).catch(function () { return ""; })
          .then(function (texto) { return fin(clasificar(resp.status, String(texto || "").slice(0, 300), ra, c)); });
      }).catch(function () {
        if (gen !== local.generacion) return fin({ ok: false, tipo: "cancelado" });
        if (porTimeout) return fin({ ok: false, tipo: "red", mensaje: "Tiempo de espera agotado (" + Math.round(c.timeoutMs / 1000) + " s). Si el servicio lo aceptó, puede recibirse duplicado." });
        return fin({ ok: false, tipo: "red", mensaje: "Sin conexión o sin acceso a internet" });
      });
    }

    function aplicar(destino, r, c) {
      var ahora = d.ahora();
      destino.intentoIniciadoEn = null;
      if (r.ok) {
        destino.estado = "enviado";
        destino.aceptadoEn = iso(ahora);
        destino.ultimoError = null;
        destino.tipoError = null;
        destino.siguienteIntento = null;
        var g = estadoGlobal();
        if (g.consecutivos429) { g.consecutivos429 = 0; guardarEstadoGlobal(g); }
        return;
      }
      if (r.tipo === "cancelado") {
        destino.estado = "pendiente";
        destino.siguienteIntento = null;
        return;
      }
      if (r.tipo === "config") {
        destino.estado = "requiere_revision";
        destino.tipoError = "config";
        destino.ultimoError = r.mensaje;
        destino.siguienteIntento = null;
        return;
      }
      if (r.tipo === "cuota") {
        destino.estado = "pendiente";
        destino.tipoError = "cuota";
        destino.ultimoError = r.mensaje;
        destino.siguienteIntento = null;
        var ge = estadoGlobal();
        ge.cuotaAgotadaEn = iso(ahora);
        guardarEstadoGlobal(ge);
        return;
      }
      var mensaje = r.mensaje;
      var gl = estadoGlobal();
      if (r.es429) {
        gl.consecutivos429 = (gl.consecutivos429 || 0) + 1;
        guardarEstadoGlobal(gl);
        if (gl.consecutivos429 >= 3) mensaje += ". Si persiste, revisa el panel de EmailJS";
      }
      var espera = r.retryAfterMs != null ? Math.max(r.retryAfterMs, 1000) : backoff(destino.intentos, c);
      destino.estado = "pendiente";
      destino.tipoError = r.tipo;
      destino.ultimoError = mensaje;
      destino.siguienteIntento = iso(ahora + espera);
    }

    // ---------- Bucle de trabajo ----------

    function programar(proximo) {
      if (local.temporizador) { d.cancelarProgramado(local.temporizador); local.temporizador = null; }
      if (!isFinite(proximo)) return;
      var ms = Math.min(Math.max(0, proximo - d.ahora()) + 250, 2147000000);
      local.temporizador = d.programar(function () { local.temporizador = null; procesar(); }, ms);
    }

    function latido() {
      if (d.locks) return true;
      return tomarLiderazgo();
    }

    function tomarLiderazgo() {
      var ahora = d.ahora();
      var l = d.almacen.leerValor(CLAVE_LIDER);
      if (l && l.id !== idPestana && ahora - l.latido < LIDER_CADUCA_MS) return false;
      if (!d.almacen.escribirValor(CLAVE_LIDER, { id: idPestana, latido: ahora })) return true; // sin almacenamiento: cola solo en memoria
      var c = d.almacen.leerValor(CLAVE_LIDER);
      return !!c && c.id === idPestana;
    }

    function soltarLiderazgo() {
      var l = d.almacen.leerValor(CLAVE_LIDER);
      if (l && l.id === idPestana) d.almacen.escribirValor(CLAVE_LIDER, null);
    }

    function bucle(gen) {
      var c = cfg();
      function paso() {
        if (gen !== local.generacion || !c.habilitado) return Promise.resolve();
        var lista = d.almacen.leer();
        if (recuperarYCompletar(lista)) { d.almacen.escribir(lista); notificar(); }
        if (!validarConfig().ok) return Promise.resolve();
        if (estadoGlobal().cuotaAgotadaEn) return Promise.resolve();
        var ahora = d.ahora();
        var sel = siguienteTrabajo(lista, ahora, false);
        if (!sel.trabajo) { programar(sel.proximo); return Promise.resolve(); }
        var espera = local.ultimoInicio + c.intervaloMinimoMs - ahora;
        if (espera > 0) return d.esperar(espera).then(paso);
        if (!latido()) { local.otraPestana = true; notificar(); programar(ahora + REINTENTO_OTRA_PESTANA_MS); return Promise.resolve(); }

        var ref = localizar(lista, sel.trabajo);
        var cuerpo = JSON.stringify({
          service_id: ref.destino.serviceId,
          template_id: ref.destino.templateId,
          user_id: c.publicKey,
          template_params: ref.rev.instantanea
        });
        var bytes = bytesUtf8(cuerpo);
        if (bytes > LIMITE_BYTES) {
          ref.destino.estado = "requiere_revision";
          ref.destino.tipoError = "tamano";
          ref.destino.ultimoError = "Resumen demasiado grande para el plan gratuito (" + Math.ceil(bytes / 1024) + " KB). Copia el resumen a mano.";
          d.almacen.escribir(lista);
          notificar();
          return paso();
        }
        ref.destino.estado = "enviando";
        ref.destino.intentos = (ref.destino.intentos || 0) + 1;
        ref.destino.intentoIniciadoEn = iso(ahora);
        d.almacen.escribir(lista);
        notificar();
        local.ultimoInicio = d.ahora();

        return transportar(cuerpo, c, gen).then(function (r) {
          var lista2 = d.almacen.leer();
          var ref2 = localizar(lista2, sel.trabajo);
          if (!ref2) return paso(); // el registro se borró mientras tanto
          aplicar(ref2.destino, r, c);
          d.almacen.escribir(lista2);
          notificar();
          if (r.tipo === "cuota" || r.tipo === "cancelado") return;
          return paso();
        });
      }
      return paso();
    }

    function conBloqueo(fn) {
      if (d.locks && d.locks.request) {
        return Promise.resolve(d.locks.request(NOMBRE_BLOQUEO, { ifAvailable: true }, function (lock) {
          if (!lock) {
            local.otraPestana = true;
            notificar();
            programar(d.ahora() + REINTENTO_OTRA_PESTANA_MS);
            return null;
          }
          local.otraPestana = false;
          return fn();
        }));
      }
      if (!tomarLiderazgo()) {
        local.otraPestana = true;
        notificar();
        programar(d.ahora() + REINTENTO_OTRA_PESTANA_MS);
        return Promise.resolve();
      }
      local.otraPestana = false;
      return fn();
    }

    // Arranca el procesador (después de guardar, al iniciar, al volver la conexión o la app a primer plano)
    function procesar() {
      if (local.enCurso) { local.otraVuelta = true; return local.enCurso; }
      var gen = local.generacion;
      local.enCurso = Promise.resolve()
        .then(function () { return conBloqueo(function () { return bucle(gen); }); })
        .catch(function (e) { console.error("Email: error en el procesador", e); })
        .then(function () {
          local.enCurso = null;
          notificar();
          if (local.otraVuelta) { local.otraVuelta = false; return procesar(); }
        });
      return local.enCurso;
    }

    function reintentarPendientes() {
      var g = estadoGlobal();
      delete g.cuotaAgotadaEn;
      g.consecutivos429 = 0;
      guardarEstadoGlobal(g);
      var lista = d.almacen.leer();
      lista.forEach(function (reg) {
        ((reg.email && reg.email.revisiones) || []).forEach(function (rev) {
          rev.destinos.forEach(function (x) {
            if (x.estado === "requiere_revision" && x.tipoError !== "tamano") {
              x.estado = "pendiente";
              x.tipoError = null;
              x.ultimoError = null;
            }
            if (x.estado === "pendiente") x.siguienteIntento = null;
          });
        });
      });
      recuperarYCompletar(lista);
      d.almacen.escribir(lista);
      notificar();
      return procesar();
    }

    // Al volver la conexión solo se adelantan los pendientes por fallo de red
    function alRecuperarConexion() {
      if (estadoGlobal().cuotaAgotadaEn) return procesar();
      var lista = d.almacen.leer();
      var cambios = false;
      lista.forEach(function (reg) {
        ((reg.email && reg.email.revisiones) || []).forEach(function (rev) {
          rev.destinos.forEach(function (x) {
            if (x.estado === "pendiente" && x.tipoError === "red" && x.siguienteIntento) { x.siguienteIntento = null; cambios = true; }
          });
        });
      });
      if (cambios) d.almacen.escribir(lista);
      return procesar();
    }

    // Para "Borrar historial": cancela lo no iniciado y aborta el intento activo si es posible.
    function cancelarTodo() {
      local.generacion++;
      if (local.temporizador) { d.cancelarProgramado(local.temporizador); local.temporizador = null; }
      if (local.controlador) { try { local.controlador.abort(); } catch (e) { /* nada */ } }
    }

    // ---------- Lectura de estado para la interfaz ----------

    function destinosDe(registro) {
      var todos = [];
      ((registro.email && registro.email.revisiones) || []).forEach(function (rev) {
        rev.destinos.forEach(function (x) { todos.push(x); });
      });
      return todos;
    }

    function resuelto(x) { return x.estado === "enviado" || x.estado === "no_enviar"; }

    function tienePendientes(registro) {
      var revs = (registro.email && registro.email.revisiones) || [];
      return revs.some(function (rev) {
        return rev.destinos.length === 0 || rev.destinos.some(function (x) { return !resuelto(x); });
      });
    }

    // Lo que quedó en cola con el email desactivado (versiones anteriores) no se envía nunca
    function marcarNoEnviarSiDesactivado() {
      if (cfg().habilitado) return;
      var lista = d.almacen.leer();
      var cambios = false;
      lista.forEach(function (reg) {
        ((reg.email && reg.email.revisiones) || []).forEach(function (rev) {
          rev.destinos.forEach(function (x) {
            if (x.estado === "pendiente" || x.estado === "requiere_revision") {
              x.estado = "no_enviar";
              x.ultimoError = "Creado con el email desactivado: no se envía";
              x.siguienteIntento = null;
              cambios = true;
            }
          });
        });
      });
      if (cambios) d.almacen.escribir(lista);
    }

    function resumenRegistro(registro) {
      var revs = registro && registro.email && registro.email.revisiones;
      if (!revs || revs.length === 0) return { clase: "antiguo", texto: "Sin envío por email", pendiente: false };
      if (destinosDe(registro).every(function (x) { return x.estado === "no_enviar"; })) {
        return { clase: "antiguo", texto: "Email: no enviado (desactivado)", pendiente: false };
      }
      var c = cfg();
      var ultima = revs[revs.length - 1];
      var total = ultima.destinos.length;
      var enviados = ultima.destinos.filter(function (x) { return x.estado === "enviado"; }).length;
      var todos = destinosDe(registro);
      var pendiente = tienePendientes(registro);
      var antiguo = pendiente && revs.some(function (rev) {
        return rev.destinos.some(function (x) { return !resuelto(x); }) && d.ahora() - (Date.parse(rev.creadaEn) || 0) > AVISO_ANTIGUO_MS;
      });
      var r = { pendiente: pendiente, enviados: enviados, total: total, antiguo: antiguo, desactivado: !c.habilitado };
      if (!pendiente) { r.clase = "ok"; r.texto = "Email: enviado (" + enviados + "/" + total + ")"; return r; }
      if (todos.some(function (x) { return x.estado === "enviando"; })) { r.clase = "enviando"; r.texto = "Email: enviando…"; return r; }
      var cuota = todos.some(function (x) { return x.estado === "pendiente" && x.tipoError === "cuota"; }) || !!estadoGlobal().cuotaAgotadaEn;
      var revisar = total === 0 || todos.some(function (x) {
        return x.estado === "requiere_revision" || (x.estado === "pendiente" && (!x.templateId || !x.serviceId));
      }) || (c.habilitado && !validarConfig().ok);
      r.clase = "pendiente";
      if (cuota) { r.texto = "Email: pendiente · Cuota de email agotada; resumen guardado"; r.clase = "revisar"; }
      else if (revisar && c.habilitado) { r.texto = "Email: pendiente · revisar configuración"; r.clase = "revisar"; }
      else if (enviados > 0) r.texto = "Email: pendiente (" + enviados + "/" + total + " enviado)";
      else r.texto = "Email: pendiente";
      return r;
    }

    function contarPendientes(lista) {
      var total = 0;
      var antiguos = 0;
      (lista || d.almacen.leer()).forEach(function (reg) {
        var r = resumenRegistro(reg);
        if (r.pendiente) { total++; if (r.antiguo) antiguos++; }
      });
      return { total: total, antiguos: antiguos };
    }

    function detalle(registro) {
      return ((registro.email && registro.email.revisiones) || []).map(function (rev) {
        return {
          revision: rev.revision,
          tipo: rev.instantanea && rev.instantanea.tipo_envio,
          creadaEn: rev.creadaEn,
          destinos: rev.destinos.map(function (x) {
            return { id: x.id, nombre: x.nombre, estado: x.estado, intentos: x.intentos, aceptadoEn: x.aceptadoEn,
                     ultimoError: x.ultimoError, siguienteIntento: x.siguienteIntento, sinRuta: !x.templateId || !x.serviceId };
          })
        };
      });
    }

    function estadoGeneral() {
      var c = cfg();
      var v = validarConfig();
      return {
        habilitado: !!c.habilitado,
        configOk: v.ok,
        motivo: v.motivo,
        cuotaAgotada: !!estadoGlobal().cuotaAgotadaEn,
        otraPestana: local.otraPestana,
        trabajando: !!local.enCurso,
        persistente: d.almacen.persistente(),
        capturarContacto: !!c.capturarContacto
      };
    }

    function iniciar() {
      if (typeof raiz.addEventListener === "function") {
        raiz.addEventListener("online", function () { alRecuperarConexion(); });
        raiz.addEventListener("pagehide", soltarLiderazgo);
      }
      if (raiz.document && raiz.document.addEventListener) {
        raiz.document.addEventListener("visibilitychange", function () {
          if (raiz.document.visibilityState === "visible") procesar();
        });
      }
      marcarNoEnviarSiDesactivado();
      return procesar();
    }

    return {
      prepararRegistro: prepararRegistro,
      procesar: procesar,
      reintentarPendientes: reintentarPendientes,
      alRecuperarConexion: alRecuperarConexion,
      cancelarTodo: cancelarTodo,
      resumenRegistro: resumenRegistro,
      contarPendientes: contarPendientes,
      detalle: detalle,
      estadoGeneral: estadoGeneral,
      validarConfig: validarConfig,
      suscribir: suscribir,
      iniciar: iniciar,
      _interno: { huella: huella, clasificar: clasificar, siguienteTrabajo: siguienteTrabajo, LIMITE_BYTES: LIMITE_BYTES }
    };
  }

  raiz.crearEmailNorteIA = crearEmail;
  if (raiz.AlmacenNorteIA) raiz.EmailNorteIA = crearEmail();
})(typeof self !== "undefined" ? self : this);
