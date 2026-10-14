/*
 * NICHO: ACADEMIAS Y AUTOESCUELAS (completo).
 * Tareas medidas: consultas de información, mensajes con familias/alumnos y cobros gestionados a mano.
 * Dolores: no hacer seguimiento a quien pide información y reclamar recibos cada mes.
 * Valores [DECIDIR]: coste/hora, % de ahorro y marcas "habitual" de los sliders.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.academias = {
  id: "academias",
  nombre: "Academias",
  icono: "graduation-cap",
  completo: true,
  tituloApp: "Estimación rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabrá cuánto tiempo y dinero se le va al centro en tareas que se pueden automatizar.",
  campoNombre: "Nombre de la academia o autoescuela (opcional)",
  articuloCliente: "la academia",

  parametros: { porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 44 }, // curso con vacaciones · coste/hora: salario mínimo (CONFIG.costeHora)

  preguntas: [
    { clave: "tipo", titulo: "Tipo de centro", tipo: "opcion",
      opciones: [
        { valor: "idiomas", etiqueta: "Academia de idiomas" },
        { valor: "refuerzo", etiqueta: "Refuerzo escolar" },
        { valor: "autoescuela", etiqueta: "Autoescuela" },
        { valor: "oposiciones", etiqueta: "Oposiciones o formación profesional" },
        { valor: "otro", etiqueta: "Otro (música, deporte…)" }
      ] },
    { clave: "consultas", titulo: "Consultas de información al día (precios, horarios, plazas)", tipo: "slider",
      slider: { min: 0, max: 50, marca: 10 },
      sub: { clave: "minConsulta", titulo: "Minutos por consulta", opciones: [3, 5, 10] } },
    { clave: "mensajes", titulo: "Mensajes con familias o alumnos al día (faltas, cambios, avisos)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },
      sub: { clave: "minMensaje", titulo: "Minutos por mensaje", opciones: [1, 2, 3] } },
    { clave: "cobros", titulo: "Recibos, cobros o pagos pendientes que gestionan a mano al día", tipo: "slider",
      slider: { min: 0, max: 30, marca: 5 },
      sub: { clave: "minCobro", titulo: "Minutos por cobro", opciones: [2, 3, 5] } },
    { clave: "personas", titulo: "Personas que se ocupan de secretaría y atención", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "seguimiento", titulo: "¿Vuelven a contactar a quien pidió información y no se apuntó?", tipo: "opcion",
      opciones: [
        { valor: "siempre", etiqueta: "Siempre" },
        { valor: "a_veces", etiqueta: "A veces" },
        { valor: "nunca", etiqueta: "Nunca" }
      ] },
    { clave: "impagos", titulo: "¿Cuánto les cuesta cobrar los recibos?", tipo: "opcion",
      opciones: [
        { valor: "domiciliado", etiqueta: "Se cobran solos (domiciliados)" },
        { valor: "algunos", etiqueta: "Hay que reclamar a algunos" },
        { valor: "todos_meses", etiqueta: "Reclamamos todos los meses" }
      ] },
    { clave: "software", titulo: "¿Programa de gestión de alumnos, grupos y cobros?", tipo: "opcion",
      opciones: [
        { valor: "si", etiqueta: "Sí" },
        { valor: "excel", etiqueta: "No, Excel o papel" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaseis tiempo en consultas y avisos y las familias o alumnos recibieran respuestas automáticamente, ¿en qué nivel os interesaría?", tipo: "opcion",
      opciones: [
        { valor: "mucho", etiqueta: "Mucho" },
        { valor: "bastante", etiqueta: "Bastante" },
        { valor: "poco", etiqueta: "Poco" },
        { valor: "no_prioritario", etiqueta: "No prioritario" }
      ] },
    { clave: "percepcion", titulo: "Horas/día estimadas del equipo en estas tareas", tipo: "opcion",
      nota: "Su sensación, sin calcular",
      opciones: [
        { valor: "lt2", etiqueta: "Menos de 2 horas" },
        { valor: "2-4", etiqueta: "De 2 a 4 horas" },
        { valor: "4-6", etiqueta: "De 4 a 6 horas" },
        { valor: "gt6", etiqueta: "Más de 6 horas" }
      ] }
  ],

  calculo: {
    lineas: [
      { cantidad: "consultas", minutos: "minConsulta" },
      { cantidad: "mensajes", minutos: "minMensaje" },
      { cantidad: "cobros", minutos: "minCobro" }
    ],
    percepcion: {
      clave: "percepcion",
      rangos: [
        { valor: "lt2", min: 0, max: 2, texto: "menos de 2 horas" },
        { valor: "2-4", min: 2, max: 4, texto: "entre 2 y 4 horas" },
        { valor: "4-6", min: 4, max: 6, texto: "entre 4 y 6 horas" },
        { valor: "gt6", min: 6, max: null, texto: "más de 6 horas" }
      ]
    }
  },

  resultado: {
    selectorVariante: {
      clave: "interes",
      mapa: { mucho: "A", bastante: "A", poco: "B", no_prioritario: "C" },
      textos: { mucho: "Mucho", bastante: "Bastante", poco: "Poco", no_prioritario: "No es prioritario" }
    },
    variantes: {
      A: {
        titular: "{nombreCliente}, podéis recuperar {horas} horas y {euros} al año.",
        titularSinNombre: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy vuestro equipo dedica unas {horasAno} horas al año a consultas, mensajes y cobros. Eso son {jornadasAno} jornadas completas y {costeAno} al año.",
        impulso: "Y vosotros mismos habéis dicho que os interesa que consultas y avisos se atiendan solos. Eso es justo lo que se puede automatizar.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      B: {
        titular: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy se van unas {horasAno} horas al año en consultas, mensajes y cobros: {costeAno} al año. Aunque no sea una prioridad ahora mismo, es tiempo que vuestro equipo podría dedicar a los alumnos.",
        impulso: "Sin compromiso: en una cita corta os enseñamos qué se puede automatizar y qué no.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      C: {
        titular: "Aunque no sea prioritario: {horas} horas y {euros} al año.",
        subtitulo: "Es lo que vuestro equipo dedica a tareas repetitivas que se pueden automatizar, según vuestras propias respuestas. Unas {horasAno} horas al año, {costeAno} en total.",
        impulso: "Si algún día queréis recuperar ese tiempo, ya sabéis cuánto hay en juego.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      }
    },
    etiquetasCifras: { horas: "horas recuperables al año", euros: "recuperables al año, como mínimo" },
    volumenBajo: "Con estas cifras el volumen de tareas es bajo. Aun así, un diagnóstico puede encontrar otras oportunidades.",
    ctaVolumenBajo: "Agenda una cita con NorteIA para saber cómo",
    contraste: {
      titulo: "Vuestra sensación frente a la realidad",
      etiquetaPercepcion: "Lo que pensáis",
      valorPercepcion: "{percepcionTexto} al día",
      etiquetaCalculo: "Lo que sale de vuestras respuestas",
      valorCalculo: "{horasDiaCalc} horas al día",
      mayor: "Perdéis más tiempo del que pensáis. Vuestras respuestas suman {horasDiaCalc} horas al día, no {percepcionTexto}. Ese tiempo que no se ve es el que más cuesta.",
      coincide: "Vuestra intuición es buena: {horasDiaCalc} horas al día, justo lo que pensabais. Lo que quizá no habíais visto es lo que cuesta al año: {costeAno}.",
      menor: "Vuestra sensación era algo mayor ({percepcionTexto}), pero los números hablan: {horasDiaCalc} horas al día, que son {horasAno} horas al año. Hay margen de sobra para recuperar."
    },
    senales: [
      { prioridad: 1, icono: "target", si: { clave: "seguimiento", en: ["a_veces", "nunca"] },
        texto: "Quien pidió información y no se apuntó es el alumno más fácil de conseguir. El seguimiento se puede automatizar." },
      { prioridad: 2, icono: "euro", si: { clave: "impagos", en: ["todos_meses"] },
        texto: "Reclamar recibos cada mes: los avisos de pago automáticos lo hacen por vosotros." },
      { prioridad: 3, icono: "folder-open", si: { clave: "software", en: ["excel", "no_se"] },
        texto: "Con alumnos, grupos y cobros en Excel o papel, todo depende de una persona. Se puede ordenar paso a paso." }
    ],
    pie: "Estimación calculada con el salario mínimo ({costeHora} €/h, SMI 2026) y un {porcentajeAhorroPct} % de recuperación media por automatización. Con el coste real de vuestro equipo, el ahorro es mayor."
  },

  resumen: {
    titulo: "ESTIMACIÓN RÁPIDA NORTEIA - ACADEMIA",
    etiquetaNombre: "Centro",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["consultas", "Consultas de información al día"],
      ["mensajes", "Mensajes con familias o alumnos al día"],
      ["cobros", "Cobros a mano al día"],
      ["personas", "Personas que se ocupan"],
      ["seguimiento", "Seguimiento de interesados"],
      ["impagos", "Cobro de recibos"],
      ["software", "Programa de gestión"],
      ["interes", "Interés en consultas y avisos automáticos"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }]
    ]
  }
};
