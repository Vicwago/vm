/*
 * ALMACÉN LOCAL del historial de visitas (localStorage, clave norteia_auditorias_v1).
 * Si localStorage falla (modo privado, sin espacio), sigue funcionando en memoria
 * durante la sesión y lo indica con persistente() === false. Nunca lanza errores.
 */
(function (raiz) {
  "use strict";

  var CLAVE = "norteia_auditorias_v1";

  function crearAlmacen(obtenerStorage) {
    var memoria = null;      // copia en memoria si la escritura en disco falla
    var persistente = true;
    var copiaCorruptoHecha = false;

    function storage() {
      try { return obtenerStorage(); } catch (e) { return null; }
    }

    function copiar(lista) {
      return JSON.parse(JSON.stringify(lista));
    }

    function leer() {
      if (memoria) return copiar(memoria);
      var s = storage();
      if (!s) { persistente = false; memoria = []; return []; }
      try {
        var texto = s.getItem(CLAVE);
        if (!texto) return [];
        var lista = JSON.parse(texto);
        return Array.isArray(lista) ? lista : [];
      } catch (e) {
        // Datos corruptos: se guardan aparte una vez para no perderlos y se sigue
        if (!copiaCorruptoHecha) {
          copiaCorruptoHecha = true;
          try { s.setItem(CLAVE + "_corrupto_" + Date.now(), s.getItem(CLAVE)); } catch (e2) { /* nada */ }
        }
        return [];
      }
    }

    function escribir(lista) {
      var s = storage();
      try {
        if (!s) throw new Error("sin localStorage");
        s.setItem(CLAVE, JSON.stringify(lista));
        memoria = null;
        persistente = true;
        return true;
      } catch (e) {
        memoria = copiar(lista);
        persistente = false;
        return false;
      }
    }

    // Inserta o sustituye un registro (mismo id) en una sola escritura
    function guardarRegistro(registro) {
      var lista = leer();
      var i = indice(lista, registro.id);
      if (i >= 0) lista[i] = registro; else lista.push(registro);
      return escribir(lista);
    }

    function indice(lista, id) {
      for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return i;
      return -1;
    }

    function obtener(id) {
      var lista = leer();
      var i = indice(lista, id);
      return i >= 0 ? lista[i] : null;
    }

    function borrarTodo() {
      return escribir([]);
    }

    // Valores sueltos (estado del email, etc.). Errores silenciosos.
    function leerValor(clave) {
      var s = storage();
      try { var t = s && s.getItem(clave); return t ? JSON.parse(t) : null; } catch (e) { return null; }
    }
    function escribirValor(clave, valor) {
      var s = storage();
      try {
        if (!s) return false;
        if (valor == null) s.removeItem(clave); else s.setItem(clave, JSON.stringify(valor));
        return true;
      } catch (e) { return false; }
    }

    return {
      CLAVE: CLAVE,
      leer: leer,
      escribir: escribir,
      guardarRegistro: guardarRegistro,
      obtener: obtener,
      indice: indice,
      borrarTodo: borrarTodo,
      leerValor: leerValor,
      escribirValor: escribirValor,
      persistente: function () { return persistente; }
    };
  }

  raiz.crearAlmacenNorteIA = crearAlmacen;
  raiz.AlmacenNorteIA = crearAlmacen(function () { return raiz.localStorage; });
})(typeof self !== "undefined" ? self : this);
