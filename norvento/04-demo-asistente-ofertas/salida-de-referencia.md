# Salida de referencia (lo que debería devolver el asistente)

Úsala para comprobar que tu Proyecto de Claude responde bien antes de grabar. No tiene que coincidir palabra por palabra, pero sí en los puntos marcados con 🔴 y ⚠️.

---

## 1. Resumen de la oportunidad
Andes Storage SpA (EPC, Chile) pide el PCS para el BESS "Pampa Norte": 40 MW / 160 MWh, en la Región de Antofagasta, asociado a una planta fotovoltaica existente. Plazo de respuesta: 3 semanas. Piden resumen en inglés para el socio financiero.

## 2. Requisitos extraídos
| Requisito | Valor pedido | ¿Lo cubre el nXL? | Referencia en la ficha |
|---|---|---|---|
| Potencia en el punto de conexión | 40 MW | ✅ con varias unidades | Hasta 9 MVA por unidad |
| Tensión DC | 1.500 V | ✅ | Hasta 1.500 V a plena potencia |
| Temperatura máxima | 42 °C | ✅ | Hasta 50 °C sin reducción |
| **Altitud** | **2.350 m** | 🔴 **Por encima del límite publicado** | Sin reducción solo hasta 2.000 m |
| Polvo en suspensión | Alto | ✅ Punto fuerte | Refrigeración sellada, sin intercambio de aire exterior |
| Grid-forming | Obligatorio | ✅ | Modo grid-forming |
| Black start | Deseable | ✅ | Black start disponible |
| Formato compacto | Contenedor | ✅ | 20 pies, 622 kVA/m³ |
| Frecuencia | 50 Hz | ⚠️ No figura | Consultar |
| Plazo, garantía, precio, experiencia en Chile | — | ⚠️ No figuran | Consultar |

## 3. Dimensionamiento preliminar
- Potencia activa en el punto de conexión: 40 MW.
- Suponiendo que el operador exige un factor de potencia de 0,95 → 40 / 0,95 ≈ **42,1 MVA**.
- Más ~2 % de pérdidas (transformadores y servicios auxiliares) → **≈ 43 MVA**.
- 43 / 9 = 4,8 → **5 unidades nXL (45 MVA)**, con un margen de ~4 %.
- ⚠️ Con la reducción de potencia por altitud (2.350 m), el margen podría no bastar → **posible 6.ª unidad**.

*Dimensionamiento orientativo, pendiente de validación por ingeniería.*

## 4. Riesgos y puntos a validar
1. 🔴 **Altitud de 2.350 m**, 350 m por encima del límite publicado sin reducción. Pedir a ingeniería la curva de reducción de potencia y confirmar si hacen falta 5 o 6 unidades.
2. ⚠️ Requisitos del Coordinador Eléctrico Nacional (Chile) para grid-forming: certificaciones y ensayos exigidos.
3. ⚠️ Compatibilidad con 50 Hz y con el rango de tensión AC del transformador elevador.
4. ⚠️ Proveedor de baterías sin confirmar → validar integración y comunicaciones con el BMS.
5. ⚠️ Plazo de entrega al puerto de Antofagasta y logística.

## 5. Preguntas para el cliente
1. ¿Qué factor de potencia exige el Coordinador en el punto de conexión?
2. ¿Tenéis ya el proveedor de celdas LFP y el protocolo de comunicación del BMS?
3. ¿Qué pruebas grid-forming os pide el Coordinador para la conexión?
4. ¿Fecha objetivo de puesta en servicio?
5. ¿El alcance incluye puesta en marcha y O&M, o solo el suministro?

## 6. Borrador de email al cliente
> Estimada Carolina:
>
> Muchas gracias por contar con Norvento TECHnPower para el proyecto Pampa Norte.
>
> Tras una primera revisión, nuestra familia nXL encaja muy bien con lo que buscáis: operación a 1.500 V, capacidad grid-forming y black start, y un formato compacto de hasta 9 MVA en un contenedor de 20 pies. Además, su refrigeración sellada, sin intercambio de aire con el exterior, está pensada para entornos con mucho polvo como el vuestro.
>
> Como configuración preliminar planteamos cinco unidades nXL. Estamos validando con nuestro equipo de ingeniería el efecto de la altitud del emplazamiento (2.350 m) para confirmar el número definitivo.
>
> Para cerrar la oferta os agradeceríamos algunos datos (os los detallo abajo). ¿Os parece que organicemos una llamada técnica esta semana o la próxima?
>
> Un saludo,
> [Nombre] – Norvento TECHnPower

## 7. Executive summary (English)
Andes Storage SpA requests a PCS for the 40 MW / 160 MWh "Pampa Norte" BESS in Antofagasta, Chile. The nXL family meets the key requirements: 1,500 V DC, grid-forming and black-start capability, and a sealed cooling system suited to dusty desert sites. The preliminary configuration is five nXL units (45 MVA). The main open point is site altitude (2,350 m, above the 2,000 m rating without derating), which may require a sixth unit. Pricing, lead time and warranty to follow after technical validation.
