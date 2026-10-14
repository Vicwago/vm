# De dónde salen los valores de cada sector

Todos los valores de esta tabla son **[DECIDIR]**: puntos de partida razonables para cambiar en cada archivo de `niches/` (bloque `parametros` y `marca` de cada slider) sin tocar código. Consultado en octubre de 2026.

## Coste por hora (empresa) por defecto

El cálculo es una estimación propia: salario anual de convenio dividido entre unas 1.750-1.790 h/año, multiplicado por 1,32 (cargas sociales). El suelo es el SMI de 2026, 17.094 €/año ([RD 126/2026](https://www.fieldfisher.com/es-es/locations/espana/actualidad/salario-minimo-interprofesional-2026)), que da unos **13 €/h** para la empresa.

| Sector | €/h | Base |
|---|---|---|
| Clínicas | 14 | Valor de la especificación original. Auxiliar de Oficinas y Despachos de A Coruña ≈ 17.207 €/año ([calculadornomina](https://calculadornomina.es/convenios/oficinas-y-despachos/a-coruna/)) |
| Talleres | 15 | Estimación con el convenio del metal ([tablas ASIME 2025](https://asime.es/wp-content/uploads/2025/02/Tablas-salariales-convenio-2025.pdf)) |
| Gestorías | 15 | Auxiliar ≈ SMI ([IX Convenio gestorías](https://wageindicator.org/es-es/ai/trabajo-en-espana/convenios-colectivos/ix-convenio-colectivo-estatal-de-gestorias-administrativas-2024-2026/)). Se usa 15 porque estas tareas las hace a menudo un oficial administrativo |
| Peluquerías, barberías, spas | 13 | Grupo I del convenio estatal 2024-2026: 17.500 €/año ([Iberley](https://www.iberley.es/noticias/publicado-nuevo-convenio-colectivo-estatal-peluquerias-y-gimnasios-2024-2026-34045)) |
| Veterinarias | 14 | Recepción ≈ 13 €/h y veterinario ≈ 16 €/h ([convenio estatal, Redacción Médica](https://www.redaccionmedica.com/salud-animal/20260723/acuerdo-definitivo-para-el-nuevo-convenio-estatal-de-centros-servicios-veterinarios/347961_0.html)) |
| Inmobiliarias | 14 | Administrativo ≈ SMI ([convenio, CCOO](https://www.ccoo-servicios.es/archivos/20240710_Firma-Conv-gestio-mediacio-Inmobiliaria.pdf)). Se sube a 14 porque estas tareas las suele hacer el comercial |
| Restaurantes | 14 | Estimación: camarero en A Coruña ≈ 1.305 €/mes × 15 pagas (tablas sin verificar). Cuenta 6 días de apertura a la semana |
| Academias | 13 | Estimación (autoescuelas: SMI + 10 % según el [XXIV Convenio](https://www.iberley.es/noticias/publicado-xxiv-convenio-colectivo-nacional-autoescuelas-36350)). Cuenta 44 semanas al año |

Los salarios de peluquería, gestorías y oficinas vienen de webs secundarias. Conviene contrastarlos con el BOE o el BOP antes de usarlos en una propuesta.

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
