/*
 * LISTA DE NICHOS (orden de las tarjetas).
 * Para añadir un nicho: crear niches/<id>.js con el esquema de clinicas.js y añadir su id aquí.
 * Para que se vea en la tablet: ponerlo también en CONFIG.nichosVisibles (config.js).
 * Este archivo lo usan la app y el service worker (precache offline).
 */
self.NICHOS_LISTA = ["clinicas", "talleres", "gestorias"];
