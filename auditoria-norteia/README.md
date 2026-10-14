# Auditoría rápida de tiempo perdido · NorteIA

Web app para tablet en horizontal. Cochet hace 10 preguntas en la visita y la app calcula las horas y los euros que el negocio pierde al año. Termina con un botón para agendar cita, la llamada directa y un QR. Funciona sin conexión.

## 1. Publicar

Sube **esta carpeta** (`auditoria-norteia/`) a **Netlify** (arrastrar y soltar en *Add new site → Deploy manually*), a Cloudflare Pages o a GitHub Pages. Copia la URL HTTPS. El HTTPS es necesario para el modo offline.

## 2. Instalar en la tablet

1. Abre la URL con **Chrome (Android)** o **Safari (iPad)** con internet y espera 10 segundos.
2. Pulsa **"Añadir a pantalla de inicio"** y abre la app desde el icono.
3. Pon el **modo avión** y comprueba que sigue funcionando.

## 3. Configurar

Edita **`config.js`** con cualquier editor de texto: coste/hora, % de ahorro, enlace de Cal.com, teléfono, preguntas extra y nichos visibles. Después vuelve a publicar.

Para que la tablet recoja la nueva versión, **sube `CACHE_VERSION` en `sw.js`** (por ejemplo `v1.1.0` → `v1.1.1`) y abre la app una vez con internet. Actualizar no borra el historial ni los emails pendientes.

- **Logo:** sustituye `assets/logo-norteia.svg` usando el mismo nombre. Los iconos están en `assets/icon-192.png` y `assets/icon-512.png`.
- **Historial oculto:** toca el logo 5 veces seguidas en la bienvenida. Desde ahí puedes descargar el CSV, reintentar los emails y borrar el historial.
- **Nichos:** cada sector es un archivo en `niches/`. Talleres y Gestorías tienen la estructura lista, pero sus textos están marcados `[COMPLETAR]`. Para activar uno:
  1. Rellénalo.
  2. Pon `completo: true`.
  3. Añádelo a `CONFIG.nichosVisibles`.

  Para crear un sector nuevo, copia `niches/clinicas.js` y añade su id en `niches/index.js`. No hace falta tocar `app.js`. Si un nicho está mal configurado, se oculta y el motivo aparece en la consola del navegador.

---

## Apéndice: envío automático por email (EmailJS, plan gratis)

Al llegar al resultado, la auditoría se guarda en la tablet y se envía sola a Victor y a Luis, cada uno con su propia plantilla. Si no hay conexión, queda **pendiente**. Se reintenta con la app abierta o la próxima vez que se abra. Si la app está cerrada, no se envía nada.

- **"Enviado"** significa *aceptado por EmailJS*. **No confirma** que haya llegado a la bandeja de entrada.
- **Presupuesto del plan Free:** 200 peticiones al mes. Cada auditoría usa 2, así que salen unas 80 auditorías al mes con margen. Las pruebas y los reintentos también cuentan.
- **Ojo al activar:** las visitas hechas mientras el email estaba desactivado se quedaron pendientes y se enviarán todas. Antes de activarlo, borra el historial de pruebas si no quieres que se envíen.

### Pasos (los hace Victor; nada se configura automáticamente)

1. Crea una cuenta **Free** en https://www.emailjs.com (no contrates un plan de pago).
2. **[DECIDIR]** Conecta un **buzón de trabajo de NorteIA**, no tu Gmail personal: *Email Services → Add New Service → Connect account*. Copia el **Service ID**.
3. En *Email Templates* crea la plantilla `auditoria_victor` y, en **To Email**, escribe la dirección real de Victor. Duplícala como `auditoria_luis` con la dirección de Luis. **[DECIDIR]** Confirma las dos direcciones. Nunca uses `{{to_email}}`.
4. Configura las dos plantillas así:
   - **From Name:** `NorteIA · Auditoría rápida`
   - **From Email:** el que viene por defecto
   - **Reply-To:** vacío o el buzón de trabajo
   - **CC/BCC:** vacíos
   - **Subject:** `[NorteIA] {{nombre_cliente}} · {{fecha_local}} · {{tipo_envio}}`
   - **Body:** el texto de abajo
5. Copia los dos **Template ID** y la **Public Key** (*Account*). **Nunca** copies la Private Key, contraseñas ni tokens.
6. Copia `config.local.example.js` como **`config.local.js`** y rellénalo. Ese archivo ya está en `.gitignore`, así que **no se sube a GitHub**. Publícalo junto al resto de la carpeta.

   Ojo: aunque no esté en el repositorio, quien inspeccione la web puede leerlo. Por eso solo lleva identificadores públicos. Esos identificadores permiten gastar la cuota de envíos. Si ese riesgo no es aceptable, hace falta un backend.
7. Haz una auditoría **ficticia** con un nombre reconocible y comprueba las dos bandejas (también la carpeta de spam).
8. Prueba el modo avión, cerrar y reabrir la app y un fallo parcial (checklist de abajo). Después pon `habilitado: true`, sube `CACHE_VERSION` y publica.

**Body de las dos plantillas** (texto; en HTML, usa `<pre>` o `white-space: pre-line` para conservar los saltos de línea):

```text
AUDITORÍA RÁPIDA NORTEIA
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

**Duplicados:** si se corta la conexión justo después de que EmailJS acepte el envío, el reintento puede mandar el mismo email dos veces. Por eso el ID y la revisión van en cada email.

**Privacidad [DECIDIR]:** el acceso por 5 toques solo oculta la pantalla, no protege los datos. Usa el bloqueo de la tablet. Antes de usar datos reales, decide cuánto tiempo se guardan en la tablet y en EmailJS (el historial de EmailJS se puede desactivar en cada plantilla). Si activas `capturarContacto` (persona, cargo, email y teléfono del cliente), revisa antes el aviso `avisoContacto` y la base jurídica. Esta app no garantiza por sí sola el cumplimiento del RGPD.

---

## Pruebas

```bash
node --test                 # motor + cola de email con mocks (sin red)
node tests/e2e.mjs          # Chromium con Playwright: flujo, offline, email simulado, multi-nicho; capturas en tests/salida/
```

Las pruebas con mocks **no** comprueban que el email llegue a las bandejas. Esa prueba es manual (paso 7).

La checklist para pasar en la tablet real está en [`CHECKLIST.md`](CHECKLIST.md).

## Archivos

| Archivo | Para qué |
|---|---|
| `config.js` | Configuración editable (sin identificadores reales) |
| `config.local.example.js` | Plantilla para `config.local.js` (EmailJS; no se sube a Git) |
| `niches/*.js` | Un archivo por sector: preguntas, cálculo, textos y resumen |
| `motor.js` | Cálculo, validación de nichos, textos, resumen, CSV e instantánea del email |
| `app.js` | Pantallas e interacción |
| `almacen.js` | Historial en el dispositivo (`localStorage`, clave `norteia_auditorias_v1`) |
| `email.js` | Cola de envíos, reintentos y transporte REST a EmailJS |
| `sw.js` | Caché offline (`CACHE_VERSION`) |
| `assets/qr.js` | Generador de QR local (Kazuhiko Arase, licencia MIT) |
