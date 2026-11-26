const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(path.dirname(require.main.filename), '..');
const excluded = new Set([
  '.git',
  'node_modules',
  '.expo',
  'dist',
  'dist-auth',
  '.firebase',
]);

async function formatFile(input) {
  const file = path.resolve(root, input);
  const relative = path.relative(root, file);
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error('Ruta fuera del proyecto.');
  // Comprobar antes de leer el archivo; nunca inspeccionar .env para formatearlo.
  const parts = relative.split(path.sep);
  if (
    parts.some((part) => /^\.env(?:\.|$)/i.test(part) || excluded.has(part)) ||
    /\.(?:pem|key|p8|p12|jks|log)$/i.test(file)
  )
    throw new Error('Archivo excluido.');
  const realRoot = await fs.realpath(root);
  const realFile = await fs.realpath(file);
  if (path.relative(realRoot, realFile) !== relative)
    throw new Error('Ruta redirigida por un enlace.');
  if (relative === 'CLAUDE.md')
    throw new Error('Conservar la línea literal de CLAUDE.md sin formatearla.');
  const prettier = await import(
    pathToFileURL(path.join(root, 'node_modules/prettier/index.mjs')).href
  );
  const info = await prettier.getFileInfo(file, {
    ignorePath: path.join(root, '.prettierignore'),
  });
  if (info.ignored || !info.inferredParser) {
    process.stdout.write(
      'Omitido: archivo ignorado o sin parser compatible.\n',
    );
    return;
  }
  const original = await fs.readFile(file, 'utf8');
  const formatted = await prettier.format(original, {
    filepath: file,
    singleQuote: true,
    trailingComma: 'all',
    endOfLine: 'lf',
  });
  if (original !== formatted) await fs.writeFile(file, formatted, 'utf8');
  process.stdout.write('Formato comprobado con Prettier local.\n');
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) throw new Error('Indica rutas explícitas.');
  for (const file of files) await formatFile(file);
}

main().catch(() => {
  // Nunca imprimir contenido, rutas sensibles o errores que contengan datos del archivo.
  process.stderr.write(
    'No se pudo formatear. Comprueba rutas explícitas permitidas y Prettier local instalado. No se mostraron datos del archivo.\n',
  );
  process.exitCode = 1;
});
