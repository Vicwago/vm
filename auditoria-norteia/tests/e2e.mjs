// Prueba de extremo a extremo en Chromium (Playwright). EmailJS se SIMULA: no se envía nada real.
// Ejecutar: node tests/e2e.mjs   (requiere Playwright instalado; capturas en tests/salida/)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch (e) {
  playwright = createRequire(process.env.PLAYWRIGHT_DIR || "/opt/node22/lib/node_modules/")("playwright");
}
const { chromium } = playwright;

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = path.join(RAIZ, "tests", "salida");
fs.mkdirSync(SALIDA, { recursive: true });

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
// config.local.js "publicado" (simula el archivo real en el hosting; los route de Playwright no ven las peticiones del service worker)
let configLocalServida = null;
const servidor = http.createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (ruta === "/") ruta = "/index.html";
  if (ruta === "/config.local.js" && configLocalServida) {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    res.end(configLocalServida);
    return;
  }
  const archivo = path.join(RAIZ, ruta);
  if (!archivo.startsWith(RAIZ) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream", "Cache-Control": "no-cache" });
  fs.createReadStream(archivo).pipe(res);
});
await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
const URL_APP = "http://localhost:" + servidor.address().port + "/";

let fallos = 0;
// La app ignora toques a menos de 300 ms (anti doble avance): las pruebas esperan entre avances
async function clic(loc) { await loc.click(); await loc.page().waitForTimeout(330); }
function ok(cond, msg) {
  if (cond) console.log("  ✔ " + msg);
  else { fallos++; console.log("  ✘ " + msg); }
}

const CORS = { "Access-Control-Allow-Origin": "*" };
const CONFIG_EMAIL = `window.CONFIG.email.habilitado = true;
window.CONFIG.email.serviceId = "service_prueba1";
window.CONFIG.email.publicKey = "publica_prueba1";
window.CONFIG.email.destinatarios = [
  { id: "victor", nombre: "Victor", templateId: "template_v_prueba" },
  { id: "luis", nombre: "Luis", templateId: "template_l_prueba" }];`;

async function contestarClinica(page, opciones) {
  const o = Object.assign({ interes: "Mucho", percepcion: "De 2 a 4 horas" }, opciones || {});
  const sig = page.locator(".boton-siguiente");
  await clic(page.getByRole("button", { name: "Dental" }));
  await clic(sig);
  // 2. llamadas: atajo "habitual" (25) + 3 min
  ok(await sig.isDisabled(), "Siguiente desactivado con el slider sin contestar");
  await clic(page.locator(".atajo.habitual"));
  ok(await sig.isDisabled(), "Siguiente desactivado si falta la segunda parte");
  await clic(page.getByRole("button", { name: "3 min" }));
  await clic(sig);
  await clic(page.locator(".atajo.habitual")); // 20
  await clic(page.getByRole("button", { name: "2 min" }));
  await clic(sig);
  await clic(page.locator(".atajo.habitual")); // 10
  await clic(page.getByRole("button", { name: "2 min" }));
  await clic(sig);
  await clic(page.getByRole("button", { name: "2", exact: true }));
  await clic(sig);
  await clic(page.getByRole("button", { name: "Muchas veces al día" }));
  await clic(sig);
  await clic(page.getByRole("button", { name: "A veces" }));
  await clic(sig);
  await clic(page.getByRole("button", { name: "Sí", exact: true }));
  await clic(sig);
  await clic(page.getByRole("button", { name: o.interes, exact: true }));
  await clic(sig);
  await clic(page.getByRole("button", { name: o.percepcion }));
  ok((await sig.textContent()).includes("Ver resultado"), "la última pregunta dice «Ver resultado»");
  await clic(sig);
  await clic(page.locator(".calculando"));
  await page.locator(".resultado").waitFor();
  await page.locator(".resultado").click({ position: { x: 5, y: 5 } }); // muestra el valor final al instante
}

async function sinScroll(page, msg) {
  const r = await page.evaluate(() => {
    const p = document.querySelector(".pantalla");
    return { h: p.scrollHeight <= p.clientHeight + 1, w: document.documentElement.scrollWidth <= window.innerWidth };
  });
  ok(r.h && r.w, msg);
}

const browser = await chromium.launch();

// ---------- 1. Flujo completo a 1024x768, sin email ----------
{
  console.log("Flujo base (1024x768, email desactivado)");
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: "block", locale: "es-ES", timezoneId: "Europe/Madrid" });
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  let peticionesExternas = 0;
  page.on("request", (r) => { if (!r.url().startsWith(URL_APP)) peticionesExternas++; });
  await page.goto(URL_APP);
  await page.locator(".bienvenida").waitFor();
  ok(await page.locator("h1").textContent() === "Auditoría rápida de tiempo perdido", "título de bienvenida");
  ok(await page.locator(".nicho-tarjeta").count() === 0, "con un solo nicho no hay selector");
  ok((await page.locator(".esquina-version").textContent()).includes("config: enlace pendiente"), "aviso de enlace pendiente en la esquina");
  await page.screenshot({ path: path.join(SALIDA, "01-bienvenida-1024.png") });
  await clic(page.getByRole("button", { name: "Empezar" }));
  ok((await page.locator(".progreso-texto").textContent()) === "Pregunta 1 de 10", "Pregunta 1 de 10");
  await page.screenshot({ path: path.join(SALIDA, "02-pregunta1-1024.png") });
  await sinScroll(page, "pregunta 1 sin scroll");
  await clic(page.getByRole("button", { name: "Dental" }));
  await clic(page.locator(".boton-siguiente"));
  await clic(page.locator(".atajo.habitual"));
  await clic(page.getByRole("button", { name: "3 min" }));
  await page.screenshot({ path: path.join(SALIDA, "03-slider-1024.png") });
  await sinScroll(page, "pregunta con slider sin scroll");
  // "Atrás" conserva respuestas
  await clic(page.locator(".boton-atras"));
  ok(await page.getByRole("button", { name: "Dental" }).getAttribute("aria-pressed") === "true", "Atrás conserva la respuesta");
  await clic(page.locator(".boton-atras"));
  await clic(page.getByRole("button", { name: "Empezar" }));
  await contestarClinica(page);
  const titular = await page.locator(".gancho h1").textContent();
  ok(titular === "Podéis recuperar 351 horas y 4.910 € al año.", "titular sin nombre: " + titular);
  const cifras = await page.locator(".cifra-num").allTextContents();
  ok(cifras[0] === "351" && cifras[1] === "4.910 €", "cifras gancho: " + cifras.join(" / "));
  ok((await page.locator(".contraste p").textContent()).startsWith("Vuestra intuición es buena: 2,3 horas"), "contraste «coincide»");
  ok(await page.locator(".qr svg").count() === 1, "QR generado en local");
  ok(await page.locator("a.telefono").getAttribute("href") === "tel:+34600000000", "teléfono tocable");
  ok(await page.locator(".estado-email").count() === 0, "con email desactivado no se muestra estado en el resultado");
  await page.screenshot({ path: path.join(SALIDA, "04-resultado-1024.png"), fullPage: false });
  const rect = await page.locator(".cifra-num").last().boundingBox();
  ok(rect.x + rect.width <= 1024, "las cifras caben sin cortarse");
  // Resumen
  await clic(page.getByRole("button", { name: "Guardar resumen" }));
  const resumen = await page.locator(".resumen-texto").textContent();
  ok(resumen.includes("- Recuperable (65 %): 351 h y 4.910 €/año") && resumen.includes("Sector: Clínicas"), "resumen copiable");
  await page.screenshot({ path: path.join(SALIDA, "05-resumen-1024.png") });
  await clic(page.getByRole("button", { name: "Nueva auditoría" }));
  await page.locator(".bienvenida").waitFor();
  // Historial oculto: 5 toques al logo
  for (let i = 0; i < 5; i++) await clic(page.locator(".logo-boton"));
  await page.locator(".historial").waitFor();
  ok(await page.locator(".fila-historial").count() === 1, "historial con 1 visita");
  ok((await page.locator(".fila-historial").textContent()).includes("540 h / 4.910 €"), "fila «540 h / 4.910 €»");
  ok((await page.locator(".estado-general-email").textContent()).includes("desactivado"), "historial indica email desactivado");
  await page.screenshot({ path: path.join(SALIDA, "06-historial-1024.png") });
  // CSV
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Descargar CSV (todo)" }).click()]);
  const csv = fs.readFileSync(await descarga.path());
  ok(csv[0] === 0xef && csv[1] === 0xbb && csv[2] === 0xbf, "CSV con BOM UTF-8");
  ok(/^auditorias-norteia-\d{4}-\d{2}-\d{2}\.csv$/.test(descarga.suggestedFilename()), "nombre del CSV");
  ok(csv.toString("utf8").includes('"clinicas";"";135;540;7560;351;4914;"coincide";14;0.65;'), "fila CSV con las cifras");
  // Borrar historial: doble confirmación
  await clic(page.getByRole("button", { name: "Borrar historial" }));
  await clic(page.locator("#dialogo-botones").getByRole("button", { name: "Sí, borrar" }));
  await clic(page.locator("#dialogo-botones").getByRole("button", { name: "Sí, borrar" }));
  ok(await page.locator(".fila-historial").count() === 0, "historial borrado tras dos confirmaciones");
  ok(peticionesExternas === 0, "ninguna petición externa con el email desactivado");
  ok(errores.length === 0, "sin errores de JavaScript " + errores.join(" | "));
  await ctx.close();
}

// ---------- 2. Volumen bajo, variante C, máximos y otras resoluciones ----------
{
  console.log("Casos extremos y resoluciones");
  for (const [w, hgt] of [[1280, 800], [1920, 1200]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(URL_APP);
    await clic(page.getByRole("button", { name: "Empezar" }));
    await sinScroll(page, `pregunta 1 sin scroll a ${w}x${hgt}`);
    await clic(page.getByRole("button", { name: "Dental" }));
    await clic(page.locator(".boton-siguiente"));
    await page.screenshot({ path: path.join(SALIDA, `07-slider-${w}.png`) });
    await sinScroll(page, `slider sin scroll a ${w}x${hgt}`);
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.goto(URL_APP);
  await page.locator(".campo-nombre").fill("Clínica Máximos");
  await clic(page.getByRole("button", { name: "Empezar" }));
  await clic(page.getByRole("button", { name: "Otra" }));
  const sig = page.locator(".boton-siguiente");
  await clic(sig);
  for (const [max, min] of [[100, "5 min"], [100, "3 min"], [40, "4 min"]]) {
    await page.locator("input[type=range]").fill(String(max));
    await clic(page.getByRole("button", { name: min }));
    ok((await page.locator(".slider-valor").textContent()) === String(max), "slider al máximo " + max);
    await clic(sig);
  }
  for (const n of ["4 o más", "Constantemente", "No controlado", "No", "No prioritario", "Menos de 2 horas"]) {
    await clic(page.getByRole("button", { name: n, exact: true }));
    await clic(sig);
  }
  await clic(page.locator(".calculando"));
  await page.locator(".resultado").click({ position: { x: 5, y: 5 } });
  ok((await page.locator(".gancho h1").textContent()) === "Aunque no sea prioritario: 2.496 horas y 34.940 € al año.", "variante C con máximos");
  ok((await page.locator(".gancho > p").first().textContent()).includes("3.840 horas al año, 53.760 € en total"), "máximos: 3.840 h y 53.760 €");
  ok((await page.locator(".contraste p").textContent()).startsWith("Perdéis más tiempo del que pensáis"), "contraste «mayor»");
  ok(await page.locator(".senales li").count() === 2, "dos señales como máximo");
  await page.screenshot({ path: path.join(SALIDA, "08-resultado-maximos-1024.png") });
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  ok(desborde, "sin scroll horizontal con cifras máximas");
  // Volver y poner todo a 0
  await clic(page.locator(".boton-atras"));
  for (let i = 0; i < 8; i++) await clic(page.locator(".boton-atras"));
  for (let i = 0; i < 3; i++) {
    await clic(page.locator(".atajo").first());
    await clic(sig);
  }
  for (let i = 0; i < 6; i++) await clic(sig);
  await clic(page.locator(".calculando"));
  ok((await page.locator(".volumen-bajo").textContent()).startsWith("Con estas cifras el volumen de tareas es bajo"), "todo a 0: volumen bajo sin cifras");
  ok(await page.locator(".cifra-num").count() === 0, "volumen bajo sin cifras gancho");
  await clic(page.getByRole("button", { name: "Nueva auditoría" }));
  for (let i = 0; i < 5; i++) await clic(page.locator(".logo-boton"));
  ok(await page.locator(".fila-historial").count() === 1, "recalcular sobrescribe el mismo registro (no duplica)");
  await ctx.close();
}

// ---------- 3. Email simulado: envío inmediato a los dos, fallo parcial y reintento ----------
{
  console.log("Email (EmailJS simulado)");
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.route("**/config.local.js", (r) => r.fulfill({ contentType: "text/javascript", body: CONFIG_EMAIL }));
  const envios = [];
  let luisFalla = true;
  await page.route("https://api.emailjs.com/**", async (r) => {
    const body = JSON.parse(r.request().postData());
    envios.push({ body, t: Date.now() });
    if (luisFalla && body.template_id === "template_l_prueba") return r.fulfill({ status: 503, body: "caído", headers: CORS });
    return r.fulfill({ status: 200, body: "OK", headers: CORS });
  });
  await page.goto(URL_APP);
  await page.locator(".campo-nombre").fill("Clínica Ficticia Prueba");
  await clic(page.getByRole("button", { name: "Empezar" }));
  await contestarClinica(page);
  for (let i = 0; i < 100 && envios.length < 2; i++) await page.waitForTimeout(100);
  await page.waitForFunction(() => /1\/2 enviado/.test(document.querySelector(".estado-email").textContent));
  await page.waitForTimeout(300);
  ok(envios.length === 2, "dos peticiones (una por destinatario)");
  ok(envios[1].t - envios[0].t >= 1400, "peticiones espaciadas ≥ 1,5 s");
  const p = envios[0].body.template_params;
  ok(p.nombre_cliente === "Clínica Ficticia Prueba" && p.tipo_envio === "INICIAL" && p.revision === "1", "variables del asunto");
  ok(/10\. Horas\/día estimadas/.test(p.respuestas_texto), "las 10 respuestas en el email");
  ok(p.interes_texto === "Mucho (variante A)", "interés declarado");
  ok(!("to_email" in p) && !("accessToken" in envios[0].body), "sin destinatario elegible ni clave privada");
  ok((await page.locator(".estado-email").textContent()).includes("Email: pendiente (1/2 enviado)"), "indicador 1/2");
  await page.screenshot({ path: path.join(SALIDA, "09-resultado-email-parcial.png") });
  // Reintento manual desde el historial: solo sale Luis
  luisFalla = false;
  await clic(page.getByRole("button", { name: "Nueva auditoría" }));
  for (let i = 0; i < 5; i++) await clic(page.locator(".logo-boton"));
  await clic(page.getByRole("button", { name: "Reintentar pendientes" }));
  await page.waitForFunction(() => /enviado \(2\/2\)/.test(document.querySelector(".email-fila").textContent));
  ok(envios.length === 3 && envios[2].body.template_id === "template_l_prueba", "al reintentar solo sale Luis");
  await clic(page.locator(".fila-historial"));
  ok((await page.locator(".detalle-email").textContent()).includes("Victor: enviado"), "detalle por destinatario en el historial");
  await page.screenshot({ path: path.join(SALIDA, "10-historial-detalle-email.png") });
  await ctx.close();
}

// ---------- 4. Offline real con service worker ----------
{
  console.log("Offline (service worker + modo avión)");
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  configLocalServida = CONFIG_EMAIL;
  const envios = [];
  let sinRed = false; // los route de Playwright se resuelven antes que el modo offline: se simula el corte aquí
  await ctx.route("https://api.emailjs.com/**", (r) => {
    if (sinRed) return r.abort("internetdisconnected");
    envios.push(1);
    return r.fulfill({ status: 200, body: "OK", headers: CORS });
  });
  await page.goto(URL_APP);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cacheados = await page.evaluate(async () => {
    const claves = await caches.keys();
    const c = await caches.open(claves[0]);
    return (await c.keys()).map((r) => new URL(r.url).pathname);
  });
  ok(["/niches/clinicas.js", "/niches/talleres.js", "/niches/gestorias.js", "/assets/qr.js", "/email.js"].every((x) => cacheados.includes(x)), "nichos y módulos precacheados");
  await ctx.setOffline(true);
  sinRed = true;
  await page.reload();
  await page.locator(".bienvenida").waitFor();
  ok(true, "la app abre sin conexión");
  await clic(page.getByRole("button", { name: "Empezar" }));
  await contestarClinica(page, { interes: "Poco" });
  ok((await page.locator(".gancho h1").textContent()) === "Podéis recuperar 351 horas y 4.910 € al año.", "resultado offline (variante B)");
  await page.waitForFunction(() => /Email: pendiente/.test(document.querySelector(".estado-email").textContent));
  ok((await page.locator(".estado-email").textContent()).includes("Sin conexión: queda pendiente"), "aviso de pendiente sin conexión");
  ok(envios.length === 0, "ningún falso «enviado» sin conexión");
  await clic(page.locator("a.boton-cta"));
  ok(await page.locator(".aviso-sin-conexion").isVisible(), "CTA sin conexión muestra el aviso");
  await page.screenshot({ path: path.join(SALIDA, "11-offline-resultado.png") });
  // Cerrar y reabrir sin conexión conserva el pendiente
  await page.reload();
  await page.locator(".bienvenida").waitFor();
  ok((await page.locator(".esquina-version").textContent()).includes("1 envío pendiente"), "contador de pendientes en la bienvenida");
  // Vuelve la conexión con la app abierta: se procesa solo
  await ctx.setOffline(false);
  sinRed = false;
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForFunction(() => !/envío pendiente/.test(document.querySelector(".esquina-version").textContent), null, { timeout: 15000 });
  ok(envios.length === 2, "al volver la conexión se envían los dos sin tocar nada");
  configLocalServida = null;
  await ctx.close();
}

// ---------- 5. Multi-nicho en modo desarrollo + nicho de prueba + nicho roto ----------
{
  console.log("Multi-nicho");
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errores = [];
  page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
  await page.route("**/niches/index.js", (r) => r.fulfill({ contentType: "text/javascript",
    body: 'self.NICHOS_LISTA = ["clinicas","talleres","gestorias","prueba","roto"];' }));
  await page.route("**/niches/prueba.js", (r) => r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.join(RAIZ, "tests/fixtures/nicho-prueba.js"), "utf8") }));
  await page.route("**/niches/roto.js", (r) => r.fulfill({ contentType: "text/javascript",
    body: fs.readFileSync(path.join(RAIZ, "niches/clinicas.js"), "utf8").replace("self.NICHOS.clinicas =", "self.NICHOS.roto =").replace('id: "clinicas"', 'id: "roto"') + "\nself.NICHOS.roto.resultado.variantes.B = undefined;" }));
  await page.route("**/config.local.js", (r) => r.fulfill({ contentType: "text/javascript",
    body: 'window.CONFIG.modoDesarrollo = true; window.CONFIG.nichosVisibles = ["clinicas","talleres","gestorias","prueba","roto"];' }));
  await page.goto(URL_APP);
  await page.locator(".bienvenida").waitFor();
  ok(await page.locator(".nicho-tarjeta").count() === 4, "4 tarjetas (el nicho roto se oculta)");
  ok(await page.locator(".etiqueta-completar").count() === 2, "incompletos con etiqueta [COMPLETAR]");
  ok(errores.some((e) => e.includes("Nicho roto oculto") && e.includes("falta la variante B")), "error en consola del nicho roto");
  await page.screenshot({ path: path.join(SALIDA, "12-selector-nichos.png") });
  await clic(page.getByRole("button", { name: /Sector: Prueba/ }));
  ok((await page.locator(".campo-nombre").getAttribute("placeholder")) === "Nombre del negocio (opcional)", "el campo de nombre cambia con el nicho");
  await clic(page.getByRole("button", { name: "Empezar" }));
  ok((await page.locator(".progreso-texto").textContent()) === "Pregunta 1 de 3", "nicho de prueba con 3 preguntas");
  const sig = page.locator(".boton-siguiente");
  await clic(page.locator(".atajo.habitual"));
  await clic(page.getByRole("button", { name: "6 min" }));
  await clic(sig);
  await clic(page.locator(".atajo.habitual"));
  await clic(page.getByRole("button", { name: "2 min" }));
  await clic(sig);
  await clic(page.getByRole("button", { name: "Menos de 3" }));
  await clic(sig);
  await clic(page.locator(".calculando"));
  await page.locator(".resultado").click({ position: { x: 5, y: 5 } });
  // 10x6 + 5x2 = 70 min/día -> 280 h/año x 20 €/h = 5.600 € -> 65 %: 182 h y 3.640 €
  ok((await page.locator(".gancho h1").textContent()) === "Prueba A: 182 h y 3.640 €.", "nicho nuevo de principio a fin con su coste/hora propio");
  await clic(page.getByRole("button", { name: "Nueva auditoría" }));
  for (let i = 0; i < 5; i++) await clic(page.locator(".logo-boton"));
  ok((await page.locator(".insignia").first().textContent()).includes("Prueba"), "insignia de nicho en el historial");
  await ctx.close();
}

// ---------- 6. Vertical: aviso de giro ----------
{
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.goto(URL_APP);
  ok(await page.locator(".aviso-giro").isVisible(), "en vertical aparece «Gira la tablet en horizontal»");
  await ctx.close();
}

await browser.close();
servidor.close();
console.log(fallos ? `\n${fallos} comprobaciones FALLIDAS` : "\nTodas las comprobaciones e2e pasan");
process.exit(fallos ? 1 : 0);
