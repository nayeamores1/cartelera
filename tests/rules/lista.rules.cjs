const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const tools = createRequire(path.resolve('.expo/rules-tools/package.json'));
const { initializeTestEnvironment, assertSucceeds, assertFails } = tools('@firebase/rules-unit-testing');
const api = tools('firebase/firestore');
api.setLogLevel('silent');
const ts = require('typescript');
const { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, serverTimestamp, Timestamp } = api;
let env;
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-mi-cartelera', firestore: { host: '127.0.0.1', port: 8089, rules: fs.readFileSync('firestore.rules', 'utf8') } }); });
beforeEach(async () => env.clearFirestore());
after(async () => { await env?.cleanup(); });
function db(uid = 'cuenta-a', provider = 'password') { return env.authenticatedContext(uid, { firebase: { sign_in_provider: provider } }).firestore(); }
function entrada(cambios = {}) { return { tmdbId: 1, tipo: 'movie', titulo: 'Historia', anio: '2024', posterPath: null, estado: 'por_ver', calificacionPersonal: null, comentario: '', agregadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), ...cambios }; }
const ref = (database, uid = 'cuenta-a', id = 'movie_1') => doc(database, 'usuarios', uid, 'mi_lista', id);
test('dueño: crear, leer, listar, editar y eliminar', async () => {
  const database = db(); const r = ref(database);
  await assertSucceeds(setDoc(r, entrada()));
  await assertSucceeds(getDoc(r)); await assertSucceeds(getDocs(collection(database, 'usuarios/cuenta-a/mi_lista')));
  const creado = (await getDoc(r)).data().agregadoEn;
  await assertSucceeds(updateDoc(r, { estado: 'vista', calificacionPersonal: 5, comentario: 'x'.repeat(500), actualizadoEn: serverTimestamp() }));
  assert.equal((await getDoc(r)).data().agregadoEn.isEqual(creado), true);
  await assertSucceeds(updateDoc(r, { estado: 'viendo', calificacionPersonal: null, actualizadoEn: serverTimestamp() }));
  await assertSucceeds(deleteDoc(r));
});
test('sin sesión, anónimo y otra cuenta: denegar lectura/escritura/delete', async () => {
  await setDoc(ref(db()), entrada());
  for (const database of [env.unauthenticatedContext().firestore(), db('cuenta-a', 'anonymous'), db('cuenta-b')]) {
    await assertFails(getDoc(ref(database)));
    await assertFails(getDocs(collection(database, 'usuarios/cuenta-a/mi_lista')));
    await assertFails(setDoc(ref(database), entrada()));
    await assertFails(deleteDoc(ref(database)));
  }
  await assertFails(setDoc(doc(db(), 'otra/entrada'), { libre: true }));
});
test('creación: ID/tipo, metadatos, campos extra/requeridos, timestamps y valores iniciales', async () => {
  const invalidos = [ { tmdbId: 0 }, { tmdbId: 1.2 }, { tipo: 'person' }, { titulo: '' }, { titulo: '   ' }, { titulo: 'x'.repeat(201) }, { anio: 2024 }, { posterPath: 42 }, { campoExtra: true }, { estado: 'vista' }, { calificacionPersonal: 1 }, { comentario: 'no vacío' }, { agregadoEn: Timestamp.fromMillis(1) }, { actualizadoEn: Timestamp.fromMillis(1) } ];
  for (const cambio of invalidos) await assertFails(setDoc(ref(db()), entrada(cambio)));
  const incompleta = entrada(); delete incompleta.comentario;
  await assertFails(setDoc(ref(db()), incompleta));
  await assertFails(setDoc(ref(db(), 'cuenta-a', 'movie_2'), entrada()));
  await assertSucceeds(setDoc(ref(db()), entrada({ titulo: 'x'.repeat(200), anio: '', posterPath: '/poster.jpg' })));
});
test('actualización valida estrellas, estado, comentario y conserva todos los metadatos', async () => {
  const r = ref(db()); await setDoc(r, entrada());
  for (const cambio of [ { estado: 'pendiente' }, { calificacionPersonal: 1 }, { estado: 'vista', calificacionPersonal: 0 }, { estado: 'vista', calificacionPersonal: 6 }, { estado: 'vista', calificacionPersonal: 2.5 }, { comentario: 'x'.repeat(501) }, { titulo: 'Otro' }, { anio: '2025' }, { posterPath: '/nuevo.jpg' }, { tipo: 'tv' }, { tmdbId: 2 }, { agregadoEn: serverTimestamp() }, { extra: true }, { actualizadoEn: Timestamp.fromMillis(1) } ]) {
    await assertFails(updateDoc(r, { ...cambio, ...(Object.hasOwn(cambio, 'actualizadoEn') ? {} : { actualizadoEn: serverTimestamp() }) }));
  }
  await updateDoc(r, { estado: 'vista', calificacionPersonal: 3, actualizadoEn: serverTimestamp() });
  await assertFails(updateDoc(r, { estado: 'por_ver', actualizadoEn: serverTimestamp() }));
  await assertSucceeds(updateDoc(r, { estado: 'por_ver', calificacionPersonal: null, actualizadoEn: serverTimestamp() }));
});
function cargar(file, deps) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(path.resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', js)(exports, name => deps[name]);
  return exports;
}
test('servicio real: duplicados concurrentes atómicos sin sobrescribir edición', async () => {
  // Ejecutar el servicio con el Firebase 13 instalado en la app. Solo la
  // biblioteca de aserciones de reglas usa su cliente 12 aislado por peer deps.
  const apiActual = require('firebase/firestore');
  const appApi = require('firebase/app');
  const app = appApi.initializeApp({ projectId: 'demo-mi-cartelera' }, 'prueba-servicio-13');
  const database = apiActual.getFirestore(app);
  apiActual.connectFirestoreEmulator(database, '127.0.0.1', 8089, { mockUserToken: { sub: 'cuenta-a', firebase: { sign_in_provider: 'password' } } });
  const utils = cargar('src/utils/lista.ts', {});
  const tiempo = cargar('src/utils/tiempo.ts', {});
  const { listaService } = cargar('src/services/listaService.ts', {
    'firebase/firestore': apiActual,
    '../firebase/config': { getFirebaseAuth: () => ({ currentUser: { uid: 'cuenta-a', isAnonymous: false }, app: database.app }) },
    '../utils/lista': utils, '../utils/tiempo': tiempo,
  });
  const obra = { tmdbId: 1, tipo: 'movie', titulo: 'Historia', anio: '2024', posterPath: null };
  await Promise.all([listaService.agregar('cuenta-a', obra), listaService.agregar('cuenta-a', obra)]);
  await listaService.actualizar('cuenta-a', 'movie_1', { estado: 'vista', calificacionPersonal: 4, comentario: 'Conservar' });
  await listaService.agregar('cuenta-a', { ...obra, titulo: 'No sobrescribir' });
  const lista = await listaService.obtener('cuenta-a');
  assert.equal(lista.length, 1); assert.equal(lista[0].titulo, 'Historia'); assert.equal(lista[0].calificacionPersonal, 4); assert.equal(lista[0].comentario, 'Conservar');
  await listaService.actualizar('cuenta-a', 'movie_1', { estado: 'viendo', calificacionPersonal: 4, comentario: 'Conservar' });
  assert.equal((await listaService.obtener('cuenta-a'))[0].calificacionPersonal, null);
  await listaService.eliminar('cuenta-a', 'movie_1'); assert.equal((await listaService.obtener('cuenta-a')).length, 0);
  await apiActual.terminate(database);
  await appApi.deleteApp(app);
});
