/*
 * CONFIGURACIÓN DE LA APP (editable con cualquier editor de texto).
 * Después de cambiar algo: subir CACHE_VERSION en sw.js y volver a publicar.
 * Este archivo se publica con la web: no pongas aquí datos personales ni claves.
 * Los identificadores de EmailJS van en config.local.js (ver config.local.example.js).
 */
window.CONFIG = {
  // Marca
  nombreEmpresa: "NorteIA",
  logo: "assets/logo-norteia.svg",

  // Cálculo (cada sector puede pisar estos valores en su bloque "parametros")
  // Coste de una hora de trabajo: salario mínimo 2026 (17.094 €/año, RD 126/2026) más la Seguridad
  // Social de la empresa (x 1,32) entre las horas que cuenta el cálculo (5 días x 48 semanas x 8 h =
  // 1.920 h) = 11,75 €/h. Es lo mínimo que cuesta a cualquier negocio una hora de su equipo.
  costeHora: 11.75,
  // Rango orientativo de lo recuperable automatizando (se muestra en condicional, nunca como promesa)
  porcentajeAhorroMin: 0.40,
  porcentajeAhorro: 0.60,
  diasSemana: 5,
  semanasAno: 48,

  // Cita y contacto
  // Destino del botón de cita: formulario de contacto de norteia.es (orientación).
  enlaceCal: "https://norteia.es/contacto?objetivo=orientacion&utm_source=auditoria-tablet",
  telefono: "+34 637 90 58 66",

  // Datos de NorteIA que se muestran en el resultado (vacío = no se muestra)
  contactoNorteIA: {
    web: "https://www.norteia.es",
    email: "contacto@norteia.es",
    whatsapp: "34637905866",
    instagram: "",
    linkedin: ""
  },

  // Textos legales (pie de la bienvenida y del resultado)
  legal: {
    avisoLegal: "https://norteia.es/aviso-legal",
    privacidad: "https://norteia.es/privacidad"
  },

  // Historial de visitas en la tablet (se abre con 5 toques al logo)
  historial: {
    // Huella SHA-256 de "norteia:" + PIN. El PIN inicial se comunica aparte; para cambiarlo, ver README.
    pinHuella: "bc983c0ca62f0a1f3b8a907ca6dd7c7454b465761492bec5a3cfc73a9480777a",
    diasRetencion: 30,            // las visitas se borran solas pasado este plazo (0 = nunca)
    ofrecerBorrarTrasExportar: true
  },

  // Preguntas extra (solo clínicas)
  extrasActivas: {
    noShows: false,
    fueraHorario: false
  },

  // Sectores
  nichoPorDefecto: "clinicas",
  // Orden de las pestañas. Quita un id para ocultar ese sector en la tablet.
  nichosVisibles: ["clinicas", "talleres", "gestorias", "peluquerias", "barberias", "spas",
                   "veterinarias", "inmobiliarias", "restaurantes", "academias"],
  modoDesarrollo: false,

  // Varios
  versionApp: "1.7",
  pantallaCalculandoMs: 1200
};

// Envío por email de cada visita (EmailJS). Desactivado: con el email apagado no se guarda
// ninguna cola de envío. Antes de activarlo, ver README (consentimiento y aviso de privacidad).
window.CONFIG.email = {
  habilitado: false,
  configLocal: false,       // true para cargar config.local.js con los identificadores de EmailJS
  pedirConsentimiento: true, // el envío solo sale si el negocio lo acepta en la pantalla de resultado
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
  capturarContacto: false,
  avisoContacto: "Estos datos se envían por email a NorteIA solo para contactar sobre esta estimación.",
  avisoEnvio: "Al enviarlo, NorteIA recibe este resumen (nombre del negocio y respuestas) para preparar la conversación. Más información en la política de privacidad."
};
