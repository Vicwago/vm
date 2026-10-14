/*
 * NICHO: CLÍNICAS VETERINARIAS (completo).
 * Tareas medidas: llamadas, mensajes y recordatorios de vacunas/desparasitación hechos a mano.
 * Dolores: llamadas perdidas en consulta y quién atiende fuera de horario.
 * Valores [DECIDIR]: coste/hora, % de ahorro y marcas "habitual" de los sliders.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.veterinarias = {
  id: "veterinarias",
  nombre: "Veterinarias",
  icono: "🐾",
  completo: true,
  tituloApp: "Auditoría rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabrá cuánto tiempo y dinero se le va a la clínica en tareas que se pueden automatizar.",
  campoNombre: "Nombre de la clínica veterinaria (opcional)",
  articuloCliente: "la clínica",

  parametros: { costeHora: 14, porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 }, // [DECIDIR]

  preguntas: [
    { clave: "tipo", titulo: "Tipo de centro veterinario", tipo: "opcion",
      opciones: [
        { valor: "clinica", etiqueta: "Clínica de pequeños animales" },
        { valor: "hospital", etiqueta: "Hospital veterinario (con urgencias)" },
        { valor: "tienda", etiqueta: "Clínica con peluquería o tienda" },
        { valor: "grandes", etiqueta: "Animales de granja o équidos" },
        { valor: "otro", etiqueta: "Otro" }
      ] },
    { clave: "llamadas", titulo: "Llamadas al día (citas, dudas, resultados)", tipo: "slider",
      slider: { min: 0, max: 80, marca: 20 },
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [2, 3, 5] } },
    { clave: "mensajes", titulo: "WhatsApps o mensajes al día", tipo: "slider",
      slider: { min: 0, max: 60, marca: 10 },
      sub: { clave: "minMensaje", titulo: "Minutos por mensaje", opciones: [1, 2, 3] } },
    { clave: "recordatorios", titulo: "Recordatorios a mano al día (vacunas, desparasitación, revisiones)", tipo: "slider",
      slider: { min: 0, max: 40, marca: 8 },
      sub: { clave: "minRecordatorio", titulo: "Minutos por recordatorio", opciones: [1, 2, 3] } },
    { clave: "personas", titulo: "Personas que se ocupan de estas tareas", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "perdidas", titulo: "¿Llamadas sin contestar mientras atienden en consulta?", tipo: "opcion",
      opciones: [
        { valor: "casi_nunca", etiqueta: "Casi nunca" },
        { valor: "a_veces", etiqueta: "A veces" },
        { valor: "con_frecuencia", etiqueta: "Con frecuencia" },
        { valor: "no_controlado", etiqueta: "No controlado" }
      ] },
    { clave: "fueraHorario", titulo: "¿Quién atiende las consultas fuera de horario?", tipo: "opcion",
      opciones: [
        { valor: "servicio", etiqueta: "Servicio de urgencias propio" },
        { valor: "movil", etiqueta: "El veterinario desde su móvil" },
        { valor: "se_pierden", etiqueta: "Nadie, se pierden" }
      ] },
    { clave: "software", titulo: "¿Programa de gestión veterinaria con recordatorios?", tipo: "opcion",
      opciones: [
        { valor: "si_auto", etiqueta: "Sí, y envía recordatorios solo" },
        { valor: "si_manual", etiqueta: "Sí, pero los avisos van a mano" },
        { valor: "no", etiqueta: "No" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaran tiempo y los clientes recibieran recordatorios y respuestas automáticas, ¿interés?", tipo: "opcion",
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
      { cantidad: "recordatorios", minutos: "minRecordatorio" }
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
        subtitulo: "Hoy vuestro equipo dedica unas {horasAno} horas al año a llamadas, mensajes y recordatorios. Eso son {jornadasAno} jornadas completas y {costeAno} al año.",
        impulso: "Y vosotros mismos habéis dicho que os interesa que los recordatorios y las respuestas salgan solos. Eso es justo lo que se puede automatizar.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      B: {
        titular: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy se van unas {horasAno} horas al año en llamadas, mensajes y recordatorios: {costeAno} al año. Aunque no sea una prioridad ahora mismo, es tiempo que vuestro equipo podría dedicar a los animales.",
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
    etiquetasCifras: { horas: "horas recuperables al año", euros: "recuperables al año" },
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
      { prioridad: 1, icono: "📞", si: { clave: "perdidas", en: ["con_frecuencia", "no_controlado"] },
        texto: "Llamadas sin contestar en plena consulta: cada una puede ser un cliente que llama a otra clínica." },
      { prioridad: 2, icono: "🌙", si: { clave: "fueraHorario", en: ["movil", "se_pierden"] },
        texto: "Fuera de horario, las consultas se pierden o acaban en el móvil del veterinario. Un asistente puede filtrar lo urgente de lo que espera." },
      { prioridad: 3, icono: "💉", si: { clave: "software", en: ["si_manual", "no", "no_se"] },
        texto: "Recordatorios de vacunas a mano: trabajo que se olvida y visitas que no se hacen. Se puede automatizar con los datos que ya tenéis." }
    ],
    pie: "Estimación basada en vuestras respuestas. Ahorro calculado sobre un {porcentajeAhorroPct} % de recuperación media por automatización."
  },

  resumen: {
    titulo: "AUDITORÍA RÁPIDA NORTEIA - VETERINARIA",
    etiquetaNombre: "Clínica veterinaria",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["llamadas", "Llamadas al día"],
      ["mensajes", "Mensajes al día"],
      ["recordatorios", "Recordatorios a mano al día"],
      ["personas", "Personas que se ocupan"],
      ["perdidas", "Llamadas sin contestar"],
      ["fueraHorario", "Fuera de horario"],
      ["software", "Programa de gestión"],
      ["interes", "Interés en recordatorios y respuestas automáticas"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }]
    ]
  }
};
