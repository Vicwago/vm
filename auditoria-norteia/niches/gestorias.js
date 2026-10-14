/*
 * NICHO: GESTORÍAS Y ASESORÍAS (completo).
 * Tareas medidas: consultas de clientes, documentación que se reclama/recibe y datos tecleados a mano.
 * Dolores: reclamar papeles una y otra vez y los picos de trimestre/renta.
 * Valores [DECIDIR]: coste/hora, % de ahorro y marcas "habitual" de los sliders.
 */
self.NICHOS = self.NICHOS || {};
self.NICHOS.gestorias = {
  id: "gestorias",
  nombre: "Gestorías",
  icono: "file-text",
  completo: true,
  tituloApp: "Estimación rápida de tiempo perdido",
  subtituloBienvenida: "10 preguntas. 3 minutos. Y sabrá cuánto tiempo y dinero se le va al despacho en tareas que se pueden automatizar.",
  campoNombre: "Nombre de la gestoría (opcional)",
  articuloCliente: "la gestoría",

  parametros: { porcentajeAhorro: 0.60, diasSemana: 5, semanasAno: 48 }, // % de ahorro [DECIDIR] · coste/hora: salario mínimo + Seguridad Social (CONFIG.costeHora)

  preguntas: [
    { clave: "tipo", titulo: "Tipo de despacho", tipo: "opcion",
      opciones: [
        { valor: "fiscal", etiqueta: "Fiscal y contable" },
        { valor: "laboral", etiqueta: "Laboral" },
        { valor: "integral", etiqueta: "Integral (fiscal, laboral y contable)" },
        { valor: "administrativa", etiqueta: "Gestoría administrativa (tráfico, trámites)" },
        { valor: "otro", etiqueta: "Otro" }
      ] },
    { clave: "consultas", titulo: "Consultas de clientes al día (llamadas, emails, WhatsApp)", tipo: "slider",
      slider: { min: 0, max: 80, marca: 20 },
      sub: { clave: "minConsulta", titulo: "Minutos por consulta", opciones: [3, 5, 10] } },
    { clave: "documentos", titulo: "Documentos que reclaman o reciben al día (facturas, nóminas, recibos)", tipo: "slider",
      slider: { min: 0, max: 60, marca: 15 },
      sub: { clave: "minDocumento", titulo: "Minutos por documento", opciones: [2, 5, 10] } },
    { clave: "registros", titulo: "Datos que teclean a mano al día (facturas, asientos, altas y bajas)", tipo: "slider",
      slider: { min: 0, max: 80, marca: 20 },
      sub: { clave: "minRegistro", titulo: "Minutos por registro", opciones: [1, 2, 4] } },
    { clave: "personas", titulo: "Personas que se ocupan de estas tareas", tipo: "opcion",
      opciones: [
        { valor: 1, etiqueta: "1" },
        { valor: 2, etiqueta: "2" },
        { valor: 3, etiqueta: "3" },
        { valor: 4, etiqueta: "4 o más" }
      ] },
    { clave: "reclamar", titulo: "¿Cuántas veces reclaman la documentación a un mismo cliente?", tipo: "opcion",
      opciones: [
        { valor: "una", etiqueta: "Una vez y la manda" },
        { valor: "dos_tres", etiqueta: "Dos o tres veces" },
        { valor: "ultimo_dia", etiqueta: "Hasta el último día" },
        { valor: "no_controlado", etiqueta: "No controlado" }
      ] },
    { clave: "picos", titulo: "¿Cómo viven los cierres de trimestre y la campaña de la renta?", tipo: "opcion",
      opciones: [
        { valor: "tranquilos", etiqueta: "Tranquilos" },
        { valor: "horas_extra", etiqueta: "Con horas extra" },
        { valor: "desbordados", etiqueta: "Desbordados" }
      ] },
    { clave: "software", titulo: "¿Programa con portal para que el cliente suba sus documentos?", tipo: "opcion",
      opciones: [
        { valor: "si_usan", etiqueta: "Sí, y lo usan" },
        { valor: "si_poco", etiqueta: "Sí, pero casi no lo usan" },
        { valor: "no", etiqueta: "No" },
        { valor: "no_se", etiqueta: "No lo sé" }
      ] },
    { clave: "interes", titulo: "Si recuperaseis tiempo en consultas y documentación y los clientes recibieran respuestas y recordatorios automáticamente, ¿en qué nivel os interesaría?", tipo: "opcion",
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
      { cantidad: "documentos", minutos: "minDocumento" },
      { cantidad: "registros", minutos: "minRegistro" }
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
        subtitulo: "Hoy vuestro equipo dedica unas {horasAno} horas al año a consultas, documentación y datos tecleados a mano. Eso son {jornadasAno} jornadas completas y {costeAno} al año.",
        impulso: "Y vosotros mismos habéis dicho que os interesa que los clientes reciban respuestas y recordatorios sin que nadie los escriba. Eso es justo lo que se puede automatizar.",
        cta: "Agenda una cita con NorteIA para saber cómo"
      },
      B: {
        titular: "Podéis recuperar {horas} horas y {euros} al año.",
        subtitulo: "Hoy se van unas {horasAno} horas al año en consultas, documentación y datos tecleados a mano: {costeAno} al año. Aunque no sea una prioridad ahora mismo, es tiempo que vuestro equipo podría dedicar a asesorar.",
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
      { prioridad: 1, icono: "folder-clock", si: { clave: "reclamar", en: ["ultimo_dia", "no_controlado"] },
        texto: "Reclamar papeles hasta el último día: los recordatorios automáticos por cliente y trimestre lo resuelven." },
      { prioridad: 2, icono: "trending-up", si: { clave: "picos", en: ["horas_extra", "desbordados"] },
        texto: "Los picos de trimestre y renta se aplanan quitando el trabajo repetitivo del resto del año." },
      { prioridad: 3, icono: "folder-open", si: { clave: "software", en: ["si_poco", "no", "no_se"] },
        texto: "Si los clientes no suben sus documentos solos, todo pasa por el correo y el teléfono. Se puede ordenar sin cambiar de programa." }
    ],
    pie: "Estimación calculada con el salario mínimo más la Seguridad Social de la empresa ({costeHora} €/h, SMI 2026) y un {porcentajeAhorroPct} % de recuperación media por automatización. Con el coste real de vuestro equipo, el ahorro es mayor."
  },

  resumen: {
    titulo: "ESTIMACIÓN RÁPIDA NORTEIA - GESTORÍA",
    etiquetaNombre: "Gestoría",
    cabecera: [["tipo", "Tipo"]],
    lineas: [
      ["consultas", "Consultas al día"],
      ["documentos", "Documentos al día"],
      ["registros", "Datos tecleados a mano al día"],
      ["personas", "Personas que se ocupan"],
      ["reclamar", "Reclamar documentación"],
      ["picos", "Trimestres y renta"],
      ["software", "Portal de documentos"],
      ["interes", "Interés en respuestas automáticas"],
      ["percepcion", "Percepción del equipo", { sufijo: " al día" }]
    ]
  }
};
