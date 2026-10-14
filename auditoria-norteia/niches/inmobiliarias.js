/*
 * NICHO: INMOBILIARIAS (completo).
 * Tareas medidas: contactos de portales, llamadas y coordinación de visitas.
 * Dolores: tiempo de respuesta a los contactos y visitas con gente que no encaja.
 * Valores [DECIDIR]: coste/hora, % de ahorro y marcas "habitual" de los sliders.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.inmobiliarias = {
  id: "inmobiliarias",
  nombre: "Inmobiliarias",
  icono: "house",
  completo: true,
  tituloApp: "Estimación rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabrá cuánto tiempo y dinero se le va a la agencia en tareas que se pueden automatizar.",
  campoNombre: "Nombre de la inmobiliaria (opcional)",
  articuloCliente: "la inmobiliaria",

  parametros: { porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 }, // % de ahorro [DECIDIR] · coste/hora: salario mínimo + Seguridad Social (CONFIG.costeHora)

  preguntas: [
    { clave: "tipo", titulo: "Tipo de inmobiliaria", tipo: "opcion",
      opciones: [
        { valor: "venta", etiqueta: "Sobre todo venta" },
        { valor: "alquiler", etiqueta: "Sobre todo alquiler" },
        { valor: "mixta", etiqueta: "Venta y alquiler" },
        { valor: "vacacional", etiqueta: "Alquiler vacacional" },
        { valor: "otra", etiqueta: "Otra" }
      ] },
    { clave: "contactos", titulo: "Contactos de portales y web al día (Idealista, Fotocasa…)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 10 },
      sub: { clave: "minContacto", titulo: "Minutos por contacto", opciones: [3, 5, 10] } },
    { clave: "llamadas", titulo: "Llamadas al día (interesados, propietarios, inquilinos)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [2, 3, 5] } },
    { clave: "visitas", titulo: "Visitas que coordinan, confirman o cambian al día", tipo: "slider",
      slider: { min: 0, max: 20, marca: 4 },
      sub: { clave: "minVisita", titulo: "Minutos por visita (solo coordinarla)", opciones: [5, 10, 15] } },
    { clave: "personas", titulo: "Personas que atienden contactos y agendan visitas", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "respuesta", titulo: "¿Cuánto tardan en contestar a un contacto de portal?", tipo: "opcion",
      opciones: [
        { valor: "lt1h", etiqueta: "Menos de 1 hora" },
        { valor: "dia", etiqueta: "En el mismo día" },
        { valor: "1-2d", etiqueta: "Uno o dos días" },
        { valor: "no_controlado", etiqueta: "Depende, a veces no se contesta" }
      ] },
    { clave: "filtro", titulo: "¿Cuántas visitas son con gente que no encaja (presupuesto, requisitos)?", tipo: "opcion",
      opciones: [
        { valor: "pocas", etiqueta: "Pocas" },
        { valor: "bastantes", etiqueta: "Bastantes" },
        { valor: "mayoria", etiqueta: "La mayoría" }
      ] },
    { clave: "software", titulo: "¿Programa CRM para contactos e inmuebles?", tipo: "opcion",
      opciones: [
        { valor: "si", etiqueta: "Sí" },
        { valor: "no", etiqueta: "No" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaseis tiempo en atender contactos y cada interesado recibiera respuesta automáticamente, al momento, ¿en qué nivel os interesaría?", tipo: "opcion",
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
      { cantidad: "contactos", minutos: "minContacto" },
      { cantidad: "llamadas", minutos: "minLlamada" },
      { cantidad: "visitas", minutos: "minVisita" }
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
        subtitulo: "Hoy vuestro equipo dedica unas {horasAno} horas al año a contestar contactos, llamadas y cuadrar visitas. Eso son {jornadasAno} jornadas completas y {costeAno} al año.",
        impulso: "Y vosotros mismos habéis dicho que os interesa que cada contacto reciba respuesta al momento. Eso es justo lo que se puede automatizar.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      B: {
        titular: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy se van unas {horasAno} horas al año en contestar contactos, llamadas y cuadrar visitas: {costeAno} al año. Aunque no sea una prioridad ahora mismo, es tiempo que vuestro equipo podría dedicar a cerrar operaciones.",
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
      { prioridad: 1, icono: "timer", si: { clave: "respuesta", en: ["1-2d", "no_controlado"] },
        texto: "Un interesado que espera un día ya ha escrito a otra agencia. La primera respuesta se puede automatizar." },
      { prioridad: 2, icono: "filter", si: { clave: "filtro", en: ["bastantes", "mayoria"] },
        texto: "Visitas con gente que no encaja: se filtran antes con unas preguntas automáticas al primer contacto." },
      { prioridad: 3, icono: "folder-open", si: { clave: "software", en: ["no", "no_se"] },
        texto: "Sin CRM, los contactos se quedan en el correo y el móvil de cada uno. Se pueden ordenar en un solo sitio." }
    ],
    pie: "Estimación calculada con el salario mínimo más la Seguridad Social de la empresa ({costeHora} €/h, SMI 2026) y un {porcentajeAhorroPct} % de recuperación media por automatización. Con el coste real de vuestro equipo, el ahorro es mayor."
  },

  resumen: {
    titulo: "ESTIMACIÓN RÁPIDA NORTEIA - INMOBILIARIA",
    etiquetaNombre: "Inmobiliaria",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["contactos", "Contactos de portales al día"],
      ["llamadas", "Llamadas al día"],
      ["visitas", "Visitas coordinadas al día"],
      ["personas", "Personas que se ocupan"],
      ["respuesta", "Tiempo de respuesta"],
      ["filtro", "Visitas que no encajan"],
      ["software", "CRM"],
      ["interes", "Interés en respuesta inmediata"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }]
    ]
  }
};
