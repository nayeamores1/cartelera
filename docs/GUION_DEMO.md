# Guion de demo — cinco minutos

Paso 20, preparación del 26 de noviembre de 2026. **Guion preparado; demo no ensayada ni cronometrada efectivamente.** Los tiempos siguientes son objetivos que suman 300 segundos. La verificación humana previa se conserva en [VERIFICACION.md](VERIFICACION.md) y no equivale a ensayar esta presentación.

## Preparación antes de empezar el cronómetro

- Abrir manualmente la app con `npm run dev`, Expo Go compatible con el SDK instalado y configuración local propia. No mostrar `.env`, claves o contraseñas en pantalla compartida. El agente no realiza este arranque ni accede a esas credenciales.
- Preparar cuenta A con datos inequívocos y una obra Por ver que pueda pasar a Vista. Elegirla durante el ensayo para conocer el resultado esperado sin inventar cifras; no resolver empates o datos pendientes mediante cambios de reglas.
- Preparar cuenta B de prueba **sin obras vistas** para mostrar el estado vacío del año actual. Verificar antes cómo acceder a ella dentro de los 30 segundos previstos; no se crea ni modifica una cuenta desde esta tarea documental.
- Tener abiertas las pestañas de editor para brand board, DESIGN, PRD D7, criterio CA-A2-03, test V07 y función resumenAnual. Los documentos y valores de la demo proceden de la rama local, no de una versión remota supuesta.
- Abrir el HTML autónomo `docs/diseno/brand-board.html` en el navegador y tener la terminal en la raíz de esta app con Node >=24.12.0 y dependencias instaladas. Usar una terminal separada de Metro para los tests.
- Ejecutar previamente, durante el ensayo humano: `npm test`, `npx tsc --noEmit` y `npm run lint`. No decir «acaban de pasar» usando solo un registro histórico. La salida verde actual y sus límites están documentados, pero no hay captura de npm test identificada entre las seis imágenes del registro; si la entrega la exige, obtenerla durante el ensayo y revisarla antes de versionarla.
- Dejar el árbol revisado y el índice sin archivos temporales. No hacer commits, push, instalaciones o despliegues como parte de la demostración del sensor. El archivo temporal propuesto no se crea en esta preparación.

## Los seis bloques del enunciado

| Tiempo    | Duración | Punto y acción prevista                                                                                                                                                                             | Mensaje y evidencia                                                                                                                                                                                                                                                                                                           |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:45 | 45 s     | **1. Brand board y una decisión visual.** Mostrar la maqueta y la paleta. Señalar total protagonista, tema oscuro/lila y cierre con una obra.                                                       | «El board aprobado alimentó DESIGN y los tokens. El título nativo tiene 700 aprobado; 750 sigue como referencia del dato, no como un peso nativo resuelto». Board `14ec558`, DESIGN `a5e5944`, aprobación `271b9ae`. No afirmar que toda la accesibilidad ya fue probada.                                                     |
| 0:45–1:30 | 45 s     | **2. Historial: spec y tests antes del código.** Mostrar git log y los tres commits centrales.                                                                                                      | «a927e17 contiene la spec; 3485e11 contiene los tests sin el archivo de implementación; 7b7e1c9 añade el dominio. La aprobación del plan/título 271b9ae también precede a b4b15e5». No atribuir el rojo del sensor al dominio.                                                                                                |
| 1:30–2:30 | 60 s     | **3. Marcar Vista y observar el resumen.** En cuenta A, abrir Mi lista, editar la obra elegida, pasar a Vista y guardar; volver a Mi año.                                                           | Mostrar el cambio de total/desglose correspondiente al año local, sin cifra fija inventada. Explicar D1 y que solo las películas aportan horas. Si aparece un PuntoAbiertoError, explicar el escenario pendiente; no ocultarlo como vacío ni afirmar D6 completo. Este recorrido exacto de la demo todavía debe ensayarse.    |
| 2:30–3:00 | 30 s     | **4. Estado vacío, adaptación explícita del punto «cambiar de año hasta uno vacío».** Acceder a cuenta B, que no tiene obras Vista, y abrir Mi año. Mostrar mensaje y botón Ir a Mi lista.          | «Esta cuenta demuestra el vacío del año actual. No es una demostración de cambio entre años: en Expo Go solo estaba disponible 2026 y el cambio no se probó». No añadir años vacíos al selector ni alterar D4 para aparentar el requisito literal. La adaptación se declara, no se cuenta como recorrido entre años aprobado. |
| 3:00–4:00 | 60 s     | **5. Provocar el sensor y retirar el cambio.** En terminal separada, crear el archivo temporal descrito abajo, ejecutar solo el sensor, mostrar ruta/línea; retirar el archivo y volver a ejecutar. | «El color fuera de src/tema/ falla aunque no se importe a una pantalla. El sensor queda intacto y no se versiona el ejemplo». Mostrar rojo esperado y luego verde solo si esas ejecuciones lo producen realmente.                                                                                                             |
| 4:00–5:00 | 60 s     | **6. Decisión del cliente de extremo a extremo.** Mostrar D7 en PRD, CA-A2-03 en backlog, V07 en test y suma/retorno de horas en resumenAnual.                                                      | «120 + 30 minutos de películas son 2,5 h; una serie no añade horas. El cálculo no vive en la pantalla». Cerrar indicando PA-01–PA-06, D6 parcial y los pendientes de auditoría; el pre-commit funciona, el hook por edición no se verificó.                                                                                   |

**Total: 45 + 45 + 60 + 30 + 60 + 60 = 300 s = 5:00.** El bloque 4 conserva el tema del enunciado y explicita la sustitución por cuenta vacía; no pretende demostrar un cambio de año que no se ha probado. El tiempo real del acceso a cuenta B y de la prueba del sensor debe medirse en el ensayo.

## Comandos de historial preparados

Solo lecturas, desde la raíz del repositorio:

```powershell
git branch --show-current
git log --reverse --oneline p3-final..HEAD
git show --stat --oneline a927e17 3485e11 7b7e1c9
git show 3485e11:src/dominio/resumenAnual.test.ts
git show --stat --oneline 271b9ae b4b15e5
```

El orden de ancestros y la existencia de los archivos se comprobaron al preparar este guion. El test existe en 3485e11 y resumenAnual.ts no existe todavía allí; aparece en 7b7e1c9. No hace falta cambiar de rama, restaurar una versión vieja o ejecutar código histórico para mostrarlo.

## Sensor: cambio temporal propuesto, todavía no ejecutado

Ejecutar **solo durante el ensayo/demo humano**, después de revisar los cambios existentes. El archivo es nuevo y no se importa a la app: permite demostrar el sensor sin cambiar una pantalla real. El sensor recorre código de src/, incluido src/screens/, aunque no esté importado. No se modifica el test ni sus exclusiones.

En PowerShell, con Node compatible y Vitest ya instalado:

```powershell
$rutaDemo = 'src/screens/DemoColorTemporal.ts'
if (Test-Path -LiteralPath $rutaDemo) {
  throw 'La ruta temporal ya existe. No se sobrescribe.'
}
$env:EXPO_NO_DOTENV = '1'
try {
  Set-Content -LiteralPath $rutaDemo -Encoding utf8 `
    -Value "export const colorTemporalDeDemo = '#FF0000';"
  npx --no-install vitest run tests/colores-fijos.test.ts
  if ($LASTEXITCODE -eq 0) {
    throw 'El sensor no detectó el ejemplo. Revisar el resultado antes de continuar.'
  }
} finally {
  if (Test-Path -LiteralPath $rutaDemo) {
    Remove-Item -LiteralPath $rutaDemo
  }
}
npx --no-install vitest run tests/colores-fijos.test.ts
git status --short
git diff -- tests/colores-fijos.test.ts
git diff --cached --name-only
```

Resultado **esperado**, no acreditado por este guion: primer comando Vitest con salida 1 y un hallazgo en DemoColorTemporal.ts; segundo con salida 0 tras retirarlo. Comprobar la ruta y línea del hallazgo: un fallo por otro motivo no cuenta como demostración correcta. El finally retira únicamente el archivo temporal recién creado; si se cierra la terminal durante la demo, comprobar su ausencia manualmente antes de cualquier commit.

No ejecutar git add sobre el temporal. Revisar que el sensor siga sin diff y que el ejemplo no figure en el índice. Conservar intactos los cambios documentales existentes; no usar reset, checkout o restore generales para limpiar. **No se creó ni borró ese archivo al preparar esta documentación.**

## Trazabilidad del punto 6: D7

| Pieza       | Lugar que se mostrará                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Decisión    | `docs/prd/01-mi-anio-en-cine.md`, «D7 — Horas de cine».                                                                     |
| Criterio    | `docs/backlog/01-mi-anio-en-cine.md`, CA-A2-03.                                                                             |
| Spec        | `docs/specs/01-mi-anio-en-cine.md`, reglas de cálculo y V07.                                                                |
| Test previo | `src/dominio/resumenAnual.test.ts`, caso CA-A2-03 / V07 «suma 120+30 minutos de películas como 2,5 horas y no suma series». |
| Código      | `src/dominio/resumenAnual.ts`, acumulación de minutos dentro de tipo movie y retorno de horas con un decimal.               |

Los fixtures identifican datos legítimos cuando corresponde; eso no decide cómo clasificar automáticamente null/vacíos en producción. PA-03 y D6 parcial siguen vigentes.

## Qué falta para decir «demo ensayada»

1. Ejecutar realmente los seis bloques en Expo Go y terminal, midiendo cada duración y el total.
2. Confirmar acceso a cuenta B, transición Vista/refresco y comportamiento ante un escenario pendiente, sin exponer configuración local.
3. Realizar la prueba temporal del sensor, comprobar su fallo por el motivo correcto, retirarlo y comprobar verde y ausencia del temporal en staging.
4. Registrar fecha, entorno, duración real e incidencias. Solo después actualizar este estado; no rellenarlo con el tiempo previsto.

No se realizó ese ensayo en esta tarea. Las pruebas previas de la estudiante cubren lo indicado en VERIFICACION.md, no una presentación cronometrada ni cambio entre años. Los textos «1 series» y «1 películas», el subtítulo antiguo de Acerca de, la adaptación del 750 y los demás riesgos de AUDITORIA.md siguen pendientes. Tampoco se presenta el pre-commit como sustituto demostrado del hook por edición.
