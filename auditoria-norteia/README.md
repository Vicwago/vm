# Estimación rápida de tiempo perdido · NorteIA

Web app para tablet en horizontal. Cochet elige el sector en una pestaña y hace 10 preguntas en la visita y la app estima las horas y los euros que el negocio pierde al año. No se presenta como una auditoría: es una estimación rápida para abrir la conversación. Termina con un botón para agendar cita, la llamada directa y un QR. Funciona sin conexión.

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
  - **Cambiar el PIN:** en `CONFIG.historial.pinHuella` va la huella SHA-256 del texto `norteia:` seguido del PIN. Por ejemplo, para el PIN 1234 se calcula la huella de `norteia:1234`. Pídeselo a Luis o a Claude si no sabes generarla.
- **Aviso legal y privacidad:** el pie de la bienvenida y del resultado enlaza a las páginas de norteia.es (`CONFIG.legal`).
- **Seguridad:** `vercel.json` publica las cabeceras de seguridad (CSP solo con recursos propios, `/api/enviar` y `api.emailjs.com` para la alternativa, sin iframes, `nosniff`, `Referrer-Policy`, `Permissions-Policy`). El zoom está permitido.

## Sectores (pestañas)

Hay 10 sectores completos, cada uno con sus propias 10 preguntas, cálculo, textos de resultado, señales y resumen:

Clínicas · Talleres · Gestorías · Peluquerías · Barberías · Spas y estética · Veterinarias · Inmobiliarias · Restaurantes · Academias y autoescuelas.

- Cada sector es **un archivo** en `niches/`. Ahí se cambian las preguntas, las opciones, los textos, el coste/hora y el «habitual» de cada slider sin tocar código.
- **Para ocultar un sector** en la tablet, quítalo de `CONFIG.nichosVisibles`. El orden de esa lista es el orden de las pestañas.
- **Para crear un sector nuevo,** copia uno parecido (por ejemplo `niches/peluquerias.js`), cambia el `id` y añádelo en `niches/index.js` y en `CONFIG.nichosVisibles`. Si un sector está mal configurado, se oculta y el motivo aparece en la consola del navegador.
- De dónde salen los costes por hora y los volúmenes: [`niches/FUENTES.md`](niches/FUENTES.md).

---

## Apéndice: envío automático por email (función propia `/api/enviar` + Resend)

Cuando el email está activado, en el resultado aparece el botón **«Enviar este resumen a NorteIA»** con un aviso de privacidad. Nunca está marcado de antemano: el resumen solo sale si el negocio lo acepta.

Cómo funciona (recomendación de la auditoría de Luis, A3): la tablet manda el resumen a **`/api/enviar`**, una función de Vercel en este mismo proyecto (`api/enviar.js`). La función comprueba la **clave de la tablet**, el origen, el tamaño y un límite de 10 envíos por minuto, y lo envía con **Resend** a los correos de NorteIA. **La clave de Resend y los correos de destino nunca están en la web:** viven en las variables de entorno de Vercel.

- **Con el email desactivado no se guarda ninguna cola:** al activarlo no se envía nada de lo hecho antes.
- Si no hay conexión, queda **pendiente** y se reintenta (1, 5, 15, 60 y 360 min) con la app abierta o al volver a abrirla.
- **"Enviado"** significa *aceptado por Resend*. No confirma que haya llegado a la bandeja de entrada.
- **Sin duplicados:** cada envío lleva una clave de idempotencia (ID + revisión + contenido), así que un reintento tras un corte no manda el mismo email dos veces.
- **Plan gratis de Resend:** 3.000 emails al mes y 100 al día. Cada visita es 1 email (con varios destinatarios).

### Lo que hay que preparar (una vez)

1. **Cuenta de Resend** (https://resend.com, plan Free).
2. **Verificar el dominio `norteia.es`** en Resend (*Domains → Add domain*) y añadir en el DNS del dominio los registros que indica (DKIM y SPF; DMARC recomendado). Sin dominio verificado, Resend solo entrega al email con el que se creó la cuenta.
3. **API key** en Resend con permiso **Sending access** (solo envío), limitada al dominio `norteia.es`.
4. En **Vercel → proyecto `norteia-auditoria` → Settings → Environment Variables** (entorno *Production*):

| Variable | Valor | Secreta |
|---|---|---|
| `RESEND_API_KEY` | la API key del paso 3 | sí |
| `CLAVE_DISPOSITIVO` | una clave larga aleatoria (p. ej. 32 caracteres) que se teclea una vez en la tablet | sí |
| `EMAIL_REMITENTE` | `NorteIA · Estimaciones <estimaciones@norteia.es>` (del dominio verificado) | no |
| `EMAIL_DESTINO` | correos separados por comas, p. ej. `victor@…,luis@…` | no |
| `ORIGENES_PERMITIDOS` | `https://norteia-auditoria.vercel.app` | no |

5. Pon `habilitado: true` en `CONFIG.email` de `config.js`, sube `CACHE_VERSION` en `sw.js` y publica (las variables nuevas solo se aplican en un despliegue nuevo).
6. En la tablet: abre el historial (5 toques al logo + PIN), escribe la **clave de envío** (`CLAVE_DISPOSITIVO`) y pulsa **Guardar**. Queda guardada solo en esa tablet.
7. Haz una visita **ficticia** con un nombre reconocible, acepta el envío y comprueba las bandejas (también spam).

**Si algo falla**, el historial lo muestra por destinatario: «Clave de envío de la tablet incorrecta o ausente» (paso 6), «Envío sin configurar en el servidor» (paso 4), «Servicio de email: …» (dominio o remitente, pasos 2-3). Esos errores no se reintentan solos: corrígelos y pulsa «Reintentar pendientes».

**Si se pierde o se roba una tablet:** cambia `CLAVE_DISPOSITIVO` en Vercel y vuelve a desplegar; las demás tablets necesitarán la clave nueva.

### Alternativa sin servidor: EmailJS

Sigue disponible con `proveedor: "emailjs"`, pero expone los identificadores en la web (cualquiera podría gastar la cuota). Solo si no se puede usar la función propia.

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

PRÓXIMO PASO
{{proximo_paso}}

Estimación basada en las respuestas, no un ahorro garantizado.
Puede recibirse con retraso si la visita se realizó sin conexión.
Si hay varias revisiones del mismo ID, utilizar la de número más alto.
```

**Duplicados (solo EmailJS):** si se corta la conexión justo después de que EmailJS acepte el envío, el reintento puede mandar el mismo email dos veces. Por eso el ID y la revisión van en cada email.

**Privacidad [DECIDIR]:** el acceso por 5 toques solo oculta la pantalla, no protege los datos. Usa el bloqueo de la tablet. Antes de usar datos reales, decide cuánto tiempo se guardan en la tablet y en el proveedor de email (Resend guarda un registro de los envíos). Si activas `capturarContacto` (persona, cargo, email y teléfono del cliente), revisa antes el aviso `avisoContacto` y la base jurídica. Esta app no garantiza por sí sola el cumplimiento del RGPD.

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
| `api/enviar.js` | Función de Vercel que valida y envía cada resumen con Resend |
| `sw.js` | Caché offline (`CACHE_VERSION`) |
| `assets/qr.js` | Generador de QR local (Kazuhiko Arase, licencia MIT) |
