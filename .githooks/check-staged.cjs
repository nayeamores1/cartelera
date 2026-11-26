const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const project = path.resolve(path.dirname(require.main.filename), '..');
const git = (args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

async function main() {
  const root = git(['rev-parse', '--show-toplevel']).trim();
  const files = git([
    'diff',
    '--cached',
    '--name-only',
    '--no-renames',
    '--diff-filter=ACM',
    '-z',
  ])
    .split('\0')
    .filter(Boolean);
  if (!files.length) return;
  const prettier = await import(
    pathToFileURL(path.join(project, 'node_modules/prettier/index.mjs')).href
  );
  const failures = [];
  for (const file of files) {
    const parts = file.split('/');
    if (
      parts.some(
        (part) => /^\.env(?:\.|$)/i.test(part) && part !== '.env.example',
      ) ||
      /\.(?:pem|key|p8|p12|jks)$/i.test(file)
    ) {
      failures.push({
        file,
        reason: 'ruta sensible excluida: retirarla del índice sin leerla',
      });
      continue;
    }
    if (
      file === 'CLAUDE.md' ||
      parts.some((part) =>
        [
          '.git',
          'node_modules',
          '.expo',
          'dist',
          'dist-auth',
          '.firebase',
        ].includes(part),
      ) ||
      /\.log$/i.test(file)
    )
      continue;
    const filepath = path.resolve(root, file);
    const info = await prettier.getFileInfo(filepath, {
      ignorePath: path.join(project, '.prettierignore'),
      resolveConfig: false,
    });
    if (info.ignored || !info.inferredParser) continue;
    // Revisar el índice, no el archivo de trabajo: soporta staging parcial.
    const staged = git(['cat-file', 'blob', `:${file}`]);
    try {
      const correct = await prettier.check(staged, {
        filepath,
        singleQuote: true,
        trailingComma: 'all',
        endOfLine: 'lf',
      });
      if (!correct)
        failures.push({ file, reason: 'formato distinto de Prettier' });
    } catch {
      failures.push({ file, reason: 'sintaxis no procesable por Prettier' });
    }
  }
  if (failures.length) {
    process.stderr.write(
      'Commit bloqueado por el control de archivos preparados:\n',
    );
    for (const failure of failures)
      process.stderr.write(
        `- ${JSON.stringify(failure.file)}: ${failure.reason}\n`,
      );
    process.stderr.write(
      'Para formato: npm run format:files -- <ruta>; revisar git diff; ejecutar git add -- <ruta> y repetir el commit.\nPara rutas sensibles: retirarlas del índice sin borrarlas del disco. Nada se modificó ni se añadió automáticamente.\n',
    );
    process.exitCode = 1;
  }
}

main().catch(() => {
  process.stderr.write(
    'Commit bloqueado: no se pudo verificar el índice con Git/Prettier local. Comprueba npm ci y Node compatible; no se modificaron archivos ni staging.\n',
  );
  process.exitCode = 1;
});
