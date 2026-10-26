# Mi Cartelera Personal

## 1. Objetivo y descripción
Aplicación académica móvil en español para descubrir películas y series y organizar una cartelera privada. Etapa actual: Mi lista con Firestore, edición, filtros y copia local por usuario. La usuaria confirmó manualmente en Expo Go Auth/persistencia, catálogo y los recorridos principales de Mi lista, además de la publicación manual de reglas. Los casos adicionales no probados expresamente siguen pendientes; no se declara una validación exhaustiva.

Se creó una carpeta independiente porque la raíz contiene proyectos ajenos con cambios previos. No se modificaron esos proyectos.

## 2. Alcance y requisitos
| ID | Alcance implementado (recorridos principales confirmados por la usuaria; variantes pendientes en las matrices de pruebas) |
| --- | --- |
| RF1 | Registro, login, logout, sesión persistente y errores traducidos. |
| RF2 | Búsqueda de películas y series con carga, error, vacío y paginación. |
| RF3 | Detalle con póster, sinopsis, puntuación TMDB y elenco. |
| RF4 | Agregar sin duplicados mediante ID compuesto tipo + TMDB. |
| RF5 | Filtrar por estado y tipo. |
| RF6 | Estado, calificación entera 1–5 o null y comentario hasta 500 caracteres; solo vista admite calificación. |
| RF7 | Confirmación explícita antes de eliminar. |
| RF8 | Firestore privado y copia AsyncStorage por usuario; fecha de última copia y aviso sin conexión. |
| RF9 | Acerca de, atribución, logo oficial TMDB y logout. |
| RF10 | TypeScript estricto, capas separadas y credenciales fuera de Git. |

## 3. Pantallas y navegación
Al iniciar se muestra un indicador hasta el primer resultado del observador de sesión. Sin sesión: native stack Login/Registro. Con sesión: Cartelera con bottom tabs Buscar, Mi lista y Acerca de. Una tarjeta abre Detalle con parámetros tipados `{tipo: 'movie' | 'tv', id: number}`. Una entrada guardada abre Editar con `{itemId: string}` desde Detalle o Mi lista. El cambio de sesión elimina las rutas del grupo anterior y la lista visible se vacía inmediatamente; las respuestas anteriores no pueden modificar la nueva cuenta. Bienvenida se conserva como archivo previo, sin ruta accesible.

Buscar conserva filtros, debounce, paginación y estados. Detalle conserva datos TMDB y permite Agregar a mi lista cuando hay conexión y una lectura confirmada del servidor; si ya existe, ofrece Editar mi entrada. Mi lista combina filtros de estado/tipo y distingue vacío de ausencia de coincidencias. Editar permite estado, estrellas solo en Vista, comentario con contador, guardar, confirmar eliminación y advertir al salir con cambios sin guardar. Cambiar desde Vista limpia la calificación.

## 4. Arquitectura
`src/screens` presenta; `components` comparte controles; `navigation` tipa rutas; `context/CarteleraContext.tsx` expone sesión, lista, cargas, errores y acciones. `useListaUsuario` conecta el controlador de lista mediante useSyncExternalStore. `services/listaController.ts` coordina caché primero, lectura remota, sesión vigente y reconciliación; listaService contiene todas las operaciones Firestore; cacheService encapsula AsyncStorage; conectividadService encapsula NetInfo y revisión al volver al primer plano. Las pantallas no importan Firebase ni AsyncStorage.

## 5. Modelo de Firestore
Ruta exacta: `usuarios/{uid}/mi_lista/{tipo}_{tmdbId}`. Campos: tmdbId entero positivo; tipo movie/tv; titulo no vacío hasta 200; anio string (vacío si no consta); posterPath string/null; estado por_ver/viendo/vista; calificacionPersonal entero 1–5/null; comentario hasta 500; agregadoEn/actualizadoEn timestamp. Solo Vista admite calificación. Nueva entrada Por ver, null y comentario vacío. Fechas serverTimestamp; actualización conserva metadatos originales y agregadoEn. Transacción lee antes de crear: si existe, no escribe ni sobrescribe ediciones. Las actualizaciones y eliminaciones también usan transacciones, sin cola offline. EntradaFirestore usa Timestamp; ListaItem/CopiaLocal usan fechas ISO serializables.

`firestore.rules` valida dueño no anónimo, esquema completo sin campos extra, ID consistente, valores y fechas. Niega otras rutas. La usuaria confirmó su publicación manual; Codex lo preparó y probó localmente, sin desplegarlo. También confirmó get/delete denegados con UID ajeno en el simulador de producción. Las demás variantes de seguridad no se dan por comprobadas en producción. Se conservan instrucciones para repetir la publicación ante cambios futuros: abrir Firebase Console del proyecto de esta app → Firestore Database → Reglas → pegar el contenido completo de firestore.rules → Publicar. No añadir permisos globales. Después repetir los casos pertinentes de docs/PRUEBAS_LISTA.md. La publicación ya está confirmada; si en otro entorno faltan reglas, Firestore puede denegar operaciones aunque Auth funcione.

Caché: clave `cartelera:lista:v1:{uid}`, sobre version/uid/savedAt/items validado al leer; null significa que no hay copia, items=[] que existe una copia vacía. Se conserva por uid al cerrar sesión para permitir lectura offline tras volver a autenticar; nunca se muestra sin esa sesión. AsyncStorage no está cifrado. Escrituras serializadas por uid y generación de sesión evitan sobrescrituras antiguas. Errores remotos conservan la copia válida; la fecha de copia solo avanza después de guardarla.

Offline: aviso «Sin conexión. Estás viendo tu última copia guardada» y mutaciones bloqueadas. NetInfo debe confirmar conectividad y debe existir lectura remota confirmada antes de modificar. Cada etapa de E/S limita su espera a 15 s; no cancela un commit ya enviado. Un marcador persistente por uid precede al envío. En caso de timeout se informa resultado incierto y se conserva la promesa real; nuevas mutaciones quedan bloqueadas. Al terminar la promesa, reconectar, volver al primer plano o pulsar Actualizar se consulta de nuevo al servidor. Una lectura iniciada con escritura en vuelo no libera el bloqueo: se hace otra posterior. Tras reiniciar el proceso, el marcador obliga a reconciliar con una nueva lectura; no se anuncia retrospectivamente éxito ni cancelación de esa operación.

## 6. Instalación, variables y comandos
Plantilla oficial `blank-typescript`; versión elegida: Expo SDK 58 (`~58.0.19`), React 19.3, React Native 0.88, TypeScript 6. Versiones exactas resueltas en package-lock.json. React Navigation sustituye la sugerencia de Expo Router del AGENTS.md generado por la plantilla por requisito explícito del trabajo.

```powershell
cd mi-cartelera-personal
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
npm run typecheck
npx expo install --check
```

Requiere Node LTS 24.12 o superior compatible con Expo (ver engines). Completar las seis variables EXPO_PUBLIC_FIREBASE_* del ejemplo y EXPO_PUBLIC_TMDB_TOKEN con el token de lectura de TMDB. El token solo se exige al consultar el catálogo; su ausencia no bloquea Firebase ni el arranque. El usuario confirmó Firebase, Email/Password y token configurados. Mi lista accede a Firestore; la usuaria confirmó la publicación manual de reglas. Codex no publicó servicios ni reglas. No sobrescribir un .env existente. Tras editarlo, reiniciar Metro con `npm run dev -- --clear`.

Todas las peticiones API del catálogo están en services/tmdbService.ts: Authorization Bearer, language=es-ES, timeout de 15 segundos, AbortSignal y mensajes seguros para red/HTTP/429. No hay reintentos automáticos. /configuration se cachea en memoria por 24 horas tras éxito; fallos no se cachean. Las URL usan secure_base_url y tamaños anunciados: objetivo w185 en tarjetas/elenco y w500 en detalle, con alternativa disponible. La configuración se pierde al cerrar el proceso; no se añade caché persistente del catálogo; la copia de Mi lista es independiente. Los fallos de imágenes muestran un placeholder. Una configuración fallida se puede volver a consultar mediante Reintentar.

`EXPO_PUBLIC_*` se incorpora al cliente: no es un almacén de secretos. Nunca incluir cuentas de servicio ni claves privadas. Contraseñas solo en estado transitorio de los formularios; el SDK administra la persistencia de sesión mediante AsyncStorage. La app no almacena tokens ni contraseñas manualmente. La copia de lista se guarda por uid; no incluye credenciales.

Firebase instalado: 13.1.0 (@firebase/auth 1.13.8), Expo 58 y React Navigation 7 se mantienen; esta etapa añade únicamente NetInfo 12.0.1 al runtime. Firebase omite getReactNativePersistence en la entrada general de tipos, aunque la exporta y declara en su entrada React Native. Con autorización explícita del usuario, tsconfig.json selecciona la declaración React Native oficial para firebase/auth. Se eliminó src/types/firebase-auth.d.ts; no hay declaraciones inventadas, modificaciones de node_modules ni imports internos en el código. `experiments.tsconfigPaths: false` evita que Metro trate ese mapeo de tipos como una ruta ejecutable; Metro utiliza los exports oficiales del paquete. Revisar esta configuración al actualizar Firebase. Este proyecto y esta comprobación apuntan a Android/iOS; no se validó persistencia web.

Expo Go: teléfono y equipo en la misma red, ejecutar `npm run dev` y escanear QR. Verificar que Expo Go soporte SDK 58; su disponibilidad en tiendas puede estar en transición. Si aparece incompatibilidad, instalar una versión compatible desde https://expo.dev/go o utilizar un development build en una etapa posterior. Codex generó bundles locales de comprobación sin credenciales, no builds distribuidos ni servicios publicados. La publicación manual de reglas fue realizada por la usuaria.

Scripts: `dev` inicia Metro; `typecheck` ejecuta tsc sin emitir; `lint` verifica código fuente con ESLint; `test` ejecuta pruebas unitarias aisladas sin red ni .env; `test:rules` ejecuta reglas y transacciones contra un proyecto demo en emulador (preparación en docs/PRUEBAS_LISTA.md).

Comprobaciones locales de Codex registradas en bitácora: TypeScript/ESLint aprobados, compatibilidad Expo comprobada, 20 pruebas unitarias y 5 grupos de reglas/transacciones aprobados, y bundles Android generados. Son evidencias locales; los recorridos en Expo Go y el simulador de producción fueron confirmados por la usuaria por separado. Auditoría con red: 9 vulnerabilidades altas transitivas, conservadas en docs/audit-produccion.json; evaluar correcciones compatibles antes de distribuir, sin degradar Expo/Firebase mediante audit fix --force. Detalles e incidencias reales en la bitácora.

## 7. Estado de verificación y plan reproducible

Actualización documental: 25 de octubre de 2026. Fuente de pruebas manuales: confirmación de la usuaria en esta conversación. No se deduce iOS, concurrencia ni accesibilidad a partir de Expo Go.

| Origen | Confirmado | Límites |
| --- | --- | --- |
| Codex, local | TypeScript/ESLint; 20 unitarias; 5 grupos de reglas/transacciones en emulador; peticiones reales TMDB HTTP 200 y bundles locales. | Mocks/emulador no son pruebas móviles ni pruebas de producción. Resultados históricos, no nueva ejecución de todas las suites en esta actualización documental. |
| Usuaria, Expo Go | Registro/login/logout/errores/persistencia; búsqueda película/serie, detalle, paginación, sin resultados y red/reintento; alta/documento real, volver al detalle sin duplicar, edición persistente, restricción/limpieza de estrellas, filtros, cancelar/confirmar eliminación y regreso corregido a Mi lista; copia en modo avión tras reinicio, bloqueo/reconexión y separación entre dos cuentas. | Solo los recorridos expresamente confirmados. Desglose en PRUEBAS_AUTH.md, PRUEBAS_CATALOGO.md y PRUEBAS_LISTA.md. |
| Usuaria, Firebase/producción | Reglas publicadas manualmente; get/delete denegados con UID ajeno en el simulador; capturas revisadas de dos usuarios, tres documentos y ambas denegaciones. | Confirmación comunicada por la usuaria; no nuevas capturas inspeccionadas por Codex en esta tarea. No cubre automáticamente create/update/list, anónimos ni todas las validaciones en producción. |
| Adicionales pendientes | Concurrencia entre dispositivos, escrituras inciertas y respuestas tardías entre cuentas en dispositivo, 501 caracteres manualmente, lector de pantalla e iOS, entre otras variantes detalladas. | La cobertura local de algunos casos no cambia su estado manual pendiente. |

Se conservan las instrucciones y el plan para repetir comprobaciones ante cambios:
1. Actual: revisar documentación, TypeScript, dependencias, bundle Android y navegación manual en dispositivo; comprobar safe areas, teclado, contraste y controles de 44 px.
2. Auth: registro válido/inválido, errores en español, reinicio con sesión persistente y logout.
3. TMDB: carga, fallo, vacío, paginación sin duplicados y detalles de ambos tipos.
4. Lista: duplicados, filtros, validación de estado/calificación/comentario y cancelación de eliminación.
5. Persistencia: aislamiento de usuarios con reglas, lectura local, pérdida de red, fecha de copia, reconexión y limpieza al cerrar sesión.
6. Dispositivo: Android/iOS, lector de pantalla, teclado y texto ampliado. Registrar evidencia real; los casos futuros no se dan por aprobados.

## 8. Declaración de uso de IA
Se utilizó Codex para inspección, documentación, estructura, base visual, autenticación, catálogo, Mi lista y documentación de pruebas. El estudiante debe revisar el código, comprender las decisiones y completar las pruebas en dispositivo. Véase `docs/BITACORA_IA.md` para acciones y límites reales, `docs/PRUEBAS_AUTH.md` para el recorrido de Auth y `docs/PRUEBAS_CATALOGO.md` para catálogo y `docs/PRUEBAS_LISTA.md` para los casos confirmados y adicionales pendientes de Mi lista.

Referencias oficiales del catálogo: [búsqueda combinada](https://developer.themoviedb.org/reference/search-multi), [películas](https://developer.themoviedb.org/reference/search-movie), [series](https://developer.themoviedb.org/reference/search-tv), [configuración](https://developer.themoviedb.org/reference/configuration-details), [imágenes](https://developer.themoviedb.org/docs/image-basics), [append_to_response](https://developer.themoviedb.org/docs/append-to-response), [detalle película](https://developer.themoviedb.org/reference/movie-details) y [detalle serie](https://developer.themoviedb.org/reference/tv-series-details).

Referencias: https://docs.expo.dev/versions/v58.0.0/ · https://firebase.google.com/docs/reference/js/auth · https://developer.themoviedb.org/docs/faq



