const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');

const app = path.resolve(path.dirname(require.main.filename), '..');
const base = fs.realpathSync(os.tmpdir());
const temp = fs.mkdtempSync(path.join(base, 'cartelera-precommit-'));
const env = {
  ...process.env,
  PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH,
  GIT_CONFIG_NOSYSTEM: '1',
};
for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE'])
  delete env[key];
const git = (...args) =>
  spawnSync('git', args, { cwd: temp, env, encoding: 'utf8' });
function ok(...args) {
  const result = git(...args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

try {
  ok('init', '--initial-branch=main');
  ok('config', '--local', 'core.hooksPath', path.join(app, '.githooks'));
  ok('config', '--local', 'user.name', 'Prueba local');
  ok('config', '--local', 'user.email', 'prueba@example.invalid');
  ok('config', '--local', 'commit.gpgsign', 'false');
  ok('config', '--local', 'core.autocrlf', 'false');
  const name = 'obra prueba.js';
  const file = path.join(temp, name);
  const bad = 'const obra={vista:true}\n';
  const good = 'const obra = { vista: true };\n';
  fs.writeFileSync(file, bad);
  ok('add', '--', name);
  fs.writeFileSync(file, good);
  fs.writeFileSync(
    path.join(temp, 'sin-preparar.js'),
    'const sinPreparar={valor:"sin formato"}\n',
  );
  const before = ok('show', `:${name}`);
  const rejected = git('commit', '-m', 'prueba: rechazar formato');
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /Commit bloqueado/);
  assert.match(rejected.stderr, /format:files/);
  assert.equal(fs.readFileSync(file, 'utf8'), good);
  assert.equal(ok('show', `:${name}`), before);
  assert.notEqual(git('rev-parse', '--verify', 'HEAD').status, 0);
  console.log(
    'Índice mal formateado: commit BLOQUEADO; archivo e índice intactos.',
  );

  ok('add', '--', name);
  fs.writeFileSync(file, bad);
  const prepared = ok('show', `:${name}`);
  const accepted = git('commit', '-m', 'prueba: aceptar formato');
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.equal(ok('show', `HEAD:${name}`), good);
  assert.equal(fs.readFileSync(file, 'utf8'), bad);
  assert.equal(ok('show', `:${name}`), prepared);
  assert.equal(ok('ls-files').trim(), name);
  console.log(
    'Índice corregido: commit ACEPTADO; working tree sin formato y archivo no preparado ignorados.',
  );
} finally {
  const resolved = fs.realpathSync(temp);
  if (
    path.dirname(resolved) !== base ||
    !path.basename(resolved).startsWith('cartelera-precommit-')
  )
    throw new Error('Destino temporal no seguro.');
  fs.rmSync(resolved, { recursive: true, force: true });
  console.log('Repositorio temporal eliminado:', !fs.existsSync(resolved));
}
