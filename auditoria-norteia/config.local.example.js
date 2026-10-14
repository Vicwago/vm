/*
 * EJEMPLO de configuración local. NO contiene valores reales.
 *
 * 1. Copia este archivo como "config.local.js" (en la misma carpeta).
 *    config.local.js está en .gitignore: nunca se sube al repositorio.
 * 2. Rellena los identificadores PÚBLICOS de EmailJS (Service ID, Template IDs y Public Key).
 * 3. Pon habilitado: true solo después de hacer la prueba de la sección 17 del README.
 *
 * OJO: este archivo se publica con la web, así que cualquiera que inspeccione la app
 * puede verlo. Solo puede contener identificadores públicos. NUNCA pongas aquí la
 * Private Key, contraseñas, tokens ni claves del proveedor de correo.
 *
 * Solo cambia CONFIG.email (no sustituye el resto de CONFIG).
 */
(function () {
  var email = window.CONFIG && window.CONFIG.email;
  if (!email) return;

  email.habilitado = false;              // true tras configurar y probar
  email.serviceId = "service_xxxxxxx";   // Email Services -> Service ID
  email.publicKey = "xxxxxxxxxxxxxxxxx"; // Account -> Public Key (NO la Private Key)
  email.destinatarios = [
    { id: "victor", nombre: "Victor", templateId: "template_xxxxxxx" }, // plantilla auditoria_victor
    { id: "luis", nombre: "Luis", templateId: "template_yyyyyyy" }      // plantilla auditoria_luis
  ];
  // email.capturarContacto = true;      // [DECIDIR] tras aprobar el aviso de privacidad
})();
