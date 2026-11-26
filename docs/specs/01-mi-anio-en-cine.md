# Spec técnica — Mi año en cine

Estado: borrador para revisión, sin código ni tests nuevos de dominio. Fecha: 25 de noviembre de 2026. No autoriza implementación o publicación de reglas.

## 1. Fuentes y trazabilidad

- [PRD](../prd/01-mi-anio-en-cine.md), commit `bac23eb`: reglas D1–D13 y seis puntos abiertos.
- [Backlog](../backlog/01-mi-anio-en-cine.md), commit `ed792f2`: 25 criterios y ocho tickets.
- [DESIGN.md](../../DESIGN.md), commit `a5e5944`; [brand board aprobado](../diseno/brand-board.html), `14ec558`.
- Sensor de colores: `5a1a397`. Se conserva su fallo esperado con seis hallazgos en src/theme/index.ts, sin excepcionar ese directorio.
- [Especificación del Proyecto 3](../ESPECIFICACION.md) y [auditoría](../AUDITORIA.md), `fe70372`.

Los contratos y mecanismos siguientes son propuestas técnicas para revisar, no decisiones nuevas de producto. PA-01–PA-06 mantienen abiertos los resultados no definidos por el cliente; una función descrita aquí no puede resolverlos por orden de llegada, ID, fecha actual o cualquier fallback no aprobado.

## 2. Alcance y exclusiones

Añadir una pestaña autenticada «Mi año en cine» con selector, total/desglose, horas de películas, género/director, actividad mensual y destacada. Registrar transiciones de fecha D1; migrar fechas D2 y completar metadatos D6. Calcular offline desde la copia propia sin efectos remotos. Conservar RF1–RF10, aislamiento por uid y recorridos existentes.

Quedan fuera revisionados, horas/directores de series, seguimiento por episodios, funciones sociales, exportación, edición manual de fechas, rediseño no aprobado y políticas de reintento no especificadas. No cambiar Firebase/TMDB, leer .env ni ampliar permisos de listas. No introducir una librería de gráficas. Los datos ficticios del board no entran en Firestore ni en cálculos reales.

## 3. Modelo de datos y compatibilidad

### 3.1 Persistencia remota

Conservar `usuarios/{uid}/mi_lista/{tipo}_{tmdbId}` y todos los campos actuales. Añadir exclusivamente los cuatro campos del enunciado:

| Campo       | Documento nuevo                                          | Documento anterior y lectura                                                                                   |
| ----------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| vistaEn     | Timestamp o null; nueva entrada Por ver inicia con null. | Puede no existir o ser null. No fabricar fecha al decodificar. Migración D2 solo cuando corresponda y online.  |
| generos     | Lista de nombres en español; máximo 10 textos.           | Puede no existir. Preservar la diferencia entre campo ausente y lista presente vacía hasta resolver PA-03.     |
| duracionMin | Entero 1–1000 o null. En series siempre null.            | Puede no existir. null legítimo de TMDB no se convierte en duración cero.                                      |
| directores  | Lista de hasta 10 textos. En series vacía.               | Puede no existir. No asumir por defecto que una lista vacía demuestra fallo o enriquecimiento completo: PA-03. |

Se conservan tipo movie/tv, estado por_ver/viendo/vista, calificación null o entero 1–5 solo en Vista, comentario máximo 500, fechas de servidor y metadatos originales de la obra. No añadir un campo remoto de «enriquecido» para resolver PA-03 sin aprobarlo.

### 3.2 Tipos y validadores

- Ampliar los tipos reales `ListaItem`, `ObraLista`, `Detalle`, `EntradaFirestore` y `NuevaEntradaFirestore` según su responsabilidad. No renombrar todo el proyecto a ItemLista por la firma sugerida del enunciado.
- Los tipos Firestore utilizan Timestamp/FieldValue; la copia serializable usa ISO8601 o null para vistaEn. Las entradas heredadas conservan opcionalidad de los campos nuevos; el contrato de creación exige su presencia. Una actualización de estado no puede borrar metadatos por reconstruir el documento desde un formulario parcial.
- Validación externa desde unknown, sin any o coerciones. Separar sobre/entrada heredada de entrada ampliada para aceptar documentos anteriores y campos nuevos permitidos, rechazando extras desconocidos. Ampliar el esquema exacto de src/utils/lista.ts: su lista actual de diez campos no acepta los nuevos por sí sola.
- No convertir ausencia de fecha en la fecha del sistema. Los Timestamp inválidos o la falta de actualizadoEn pertenecen a PA-02/PA-04; no fijar aquí una respuesta visible ni una política de descarte silencioso.

### 3.3 Copia local y cambio de cuenta

Propuesta técnica: sobre v2 y clave `cartelera:lista:v2:{uid}` para la nueva copia, sin sobrescribir a ciegas la v1. Leer primero v2 validada y, si no existe, recuperar la v1 con su validador legado; conservar versión/uid/savedAt/items. Reutilizar v1 no significa asignar vistaEn ni inventar datos TMDB. Una conversión de formato local no ejecuta migraciones de Firestore.

Escribir v2 solo con datos válidos, mediante las colas por uid y generación ya existentes. No eliminar la última copia válida por error remoto, fallo de enriquecimiento o error al persistir una nueva. Actualizar savedAt solo tras guardar correctamente. Preservar marcador de operaciones inciertas y su reconciliación, sin anunciar éxito por timeout. El fallo de una obra TMDB no destruye el resto de la lista.

Cambiar de cuenta crea un controlador nuevo y vacía estado visible, resumen y progreso inmediatamente. Todas las respuestas y escrituras comprueban uid/generación vigente. Una tarea antigua no puede actualizar la nueva cuenta. El comportamiento de resumen cuando solo hay obras heredadas sin fecha o ninguna copia no queda aprobado: PA-04/PA-06.

## 4. Contratos del dominio puro

La lógica vive en `src/dominio/resumenAnual.ts`, sin React, Firebase, AsyncStorage, peticiones ni acceso al reloj. Los siguientes son contratos propuestos en documentación, no archivos de implementación.

### 4.1 Entrada y adaptación temporal

Para no depender del reloj o la zona implícita de la máquina, se propone una proyección `ItemResumen` de cada entrada de lista:

| Propiedad lógica | Contrato                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| entrada          | ListaItem ampliado serializable, con sus metadatos personales originales.                                                                                                                                          |
| visionadoLocal   | null o `{anio, mes, instanteMs}`; mes 0–11. Derivado de vistaEn mediante la hora local actual del teléfono en el adaptador, nunca del estreno o alta.                                                              |
| estadoMetadatos  | Estado de trabajo en memoria: completos, pendientes o fallo. El fallo de una petición es conocido; el criterio de completitud de vacíos/null legítimos queda bloqueado por PA-03. No es un quinto campo Firestore. |

El adaptador temporal interpreta el instante persistido en la zona local del teléfono; no sustituye un instante por otro. Las pruebas inyectan una zona/proyección controlada y un año actual explícito. Si el teléfono cambia de zona se debe recalcular la proyección de ese instante, no guardar un año fijo en Firestore. No escribir una fecha nueva como efecto de lectura o render.

### 4.2 Funciones públicas propuestas

| Función                                                              | Entrada y salida                                                             | Invariantes                                                                                                                                                  |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| aniosDisponibles(items: ItemResumen[], anioActual: number): number[] | Año actual recibido como dato y proyecciones de obras.                       | Años locales con obras actualmente Vista más actual, únicos y descendentes. No agregar otros años vacíos. No consultar new Date() sin argumento.             |
| resumenAnual(items: ItemResumen[], anio: number): ResumenAnual       | Proyecciones y año seleccionado; devuelve el contrato siguiente.             | No muta entradas ni persiste. Cada obra válida cuenta una vez por tipo+ID, sin revisionados. Solo Vista del año local solicitado.                            |
| planificarCambioVista(estadoAnterior, estadoNuevo, vistaEnAnterior)  | Orden lógica: conservar valor, limpiar a null o solicitar fecha de servidor. | No crea timestamps ni lee el reloj. El servicio materializa la orden en una transacción. La migración D2 es una operación distinta de una edición ordinaria. |

Para planificar transiciones: no Vista→Vista solicita serverTimestamp; Vista→no Vista limpia; Vista→Vista conserva la fecha, incluso al editar comentario/calificación. Volver a Vista después de salir pide un instante nuevo. Se sigue limpiando la calificación fuera de Vista mediante la regla existente.

`ResumenAnual` devuelve: anio, totalObras, peliculas, series, horas con un decimal, peliculasSinDuracion, obrasSinDatos, generoTop y directorTop como `{nombre, obras}` o null, obrasPorMes con doce posiciones, mesTop como índice o null, y destacada como entrada original o null si no hay calificadas. Sin datos para un top no se inventa un ganador. La representación de un empate completo de destacada no está cerrada por esta forma de retorno: PA-01 debe resolverse antes de implementar ese caso, sin usar null como solución aprobada por defecto.

### 4.3 Reglas de cálculo verificables

- D3: filtrar por estado Vista y año calendario local de visionado. Los casos sin fecha utilizable no se clasificarán por conveniencia: PA-02/PA-04 bloquean esa rama.
- D7: sumar duraciones de películas elegibles y dividir minutos por 60, mostrando un decimal. Series cuentan en obras, no horas. Las películas sin duración no suman y se cuentan para el aviso. La UI formatea la cifra con coma en español; no usa la duración de episodios.
- D8: una obra aporta 1 a cada género suyo. Orden de ganadores: número de obras, promedio personal entre calificadas (sin calificadas pierde), alfabético. null no entra como cero en el promedio. No añadir normalización de acentos/mayúsculas antes de PA-05.
- D9: mismo procedimiento para directores, solo películas. Varios directores de una película reciben su contribución; series no participan. Sin director disponible se devuelve ausencia y la presentación comunica datos insuficientes.
- D10: doce meses, ceros incluidos; máximo por conteo y empate a favor del mes más reciente. Nunca truncar el gráfico a los meses activos.
- D11: mayor calificación personal y después mayor instante de visionado. Sin calificadas se devuelve ausencia para invitar a calificar. No desempatar por ID, título u orden del array en el caso pendiente PA-01.
- D6: una obra cuyo enriquecimiento falla sigue en el total y su desglose; no aporta a horas, género o director. Se cuenta en obrasSinDatos. No se confunde ese conteo con peliculasSinDuracion: no toda obra sin datos es una película y null legítimo de duración no demuestra fallo TMDB.
- D12/D13: resumen sin obras permite el vacío cuando se puede determinar; el cálculo no inicia peticiones ni migraciones. Un año offline se deriva exclusivamente de la copia propia disponible. PA-04/PA-06 impiden etiquetar desconocimiento como vacío confirmado.

## 5. Servicios, Context y estados

| Capa existente                      | Cambio propuesto y límites                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tmdbService                         | Ampliar obtenerDetalle para exponer nombres de géneros en español, duración de película y directores de credits. En TV devolver duración null/directores vacíos. Conservar Bearer, language=es-ES, timeout, abort y errores seguros; las pantallas no hacen fetch. La actualización de datos usa este servicio. |
| listaService                        | Mantener obtener/agregar/actualizar/eliminar y transacciones de dueño. Agregar persiste los metadatos nuevos. Actualizar aplica D1 con snapshot de transacción. Incorporar operaciones acotadas para fecha heredada y metadatos, sin sobrescribir datos personales.                                             |
| Controlador/orquestador del resumen | Usar uid real y sesión vigente; coordinar migración D2, lectura y cola secuencial D6 del año elegido. Exponer progreso y fallos, sin calcular ganadores en pantallas. Puede ser un servicio adicional separado del controlador de lista si evita mezclar responsabilidades.                                     |
| CarteleraContext / hooks            | Exponer año seleccionado, petición de resumen, progreso, avisos y acciones; conservar limpieza por cuenta. Inicializar el año actual desde el adaptador exterior al dominio, no de un ejemplo fijo del board.                                                                                                   |
| cacheService / listaController      | Adaptar versión y validadores de caché, conservar colas, timeout, guardas y copia previa. Una mutación confirmada o enriquecimiento persistido debe reconciliar lista y copia. Un timeout no cancela un commit Firebase.                                                                                        |

El estado de petición reutiliza la unión discriminada inicial/cargando/error/exito; conexión, copia disponible, progreso y número sin datos son información adicional, no resultados de éxito inventados. Carga no es vacío; un fallo parcial TMDB no convierte todo el resumen en fallo fatal; un error que impide calcular se distingue del resultado incompleto. No cerrar aquí la interacción de reintento pendiente en PA-03 ni el texto sin copia de PA-06.

Al cambiar año o cuenta se invalidan respuestas y progreso antiguos. Cancelar TMDB aborta la petición cuando sea posible; un commit Firestore enviado puede terminar y se reconcilia por las reglas existentes. Los datos se muestran solo en la cuenta propietaria.

## 6. Transacciones y migraciones

### 6.1 D1 y alta con metadatos

La transacción de actualización vuelve a leer estado y vistaEn actuales, calcula la transición y actualiza solo campos editables y fechas permitidas. Al entrar en Vista usa serverTimestamp para vistaEn; al salir, null; sin transición, mantiene el valor. actualizadoEn mantiene su política de serverTimestamp. Esto evita basarse exclusivamente en un estado viejo del formulario.

La creación conserva ID determinista, estado Por ver, calificación null y comentario vacío; vistaEn null y metadatos D5 con restricciones por tipo. Mantener la lectura transaccional de existencia: agregar una entrada ya existente no escribe ni restablece sus datos o fechas. Los casos de datos TMDB legítimamente ausentes no se sustituyen por valores inventados; PA-03 delimita completitud.

### 6.2 D2: fechas de obras heredadas

Al abrir la pestaña con conexión, localizar obras Vista sin vistaEn, sin limitar esta migración al año elegido. Para cada candidata, la transacción vuelve a comprobar estado y ausencia de fecha. Si ya recibió fecha o dejó de estar Vista, no reasignarla. Si actualizadoEn es válido, escribir como vistaEn exactamente su valor anterior, no el momento de apertura.

Conservar el resto de los datos personales. Si se actualiza actualizadoEn por la política del Proyecto 3, capturar primero el timestamp anterior para el fallback D2; no usar el timestamp nuevo de esa escritura. Persiste una sola vez por la condición de ausencia; no requiere una bandera remota adicional. Si faltan fechas válidas, PA-02 impide inventar la solución. Sin conexión no se ejecuta D2 ni se simula su persistencia.

### 6.3 D6: completar metadatos

Después de disponer de fechas y año elegido, seleccionar solo obras Vista de ese año con datos pendientes según la clasificación aprobada. La distinción de ausencia/vacío legítimo permanece bloqueada por PA-03; no se implementa una condición arbitraria «array vacío = pedir otra vez».

Procesar de una en una y mostrar progreso de procesadas/total de candidatas. Obtener detalle TMDB y persistir solo campos nuevos de metadatos mediante transacción que vuelva a comprobar cuenta y entrada vigente; no recrear una entrada eliminada ni sobrescribir comentario, calificación o estado. Si cambió de estado/año durante la petición, reevaluar antes de escribir; detener la cola antigua al invalidarse la selección.

Una petición fallida deja la entrada disponible, registra el fallo en el estado de trabajo y actualiza el número sin datos; continúan las otras candidatas de esa ejecución. No se añaden reintentos ilimitados o una política de próxima ejecución no aprobada. Una escritura incierta no se anuncia completada: respetar el bloqueo/reconciliación ya existente. Si falla la persistencia, no tratar el estado remoto como confirmado.

Sin conexión no se consulta TMDB ni se escribe por D2/D6. La copia puede aportar un resumen parcial ya existente; las ramas sin fechas o sin copia requieren PA-04/PA-06.

## 7. Reglas Firestore propuestas

Modificar solo firestore.rules cuando se autorice la implementación. En esta tarea no se cambia ni publica. Reglas nuevas deben aceptar documentos antiguos y nuevos sin abrir el acceso.

- Mantener propietario no anónimo, UID de ruta igual al usuario, denegación de listas ajenas y fallback de denegación total. Mantener todo el esquema/validaciones del Proyecto 3.
- hasAll conserva los campos antiguos obligatorios; hasOnly admite además los cuatro campos nuevos, sin extras arbitrarios. Nueva creación por la app exige el contrato nuevo; edición de documento antiguo no obliga a inventar metadatos para guardar un comentario.
- Leer campos nuevos con get(campo, valorPorDefecto) para validar ausencia legada. vistaEn es null o Timestamp y solo puede ser no null si estado es Vista. generos/directores son listas de máximo 10 textos, no solo listas de elementos de tipo libre; validar cada posición posible de la lista acotada. duracionMin es null o entero positivo hasta 1000. En series: null y directores vacíos.
- Creación: conservar fechas de servidor, defaults del Proyecto 3 y vistaEn null. No permitir saltarse Por ver ni crear una nota personal arbitraria como alta inicial.
- Actualización de usuario: conservar agregadoEn y metadatos originales tmdbId/tipo/titulo/anio/posterPath. actualizadoEn igual a request.time. Limitar affectedKeys a estado, calificación, comentario, actualizadoEn y los cuatro campos nuevos según la operación válida, no permitir cambios indiscriminados.
- Transiciones D1: no Vista→Vista exige vistaEn igual a request.time; Vista→no Vista exige null; Vista→Vista con fecha previa exige conservarla. Ediciones sin transición no deben resetear la fecha.
- Excepción delimitada D2: estando Vista sin fecha, permitir vistaEn igual al actualizadoEn anterior del documento para la migración. No permitir fechas históricas arbitrarias ni cambiar una fecha ya fijada. La distinción de una edición ordinaria sin fecha frente a la migración debe mantenerse en servicio y predicados de reglas, sin forzar D2 al editar un comentario.
- Enriquecimiento: permitir cambios solo en metadatos nuevos y actualizadoEn, con propietario, tipos y restricciones; no usar esta vía para modificar la fecha ni campos personales. Firestore puede validar forma y permisos, pero no certificar que un nombre realmente vino de TMDB: esa procedencia depende del servicio.
- Delete conserva requisito de dueño. Las operaciones nuevas no añaden permisos globales, lecturas cruzadas ni una cuenta de servicio en el cliente.

Pruebas de emulador deberán verificar combinaciones de operaciones: no basta probar cada condición individual. Incluir timestamp incorrecto, reasignación de vistaEn, duración -5/fraccionaria/fuera de rango, listas demasiado largas/con elementos no texto, claves extras, metadatos originales alterados, dueño/ajeno/anónimo y edición de un documento legado. Revisar reglas completas antes de cualquier publicación autorizada y distinguirla de resultados del emulador.

## 8. Interfaz y adopción de tokens

Leer [DESIGN.md](../../DESIGN.md) antes de tocar pantallas o componentes. Referenciar sus secciones Tokens de color, Tipografía, Espacios, Componentes, Pantallas y composición, Voz y Accesibilidad; no copiar valores nuevos en esta spec ni reinterpretar el board.

| Componente elegido de DESIGN.md                            | Uso en la épica                                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Selector de año                                            | Años exactos de D4, selección inicial actual y cambio del resumen/progreso correspondiente.                                               |
| Tarjeta de dato                                            | Total protagonista con películas/series; horas de películas, género, director y mes más activo.                                           |
| Barras mensuales                                           | Doce Views con etiquetas/valores, ceros incluidos y descripción accesible.                                                                |
| Obra destacada                                             | Póster y calificación personal como cierre; invitación si no hay calificadas. Reutilizar ImagenCatalogo para alternativa si falta imagen. |
| Estados de pantalla y botón                                | Carga, vacío, error, offline e incompleto; Ir a Mi lista navega a la pestaña existente. Mensajes faltantes esperan respuestas de PA.      |
| Tarjeta de obra, selector de estado y estrellas existentes | Conservar flujos que alimentan resumen y D1, sin duplicar reglas de negocio en la nueva pantalla.                                         |

Agregar una ruta de pestaña tipada, preservando native stack y grupos por sesión. La pantalla consume Context/hooks y dominio, nunca Firebase/TMDB directo. No se usan datos estáticos del board como contenido real.

Crear posteriormente src/tema/ como única fuente de valores de tokens. El tema heredado puede consumir esa fuente durante la migración, pero no retener sus propios hexadecimales. En el Hito 3 se preparan tokens y en Hito 4 se migran pantallas/estilos para hacer pasar el sensor, sin excluir src/theme/. La app debe cumplir safe areas, teclado, objetivos táctiles y accesibilidad de DESIGN.md en teléfono; el marco HTML no acredita eso.

## 9. Matriz de los 25 criterios → verificación concreta

Cada ID V es un caso planificado identificable para tests/documentación posteriores. Ninguno se ejecuta ni se declara aprobado en esta spec. Vitest usa código real de dominio o servicios aislados; emulador usa proyecto demo; teléfono requiere resultado humano. «Parcial/bloqueado» no significa sin trazabilidad: identifica una definición que falta para cerrar ese caso.

| Criterio | Caso y medio de verificación                                                                                                                 | Resultado a comprobar / límite                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-A1-01 | V01: Vitest de planificarCambioVista; emulador de transición Por ver→Vista; teléfono guardar.                                                | Solicitud pura de timestamp y persistencia de vistaEn de servidor, no reloj del cliente.                                                       |
| CA-A1-02 | V02: Vitest y emulador Vista→Por ver, Vista→Viendo y regreso a Vista.                                                                        | null al salir, nueva fecha al volver; sin segundo visionado, calificación limpiada.                                                            |
| CA-A1-03 | V03: emulador editar comentario/calificación con fecha conocida; Vitest orden conservar; teléfono editar.                                    | vistaEn idéntico antes/después.                                                                                                                |
| CA-A1-04 | V04: Vitest con respuestas TMDB movie/tv; emulador agregar y leer.                                                                           | Géneros españoles, límites, película con duración/directores, null legítimo y TV null/lista vacía; PA-03 bloquea clasificación de completitud. |
| CA-A2-01 | V05: Vitest con estados, tipos, estreno/alta diferentes y años locales.                                                                      | Solo vistas del año, una por clave tipo+ID y total igual al desglose. Fecha ilegible bloqueada por PA-02/PA-04.                                |
| CA-A2-02 | V06: Vitest de adaptación/proyección y dominio con instante cercano a medianoche de Año Nuevo y zona controlada; teléfono con zona conocida. | 1 de enero UTC que cae el 31 de diciembre local pertenece al año/mes local anterior.                                                           |
| CA-A2-03 | V07: Vitest con películas de 120 y 30 minutos, una sin duración y series; teléfono formato español.                                          | 2,5 h; no sumar series ni película sin duración; conteo específico visible.                                                                    |
| CA-A2-04 | V08: Vitest con una obra de varios géneros, películas y series.                                                                              | +1 por obra a cada género, gana mayor conteo.                                                                                                  |
| CA-A2-05 | V09: Vitest con empates de conteo, promedios distintos, sin calificadas y empate persistente.                                                | Orden conteo→promedio entre calificadas→alfabético; null no es cero. Convención lingüística de PA-05 pendiente.                                |
| CA-A2-06 | V10: Vitest de películas con codirectores, series y empates; teléfono sin directores.                                                        | Series excluidas; mismos tres desempates; ausencia de ganador y mensaje insuficiente cuando corresponda. PA-05 aplica.                         |
| CA-A2-07 | V11: Vitest con meses vacíos y dos máximos empatados; teléfono doce barras.                                                                  | Doce posiciones; cero preservado; gana el máximo más reciente.                                                                                 |
| CA-A2-08 | V12: Vitest con calificaciones personales distintas y empate con fechas distintas; teléfono destacada.                                       | Mayor personal y fecha más reciente, no TMDB. Empate completo bloqueado por PA-01, sin fallback por ID.                                        |
| CA-A2-09 | V13: Vitest sin calificadas; teléfono tarjeta.                                                                                               | Ausencia de destacada e invitación a calificar, sin seleccionar una al azar.                                                                   |
| CA-A3-01 | V14: Vitest años repetidos/anterior/actual y actual sin obras; teléfono apertura.                                                            | Unión exacta descendente y apertura en actual; no añadir otros años vacíos.                                                                    |
| CA-A3-02 | V15: Vitest cambiar año en orquestador con respuesta retrasada; teléfono seleccionar otro año.                                               | Todas las métricas/cola corresponden al elegido, respuesta vieja descartada. PA-02/PA-04 para fecha no utilizable.                             |
| CA-A4-01 | V16: emulador documento legado Vista con actualizadoEn conocido; teléfono primera apertura.                                                  | vistaEn igual al valor previo persistido, conserva personales, no fecha actual; PA-02 para origen inválido.                                    |
| CA-A4-02 | V17: emulador segunda apertura y cambio concurrente de estado/fecha.                                                                         | Ninguna reasignación si ya tiene fecha; no Vista no migra.                                                                                     |
| CA-A4-03 | V18: Vitest peticiones TMDB controladas, dos obras candidatas y otras de otro año/no vistas; emulador persistir; teléfono progreso.          | Nunca más de una obra en proceso, progreso visible y selección correcta. Detección completa de ausencia bloqueada por PA-03.                   |
| CA-A4-04 | V19: Vitest una respuesta TMDB fallida y otra exitosa.                                                                                       | Fallida mantiene total/desglose, excluye horas/género/director, conserva entrada y suma sin datos. Sin política de reintento no aprobada.      |
| CA-A5-01 | V20: Vitest lectura y enriquecimiento diferidos; teléfono abrir con demora controlada.                                                       | Carga/progreso distinguidos de vacío confirmado.                                                                                               |
| CA-A5-02 | V21: Vitest resumen vacío del año actual; teléfono navegación.                                                                               | Mensaje y botón Ir a Mi lista abren la pestaña; selector sigue D4.                                                                             |
| CA-A5-03 | V22: Vitest fallo de lectura/cálculo bloqueante frente a fallo TMDB de una obra; teléfono estado error.                                      | Error global distinto de incompleto/vacío; no afirmar sincronización. Interacción final dependiente de PA-03 cuando incluya reintentos.        |
| CA-A5-04 | V23: Vitest servicios espía con copia y offline; teléfono modo avión y reinicio con sesión.                                                  | Cálculo local, aviso, cero peticiones de enriquecimiento o escrituras de migración; sin mezclar cuentas.                                       |
| CA-A5-05 | V24: Vitest obra fallida, película sin duración y ninguna con director; teléfono avisos.                                                     | Conteos distintos de sin datos/sin duración, total conservado y mensaje por tarjeta; no deducir fallo de null legítimo (PA-03).                |
| CA-A5-06 | V25: casos planificados de sin copia offline y fecha heredada inválida; Vitest + teléfono tras respuesta del cliente.                        | BLOQUEADO por PA-02/PA-04/PA-06. No hay resultado esperado aprobado salvo no inventar fechas, no migrar offline y no fingir vacío confirmado.  |

Hay 25/25 criterios con una verificación asignada. V25 y las ramas señaladas no pueden considerarse cobertura cerrada ni tests con un resultado de producto aprobado mientras sigan abiertos sus PA. La matriz no autoriza escribir esos tests todavía.

## 10. Puntos abiertos y bloqueos por ticket

| Punto | Pregunta conservada                                                                  | Tickets/casos bloqueados                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PA-01 | ¿Qué hacer con destacadas de igual calificación y mismo vistaEn?                     | T-DOM-01/02 y cierre T-UI-01/T-VER-02 para V12 en empate completo. Se pueden preparar otros casos, no cerrar el contrato total.                                                     |
| PA-02 | ¿Qué hacer si una obra antigua Vista no tiene actualizadoEn utilizable?              | Rama inválida de T-DAT-02 y T-DAT-03; V05/V15/V16/V25 y verificación final de esos casos.                                                                                           |
| PA-03 | ¿Cómo distinguir ausencia de metadatos de vacíos/null legítimos y cuándo reintentar? | Clasificación/cola de T-DAT-02/03, contrato de datos faltantes T-DOM-02 y estados T-UI-01; V04/V18/V22/V24. Los fallos explícitos de una petición en V19 sí están definidos por D6. |
| PA-04 | ¿Cómo comunicar y tratar obras sin fecha utilizable, especialmente offline?          | T-DAT-03, cálculo para esas entradas T-DOM-02 y UI; V05/V15/V25. No usar año actual para asignarlas.                                                                                |
| PA-05 | ¿Qué convención rige mayúsculas, acentos y nombres equivalentes en alfabético?       | Variantes lingüísticas de T-DOM-01/02 y V09/V10; no cambiar el orden de prioridades aprobado.                                                                                       |
| PA-06 | ¿Cuál es el mensaje del resumen sin copia offline?                                   | Rama sin copia de T-DAT-03/T-UI-01 y V25/T-VER-02. Conservar distinción sin copia frente a lista vacía.                                                                             |

Todos siguen sin respuesta aprobada. No se decide por su cuenta ni se cambia el PRD/backlog para ocultarlos. El bloqueo de una rama no impide especificar las ramas ya definidas, pero sí impide declarar totalmente terminado el ticket que la incluye.

## 11. Orden de tickets y entregas

1. Revisar y aprobar esta spec y consultar los PA que afecten al siguiente trabajo. La documentación debe estar en historial antes de los tests/código posteriores.
2. **T-DOM-01:** escribir y guardar primero tests de resumen/años/transiciones a partir de los casos aprobados, incluidos límites D3–D11. Registrar rojo por dominio aún ausente; no confundirlo con el rojo heredado del sensor de colores.
3. **T-DOM-02:** implementar dominio hasta pasar esos casos, sin UI ni servicios; cerrar contratos pendientes solo con respuesta del cliente.
4. **T-DAT-01:** tipos, servicios y reglas para campos/fechas; puede prepararse tras contratos de T-DOM-01 sin depender de la UI. Verificar en emulador antes de cualquier publicación autorizada.
5. **T-DAT-02:** D2/D6 sobre esos contratos y dominio; **T-DAT-03:** caché/Context/offline y sesiones después. Conservar requisitos y DoD del backlog.
6. Preparar **tokens src/tema/** según DESIGN.md en el Hito 3, como parte transversal de preparación de T-UI-01, sin duplicar fuentes de verdad. No migrar colores en esta tarea ni alterar tickets para dar por aprobado el sensor.
7. **T-UI-01:** interfaz y migración de estilos del Proyecto 3 en Hito 4. Entonces el sensor de colores debe pasar; no se salta ni se excluye src/theme/.
8. **T-VER-01:** integrar y verificar aislamiento, legado, reglas y offline. **T-VER-02:** teléfono, evidencias, auditoría final, README/IA y demo. Un emulador aprobado no acredita teléfono ni publicación real.

La cuenta de demo puede tener el año actual vacío y obras en el anterior, como ya permiten D4/D12. No añadir años vacíos al selector ni preparar datos reales sin la etapa autorizada.

## 12. Estado de esta entrega

Solo documentación técnica propuesta. No se escriben tests de dominio, no se crean tokens, no se migra código ni se cambia/publica Firestore. La suite actual conserva 28 pruebas aprobadas y el sensor de colores rojo con seis hallazgos en src/theme/index.ts; esta condición esperada se mantiene, no se corrige aquí. TypeScript y lint de la base revisada pasan. No se afirma ejecución de ningún caso V01–V25 de la nueva épica.

El documento se deja sin commit para revisión. No hay push ni lectura de .env.
