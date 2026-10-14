/*
 * NICHO: RESTAURANTES Y HOSTELERÍA (completo).
 * Tareas medidas: llamadas de reservas y dudas, mensajes y pedidos para llevar tomados a mano.
 * Dolores: teléfono sin contestar en pleno servicio y reservas que no se presentan
 * (TheFork: 3,3 % de no-show en España en 2025; ver niches/FUENTES.md).
 * Valores [DECIDIR]: coste/hora, % de ahorro y marcas "habitual" de los sliders.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.restaurantes = {
  id: "restaurantes",
  nombre: "Restaurantes",
  icono: "utensils",
  completo: true,
  tituloApp: "Estimación rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabrá cuánto tiempo y dinero se le va al local en tareas que se pueden automatizar.",
  campoNombre: "Nombre del restaurante (opcional)",
  articuloCliente: "el restaurante",

  parametros: { porcentajeAhorro: 0.60, diasSemana: 6, semanasAno: 48 }, // 6 días de apertura · coste/hora: salario mínimo (CONFIG.costeHora)

  preguntas: [
    { clave: "tipo", titulo: "Tipo de local", tipo: "opcion",
      opciones: [
        { valor: "restaurante", etiqueta: "Restaurante" },
        { valor: "bar", etiqueta: "Bar o cafetería" },
        { valor: "llevar", etiqueta: "Pizzería o comida para llevar" },
        { valor: "eventos", etiqueta: "Catering o eventos" },
        { valor: "otro", etiqueta: "Otro" }
      ] },
    { clave: "llamadas", titulo: "Llamadas al día (reservas, horario, carta, alérgenos)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [1, 2, 3] } },
    { clave: "mensajes", titulo: "WhatsApps o mensajes de Instagram y Google al día", tipo: "slider",
      slider: { min: 0, max: 60, marca: 10 },
      sub: { clave: "minMensaje", titulo: "Minutos por mensaje", opciones: [1, 2, 3] } },
    { clave: "pedidos", titulo: "Pedidos para llevar o encargos que toman a mano al día", tipo: "slider",
      slider: { min: 0, max: 60, marca: 10 },
      sub: { clave: "minPedido", titulo: "Minutos por pedido", opciones: [2, 3, 5] } },
    { clave: "personas", titulo: "Personas que cogen el teléfono y apuntan reservas", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "perdidas", titulo: "¿Llamadas sin contestar en plena hora de servicio?", tipo: "opcion",
      opciones: [
        { valor: "casi_nunca", etiqueta: "Casi nunca" },
        { valor: "a_veces", etiqueta: "A veces" },
        { valor: "con_frecuencia", etiqueta: "Con frecuencia" },
        { valor: "no_controlado", etiqueta: "No controlado" }
      ] },
    { clave: "noShows", titulo: "Reservas que no se presentan sin avisar, a la semana", tipo: "opcion",
      opciones: [
        { valor: "0", etiqueta: "Ninguna" },
        { valor: "1-2", etiqueta: "1 o 2" },
        { valor: "3-5", etiqueta: "De 3 a 5" },
        { valor: "5+", etiqueta: "Más de 5" }
      ] },
    { clave: "software", titulo: "¿Reservas online (web, Google o app)?", tipo: "opcion",
      opciones: [
        { valor: "si", etiqueta: "Sí" },
        { valor: "no", etiqueta: "No, solo por teléfono" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaseis tiempo al teléfono y las reservas y dudas se atendieran automáticamente, ¿en qué nivel os interesaría?", tipo: "opcion",
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
      { cantidad: "pedidos", minutos: "minPedido" }
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
        subtitulo: "Hoy vuestro equipo dedica unas {horasAno} horas al año a llamadas, mensajes y pedidos tomados a mano. Eso son {jornadasAno} jornadas completas y {costeAno} al año.",
        impulso: "Y vosotros mismos habéis dicho que os interesa que reservas y dudas se atiendan solas. Eso es justo lo que se puede automatizar.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      B: {
        titular: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy se van unas {horasAno} horas al año en llamadas, mensajes y pedidos tomados a mano: {costeAno} al año. Aunque no sea una prioridad ahora mismo, es tiempo que vuestro equipo podría dedicar a la sala y la cocina.",
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
      { prioridad: 1, icono: "phone-missed", si: { clave: "perdidas", en: ["con_frecuencia", "no_controlado"] },
        texto: "Teléfono sin contestar en pleno servicio: cada llamada perdida puede ser una mesa que reserva en otro sitio." },
      { prioridad: 2, icono: "armchair", si: { clave: "noShows", en: ["3-5", "5+"] },
        texto: "Mesas vacías por reservas que no vienen: la confirmación automática por WhatsApp las reduce." },
      { prioridad: 3, icono: "calendar-days", si: { clave: "software", en: ["no", "no_se"] },
        texto: "Si las reservas solo entran por teléfono, cada una interrumpe el servicio. Una reserva online lo resuelve." }
    ],
    pie: "Estimación calculada con el salario mínimo ({costeHora} €/h, SMI 2026) y un {porcentajeAhorroPct} % de recuperación media por automatización. Con el coste real de vuestro equipo, el ahorro es mayor."
  },

  resumen: {
    titulo: "ESTIMACIÓN RÁPIDA NORTEIA - RESTAURANTE",
    etiquetaNombre: "Restaurante",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["llamadas", "Llamadas al día"],
      ["mensajes", "Mensajes al día"],
      ["pedidos", "Pedidos a mano al día"],
      ["personas", "Personas que se ocupan"],
      ["perdidas", "Llamadas sin contestar en servicio"],
      ["noShows", "No-shows por semana"],
      ["software", "Reservas online"],
      ["interes", "Interés en reservas y dudas automáticas"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }]
    ]
  }
};
