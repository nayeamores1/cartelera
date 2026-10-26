# Bitácora de uso de IA

Se utilizaron ChatGPT y Codex como apoyo. ChatGPT ayudó a definir la propuesta visual, organizar las etapas, redactar prompts e interpretar resultados. Codex implementó el código, preparó documentación y ejecutó las comprobaciones locales registradas. La estudiante configuró Firebase y TMDB, realizó las pruebas manuales en Expo Go y Firebase Console y revisó los resultados.

Periodo de la bitácora: del 22 al 25 de octubre de 2026. La cronología se organiza retrospectivamente por etapas; esta distribución no acredita fechas exactas de ejecución de las comprobaciones, cuyos resultados y fuentes se conservan sin cambios.

## Estado vigente de las pruebas — actualización documental del 25 de octubre de 2026

Última comprobación local: tras corregir las coerciones de validación de Mi lista, TypeScript y ESLint pasan; 23 pruebas unitarias y 5 grupos de reglas/transacciones en emulador pasan. Son ejecuciones locales nuevas, descritas al final; no añaden confirmaciones manuales en dispositivo.

Las entradas siguientes registran lo que ocurrió en cada etapa. Sus frases «pendiente», «sin publicar» o «no probado en dispositivo» describen ese momento y no sustituyen este estado actualizado:

- **Codex, local:** TypeScript/ESLint aprobados; 20 pruebas unitarias y 5 grupos de reglas/transacciones aprobados en las ejecuciones históricas documentadas; servicio TMDB verificado con HTTP 200 y bundles Android locales generados. Mocks/emulador no equivalen a dispositivo ni producción.
- **Usuaria, manual:** confirmó en Expo Go registro, login, logout, errores y persistencia al cerrar/reabrir; búsquedas de películas/series, detalle, paginación, sin resultados y red con reintento; alta/estado inicial/documento Firestore real, detalle que ofrece editar sin duplicar, edición de estado/calificación/comentario persistente tras reinicio, estrellas deshabilitadas/limpiadas fuera de Vista, filtros, cancelar y confirmar eliminación con regreso corregido a Mi lista, caché en modo avión tras reinicio, bloqueo/reconexión y separación de dos cuentas.
- **Usuaria, Firebase/producción:** confirmó publicación manual de reglas, get y delete denegados con UID ajeno en el simulador de producción, y capturas revisadas de dos usuarios, tres documentos y ambas denegaciones. Fuente: su comunicación en esta conversación; no se inventan archivos ni se afirma una nueva inspección de capturas por Codex.
- **Pendientes manuales adicionales:** concurrencia entre dispositivos, escrituras inciertas y respuestas tardías entre cuentas en dispositivo, límite de 501 caracteres, lector de pantalla e iOS, además de variantes identificadas en las tres matrices PRUEBAS_*.md. Algunos tienen pruebas locales, lo que no los convierte en recorridos manuales confirmados.

No se conocen fechas individuales ni plataforma móvil exacta de cada ensayo a partir de esta confirmación. La fecha indicada es la de actualización de los documentos.

## Etapa 1 — propuesta, documentación y base visual (22 de octubre de 2026)

1. Inspección de carpeta, package.json raíz, .gitignore, estado Git y búsqueda de AGENTS.md. La raíz contiene múltiples proyectos y cambios ajenos; no se reemplazaron. No había una app identificable con este nombre. Se creó mi-cartelera-personal como subcarpeta.
2. Se intentó create-expo-app desde el entorno restringido; falló por DNS. Con acceso autorizado se descargó la plantilla oficial blank-typescript sin instalar inicialmente. Se leyó el AGENTS.md generado. La instrucción de Router se sustituyó por el requisito explícito de React Navigation del usuario.
3. Se crearon README.md y docs/ESPECIFICACION.md antes del código de pantallas y servicios, con RF1–RF10, arquitectura, Firestore, UX, caché y criterios verificables.
4. Instalación de plantilla y dependencias solicitadas. React Navigation, screens, safe area, AsyncStorage y Firebase mediante expo install. ESLint y configuración Expo como herramientas de desarrollo para cumplir la verificación de AGENTS.md. Sin Router, UI kits, axios ni gestor global adicional.
5. Se implementaron bienvenida, login, registro, Explorar, Mi lista, Acerca de, Detalle y Editar; native stack + bottom tabs tipados, tema oscuro, safe areas, scroll y ajuste del teclado. No se ingresaron credenciales ni se enviaron operaciones a Firebase/TMDB. Los formularios remotos permanecen deshabilitados. Los filtros solo cambian su selección visual.
6. Context contiene usuario null, lista vacía, conexión sin comprobar y acciones pendientes que rechazan explícitamente. Los servicios son contratos tipados, no implementaciones completas. Config Firebase prepara inicialización bajo demanda con persistencia Auth en AsyncStorage; Firestore y caché de lista aún no integrados.
7. El primer typecheck detectó un problema real en los tipos públicos de Firebase: falta getReactNativePersistence. Se comprobó su exportación y firma en el paquete React Native instalado; se añadió ampliación de declaración sin any ni supresiones. No se cambiaron archivos de node_modules.
8. La página del kit TMDB rechazó acceso automatizado. La documentación oficial FAQ expone el SVG de su marca; se descargó y rasterizó con Sharp del runtime disponible. Un PNG inicialmente identificado era el icono de ReadMe, se descartó sustituyéndolo antes de entregar. Se revisó visualmente el PNG correcto. Fuente y transformación en assets/TMDB-ATRIBUCION.md.

## Verificación real

| Comando | Resultado |
| --- | --- |
| `npm install` | Instalación completada; Node 22.12 del sistema produjo advertencias de engines. |
| `npx expo install (dependencias requeridas y lint)` | Completado; versiones en package-lock.json. |
| `npm run typecheck` | Primer intento falló por declaración Firebase; tras corrección pasó. |
| `npm run lint` | Pasó, sin errores ni avisos. |
| `npx expo install --check` | Primera ejecución offline advirtió fiabilidad limitada; repetido con red: Dependencies are up to date, código 0. |
| `npx expo export --platform android --output-dir dist` | Primer intento falló por permiso de escritura de Hermes en temporal del sandbox; repetido con acceso autorizado: bundle de 886 módulos, código 0. No es publicación ni prueba en dispositivo. |
| `npm audit --omit=dev --json` | Código 1: 9 vulnerabilidades altas; informe real en docs/audit-produccion.json. |
| `npm install --package-lock-only --offline --ignore-scripts` | Completado para alinear metadatos engines del lock; su salida offline indicó 0 vulnerabilidades, lo cual NO invalida la auditoría con red. |
| `git check-ignore .env .env.local .env.example dist/test node_modules/test` | .env, .env.local, dist y node_modules ignorados; .env.example permitido. |

Tras el último ajuste se ejecutaron directamente con Node 24.22.1 `node node_modules/typescript/bin/tsc --noEmit` y `node node_modules/eslint/bin/eslint.js src App.tsx index.ts`: ambos pasaron (código 0).

La auditoría incluye cadenas de Expo/CLI (node-forge, zod) y Firebase/Firestore (@grpc/grpc-js), además de paquetes que heredan esos avisos. npm propone algunas degradaciones principales, por lo que no se ejecutó audit fix --force. Queda pendiente evaluar versiones corregidas compatibles antes de distribución. No se afirma que la app esté libre de vulnerabilidades.

## Límites y revisión humana pendiente

- Actualizar el Node del sistema a una versión compatible (se declara >=24.12; se utilizó runtime 24.22.1 para verificación final).
- Ejecutar Expo Go compatible con SDK 58 y comprobar visualmente Android/iOS, accesibilidad, teclado y safe areas. No se dispone de evidencia de ejecución móvil en esta entrega.
- Configurar manualmente Firebase y TMDB, revisar reglas de seguridad en emuladores e implementar RF1–RF9 funcionales en etapas posteriores.
- Revisar el código y adaptar esta declaración a las normas del docente. No se inventaron credenciales ni resultados de pruebas.
- No se hicieron commits, push, despliegues, publicación de servicios ni envíos a terceros.

## Etapa 2 — autenticación (23 de octubre de 2026)

### Alcance realizado

- Se revisaron README, especificación, AGENTS.md y versiones instaladas: Expo 58.0.19, Firebase 13.1.0 con @firebase/auth 1.13.8, AsyncStorage 2.2.0, React Navigation 7 y TypeScript 6. No se instalaron dependencias ni se cambiaron versiones.
- Se consultaron documentación oficial de Expo/Firebase/React Navigation y exports/tipos de los paquetes. Se inspeccionaron otras versiones oficiales dentro de .expo (ignorado), sin instalarlas. Expo documenta Firebase >=12; no se degradaron paquetes para eludir el problema de tipos.
- Se detectó que Firebase 13.1.0 omite getReactNativePersistence en sus tipos generales. Se preguntó expresamente al usuario por la selección de la declaración React Native oficial y respondió: «Sí, usar la declaración oficial».
- Se eliminó src/types/firebase-auth.d.ts. El mapeo de tsconfig selecciona la declaración RN que publica Firebase, sin añadir/modificar tipos ni usar any/ts-ignore. La excepción autorizada solo afecta resolución de tipos. experiments.tsconfigPaths=false evita que Metro ejecute un archivo .d.ts: los imports runtime son los públicos firebase/app y firebase/auth. No se editaron paquetes ni se introdujeron imports internos en la aplicación.
- Se implementó inicialización única bajo demanda de Firebase/Auth y recuperación de instancia tras Fast Refresh, con persistencia administrada por el SDK sobre AsyncStorage. No se inicializa Firestore. TMDB no interviene ni se requiere su token.
- authService centraliza registro, login, logout, observación/cancelación y traducción segura de errores. Usuario público limitado a uid/email. Errores desconocidos no muestran el mensaje original ni credenciales.
- Context observa sesión, espera el resultado inicial, cancela observación al desmontar y bloquea solicitudes Auth concurrentes. Lista y acciones CRUD siguen pendientes.
- Navegación condicional con grupo por usuario: sin sesión Login/Registro; con sesión Buscar/Mi lista/Acerca de y estructuras previas de Detalle/Editar. No existe acceso a pestañas mediante la vista previa sin sesión.
- Formularios controlados con validación local, confirmación en registro, mostrar/ocultar contraseña, indicador, bloqueo de envíos repetidos, errores accesibles y manejo de teclado. Se conserva la contraseña exactamente como la escribió el usuario y solo se recorta el correo. Contraseñas viven únicamente en estado de pantalla; no se guardan manualmente tokens ni contraseñas.
- Acerca de muestra el correo de la sesión y cierre real. Se actualizó el texto de Mi lista para indicar que la sesión está activa y que la lista está pendiente, sin implementar operaciones.
- README y especificación actualizados; recorrido manual pendiente en docs/PRUEBAS_AUTH.md.

### Verificación y resultados reales

- TypeScript ejecutado con Node 24.22.1: `node node_modules/typescript/bin/tsc --noEmit`, código 0. El primer intento detectó el cambio de tipos de ref de TextInput en React Native 0.88; se corrigió usando ComponentRef<typeof TextInput>, sin parches ni supresiones.
- ESLint ejecutado con Node 24.22.1: `node node_modules/eslint/bin/eslint.js src tests App.tsx index.ts`, código 0.
- Pruebas: `node --test tests/auth.test.cjs`, 6 aprobadas, 0 fallidas. Son pruebas unitarias con SDK simulado, no pruebas de Firebase real ni de dispositivo. Cubren inicialización/persistencia configurada y recuperación tras recarga del módulo, independencia de TMDB, validación, traducción segura, proyección de usuario, cancelación de observador y logout. Durante la ampliación se detectó y corrigió un problema en el mock de default export y en la declaración del global Node __dirname para ESLint; después pasó toda la suite.
- Bundle: `node node_modules/expo/bin/cli export --platform android --output-dir dist-auth`, código 0, 904 módulos. Se ejecutó con EXPO_NO_DOTENV=1 y EXPO_NO_CLIENT_ENV_VARS=1, sin cargar ni imprimir .env. dist-auth está ignorado por Git. No es prueba de ejecución móvil ni publicación.
- Se reconfirmó con git check-ignore que .env está ignorado y con git ls-files que no está rastreado. .env no se leyó, imprimió ni modificó en esta etapa.
- No se crearon cuentas reales durante la verificación. Registro, credenciales, persistencia tras cierre completo y aparición del usuario en Firebase Console permanecen pendientes para comprobación del usuario en Expo Go.

No se implementaron catálogo, CRUD ni caché de lista. No se cambiaron reglas de Firestore, no hubo despliegue ni push. El informe de vulnerabilidades de la etapa anterior sigue siendo histórico: no se volvió a auditar ni se modificaron dependencias en esta etapa.

## Diagnóstico de configuración Firebase — 23 de octubre de 2026

- Se compararon nombres de config.ts, .env.example y .env sin imprimir valores. Las seis variables existen una sola vez y @expo/env las interpreta como cadenas no vacías. Solo existen .env y .env.example; no hay archivo local que sobrescriba la configuración. No se detectaron flags EXPO_NO_DOTENV/EXPO_NO_CLIENT_ENV_VARS activos en el entorno consultado.
- Las lecturas del código ya eran estáticas, TMDB no se exigía y la validación local aceptaba los valores del archivo. No se encontró una causa reproducible en nombres, sintaxis ni validación. El aviso anterior se refería al entorno recibido por el bundle y no acreditaba un .env incompleto; sin inspeccionar el bundle que ejecutó el teléfono no puede confirmarse si era caché, otro servidor/directorio o un arranque sin carga de variables. La exportación anterior de comprobación se había generado deliberadamente sin variables y no debe utilizarse para ejecutar la app configurada.
- Se reemplazó el mensaje genérico por la lista exacta de nombres ausentes/vacíos. No muestra valores ni impone patrones a configuraciones válidas; mantiene las seis referencias process.env estáticas. No se modificó .env, credenciales ni reglas.
- TypeScript y ESLint con Node 24.22.1: código 0. Suite Auth: 6 pruebas aprobadas, incluyendo mensaje con únicamente nombres faltantes, ausencia de valores en el error e independencia de TMDB. Se verificó adicionalmente la aceptación de la configuración local en memoria con @expo/env y SDK simulado, sin red ni impresión de valores: CONFIGURACION_LOCAL_ACEPTADA=true.
- Reinicio recomendado: detener Metro, quitar flags de desactivación en la terminal si los hubiera, iniciar desde mi-cartelera-personal con npm run dev -- --clear y abrir el nuevo QR tras cerrar por completo Expo Go. Verificación móvil pendiente del usuario; no se afirma que se haya reproducido ni resuelto en su dispositivo.

## Etapa 3 — catálogo TMDB (24 de octubre de 2026)

### Contexto y documentación

El usuario confirmó autenticación y persistencia en Expo Go y la verificación HTTP 200 del token con Interstellar. Esto es evidencia aportada por el usuario, no una prueba móvil ejecutada por Codex. Se revisaron README, especificación, instrucciones y archivos actuales antes de modificar el catálogo. Se consultaron las páginas oficiales TMDB de search/movie, search/tv, search/multi, configuración, imágenes, detalles movie/tv y append_to_response. Sus enlaces están en README. Se consultó la documentación correspondiente a Expo SDK 58. No se instalaron dependencias.

### Trabajo realizado

- Tipos normalizados TipoMedio, FiltroTipo, EstadoPeticion<T>, ResultadoBusqueda, Detalle, IntegranteElenco y ConfiguracionImagenes. TipoContenido se conserva como alias compatible con los contratos pendientes de lista. Sin any.
- Servicio TMDB con acceso estático al token, Bearer e idioma es-ES. buscar(titulo,pagina,filtroTipo,signal), obtenerDetalle(tipo,id,signal), construcción de imágenes y configuración cacheada en memoria 24 horas. No se guardan tokens, resultados ni configuración en AsyncStorage. La caché solo conserva configuración válida y no retiene errores; tamaños objetivo w185 y w500 elegidos entre los disponibles.
- Timeout por petición de 15 segundos, cancelación, errores de red/HTTP/429/respuesta inválida con mensajes seguros. Sin reintentos automáticos ni logs de credenciales.
- Buscar con FlatList de dos columnas, filtros, debounce de 350 ms, aborto y contador para descartar respuestas antiguas, reinicio de paginación, estados inicial/carga/error/vacío, reintento y carga adicional sin duplicados tipo+ID. Una página multi de solo personas conserva sus metadatos y permite continuar. La petición fallida de paginación conserva resultados anteriores.
- Detalle por parámetros tipo/ID con credits en la misma petición, póster mayor, año/tipo, sinopsis, puntuación TMDB sobre 10, ausencia de votos y elenco horizontal con fotos/nombres/personajes. Imágenes con placeholder ante ausencia/fallo. Carga, error y reintento; Agregar a mi lista deshabilitado con explicación, sin escrituras ni simulación.
- Acerca de conserva el logo, usuario/logout y texto español; se añadió exactamente el aviso inglés oficial pedido.
- README/especificación actualizados y recorrido manual en docs/PRUEBAS_CATALOGO.md. No se modificaron autenticación, .env, reglas Firestore, CRUD ni caché de lista.

### Comprobaciones ejecutadas

- `node node_modules/typescript/bin/tsc --noEmit` con Node 24.22.1: código 0.
- `node node_modules/eslint/bin/eslint.js src tests App.tsx index.ts`: código 0, sin avisos. El primer intento indicó import desordenado y setState síncrono en efecto de Detalle; se corrigieron sin suprimir reglas. El detalle ahora reinicia su instancia por tipo/ID y marca carga desde la acción de reintento.
- `node --test tests/*.test.cjs`: 14 pruebas aprobadas (6 Auth previas y 8 catálogo), 0 fallidas. Catálogo usa mocks sin red ni .env: filtros/endpoints/idioma/Bearer, normalización, caché de configuración, multi solo personas con páginas conservadas, deduplicación, detalle/credits/fallbacks, tamaños, 429 sin bucle, red, JSON inválido, timeout y cancelación. No son pruebas de interfaz ni de dispositivo.
- Prueba real del servicio fuera de la app, transpiliado en memoria y token leído silenciosamente desde .env. HTTP 200 en ocho solicitudes: búsqueda Interstellar/movie, configuration, Breaking Bad/tv, Star/multi páginas 1 y 2, consulta inexistente/movie, detalle movie/157336 y tv/1396. Resultados: Interstellar ID 157336 con 37 integrantes de elenco; Breaking Bad ID 1396 con 8; multi solo obras; páginas 1/2; consulta inexistente con 0 resultados; URL de póster HTTPS. No se guardaron credenciales ni respuestas en archivos.
- Bundle Android local: `node node_modules/expo/bin/cli export --platform android --output-dir dist-auth`, código 0, 908 módulos. EXPO_NO_DOTENV=1 y EXPO_NO_CLIENT_ENV_VARS=1 solo para esa comprobación: no carga ni incluye .env. No usar ese bundle para probar la app configurada. No fue despliegue ni publicación.

Pruebas de dispositivo del catálogo pendientes del usuario: película, serie, paginación, vacío, red/reintento, cambios rápidos, placeholders, teclado/safe areas y accesibilidad. No se marcaron como aprobadas. No se hizo push ni se cambió ningún servicio publicado.

## Etapa 4 — Mi lista (25 de octubre de 2026)

### Contexto y decisiones

El usuario confirmó Auth, persistencia, búsqueda y detalle en dispositivo. Se leyeron especificación, README, instrucciones y código actual. La nueva instrucción sustituye la ruta/modelo previstos anteriormente: se utiliza exclusivamente usuarios/{uid}/mi_lista/{tipo}_{tmdbId}, con por_ver y calificacionPersonal/agregadoEn/actualizadoEn. No se migraron colecciones antiguas ni se borraron archivos ajenos.

Se consultaron documentación oficial de transacciones, pruebas de reglas, lectura desde servidor y NetInfo para Expo SDK 58. NetInfo 12.0.1 se instaló con expo install como única nueva dependencia de ejecución. El intento de instalar @firebase/rules-unit-testing en la app fue rechazado por su peer firebase^12 frente al Firebase 13 existente; no se usó force/legacy-peer-deps ni se degradó Firebase. Se instalaron herramientas aisladas en .expo/rules-tools (ignorado): Firebase 12, reglas unit testing 5 y Firebase CLI 14.22.0. Se encontró Java 17 local de Processing; CLI 14 lo admite y advierte que CLI 15 exigirá 21. El entorno aislado reportó 20 vulnerabilidades en sus dependencias de herramientas; no forma parte del bundle de la app ni se usó para publicar servicios. El test de transacciones usa explícitamente Firebase 13 de la app contra el emulador mediante APIs públicas; las aserciones de reglas usan su cliente 12 aislado.

### Implementación

- listaService: obtener desde servidor, agregar/actualizar/eliminar con transacciones, propietario actual no anónimo y validación del esquema. Agregar comprueba existencia dentro de la transacción; duplicado no escribe ni sobrescribe. Solo ediciones de estado/calificación/comentario con actualizadoEn serverTimestamp. Tipos Firestore Timestamp/FieldValue separados de caché ISO. Las fechas de una entrada nueva se generan con serverTimestamp.
- Validación compartida: ID positivo/tipo, título no vacío hasta 200, año string, póster string/null, estados exactos, comentario hasta 500, estrellas enteras 1–5/null solo en Vista. Pasar a otro estado limpia estrellas. Copias validadas con campos exactos, uid, versión, fechas y unicidad.
- Controlador por uid conectado a Context mediante useSyncExternalStore. Snapshot vacío inmediato al cambiar cuenta y ocultación desde el inicio de logout; no se vuelve a exponer la cuenta anterior mientras se espera al observador. Solo una nueva sesión real vuelve a habilitar la lista. Respuestas tardías invalidadas por revisión; consultas serializadas.
- Caché primero y luego Firestore. AsyncStorage queda en cacheService, con cola por uid y generación de sesión que bloquea escrituras/limpiezas antiguas. La copia se conserva por uid tras logout para lectura futura con esa sesión, sin mostrarla sin autenticar. Copia vacía distinta de falta de copia. Un error remoto no borra datos locales y savedAt visible avanza solo después de guardarlos.
- NetInfo y vuelta a primer plano controlan conectividad. Offline es lectura de copia, sin altas/ediciones/bajas. Se requiere además lectura remota confirmada antes de mutar. Error de permisos no se clasifica como modo avión. Cada etapa E/S limita espera a 15 s; AsyncStorage conserva serialización real aunque un consumidor deje de esperar.
- Escrituras con marcador persistente previo y promesas reales conservadas por uid mientras están en vuelo. Timeout informa resultado incierto y bloquea repetir; no pretende cancelar Firebase. Un guard evita nuevos envíos de transacción tras expirar plazo/cambiar sesión o conexión. Resultado posterior/reconexión/actualización relee servidor y copia; lecturas iniciadas antes de terminar la escritura no liberan el bloqueo, sino que requieren otra lectura posterior. Un marcador recuperado tras reiniciar obliga a leer servidor, sin anunciar retrospectivamente éxito/cancelación.
- Detalle activa Agregar o Editar mi entrada. Mi lista tiene tarjetas, estado/estrellas, filtros combinables y mensajes distintos para vacío global/filtro/no copia. Editar tiene selector, estrellas solo Vista, null, comentario/contador, Guardar, confirmación de Quitar y usePreventRemove para cambios sin guardar. El borrador se compara con la entrada vigente también tras reconciliación tardía.
- firestore.rules local: dueño no anónimo, campos exactos, tipos/límites/ID, creación inicial y fechas request.time, actualización de campos editables únicamente conservando metadatos/agregadoEn, delete del dueño y denegación general fuera de la ruta. firebase.json prepara solo pruebas locales; no se publicó nada.
- README y especificación actualizados; docs/PRUEBAS_LISTA.md contiene publicación manual, preparación reproducible del emulador y matriz móvil pendiente.

### Verificación real y límites

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` con Node 24.22.1, código 0, también tras ajustes finales de logout/borrador.
- ESLint: `node node_modules/eslint/bin/eslint.js src tests App.tsx index.ts`, código 0, sin avisos tras ajustes finales.
- Unitarias: `node --test tests/*.test.cjs`, 20 aprobadas, 0 fallidas. Incluye 6 nuevas de negocio/caché/controlador: tipos y límites, copias por uid, escrituras viejas, copia vacía/null, error remoto preservando copia, respuesta tras cerrar controlador, offline, doble envío, timeout con commit tardío y reconciliación. Durante la preparación dos pruebas de controlador fallaron porque no esperaban que concluyera la lectura inicial; se corrigió la sincronización del entorno de pruebas y después pasó toda la suite.
- Reglas/emulador: `node tests/rules/ejecutar.cjs`, código 0, 5 grupos aprobados. Cubren CRUD permitido; sin sesión/anónimo/otra cuenta denegados; IDs, campos, límites, timestamps y metadatos; altas concurrentes, edición preservada al agregar duplicado, limpieza de estrellas y eliminación mediante el servicio real con Firebase 13. El primer intento del test de servicio falló por objetos creados en otro contexto VM que el SDK no acepta como plain objects; se corrigió la evaluación del test, sin alterar SDK ni servicio. Se repitió con éxito. Proyecto demo-mi-cartelera, puerto 8089, sin .env ni acceso al proyecto real.
- Bundle Android: `node node_modules/expo/bin/cli export --platform android --output-dir dist-auth`, código 0, 933 módulos. Variables desactivadas solo para esta exportación mediante EXPO_NO_DOTENV/EXPO_NO_CLIENT_ENV_VARS. No usar ese bundle para probar la app configurada. No es evidencia móvil ni despliegue.
- .env continúa ignorado/no rastreado; no se leyó ni modificó en esta etapa. Herramientas del emulador y logs de depuración ignorados. No se guardaron credenciales en tests/documentación.

### Comandos de comprobación registrados en esta etapa

Estos comandos corresponden a las ejecuciones locales descritas arriba; este bloque no registra una nueva ejecución ni una prueba manual de dispositivo. El runtime utilizado fue Node 24.22.1 y las herramientas de reglas se prepararon como se documenta en `PRUEBAS_LISTA.md`.

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src tests App.tsx index.ts
node --test tests/*.test.cjs
node tests/rules/ejecutar.cjs
```

Pendiente real: publicar manualmente el archivo local de reglas desde Firebase Console y ejecutar pruebas de Mi lista en Expo Go/producción (CRUD, duplicados, filtros, cuentas, modo avión/reinicio y red lenta). No se marcaron como realizadas. Pósteres offline pueden ser placeholders: la copia almacena metadatos, no imágenes descargadas. No se hicieron push, despliegues ni cambios de reglas publicadas.

## Corrección de salida tras eliminar — 25 de octubre de 2026

- El usuario informó que eliminar sí borraba la entrada, pero Editar pasaba a Entrada no disponible. Se confirmó en el código: el padre dependía solo de la lista global, que se actualiza antes de terminar la promesa, y no había navegación al completar.
- Se separó el estado de eliminación del dato remoto. El editor conserva una instantánea solo al confirmar una eliminación local, manteniendo el mismo formulario mientras espera y si hay un fallo/resultado incierto. Cancelar la alerta no altera ese estado ni el borrador.
- Solo al resolverse correctamente acciones.eliminar se cambia a una vista de transición específica, desmontando el formulario y su usePreventRemove antes del efecto de navegación. Se usa popTo a Cartelera con screen Lista; los parámetros del navegador anidado quedan tipados con NavigatorScreenParams. Esto vuelve a Mi lista incluso si Editar se abrió desde Detalle. No se añadieron temporizadores.
- La ausencia legítima de una entrada conserva su mensaje y añade Volver a Mi lista. Los errores/timeout no ejecutan la transición de éxito y muestran el mensaje accesible. No se cambió el servicio de persistencia ni sus reglas.
- Se consultó la documentación oficial de React Navigation para popTo, rutas anidadas y usePreventRemove, y la implementación instalada para comprobar la retirada del guard al desmontar.
- TypeScript (`node node_modules/typescript/bin/tsc --noEmit`) y ESLint (`node node_modules/eslint/bin/eslint.js src tests App.tsx index.ts`) ejecutados con Node 24.22.1: ambos código 0, sin errores ni avisos. Matriz manual actualizada en PRUEBAS_LISTA.md; no se ejecutaron ni aprobaron pruebas en dispositivo para esta corrección.

## Actualización documental de estados — 25 de octubre de 2026

- Se inventariaron y conservaron los documentos de pruebas existentes: PRUEBAS_AUTH.md, PRUEBAS_CATALOGO.md y PRUEBAS_LISTA.md, todos bajo docs/. No existían otros documentos PRUEBAS_*.md en este proyecto.
- Se separaron en cada uno las comprobaciones locales de Codex, las confirmaciones manuales expresas de la usuaria y los casos adicionales pendientes. Se dividieron filas que mezclaban un recorrido confirmado con variantes no ensayadas: detalle sin duplicar frente a concurrencia; estrellas frente a 501 caracteres; separación ordinaria de cuentas frente a respuesta en vuelo; eliminación normal frente a borrador/fallo/resultado incierto.
- Se conservaron comandos, preparación, pasos de publicación y recorridos reproducibles. Los títulos de ejemplo son ejemplos, no afirmaciones de que la usuaria utilizó exactamente esos títulos. Errores de Auth están confirmados en general; el desglose por código no se inventa.
- README y estado actual de la especificación reflejan publicación manual y recorridos confirmados. Las entradas históricas de esta bitácora permanecen intactas, contextualizadas por el estado vigente al principio.
- TypeScript y ESLint volvieron a ejecutarse con Node 24.22.1 en esta tarea documental y pasaron (código 0). No se repitieron las suites unitarias, el emulador, las peticiones de red ni las pruebas móviles: sus resultados anteriores y los informes manuales se atribuyen a su origen.
- Solo se modificaron documentos Markdown. No se cambió código, reglas, configuración, .env ni capturas; no hubo publicación ni push.

## Corrección de validación sin coerciones — 25 de octubre de 2026

- Se corrigieron validarObra y validarEdicion en src/utils/lista.ts: tipo y estado deben ser strings y coincidir exactamente con movie/tv y por_ver/viendo/vista. Se eliminaron las conversiones String(...). También se revisaron validarItem, validarCopia y normalizarEdicion, que delegan en estos validadores; tmdbId y calificacionPersonal ahora comprueban explícitamente el tipo number sin Number(...), conservando sus límites y la regla de calificación solo en Vista.
- Se añadieron tres pruebas de regresión en tests/lista.test.cjs. Cubren arrays como ['movie'] y ['por_ver'], objetos (incluido toString personalizado), null, undefined, valores desconocidos y otros tipos; mantienen la aceptación de todas las combinaciones válidas de tipo/estado y rechazan números representados mediante strings o arrays.
- Las pruebas usan el cacheService real con AsyncStorage aislado: guardar datos inválidos rechaza la operación antes de sobrescribir la copia válida; leer datos malformados rechaza de forma controlada sin borrarlos ni alterar la copia de otra cuenta. El controlador termina la carga inicial offline mostrando el error de lectura y recupera estado y caché válidos al reconectar al servidor simulado. No fue necesario modificar el servicio de caché ni el controlador.
- Comprobaciones ejecutadas con Node 24.22.1: `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/eslint/bin/eslint.js src tests App.tsx index.ts`, `node --test tests/*.test.cjs` y `node tests/rules/ejecutar.cjs`. Todas terminaron con código 0: TypeScript/ESLint sin errores, 23/23 unitarias y 5/5 grupos de reglas/transacciones en emulador. El emulador advirtió que futuras versiones de Firebase CLI requerirán Java 21; la ejecución actual pasó.
- No se ejecutaron pruebas nuevas en Expo Go ni producción. Se conservan las confirmaciones manuales y los pendientes anteriores. No se cambiaron reglas, dependencias, .env ni configuración de Git; no hubo commits, despliegues ni publicaciones.
