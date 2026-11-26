---
name: commit
description: Revisar y crear un commit autorizado de Mi Cartelera Personal, con mensaje en español y archivos explícitos. No publica cambios.
---

# Commit del proyecto

Leer AGENTS.md. Comprobar raíz Git y rama de esta app, `git status --short`, `git diff` y `git diff --cached`. Revisar archivos nuevos permitidos antes de agregarlos. Nunca leer .env o variantes ni comparar sus valores con otros archivos.

Solo crear el commit pedido por la persona. Una petición de preparar instrucciones no autoriza commits. Mostrar resumen y esperar revisión si la estudiante aún no revisó los cambios. No ampliar alcance ni convertir esta skill en autorización de push.

1. Verificar documentación/spec previa al código y revisión humana. No inventar evidencias ni alterar la spec para justificar retrospectivamente una implementación.
2. Revisar candidatos por patrones de credenciales sin imprimir coincidencias sensibles. Nunca incluir .env, variantes, claves privadas o credenciales; permitir .env.example solo con valores vacíos. Excluir dependencias, artefactos y logs.
3. Antes de commits de código ejecutar `npm test` y `npx tsc --noEmit`; ejecutar también `npm run lint` y controles pertinentes. No borrar tests, saltar hooks con --no-verify ni ocultar fallos. Registrar resultados reales. Para cambios documentales, revisar contenido y formato; no inventar comprobaciones de código.
4. Preparar exclusivamente rutas autorizadas mediante `git add -- <rutas explícitas>`. Nunca git add . ni -A. Comprobar el índice completo; si contiene cambios ajenos, detenerse sin retirarlos o sobrescribirlos.
5. Mensaje en español con uno de los prefijos docs:, feat:, fix:, test: o chore:. Ejemplos: `docs: definir criterios de la épica`, `fix: validar el estado sin coerciones`.
6. Crear el commit autorizado y verificar hash, mensaje, archivos incluidos, rama y estado final. No usar amend, reset, cambios de historia, force, tags, merges, despliegues ni push como efecto secundario.
