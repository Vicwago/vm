# Checklist en la tablet real (Victor, antes de dársela a Cochet)

Marca cada punto en la tablet, no en el ordenador.

## Instalación y offline
- [ ] La URL carga con internet y se añade a la pantalla de inicio con el icono NorteIA.
- [ ] Desde el icono ocupa toda la pantalla (sin barra del navegador) y se queda en horizontal.
- [ ] En modo avión: abre, se completan las 10 preguntas y sale el resultado.
- [ ] Tras cambiar `config.js` y subir `CACHE_VERSION`, aparece la nueva configuración al abrir una vez con internet.

## Usabilidad (mejor con Cochet)
- [ ] Todos los botones se pulsan bien con un dedo.
- [ ] La letra se lee a un metro.
- [ ] Solo hace falta el teclado para el nombre del cliente.
- [ ] «Atrás» conserva las respuestas. «Siguiente» está desactivado hasta contestar.
- [ ] Las preguntas 2, 3 y 4 no dejan avanzar si falta la segunda parte (minutos).
- [ ] Una visita completa dura menos de 5 minutos.
- [ ] En vertical aparece «Gira la tablet en horizontal» y desaparece al volver a horizontal.
- [ ] La pantalla no se apaga durante la visita.

## Cálculo (con calculadora)
- [ ] 25×3 + 20×2 + 10×2 = 135 min/día → **540 h/año y 6.350 €/año** a 11,75 €/h; recuperable orientativo (45-65 %): entre 243 y 351 h, entre 2.860 € y 4.120 €.
- [ ] Todo a 0: sale el texto de volumen bajo, sin cifras.
- [ ] Máximos (100×5, 100×3, 40×4) con «4 o más» personas = 960 min/día → 3.840 h/año y 45.120 €/año, y las cifras caben sin cortarse.
- [ ] Los mismos máximos con 1 persona: se limita a 8 h/día y el resultado lo avisa.
- [ ] La cifra principal es el coste actual; lo recuperable sale en condicional y como rango, y el pie explica que la hora se calcula con el salario mínimo más la Seguridad Social.
- [ ] Con `costeHora: 20` en el nicho o en `config.js`, los euros cambian.

## Resultado
- [ ] Interés «Mucho» o «Bastante» → variante A; «Poco» → B; «No prioritario» → C.
- [ ] Salen los tres estados del contraste (mayor, coincide, menor) cambiando la respuesta 10.
- [ ] Sin nombre de clínica, el titular no tiene comas ni huecos raros.
- [ ] Las líneas de apoyo (preguntas 6, 7 y 8) salen solo cuando toca, y como mucho 2.
- [ ] El botón de cita abre el formulario de contacto de norteia.es con conexión; sin conexión avisa y no falla.
- [ ] El teléfono se puede tocar y marca el número correcto.
- [ ] El QR se escanea con un móvil y lleva al formulario de contacto de norteia.es.

## Guardado
- [ ] El resumen se copia y se pega bien en WhatsApp o en Notas. «Compartir» abre la hoja del sistema.
- [ ] El historial pide el PIN tras 5 toques al logo; con un PIN incorrecto no se abre.
- [ ] Tras descargar el CSV, la app propone borrar las visitas.
- [ ] El CSV se abre en Excel con las tildes y las columnas bien.
- [ ] «Borrar historial» pide doble confirmación y vacía la lista.
- [ ] Cerrar y reabrir la app no pierde el historial.

## Preguntas extra
- [ ] Con `extrasActivas` en `true` aparecen la 11 y la 12 tras la 10, la barra cuenta 11 o 12, y salen en el resumen y en el email.
- [ ] Con ambas en `false` no aparecen y no rompen nada.

## Sectores
- [ ] Aparecen las 10 pestañas y Clínicas sale preseleccionada.
- [ ] Haz una auditoría completa en cada sector: preguntas propias del sector, resultado con sus textos y señales.
- [ ] Revisa con alguien del sector (o con Cochet) que las preguntas y las cifras «habitual» suenan bien.
- [ ] El historial y el CSV muestran el sector, y el filtro por sector funciona.

## Email (con Resend y las variables de Vercel ya configuradas)
- [ ] En el historial se ha guardado la clave de envío de la tablet («Clave guardada en esta tablet»).
- [ ] Auditoría ficticia con conexión: el envío sale al instante y llega a **las dos bandejas** (mira también spam) con el asunto correcto, las 10 respuestas, el interés y «Contacto: No recogido».
- [ ] Con el hotspot de Cochet: la tablet envía el resumen al terminar.
- [ ] Wi-Fi conectado pero datos móviles cortados en el móvil: **no** marca «enviado»; queda pendiente.
- [ ] Modo avión: resultado, historial, resumen y CSV funcionan, y el email aparece como pendiente. Cerrar y abrir conserva los pendientes. Al volver la conexión con la app abierta se envían solos.
- [ ] Con la app cerrada no se envía nada; al abrirla con conexión se procesan los pendientes.
- [ ] Doble toque, volver al resultado o recargar no duplican el envío. Si se cambia una respuesta después de enviar, llega una «ACTUALIZACIÓN» con revisión 2.
- [ ] Indicador: «Email: enviado (1/1)». El botón «Reintentar pendientes» del historial no reenvía los ya aceptados.
- [ ] Repasa el repositorio y su historial: ningún identificador real publicado (`config.local.js` no está en Git). La API key de Resend y la clave de la tablet solo están en Vercel. Si se filtró algo, regenéralo; borrarlo del último commit no basta.

---

## Decisiones pendientes [DECIDIR]

1. Rango recuperable orientativo (clínicas 45-65 %, resto 40-60 %). El coste/hora es el salario mínimo más la Seguridad Social (11,75 €/h).
2. Destino de la cita (ahora el formulario de contacto de norteia.es) y teléfono que se muestra (ahora el de Víctor).
3. Preguntas extra (desactivadas por defecto).
4. Redes sociales de NorteIA (Instagram, LinkedIn) en `CONFIG.contactoNorteIA` cuando existan.
5. Colores: toda la app usa la paleta de norteia.es (`styles.css`, `:root`). Solo el rojo de errores y de «Borrar» queda fuera de la paleta.
6. Remitente (`EMAIL_REMITENTE`) y correos de destino (`EMAIL_DESTINO`) en Vercel.
7. «Habitual» de cada sector (ver `niches/FUENTES.md`).
8. Activar `capturarContacto` y aprobar el texto de privacidad, la retención local y la del proveedor.
