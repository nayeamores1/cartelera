# Harness del Hito 1

## Preparación autorizada del commit del Hito 1

En epica-mi-anio se comprobó que la raíz Git es la carpeta mi-cartelera-personal, que el índice estaba vacío y que no había core.hooksPath previo. Se activó localmente con `git config --local core.hooksPath .githooks`; la lectura posterior confirmó `.githooks`, sin cambiar el repositorio padre.

Se revisaron los 17 archivos del harness, sin leer .env: instrucciones y skills, configuración/adaptadores de hooks, herramienta de formato y prueba temporal, documentación, sensor Vitest, configuración y manifiestos. No se detectaron patrones de credenciales. CLAUDE.md conserva exactamente `@AGENTS.md` y un salto de línea. Solo se aplicó formato a candidatos del harness, sin cambiar archivos de la app ni reglas; se mantuvo el esquema y la auditoría fe70372.

Controles repetidos antes del commit: npm test código 0 (23/23 node:test y 5/5 Vitest), npx --no-install tsc --noEmit código 0 y npm run lint código 0. El commit autorizado es `chore: preparar el harness del proyecto`, exclusivamente con estos archivos. Se comprobará la ejecución real de pre-commit mediante la traza de Git; no se utilizará --no-verify. Los resultados negativos del hook de Codex se conservan y no se presentan como resueltos por el hook de Git. No se autoriza ni realiza push.

## Especificación del control Git pre-commit

Se conserva el resultado de las dos pruebas reales principales del hook de Codex: no hubo activación automática (la repetición adicional también quedó negativa). La alternativa solicitada es un hook de Git que opera al hacer commit, no después de editar. Esta especificación precede a su implementación.

El hook versionable reside en .githooks/pre-commit y ejecuta .githooks/check-staged.cjs con el Prettier local. Lee exclusivamente los blobs del índice de archivos agregados/modificados/renombrados que tengan parser y no estén excluidos. No usa --write, no modifica el árbol de trabajo y no ejecuta git add. Los eliminados, binarios o rutas ignoradas por el control de formato no se procesan. .env y variantes con configuración sensible se rechazan por nombre antes de leer el blob; .env.example se omite del formato como plantilla sin parser. CLAUDE.md conserva su excepción literal de entrega.

Un archivo mal formateado o un error de parser/herramienta bloquea el commit con código distinto de cero y muestra pasos para formatear manualmente, revisar y volver a preparar el archivo. No imprime contenidos. Se valida con commits reales exclusivamente en un repositorio temporal: rechazo del índice mal formateado y aceptación del índice corregido, incluso con contenido distinto en el working tree. Se comprueba ausencia de cambios automáticos del archivo y del contenido preparado.

No se instala ni activa en la rama durante esta preparación: la activación local se documenta para revisión de la estudiante. No se hace commit ni push en epica-mi-anio.

## Alcance y especificación previa

Fecha: 25 de noviembre de 2026. Base documental: docs/AUDITORIA.md, commit fe70372, hallazgos H01 y H02. La preparación inicial incluía instrucciones, commit y formato manual. La ampliación autorizada de esta sesión añade Vitest y el sensor del Hito 1, más configuración de hook pendiente de activación comprobada; no implementa la épica ni cambia pantallas, reglas o credenciales.

AGENTS.md describe React Navigation y las capas actuales. Antes de implementar cada cambio debe existir su documentación/spec; la revisión humana precede al commit. npm test y npx tsc --noEmit deben pasar antes de commits de código. DESIGN.md se leerá antes de tocar interfaz una vez exista en Hito 2; no se crea todavía.

## Criterios de aceptación

### Ampliación autorizada: sensor y hook del Hito 1

Vitest es ahora un requisito explícito del Hito 1 y se autoriza su instalación como devDependency, fijada a 4.1.12. Sus engines publicados en npm admiten Node >=24; el proyecto requiere >=24.12.0. No se incorpora al runtime móvil. Antes de implementarlo se define este sensor: validarEdicion debe rechazar calificaciones en por_ver/viendo; normalizarEdicion debe limpiarlas, y Vista debe aceptar una calificación válida. Se importan las funciones reales de src/utils/lista.ts, sin copiar sus condiciones ni simularlas. También se conserva null como caso válido fuera de Vista.

npm test ejecutará primero las 23 pruebas node:test existentes y después Vitest en modo run. La configuración Vitest incluirá solo tests TypeScript del sensor, entorno Node y envDir:false para no cargar .env. No se ejecutarán pruebas de reglas como parte del comando unitario.

Se preparará .codex/hooks.json con PostToolUse para apply_patch/Edit/Write, un adaptador que extrae rutas del evento y reutiliza scripts/format-edited.cjs. Solo rutas explícitas, sin shell para ejecutar el formateador. No se configura ni modifica la confianza global del cliente. La prueba real consiste en editar un archivo temporal sin formato mediante apply_patch, sin ejecutar format:files ni el adaptador manualmente entre la edición y la inspección. Que permanezca sin formato se registra como activación no comprobada, no como hook aprobado. Los ensayos directos del adaptador se registran por separado.

La documentación oficial de hooks requiere revisar/confiar las definiciones no administradas; esta sesión no ofrece una API de confianza de hooks. No se usa dangerously-bypass-hook-trust ni se abre otro agente para eludir la revisión.

- CLAUDE.md contiene exactamente @AGENTS.md y un salto de línea.
- La skill de entrega reside en .claude/skills/commit/SKILL.md; exige revisión, prefijos en español, índice explícito, ausencia de credenciales y verificaciones antes de commits de código.
- El adaptador .agents/skills/commit/SKILL.md remite al procedimiento compartido para clientes Codex que descubran skills de proyecto. No se presupone que aparezca en esta sesión ni que exista el comando /commit en Codex.
- El formateador manual usa solo Prettier local y rutas explícitas, sin recorrer el proyecto. Rechaza .env y variantes antes de leerlas, archivos fuera de la app, enlaces redirigidos, artefactos y claves privadas. No imprime contenido ni descarga paquetes.
- Se comprueba formato efectivo, idempotencia, rechazo de rutas no permitidas y manejo de errores en archivos temporales sin secretos. Se conservan todas las pruebas existentes.

## Qué es compartido y qué es específico

| Pieza                              | Uso y límite                                                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AGENTS.md, specs y pruebas         | Reglas y evidencia reutilizables. Codex recibió la instrucción de leerlas; la carga en otra sesión debe comprobarse allí.                                               |
| CLAUDE.md y .claude/skills/commit/ | Entregables específicos de Claude. No se han ejecutado /commit, /hooks ni /context en Claude.                                                                           |
| .agents/skills/commit/             | Adaptador para descubrimiento de skill de proyecto en Codex; invocable por nombre o ruta cuando el cliente lo admita. No es un alias /commit verificado en esta sesión. |
| scripts/format-edited.cjs          | Alternativa manual ejecutable desde cualquier agente/terminal con Node y dependencias locales. No es un hook automático.                                                |

La preparación inicial no incluía configuración de hooks. Ahora existe .codex/hooks.json, pero su activación automática no se ha comprobado: la edición real de prueba permaneció sin formato. No se modificó confianza/configuración global ni se configura un hook de Claude no probado. Si el docente exige su ejecución en Claude, debe acordarse y comprobarse en ese cliente; la alternativa manual no equivale a automatización.

## Instalación y comando de formato

Se detectó inicialmente ausencia de Prettier y se explicó su necesidad antes de instalarlo. El intento interrumpido dejó Prettier 3.10.1 como devDependency exacta en package.json y lockfile. En esta ampliación se añade únicamente Vitest 4.1.12 y sus transitivas de herramientas. Requiere Node >=24.12.0 para el proyecto.

```powershell
npm ci
npm run format:files -- AGENTS.md docs/HARNESS.md
npm run format:files -- ruta/al/archivo-editado.ts
```

Ejecutar después de cada archivo editado y antes de revisar el diff. No usar un glob global ni prettier . --write: se conservará el formato del código no editado. CLAUDE.md es la excepción de entrega: su línea literal se conserva sin reformatearla como prosa. Binarios o archivos sin parser se omiten explícitamente; eso no acredita una comprobación de su contenido. El formateador no sustituye TypeScript, lint o tests.

Para Codex sin descubrimiento automático, pedir: «Lee .claude/skills/commit/SKILL.md y aplica su procedimiento al commit que te autorice». Esto es una instrucción reproducible; no crea commits por sí sola ni acredita carga automática. En una sesión nueva, comprobar si la skill de .agents aparece entre las disponibles antes de afirmar su registro.

## Fuentes consultadas

- Skills Codex: https://learn.chatgpt.com/docs/build-skills
- Configuración Codex: https://learn.chatgpt.com/docs/config-file/config-reference
- Skills Claude: https://code.claude.com/docs/en/skills
- Hooks Claude: https://code.claude.com/docs/en/hooks
- Prettier local y versiones fijadas: https://prettier.io/docs/install

## Resultados históricos de la preparación inicial

- TypeScript y ESLint existentes: código 0. Suite existente node:test: 23/23 aprobadas. No se repitieron reglas, bundles ni pruebas móviles; no hubo acceso a producción ni lectura de .env.
- Formateador manual: 12 comprobaciones locales aprobadas con Node 24.22.1 y archivos temporales sin secretos, eliminados al terminar. Incluyen formato efectivo de JavaScript, idempotencia, rechazo de .env/variantes y rutas externas/artefactos, conservación de CLAUDE.md, fallo controlado ante sintaxis inválida y ausencia de argumentos, y frontmatter básico de ambas skills.
- El lint adicional del script detectó inicialmente __dirname no declarado en la configuración ESLint existente. Se corrigió obteniendo la raíz desde require.main.filename, sin desactivar la regla. Formato, comprobación de sintaxis de Node y lint del script volvieron a ejecutarse después de la corrección: código 0.
- El validador quick_validate.py de skill-creator no pudo ejecutarse: falta PyYAML en el Python disponible (ModuleNotFoundError: yaml). No se instala otra dependencia para ese control. La primera alternativa require('yaml') tampoco estaba disponible; la validación final con js-yaml, ya instalado, aprobó el frontmatter de ambas skills. Esta validación no prueba descubrimiento automático ni ejecución de la skill.
- La instalación anterior terminó con código 0 y añadió solo Prettier 3.10.1. Su proceso npm utilizó Node 22.12.0 y emitió avisos EBADENGINE, aunque el lanzador usaba Node 24; las verificaciones posteriores usan explícitamente Node 24.22.1. npm reportó 19 vulnerabilidades (12 moderadas, 7 altas); no se aplicó audit fix ni se investigó su impacto en esta tarea.
- CLAUDE.md comprobado byte a byte: exactamente @AGENTS.md seguido de salto de línea. No hay hooks automáticos instalados o verificados ni ejecución de /commit en ninguna herramienta. Quedan pendientes descubrimiento en sesión nueva, revisión humana y, si se exige, prueba de hook en el cliente acordado. Vitest y el sensor de una regla del Proyecto 3 siguen pendientes del siguiente paso.
- Solo se prepararon instrucciones, documentación y herramienta de formato; código de app, reglas y tests existentes intactos. No hay commits ni push en esta tarea.

## Resultados actuales de la ampliación del Hito 1

### Sensor Vitest e instalación

- Dependencia directa nueva: vitest 4.1.12, solo desarrollo. Su instalación la exige el Hito 1, no una funcionalidad de la épica. Se consultaron https://vitest.dev/guide/ y los engines de la versión en npm: admiten Node >=24. El ejecutable usado para verificaciones fue Node 24.22.1.
- Primer intento mediante expo install con EXPO_NO_DOTENV=1: código 1, error interno npm «Cannot read properties of null (reading 'edgesOut')». Segundo intento directo con npm bajo Node 24: mismo error. Tercero con --legacy-peer-deps --ignore-scripts --no-audit --no-fund: código 0, 35 paquetes añadidos y 1 cambiado en node_modules; aviso EPERM al limpiar una carpeta de una dependencia opcional. No se desactivaron sensores ni se modificaron paquetes runtime directos.
- Comparación de lockfile contra HEAD: no se eliminaron entradas preexistentes. Además de Prettier/Vitest y sus nuevas transitivas, se actualizaron dos resoluciones preexistentes de herramientas: @napi-rs/wasm-runtime 1.1.6→1.2.6 y postcss 8.5.31→8.5.33. Se conservaron versiones directas Expo, React Native y Firebase. Si npm reproduce el fallo de peers al reinstalar, usar `npm ci --legacy-peer-deps` con Node compatible; no aplicar audit fix como solución al error de instalación.
- tests/calificacion.test.ts importa validarEdicion y normalizarEdicion reales: por_ver/viendo rechazan una calificación y la normalización la limpia; ambos admiten null; vista admite y conserva 4 estrellas. Cinco casos pasan sin mocks ni lógica duplicada. No se descubrió un defecto: no se modifica docs/AUDITORIA.md ni código de la app.
- vitest.config.mts fija environment:node, envDir:false e include tests/**/_.test.ts. node:test conserva tests/_.test.cjs. Ambas suites se ejecutan secuencialmente con &&: un fallo termina npm test con error, sin ocultarlo ni tratar las pruebas del emulador como unitarias.

| Control ejecutado ahora                                                          | Resultado                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| npm test                                                                         | Código 0: node:test 23/23; Vitest 5/5, 1 archivo aprobado.                                                                                                                                                                     |
| npx --no-install tsc --noEmit                                                    | Código 0, sin diagnósticos. Equivalente local de npx tsc --noEmit sin descargar herramientas.                                                                                                                                  |
| npm run lint                                                                     | Código 0, sin errores ni avisos sobre src/tests/App/index. Incluye el nuevo sensor TypeScript.                                                                                                                                 |
| Lint adicional de scripts/format-edited.cjs y .codex/hooks/format-after-edit.cjs | Sin errores. Al incluir además vitest.config.mts, ESLint emitió un aviso de archivo sin configuración coincidente; ese archivo sí fue comprobado por TypeScript y ejecutado por Vitest. No se afirma cobertura ESLint de .mts. |
| CLAUDE.md                                                                        | Comparación exacta correcta: @AGENTS.md seguido de un salto de línea, sin líneas adicionales.                                                                                                                                  |
| git diff --check                                                                 | Código 0. Sin cambios en src/, firestore.rules o docs/AUDITORIA.md.                                                                                                                                                            |

Se invocaron npm/npx mediante sus entrypoints locales con Node 24.22.1 y PATH compatible. Las pruebas no leen .env ni acceden a producción. No se repitieron emulador, bundles ni pruebas humanas.

### Hook de Codex: configuración, prueba directa y prueba real

Cliente observado: codex-cli 0.171.0-alpha.13.2. .codex/hooks.json registra PostToolUse para apply_patch/Edit/Write; el comando se resuelve desde la raíz de la app y ejecuta .codex/hooks/format-after-edit.cjs. Iniciar Codex desde esa raíz. El adaptador extrae rutas explícitas del evento y llama a scripts/format-edited.cjs usando spawnSync sin shell, con límite de tiempo. No interpreta comandos arbitrarios del evento ni imprime su contenido; CLAUDE.md conserva su excepción literal.

**Prueba de activación real:** se creó .codex/format-probe.js mediante apply_patch con `const pruebaHook={valor:"sin formato"}`. Se leyó inmediatamente después, sin ejecutar el formateador ni el adaptador: conservaba el texto sin formato. El archivo temporal se eliminó. Resultado: no hay evidencia de activación automática; no se atribuye una causa exacta no comprobada. La confianza o carga de configuración en la sesión son puntos a revisar.

**Prueba directa separada:** un evento PostToolUse sintético se envió por stdin al adaptador con un archivo temporal. El archivo quedó formateado, la salida fue JSON estructurado y un evento dirigido a .env fue rechazado antes de leerlo. Código 0 de las aserciones de prueba; el caso rechazado tuvo código 1 esperado. Los temporales se eliminaron. Esto demuestra el script, no el disparo del hook por Codex.

La documentación oficial https://learn.chatgpt.com/docs/hooks indica que las definiciones no administradas deben revisarse y confiarse antes de ejecutar. No se modificó la confianza, no se usó --dangerously-bypass-hook-trust ni se afirmó que el hook estuviera activo. Para completar la comprobación en el cliente: abrir Codex desde la raíz de esta app, inspeccionar/revisar .codex/hooks.json en /hooks cuando ese cliente lo ofrezca, confiar la definición revisada y pedir una edición de un archivo temporal JavaScript mal formateado. Verificar que Prettier lo cambie sin comando manual y registrar el resultado. No se afirma haber ejecutado /hooks en esta sesión.

### Estado de los entregables del Hito 1

- Auditoría inicial: conservada en fe70372; instrucciones React Navigation y privacidad preparadas.
- CLAUDE.md, skill de entrega y adaptador Codex: conservados. La ejecución de /commit en Claude y el descubrimiento automático en una sesión nueva no se dan por probados. No se hace un commit de ensayo sin autorización.
- Vitest y primer sensor de una regla existente: completos, en verde; también pasan las pruebas previas y TypeScript/lint.
- Hook automático: configuración y adaptador preparados; prueba directa en verde, activación real pendiente. El Hito 1 no se presenta como cerrado sin reservas mientras esa verificación requerida falte. Mientras tanto se mantiene `npm run format:files -- <rutas>` como alternativa manual.
- Pendiente revisión humana de los cambios y autorización posterior de commits, conservando documentación antes de implementación en el historial. No hay commits ni push en esta tarea; no se empieza Hito 2 ni la épica.

## Verificación final del harness — 25 de noviembre de 2026

### Repetición solicitada de la prueba automática

En epica-mi-anio se creó `.codex/hook-repeat-probe.js` mediante una llamada real a apply_patch con `const pruebaRepetida={mensaje:"verificar hook"}`. La lectura posterior encontró exactamente esa línea sin formato. La comparación con `const pruebaRepetida = { mensaje: 'verificar hook' };` seguida de salto de línea devolvió `formateadoAutomaticamente: false`.

No se ejecutaron format:files, scripts/format-edited.cjs ni el adaptador manualmente. Se eliminó el temporal mediante apply_patch y se comprobó su ausencia. Resultado: la activación automática continúa sin verificarse; no se deduce la causa ni se afirma haber revisado o cambiado la confianza del cliente. No hubo commits ni push. Esta repetición no vuelve a ejecutar las suites de pruebas.

## Alternativa Git pre-commit: activación y resultado

Esta alternativa está preparada para versionarse, pero no se crea un commit ni se cambia core.hooksPath en la app en esta tarea. No reemplaza ni convierte en exitosas las dos pruebas negativas del hook de Codex: actúa al intentar un commit de Git, no al editar.

Archivos nuevos: `.githooks/pre-commit` (entrada Git con shell), `.githooks/check-staged.cjs` (control de blobs del índice), `.githooks/.gitattributes` (conserva LF en la entrada del hook) y `scripts/verify-precommit.cjs` (prueba reproducible en repositorio temporal).

### Activar en este repositorio después de revisar

Desde la raíz de mi-cartelera-personal, con Git y Node >=24.12.0 disponibles y dependencias locales instaladas:

```powershell
git config --local --get core.hooksPath
```

Si ya existe un valor distinto, no reemplazarlo sin revisar sus hooks e integrar los controles. En esta revisión no había un valor local configurado. Tras revisar el código:

```powershell
git config --local core.hooksPath .githooks
git config --local --get core.hooksPath
```

El último comando debe mostrar `.githooks`. La configuración es local a este repositorio; cada clon debe activarla. No se activa en el repositorio padre ni se instala globalmente. En Linux/macOS, dar permiso de ejecución antes de usarlo: `chmod +x .githooks/pre-commit`. Cuando se autorice versionar estos archivos, conservar el bit ejecutable de ese archivo (modo Git 100755); en Git para Windows puede prepararse explícitamente entonces con `git update-index --chmod=+x .githooks/pre-commit` después de agregarlo. No se ejecutó ese comando de staging en esta tarea. `.githooks/.gitattributes` conserva los saltos LF también en Windows.

No instalar un comando prepare que cambie automáticamente la configuración de otros clones. El control requiere el Prettier local; si no puede cargarlo, bloquea el commit con error. No descarga herramientas al hacer commit. Es un control local: no garantiza ejecución si se deshabilita el hook o se usa --no-verify; las instrucciones del proyecto prohíben saltarse sensores.

### Funcionamiento y corrección de un bloqueo

El hook enumera únicamente rutas agregadas/modificadas del índice mediante `git diff --cached --name-only --no-renames --diff-filter=ACM -z` (un renombrado se trata como borrado y alta). Para archivos con parser compatible y no excluidos, obtiene el blob preparado con `git cat-file blob :ruta` y aplica prettier.check en memoria, con las mismas opciones del formateador manual. No inspecciona contenido no preparado ni usa el archivo de trabajo como fuente; los nombres con espacios se pasan como argumentos, sin shell. .env y claves privadas se bloquean por nombre antes de leer el blob. .env.example se omite como plantilla; CLAUDE.md mantiene la excepción literal.

Ante un error de formato, sintaxis o herramienta, el hook termina con código no cero y Git no crea el commit. Muestra nombres y pasos, no contenido. Para corregir manualmente:

```powershell
npm run format:files -- ruta/al/archivo.ts
git diff -- ruta/al/archivo.ts
git add -- ruta/al/archivo.ts
git diff --cached -- ruta/al/archivo.ts
```

Revisar el resultado y repetir el commit autorizado. En staging parcial, no preparar accidentalmente cambios no deseados: volver a seleccionar los fragmentos pertinentes. El hook nunca formatea con --write, nunca ejecuta git add y no modifica el índice ni el working tree por sí mismo. Si una ruta sensible se preparó por error, retirarla del índice sin borrar su copia local; no abrirla ni pegar sus valores.

### Prueba real y comprobaciones actuales

Comando reproducible: `node scripts/verify-precommit.cjs`. Crea un repositorio independiente en la carpeta temporal del sistema, configura allí identidad de prueba y core.hooksPath apuntando a estos hooks, y elimina todo el repositorio al terminar. Solo allí crea un commit de prueba; no lo hace en epica-mi-anio.

- Primer intento en sandbox: Git Bash no pudo arrancar (`NtCreateDirectoryObject`, acceso denegado 0xC0000022). La prueba falló antes de ejecutar el hook; el temporal se eliminó. No se cuenta como rechazo de formato comprobado.
- Reintento fuera del sandbox: código 0 de la verificación completa. Git rechazó el commit con blob preparado mal formateado, aunque el working tree estaba corregido. Se comprobó que no existía HEAD y que el blob preparado y el archivo de trabajo seguían intactos.
- Después de preparar el contenido corregido, Git aceptó el commit temporal, incluso con el working tree nuevamente sin formato. Se comprobó que el commit y el índice contenían la versión correcta y que el working tree no se había alterado. Un archivo adicional sin formato y sin preparar no se incluyó ni bloqueó el commit. El nombre preparado tenía espacios.
- Repositorio temporal eliminado al terminar: comprobado. Esto sí es una ejecución real de un hook Git durante git commit, no una llamada directa al verificador de formato. No demuestra activación del hook de Codex después de editar.
- `npm test`: código 0, 23/23 pruebas existentes y 5/5 Vitest. `npx --no-install tsc --noEmit`: código 0. Se usó Node 24.22.1 y los entrypoints npm/npx instalados, con carga dotenv desactivada. Sin pruebas nuevas en teléfono ni producción.
- `npm run lint`: código 0. Lint adicional del hook y del script de prueba: código 0. No se cambian dependencias ni código de app, reglas o auditoría en esta tarea. HEAD permanece en fe70372, el índice de la rama sigue vacío y core.hooksPath no se modificó en la app.

- Rama comprobada: epica-mi-anio. CLAUDE.md sigue conteniendo exactamente una línea: `@AGENTS.md` seguida de salto de línea. No requirió corrección.
- Se revisaron .codex/hooks.json, .codex/hooks/format-after-edit.cjs y scripts/format-edited.cjs. PostToolUse, matcher `^(apply_patch|Edit|Write)$`, comando Windows/general `node .codex/hooks/format-after-edit.cjs`, timeout 30 segundos. Iniciar el cliente desde la raíz de esta app para resolver el comando relativo.
- El adaptador extrae file_path o rutas Add File/Update File/Move to del patch; llama al formateador por ruta con spawnSync sin shell ni globs. El formateador valida pertenencia a la raíz y enlaces, excluye .env y variantes, artefactos y claves privadas antes de leerlos, y mantiene la excepción literal de CLAUDE.md. No se interpreta un comando arbitrario del evento como shell. Sigue siendo una cobertura por herramientas registradas, no un observador de cualquier edición externa o Bash.
- Antes de la prueba se mostró a la estudiante el comando, evento y alcance, y el paso reproducible de confianza: terminal en la raíz de la app → `codex` → `/hooks` → revisar la definición de .codex/hooks.json → confiar/habilitar si está pendiente. Es la vía CLI documentada en https://learn.chatgpt.com/docs/hooks; no se afirma una ubicación de controles en el cliente de escritorio ni que la estudiante completara este paso.
- Prueba real nueva: se creó .codex/format-final-probe.js con apply_patch y contenido `const verificacionFinal={mensaje:"prueba temporal"}`. El primer comando de inspección falló por comillas de PowerShell, sin inspeccionar ni formatear el archivo; se retiró el temporal y se repitió su creación mediante apply_patch. La inspección corregida encontró el texto sin reformatear; comparación con el resultado esperado de Prettier: false. Entre edición e inspección no se ejecutaron format:files, el formateador directo ni el adaptador. Se retiró el archivo temporal al terminar.
- Resultado observado: el hook no se activó en esta prueba. No se ha inspeccionado ni alterado el registro de confianza; no se puede atribuir el resultado exclusivamente a falta de confianza. Faltan revisar confianza/habilitación y carga de proyecto en el cliente y repetir una edición real después. La prueba directa anterior aprobada solo demuestra el script y no se convierte en evidencia de activación automática.
- Esta verificación final no repite npm test, TypeScript o lint: los resultados de la sección anterior pertenecen a la ejecución previa. No se detectó ni modificó un defecto de código de app o reglas. Solo se actualizó este documento; el temporal se eliminó. No se leyó .env, no se implementó la épica y no se hicieron commits ni push. El harness no se declara listo para cerrar el requisito automático hasta obtener evidencia real de activación; mensaje de commit previsto, sin ejecutarlo: `chore: preparar el harness del proyecto`.
