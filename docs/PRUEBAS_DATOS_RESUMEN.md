# Paso 14: datos de Mi año en cine

Verificación local de Codex, 26 de noviembre de 2026. No acredita pruebas en teléfono, publicación de reglas ni migraciones de una cuenta real. El dominio previo se guardó en `7b7e1c9`; estos cambios quedan sin commit para revisión.

## Implementación preparada

- `listaService`: D1 se decide dentro de la transacción mediante `planificarCambioVista`. Al entrar en Vista se solicita fecha de servidor, se conserva sin transición y se limpia al salir. El alta obtiene metadatos en español antes de la transacción; la comprobación atómica de existencia sigue evitando sobrescrituras.
- `migrarFecha`: D2 captura el actualizadoEn anterior y solo escribe si sigue Vista sin fecha. Repetir no cambia actualizadoEn ni vistaEn. Un origen inválido detiene la operación; PA-02 no se resuelve con una fecha inventada.
- `completarMetadatos`: vuelve a comprobar estado, año local y vigencia; solo completa campos ausentes. Conserva valores presentes, incluidos null y listas vacías. No recrea documentos eliminados.
- `prepararResumen`: operaciones inyectadas, fechas antes de seleccionar candidatas del año, cola secuencial y progreso por fase. Un fallo TMDB registra la clave y continúa; un fallo de escritura detiene el proceso. Las escrituras deben utilizar los métodos del `ListaController`, que conservan bloqueo, tiempo máximo, promesa real, reconciliación y copia por cuenta. La guarda debe incluir sesión, conexión y selección vigentes.
- Caché v2 con prioridad sobre v1; v1 permanece intacta como copia anterior. El marcador de escritura incierta conserva su clave para sobrevivir al cambio de versión. Los campos nuevos son opcionales al leer documentos antiguos, no al crear una entrada nueva.
- Reglas locales: dueño no anónimo, esquema acotado, nuevas fechas y metadatos validados; no se publicaron.

No hay invocación automática desde pantallas. PA-01–PA-06 permanecen abiertos. En particular, `esCandidata` se recibe explícitamente: no se adopta una política «lista vacía/null = pendiente» ni reintentos posteriores por PA-03. El futuro resumen deberá conectar la cola tras la decisión correspondiente; los fallos TMDB devueltos sirven para clasificar esas obras como fallo en el dominio sin excluirlas de los totales.

## Comandos reproducibles

Desde la raíz de la app, Node 24.22.1, dependencias ya instaladas y `EXPO_NO_DOTENV=1` para todas las comprobaciones:

```sh
node node_modules/vitest/vitest.mjs run tests/datos-resumen.test.ts tests/lista-fechas.test.ts tests/metadatos-tmdb.test.ts tests/cache-v2.test.ts
npm run test:rules
npm test
npx tsc --noEmit
npm run lint
git diff --check
```

`test:rules` usa el emulador local `demo-mi-cartelera` y Java, con herramientas aisladas ya existentes. No usa el proyecto Firebase real. Los tests TMDB usan respuestas simuladas y una cadena de fixture sin credenciales reales; no consultan la API externa.

## Cobertura y resultados

| Control             | Evidencia / alcance                                                                                                                                     | Resultado actual                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest de datos     | 6 casos de cola: offline sin operaciones, progreso secuencial, fallo parcial, fechas, invalidación y escritura incierta; validación de legado/metadatos | 6/6 aprobados; salida 0                                                                                                                                        |
| Vitest del servicio | 4 casos con transacciones simuladas sobre código real: D1, D2 idempotente, D6 sin sobrescritura, guardas/otro año/eliminación                           | 4/4 aprobados; salida 0                                                                                                                                        |
| Vitest TMDB         | 3 casos: película, serie/null legítimo y respuesta inválida                                                                                             | 3/3 aprobados; salida 0                                                                                                                                        |
| Vitest caché        | 2 casos: v1/v2, marcador incierto, separación por uid y conservación ante datos malformados                                                             | 2/2 aprobados; salida 0                                                                                                                                        |
| Emulador            | 7 grupos: CRUD, dueño/ajeno/anónimo, esquema, D1, legado, D2 repetida, D6 repetido, duración -5 y otros valores inválidos                               | 7/7 grupos aprobados; salida 0                                                                                                                                 |
| Suite completa      | Incluye las 37 pruebas anteriores del dominio y los sensores existentes                                                                                 | 80 aprobadas (23 node:test + 57 Vitest), 1 fallo esperado: sensor de colores con seis hallazgos; salida 1. Los 37 casos del dominio pasan. Ningún fallo nuevo. |
| TypeScript          | `npx tsc --noEmit`                                                                                                                                      | Salida 0, sin errores                                                                                                                                          |
| ESLint              | `npm run lint`                                                                                                                                          | Salida 0, sin errores ni advertencias                                                                                                                          |

Durante el desarrollo, la primera ejecución del emulador aprobó seis grupos y falló el cargador aislado del servicio por faltar la dependencia `cambioVista`; se incorporó al cargador. Un fixture Vitest cercano a Año Nuevo UTC pertenecía al año local anterior; se sustituyó por una fecha fija de junio para probar el año previsto sin cambiar la clasificación local del código. La segunda ejecución del emulador aprobó los siete grupos. Estos resultados intermedios no sustituyen la ejecución final.

## Pendientes reales

- Resolver únicamente con la estudiante PA-01–PA-06; no se han cambiado sus decisiones.
- Conectar resumen/Context/interfaz en la etapa correspondiente, incluida cancelación por selección y presentación de progreso/fallos. No se modificaron pantallas ni tokens.
- Revisión y posterior publicación manual autorizada de reglas. Las reglas de producción actuales pueden rechazar el nuevo esquema hasta entonces; no se probó este código contra producción.
- Modo avión, cierre/reapertura y demás recorridos en dispositivo con el nuevo esquema: no realizados. Offline se probó mediante guardas simuladas, conservando las pruebas anteriores de bloqueo/reconciliación del controlador.
- El emulador informó que Firebase CLI 15 requerirá Java 21; la herramienta aislada actual funciona con Java 17. No se cambian dependencias en esta etapa.
