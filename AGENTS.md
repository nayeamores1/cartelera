# Mi Cartelera Personal: instrucciones del proyecto

App académica móvil en español para buscar películas/series TMDB y gestionar una lista privada. Usa Expo 58, React Native, TypeScript estricto, Firebase Auth, Firestore y copia AsyncStorage por uid. La navegación es React Navigation: native stack y bottom tabs. No migrar a Expo Router.

## Arquitectura real

- src/screens/ presenta; src/components/ comparte controles. Las pantallas no llaman directamente a Firebase ni a la API TMDB ni importan AsyncStorage: usan Context, hooks y servicios.
- src/navigation/ define navegadores y parámetros: Login/Registro sin sesión; Buscar, Mi lista, Acerca de con sesión; Detalle y Editar en stack.
- src/context/CarteleraContext.tsx expone sesión, lista, cargas, errores y acciones.
- src/hooks/ contiene useBusqueda y useListaUsuario. src/services/listaController.ts coordina caché, servidor y reconciliación.
- src/services/ encapsula Auth, TMDB, Firestore, AsyncStorage y NetInfo. src/firebase/config.ts inicializa Firebase/Auth una sola vez con persistencia del SDK.
- src/types/ define contratos; src/utils/ valida datos; src/theme/ concentra el tema actual. src/tema/ y src/dominio/ se crearán solo según la spec de hitos posteriores, sin duplicar fuentes de verdad.
- `tests/*.test.cjs` usa node:test; `tests/*.test.ts` usa Vitest para sensores sobre código real. npm test ejecuta ambas suites; tests/rules/ usa un emulador con proyecto demo. docs/ESPECIFICACION.md es la especificación del Proyecto 3; docs/AUDITORIA.md registra hallazgos. Conservar matrices, bitácora y evidencias históricas.

## Documentación, diseño y revisión

- Documentar alcance, criterios y verificación antes de implementar cada cambio. Los commits docs: preceden a los de código; no justificar retrospectivamente una implementación. Trabajar por hitos y conservar los tests existentes.
- Antes de modificar cualquier pantalla o componente, leer obligatoriamente DESIGN.md de la raíz: ya existe y deriva del brand board aprobado del Hito 2. Conservar sus valores y decisiones; no modificar DESIGN.md ni decisiones visuales por iniciativa propia. Sus cambios requieren revisión de la estudiante.
- La estudiante revisa cambios antes de cada commit. No crear commits ni hacer push o despliegues sin autorización. Consultar docs/HARNESS.md y el procedimiento .claude/skills/commit/SKILL.md; para Codex existe un adaptador en .agents/skills/commit/. No asumir un comando /commit disponible.
- Conservar español, atribución y logo TMDB, safe areas, teclado, etiquetas accesibles y objetivos táctiles de al menos 44×44. Distinguir carga, error, vacío y sin conexión. No afirmar pruebas móviles no realizadas.

## Privacidad y reglas

- Nunca leer ni imprimir .env, variantes .env.* con configuración local o sus valores. Solo se puede revisar .env.example como plantilla vacía. No pedir claves por chat ni cargar dotenv para comparar secretos. En verificaciones con herramientas Expo usar EXPO_NO_DOTENV=1 para evitar cargar .env.
- Nunca versionar .env ni credenciales, claves privadas o cuentas de servicio; conservar .env.example vacío. El SDK gestiona sesión: no guardar tokens o contraseñas manualmente.
- Evitar any injustificados y parches de tipos que oculten incompatibilidades. Mantener strict y validar datos externos como unknown.
- Conservar aislamiento por uid, descarte de respuestas antiguas, validación de caché, alta atómica sin duplicados y calificación solo en Vista. No mutar offline. Un timeout no prueba cancelación de escritura remota.
- No cambiar/publicar reglas fuera del alcance autorizado. Probar reglas exclusivamente con demo-mi-cartelera, nunca con credenciales reales.

## Instalación y comandos reales

Desde la raíz Git de esta app (no el repositorio padre), Node >=24.12.0 y npm con package-lock.json:

```sh
npm ci
npm run dev
npm run typecheck
npx tsc --noEmit
npm run lint
npm test
npm run test:rules
npm run format:files -- ruta/al/archivo-editado.ts
```

npm run dev es para el uso humano con configuración local; el agente no debe leer ni cargar .env al verificar. test:rules requiere Java y herramientas aisladas descritas en docs/PRUEBAS_LISTA.md. Vitest es la dependencia de desarrollo autorizada por el Hito 1; su configuración usa entorno Node y envDir:false para no cargar .env.

Ejecutar TypeScript y lint antes de declarar terminada una tarea. Antes de cada commit de código ejecutar npm test y npx tsc --noEmit; no desactivar sensores para que pasen. Registrar comandos, códigos de salida y límites, separando resultados actuales, históricos y confirmaciones humanas.

Formatear cada archivo editado con npm run format:files -- <rutas explícitas>, revisar después el diff. Es una alternativa manual: no afirmar que Codex/Claude ejecutan un hook automático. No reformatear el proyecto completo ni tocar archivos ajenos. CLAUDE.md conserva su línea literal de entrega.

.codex/hooks.json prepara PostToolUse para apply_patch/Edit/Write desde la raíz de la app y reutiliza scripts/format-edited.cjs. La activación automática sigue pendiente de revisión/confianza y prueba real en el cliente; no saltar la confianza ni confundir un evento simulado con automatización comprobada. Consultar docs/HARNESS.md para el resultado observado y mantener el comando manual mientras no se verifique.

El hook Git versionado en .githooks/ comprueba solo el índice durante git commit usando Prettier local, sin modificar archivos ni staging. Se activa por clon con core.hooksPath local, después de revisar configuraciones previas. No equivale a un hook después de editar; no saltárselo con --no-verify.

## Compatibilidad Expo

- Antes de tocar APIs Expo/React Native leer la versión instalada en package.json y consultar documentación oficial versionada: https://docs.expo.dev/versions/v58.0.0/ y https://docs.expo.dev/llms.txt. No confiar en memoria para APIs cambiantes.
- Dependencias nuevas solo justificadas por spec/alcance. Usar npx expo install <paquete>, con --dev para herramientas. Diagnóstico: npx expo install --check y npx expo-doctor. No aplicar --fix o audit fix automáticamente.
- Si ios/ y android/ no existen, no crearlos a mano: configurar app.json/plugins. Expo Go solo incluye módulos nativos compatibles; documentar si se requiere development build, sin generarlo/publicarlo por iniciativa propia.
- EAS permite builds, firma y actualizaciones; usarlo solo con autorización explícita, no como comprobación rutinaria. No publicar servicios ni reglas sin autorización.
