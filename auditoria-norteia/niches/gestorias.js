/*
 * NICHO: GESTORÍAS / ASESORÍAS (estructura lista, SIN RELLENAR).
 * Todo lo marcado [COMPLETAR] lo rellena Victor. Mientras completo sea false,
 * este nicho no se muestra en producción (solo con CONFIG.modoDesarrollo = true).
 * Para activarlo: rellenar, poner completo: true y añadir "gestorias" a CONFIG.nichosVisibles.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.gestorias = {
  id: "gestorias", nombre: "Gestorías", icono: "📑", completo: false,
  tituloApp: "Auditoría rápida de tiempo perdido",                  // [COMPLETAR]
  subtituloBienvenida: "[COMPLETAR]",
  campoNombre: "Nombre de la gestoría (opcional)",
  articuloCliente: "la gestoría",
  parametros: { costeHora: 18, porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 },  // [COMPLETAR]
  preguntas: [
    { clave: "tipo", titulo: "Tipo de despacho", tipo: "opcion",
      opciones: [ { valor: "fiscal", etiqueta: "Fiscal y contable" }, { valor: "laboral", etiqueta: "Laboral" },
                  { valor: "integral", etiqueta: "Integral" }, { valor: "otro", etiqueta: "Otro" } ] },       // [COMPLETAR]
    { clave: "consultas", titulo: "Consultas de clientes al día (llamadas, mails, WhatsApp)", tipo: "slider",
      slider: { min: 0, max: 80, marca: 20 },                                                               // [COMPLETAR]
      sub: { clave: "minConsulta", titulo: "Minutos por consulta", opciones: [3, 5, 10] } },
    { clave: "documentos", titulo: "Documentos que reclaman o reciben al día (facturas, nóminas, recibos)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },                                                               // [COMPLETAR]
      sub: { clave: "minDocumento", titulo: "Minutos por documento", opciones: [2, 5, 10] } },
    { clave: "percepcion", titulo: "Horas/día estimadas del equipo en estas tareas", tipo: "opcion",
      nota: "Su sensación, sin calcular",
      opciones: [ { valor: "lt2", etiqueta: "Menos de 2 horas" }, { valor: "2-4", etiqueta: "De 2 a 4 horas" },
                  { valor: "4-6", etiqueta: "De 4 a 6 horas" }, { valor: "gt6", etiqueta: "Más de 6 horas" } ] }
    // [COMPLETAR] resto de preguntas
  ],
  calculo: {
    lineas: [ { cantidad: "consultas", minutos: "minConsulta" }, { cantidad: "documentos", minutos: "minDocumento" } ],
    percepcion: { clave: "percepcion", rangos: [
      { valor: "lt2", min: 0, max: 2, texto: "menos de 2 horas" },
      { valor: "2-4", min: 2, max: 4, texto: "entre 2 y 4 horas" },
      { valor: "4-6", min: 4, max: 6, texto: "entre 4 y 6 horas" },
      { valor: "gt6", min: 6, max: null, texto: "más de 6 horas" }
    ] }
  },
  resultado: {
    selectorVariante: { clave: "interes", mapa: { /* [COMPLETAR] */ } },
    variantes: {
      A: { titular: "[COMPLETAR] Podéis recuperar {horas} horas y {euros} al año.", subtitulo: "[COMPLETAR]", impulso: "[COMPLETAR]", cta: "Agenda una cita con NorteIA para saber cómo" },
      B: { /* [COMPLETAR] */ },
      C: { /* [COMPLETAR] */ }
    },
    volumenBajo: "[COMPLETAR]",
    contraste: { titulo: "[COMPLETAR]", mayor: "[COMPLETAR]", coincide: "[COMPLETAR]", menor: "[COMPLETAR]" },
    senales: [],
    pie: "[COMPLETAR]"
  },
  resumen: { titulo: "AUDITORÍA RÁPIDA NORTEIA - GESTORÍA", etiquetaNombre: "Gestoría", cabecera: [["tipo", "Tipo"]],
             lineas: [ ["consultas", "Consultas al día"], ["documentos", "Documentos al día"] ] }
};
