# Estimación rápida de tiempo perdido · NorteIA

Web app para tablet en horizontal. Cochet elige el sector en una pestaña y hace 13-14 preguntas en la visita y la app estima las horas y los euros que el negocio pierde al año. No se presenta como una auditoría: es una estimación rápida para abrir la conversación. Termina con un botón para agendar cita, la llamada directa y un QR. Funciona sin conexión.

## 1. Publicar

Sube **esta carpeta** (`auditoria-norteia/`) a **Netlify** (arrastrar y soltar en *Add new site → Deploy manually*), a Cloudflare Pages o a GitHub Pages. Copia la URL HTTPS. El HTTPS es necesario para el modo offline.

## 2. Instalar en la tablet

1. Abre la URL con **Chrome (Android)** o **Safari (iPad)** con internet y espera 10 segundos.
2. Pulsa **"Añadir a pantalla de inicio"** y abre la app desde el icono.
3. Pon el **modo avión** y comprueba que sigue funcionando.

## 3. Configurar

**Cómo calcula (v1.8):**
- **Tiempo:** lo que suman las respuestas, con tope: nunca más horas al día de las que caben en la jornada de las personas que se ocupan (8 h por persona). Si se supera, el resultado lo avisa.
- **Coste:** cada hora a **11,75 €**, lo mínimo que cuesta a cualquier negocio (SMI 2026: 17.094 €/año, RD 126/2026, más la Seguridad Social de la empresa ×1,32, entre las 1.920 h/año que cuenta el cálculo). Está en `CONFIG.costeHora`.
- **Cifra principal:** lo que esas tareas les cuestan hoy (horas y euros al año), que sale de sus propias respuestas.
- **Lo recuperable:** se muestra en condicional y como rango orientativo (40-60 %; clínicas 45-65 %), nunca como promesa. Se ajusta en `porcentajeAhorroMin` y `porcentajeAhorro` de `config.js` o del bloque `parametros` de cada sector.

Edita **`config.js`** con cualquier editor de texto: coste/hora, % de ahorro, enlace de la cita, teléfono, contacto, preguntas extra y sectores visibles. Después vuelve a publicar.

Para que la tablet recoja la nueva versión, **sube `CACHE_VERSION` en `sw.js`** (por ejemplo `v1.1.0` → `v1.1.1`) y abre la app una vez con internet. Actualizar no borra el historial ni los emails pendientes.

- **Marca:** el logo es el oficial de norteia.es (`assets/logo-norteia.svg`, oscuro, y `assets/logo-norteia-blanco.svg`). Los colores (acento `#343BDF`) y la tipografía Outfit también vienen de la web; la tipografía está guardada en `assets/fonts/` para que funcione sin conexión. El icono de la app es la estrella del logo.
- **Botón «Agenda una cita»:** lleva al formulario de contacto de norteia.es (`CONFIG.enlaceCal`). Si más adelante usáis Cal.com, cambia ese enlace.
- **Contacto y redes de NorteIA:** se configuran en `CONFIG.contactoNorteIA` (web, email, WhatsApp, Instagram, LinkedIn) y en `CONFIG.telefono`. Salen en la barra de cita del resultado; los campos vacíos no se muestran.
- **Iconos:** iconos de línea (Lucide, licencia ISC) en `assets/iconos.js`, pintados con el color de la marca. En cada sector, `icono` es el nombre del icono.
- **Historial oculto (con PIN):** toca el logo 5 veces seguidas en la bienvenida (o abre la dirección de la app terminada en `#historial`) e introduce el PIN de 4 cifras (el inicial se comunica aparte, no está en el repositorio). Desde ahí se descarga el CSV, se reintentan los emails y se borra el historial.
  - Las visitas se borran solas a los **30 días** (`CONFIG.historial.diasRetencion`).
  - Tras descargar el CSV, la app propone borrar las visitas de la tablet.
  - **El PIN (8 cifras) se comprueba en el servidor** (`/api/acceso`, v2.0). Su huella PBKDF2 está solo en Vercel (`ACCESO_PIN_HASH`), nunca en la web. Si es correcto, la tablet recibe una sesión firmada de 8 horas. Cinco fallos seguidos bloquean 15 minutos. Para abrir el historial hace falta conexión (o una sesión abierta en las últimas 8 horas).
  - **Cambiar el PIN:** `node scripts/hash-pin.js <PIN nuevo>` y pegar el resultado en `ACCESO_PIN_HASH` (Vercel → Settings → Environment Variables) y volver a desplegar. **Cerrar todas las sesiones:** cambiar `ACCESO_SECRETO` por otro texto aleatorio y volver a desplegar.
- **Aviso legal y privacidad:** el pie de la bienvenida y del resultado enlaza a las páginas de norteia.es (`CONFIG.legal`).
- **Seguridad:** `vercel.json` publica las cabeceras de seguridad (CSP solo con recursos propios y `/api`, sin iframes, `nosniff`, `Referrer-Policy`, `Permissions-Policy`). El zoom está permitido.

## Sectores (pestañas)

Hay 10 sectores completos, cada uno con sus propias preguntas (13, o 14 en clínicas, inmobiliarias y restaurantes), cálculo, textos de resultado, señales y resumen:

Clínicas · Talleres · Gestorías · Peluquerías · Barberías · Spas y estética · Veterinarias · Inmobiliarias · Restaurantes · Academias y autoescuelas.

- Cada sector es **un archivo** en `niches/`. Ahí se cambian las preguntas, las opciones, los textos, el coste/hora y el «habitual» de cada slider sin tocar código.
- **Para ocultar un sector** en la tablet, quítalo de `CONFIG.nichosVisibles`. El orden de esa lista es el orden de las pestañas.
- **Para crear un sector nuevo,** copia uno parecido (por ejemplo `niches/peluquerias.js`), cambia el `id` y añádelo en `niches/index.js` y en `CONFIG.nichosVisibles`. Si un sector está mal configurado, se oculta y el motivo aparece en la consola del navegador.
- De dónde salen los costes por hora y los volúmenes: [`niches/FUENTES.md`](niches/FUENTES.md).
- **Preguntas comunes (propuestas por Cochet, v1.9):** tiempo al día devolviendo llamadas (suma al cálculo: 0, 10, 20, 45 o 60 min/día), la tarea repetitiva que más os gustaría dejar de hacer, cuánto cuesta retomar el trabajo tras una interrupción y, en clínicas, inmobiliarias y restaurantes, si se envían recordatorios de cita, visita o reserva. Las cualitativas no cambian el cálculo: salen en el resumen, el email y, algunas, como señal en el resultado.
- **Observaciones:** en la última pregunta, el botón «Observaciones» abre un campo libre (hasta 1.000 caracteres, con contador) para lo que cuente el negocio. Se autoguarda mientras se escribe (si la app se cierra a medias, la bienvenida ofrece recuperarlas), se guarda en el registro (`observaciones`), se puede editar en «Ver y compartir resumen», sale como columna `Observaciones` en el CSV y como bloque OBSERVACIONES en el email («(sin observaciones)» si está vacío). No cambia el cálculo.

---

## Apéndice: envío automático por email (función propia `/api/enviar` + Gmail)

Cuando el email está activado, en el resultado aparece el botón **«Enviar este resumen a NorteIA»** con un aviso de privacidad. Nunca está marcado de antemano: el resumen solo sale si el negocio lo acepta.

Cómo funciona (v2.0): la tablet manda el resumen a **`/api/enviar`**, una función de Vercel de este proyecto. La función comprueba la **clave de la tablet**, el origen, el tamaño y los límites (10 por minuto e IP, 30 por hora y tablet), y lo envía con la **API de Gmail** de Google Workspace como **cuestionarios@norteia.es** (alias de victor@norteia.es) a **victor@norteia.es y luis@norteia.es**. El dominio tiene SPF, DKIM y DMARC, así que el correo sale firmado y no cae en spam. No se usa ninguna librería externa: la firma JWT de la cuenta de servicio se hace con el `crypto` de Node.

- **Con el email desactivado no se guarda ninguna cola.** Sin conexión, queda **pendiente** y se reintenta (1, 5, 15, 60 y 360 min) con la app abierta o al volver a abrirla.
- **"Enviado"** significa *aceptado por Gmail*. Cada revisión lleva un `Message-ID` fijo (ID + revisión + contenido), para que un reintento no genere duplicados.
- **Transición:** mientras no existan `GOOGLE_SA_EMAIL` y `GOOGLE_SA_KEY`, la función sigue enviando con Resend (`RESEND_API_KEY`, `EMAIL_REMITENTE`, `EMAIL_DESTINO`). Cuando el envío por Gmail esté probado, se borran esas tres variables y la clave en Resend.

### Variables de entorno (Vercel → `norteia-auditoria` → Settings → Environment Variables, Production)

| Variable | Qué es | Secreta |
|---|---|---|
| `GOOGLE_SA_EMAIL` | correo de la cuenta de servicio (`…@….iam.gserviceaccount.com`) | no |
| `GOOGLE_SA_KEY` | `private_key` del JSON de la cuenta de servicio (también vale pegar el JSON entero) | sí |
| `TABLETAS` | JSON `{"nombre": "sha256 de la clave"}`, una entrada por tablet | sí |
| `ACCESO_PIN_HASH` / `ACCESO_SECRETO` | PIN del historial y firma de sesiones (ver arriba) | sí |
| `ORIGENES_PERMITIDOS` | `https://norteia-auditoria.vercel.app` | no |
| Opcionales | `GMAIL_USUARIO` (por defecto victor@norteia.es), `GMAIL_REMITENTE`, `GMAIL_DESTINO` | no |

### Puesta en marcha de Gmail (una vez)

1. En el Gmail de victor@norteia.es: *Configuración → Cuentas → Enviar como* → añadir `cuestionarios@norteia.es`.
2. En Google Cloud, con la cuenta de norteia.es: crear un proyecto, activar **Gmail API**, crear una **cuenta de servicio** y descargar su clave JSON.
3. Pasar a Luis el **ID de cliente** de la cuenta de servicio (un número, no es secreto). Luis la autoriza en *admin.google.com → Seguridad → Controles de API → Delegación de todo el dominio* con un único permiso: `https://www.googleapis.com/auth/gmail.send`.
4. Pegar en Vercel `GOOGLE_SA_EMAIL` y `GOOGLE_SA_KEY` (marcada como *Sensitive*). La clave no va al repositorio, ni por correo ni por WhatsApp. Después, borrar el JSON descargado del ordenador.
5. Volver a desplegar, hacer una visita ficticia y comprobar en Gmail (*Mostrar original*) que SPF, DKIM y DMARC salen en **PASS**.

### Tablets

- **Dar de alta una tablet:** `node scripts/clave-tablet.js <nombre>`. Escribe la clave en la tablet (historial → *Clave de envío*) y añade la línea que muestra al JSON de `TABLETAS`. Después, volver a desplegar.
- **Revocar una tablet** (pérdida o robo): quitar su entrada de `TABLETAS` y volver a desplegar. Esa tablet deja de poder enviar al instante; las demás siguen igual.
- Los errores aparecen en el historial por destinatario: «Clave de envío de la tablet incorrecta o ausente», «Envío sin configurar en el servidor», «Gmail: …» (permisos o alias). No se reintentan solos: se corrigen y se pulsa «Reintentar pendientes».

### Alternativa sin servidor: EmailJS (desactivada)

El código sigue en `email.js` con `proveedor: "emailjs"`, pero desde la v2.0 la CSP ya no permite `api.emailjs.com`. Para usarla habría que volver a añadirlo a `connect-src` en `vercel.json`. Expone los identificadores en la web: no se recomienda.

1. Crea una cuenta **Free** en https://www.emailjs.com y conecta un **buzón de trabajo de NorteIA**. Copia el **Service ID**.
2. Crea una plantilla por destinatario con su dirección real en **To Email** (nunca `{{to_email}}`), asunto `[NorteIA] {{nombre_cliente}} · {{fecha_local}} · {{tipo_envio}}` y el body de abajo.
3. Copia `config.local.example.js` como **`config.local.js`** (está en `.gitignore`), rellena Service ID, Public Key y Template ID, y pon `proveedor: "emailjs"` y `configLocal: true` en `CONFIG.email`. **Nunca** copies la Private Key.

**Body de las dos plantillas** (texto; en HTML, usa `<pre>` o `white-space: pre-line` para conservar los saltos de línea):

```text
ESTIMACIÓN RÁPIDA NORTEIA
{{tipo_envio}}
ID: {{auditoria_id}} · Revisión: {{revision}}
Fecha de visita: {{fecha_local}} (Europe/Madrid)
Fecha original ISO: {{fecha_iso}}
Sector: {{nicho_nombre}}
Cliente: {{nombre_cliente}}
Realizada por: Cochet

RESPUESTAS COMPLETAS
{{respuestas_texto}}

RESULTADO ESTIMADO
{{calculo_texto}}

INTERÉS DECLARADO
{{interes_texto}}

CONTACTO
{{contacto_texto}}

OBSERVACIONES
{{observaciones}}

PRÓXIMO PASO
{{proximo_paso}}

Estimación basada en las respuestas, no un ahorro garantizado.
Puede recibirse con retraso si la visita se realizó sin conexión.
Si hay varias revisiones del mismo ID, utilizar la de número más alto.
```

**Duplicados (solo EmailJS):** si se corta la conexión justo después de que EmailJS acepte el envío, el reintento puede mandar el mismo email dos veces. Por eso el ID y la revisión van en cada email.

**Privacidad:** el PIN se comprueba en el servidor, pero las visitas viven en la tablet: quien tenga la tablet desbloqueada y conocimientos técnicos podría leerlas. Usa siempre el bloqueo de pantalla de la tablet. Las visitas se borran solas a los 30 días; los emails quedan en los buzones de Google Workspace de NorteIA. Si activas `capturarContacto` (persona, cargo, email y teléfono del cliente), revisa antes el aviso `avisoContacto` y la base jurídica. Esta app no garantiza por sí sola el cumplimiento del RGPD.

---

## Pruebas

```bash
node --test                 # motor + cola de email con mocks (sin red)
node tests/e2e.mjs          # Chromium con Playwright: flujo, offline, email simulado, multi-nicho; capturas en tests/salida/
```

Las pruebas con mocks **no** comprueban que el email llegue a las bandejas. Esa prueba es manual (paso 7 de «Lo que hay que preparar»).

La checklist para pasar en la tablet real está en [`CHECKLIST.md`](CHECKLIST.md).

## Archivos

| Archivo | Para qué |
|---|---|
| `config.js` | Configuración editable (sin identificadores reales) |
| `config.local.example.js` | Plantilla para `config.local.js` (EmailJS; no se sube a Git) |
| `niches/*.js` | Un archivo por sector: preguntas, cálculo, textos y resumen (10 sectores) |
| `niches/FUENTES.md` | Fuentes de los costes por hora y volúmenes de cada sector |
| `motor.js` | Cálculo, validación de nichos, textos, resumen, CSV e instantánea del email |
| `app.js` | Pantallas e interacción |
| `almacen.js` | Historial en el dispositivo (`localStorage`, clave `norteia_auditorias_v1`) |
| `email.js` | Cola de envíos, reintentos y transporte (función propia `/api/enviar` o EmailJS) |
| `api/enviar.js` | Función de Vercel que valida la tablet y envía cada resumen con Gmail |
| `api/acceso.js` | Función de Vercel que comprueba el PIN del historial y firma la sesión |
| `api/_comun.js` | Utilidades compartidas por las funciones |
| `scripts/` | `hash-pin.js` (huella del PIN) y `clave-tablet.js` (clave de una tablet nueva); no se publican |
| `sw.js` | Caché offline (`CACHE_VERSION`) |
| `assets/qr.js` | Generador de QR local (Kazuhiko Arase, licencia MIT) |
