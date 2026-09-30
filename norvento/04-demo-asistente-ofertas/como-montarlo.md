# Cómo montar la demo (≈30 min, 0 € extra)

Necesitas: tu cuenta de claude.ai con Proyectos (Pro o superior) y un grabador de pantalla gratis (Loom, gratis hasta 5 min, u OBS).

## Pasos

1. **Descarga el datasheet oficial del nXL** desde norvento.com (sección TECHnPower / descargas). Si lo consigues, súbelo también al proyecto: la demo gana mucha credibilidad con el documento real.
2. En claude.ai → **Projects → Create project** → nombre: `Asistente de Ofertas TECHnPower (demo)`.
3. **Project instructions** → pega el contenido de `instrucciones-proyecto.md` (lo que va debajo de la línea).
4. **Project knowledge** → sube `ficha-nXL.md` (y el PDF oficial si lo tienes).
5. Abre un chat nuevo dentro del proyecto y pega el texto completo de `rfq-ejemplo-chile.md`.
6. Revisa que la respuesta incluya estos puntos (son el "momento wow" del vídeo):

| Punto | Qué debería salir |
|---|---|
| Dimensionamiento | 40 MW + margen por potencia reactiva y pérdidas → **~5 unidades nXL de 9 MVA (45 MVA)**, orientativo |
| 🔴 Altitud | Sitio a **2.350 m** > **2.000 m** sin reducción de potencia → riesgo de *derating*; quizá haga falta una 6.ª unidad → consultar a ingeniería |
| Temperatura | 42 °C < 50 °C → ✅ |
| Polvo | Refrigeración **sellada sin intercambio de aire** → ✅ punto fuerte que hay que destacar al cliente |
| Tensión DC | 1.500 V → ✅ |
| Grid-forming / black start | ✅ ambos en la ficha |
| 50 Hz, plazo, garantía, precio, experiencia en Chile | ⚠️ no están en la ficha → "consultar" |
| Email | Borrador en español + executive summary en inglés |

7. Si algo sale mal, repite la prueba o afina las instrucciones. Haz 2–3 pruebas antes de grabar.

## Extra (si te sobra tiempo, y así impresiona más)
- **Segunda RFQ en portugués** (Brasil, proyecto FV + BESS) → demuestra el multiidioma. Pídele a Claude: "Escribe una RFQ ficticia en portugués de un EPC brasileño para un proyecto FV de 60 MW con BESS de 20 MW / 40 MWh".
- **Versión n8n** (con Luis): el email entra en un buzón → n8n lo pasa a Claude → el borrador llega al comercial por email o Teams. Enseñarlo en 15 segundos al final del vídeo vende el "esto se integra con vuestro correo".

## Importante
- Di en el vídeo que usas **solo información pública** y una **RFQ ficticia**.
- No uses el logo de Norvento en el vídeo ni en las miniaturas: que quede claro que es una propuesta tuya, no material suyo.
