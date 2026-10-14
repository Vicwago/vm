/*
 * NICHO: TALLERES (completo).
 * Tareas medidas: llamadas, mensajes y presupuestos. Dolores: llamadas perdidas con las
 * manos en el coche y falta de recordatorios (ITV, revisiones) que traen al cliente de vuelta.
 * Valores [DECIDIR]: coste/hora, % de ahorro y marcas "habitual" de los sliders.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.talleres = {
  id: "talleres",
  nombre: "Talleres",
  icono: "wrench",
  completo: true,
  tituloApp: "Estimación rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabrá cuánto tiempo y dinero se le va al taller en tareas que se pueden automatizar.",
  campoNombre: "Nombre del taller (opcional)",
  articuloCliente: "el taller",

  parametros: { porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 }, // % de ahorro [DECIDIR] · coste/hora: salario mínimo + Seguridad Social (CONFIG.costeHora)

  preguntas: [
    { clave: "tipo", titulo: "Tipo de taller", tipo: "opcion",
      opciones: [
        { valor: "mecanica", etiqueta: "Mecánica general" },
        { valor: "chapa", etiqueta: "Chapa y pintura" },
        { valor: "neumaticos", etiqueta: "Neumáticos y mantenimiento rápido" },
        { valor: "oficial", etiqueta: "Servicio oficial de marca" },
        { valor: "otro", etiqueta: "Otro" }
      ] },
    { clave: "llamadas", titulo: "Llamadas al día (citas, presupuestos, «¿cómo va mi coche?»)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [2, 3, 5] } },
    { clave: "mensajes", titulo: "WhatsApps o mensajes al día (fotos, dudas, avisos de recogida)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 10 },
      sub: { clave: "minMensaje", titulo: "Minutos por mensaje", opciones: [1, 2, 3] } },
    { clave: "presupuestos", titulo: "Presupuestos que preparan y envían al día", tipo: "slider",
      slider: { min: 0, max: 20, marca: 4 },
      sub: { clave: "minPresupuesto", titulo: "Minutos por presupuesto", opciones: [5, 10, 20] } },
    { clave: "personas", titulo: "Personas que atienden teléfono, mostrador y presupuestos", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "perdidas", titulo: "¿Llamadas sin contestar mientras están con un coche?", tipo: "opcion",
      opciones: [
        { valor: "casi_nunca", etiqueta: "Casi nunca" },
        { valor: "a_veces", etiqueta: "A veces" },
        { valor: "con_frecuencia", etiqueta: "Con frecuencia" },
        { valor: "no_controlado", etiqueta: "No controlado" }
      ] },
    { clave: "recordatorios", titulo: "¿Avisan a sus clientes de la ITV, la revisión o el cambio de aceite?", tipo: "opcion",
      opciones: [
        { valor: "automatico", etiqueta: "Sí, de forma automática" },
        { valor: "a_mano", etiqueta: "Sí, a mano cuando da tiempo" },
        { valor: "no", etiqueta: "No" }
      ] },
    { clave: "software", titulo: "¿Programa de gestión del taller (citas, órdenes, facturas)?", tipo: "opcion",
      opciones: [
        { valor: "si", etiqueta: "Sí" },
        { valor: "no", etiqueta: "No" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaseis tiempo en llamadas y presupuestos y los clientes pudieran pedir cita o saber cómo va su coche automáticamente, ¿en qué nivel os interesaría?", tipo: "opcion",
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
      { cantidad: "presupuestos", minutos: "minPresupuesto" }
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
        subtitulo: "Hoy vuestro equipo dedica unas {horasAno} horas al año a llamadas, mensajes y presupuestos. Eso son {jornadasAno} jornadas completas y {costeAno} al año.",
        impulso: "Y vosotros mismos habéis dicho que os interesa que el cliente pida cita y sepa cómo va su coche sin llamar. Eso es justo lo que se puede automatizar.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      B: {
        titular: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy se van unas {horasAno} horas al año en llamadas, mensajes y presupuestos: {costeAno} al año. Aunque no sea una prioridad ahora mismo, es tiempo que vuestro equipo podría dedicar a los coches.",
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
        texto: "Llamadas sin contestar con las manos en el coche: cada una puede ser una reparación que se va a otro taller." },
      { prioridad: 2, icono: "bell", si: { clave: "recordatorios", en: ["a_mano", "no"] },
        texto: "Sin avisos automáticos de ITV, revisión o aceite, el cliente no vuelve solo. Se puede automatizar con los datos que ya tenéis." },
      { prioridad: 3, icono: "folder-open", si: { clave: "software", en: ["no", "no_se"] },
        texto: "Sin un programa de gestión claro, citas, órdenes y avisos dependen de las personas. Se puede ordenar paso a paso." }
    ],
    pie: "Estimación calculada con el salario mínimo más la Seguridad Social de la empresa ({costeHora} €/h, SMI 2026) y un {porcentajeAhorroPct} % de recuperación media por automatización. Con el coste real de vuestro equipo, el ahorro es mayor."
  },

  resumen: {
    titulo: "ESTIMACIÓN RÁPIDA NORTEIA - TALLER",
    etiquetaNombre: "Taller",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["llamadas", "Llamadas al día"],
      ["mensajes", "Mensajes al día"],
      ["presupuestos", "Presupuestos al día"],
      ["personas", "Personas que se ocupan"],
      ["perdidas", "Llamadas sin contestar"],
      ["recordatorios", "Avisos de ITV y revisiones"],
      ["software", "Programa de gestión"],
      ["interes", "Interés en cita y estado sin llamar"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }]
    ]
  }
};
