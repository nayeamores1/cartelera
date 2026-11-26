# Auditoría de Mi Cartelera Personal

## Auditoría inicial — 25 de noviembre de 2026

Base: commit `6aef220`, identificado con la etiqueta local `p3-final`. Trabajo iniciado en `epica-mi-anio`. La referencia existente del Proyecto 3 es `docs/ESPECIFICACION.md`; no existe un archivo llamado SPEC.md. Se conserva la especificación existente.

La app usa Expo, React Native y TypeScript estricto; React Navigation organiza Login/Registro, las pestañas Buscar/Mi lista/Acerca de y las rutas Detalle/Editar. Context expone sesión y acciones. Los servicios encapsulan Auth, TMDB, Firestore, conectividad y AsyncStorage; el controlador coordina la lista y su caché por cuenta.

### Contraste con RF1–RF10

| ID | Hallazgo | Evidencia: archivo y función/componente | Gravedad | Decisión |
| --- | --- | --- | --- | --- |
| RF1 | Registro, login, logout y observación de sesión implementados; persistencia mediante SDK y AsyncStorage. | src/services/authService.ts: authService; src/firebase/config.ts: getFirebaseAuth. | Informativa | Conservar; volver a probar tras la épica. |
| RF2 | Búsqueda de ambos tipos, filtros, estados, paginación y cancelación implementados. | src/services/tmdbService.ts: buscar; src/hooks/useBusqueda.ts: useBusqueda; src/screens/ExplorarScreen.tsx: ExplorarScreen. | Informativa | Conservar. |
| RF3 | Detalle con puntuación TMDB, sinopsis, póster y elenco. | src/services/tmdbService.ts: obtenerDetalle; src/screens/DetalleScreen.tsx: FichaDetalle. | Informativa | Extender datos por spec, sin alterar el recorrido. |
| RF4 | Alta atómica sin sobrescribir duplicados. | src/services/listaService.ts: agregar, transacción y snapshot.exists(). | Informativa | Conservar al ampliar metadatos. |
| RF5 | Filtros combinados de estado y tipo. | src/screens/ListaScreen.tsx: ListaScreen, filtrado de resultados. | Informativa | Conservar. |
| RF6 | Validación estricta de estado, comentario y calificación; solo Vista admite estrellas. La coerción identificada anteriormente ya está corregida. | src/utils/lista.ts: validarObra, validarEdicion, normalizarEdicion; src/screens/EditarScreen.tsx: Formulario; firestore.rules: valido. | Informativa | Conservar y añadir sensor Vitest de esta regla. |
| RF7 | Confirmación de eliminación y regreso a Mi lista solo después de éxito. | src/screens/EditarScreen.tsx: quitar, eliminar, RegresoMiLista. | Informativa | Conservar. |
| RF8 | Copia por uid validada, lectura local primero, errores controlados y bloqueo offline. | src/services/cacheService.ts: leer/guardar; src/services/listaController.ts: iniciar/refrescar; src/components/EstadoMiLista.tsx. | Informativa | Extender compatibilidad de caché mediante spec y pruebas. |
| RF9 | Logo, atribución inglesa y cierre de sesión conservados. | src/screens/AcercaScreen.tsx: AcercaScreen; assets/TMDB-ATRIBUCION.md. | Informativa | Conservar con TMDB menos prominente que la marca. |
| RF10 | Capas separadas y strict activado. La configuración del harness no describe la arquitectura real. | tsconfig.json; src/services/; AGENTS.md: Navigation & Routing exige Expo Router pese a usarse React Navigation. | Media | Corregir instrucciones en Hito 1, antes de programar. |

### Hallazgos del borrador: alcance y reclasificación

Se conserva el borrador como punto de partida. Sus A02–A04 describen preparación o riesgos de evolución, no incumplimientos actuales de RF1–RF10. No se exige implementar funciones de Mi año en cine para cerrar esta auditoría. En particular, «Alta para la migración» de A03 no equivale a un fallo de gravedad alta del Proyecto 3.

| ID | Hallazgo | Evidencia: archivo y función | Gravedad | Decisión |
| --- | --- | --- | --- | --- |
| A01 | Faltan CLAUDE.md, skill /commit, hook de Prettier y Vitest. npm test usa node:test. | package.json: scripts/devDependencies; ausencia de .claude/. | Media | Preparar harness en Hito 1; conservar las pruebas existentes. |
| A02 | DESIGN.md, brand board y src/tema/ pertenecen al trabajo futuro; hoy el tema vive en src/theme/. | src/theme/index.ts: colors/styles. | Informativa | Fuera de alcance de la corrección del Proyecto 3; Hito 2 y posteriores. |
| A03 | Cambiar el esquema sin coordinar reglas y caché introduciría incompatibilidad; el esquema vigente es coherente. | firestore.rules: valido/hasOnly y allow update; src/utils/lista.ts: validarItem. | Riesgo futuro, no defecto actual | Fuera de alcance; especificar compatibilidad antes de migrar en Hito 3. |
| A04 | Los campos y cálculos de la nueva épica no son requisitos del Proyecto 3. | src/types/index.ts: ListaItem; src/services/listaService.ts: agregar/actualizar. | Informativa | Fuera de alcance de esta auditoría funcional; no se consideran faltantes obligatorios. |
| A05 | Resultados históricos de auditoría de dependencias no acreditan el estado actual. | docs/audit-produccion.json; README.md. | Riesgo conocido | No aplicar actualizaciones automáticas; evaluar antes de distribuir. |
| A06 | Algunas pruebas móviles siguen pendientes. | docs/PRUEBAS_LISTA.md y docs/BITACORA_IA.md. | Riesgo conocido | Conservar pendientes y repetir los recorridos afectados; no declarar pruebas humanas nuevas. |

### Tabla de decisiones verificables — revisión completada

«Observado» significa constatado en el código o configuración; no implica reproducción en teléfono. «Riesgo» identifica una limitación no reproducida en dispositivo. Las decisiones son propuestas para revisión: esta tarea no aplica ninguna corrección de código.

| ID | Descripción y naturaleza de la evidencia | Evidencia concreta: archivo y función/componente | Gravedad | Decisión | Cómo comprobar la corrección o cerrar el riesgo |
| --- | --- | --- | --- | --- | --- |
| H01 (A01/RF10) | Contradicción observada: las instrucciones obligan a usar Expo Router, pero la especificación y la app usan React Navigation. Puede inducir cambios incompatibles. | AGENTS.md: Navigation & Routing; src/navigation/AppNavigator.tsx: AppNavigator/Tabs; docs/ESPECIFICACION.md: Pantallas. | Media | Corregir ahora, en una tarea posterior autorizada de instrucciones. | Revisar AGENTS.md frente a las rutas reales; confirmar que no ordena migrar a Router, y ejecutar TypeScript/lint sin cambiar navegación. |
| H02 (A01) | Preparación observada incompleta para Hito 1: faltan CLAUDE.md, skill, hook y Vitest; node:test sí existe y funciona. No es un fallo funcional de RF1–RF10. | package.json: scripts.test/devDependencies; tests/lista.test.cjs: pruebas de validarEdicion; ausencia de .claude/. | Media de proceso | Corregir ahora, después de revisar esta auditoría y documentar el harness. | Verificar carga de instrucciones, ejecución real del hook, formato de /commit y un sensor Vitest de regla existente; mantener todas las pruebas actuales. |
| H03 (RF1) | Riesgo de mantenimiento, no fallo reproducido: TypeScript selecciona una declaración oficial RN mediante ruta de paquete; una actualización podría moverla. Fue una excepción autorizada y documentada, no una firma inventada. | tsconfig.json: paths.firebase/auth; src/firebase/config.ts: getFirebaseAuth; app.json: experiments.tsconfigPaths. | Baja | Riesgo conocido. | Al actualizar Firebase: comprobar exports/tipos instalados, tsc, bundle y persistencia real tras cerrar/reabrir. |
| H04 (RF8) | Riesgo no reproducido tras muerte del proceso con commit incierto: el marcador persistente no contiene identidad de operación y la promesa real solo vive en memoria. Una lectura tras reinicio reconcilia el estado actual, pero no demuestra por sí sola el desenlace de un commit que todavía pudiera terminar después. No se afirma pérdida de datos ni éxito falso observado. | src/services/listaController.ts: operaciones, iniciar, refrescar, mutar; src/services/cacheService.ts: marcarPendiente/tienePendiente. | Media | Riesgo conocido. | Ensayo controlado: retrasar confirmación, agotar espera, terminar proceso y reabrir; verificar bloqueo, avisos y actualización posterior al commit. No confundir el test de timeout con este escenario completo. |
| H05 (RF8) | Cambios de cuenta con respuestas tardías: se observan controlador nuevo por uid, invalidación y colas de caché; la prueba local cubre cierre y respuesta tardía, pero no toda la experiencia móvil A→B→A. | src/hooks/useListaUsuario.ts: useListaUsuario; src/context/CarteleraContext.tsx: CarteleraProvider; src/services/listaController.ts: cerrar/iniciar/refrescar; src/services/cacheService.ts: iniciarCache/guardar. | Media | Riesgo conocido. | Dos cuentas, lectura/escritura retrasada de A, logout/login B y regreso A: ningún dato privado ni respuesta de A debe aparecer en B. |
| H06 (UX) | Cobertura parcial de accesibilidad: hay labels, roles, estados y avisos; no se ha verificado el recorrido con lector ni texto ampliado. No se declara un fallo de accesibilidad reproducido. | src/screens/AuthScreen.tsx: AuthScreen; src/screens/EditarScreen.tsx: Formulario; src/components/UI.tsx: Button/Page; src/components/EstadoMiLista.tsx. | Media | Riesgo conocido. | TalkBack/VoiceOver: foco, anuncio de errores, estrella seleccionada/deshabilitada, alertas, teclado y ampliación sin recortes. Registrar dispositivo y resultado real. |
| H07 (UX) | Altura mínima declarada: botones 50, inputs 52, chips/tarjetas 44. En estrellas/chips no se fija minWidth 44; el tamaño efectivo depende del texto y padding, por lo que no se puede certificar ancho mínimo solo con el código. | src/theme/index.ts: styles.button/input/chip; src/screens/EditarScreen.tsx: Formulario, Pressable de estrellas; src/navigation/AppNavigator.tsx: tabBarItemStyle. | Baja | Riesgo conocido. | Medir ancho y alto efectivos de cada control en teléfono/inspector, incluidas estrellas, tabs y volver atrás; corregir solo los que no alcancen 44×44. |
| H08 (A05) | Informe histórico registra 9 vulnerabilidades altas; no se ha ejecutado auditoría nueva ni demostrado explotabilidad. No se cuentan como nueve fallos altos actuales reproducidos. | docs/audit-produccion.json: metadata/vulnerabilities; README.md: comprobaciones históricas. | Media, pendiente de evaluación actual | Riesgo conocido. | Auditoría posterior con red, fecha y cadena de dependencias; evaluar impacto runtime/desarrollo y actualización compatible, sin audit fix --force. |
| H09 (RF8) | Caché local no cifrada, por diseño documentado. Se conserva por uid tras logout, aunque se vacía la vista. No es una fuga entre cuentas observada; requiere asumir dispositivo/almacenamiento local confiable. | src/services/cacheService.ts: clave/leer/guardar; docs/ESPECIFICACION.md: Caché y privacidad. | Baja | Riesgo conocido. | Revisar el modelo de amenaza; comprobar que caché no contiene credenciales y que no se presenta sin sesión. Cifrado adicional queda fuera del alcance vigente. |
| H10 (RF9) | Texto observado desactualizado: Acerca de se presenta como versión «autenticación» aunque catálogo y lista están implementados. No impide el uso ni elimina la atribución. | src/screens/AcercaScreen.tsx: AcercaScreen, subtitle de Heading. | Baja | Corregir ahora, en tarea posterior documentada y autorizada de textos. | Abrir Acerca de: descripción corresponde a la app actual, manteniendo correo, logout, logo y aviso TMDB. |

### Evidencia funcional y límites por área

- **RF1:** getFirebaseAuth inicializa una sola app/Auth, usa persistencia AsyncStorage, lee variables de Firebase con referencias estáticas y no exige token TMDB. authService centraliza operaciones y traducción segura. CarteleraProvider observa sesión y AppNavigator espera su recuperación. AuthScreen valida y bloquea envíos duplicados. Las unitarias usan mocks: no prueban persistencia nativa real hoy.
- **Aislamiento y reglas:** listaService.dbUsuario compara uid con Auth y rechaza anónimos. firestore.rules.propietario exige dueño autenticado no anónimo; valido exige esquema exacto, ID compuesto, tipos, valores y timestamps. Update conserva metadatos mediante affectedKeys y agregadoEn; otras rutas están denegadas. No se encontró permiso global que anule estas restricciones. Una prueba de emulador no acredita la versión publicada en producción.
- **RF4/RF6:** agregar lee antes de crear dentro de runTransaction y no sobrescribe documentos existentes; actualizar normaliza la calificación fuera de Vista. validarObra/validarEdicion ya exigen tipos primitivos sin coerción. Las pruebas existentes incluyen arrays/objetos inválidos, comentarios de 501 caracteres, fracciones, caché corrupta y conservación de copia válida. No se presenta la antigua coerción como fallo todavía abierto.
- **RF8:** iniciar carga caché validada antes del servidor; null y copia vacía se distinguen. Fallo remoto conserva datos; refrescar usa lectura de servidor. mutar limita espera sin fingir cancelación del commit, bloquea doble envío y conserva la promesa real mientras vive el proceso. EstadoMiLista distingue sin conexión, comprobación, carga, pendiente y error, y muestra fecha de copia. H04 y H05 delimitan escenarios todavía pendientes.
- **RF2/RF3:** useBusqueda aborta e invalida revisiones, aplica debounce y reinicia páginas. tmdbService usa endpoints separados, filtra personas, conserva paginación, añade credits al detalle, gestiona 429/red/timeout y configura imágenes con caché en memoria. ExplorarScreen y FichaDetalle presentan carga/error/reintento, vacío, datos alternativos y puntuación TMDB diferenciada. No se realizaron peticiones reales a TMDB en esta revisión.
- **RF5/RF7:** ListaScreen combina filtros, ofrece Todos para restablecer y distingue lista vacía de filtros sin resultados. Formulario pide confirmación; cancelar no llama al servicio. EditorEntrada conserva la entrada durante el borrado; RegresoMiLista navega solo tras éxito y desmonta la advertencia de borrador. No se repitió este recorrido en teléfono hoy.
- **RF9:** AcercaScreen conserva logo local, procedencia en assets/TMDB-ATRIBUCION.md, texto inglés «This product uses the TMDB API but is not endorsed or certified by TMDB.» y cierre de sesión real. H10 es solo precisión del subtítulo.
- **RF10 y privacidad:** strict está activo. La búsqueda estática de imports Firebase, fetch, URL directa de TMDB y any en src/screens no produjo coincidencias. Las pantallas sí usan servicios, como corresponde. git ls-files confirmó solo .env.example entre las rutas .env consultadas; git check-ignore confirmó .env y .env.local ignorados. No se leyó .env ni se compararon sus valores con archivos; no se afirma una auditoría exhaustiva de secretos en esta sesión.

### Clasificación de las fuentes de verificación

1. **Inspección actual de código:** respalda los contratos y hallazgos anteriores; no certifica medidas reales ni experiencia en dispositivo.
2. **Pruebas históricas locales:** las ejecuciones anteriores descritas en BITACORA_IA.md y matrices se conservan como antecedentes, con sus límites. No se suman como ejecuciones nuevas.
3. **Confirmaciones históricas de la estudiante:** Auth/persistencia, catálogo, CRUD, offline y separación de cuentas, publicación manual de reglas y get/delete ajenos denegados en simulador. No son pruebas ejecutadas por Codex ahora; no se infieren create/update en producción, iOS ni lector de pantalla.
4. **Ejecuciones actuales:** resultados consignados en la tabla siguiente. Los mocks prueban lógica aislada; el emulador valida las reglas locales. No se usan credenciales ni servicios de producción.

### Orden de trabajo y puntos abiertos

1. Revisar este resumen y las decisiones de auditoría antes del primer commit documental.
2. Completar harness del Hito 1 y su primer sensor verde. Todo commit de código requiere revisión humana previa, npm test y TypeScript.
3. Hito 2: PRD D1–D13, backlog y diseño revisado por la estudiante. No implementar todavía la épica.
4. Hito 3: spec, commit de tests en rojo, dominio, migraciones, reglas y tokens. No publicar reglas sin revisar su contenido y verificarlo.
5. Hito 4: interfaz, verificación humana, auditoría de cierre y demo.

Puntos que requieren aclaración en el PRD: el selector de D4 solo ofrece años con obras y el actual, pero la demo pide cambiar hasta un año vacío; también debe fijarse el desempate de obra destacada si coinciden calificación y vistaEn. El fragmento de reglas del enunciado limita listas, pero no comprueba por sí solo que cada elemento sea texto ni impone todas las transiciones D1: la spec debe resolver su validación completa.

### Verificación de esta auditoría

La primera preparación del borrador ya había ejecutado TypeScript, lint y 23 unitarias, sin emulador; esos resultados son un antecedente de esta revisión. En esta tarea se repitieron los controles siguientes el 25 de noviembre de 2026 con Node 24.22.1, invocando su ejecutable absoluto disponible en el equipo. Estos comandos equivalen a los scripts existentes; no se instaló ni modificó ninguna dependencia de la app.

| Control actual | Comando ejecutado con Node 24.22.1 | Resultado exacto | Alcance |
| --- | --- | --- | --- |
| TypeScript | node node_modules/typescript/bin/tsc --noEmit | Exit 0, sin diagnósticos. | Tipado estricto; no ejecuta la app. |
| ESLint | node node_modules/eslint/bin/eslint.js src tests App.tsx index.ts | Exit 0, sin errores ni avisos. | Código fuente y pruebas actuales. |
| Unitarias | node --test tests/*.test.cjs | Exit 0; 23 pruebas, 23 aprobadas, 0 fallos, 0 canceladas, 0 omitidas. | Auth 6, lista/caché 9, TMDB 8; SDK/red aislados. No lee .env. |
| Reglas, primer intento | node tests/rules/ejecutar.cjs | Exit 1: TIMEOUT: Port 4400 on 127.0.0.1 was not active within 60000ms. También aviso de comprobación de actualización/configuración de CLI fallida. | Fallo de arranque local; la suite no llegó a ejecutarse, no implica fallo de reglas. |
| Reglas, segundo intento | node tests/rules/ejecutar.cjs, fuera del sandbox | Exit 0; 5 pruebas/grupos aprobados, 0 fallos, 0 canceladas, 0 omitidas. | Proyecto demo-mi-cartelera, reglas locales y transacciones en emulador; no producción. |

Los cinco grupos del emulador cubren: operaciones del dueño; denegaciones sin sesión/anónimos/otra cuenta; esquema, ID, metadatos y creación; actualización con estados/calificaciones/comentario y metadatos; y duplicados concurrentes mediante el servicio real. El lanzador fuerza EXPO_NO_DOTENV y elimina EXPO_PUBLIC_* del entorno del proyecto demo. La CLI obtuvo su JAR de emulador en la caché de herramientas y produjo logs locales ignorados; no cambió package.json, lockfile ni reglas. Advirtió que futuras versiones de Firebase CLI requerirán Java 21; la ejecución actual con las herramientas existentes terminó correctamente.

Controles no realizados ahora: persistencia y UI en teléfono, lector de pantalla/iOS, credenciales reales, llamadas reales a TMDB/Auth/Firestore, auditoría nueva de dependencias, comprobación de las reglas desplegadas y generación de bundles. No son controles automáticos fallidos: están fuera de esta ejecución sin credenciales. Las pruebas presentes son node:test, no Vitest; no se instaló el sensor futuro del Hito 1.

### Resumen para revisión de la estudiante

- No se observó ni reprodujo un defecto funcional de gravedad alta en el alcance RF1–RF10 revisado. Esto no equivale a cobertura exhaustiva.
- Tabla H01–H10: 6 hallazgos de gravedad media y 4 de gravedad baja. Entre los medios hay dos problemas observados de instrucciones/proceso y cuatro riesgos pendientes; los bajos son tres riesgos y un texto desactualizado observado.
- Propuestas «corregir ahora»: H01 (instrucciones), H02 (harness de este hito) y H10 (texto de Acerca de), siempre después de revisión y en tareas autorizadas. En esta auditoría no se aplican.
- Riesgos conocidos: H03–H09. La validación estricta y las protecciones de cuenta/caché se conservan; las pruebas históricas no se amplían a recorridos nunca realizados.
- A02–A04 quedan como contexto futuro fuera de alcance, no como incumplimientos obligatorios de la app existente.
- Único documento editado deliberadamente en esta tarea: docs/AUDITORIA.md. Sin lectura de .env, cambios de código, reglas, dependencias o AGENTS.md; sin commits, ramas nuevas ni push. El borrador permanece sin seguimiento, pendiente de revisión.

## Auditoría de cierre

Pendiente del Hito 4. No se declara finalizada la épica.
