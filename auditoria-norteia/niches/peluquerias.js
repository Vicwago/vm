/*
 * NICHO: PELUQUERÍAS (completo).
 * Tareas medidas: llamadas de citas, WhatsApp/Instagram y confirmaciones o recordatorios a mano.
 * Dolores: dejar al cliente a medias para coger el teléfono y los huecos por no-shows.
 * Valores ajustables: rango de recuperación (parametros) y marcas "habitual" de los sliders.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.peluquerias = {
  id: "peluquerias",
  nombre: "Peluquerías",
  icono: "scissors",
  completo: true,
  tituloApp: "Estimación rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabréis cuánto tiempo y dinero se os va en tareas que se pueden automatizar.",
  campoNombre: "Nombre de la peluquería (opcional)",
  articuloCliente: "la peluquería",

  parametros: { porcentajeAhorroMin: 0.40, porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 }, // rango orientativo de recuperación; coste/hora en CONFIG.costeHora

  preguntas: [
    { clave: "tipo", titulo: "Tipo de peluquería", tipo: "opcion",
      opciones: [
        { valor: "senoras", etiqueta: "Peluquería de señoras" },
        { valor: "unisex", etiqueta: "Unisex" },
        { valor: "estetica", etiqueta: "Peluquería y estética" },
        { valor: "cadena", etiqueta: "Cadena o franquicia" },
        { valor: "otra", etiqueta: "Otra" }
      ] },
    { clave: "llamadas", titulo: "Llamadas al día para pedir, cambiar o anular cita", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [1, 2, 3] } },
    { clave: "mensajes", titulo: "WhatsApps o mensajes de Instagram al día", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },
      sub: { clave: "minMensaje", titulo: "Minutos por mensaje", opciones: [1, 2, 3] } },
    { clave: "confirmaciones", titulo: "Citas que confirmáis o recordáis a mano al día", tipo: "slider",
      slider: { min: 0, max: 40, marca: 10 },
      sub: { clave: "minConfirmacion", titulo: "Minutos por cita", opciones: [1, 2, 3] } },
    { clave: "personas", titulo: "Personas que cogen el teléfono o contestan mensajes", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "interrupciones", titulo: "¿Dejáis a un cliente a medias para coger el teléfono?", tipo: "opcion",
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
    { clave: "software", titulo: "¿Agenda online donde el cliente reserve solo?", tipo: "opcion",
      opciones: [
        { valor: "si", etiqueta: "Sí, y la usan" },
        { valor: "si_poco", etiqueta: "Sí, pero casi nadie la usa" },
        { valor: "papel", etiqueta: "No, agenda en papel" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaseis tiempo en la gestión de citas y los clientes pudieran reservar y resolver dudas automáticamente, ¿en qué nivel os interesaría?", tipo: "opcion",
      opciones: [
        { valor: "mucho", etiqueta: "Mucho" },
        { valor: "bastante", etiqueta: "Bastante" },
        { valor: "poco", etiqueta: "Poco" },
        { valor: "no_prioritario", etiqueta: "No prioritario" }
      ] },
    { clave: "percepcion", titulo: "Horas/día estimadas del equipo en estas tareas", tipo: "opcion",
      nota: "Vuestra sensación, sin calcular",
      opciones: [
        { valor: "lt2", etiqueta: "Menos de 2 horas" },
        { valor: "2-4", etiqueta: "De 2 a 4 horas" },
        { valor: "4-6", etiqueta: "De 4 a 6 horas" },
        { valor: "gt6", etiqueta: "Más de 6 horas" }
      ] }
  ],

  calculo: {
    // Tope: nunca más horas al día de las que caben en la jornada de las personas que se ocupan
    techo: { clave: "personas", horasPorUnidad: 8 },
    lineas: [
      { cantidad: "llamadas", minutos: "minLlamada" },
      { cantidad: "mensajes", minutos: "minMensaje" },
      { cantidad: "confirmaciones", minutos: "minConfirmacion" }
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
        titular: "{nombreCliente}, hoy se os van {horasAno} horas y {costeAno} al año en tareas repetitivas.",
        titularSinNombre: "Hoy se os van {horasAno} horas y {costeAno} al año en tareas repetitivas.",
        subtitulo: "Es lo que suman vuestras respuestas en llamadas, mensajes y confirmaciones de citas: {jornadasAno} jornadas completas al año. Automatizando parte de ese trabajo, podríais recuperar entre {horasMin} y {horasMax} horas al año, entre {eurosMin} y {eurosMax}.",
        impulso: "Y vosotros mismos habéis dicho que os interesa que los clientes reserven a cualquier hora. Eso es justo lo que se puede automatizar.",
        cta: "Pedid una cita con NorteIA para ver cómo"
      },
      B: {
        titular: "Hoy se os van {horasAno} horas y {costeAno} al año en tareas repetitivas.",
        subtitulo: "Son {jornadasAno} jornadas completas al año en llamadas, mensajes y confirmaciones de citas. Aunque no sea una prioridad ahora mismo, automatizando parte podríais recuperar entre {horasMin} y {horasMax} horas al año para dedicarlas a los clientes del salón.",
        impulso: "Sin compromiso: en una cita corta os enseñamos qué se puede automatizar y qué no.",
        cta: "Pedid una cita con NorteIA para ver cómo"
      },
      C: {
        titular: "Aunque no sea prioritario: {horasAno} horas y {costeAno} al año.",
        subtitulo: "Es lo que hoy se os va en llamadas, mensajes y confirmaciones de citas, según vuestras propias respuestas. Automatizando parte, podríais recuperar entre {eurosMin} y {eurosMax} al año.",
        impulso: "Si algún día queréis recuperar ese tiempo, ya sabéis cuánto hay en juego.",
        cta: "Pedid una cita con NorteIA para ver cómo"
      }
    },
    etiquetasCifras: { horas: "horas al año en estas tareas", euros: "lo que os cuestan hoy, al año" },
    volumenBajo: "Con estas cifras el volumen de tareas es bajo. Aun así, un diagnóstico puede encontrar otras oportunidades.",
    ctaVolumenBajo: "Pedid una cita con NorteIA para ver cómo",
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
        texto: "Los huecos por clientes que no vienen se reducen con recordatorios y confirmación automática por WhatsApp." },
      { prioridad: 2, icono: "phone-missed", si: { clave: "interrupciones", en: ["con_frecuencia", "constantemente"] },
        texto: "Dejar el secador para coger el teléfono: el cliente de la silla lo nota y el del teléfono espera." },
      { prioridad: 3, icono: "calendar-days", si: { clave: "software", en: ["si_poco", "papel", "no_se"] },
        texto: "Si cada cita pasa por una persona, el salón depende del teléfono. Una reserva online con recordatorios quita llamadas y huecos." }
    ],
    pie: "Estimación orientativa a partir de vuestras respuestas. Cada hora se calcula a {costeHora} €, lo mínimo que cuesta a la empresa (salario mínimo más Seguridad Social). Lo que se puede recuperar depende de cada caso y se concreta en el diagnóstico."
  },

  resumen: {
    titulo: "ESTIMACIÓN RÁPIDA NORTEIA - PELUQUERÍA",
    etiquetaNombre: "Peluquería",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["llamadas", "Llamadas al día"],
      ["mensajes", "Mensajes al día"],
      ["confirmaciones", "Confirmaciones a mano al día"],
      ["personas", "Personas que se ocupan"],
      ["interrupciones", "Dejan al cliente para coger el teléfono"],
      ["noShows", "No-shows por semana"],
      ["software", "Agenda online"],
      ["interes", "Interés en reservas a cualquier hora"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }]
    ]
  }
};
