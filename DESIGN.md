# Sistema de diseño — Mi Cartelera Personal

Fuente visual: [brand board aprobado](docs/diseno/brand-board.html), commit `14ec558`. La estudiante confirmó su revisión visual y aprobación en esta conversación. Referencias de producto: [PRD](docs/prd/01-mi-anio-en-cine.md), [backlog](docs/backlog/01-mi-anio-en-cine.md) y [brief](docs/diseno/BRIEF.md). Este documento traduce las decisiones del board a instrucciones; no implementa componentes ni modifica D1–D13.

## Principios

1. **Cinematográfica:** fondo oscuro, acento lila y pósteres conectan los datos con las historias.
2. **Cercana:** el resumen ayuda a reconocer hábitos y redescubrir una favorita, sin parecer un reporte administrativo.
3. **Clara:** total de obras primero, actividad mensual fácil de leer y obra destacada con póster como cierre. No todo tiene la misma jerarquía.
4. **Continua:** conservar pestañas, navegación, patrones de tarjetas, botones, estados y estrellas existentes. El logo TMDB es un crédito secundario, no la marca principal.
5. **Honesta:** distinguir vacío, fallo, ausencia de conexión y datos incompletos. No inventar datos ni presentar una copia como sincronización confirmada.

## Tokens de color

Los nombres y valores siguientes proceden del board aprobado. Los tokens de código se crearán más adelante en `src/tema/`; hoy `src/theme/` es el tema heredado y su migración queda pendiente.

| Token      | Valor   | Uso                                               |
| ---------- | ------- | ------------------------------------------------- |
| fondo      | #0B1020 | Fondo de pantalla; texto oscuro sobre botón lila. |
| superficie | #171E32 | Tarjetas y controles secundarios.                 |
| acento     | #B7A0FF | Acción principal, foco y datos clave.             |
| texto      | #F5F6FA | Títulos y contenido principal.                    |
| secundario | #AAB3C7 | Contexto y etiquetas.                             |
| borde      | #303A54 | Separadores decorativos; no usar como texto.      |
| por-ver    | #AAB3C7 | Etiqueta Por ver.                                 |
| viendo     | #F3C77C | Etiqueta Viendo.                                  |
| vista      | #92D7B5 | Etiqueta Vista.                                   |
| error      | #FF9FAE | Texto y señal de error.                           |

### Contrastes conservados

Valores de la tabla del board, calculados mediante luminancia relativa sRGB y redondeados a dos decimales. Todas las combinaciones declaradas superan el mínimo de 4,5:1 para texto, incluso grande. Mínimo: 7,48:1. El borde decorativo no se propone como color de texto. No extrapolar esta tabla a fondos, transparencias o combinaciones distintas.

| Texto                        | Fondo              | Relación |
| ---------------------------- | ------------------ | -------- |
| texto #F5F6FA                | fondo #0B1020      | 17,53:1  |
| secundario #AAB3C7           | fondo #0B1020      | 9,00:1   |
| acento #B7A0FF               | fondo #0B1020      | 8,55:1   |
| texto #F5F6FA                | superficie #171E32 | 15,33:1  |
| secundario / por-ver #AAB3C7 | superficie #171E32 | 7,87:1   |
| acento #B7A0FF               | superficie #171E32 | 7,48:1   |
| viendo #F3C77C               | superficie #171E32 | 10,46:1  |
| vista #92D7B5                | superficie #171E32 | 9,94:1   |
| error #FF9FAE                | superficie #171E32 | 8,53:1   |
| fondo #0B1020                | acento #B7A0FF     | 8,55:1   |
| error #FF9FAE                | fondo #0B1020      | 9,76:1   |

La aprobación visual la aportó la estudiante. La comprobación local previa del agente cubrió estos pares declarados y construcción en DOM simulado; no fue una inspección visual automatizada. La verificación de contraste y accesibilidad de la app implementada se hará en su etapa correspondiente.

## Tipografía

Fuente del sistema, sin descargar una familia externa: system-ui, Apple, Segoe UI o equivalente de la plataforma. Mantener jerarquía y legibilidad, no imponer una fuente web a React Native.

| Uso del board                 | Tamaño / interlínea de referencia | Peso                           |
| ----------------------------- | --------------------------------- | ------------------------------ |
| Título de pantalla            | 32 / 39                           | 800                            |
| Título en maqueta de teléfono | 30; 28 en vista estrecha          | 800, heredado de título        |
| Sección                       | 24 / 30                           | 700                            |
| Título de tarjeta             | 18 / 25                           | Negrita de encabezado          |
| Cuerpo                        | 16 / 26                           | Regular                        |
| Etiqueta                      | 13 / 20                           | Según jerarquía del componente |
| Auxiliar y meses              | 12 / 17                           | Regular                        |
| Dato de tarjeta               | 22 / 28                           | 750 en el board                |
| Dato expresivo                | 48 / 53                           | 800                            |
| Total protagonista            | 64 / 70                           | 800                            |

El wordmark tiene 26 en el encabezado del board y 20 en el teléfono. Los valores de interlínea anteriores se conservan como referencias publicadas en el board; algunos estilos HTML emplean factores relativos. La adaptación a plataforma se concretará en tokens/spec sin alterar decisiones visuales sin revisión. El titular editorial de 40–76 y el marco del board son recursos de presentación del documento, no tokens de pantalla de la app.

## Espacios, radios y objetivos táctiles

| Token         | Valor del board       |
| ------------- | --------------------- |
| esp-1         | 4                     |
| esp-2         | 8                     |
| esp-3         | 12                    |
| esp-4         | 16                    |
| esp-5         | 24                    |
| esp-6         | 32                    |
| esp-7         | 48                    |
| radio-control | 14                    |
| radio-tarjeta | 16                    |
| radio-poster  | 18                    |
| radio-pildora | 999, forma de píldora |
| tactil        | Mínimo 44 × 44        |

Las medidas del HTML están en px; su traducción a unidades de la app se verificará en dispositivo. Conservar el ritmo 4–48 para separación y agrupación. El marco ilustrativo del teléfono mide 390 px, adaptable al ancho disponible; no es un ancho obligatorio de pantalla. No copiar como tokens de producto los márgenes editoriales, bordes del marco o tamaños decorativos del board.

## Componentes

### Existentes que se conservan

| Componente         | Reglas visuales y de interacción                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tarjeta de obra    | Superficie, borde decorativo, esquinas redondeadas, póster y título con contexto. Mantener alternativa «Sin imagen» y etiqueta accesible si falta o falla el póster.                                                |
| Selector de estado | Por ver, Viendo y Vista con texto, color correspondiente y borde de selección; no depender solo del color. Conservar sus transiciones y validaciones.                                                               |
| Estrellas          | Acento, objetivos de 44 × 44, etiqueta y selección comprensibles. Disponibles solo en Vista, sin sustituir la calificación personal por TMDB.                                                                       |
| Botón              | Primario: fondo acento y texto fondo. Secundario: superficie y texto principal. Etiqueta de acción explícita, foco visible y estado deshabilitado identificable; no reducir contraste por opacidad sin verificarlo. |

### Nuevos de la épica

| Componente          | Reglas visuales y contenido                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tarjeta de dato     | Superficie y etiqueta secundaria; valor de mayor jerarquía. Total de obras protagonista, desglose de películas/series cercano. Horas etiquetadas como cine de películas.                                           |
| Barras mensuales    | Doce meses legibles, incluidos los de cero; valor visible y descripción accesible. Barras sencillas con View en la futura app, sin librería de gráficas. Mes más activo según D10, no por una elección decorativa. |
| Obra destacada      | Cierra el resumen con póster, título y calificación personal. No confundir arte ilustrativo con póster oficial ni dato ficticio con historial real. Sin calificadas, invitar a calificar según D11.                |
| Selector de año     | Etiqueta explícita, valor seleccionado legible y objetivo táctil. Solo años de D4; abrir en el actual. La muestra de 2026 no fija el año de la app.                                                                |
| Estados de pantalla | Carga, vacío, error, sin conexión y datos incompletos con mensajes diferenciados. Mostrar progreso de enriquecimiento y avisos sin sustituirlos por un vacío engañoso.                                             |

Los controles deshabilitados del board son muestras sin persistencia; no se trasladan como funcionalidad simulada a la app. Su aspecto sirve como referencia visual, no como contrato técnico de acciones.

## Pantallas y composición

- **Mi año en cine:** conservar navegación por pestañas; identificar la pantalla y el año. Orden aprobado: total y desglose primero; tarjetas de horas, género, director y mes más activo; actividad de doce meses; obra destacada con póster como cierre. Adaptar a anchos reales sin recortar contenido o convertir el marco de 390 en un ancho fijo.
- **Vacío:** mensaje breve y botón «Ir a Mi lista» de D12. La demo puede usar el año actual vacío y obras en un año anterior, sin añadir otros años vacíos al selector.
- **Carga/enriquecimiento:** anunciar carga y progreso de una obra en una; no mostrar el año como confirmado vacío mientras carga.
- **Error, offline e incompleto:** comunicar el estado correspondiente. Offline usa la copia local y no migra ni completa datos. Faltas de duración, directores y datos de obras siguen sus reglas y no anulan el total indebidamente.
- **Pantallas del Proyecto 3:** conservar Buscar, Mi lista, Acerca de, Login/Registro, Detalle y Editar. La migración futura a src/tema/ no rediseña por iniciativa del agente estos recorridos. Mantener atribución y logo TMDB oficial con menor prominencia que Mi Cartelera.

## Voz

Español breve, natural y cercano, sin tono administrativo. Una acción clara cuando corresponda; no inventar políticas de reintento o decisiones de producto mediante un texto.

| Estado            | Ejemplo aprobado en el board                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Carga             | «Estamos preparando tu año en cine».                                                                            |
| Vacío             | «Todavía no tienes obras vistas este año». Botón «Ir a Mi lista».                                               |
| Error             | «No pudimos cargar tu resumen».                                                                                 |
| Sin conexión      | «Estás viendo tu última copia guardada».                                                                        |
| Datos incompletos | «2 obras siguen sin datos. El total sí las incluye». El número es ilustrativo y debe proceder del cálculo real. |

Mantener mensajes específicos para películas sin duración, directores insuficientes e invitación a calificar según el PRD. Los textos aún no definidos se revisan antes de considerarlos aprobados. La atribución TMDB mantiene su aviso oficial en inglés junto al contexto español.

## Accesibilidad

- Contraste de todo texto de al menos 4,5:1 sobre su fondo real, también si es grande. No colocar texto sobre pósteres, gradientes o transparencias sin verificarlo.
- Objetivos táctiles de al menos 44 × 44, foco visible en web y navegación accesible en la plataforma. El board usa contorno de foco acento de 3 px con separación de 4 px.
- Estado, error, calificación y actividad se entienden por texto/etiquetas, no solo por color, altura o una estrella dibujada.
- Las doce barras tienen meses y valores; exponer una descripción accesible del conjunto. Pósteres y logo conservan alternativas de imagen.
- Mantener safe areas, manejo del teclado, posibilidad de recorrer contenido largo, texto ampliado y etiquetas para controles. La aprobación del board no implica que lector de pantalla o experiencia móvil ya estén probados.

## Sí y no

| Sí                                                            | No                                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Priorizar el total y cerrar con una historia destacada.       | Dar el mismo peso visual a todas las cifras.                               |
| Reutilizar tarjetas, pósteres, controles y navegación.        | Cambiar a Expo Router o rediseñar recorridos por iniciativa propia.        |
| Usar tokens de src/tema/ cuando se implementen.               | Dejar colores hexadecimales en pantallas o mantener dos fuentes de tokens. |
| Identificar películas, series, horas y calificación personal. | Sumar horas de series o confundir puntuación TMDB con la personal.         |
| Mantener doce meses, ceros y reglas de desempate.             | Ocultar meses sin obras o elegir ganadores por conveniencia visual.        |
| Explicar carga, error, vacío, offline e incompleto.           | Convertir datos desconocidos o errores en un resumen vacío confirmado.     |
| Mantener datos ficticios claramente etiquetados en maquetas.  | Presentar los ejemplos del board como datos reales de la cuenta.           |
| Conservar marca principal y crédito TMDB secundario.          | Redibujar el logo TMDB o darle más protagonismo que a Mi Cartelera.        |

## Sensor de colores y adopción pendiente

El sensor Vitest recorrerá archivos de código de src/ y detectará literales hexadecimales de 3, 4, 6 u 8 dígitos fuera de src/tema/. Debe informar archivo y línea de cada aparición. src/theme/ NO es una excepción. En este hito se espera rojo por los colores heredados: no se moverán ni cambiarán para que pase. La migración a tokens se hará en el hito previsto, guiada por la spec técnica posterior. No se desactiva el sensor ni se confunde este rojo esperado con un fallo de la regla de calificación.

## Decisiones pendientes

- **PA-01:** tercer desempate de obra destacada con igual calificación y vistaEn.
- **PA-02:** tratamiento de obras antiguas sin actualizadoEn utilizable.
- **PA-03:** distinción de metadatos ausentes frente a vacíos/null legítimos y política de reintento de enriquecimiento.
- **PA-04:** comunicación de obras sin fecha utilizable, especialmente offline sin migrar.
- **PA-05:** convención de mayúsculas, acentos y equivalencias para desempates alfabéticos.
- **PA-06:** mensaje específico del resumen offline sin copia disponible.

Se conservan abiertos como en el PRD/backlog. También queda para la spec/tokens posteriores concretar la adaptación de medidas y pesos de fuente a plataformas, sin alterar el board aprobado sin revisión. No se fija aquí solución ni valor nuevo para esas decisiones.
