/*
 * NICHO: BARBERÍAS (completo).
 * Tareas medidas: llamadas, WhatsApp/Instagram y citas que se confirman o recolocan a mano.
 * Dolores: parar un corte para contestar el móvil y los huecos por no-shows.
 * Valores [DECIDIR]: coste/hora, % de ahorro y marcas "habitual" de los sliders.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.barberias = {
  id: "barberias",
  nombre: "Barberías",
  icono: "scissors-line-dashed",
  completo: true,
  tituloApp: "Estimación rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabrá cuánto tiempo y dinero se le va a la barbería en tareas que se pueden automatizar.",
  campoNombre: "Nombre de la barbería (opcional)",
  articuloCliente: "la barbería",

  parametros: { porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 }, // % de ahorro [DECIDIR] · coste/hora: salario mínimo (CONFIG.costeHora)

  preguntas: [
    { clave: "tipo", titulo: "Tipo de barbería", tipo: "opcion",
      opciones: [
        { valor: "clasica", etiqueta: "Barbería clásica" },
        { valor: "urbana", etiqueta: "Barbería moderna o urbana" },
        { valor: "estetica", etiqueta: "Barbería con estética masculina" },
        { valor: "cadena", etiqueta: "Cadena o franquicia" },
        { valor: "otra", etiqueta: "Otra" }
      ] },
    { clave: "llamadas", titulo: "Llamadas al día para pedir o cambiar cita", tipo: "slider",
      slider: { min: 0, max: 50, marca: 10 },
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [1, 2, 3] } },
    { clave: "mensajes", titulo: "WhatsApps o mensajes de Instagram al día («¿tienes hueco hoy?»)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },
      sub: { clave: "minMensaje", titulo: "Minutos por mensaje", opciones: [1, 2, 3] } },
    { clave: "recolocar", titulo: "Citas que confirman, recuerdan o recolocan a mano al día", tipo: "slider",
      slider: { min: 0, max: 40, marca: 8 },
      sub: { clave: "minRecolocar", titulo: "Minutos por cita", opciones: [1, 2, 3] } },
    { clave: "personas", titulo: "Personas (barberos incluidos) que contestan teléfono y mensajes", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "interrupciones", titulo: "¿Paran un corte para contestar el móvil?", tipo: "opcion",
      opciones: [
        { valor: "casi_nunca", etiqueta: "Casi nunca" },
        { valor: "a_veces", etiqueta: "A veces" },
        { valor: "con_frecuencia", etiqueta: "Con frecuencia" },
        { valor: "constantemente", etiqueta: "Constantemente" }
      ] },
    { clave: "noShows", titulo: "Clientes que no vienen sin avisar, a la semana", tipo: "opcion",
      opciones: [
        { valor: "0", etiqueta: "Ninguno" },
        { valor: "1-2", etiqueta: "1 o 2" },
        { valor: "3-5", etiqueta: "De 3 a 5" },
        { valor: "5+", etiqueta: "Más de 5" }
      ] },
    { clave: "software", titulo: "¿Reservas online (app o enlace) para pedir cita?", tipo: "opcion",
      opciones: [
        { valor: "si", etiqueta: "Sí, y la usan" },
        { valor: "si_poco", etiqueta: "Sí, pero casi nadie la usa" },
        { valor: "no", etiqueta: "No, todo por teléfono o WhatsApp" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaseis tiempo en la gestión de citas y los clientes pudieran reservar desde el móvil automáticamente, ¿en qué nivel os interesaría?", tipo: "opcion",
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
      { cantidad: "llamadas", minutos: "minLlamada" },
      { cantidad: "mensajes", minutos: "minMensaje" },
      { cantidad: "recolocar", minutos: "minRecolocar" }
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
        subtitulo: "Hoy dedicáis unas {horasAno} horas al año a llamadas, mensajes y a cuadrar citas. Eso son {jornadasAno} jornadas completas y {costeAno} al año.",
        impulso: "Y vosotros mismos habéis dicho que os interesa que los clientes reserven solos desde el móvil. Eso es justo lo que se puede automatizar.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      B: {
        titular: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy se van unas {horasAno} horas al año en llamadas, mensajes y cuadrar citas: {costeAno} al año. Aunque no sea una prioridad ahora mismo, es tiempo que podríais dedicar a cortar.",
        impulso: "Sin compromiso: en una cita corta os enseñamos qué se puede automatizar y qué no.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      C: {
        titular: "Aunque no sea prioritario: {horas} horas y {euros} al año.",
        subtitulo: "Es lo que dedicáis a tareas repetitivas que se pueden automatizar, según vuestras propias respuestas. Unas {horasAno} horas al año, {costeAno} en total.",
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
      { prioridad: 1, icono: "calendar-x", si: { clave: "noShows", en: ["3-5", "5+"] },
        texto: "Cada cliente que no viene es una silla vacía. Los recordatorios y la confirmación automática los reducen." },
      { prioridad: 2, icono: "scissors", si: { clave: "interrupciones", en: ["con_frecuencia", "constantemente"] },
        texto: "Parar un corte para contestar el móvil alarga cada servicio. Las respuestas y reservas automáticas lo evitan." },
      { prioridad: 3, icono: "smartphone", si: { clave: "software", en: ["si_poco", "no", "no_se"] },
        texto: "Si todo va por teléfono o WhatsApp, cada cita os interrumpe. Un enlace de reserva con recordatorios lo resuelve." }
    ],
    pie: "Estimación calculada con el salario mínimo ({costeHora} €/h, SMI 2026) y un {porcentajeAhorroPct} % de recuperación media por automatización. Con el coste real de vuestro equipo, el ahorro es mayor."
  },

  resumen: {
    titulo: "ESTIMACIÓN RÁPIDA NORTEIA - BARBERÍA",
    etiquetaNombre: "Barbería",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["llamadas", "Llamadas al día"],
      ["mensajes", "Mensajes al día"],
      ["recolocar", "Citas cuadradas a mano al día"],
      ["personas", "Personas que se ocupan"],
      ["interrupciones", "Paran un corte para contestar"],
      ["noShows", "No-shows por semana"],
      ["software", "Reservas online"],
      ["interes", "Interés en reservas desde el móvil"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }]
    ]
  }
};
