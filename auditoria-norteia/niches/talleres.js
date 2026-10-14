/*
 * NICHO: TALLERES (estructura lista, SIN RELLENAR).
 * Todo lo marcado [COMPLETAR] lo rellena Victor. Mientras completo sea false,
 * este nicho no se muestra en producción (solo con CONFIG.modoDesarrollo = true).
 * Para activarlo: rellenar, poner completo: true y añadir "talleres" a CONFIG.nichosVisibles.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.talleres = {
  id: "talleres", nombre: "Talleres", icono: "🔧", completo: false,
  tituloApp: "Auditoría rápida de tiempo perdido",                  // [COMPLETAR]
  subtituloBienvenida: "[COMPLETAR]",
  campoNombre: "Nombre del taller (opcional)",
  articuloCliente: "el taller",
  parametros: { costeHora: 14, porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 }, // [COMPLETAR] coste/hora y % para taller
  preguntas: [
    { clave: "tipo", titulo: "Tipo de taller", tipo: "opcion",
      opciones: [ { valor: "mecanica", etiqueta: "Mecánica general" }, { valor: "chapa", etiqueta: "Chapa y pintura" },
                  { valor: "neumaticos", etiqueta: "Neumáticos" }, { valor: "otro", etiqueta: "Otro" } ] },      // [COMPLETAR]
    { clave: "llamadas", titulo: "Llamadas al día (citas, presupuestos, estado del coche)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },                                                                 // [COMPLETAR] marca
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [2, 3, 5] } },
    { clave: "presupuestos", titulo: "Presupuestos que preparan al día", tipo: "slider",
      slider: { min: 0, max: 20, marca: 5 },                                                                  // [COMPLETAR]
      sub: { clave: "minPresupuesto", titulo: "Minutos por presupuesto", opciones: [5, 10, 20] } },
    { clave: "percepcion", titulo: "Horas/día estimadas del equipo en estas tareas", tipo: "opcion",
      nota: "Su sensación, sin calcular",
      opciones: [ { valor: "lt2", etiqueta: "Menos de 2 horas" }, { valor: "2-4", etiqueta: "De 2 a 4 horas" },
                  { valor: "4-6", etiqueta: "De 4 a 6 horas" }, { valor: "gt6", etiqueta: "Más de 6 horas" } ] }
    // [COMPLETAR] resto de preguntas (interés en fuera de horario, software de gestión, etc.)
  ],
  calculo: {
    lineas: [ { cantidad: "llamadas", minutos: "minLlamada" }, { cantidad: "presupuestos", minutos: "minPresupuesto" } ], // [COMPLETAR] añadir más líneas
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
  resumen: { titulo: "AUDITORÍA RÁPIDA NORTEIA - TALLER", etiquetaNombre: "Taller", cabecera: [["tipo", "Tipo"]],
             lineas: [ ["llamadas", "Llamadas al día"], ["presupuestos", "Presupuestos al día"] ] }
};
