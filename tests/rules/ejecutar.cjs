const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const cli = path.resolve('.expo/rules-tools/node_modules/firebase-tools/lib/bin/firebase.js');
if (!fs.existsSync(cli)) {
  console.error('Prepara primero las herramientas aisladas de reglas. Consulta docs/PRUEBAS_LISTA.md.');
  process.exit(1);
}
const env = { ...process.env, EXPO_NO_DOTENV: '1' };
// No transferir variables de la app al proyecto demo del emulador.
for (const key of Object.keys(env)) if (key.startsWith('EXPO_PUBLIC_')) delete env[key];
const javaLocal = 'C:\\Program Files\\Processing\\app\\resources\\jdk';
if (!env.JAVA_HOME && fs.existsSync(path.join(javaLocal, 'bin', 'java.exe'))) env.JAVA_HOME = javaLocal;
if (env.JAVA_HOME) {
  const key = Object.keys(env).find(name => name.toLowerCase() === 'path') ?? 'PATH';
  env[key] = `${path.dirname(process.execPath)}${path.delimiter}${path.join(env.JAVA_HOME, 'bin')}${path.delimiter}${env[key] ?? ''}`;
}
const result = spawnSync(process.execPath, [cli, 'emulators:exec', '--only', 'firestore', '--project', 'demo-mi-cartelera', 'node --test tests/rules/lista.rules.cjs'], { env, stdio: 'inherit' });
if (result.error) console.error('No se pudo iniciar el emulador. Revisa Node y Java.');
process.exit(result.status ?? 1);
