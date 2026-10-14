// Nicho de prueba (checklist 14.4): 3 preguntas, 2 líneas de cálculo, completo. No se publica en la app.
self.NICHOS = self.NICHOS || {};
self.NICHOS.prueba = {
  id: "prueba", nombre: "Prueba", icono: "🧪", completo: true,
  tituloApp: "Auditoría de prueba", subtituloBienvenida: "Nicho de prueba del motor.",
  campoNombre: "Nombre del negocio (opcional)", articuloCliente: "el negocio",
  parametros: { costeHora: 20 },
  preguntas: [
    { clave: "pedidos", titulo: "Pedidos al día", tipo: "slider", slider: { min: 0, max: 30, marca: 10 },
      sub: { clave: "minPedido", titulo: "Minutos por pedido", opciones: [3, 6] } },
    { clave: "llamadas", titulo: "Llamadas al día", tipo: "slider", slider: { min: 0, max: 20, marca: 5 },
      sub: { clave: "minLlamada", titulo: "Minutos por llamada", opciones: [2, 4] } },
    { clave: "percepcion", titulo: "Horas al día que creen perder", tipo: "opcion",
      opciones: [ { valor: "bajo", etiqueta: "Menos de 3" }, { valor: "alto", etiqueta: "3 o más" } ] }
  ],
  calculo: {
    lineas: [ { cantidad: "pedidos", minutos: "minPedido" }, { cantidad: "llamadas", minutos: "minLlamada" } ],
    percepcion: { clave: "percepcion", rangos: [
      { valor: "bajo", min: 0, max: 3, texto: "menos de 3 horas" },
      { valor: "alto", min: 3, max: null, texto: "3 horas o más" } ] }
  },
  resultado: {
    selectorVariante: { clave: "percepcion", mapa: { bajo: "A", alto: "C" } },
    variantes: {
      A: { titular: "{nombreCliente}: {horas} h y {euros}.", titularSinNombre: "Prueba A: {horas} h y {euros}.", subtitulo: "{horasAno} h/año.", impulso: "Impulso A", cta: "Cita" },
      B: { titular: "Prueba B: {horas} h.", subtitulo: "Sub B", impulso: "Impulso B", cta: "Cita" },
      C: { titular: "Prueba C: {horas} h.", subtitulo: "Sub C", impulso: "Impulso C", cta: "Cita" }
    },
    volumenBajo: "Volumen bajo de prueba.",
    contraste: { titulo: "Contraste", mayor: "Mayor {horasDiaCalc}", coincide: "Coincide {horasDiaCalc}", menor: "Menor {horasDiaCalc}" },
    senales: [],
    pie: "Pie {porcentajeAhorroPct} %"
  },
  resumen: { titulo: "AUDITORÍA DE PRUEBA", etiquetaNombre: "Negocio", lineas: [ ["pedidos", "Pedidos al día"], ["llamadas", "Llamadas al día"], ["percepcion", "Percepción"] ] }
};
