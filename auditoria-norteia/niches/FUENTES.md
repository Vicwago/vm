# De dónde salen los valores de cada sector

Los valores de cada sector se cambian en su archivo de `niches/` (bloque `parametros` y `marca` de cada slider) sin tocar código. Consultado en octubre de 2026.

## Coste por hora: salario mínimo más Seguridad Social

Todos los sectores calculan cada hora a **11,75 €** (`CONFIG.costeHora`):
- **Salario:** salario mínimo interprofesional de 2026, 17.094 €/año (1.221 € × 14 pagas, [RD 126/2026](https://www.fieldfisher.com/es-es/locations/espana/actualidad/salario-minimo-interprofesional-2026), BOE del 19-02-2026).
- **Seguridad Social de la empresa:** ×1,32 (contingencias comunes, desempleo, FOGASA, formación, MEI y accidentes ≈ 32 %).
- **Horas:** entre las 1.920 h/año que cuenta el propio cálculo (5 días × 48 semanas × 8 h), para que el coste y las horas sean coherentes.

Es lo mínimo que cuesta a cualquier negocio una hora de su equipo. El coste real de cada sector, según convenio, suele ser mayor (referencia para la conversación de venta; no se muestra en la app):

| Sector | Coste real orientativo | Base |
|---|---|---|
| Peluquerías, barberías, spas | ≈ 13 €/h | Convenio estatal 2024-2026, grupo I: 17.500 €/año ([Iberley](https://www.iberley.es/noticias/publicado-nuevo-convenio-colectivo-estatal-peluquerias-y-gimnasios-2024-2026-34045)) |
| Clínicas | ≈ 13-14 €/h | Auxiliar de Oficinas y Despachos de A Coruña ≈ 17.207 €/año ([calculadornomina](https://calculadornomina.es/convenios/oficinas-y-despachos/a-coruna/)) |
| Gestorías | ≈ 13-15 €/h | [IX Convenio de gestorías](https://wageindicator.org/es-es/ai/trabajo-en-espana/convenios-colectivos/ix-convenio-colectivo-estatal-de-gestorias-administrativas-2024-2026/) |
| Talleres | ≈ 15 €/h | Convenio del metal ([tablas ASIME 2025](https://asime.es/wp-content/uploads/2025/02/Tablas-salariales-convenio-2025.pdf)) |
| Veterinarias | 13-16 €/h | [Convenio estatal](https://www.redaccionmedica.com/salud-animal/20260723/acuerdo-definitivo-para-el-nuevo-convenio-estatal-de-centros-servicios-veterinarios/347961_0.html) |
| Inmobiliarias | ≈ 13-14 €/h | [Convenio, CCOO](https://www.ccoo-servicios.es/archivos/20240710_Firma-Conv-gestio-mediacio-Inmobiliaria.pdf) |
| Restaurantes, academias | ≈ 13-14 €/h | Estimaciones propias (tablas sin verificar) |

## Rango recuperable

Lo recuperable se muestra en condicional y como rango orientativo (clínicas 45-65 %, resto 40-60 %). No hay una medición propia que respalde una cifra exacta (auditoría de Luis, A2). Cuando la haya, conviene sustituir el rango por datos de casos reales.

## Volúmenes y "habitual" de los sliders

- **No hay datos públicos fiables** de llamadas o WhatsApp al día en pymes españolas. Las marcas "habitual" son estimaciones propias por tamaño típico de negocio. Por eso la app pregunta la cifra al negocio en lugar de suponerla.
- **Restaurantes:** según TheFork, el no-show en España fue del 3,3 % en 2025, con una pérdida media de 78 € por mesa, y el 55 % de los casos son por olvido ([Vinetur](https://www.vinetur.com/2026022496663/la-restauracion-espanola-reduce-la-tasa-de-no-show-al-33-en-2025-segun-thefork.html)).
- **Clínicas privadas:** entre el 12 % y el 19 % de las citas no se atienden ([Vozpópuli](https://www.vozpopuli.com/sanitatem/las-ausencias-a-citas-medicas-cuestan-hasta-7500-euros-al-mes-a-las-clinicas-privadas.html), fuente secundaria).
- **Inmobiliarias:** cada anuncio de Idealista recibe de media unos 30 contactos ([Idealista](https://www.idealista.com/news/etiquetas/anuncios-de-vivienda)). Las cifras que circulan sobre tiempo de respuesta a leads son de EE. UU. y no se usan.

## Qué se automatiza en cada sector (base de las preguntas 6, 7 y de las señales)

Síntesis de práctica habitual y de proveedores del sector, no un ranking publicado.

- **Peluquerías y barberías:** reserva online o por WhatsApp, recordatorio 24 h antes, lista de espera para huecos libres.
- **Spas y estética:** recordatorios, venta y control de bonos, reactivación de clientes.
- **Talleres:** aviso de coche listo, recordatorio de ITV y revisión, envío y aceptación de presupuestos.
- **Gestorías:** reclamar documentación, avisos de plazos fiscales, respuestas a preguntas frecuentes.
- **Veterinarias:** recordatorios de vacunas y desparasitación, citas, avisos de resultados.
- **Inmobiliarias:** respuesta inmediata a contactos de portales, filtrado de interesados, agenda de visitas.
- **Restaurantes:** reservas online, confirmación y recordatorio, respuestas sobre horario, carta y alérgenos.
- **Academias y autoescuelas:** consultas de matrícula, recordatorios de clase, avisos de pago.
- **Clínicas:** recordatorio de cita, confirmar o reprogramar por WhatsApp, atención fuera de horario.
