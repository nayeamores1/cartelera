# Tokens preparados — paso 15

Fuente: [DESIGN.md](../../DESIGN.md) y [brand board aprobado](../../docs/diseno/brand-board.html). Los nombres de colores, espacios y radios conservan los de las tablas. Los nombres de usos tipográficos identifican las filas de DESIGN, no introducen nuevos tamaños.

`index.ts` exporta colores, espacios, radios, tipografía de referencia y valores de accesibilidad (44 × 44 mínimo, contraste mínimo 4,5:1, foco de 3 con separación de 4). No importa React Native ni crea estilos; todavía no lo consume la app. `src/theme/`, sus imports y el sensor permanecen intactos.

## Coincidencias y límites

- Los diez colores y los siete espacios, cuatro radios y mínimo táctil coinciden con las variables CSS del board. Mayúsculas y minúsculas de un hexadecimal representan el mismo valor.
- Las parejas tamaño/interlínea conservan las cifras publicadas en las tablas y muestras textuales. El CSS usa también factores relativos: por ejemplo, 22 × 1,25 produce 27,5 frente a la referencia 28; 64 × 1,1 produce 70,4 frente a 70. No se sustituyen las referencias por esos resultados calculados ni se modifica el board.
- **Discrepancia pendiente:** DESIGN indica peso 800 para el título de teléfono. El HTML `.phone h2` solo fija el tamaño 30/28; `h2` no declara peso 800. No se elige un peso del teléfono en los tokens hasta aclarar la adaptación. Tampoco se inventa una interlínea para esas variantes.
- El dato de tarjeta conserva **750** como referencia del board. La adaptación a un peso de fuente nativo sigue pendiente; no se convierte automáticamente a 700 u 800. Los tokens tipográficos no son objetos `TextStyle` listos para propagar a un componente.
- «Negrita», «regular» y familia «sistema» conservan las decisiones semánticas del documento. No se fija una familia web como `fontFamily` móvil ni se inventa un peso de etiqueta.
- No se incluyen medidas editoriales del HTML, ancho fijo del teléfono, opacidades nuevas ni dimensiones de componentes no definidas por DESIGN. Las unidades de plataforma y accesibilidad en dispositivo se verificarán al implementar la interfaz.

Estos tokens no cambian PA-01–PA-06. La migración del tema heredado y sus seis colores detectados corresponden a una etapa posterior.

## Comprobación local del paso 15

Ejecutada por Codex el 26 de noviembre de 2026, con Node 24.22.1 y `EXPO_NO_DOTENV=1`, sin leer configuración local:

- Comparación puntual en Node contra las variables CSS y las tablas: 22 valores coincidentes (10 colores, 7 espacios, 4 radios y mínimo táctil); 10 pares tipográficos publicados, contando auxiliar y meses por separado. Foco 3/4 coincidente. La discrepancia de peso del teléfono queda documentada, no resuelta.
- Recálculo sRGB de los 11 pares de contraste publicados: coinciden al redondear a dos decimales, mínimo 7,48:1. No acredita contraste de pantallas implementadas ni pruebas en dispositivo.
- `npm test`: salida 1, 80 aprobadas (23 node:test y 57 Vitest). Único fallo esperado: sensor con seis colores heredados en `src/theme/index.ts`; ningún fallo nuevo.
- `npx tsc --noEmit`: salida 0.
- `npm run lint`: salida 0, sin errores ni advertencias.
- Prettier local aplicado únicamente a los dos archivos nuevos de `src/tema/`.

Los tokens no tienen consumidores aún. No se migraron imports, no se construyó una pantalla ni se modificó el sensor. Se dejan sin commit para revisión.

## Adaptación aprobada y adopción en el paso 16

La estudiante aprobó peso 700 para el título «Mi año en cine» el 26 de noviembre de 2026, registrado en DESIGN.md y el plan antes de implementar. tituloTelefono incorpora ese peso; no se fija una interlínea nueva. El 750 del dato de tarjeta sigue como referencia pendiente de adaptación: la implementación no lo convierte a otro peso ni lo fuerza con un cast. Las tarjetas conservan tamaño/interlínea 22/28; su peso final queda sin asignar hasta la decisión.

Los estilos heredados se trasladan sin cambiar sus valores a estilosHeredados.ts, que consume colores de index.ts. src/theme/index.ts queda como fachada de compatibilidad, sin colores propios. Los párrafos anteriores describen la preparación histórica del paso 15.
