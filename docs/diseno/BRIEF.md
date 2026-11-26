# Brief de marca — Mi año en cine

Estado: propuesta para revisión de la estudiante. Referencias: [PRD](../prd/01-mi-anio-en-cine.md) y [backlog](../backlog/01-mi-anio-en-cine.md). Extensión prevista: una página.

## Público y propósito

Personas que usan Mi Cartelera para llevar registro de sus películas y series. El resumen anual les permite reconocer sus hábitos y redescubrir una obra favorita, sin sentir que están leyendo un reporte.

## Personalidad

**Cinematográfica, cercana y clara.** Los pósteres evocan las historias; los mensajes hablan con naturalidad; la jerarquía permite entender lo principal de un vistazo. Los datos acompañan el recuerdo de lo visto.

## Qué se conserva

El tema oscuro, el acento lila, los pósteres y las superficies con bordes redondeados mantienen la identidad actual. Se conservan las pestañas y la navegación de detalle/edición, los botones, selectores de estado y estrellas, junto con sus patrones de interacción. La atribución TMDB permanece visible como crédito de los datos, con menor protagonismo que la marca.

Se revisaron `src/theme/index.ts`, `src/navigation/AppNavigator.tsx` y `src/components/ImagenCatalogo.tsx`: confirman el tema oscuro y lila, los controles compartidos, la navegación existente y los pósteres con alternativa cuando falta imagen. Esta revisión no modifica esos archivos.

## Dirección visual

El **total de obras** abre el recorrido y se acompaña del desglose de películas y series. La **actividad mensual** debe resultar fácil de leer. La **obra destacada con su póster** cierra con un recuerdo personal. El año elegido y los demás datos del resumen deben comprenderse dentro de ese recorrido, sin competir todos por atención.

## Voz

Mensajes breves y naturales en español, con una acción clara cuando corresponda. Ejemplos de tono para revisar:

- Año vacío: «Todavía no tienes obras vistas este año». Botón **«Ir a Mi lista»**, según D12.
- Sin calificaciones: «Califica una obra para descubrir tu favorita del año».
- Error: «No pudimos cargar tu resumen»; la acción concreta se definirá sin inventar políticas de reintento.

## Siguiente decisión de diseño

Los valores de color, contrastes, tipografía, tamaños y espacios se definirán y verificarán en el brand board. Este brief no fija tokens ni aprueba una maqueta o decisiones técnicas.
