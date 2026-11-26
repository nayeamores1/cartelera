# PRD — Mi año en cine

Estado: borrador para revisión de la estudiante. Fecha: 25 de noviembre de 2026. Las decisiones D1–D13 proceden del cliente/docente; los puntos abiertos no son decisiones aprobadas.

## Referencias y propósito del documento

- Enunciado original adjunto de la épica «Mi año en cine», apartados de funcionalidad, historias, decisiones D1–D13 y datos nuevos. Se consultó el texto original, no se reconstruyeron las reglas desde la memoria o la auditoría.
- [Especificación del Proyecto 3](../ESPECIFICACION.md): comportamiento existente que debe conservarse.
- [Auditoría inicial](../AUDITORIA.md): evidencia y riesgos del punto de partida.

Este PRD define el problema, alcance y reglas de producto. No constituye el backlog ni la spec técnica. Los criterios DADO/CUANDO/ENTONCES, tickets, diseño, contratos técnicos y código se prepararán después, siguiendo el orden del enunciado.

## Problema

Mi Cartelera Personal permite descubrir películas y series y gestionar una lista privada con estado, calificación y comentario. No ofrece una visión anual de lo visto y todavía no conserva la fecha de visionado ni todos los datos necesarios para calcular horas, géneros y directores. Una persona puede saber qué guardó o calificó, pero no resumir su año sin revisar las entradas una por una.

La evolución debe aprovechar las obras existentes sin perder sus datos ni exigir que la persona vuelva a agregarlas. El resumen también debe explicar sus limitaciones cuando falten metadatos o conexión.

## Objetivo y usuario

El usuario es la persona autenticada que utiliza su lista privada para organizar películas y series. Quiere comprender qué vio durante un año, reconocer sus preferencias y comparar años de su propio historial.

El objetivo es añadir una pestaña «Mi año en cine» con un resumen comprensible de obras vistas por año: total y desglose por películas/series, horas de películas, género y director más vistos, actividad mensual y obra destacada. El resultado se basa en la fecha de visionado, no en el año de estreno ni en la fecha de alta en la lista.

La ampliación conserva autenticación, separación entre cuentas, búsqueda, detalle, CRUD, validaciones y consulta offline del Proyecto 3. No sustituye los recorridos existentes.

## Alcance

- Una pantalla de resumen accesible desde una nueva pestaña para el usuario autenticado.
- Selector de año con el conjunto, orden y selección inicial establecidos en D4.
- Registro de cuándo una obra pasa a Vista y limpieza de esa fecha al salir del estado, según D1.
- Resumen con total de obras, películas, series, horas de cine, género y director más vistos, doce barras mensuales, mes más activo y obra destacada.
- Actualización de obras antiguas: asignar la fecha de D2 y completar desde TMDB los datos de D6 sin perder la entrada, su calificación o comentario.
- Al agregar obras, conservar los datos de TMDB especificados en D5, diferenciando películas y series.
- Consulta sin conexión a partir de la copia local, con aviso y sin migrar fechas ni completar metadatos offline.
- Estados de carga, vacío, error, sin conexión y datos faltantes, distinguidos con mensajes comprensibles. El progreso de enriquecimiento se muestra de una obra en una, como exige D6.

## Fuera de alcance

- Revisionados, múltiples visionados de una misma obra y un historial por cada visionado.
- Nuevas funciones de compartir/exportar, rankings entre personas, recomendaciones, logros o estadísticas sociales.
- Seguimiento de episodios o temporadas, horas de series, directores de series o estadísticas adicionales no solicitadas.
- Edición manual o importación de fechas históricas, cambios en autenticación o sustitución de Firebase/TMDB.
- Rediseñar ahora la app, definir el brand board o añadir métricas, umbrales de éxito o políticas de reintento que el cliente no haya aprobado.

Las situaciones no resueltas por el enunciado se registran como preguntas; no se incorporan reglas nuevas por conveniencia de implementación.

## Reglas de negocio del cliente

### D1 — Fecha de visionado

Nuevo campo `vistaEn`. Se guarda con `serverTimestamp` cuando la obra pasa a `vista`. Si deja de estar `vista`, vuelve a `null`; si vuelve a `vista`, toma la fecha nueva. Editar calificación o comentario no la cambia.

### D2 — Obras vistas antes de esta épica

Al abrir «Mi año en cine», las obras en `vista` sin `vistaEn` reciben `vistaEn = actualizadoEn`. Se hace una sola vez y se guarda en Firestore.

### D3 — A qué año pertenece una obra

Al año calendario de `vistaEn` en la hora local del teléfono. Cada obra cuenta una sola vez: no hay revisionados.

### D4 — Años del selector

Los años con al menos una obra vista, más el año actual, del más reciente al más antiguo. Se abre en el año actual.

### D5 — Datos de TMDB

Al agregar una obra se guardan `generos` (nombres en español), `duracionMin` (solo películas; en series es `null`) y `directores` (solo películas; en series es una lista vacía).

### D6 — Obras guardadas sin esos datos

Al abrir el resumen se completan desde TMDB las obras vistas del año elegido que no los tengan, de una en una y con progreso visible. Si TMDB falla para una obra, cuenta en el total pero no en horas, género ni director, y el resumen dice cuántas quedaron sin datos.

### D7 — Horas de cine

Suma de `duracionMin` de las películas vistas, en horas con un decimal (`37,5 h`). Las series cuentan como obras, no en horas. Una película sin duración no suma y el resumen lo indica.

### D8 — Género más visto

Cada obra suma 1 a cada uno de sus géneros. Gana el que tenga más obras. Empate: mayor promedio de calificación personal entre sus obras calificadas (sin calificadas pierde). Si persiste: orden alfabético.

### D9 — Director más visto

Solo películas; cada director suma 1. Mismo desempate que D8: mayor promedio de calificación personal entre sus obras calificadas (sin calificadas pierde) y, si persiste, orden alfabético. Si ninguna película tiene director, la tarjeta dice que no hay datos suficientes.

### D10 — Mes más activo

El mes con más obras vistas. Empate: el más reciente. Se muestran los 12 meses del año, también los que tienen 0.

### D11 — Obra destacada

La de mayor calificación personal. Empate: la de `vistaEn` más reciente. Si no hay obras calificadas, la tarjeta invita a calificar.

### D12 — Resumen vacío

Un año sin obras vistas muestra un estado vacío con el botón «Ir a Mi lista».

### D13 — Sin conexión

El resumen se calcula con la copia de AsyncStorage y muestra un aviso. Sin conexión no se completan datos ni se migran fechas.

## Datos necesarios y compatibilidad de producto

El enunciado mantiene la lista privada existente y añade cuatro datos por obra. Esta descripción identifica necesidades de producto, sin definir todavía la implementación o las reglas técnicas de acceso.

| Dato          | Restricción indicada por el enunciado                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `vistaEn`     | Marca de tiempo o `null`, de acuerdo con las transiciones de D1 y la actualización de D2.                                             |
| `generos`     | Lista de nombres en español, máximo 10.                                                                                               |
| `duracionMin` | Minutos de película; `null` en series o si TMDB no trae duración. Cuando exista, el enunciado exige un entero positivo de hasta 1000. |
| `directores`  | Lista de nombres de directores de la película, máximo 10; vacía en series.                                                            |

La ampliación debe ser compatible con documentos anteriores que aún no tengan estos datos. No debe sobrescribir calificaciones o comentarios para completar metadatos. Se conserva la privacidad por cuenta del Proyecto 3 y la consulta offline con su copia propia; no se añaden mutaciones offline.

## Historias de referencia

Se conservan las cinco historias del enunciado. Sus criterios DADO/CUANDO/ENTONCES se redactarán posteriormente en el backlog, no en este documento.

| ID     | Historia                                                                           | Referencia principal                                                                                |
| ------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| HU-A.1 | Como usuario, quiero que la app recuerde cuándo vi cada obra.                      | D1: marcar como Vista guarda la fecha; dejar de estar Vista la borra.                               |
| HU-A.2 | Como usuario, quiero ver mi resumen del año.                                       | D3 y D7–D11: totales, horas, género, director, mes más activo y obra destacada.                     |
| HU-A.3 | Como usuario, quiero cambiar de año.                                               | D4: años con obras vistas, más el actual.                                                           |
| HU-A.4 | Como usuario, quiero ver mi resumen aunque mis obras sean anteriores a esta épica. | D2, D5 y D6: fecha y datos TMDB, sin perder los datos anteriores.                                   |
| HU-A.5 | Como usuario, quiero entender un resumen vacío o incompleto.                       | D6, D7, D9, D11, D12 y D13: progreso, datos faltantes, vacío y sin conexión; también carga y error. |

## Puntos abiertos para consultar

Estas preguntas no cambian D1–D13 ni representan reglas aprobadas:

1. **Empate completo de obra destacada:** si dos obras tienen exactamente la misma calificación personal y el mismo `vistaEn`, ¿cómo se elige una? D11 no establece un tercer desempate.
2. **Datos heredados incompletos o inválidos:** si una obra antigua en Vista tampoco tiene un `actualizadoEn` utilizable, ¿qué debe mostrarse y cómo debe tratarse? No se asignará la fecha actual como sustitución sin aprobación.
3. **Ausencia frente a dato legítimamente vacío:** ¿cómo distinguir que falta enriquecer una obra de un resultado TMDB válido con géneros/directores vacíos o duración ausente? D6 y D7 fijan su efecto en el resumen, pero no definen esa distinción ni cuándo reintentar tras un fallo.
4. **Mes sin fechas disponibles:** cuando no haya una fecha de visionado utilizable, por ejemplo una obra antigua consultada offline sin migrar, ¿cómo se comunica su exclusión o imposibilidad de asignarla a un año? D13 impide migrar offline; no se inventará una fecha.
5. **Igualdad alfabética:** si se necesita resolver diferencias de mayúsculas, acentos o nombres equivalentes en D8/D9, ¿qué convención de comparación debe aplicarse? Se conserva el desempate alfabético aprobado, sin añadir una normalización nueva.
6. **Cuenta sin copia local y sin conexión:** ¿cuál es el mensaje específico para el resumen sin una copia disponible? El Proyecto 3 distingue esta situación de una lista vacía; no se presentará como un año verificado sin obras.

## Nota para la demo

Para mostrar un año vacío sin contradecir D4, el año actual puede estar vacío y la cuenta de prueba puede tener obras vistas en un año anterior. El selector ofrecerá el año anterior por sus obras y el actual porque D4 siempre lo incluye. Así se puede mostrar el resumen con datos y volver al año actual vacío, con «Ir a Mi lista», sin introducir años vacíos arbitrarios en el selector ni cambiar las reglas.

Esta es una preparación posible de la cuenta de demostración, no una afirmación de que los datos o las pruebas de la demo ya existan. La forma de preparar esos datos se resolverá en las etapas posteriores.

## Verificación documental

Se cotejaron las trece reglas con el enunciado original: D1–D13 están presentes y numeradas, sin omisiones. Se conservan fecha de servidor y migración única, hora local del teléfono, años del selector, diferencias entre películas/series, progreso secuencial y datos faltantes, precisión de horas, todos los desempates indicados, doce meses, invitación a calificar, estado vacío y restricciones offline.

No se fija un tercer desempate para D11 ni se aprueban respuestas a los puntos abiertos. Las historias se incluyen solo como referencias; no se han creado criterios de backlog, diseño o spec técnica. Esta verificación es documental, no evidencia de implementación o de pruebas de la épica.
