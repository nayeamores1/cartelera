# Verificación del catálogo — estados actualizados

Actualización documental: 25 de octubre de 2026. Se distinguen pruebas locales de Codex, confirmaciones manuales de la usuaria en Expo Go y casos adicionales pendientes. No se presume iOS ni cobertura completa de todas las variantes de un caso.

## 1. Pruebas locales ejecutadas por Codex
- 8 pruebas unitarias TMDB aprobadas: texto vacío, endpoints/filtros/idioma/Bearer, normalización y caché de configuración, multi solo personas conservando páginas, deduplicación tipo+ID, detalle/credits y alternativas, tamaños de imagen, 429 sin reintento infinito, red/JSON inválido/timeout/cancelación. Son mocks, no pruebas móviles.
- Servicio real fuera de la app: ocho respuestas HTTP 200 (configuration, Interstellar/movie, Breaking Bad/tv, Star/multi páginas 1 y 2, consulta inexistente y detalles de película/serie). Se comprobaron resultados vacíos y elenco. Token leído en memoria, sin publicarlo ni guardarlo en documentación.
- TypeScript, ESLint y bundle Android aprobados según bitácora. No equivalen a prueba de interfaz.

## Preparación reproducible
Usar Node compatible y Expo Go SDK 58. Desde mi-cartelera-personal ejecutar `npm run dev -- --clear`, abrir el QR e iniciar sesión. Mantener el token de TMDB configurado localmente. No usar dist-auth: es un bundle de comprobación generado sin credenciales.

## 2. Pruebas manuales confirmadas por la usuaria
| Caso | Pasos reproducibles | Resultado confirmado |
| --- | --- | --- |
| Película | Seleccionar Películas y buscar un título; Interstellar es el ejemplo reproducible. | Búsqueda de películas funcional. No se afirma que la usuaria haya utilizado ese título exacto. |
| Serie | Seleccionar Series y buscar un título; Breaking Bad es el ejemplo reproducible. | Búsqueda de series funcional. |
| Detalle | Abrir una tarjeta de búsqueda. | Detalle TMDB funcional, confirmado en dispositivo. |
| Paginación | Buscar un término con varias páginas, por ejemplo Star, y pulsar Cargar más. | Paginación funcional en el recorrido probado. |
| Sin resultados | Buscar un título inexistente; ejemplo zzxxqqsinresultados123987xyz. | Se muestra el estado sin resultados. |
| Red y reintento | Desactivar Internet, buscar un título, esperar el error; restaurar y Reintentar. | Error de red con recuperación mediante reintento confirmado. |

## 3. Casos adicionales pendientes en dispositivo
| Caso | Pasos | Resultado esperado |
| --- | --- | --- |
| Inicio/vacío | Abrir Buscar sin texto; escribir y borrar. | Estado inicial, sin consultas vacías ni resultados antiguos. Cubierto parcialmente por lógica local, no por confirmación manual específica. |
| Todo y personas | Buscar Star con Todo. | Solo películas/series; ninguna persona como resultado. El servicio se comprobó localmente; falta confirmación de esta variante en pantalla. |
| Páginas especiales | Continuar hasta el final; comprobar página combinada solo de personas y obras con igual ID de distintos tipos. | Sin duplicados; fin correcto; una página sin obras no impide continuar si quedan páginas. Paginación ordinaria sí está confirmada. |
| Respuesta antigua | Cambiar rápidamente texto/filtro con red lenta, también durante Cargar más. | Solo consulta/filtro actuales; página reiniciada. |
| Error al paginar | Con página 1 visible, desactivar red y Cargar más. Restaurar y Reintentar. | Mantiene tarjetas y reintenta la misma página fallida. No se deduce de la prueba general de red. |
| Error en detalle | Abrir una tarjeta sin Internet; restaurar y Reintentar. | Error accesible y recuperación del detalle correcto. |
| Alternativas | Abrir títulos sin póster/sinopsis/votos/elenco o provocar fallo de imagen. | Placeholder y textos de ausencia; cero votos muestra Sin calificaciones. |
| 429, timeout y cancelación | Reproducir estas condiciones en un entorno de prueba controlado. | Mensajes seguros y ausencia de reintentos infinitos. Pruebas aisladas locales aprobadas; ensayo móvil pendiente. |
| Acerca de y UI | Revisar logo oficial, aviso TMDB, correo/logout, teclado, safe areas, texto ampliado y elenco horizontal. | Inspección visual/accesible específica pendiente; el código y el recurso de atribución sí fueron revisados por Codex. |
| Lector de pantalla / iOS | Repetir el recorrido con lector de pantalla y en iOS. | Pendiente; no se presupone plataforma a partir de Expo Go. |

Agregar a mi lista ya está activo y la usuaria confirmó alta y acceso a edición sin duplicar. La restricción de botón deshabilitado correspondía a una etapa anterior; el recorrido vigente está en PRUEBAS_LISTA.md.

Para repetir las comprobaciones locales: `npm run typecheck`, `npm run lint`, `npm test`. Detalles históricos y límites en BITACORA_IA.md.
