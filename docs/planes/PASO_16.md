# Plan del paso 16 — Mi año en cine

Estado: plan aprobado por la estudiante; implementación autorizada únicamente para las ramas no bloqueadas. Fecha: 26 de noviembre de 2026. No autoriza cambios de pantallas, publicación de reglas, migraciones reales ni push.

## Aprobación y límites — 26 de noviembre de 2026

La estudiante aprueba este plan y fontWeight 700 para el título «Mi año en cine» en React Native. Se documenta primero en este plan y DESIGN.md; el token del título se adaptará en el diff de implementación. No se sustituye el 750 del dato de tarjeta ni se modifica el brand board. La interlínea del título sigue sin un nuevo valor aprobado. La tipografía del dato de tarjeta queda sin adaptación final aprobada; no se introducirá un cast ni un peso de reemplazo.

Se autoriza capturar PuntoAbiertoError y mostrar el escenario pendiente, sin caída, resultado inventado ni vacío falso. PA-01–PA-06 no quedan resueltos. Para PA-03, la conexión automática no clasificará vacíos/null como datos pendientes ni impondrá reintentos: preparará la cola y expondrá el bloqueo cuando necesite esa decisión. La migración D2 con origen válido y el resto de ramas definidas pueden ejecutarse online. El código quedará sin commit para revisión.

## Base y alcance

- Rama `epica-mi-anio`; datos del paso 14 en `301c34a`; tokens del paso 15 en `41b7ff2`.
- Fuentes leídas: [AGENTS.md](../../AGENTS.md), [DESIGN.md](../../DESIGN.md), [brand board](../diseno/brand-board.html), [spec](../specs/01-mi-anio-en-cine.md) y [backlog](../backlog/01-mi-anio-en-cine.md). Los encabezados históricos de spec/backlog no sustituyen las evidencias de los pasos ya realizados.
- Este plan descompone T-DAT-03, T-UI-01 y su verificación. Reutiliza dominio, `prepararResumen`, transacciones, controlador y caché existentes. No vuelve a implementar D1–D13 en pantallas ni cambia los criterios aprobados.
- Se conservan RF1–RF10, React Navigation, sesión por usuario, tema oscuro, atribución TMDB y datos reales. No hay revisionados, estadísticas de episodios, funciones sociales ni librería de gráficas.
- Los archivos nuevos enumerados a continuación son propuestas: no se crean como efecto de este plan. Las dos capturas ajenas al cambio permanecen intactas y fuera del commit de tokens.

## Tickets y orden

### P16-00 — Aclaraciones de producto y adaptación tipográfica

**Archivos previstos:** documentación de las respuestas en `docs/specs/01-mi-anio-en-cine.md`, `docs/backlog/01-mi-anio-en-cine.md`; `DESIGN.md` y `src/tema/` solo si la estudiante aprueba una adaptación visual. No reescribir decisiones anteriores sin su respuesta.

**Aceptación:** cada respuesta aprobada identifica qué criterio o componente desbloquea. El peso 750 sigue siendo referencia hasta aprobar su adaptación; no usar un cast, parche de tipos o cambio silencioso a 700/800. Aclarar también el peso/interlínea del título del teléfono. Los PA no resueltos siguen identificados como bloqueos, no como casos aprobados.

**Verificación:** revisión documental con la estudiante y comprobación posterior de estilos tipados. Se inspeccionaron los tipos públicos instalados de React Native 0.88 (`types_generated/Libraries/StyleSheet/StyleSheetTypes.d.ts`): `fontWeight` admite valores numéricos en centenas, pero no 750. Esto acredita incompatibilidad con esa propiedad, no autoriza escoger otra representación ni otro peso.

**Dependencias:** ninguna. Las ramas que no dependan de estas respuestas pueden prepararse; no se declara cerrada la interfaz mientras falten las decisiones que utiliza.

### P16-01 — Migrar el tema heredado sin rediseñar los recorridos existentes

**Archivos previstos:** `src/theme/index.ts`, `src/tema/index.ts` y, si resulta necesario separar los estilos de sus valores, `src/tema/estilos.ts`. Revisar los consumidores reales: `src/navigation/AppNavigator.tsx`, `src/components/{UI,EstadoMiLista,ImagenCatalogo}.tsx` y `src/screens/{Auth,Bienvenida,Explorar,Lista,Detalle,Editar,Acerca}Screen.tsx`. Cambiar imports únicamente cuando lo requiera la migración; la spec permite conservar una fachada de compatibilidad en `src/theme/` que consuma los tokens.

**Aceptación:** una sola fuente de valores de color en `src/tema/`; ningún hexadecimal permanece en `src/theme/` ni aparece en otro código de `src/`. Conservar medidas y comportamiento existentes que no estén autorizados a cambiar. La adaptación de tipografía aprobada se aplica donde corresponda, sin reemplazar el estilo del Proyecto 3 por el del resumen por iniciativa propia. No se toca `tests/colores-fijos.test.ts` ni su configuración.

**Verificación:** ejecutar el sensor original y obtener cero hallazgos; ejecutar suite, TypeScript y lint. Comprobar por diff que el sensor permanece idéntico. Recorrido posterior en teléfono de login, búsqueda, lista, detalle, edición y Acerca de, incluyendo atribución TMDB y controles deshabilitados. Revisar el contraste real de estos últimos antes de cambiar su opacidad; no inventar una nueva opacidad.

**Criterios:** adopción visual transversal de DESIGN y regresión de CA-A1-01 a CA-A1-04; preservación RF1–RF10. **Dependencias:** tokens existentes; P16-00 para los estilos que requieran una adaptación todavía no aprobada. El retiro de los seis hexadecimales puede avanzar sin resolver los PA del dominio.

### P16-02 — Adaptar la lista al dominio y al tiempo local

**Archivos previstos:** nuevo `src/services/adaptarResumen.ts`, `src/types/index.ts` si necesita contratos de presentación, nuevas pruebas `tests/adaptar-resumen.test.ts`. Reutilizar `src/dominio/resumenAnual.ts`, sin trasladar cálculos a la pantalla.

**Aceptación:** proyectar vistaEn a año, mes e instante en la hora local del teléfono; recibir año actual desde la capa exterior al dominio. Usar `aniosDisponibles` y `resumenAnual` existentes; recalcular al cambiar datos o zona al volver a la app. Selector exacto: años con obras Vista más año actual, descendentes y únicos. No usar estreno/alta para asignar año ni fabricar fechas. Estado de fallo TMDB explícito se traduce a `estadoMetadatos: 'fallo'`; no clasificar null/listas vacías como fallo o pendiente por conveniencia. Mantener totales, horas, meses, géneros, directores y destacada del contrato.

**Verificación:** Vitest con instantes y zonas controladas, límite de año/mes, cambio de año y ausencia de mutación de entradas; conservar los 37 casos existentes. Tras respuestas de producto, añadir casos específicos de PA antes de implementarlos. Comprobar por separado que el reloj del teléfono no entra en las funciones puras.

**Criterios:** CA-A2-01 a CA-A2-09, CA-A3-01/02 y CA-A5-05 en su adaptación. **Dependencias:** P16-00 para PA-01/02/03/04/05; pueden probarse las ramas ya definidas sin cerrar esos casos.

### P16-03 — Conectar Context, sesión y cola D2/D6

**Archivos previstos:** `src/context/CarteleraContext.tsx`, `src/hooks/useListaUsuario.ts`, nuevo `src/hooks/useResumenAnual.ts`, posible `src/services/resumenController.ts` para aislar la coordinación y nuevas pruebas `tests/resumen-controller.test.ts`. Reutilizar `src/services/{prepararResumen,listaController,listaService,tmdbService,cacheService,conectividadService}.ts`; modificar solo la integración necesaria y conservar sus contratos de seguridad.

**Aceptación:** exponer año, petición discriminada, progreso y fallos desde Context/hook. El hook actual aún no expone `migrarFecha` y `completarMetadatos`: conectarlos por los métodos del controlador, sin saltar su bloqueo, marcador incierto, timeout, reconciliación o actualización de caché. D2 recorre todas las Vista sin fecha con origen válido; después D6 procesa solo candidatas aprobadas del año seleccionado, de una en una. Actualizar la copia tras confirmación, no anunciar éxito de una escritura incierta. Un fallo TMDB continúa con la siguiente obra y conserva el total; un error de persistencia es bloqueante y no se cuenta como fallo TMDB.

Al cambiar año/cuenta, cerrar sesión o perder conexión, invalidar generación y progreso; abortar TMDB cuando sea posible y descartar respuestas tardías. Evitar ejecuciones duplicadas por render, foco o reconexión; no crear un bucle disparado por cada actualización de lista. Una escritura enviada puede terminar y debe reconciliarse, sin afirmar que fue cancelada. Sin conexión, calcular solo desde copia propia y no iniciar D2, D6 ni peticiones de enriquecimiento. No borrar una copia válida ante error remoto.

**Verificación:** Vitest con promesas diferidas, espías y conectividad simulada: cambio de cuenta/año durante petición, doble activación, fallo parcial, timeout, offline sin efectos y reconexión. Emulador demo: fecha anterior exacta, segunda ejecución sin cambios, conservación de personales, aislamiento entre cuentas y esquema inválido denegado. Teléfono posterior: progreso, modo avión y cierre/reapertura. No usar datos reales para verificar este ticket desde el agente.

**Criterios:** CA-A3-02; CA-A4-01 a CA-A4-04; CA-A5-01/03/04/05. **Dependencias:** P16-02 y P16-00 para PA-02/03/04/06. En especial, PA-03 bloquea conectar automáticamente la selección `esCandidata` y la clasificación de completitud; la existencia de la cola no resuelve esa decisión.

### P16-04 — Componentes del resumen según el board

**Archivos previstos:** nuevos `src/components/resumen/{SelectorAnio,TarjetaDato,BarrasMensuales,ObraDestacada}.tsx`; reutilizar `src/components/{UI,ImagenCatalogo}.tsx` y estilos de `src/tema/`. No añadir paquetes de gráficas o fuentes.

**Aceptación:** componentes presentacionales reciben datos/acciones, nunca consultan Firebase/TMDB. Selector accesible con opciones exactas de D4; tarjetas con jerarquía aprobada; doce barras View con mes y valor, incluidos ceros; destacada con póster, alternativa de imagen y calificación personal. Familia del sistema, objetivos mínimos 44 × 44, texto ampliable y ningún ancho fijo de teléfono. No repartir reglas de desempate entre componentes ni usar datos ficticios del board como historial.

**Verificación:** TypeScript/lint y revisión de diff de tokens; contraste contra los fondos realmente usados. Recorrido en teléfono con texto ampliado, anchos disponibles y lector de pantalla; documentar los resultados humanos sin darlos por hechos. Probar lógica de formato en Vitest solo cuando exista lógica propia verificable, sin añadir dependencias de tests por defecto.

**Criterios:** CA-A2-03/06/07/08/09, CA-A3-01 y presentación de CA-A5-05. **Dependencias:** P16-01 y adaptación visual de P16-00; la presentación de casos con ganadores depende de P16-02 y de PA-01/05 cuando aplique.

### P16-05 — Pestaña y composición de Mi año en cine

**Archivos previstos:** `src/navigation/types.ts` y `src/navigation/AppNavigator.tsx`, nueva `src/screens/ResumenAnualScreen.tsx`. Consumir Context/hook y los componentes de P16-04.

**Aceptación:** añadir pestaña autenticada «Mi año en cine», conservando native stack, grupos por uid y los recorridos existentes. Selección inicial en año actual, no 2026 fijo. Mostrar selector, total y desglose; horas de películas; género, director y mes más activo; doce barras; obra destacada como cierre. Usar formato español y puntuación personal identificada. Conservar safe areas, scroll y acceso a Mi lista/Detalle con parámetros tipados cuando la acción correspondiente esté definida. No añadir rutas o acciones de producto ajenas al backlog.

**Verificación:** TypeScript de parámetros, Vitest del cambio de año en el controlador; recorrido en Expo Go de entrada a pestaña, opciones de años, selección, métricas coherentes y regreso a pantallas anteriores. Inspección visual contra el board, con datos reales diferenciados de fixtures. No probar una maqueta como si fuese persistencia real.

**Criterios:** CA-A2-01 a CA-A2-09 y CA-A3-01/02. **Dependencias:** P16-02/03/04; las ramas afectadas por PA no se consideran completas hasta su respuesta.

### P16-06 — Estados de pantalla y avisos comprensibles

**Archivos previstos:** nuevo `src/components/resumen/EstadoResumen.tsx`, `src/screens/ResumenAnualScreen.tsx`, `src/hooks/useResumenAnual.ts` y pruebas del controlador/formatos cuando corresponda.

**Aceptación:** distinguir inicial/carga, progreso D2/D6, éxito, vacío confirmado, error global, copia offline y resultado incompleto. No mostrar vacío durante carga. Vacío incluye «Ir a Mi lista» y respeta el selector D4. Offline muestra aviso de copia y no anuncia sincronización. Un fallo de una obra no oculta totales: se informa obras sin datos, películas sin duración y ausencia de directores por separado. Sin calificadas se invita a calificar. No ofrecer reintentos de enriquecimiento ni textos para casos abiertos como si ya estuviesen aprobados. Mantener mensajes accesibles y no depender solo del color.

**Verificación:** Vitest de transiciones con fuentes diferidas y fallo global/parcial; teléfono con año actual vacío y obras de un año anterior, desconexión/reconexión y acción «Ir a Mi lista». Tras decisión aprobada, añadir casos de fecha ilegible y sin copia offline. No etiquetar desconocimiento como vacío.

**Criterios:** CA-A2-09 y CA-A5-01 a CA-A5-06. **Dependencias:** P16-03/04/05; PA-02/03/04/06 bloquean sus ramas y PA-01/05 afectan resultados que el dominio aún no puede elegir.

### P16-07 — Regresión y cierre del paso 16

**Archivos previstos:** pruebas nuevas de los tickets anteriores, suites existentes solo para ampliar cobertura pertinente; nueva `docs/PRUEBAS_RESUMEN.md`, `README.md` y `docs/BITACORA_IA.md` con trabajo y resultados reales. No modificar el sensor.

**Aceptación:** trazabilidad de los 25 criterios de la spec, separando pruebas locales, emulador, recorridos humanos y ramas aún bloqueadas. Al finalizar la migración, la suite completa debe pasar también el sensor, sin excepcionar `src/theme/`. Mantener CRUD, autenticación, caché, aislamiento y atribución. No dar por publicadas reglas o realizadas pruebas en teléfono por la existencia de capturas sin verificar su contenido y contexto.

**Verificación:** `npm test`, `npx tsc --noEmit`, `npm run lint`, emulador cuando se modifique integración de datos y `git diff --check`; controles locales con `EXPO_NO_DOTENV=1`. Revisar documentación oficial de las versiones instaladas antes de tocar APIs Expo/React Native. Comparar el sensor con su versión original. Registrar pruebas humanas de navegación, estados, cambio de cuenta, modo avión, legibilidad y accesibilidad; iOS queda pendiente si no se prueba. Confirmar con la estudiante la versión de reglas publicada antes de recorridos de producción: el agente no publica ni migra datos reales.

**Criterios:** regresión CA-A1-01 a CA-A1-04 y cierre de los 21 restantes según la matriz de la spec. **Dependencias:** P16-01 a P16-06 y respuestas de producto para las ramas bloqueadas.

## Decisiones necesarias y bloqueos concretos

| Punto               | Respuesta que falta                                                                                          | Qué no puede cerrarse sin ella                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipografía 750      | Adaptación nativa aprobada del dato de tarjeta; no existe 750 en `fontWeight` tipado instalado.              | Estilo final de TarjetaDato y revisión visual de P16-04/05. No se aprueba 700/800 por este plan.                                                                |
| Título del teléfono | Resolver peso 800 de DESIGN frente a peso no explícito de h2 en el HTML e interlínea de las variantes 30/28. | Adaptación final del título en P16-04/05.                                                                                                                       |
| PA-01               | Resultado cuando coinciden calificación y fecha de destacada.                                                | CA-A2-08 en empate completo; P16-02/05/06. No escoger por ID ni orden.                                                                                          |
| PA-02               | Tratamiento de Vista antigua sin actualizadoEn utilizable.                                                   | D2 inválida, adaptación y estados de P16-02/03/06; CA-A4-01 y CA-A5-06. No sustituir por fecha actual.                                                          |
| PA-03               | Cómo clasificar ausencia frente a null/[] legítimos y cuándo reintentar.                                     | Selección automática D6 y completitud en P16-02/03/06; CA-A4-03/04 y CA-A5-03/05. El fallo explícito de una petición sí tiene efecto definido y puede probarse. |
| PA-04               | Cómo tratar/comunicar obras sin fecha utilizable, especialmente offline.                                     | Asignación a años y presentación en P16-02/06; CA-A2-01, CA-A3-02 y CA-A5-06. No descartarlas silenciosamente.                                                  |
| PA-05               | Convención de mayúsculas, acentos y equivalencias al desempatar.                                             | Variantes lingüísticas de CA-A2-05/06 en P16-02/05. No elegir locale o normalización por cuenta propia.                                                         |
| PA-06               | Mensaje del resumen offline sin copia.                                                                       | Rama sin copia de P16-06 y CA-A5-06. Mantenerla distinta de lista vacía.                                                                                        |

La respuesta de la estudiante precederá a los tests con nuevos resultados esperados y a la implementación correspondiente. Las guardas internas actuales del dominio para puntos abiertos no constituyen una solución de interfaz aprobada. No se transforma un bloqueo en un error genérico definitivo para declarar terminado el paso.

## Resultado actual de esta preparación

El commit `41b7ff2` contiene solo `src/tema/index.ts` y `src/tema/README.md`; el hook Git se ejecutó. Controles previos actuales: `npm test` con 80 aprobadas y un único fallo esperado del sensor (seis colores en `src/theme/index.ts`); TypeScript y ESLint salida 0. Los demás controles de los tickets son futuros, no resultados obtenidos ahora.

El plan aprobado se registra en un commit documental previo a la implementación. El historial de preparación anterior no acredita los tickets futuros. La implementación autorizada se deja sin commit para revisión.
