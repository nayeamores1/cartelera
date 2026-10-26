# Verificación de Auth — estados actualizados

Actualización documental: 25 de octubre de 2026. Las confirmaciones manuales proceden de la usuaria y corresponden a Expo Go. No se atribuyen a Codex ni se presupone plataforma iOS. Cuando una fila contiene variantes no descritas expresamente, esas variantes siguen pendientes.

## 1. Pruebas locales ejecutadas por Codex
- TypeScript y ESLint aprobados en las etapas registradas en BITACORA_IA.md.
- 6 pruebas unitarias de Auth aprobadas: configuración/persistencia preparada, independencia de TMDB, validación, traducción segura, proyección de usuario, observación/cancelación y logout. Se usaron mocks; no prueban por sí solas persistencia en dispositivo.
- Bundle Android local generado sin credenciales; no es ejecución en Expo Go.

## Preparación reproducible
1. Usar Node compatible (LTS 24.12 o superior), abrir terminal en mi-cartelera-personal y ejecutar `npm ci` si faltan dependencias.
2. Mantener .env local con las seis variables de Firebase completas. TMDB puede quedar vacío para probar únicamente Auth; el catálogo requiere su token. No compartir .env, contraseñas ni capturas con tokens.
3. Ejecutar `npm run dev -- --clear`; equipo y teléfono en la misma red. Abrir QR con Expo Go compatible con SDK 58.
4. Si Firebase exige una política más estricta de contraseña, usar una clave que la cumpla. La validación local es mínima y Firebase es la autoridad.

## 2. Pruebas manuales confirmadas por la usuaria
| Caso | Pasos reproducibles | Resultado confirmado |
| --- | --- | --- |
| Registro | Crear una cuenta nueva con correo propio válido, clave y confirmación iguales. | Registro funcional en Expo Go. |
| Inicio de sesión | Ingresar con la cuenta creada. | Login funcional. |
| Cerrar sesión | Acerca de → Cerrar sesión. | Logout funcional. |
| Errores de autenticación | Repetir el escenario de credenciales/registro inválido utilizado por la usuaria. | La usuaria confirmó el manejo de errores; no se registró el desglose exacto de cada código probado. |
| Persistencia | Con sesión activa, cerrar completamente Expo Go y volver a abrir el mismo proyecto, sin borrar datos ni reinstalar. | La sesión se conserva al cerrar/reabrir. |
| Usuarios en Firebase | Firebase Console → Authentication → Users. | La usuaria confirmó capturas revisadas con dos usuarios. No se transcriben correos, UID ni credenciales. |

## 3. Casos adicionales pendientes de confirmación manual específica
| Caso | Pasos | Resultado esperado |
| --- | --- | --- |
| Validación local detallada | En Login enviar vacío/correo inválido; en Registro usar menos de 6 caracteres y confirmación distinta. | Mensaje en español; no se envía la solicitud inválida. La lógica tiene pruebas locales, pero no se confirma cada variante móvil. |
| Visibilidad y teclado | Alternar mostrar/ocultar; recorrer campos y enviar desde teclado. | Contraseña y confirmación cambian de visibilidad y scroll permite ver acciones. |
| Doble envío / Atrás | Pulsar repetidamente Registro durante carga; probar Atrás tras login/logout. | Bloqueo de solicitudes duplicadas y rutas privadas inaccesibles sin sesión. |
| Correo ya registrado | Tras cerrar sesión, intentar registrar el mismo correo. | Mensaje específico de correo registrado. Pendiente del desglose manual, aunque errores en general sí fueron confirmados. |
| Credenciales incorrectas detalladas | Probar contraseña incorrecta y correo inexistente por separado. | Mensaje genérico sin revelar cuál falló. Pendiente del desglose manual. |
| Recuperación sin destello | Observar el arranque con sesión persistida. | Indicador inicial sin aparición breve de Login. Se confirmó persistencia, no esta inspección visual específica. |
| Persistencia del logout | Cerrar sesión; cerrar completamente y reabrir el proyecto. | Sigue sin sesión. Es distinto del cierre/reapertura con sesión activa confirmado. |
| Fallo de red en Auth | Sin sesión, desactivar Internet e intentar login; restaurar y reintentar. | Error seguro y recuperación. El error de red confirmado para catálogo no se extiende automáticamente a Auth. |
| Accesibilidad e iOS | Revisar lector de pantalla, texto ampliado, safe areas y recorrido equivalente en iOS. | Verificación explícita aún pendiente. |

No se implementaron recuperación de contraseña, verificación de correo ni proveedores sociales. Catálogo y Mi lista sí están implementados; sus estados se documentan por separado en PRUEBAS_CATALOGO.md y PRUEBAS_LISTA.md.

Para repetir pruebas locales: `npm run typecheck`, `npm run lint` y `npm test`. Los resultados históricos y sus límites se conservan en BITACORA_IA.md.
