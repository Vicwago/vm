/*
 * NICHO: CLÍNICAS (completo).
 * Todo el contenido de este nicho vive aquí: preguntas, cálculo, textos y resumen.
 * El motor (app.js / motor.js) no contiene ningún texto de clínicas.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.clinicas = {
  id: "clinicas",
  nombre: "Clínicas",
  icono: "stethoscope",
  completo: true,
  tituloApp: "Estimación rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabrá cuánto tiempo y dinero se le va en tareas que se pueden automatizar.",
  campoNombre: "Nombre de la clínica (opcional)",
  articuloCliente: "la clínica",

  parametros: { porcentajeAhorro: 0.65, diasSemana: 5, semanasAno: 48 },

  preguntas: [
    { clave: "tipo", titulo: "Tipo de clínica", tipo: "opcion",
      opciones: [
        { valor: "dental", etiqueta: "Dental" },
        { valor: "estetica", etiqueta: "Medicina estética" },
        { valor: "fisio", etiqueta: "Fisioterapia" },
        { valor: "medica", etiqueta: "Médica o especializada" },
        { valor: "otra", etiqueta: "Otra" }
      ] },
    { clave: "llamadas", titulo: "Llamadas al día", tipo: "slider",
      slider: { min: 0, max: 100, marca: 25 },
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [2, 3, 5] } },
    { clave: "mensajes", titulo: "WhatsApps o mensajes al día", tipo: "slider",
      slider: { min: 0, max: 100, marca: 20 },
      sub: { clave: "minMensaje", titulo: "Minutos por mensaje", opciones: [1, 2, 3] } },
    { clave: "gestiones", titulo: "Gestiones de citas al día (confirmaciones, cambios, cancelaciones, disponibilidad)", tipo: "slider",
      slider: { min: 0, max: 40, marca: 10 },
      sub: { clave: "minGestion", titulo: "Minutos por gestión", opciones: [1, 2, 4] } },
    { clave: "personas", titulo: "Personas que se ocupan de estas tareas", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "repetidas", titulo: "Frecuencia de respuestas repetidas", tipo: "opcion",
      opciones: [
        { valor: "pocas", etiqueta: "Pocas veces" },
        { valor: "muchas", etiqueta: "Muchas veces al día" },
        { valor: "constantemente", etiqueta: "Constantemente" }
      ] },
    { clave: "perdidas", titulo: "¿Llamadas sin contestar atendiendo pacientes?", tipo: "opcion",
      opciones: [
        { valor: "casi_nunca", etiqueta: "Casi nunca" },
        { valor: "a_veces", etiqueta: "A veces" },
        { valor: "con_frecuencia", etiqueta: "Con frecuencia" },
        { valor: "no_controlado", etiqueta: "No controlado" }
      ] },
    { clave: "software", titulo: "¿Programa de gestión de citas?", tipo: "opcion",
      opciones: [
        { valor: "si", etiqueta: "Sí" },
        { valor: "no", etiqueta: "No" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaseis tiempo en la gestión de citas y los pacientes pudieran resolver dudas automáticamente, también fuera de horario, ¿en qué nivel os interesaría?", tipo: "opcion",
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
      ] },

    // Extras (solo aparecen si CONFIG.extrasActivas.<extra> === true). No entran en el cálculo.
    { clave: "noShows", titulo: "No-shows (pacientes que no vienen sin avisar) a la semana", tipo: "opcion",
      extra: "noShows",
      opciones: [
        { valor: "0", etiqueta: "0" },
        { valor: "1-2", etiqueta: "1-2" },
        { valor: "3-5", etiqueta: "3-5" },
        { valor: "5+", etiqueta: "+5" }
      ] },
    { clave: "fueraHorario", titulo: "¿Quién responde fuera de horario?", tipo: "opcion",
      extra: "fueraHorario",
      opciones: [
        { valor: "nadie", etiqueta: "Nadie" },
        { valor: "dueno", etiqueta: "El dueño desde casa" },
        { valor: "se_pierden", etiqueta: "Se pierden" }
      ] }
  ],

  calculo: {
    lineas: [
      { cantidad: "llamadas", minutos: "minLlamada" },
      { cantidad: "mensajes", minutos: "minMensaje" },
      { cantidad: "gestiones", minutos: "minGestion" }
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
      // Texto del interés en el email (si falta, se usa la etiqueta de la opción)
      textos: { mucho: "Mucho", bastante: "Bastante", poco: "Poco", no_prioritario: "No es prioritario" }
    },
    variantes: {
      A: {
        titular: "{nombreCliente}, podéis recuperar {horas} horas y {euros} al año.",
        titularSinNombre: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy vuestro equipo dedica unas {horasAno} horas al año a llamadas, mensajes y gestiones de citas. Eso son {jornadasAno} jornadas completas y {costeAno} al año.",
        impulso: "Y vosotros mismos habéis dicho que os interesa atender también fuera de horario. Eso es justo lo que se puede automatizar.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      B: {
        titular: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy se van unas {horasAno} horas al año en llamadas, mensajes y gestiones de citas: {costeAno} al año. Aunque no sea una prioridad ahora mismo, es tiempo que vuestro equipo podría dedicar a los pacientes.",
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
    // Máximo 2 visibles, por prioridad (menor número = antes)
    senales: [
      { prioridad: 1, icono: "phone-missed", si: { clave: "perdidas", en: ["con_frecuencia", "no_controlado"] },
        texto: "Llamadas sin contestar mientras se atiende a pacientes: cada una puede ser un paciente que se va a otra clínica." },
      { prioridad: 2, icono: "moon", si: { clave: "fueraHorario", en: ["se_pierden"] },
        texto: "Las consultas fuera de horario se pierden." },
      { prioridad: 3, icono: "repeat", si: { clave: "repetidas", en: ["constantemente"] },
        texto: "Respuestas repetidas constantemente: es lo primero que se automatiza." },
      { prioridad: 4, icono: "calendar-x", si: { clave: "noShows", en: ["3-5", "5+"] },
        texto: "Los no-shows se pueden reducir con recordatorios automáticos." },
      { prioridad: 5, icono: "folder-open", si: { clave: "software", en: ["no", "no_se"] },
        texto: "Sin un programa de gestión de citas claro, todo depende de las personas. Se puede ordenar sin cambiar de programa." }
    ],
    pie: "Estimación calculada con el salario mínimo más la Seguridad Social de la empresa ({costeHora} €/h, SMI 2026) y un {porcentajeAhorroPct} % de recuperación media por automatización. Con el coste real de vuestro equipo, el ahorro es mayor."
  },

  // Resumen copiable (texto plano). [clave, etiqueta, opciones]
  resumen: {
    titulo: "ESTIMACIÓN RÁPIDA NORTEIA",
    etiquetaNombre: "Clínica",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["llamadas", "Llamadas al día"],
      ["mensajes", "Mensajes al día"],
      ["gestiones", "Gestiones de citas al día"],
      ["personas", "Personas que se ocupan"],
      ["repetidas", "Respuestas repetidas"],
      ["perdidas", "Llamadas sin contestar"],
      ["software", "Programa de citas"],
      ["interes", "Interés en fuera de horario"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }],
      ["noShows", "No-shows por semana"],
      ["fueraHorario", "Fuera de horario"]
    ]
  }
};
