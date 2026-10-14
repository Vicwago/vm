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
  logo: "assets/logo-norteia.svg", // logo oficial de norteia.es (oscuro). Variante: assets/logo-norteia-blanco.svg

  // Cálculo (cada nicho puede pisar estos valores en su bloque "parametros")
  // Coste/hora = SALARIO MÍNIMO + SEGURIDAD SOCIAL DE LA EMPRESA:
  // SMI 2026 (17.094 €/año, RD 126/2026) x 1,32 (cotizaciones a cargo de la empresa: contingencias
  // comunes, desempleo, FOGASA, formación, MEI y accidentes ≈ 32 %) / jornada máxima anual (1.826 h)
  // = 12,36 €/h. Es el mínimo que le cuesta a un negocio una hora de su equipo: el ahorro real es mayor.
  costeHora: 12.36,
  porcentajeAhorro: 0.65,   // [DECIDIR] entre 0.60 y 0.70 (fracción recuperable por automatización)
  diasSemana: 5,
  semanasAno: 48,

  // Cita y contacto
  // Destino del botón "Agenda una cita": formulario de contacto de norteia.es (orientación).
  // Si más adelante usáis Cal.com, poned aquí ese enlace.
  enlaceCal: "https://norteia.es/contacto?objetivo=orientacion&utm_source=auditoria-tablet",
  telefono: "+34 637 90 58 66",   // Víctor (Luis: +34 623 75 84 13)

  // Datos de NorteIA que se muestran en el resultado (vacío = no se muestra)
  contactoNorteIA: {
    web: "https://www.norteia.es",
    email: "contacto@norteia.es",
    whatsapp: "34637905866", // número con prefijo, sin espacios (vacío = no se muestra)
    instagram: "",  // norteia.es no enlaza redes; añadir la URL cuando exista
    linkedin: ""    // ídem
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
  versionApp: "1.5",
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
