/*
 * CONFIGURACIÓN DE LA APP (editable con cualquier editor de texto).
 * Los valores marcados [DECIDIR] los elige Victor.
 * Después de cambiar algo: subir CACHE_VERSION en sw.js y volver a publicar.
 *
 * IMPORTANTE: este archivo va al repositorio. No pongas aquí identificadores
 * reales de EmailJS: van en config.local.js (ver config.local.example.js).
 */
window.CONFIG = {
  // Marca
  nombreEmpresa: "NorteIA",
  logo: "assets/logo-norteia.svg", // logo NorteIA (azul). Para usar un PNG: "assets/logo-norteia.png"

  // Cálculo (cada nicho puede pisar estos valores en su bloque "parametros")
  costeHora: 14,            // [DECIDIR] euros por hora de trabajo del equipo
  porcentajeAhorro: 0.65,   // [DECIDIR] entre 0.60 y 0.70 (fracción recuperable por automatización)
  diasSemana: 5,
  semanasAno: 48,

  // Cita y contacto
  enlaceCal: "https://cal.com/PENDIENTE-USUARIO/diagnostico", // [DECIDIR] enlace Cal.com real
  telefono: "+34 600 000 000",                                // [DECIDIR] teléfono real de NorteIA o de Cochet

  // Datos de NorteIA que se muestran en el resultado (vacío = no se muestra)
  contactoNorteIA: {
    web: "https://www.norteia.es",
    email: "victor@norteia.es",
    whatsapp: "",   // [DECIDIR] número con prefijo, sin espacios, p. ej. "34600000000"
    instagram: "",  // [DECIDIR] URL completa del perfil
    linkedin: ""    // [DECIDIR] URL de la página de empresa (o https://www.linkedin.com/in/victormago)
  },

  // Preguntas extra (solo 2)
  extrasActivas: {
    noShows: false,        // [DECIDIR]
    fueraHorario: false    // [DECIDIR]
  },

  // Nichos
  nichoPorDefecto: "clinicas",
  // Orden de las pestañas. Quita un id para ocultar ese sector en la tablet.
  nichosVisibles: ["clinicas", "talleres", "gestorias", "peluquerias", "barberias", "spas",
                   "veterinarias", "inmobiliarias", "restaurantes", "academias"],
  modoDesarrollo: false,          // true = muestra nichos incompletos con etiqueta [COMPLETAR]

  // Varios
  versionApp: "1.2",
  pantallaCalculandoMs: 1200
};

// Envío automático de cada auditoría por email (EmailJS, plan Free).
// Defaults públicos, sin identificadores reales: se rellenan en config.local.js.
window.CONFIG.email = {
  habilitado: false, // true solo tras configurar y probar
  proveedor: "emailjs",
  serviceId: "",
  publicKey: "",
  destinatarios: [
    { id: "victor", nombre: "Victor", templateId: "" },
    { id: "luis", nombre: "Luis", templateId: "" }
  ],
  timeoutMs: 20000,
  intervaloMinimoMs: 1500,
  reintentosMinutos: [1, 5, 15, 60, 360],
  capturarContacto: false, // [DECIDIR], mantiene intacto el cuestionario
  // [DECIDIR] Texto que se muestra junto al bloque de contacto. Revisarlo antes de usar datos reales.
  avisoContacto: "Estos datos se envían por email a NorteIA solo para contactar sobre esta auditoría."
};
