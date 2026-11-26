# Paso 16 — integración de Mi año en cine

Fecha: 26 de noviembre de 2026. Evidencia local de Codex; ninguna prueba nueva de Expo Go se da por realizada. El plan aprobado y el título con peso 700 se registraron antes del código en `271b9ae` (`docs: aprobar el plan y la adaptación visual del resumen`). El diff de implementación queda sin commit.

## Implementación y límites

- P16-01: estilos heredados trasladados a `src/tema/estilosHeredados.ts`. La fachada `src/theme/index.ts` conserva sus exports para mantener consumidores y aspecto. Comparación puntual mediante TypeScript/StyleSheet simulado: objetos de estilos y colores idénticos a la versión anterior en Git. El sensor original no se modificó.
- P16-02/03: `adaptarResumen` proyecta instantes a hora local; `ResumenController` coordina dominio, lista confirmada, D2, cola D6, generaciones y abort. `useResumenAnual` se expone por Context. La pantalla no consulta Firebase, TMDB o AsyncStorage.
- P16-04/05/06: nueva pestaña autenticada, selector de años, total/desglose, horas de películas, género/director, mes activo, doce barras, destacada e invitación a calificar. Estados de carga, progreso, vacío confirmado, error, resultado incompleto, copia offline y escenario pendiente. Safe areas/scroll y alternativas de imagen reutilizados; controles con mínimo 44. Su experiencia real se debe comprobar en teléfono.
- El título usa 700 aprobado, sin fijar una interlínea nueva. El 750 del dato de tarjeta permanece en los tokens como referencia. Las tarjetas conservan tamaño/interlínea 22/28 pero no asignan un peso alternativo: su adaptación visual final sigue pendiente, no se considera aprobada por esta entrega.
- P16-07: se conserva regresión existente y se añaden pruebas del controlador. No se cierran los criterios humanos ni las ramas dependientes de PA.

## PA-01–PA-06: no resueltos

PuntoAbiertoError se captura y se presenta como escenario pendiente con su identificador. No se transforma en éxito, resultado inventado o vacío. PA-06 se comunica expresamente cuando no hay copia offline, sin fingir una lista vacía. Los mensajes explican el escenario pendiente; no aprueban su tratamiento definitivo.

La política de producción solo reconoce metadatos presentes inequívocos; un null/lista vacía ambiguos o campos ausentes quedan pendientes de PA-03. En series, null/vacío requeridos por D5 no se interpretan como fallo. **La selección automática de candidatas y los reintentos D6 permanecen bloqueados por PA-03.** La cola está conectada por Context y sus escrituras pasan por ListaController; no se fuerza una petición de enriquecimiento para resolver esa duda. D2 con origen válido sí puede ejecutarse online al abrir la pestaña.

La prueba de fallo parcial inyecta exclusivamente en el fixture una política de candidatas; comprueba integración y continuidad, no autoriza esa política en producción. Los fallos explícitos conocidos conservan total/desglose y se excluyen de horas/género/director mediante el dominio. Los datos sin fecha utilizable y los desempates pendientes también quedan identificados, sin descartar obras silenciosamente.

## Comprobaciones automáticas actuales

Con Node 24.22.1 y `EXPO_NO_DOTENV=1`, sin leer ni cargar `.env`:

```sh
npm test
npx tsc --noEmit
npm run lint
npm run test:rules
git diff --check
```

| Control                            | Resultado                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `tests/resumen-controller.test.ts` | 17/17 aprobadas en ejecución aislada.                                                                                         |
| Suite completa                     | Salida 0: 98/98 (23 node:test y 75 Vitest), incluido el sensor con cero hallazgos.                                            |
| TypeScript                         | Salida 0, sin errores.                                                                                                        |
| ESLint                             | Salida 0, sin errores ni advertencias.                                                                                        |
| Emulador demo                      | Salida 0: 7/7 grupos. Aviso de la herramienta: CLI 15 requerirá Java 21; se usó la herramienta aislada existente con Java 17. |
| Comparación de migración           | Objetos de estilos/colores idénticos a HEAD anterior; no acredita una inspección visual.                                      |

Los 17 casos nuevos comprueban: resumen conocido y años exactos; carga distinta de vacío; D2/progreso y doble inicio; copia offline sin escrituras/TMDB aun con marcador incierto; conservación de consulta ante un error remoto previo; captura de PA-01/02/03/04/05/06; error global y reintento; descarte de póster tardío al cambiar año; cierre/invalidez de guarda ante sesión anterior; fallo parcial D6 con política de fixture; desconexión antes de enviar; reconexión tras confirmación; y límite de año en zona local controlada. No son pruebas de render nativo ni credenciales de producción.

No se cambiaron reglas, dependencias ni el dominio puro. Las pruebas de reglas usan `demo-mi-cartelera`, no las cuentas de la estudiante. No se publicaron reglas ni se migraron datos reales. Las capturas existentes no se modificaron ni se añadieron al commit documental.

## Recorridos pendientes en Expo Go

Antes de usar una cuenta de prueba con Firestore, confirmar manualmente qué versión de reglas está publicada; estas pruebas no realizan esa publicación. La versión preparada del paso 14 sigue identificada por el commit `301c34a` y su archivo `firestore.rules`.

1. Iniciar Expo manualmente con `npm run dev`; abrir en Expo Go con la configuración local de la estudiante. Autenticarse y entrar en Mi año. Comprobar selector con año actual más años Vista, sin duplicados ni otros vacíos.
2. Con películas/series conocidas y metadatos inequívocos, revisar totales, horas de películas, géneros/directores, doce meses y destacada. Cambiar año y volver; comprobar correspondencia de todas las métricas y acceso al detalle.
3. Usar año actual vacío y obras de un año anterior: comprobar mensaje y «Ir a Mi lista». No crear opciones vacías artificiales.
4. Con una obra heredada Vista y actualizadoEn válido, abrir online, observar progreso y revisar manualmente que vistaEn conserva el instante anterior. Reabrir y comprobar que no cambia. Esta revisión en cuenta real corresponde a la estudiante, no al agente.
5. Con metadatos ambiguos o ausentes, comprobar PA-03 sin caída, sin consultas D6 forzadas y sin falso vacío. Tras resolver PA-03 se podrán verificar enriquecimiento real y fallos parciales reales en teléfono; ahora solo tienen prueba automática con política inyectada.
6. Preparar copia online, activar modo avión, cerrar/reabrir con sesión, entrar al resumen y cambiar año: aviso/fecha de copia y cero migraciones/enriquecimientos offline. Si no hay copia, comprobar escenario PA-06. Reconectar y verificar actualización sin duplicar tareas.
7. Cambiar de cuenta o cerrar sesión durante una operación: no mostrar datos/progreso de la anterior. Comprobar también lecturas/escrituras inciertas en condiciones reales antes de acreditarlas en dispositivo.
8. Provocar error remoto para revisar error/reintento, y escenarios de empate completo, nombres ambiguos o fecha no utilizable para revisar sus avisos pendientes. No considerar sus resultados de negocio resueltos.
9. Revisar en teléfono tamaño de texto ampliado, scroll del selector y meses, lector de pantalla, áreas de 44, safe areas, contraste y comportamiento al regresar desde segundo plano. Revisar apariencia del Proyecto 3 y logo/atribución TMDB en Acerca de. iOS permanece pendiente si no se prueba expresamente.

## Documentación consultada

Se comprobaron versiones instaladas antes de usar APIs y se consultaron [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [estilos de texto de React Native](https://reactnative.dev/docs/text-style-props) y [limpieza de efectos al perder foco en React Navigation](https://reactnavigation.org/docs/use-focus-effect/). La revisión de React se apoyó en la skill `vercel:react-best-practices`: componentes presentacionales, efectos con limpieza, ausencia de peticiones en render y suscripciones descartadas al cerrar. No se instalaron librerías de UI ni se aplicaron pautas específicas de Next.js a esta app nativa.
