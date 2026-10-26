# Mi lista — estados y pruebas reproducibles

Actualización documental: 25 de octubre de 2026. Las confirmaciones de Expo Go y producción proceden de la usuaria. Las pruebas locales de Codex se registran aparte. No se infiere cobertura de variantes no descritas, plataforma iOS ni concurrencia real entre dispositivos.

## 1. Pruebas locales ejecutadas por Codex
- TypeScript y ESLint aprobados; bundle Android generado. Las comprobaciones no constituyen ejecución móvil.
- Suite local: 20 pruebas unitarias aprobadas en total (6 Auth, 8 catálogo y 6 de Mi lista). Las de Mi lista cubren validaciones, caché por uid, escrituras antiguas, copia vacía/null, errores remotos, descarte de respuesta al cerrar controlador, bloqueo offline, doble envío y timeout con resultado tardío/reconciliación. Se usaron mocks para estas condiciones.
- Emulador Firestore: 5 grupos aprobados. CRUD del dueño, rechazo de usuario sin sesión/anónimo/UID ajeno, esquema/ID/timestamps/límites/metadatos y servicio con altas concurrentes sin sobrescribir ediciones. El servicio se ejecutó con Firebase 13 de la app; herramientas de reglas aisladas con cliente 12.
- La corrección de salida tras eliminar pasó TypeScript/ESLint; su confirmación en Expo Go corresponde a la usuaria y consta abajo.
- Estos resultados locales no convierten los casos de concurrencia, incertidumbre o respuestas tardías en pruebas manuales de dispositivo aprobadas.

## Publicación manual de reglas — confirmada por la usuaria
La usuaria confirmó que publicó las reglas manualmente. Codex preparó/probó el archivo local, pero no realizó la publicación. Se conservan los pasos para reproducirla ante cambios futuros; no hace falta republicar por esta actualización documental:
1. Abrir Firebase Console y seleccionar el proyecto Firebase configurado para esta app.
2. Ir a Firestore Database → Reglas.
3. Copiar el contenido completo del archivo firestore.rules de la raíz de mi-cartelera-personal y pegarlo en el editor. Permite únicamente usuarios/{uid}/mi_lista y deniega las demás rutas.
4. Revisar y pulsar Publicar. No añadir allow read, write: if true ni permisos generales.
5. Volver a la app y pulsar Actualizar lista. Si en una repetición las reglas aún no están publicadas, producción puede denegar operaciones aunque Auth funcione; no hay que cambiar .env ni recrear usuarios.

firebase.json conserva la preparación del emulador; no contiene credenciales ni un proyecto de producción.

## Arranque reproducible
Usar Node compatible (LTS 24.12 o superior) y Expo Go compatible con SDK 58. Desde mi-cartelera-personal: `npm ci` si faltan dependencias y `npm run dev -- --clear`. Abrir el nuevo QR. No usar dist-auth, artefacto de comprobación sin credenciales.

## 2. Pruebas manuales confirmadas por la usuaria
| Caso | Pasos reproducibles | Resultado confirmado |
| --- | --- | --- |
| Crear y documento real | Con cuenta A y conexión, Actualizar lista; buscar una obra, Detalle → Agregar a mi lista; revisar Firestore. | Alta, estado inicial y documento real en Firestore confirmados. El esquema inicial esperado es Por ver, calificación null y comentario vacío. |
| Volver al detalle | Reabrir el detalle de una obra ya agregada. | Ofrece Editar mi entrada sin duplicar. No se extiende a dos dispositivos concurrentes. |
| Editar y persistir | Cambiar estado, calificación y comentario; Guardar; cerrar/reabrir completamente la app. | Cambios conservados tras reiniciar. |
| Restricción de estrellas | Probar estrellas fuera de Vista; pasar de Vista a otro estado. | Calificación deshabilitada fuera de Vista y limpiada al cambiar estado. |
| Filtros | Seleccionar filtros por estado y tipo. | Filtrado funcional en el recorrido probado. No se presume comprobación de todos los mensajes vacíos. |
| Cancelar eliminación | Quitar → Cancelar. | Se conserva la entrada/pantalla en el recorrido confirmado. |
| Confirmar eliminación | Quitar → Confirmar. | Borrado y navegación corregida a Mi lista comprobados en Expo Go. No se amplía a todos los orígenes de navegación ni a borradores sin guardar. |
| Caché y modo avión | Sincronizar con A; activar modo avión; cerrar completamente y reabrir la app. | Última copia consultable tras reinicio y mutaciones bloqueadas. |
| Reconexión | Desactivar modo avión; volver a la app y actualizar si es necesario. | Reconexión y recuperación del flujo confirmadas. |
| Dos cuentas | Salir de A y entrar con B; comparar listas. | Separación de listas confirmada. No incluye una respuesta tardía de A deliberadamente en vuelo. |
| Reglas publicadas | Seguir los pasos de Firebase Console indicados arriba. | Publicación manual confirmada por la usuaria. |
| Producción: get con UID ajeno | Simulador de reglas del proyecto publicado: operación get sobre una entrada de otra cuenta, autenticando con UID ajeno. | Denegada. Es simulador de producción, no una petición ejecutada por Codex. |
| Producción: delete con UID ajeno | Mismo simulador/ruta con operación delete y UID ajeno. | Denegada. No demuestra automáticamente el resto de operaciones/perfiles en producción. |
| Capturas revisadas | Revisar Authentication, documentos Firestore y resultados del simulador. | La usuaria confirmó capturas revisadas de dos usuarios, tres documentos y las dos denegaciones anteriores. |

Fuente de evidencia manual: comunicación de la usuaria en esta conversación. No se adjuntaron nuevos archivos de capturas en esta tarea documental; no se inventan nombres, rutas, UID, correos ni identificadores de documentos. No se atribuye a Codex una nueva revisión visual de esas capturas.

## 3. Casos adicionales aún pendientes en dispositivo/producción
| Caso | Pasos reproducibles | Resultado esperado / límite de la evidencia actual |
| --- | --- | --- |
| Concurrencia entre dispositivos | Intentar agregar la misma obra desde dos dispositivos de A simultáneamente. | Una sola entrada y sin sobrescribir ediciones. Aprobado en emulador, no comprobado manualmente entre dispositivos. |
| Película y serie guardadas | Agregar una de cada tipo y revisar sus tarjetas/IDs. | Tipo, año y clave compuesta correctos; no se deduce que ambos tipos se hayan guardado de la prueba de búsqueda. |
| Metadatos y fechas | Editar y comparar agregadoEn, actualizadoEn y metadatos originales en Firestore. | Metadatos/agregadoEn conservados y actualizadoEn de servidor. Validado localmente, inspección manual detallada pendiente. |
| Límite de comentario | Probar 500 y 501 caracteres. | 500 aceptados; 501 rechazados. Cubierto en lógica/reglas local; no confirmado en dispositivo. |
| Cambios sin guardar | Modificar comentario y usar Atrás/gesto; elegir Seguir editando y Descartar por separado. | Conserva borrador o sale sin escribir según elección. |
| Variantes de eliminación corregida | Eliminar con borrador sucio y entrando desde Mi lista y desde Detalle; observar toda la transición. | Sin alerta de cambios sin guardar ni destello de Entrada no disponible. La navegación normal corregida sí fue confirmada. |
| Error/resultado incierto al eliminar | Provocar fallo o red lenta durante la confirmación. | No navega como éxito; conserva editor y muestra el estado correspondiente. |
| Entrada ausente legítima | Quitar la entrada desde otro dispositivo y actualizar el editor abierto. | Mensaje legítimo de Entrada no disponible con Volver a Mi lista. |
| Respuesta tardía entre cuentas | Cambiar de A a B con una solicitud de A deliberadamente en curso. | La respuesta de A no modifica estado/cache visibles de B. La separación ordinaria entre cuentas sí fue confirmada. |
| Escrituras inciertas | Enviar una edición con red lenta y cortar conexión durante confirmación. | No anuncia éxito/cancelación por timeout, bloquea repetir y reconcilia. Prueba local con mocks aprobada; ensayo móvil pendiente. |
| Copia vacía / sin copia | Probar una cuenta con copia vacía válida y otra sin copia previa. | Mensajes distintos; no inventa sincronización. |
| Fecha de copia y corrupción | Comparar fecha antes/después de lectura offline; probar copia corrupta en entorno controlado. | Fecha no avanza por leer localmente; error no destruye copia válida. |
| Filtros sin coincidencias / lista vacía | Elegir combinación sin resultados y después dejar la lista realmente vacía. | Mensajes distintos; filtros ordinarios sí confirmados. |
| Error remoto | Provocar permiso denegado en un entorno de prueba y actualizar. | Conserva copia válida sin clasificar permisos como modo avión. No retirar las reglas publicadas para esta prueba en producción. |
| Seguridad adicional en producción | En simulador, comprobar create/update con UID ajeno, acceso sin sesión/anónimo, list y datos inválidos. | Denegaciones correspondientes. Solo get/delete con UID ajeno están confirmados en producción; demás casos tienen cobertura local parcial. |
| Accesibilidad e iOS | Revisar lector de pantalla, texto ampliado, safe areas, teclado y recorrido en iOS. | Pendiente de comprobación explícita; Expo Go no identifica por sí solo la plataforma. |

Los pósteres offline pueden mostrar placeholder si la imagen/configuración de TMDB no está disponible. La copia contiene metadatos y no descarga imágenes para uso offline.

## Reproducir comprobaciones locales
```powershell
npm run typecheck
npm run lint
npm test
```

Para el emulador (sin .env ni cuenta Firebase real), preparar herramientas aisladas:
```powershell
New-Item -ItemType Directory -Force .expo/rules-tools | Out-Null
npm --prefix .expo/rules-tools install --save-dev firebase@12 @firebase/rules-unit-testing@5 firebase-tools@14.22.0
npm run test:rules
```

Requiere Java en PATH o JAVA_HOME. Esta ejecución utilizó el Java 17 local de Processing con Firebase CLI 14; versiones futuras de CLI pueden exigir Java 21. El lanzador reconoce ese runtime local si existe. La biblioteca de aserciones de reglas exige Firebase 12 como peer: se aísla en .expo en lugar de degradar el Firebase 13 de la app. El test de servicio usa explícitamente el Firebase 13 instalado en la app y se conecta por API pública al emulador con identidad simulada. El proyecto es demo-mi-cartelera, Firestore escucha en 127.0.0.1:8089 y no se accede a producción. No se debe cambiar el proyecto demo por el real.

