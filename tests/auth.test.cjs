// Pruebas unitarias aisladas: no cargan .env ni contactan Firebase.
/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function cargar(relative, dependencias = {}, globals = {}) {
  const filename = path.join(__dirname, '..', relative);
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, {
    ...globals,
    exports,
    require: name => {
      if (!(name in dependencias)) throw new Error(`Dependencia no aislada: ${name}`);
      return dependencias[name];
    },
  }, { filename });
  return exports;
}
test('configuración inicializa una sola app/Auth con AsyncStorage y funciona sin TMDB', () => {
  const storage = {};
  const app = { name: '[DEFAULT]' };
  const auth = {};
  let apps = 0;
  let iniciosAuth = 0;
  let almacenUsado;
  let persistenciaUsada;
  const persistence = {};
  const deps = {
    '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    'firebase/app': {
      getApps: () => apps ? [app] : [],
      getApp: () => app,
      initializeApp: () => { apps += 1; return app; },
    },
    'firebase/auth': {
      getReactNativePersistence: value => { almacenUsado = value; return persistence; },
      initializeAuth: (value, options) => {
        assert.equal(value, app);
        if (iniciosAuth) throw { code: 'auth/already-initialized' };
        iniciosAuth += 1;
        persistenciaUsada = options.persistence;
        return auth;
      },
      getAuth: () => auth,
    },
  };
  const env = Object.fromEntries([
    'API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID',
  ].map(key => [`EXPO_PUBLIC_FIREBASE_${key}`, 'fixture-unitaria-sin-red']));
  const config = cargar('src/firebase/config.ts', deps, { process: { env } });
  assert.equal(config.getFirebaseAuth(), auth);
  assert.equal(config.getFirebaseAuth(), auth);
  // Simula recarga del módulo conservando las instancias del SDK.
  assert.equal(cargar('src/firebase/config.ts', deps, { process: { env } }).getFirebaseAuth(), auth);
  assert.equal(apps, 1);
  assert.equal(iniciosAuth, 1);
  assert.equal(almacenUsado, storage);
  assert.equal(persistenciaUsada, persistence);
  const sinConfig = cargar('src/firebase/config.ts', deps, { process: { env: {} } });
  assert.throws(() => sinConfig.getFirebaseAuth(), /EXPO_PUBLIC_FIREBASE_API_KEY/);
  const incompleto = { ...env, EXPO_PUBLIC_FIREBASE_PROJECT_ID: '   ' };
  const configuracionIncompleta = cargar('src/firebase/config.ts', deps, { process: { env: incompleto } });
  assert.throws(() => configuracionIncompleta.getFirebaseAuth(), error => {
    assert.match(error.message, /EXPO_PUBLIC_FIREBASE_PROJECT_ID/);
    assert.equal(error.message.includes('EXPO_PUBLIC_FIREBASE_API_KEY'), false);
    assert.equal(error.message.includes('fixture-unitaria-sin-red'), false);
    assert.equal(error.message.includes('TMDB'), false);
    return true;
  });
});
const { validarFormularioAuth: validar } = cargar('src/utils/authValidation.ts');
test('validación: correo vacío/malformado, clave y confirmación', () => {
  for (const args of [ ['', 'abcdef'], ['no-es-correo', 'abcdef'], ['a@b.com', ''], ['a@b.com', '12345', '12345'], ['a@b.com', 'abcdef', ''], ['a@b.com', 'abcdef', 'ABCDEF'] ]) {
    assert.equal(typeof validar(...args), 'string');
  }
  assert.equal(validar(' a@b.com ', 'abcdef', 'abcdef'), null);
  // Login permite una contraseña antigua corta; Firebase valida credenciales.
  assert.equal(validar('a@b.com', '12345'), null);
  assert.notEqual(validar('a@b.com', ' abcdef ', 'abcdef'), null);
});

class FirebaseConfigurationError extends Error {}
function servicio(api = {}) {
  const auth = {};
  const exports = cargar('src/services/authService.ts', {
    'firebase/auth': api,
    '../firebase/config': { FirebaseConfigurationError, getFirebaseAuth: () => auth },
  });
  return { ...exports, auth };
}
test('errores: correo repetido, credenciales y red se traducen sin exponer el error original', () => {
  const { traducirErrorAuth } = servicio();
  assert.match(traducirErrorAuth({ code: 'auth/email-already-in-use' }), /ya está registrado/);
  for (const code of ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password']) {
    assert.match(traducirErrorAuth({ code }), /correo o la contraseña son incorrectos/);
  }
  assert.match(traducirErrorAuth({ code: 'auth/network-request-failed' }), /conexión/);
  assert.equal(traducirErrorAuth({ code: 'desconocido', message: 'contenido privado' }).includes('contenido privado'), false);
});
test('registro y login normalizan solo el correo; exponen únicamente uid/email', async () => {
  const llamadas = [];
  const resolver = async (...args) => { llamadas.push(args); return { user: { uid: 'test-uid', email: 'a@b.com', token: 'campo excluido' } }; };
  const { authService, auth } = servicio({ createUserWithEmailAndPassword: resolver, signInWithEmailAndPassword: resolver });
  for (const operacion of ['registrar', 'ingresar']) {
    const user = await authService[operacion](' a@b.com ', ' clave ');
    assert.equal(JSON.stringify(user), JSON.stringify({ uid: 'test-uid', email: 'a@b.com' }));
  }
  assert.equal(llamadas.length, 2);
  for (const args of llamadas) assert.deepEqual(args, [auth, 'a@b.com', ' clave ']);
});
test('un rechazo del SDK se convierte en mensaje seguro', async () => {
  const { authService } = servicio({ signInWithEmailAndPassword: async () => { throw { code: 'auth/invalid-credential', message: 'contenido privado' }; } });
  await assert.rejects(authService.ingresar('a@b.com', 'clave'), /correo o la contraseña son incorrectos/);
});
test('observación entrega usuario/null y permite cancelar; logout usa el mismo Auth', async () => {
  let recibir;
  let cancelado = false;
  let authLogout;
  const { authService, auth } = servicio({
    onAuthStateChanged: (_auth, next) => { recibir = next; return () => { cancelado = true; }; },
    signOut: async instance => { authLogout = instance; },
  });
  const usuarios = [];
  const cancelar = authService.observarSesion(user => usuarios.push(user), () => assert.fail('No se espera error'));
  recibir({ uid: 'test-uid', email: 'a@b.com', token: 'campo excluido' });
  recibir(null);
  assert.equal(JSON.stringify(usuarios), JSON.stringify([{ uid: 'test-uid', email: 'a@b.com' }, null]));
  cancelar();
  assert.equal(cancelado, true);
  await authService.salir();
  assert.equal(authLogout, auth);
});
