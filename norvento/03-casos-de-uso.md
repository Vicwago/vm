# Casos de uso de IA (Claude) para Norvento

Contexto (fuentes públicas, septiembre de 2026):
- **~250 personas** en Lugo. Grupo formado por Enerxía, TECHnPower, Ingeniería y Energía Distribuida.
- **TECHnPower**: convertidores nX/nXL (hasta 9 MVA en contenedor de 20 pies) para BESS, fotovoltaica e hidrógeno. **Expansión en LATAM** (Intersolar São Paulo 2026).
- **Eólica**: ~250 MW en operación y **~1.000 MW en desarrollo** (tramitación).
- **Fábrica Enerxía Cero** (As Gándaras): +50 M€, **~300 empleos directos 2024–2027**.
- IA actual: **solo técnica/ingeniería** (cátedra UAH, Fisterra, Rural VPP). No hay rastro público de IA generativa en áreas de negocio → **ese es el hueco**.

Leyenda: 🟢 quick win (2–4 semanas) · 🟡 medio (1–2 meses) · 🔵 estratégico

---

## Top 3 para abrir la conversación

### 1. 🟢 Asistente de ofertas técnicas (RFQ) — TECHnPower
- **Dolor**: cada petición de oferta (BESS, FV, H₂) obliga a leer requisitos, cruzarlos con fichas, dimensionar y redactar, a menudo en ES/EN/PT. Horas de ingeniería senior en trabajo repetitivo.
- **Solución**: Proyecto de Claude con fichas, ofertas tipo y condiciones comerciales. Extrae requisitos → dimensionamiento preliminar → lista de "a validar por ingeniería" → borrador de respuesta multiidioma.
- **KPI**: horas por primera respuesta; ofertas por comercial/mes.
- **Herramientas**: Claude (Proyectos) → después, n8n para que entre directo desde el email.
- ✅ **Es la demo** (ver `04-demo-asistente-ofertas/`).

### 2. 🟢 Análisis de pliegos y licitaciones
- **Dolor**: pliegos de 100–300 páginas (utilities, operadores de red, puertos para OPS).
- **Solución**: Claude lee el pliego y devuelve una matriz de cumplimiento (requisito → ¿cumplimos? → referencia en ficha → riesgo), además de fechas clave, penalizaciones y criterios de adjudicación.
- **KPI**: tiempo de decisión "go / no-go".

### 3. 🟡 Documentación técnica multiidioma
- **Dolor**: manuales, fichas y certificados en ES/EN/PT (LATAM = portugués para Brasil).
- **Solución**: flujo de traducción con glosario técnico propio de Norvento (para que "grid-forming", "black start"… se traduzcan siempre igual) y revisión humana.
- **KPI**: coste y plazo por documento traducido.

---

## Más casos (para la reunión)

| # | Área | Caso de uso | Tipo | Nota |
|---|------|-------------|------|------|
| 4 | Desarrollo eólico | Resumir expedientes de tramitación (DIA, alegaciones, informes sectoriales) y seguimiento de plazos | 🟡 | 1.000 MW en cartera = mucho papel |
| 5 | I+D / Financiación | Borradores de memorias técnicas y justificaciones de ayudas (PERTE, Xunta, CDTI, europeos) | 🟢 | Tienen muchos proyectos financiados (Fisterra, neFO…) |
| 6 | Sostenibilidad y marca | Borrador del informe de sostenibilidad (CSRD/ESG) a partir de datos internos; contenidos de blog y LinkedIn | 🟢 | Área de Mariluz Lozano |
| 7 | Posventa / O&M | Asistente de soporte con manuales + histórico de incidencias (flota nED, convertidores) para técnicos de campo | 🟡 | Menos llamadas a ingeniería |
| 8 | Personas | Onboarding de ~300 incorporaciones: asistente de preguntas frecuentes, guías de acogida, planes de formación | 🟢 | ⚠️ Cribado de CVs = **alto riesgo según el AI Act**; siempre con decisión humana |
| 9 | Dirección / Comercial | Vigilancia semanal automática: licitaciones LATAM, competidores, regulación de almacenamiento → resumen en el email del lunes | 🟢 | n8n + Claude, coste muy bajo |
| 10 | Software / Ingeniería | Claude Code para el equipo de desarrollo software (HMI, herramientas internas, tests, documentación de código) | 🔵 | Buscan "Ingeniero/a Desarrollo SW" → equipo en crecimiento |
| 11 | Toda la empresa | Programa "IA para todos": formación práctica por departamentos + biblioteca de prompts y buenas prácticas | 🔵 | Aquí encaja tu perfil de formador |

---

## Mensajes clave para la reunión

1. **"No venimos a tocar vuestra IA de ingeniería."** Ellos ya hacen IA en control de potencia; tú vienes a la parte de negocio, que es complementaria.
2. **Seguridad de datos.** Los planes de empresa de Claude (Team/Enterprise) no usan los datos del cliente para entrenar modelos por defecto. Antes de subir documentación confidencial, se revisa con ellos.
3. **Empezar pequeño y medir.** Un proceso, 4 semanas, un KPI. Después, decidir.
4. **La persona siempre valida.** La IA prepara y marca dudas; el ingeniero decide.

---

## Formato de colaboración (según la vía)

**Vía A — Empleado.** Plan 30/60/90 días:
- **30 días**: entrevistas con 5–6 áreas, mapa de tareas repetitivas, piloto del caso 1 con TECHnPower.
- **60 días**: casos 2 y 9 en producción; primeras formaciones.
- **90 días**: programa "IA para todos", métricas de horas ahorradas y hoja de ruta para 2027.

**Vía B — NorteIA (proveedor).** Piloto de 4 semanas a precio cerrado:
- Semana 1: diagnóstico y recogida de documentos.
- Semanas 2–3: montaje y pruebas con 3–5 ofertas reales.
- Semana 4: formación del equipo y medición.
- Precio orientativo: **[a decidir con Luis]**. Mejor un precio cerrado y bajo para entrar que un presupuesto grande que asuste.
