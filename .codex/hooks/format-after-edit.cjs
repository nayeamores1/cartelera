const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(path.dirname(require.main.filename), '../..');

function editedFiles(input) {
  if (input && typeof input === 'object' && typeof input.file_path === 'string')
    return [input.file_path];
  const patch =
    typeof input === 'string'
      ? input
      : (input?.input ?? input?.patch ?? input?.command);
  if (typeof patch !== 'string')
    throw new Error('Formato de evento desconocido.');
  const files = new Set();
  for (const line of patch.split(/\r?\n/)) {
    const match = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/.exec(line);
    if (match) files.add(match[1]);
  }
  if (!files.size) throw new Error('No se identificaron archivos editados.');
  return [...files];
}

try {
  const event = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (
    event.hook_event_name !== 'PostToolUse' ||
    !['apply_patch', 'Edit', 'Write'].includes(event.tool_name)
  )
    throw new Error('Evento no compatible.');
  const files = editedFiles(event.tool_input);
  for (const file of files) {
    if (path.resolve(root, file) === path.join(root, 'CLAUDE.md')) continue;
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'scripts/format-edited.cjs'), file],
      { cwd: root, encoding: 'utf8', timeout: 25000 },
    );
    if (result.error || result.status !== 0)
      throw new Error('Falló el formato.');
  }
  process.stdout.write(
    JSON.stringify({
      systemMessage: 'Prettier local comprobó los archivos editados.',
    }),
  );
} catch {
  process.stderr.write(
    'Hook de formato no completado. Revisar evento y rutas; no se mostró contenido.\n',
  );
  process.exitCode = 1;
}
