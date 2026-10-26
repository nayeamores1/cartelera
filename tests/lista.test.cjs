const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function cargar(file, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(file),'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: name => { if (!(name in deps)) throw new Error(`Dependencia no aislada: ${name}`); return deps[name]; }, setTimeout, clearTimeout, ...globals });
  return exports;
}
const utils = cargar('src/utils/lista.ts');
const tiempo = cargar('src/utils/tiempo.ts');
const item = { tmdbId: 1, tipo: 'movie', titulo: 'Historia', anio: '2024', posterPath: null, estado: 'por_ver', calificacionPersonal: null, comentario: '', agregadoEn: '2026-10-25T12:00:00.000Z', actualizadoEn: '2026-10-25T12:00:00.000Z' };
const copia = (uid, items = [item]) => ({ version: 1, uid, items, savedAt: '2026-10-25T12:00:00.000Z' });
const diferida = () => { let resolve, reject; const promise = new Promise((yes,no) => { resolve=yes; reject=no; }); return {promise,resolve,reject}; };
const flush = async () => { for (let i=0;i<12;i++) await Promise.resolve(); await new Promise(resolve => setTimeout(resolve, 0)); };
test('validación: estados, estrellas enteras, comentario, título y copia por uid', () => {
  for (const cambio of [{ estado:'otro' },{calificacionPersonal:1},{estado:'vista',calificacionPersonal:2.5},{estado:'vista',calificacionPersonal:0},{estado:'vista',calificacionPersonal:6},{comentario:'x'.repeat(501)}]) assert.throws(()=>utils.validarEdicion({...item,...cambio}));
  assert.equal(utils.normalizarEdicion({estado:'viendo',calificacionPersonal:5,comentario:''}).calificacionPersonal,null);
  utils.validarEdicion({...item,estado:'vista',calificacionPersonal:5,comentario:'x'.repeat(500)});
  assert.throws(()=>utils.validarObra({...item,titulo:' '.repeat(3)}));
  assert.throws(()=>utils.validarObra({...item,titulo:'x'.repeat(201)}));
  utils.validarCopia(copia('a'),'a');
  assert.throws(()=>utils.validarCopia(copia('a'),'b'));
  assert.throws(()=>utils.validarCopia(copia('a',[item,item]),'a'));
  assert.throws(()=>utils.validarCopia(copia('a',[{...item,extra:true}]),'a'));
  assert.throws(()=>utils.validarCopia({...copia('a'),savedAt:'ayer'},'a'));
});
test('regresión: tipo y estado exigen strings exactos, sin coerciones', () => {
  for (const tipo of [['movie'], ['tv'], {}, {toString:()=> 'movie'}, null, undefined, 'desconocido', 'Movie', ' movie', 1, true]) {
    assert.throws(()=>utils.validarObra({...item,tipo}));
    assert.throws(()=>utils.validarCopia(copia('a',[{...item,tipo}]),'a'));
  }
  for (const estado of [['por_ver'], ['vista'], {}, {toString:()=> 'por_ver'}, null, undefined, 'desconocido', 'Vista', 'vista ', 1, true]) {
    assert.throws(()=>utils.validarEdicion({...item,estado}));
    assert.throws(()=>utils.normalizarEdicion({...item,estado}));
    assert.throws(()=>utils.validarCopia(copia('a',[{...item,estado}]),'a'));
  }
  for (const valor of ['1', [1], {}, null, undefined, true, NaN, Infinity]) {
    assert.throws(()=>utils.validarObra({...item,tmdbId:valor}));
    if (valor !== null) assert.throws(()=>utils.validarEdicion({...item,estado:'vista',calificacionPersonal:valor}));
  }
  for (const tipo of ['movie','tv']) for (const estado of ['por_ver','viendo','vista']) {
    const valido={...item,tipo,estado,calificacionPersonal:estado==='vista'?5:null};
    utils.validarItem(valido); utils.validarCopia(copia('a',[valido]),'a');
  }
});

test('caché: rechaza datos malformados sin borrar ni sobrescribir copias válidas', async () => {
  const key='cartelera:lista:v1:a'; const valida=JSON.stringify(copia('a'));
  const store=new Map([[key,valida],['cartelera:lista:v1:b',JSON.stringify(copia('b'))]]);
  const storage={getItem:async key=>store.get(key)??null,setItem:async(key,value)=>store.set(key,value),removeItem:async key=>store.delete(key)};
  const {cacheService:c,iniciarCache}=cargar('src/services/cacheService.ts',{'@react-native-async-storage/async-storage':{__esModule:true,default:storage},'../utils/lista':utils,'../utils/tiempo':tiempo});
  const sesion=iniciarCache('a');
  for (const cambio of [{tipo:['movie']},{estado:['por_ver']},{tipo:{}},{estado:null}]) {
    await assert.rejects(c.guardar(copia('a',[{...item,...cambio}]),sesion));
    assert.equal(store.get(key),valida);
    const malformada=JSON.stringify(copia('a',[{...item,...cambio}])); store.set(key,malformada);
    await assert.rejects(c.leer('a'));
    assert.equal(store.get(key),malformada);
    assert.equal((await c.leer('b')).items[0].titulo,item.titulo);
    await c.guardar(copia('a'),sesion);
    assert.equal((await c.leer('a')).items[0].titulo,item.titulo);
  }
});

test('caché: serializa escrituras, invalida sesiones viejas y distingue null de lista vacía', async () => {
  const store = new Map(); const primera = diferida(); let calls = 0;
  const storage = { getItem: async key => store.get(key) ?? null, setItem: async (key,value) => { if (calls++ === 0) await primera.promise; store.set(key,value); }, removeItem: async key => store.delete(key) };
  const {cacheService:c,iniciarCache} = cargar('src/services/cacheService.ts', {'@react-native-async-storage/async-storage':{__esModule:true,default:storage},'../utils/lista':utils,'../utils/tiempo':tiempo});
  assert.equal(await c.leer('a'),null);
  const sesion1=iniciarCache('a'); const old=c.guardar(copia('a'),sesion1); await flush();
  const sesion2=iniciarCache('a'); const nueva=c.guardar(copia('a',[]),sesion2); primera.resolve(); await Promise.all([old,nueva]);
  assert.equal((await c.leer('a')).items.length,0);
  await c.guardar(copia('a'),sesion1); assert.equal((await c.leer('a')).items.length,0);
  assert.equal(await c.leer('b'),null);
  await c.marcarPendiente('a',true); await c.marcarPendiente('a',false,sesion1); assert.equal(await c.tienePendiente('a'),true);
  await c.marcarPendiente('a',false,sesion2); assert.equal(await c.tienePendiente('a'),false);
  store.set('cartelera:lista:v1:a','contenido corrupto'); await assert.rejects(c.leer('a'));
});
function escenario({cache=copia('a'),obtener=async()=>[item],agregar=async()=>{},timeout=false,conexion='conectado',servicioCache=null}={}) {
  let listener; const escrituras=[]; let pendiente=false; let lecturas=0;
  const cacheMock={ leer:async()=>cache,guardar:async data=>escrituras.push(data),tienePendiente:async()=>pendiente,marcarPendiente:async(_uid,value)=>{pendiente=value;} };
  const {ListaController}=cargar('src/services/listaController.ts',{
    './cacheService':servicioCache??{cacheService:cacheMock,iniciarCache:()=>1},
    './conectividadService':{conectividadService:{observar:cb=>{listener=cb;cb(conexion);return()=>{};}}},
    './listaService':{listaService:{obtener:async uid=>{lecturas++;return obtener(uid);},agregar,actualizar:async()=>{},eliminar:async()=>{}},mensajeErrorLista:error=>error.message??'Fallo remoto'},
    '../utils/lista':utils,'../utils/tiempo': timeout?{...tiempo,conTiempo:async promise=>Promise.race([promise,Promise.reject(new tiempo.TiempoAgotado())])}:tiempo,
  });
  const controller=new ListaController('a');
  return {controller,listener:value=>listener(value),escrituras,lecturas:()=>lecturas,pendiente:()=>pendiente};
}
test('inicio con caché malformada: error controlado offline y recuperación al reconectar',async()=>{
  const key='cartelera:lista:v1:a'; const malformada=JSON.stringify(copia('a',[{...item,tipo:['movie']}]));
  const store=new Map([[key,malformada]]);
  const storage={getItem:async key=>store.get(key)??null,setItem:async(key,value)=>store.set(key,value),removeItem:async key=>store.delete(key)};
  const servicioCache=cargar('src/services/cacheService.ts',{'@react-native-async-storage/async-storage':{__esModule:true,default:storage},'../utils/lista':utils,'../utils/tiempo':tiempo});
  const s=escenario({servicioCache,conexion:'sin-conexion'});
  s.controller.iniciar(); await flush();
  assert.equal(s.controller.snapshot().cargandoLista,false);
  assert.equal(s.controller.snapshot().tieneCopia,false);
  assert.equal(s.controller.snapshot().lista.length,0);
  assert.match(s.controller.snapshot().errorLista,/No se pudo leer la copia local/);
  assert.equal(store.get(key),malformada); assert.equal(s.lecturas(),0);
  s.listener('conectado'); await flush();
  assert.equal(s.controller.snapshot().confirmada,true);
  assert.equal(s.controller.snapshot().errorLista,null);
  assert.equal(s.controller.snapshot().lista[0].titulo,item.titulo);
  assert.equal((await servicioCache.cacheService.leer('a')).items[0].tipo,'movie');
  s.controller.cerrar();
});

test('cache primero, error remoto conserva copia válida y logout descarta respuesta vieja',async()=>{
  const remoto=diferida(); const s=escenario({obtener:()=>remoto.promise}); s.controller.iniciar(); await flush();
  assert.equal(s.controller.snapshot().lista[0].titulo,'Historia');
  assert.equal(s.controller.snapshot().tieneCopia,true);
  remoto.reject(new Error('Permiso denegado')); await flush();
  assert.equal(s.controller.snapshot().lista.length,1); assert.match(s.controller.snapshot().errorLista,/Permiso/);
  s.controller.cerrar();
  const tardia=diferida(); const antiguo=escenario({cache:null,obtener:()=>tardia.promise}); antiguo.controller.iniciar();await flush();antiguo.controller.cerrar();
  tardia.resolve([item]);await flush();assert.equal(antiguo.controller.snapshot().lista.length,0);
});
test('offline: copia vacía es válida, sin copia es distinto y mutaciones bloqueadas',async()=>{
  const s=escenario({cache:copia('a',[]),conexion:'sin-conexion'});s.controller.iniciar();await flush();
  assert.equal(s.controller.snapshot().tieneCopia,true);assert.equal(s.lecturas(),0);
  await assert.rejects(s.controller.agregar(item),/Sin conexión/);s.controller.cerrar();
  const vacio=escenario({cache:null,conexion:'sin-conexion'});vacio.controller.iniciar();await flush();assert.equal(vacio.controller.snapshot().tieneCopia,false);vacio.controller.cerrar();
});
test('timeout no cancela escritura: bloquea repetición y reconcilia después de resultado real',async()=>{
  const escritura=diferida(); let items=[];
  const s=escenario({cache:copia('a',[]),obtener:async()=>items,agregar:()=>escritura.promise,timeout:true});s.controller.iniciar();await flush();
  await assert.rejects(s.controller.agregar(item),/No pudimos confirmar/);
  assert.equal(s.controller.snapshot().pendiente,true);assert.equal(s.pendiente(),true);
  await assert.rejects(s.controller.agregar(item),/operación anterior/);
  s.listener('sin-conexion');s.listener('conectado');await flush();assert.equal(s.controller.snapshot().pendiente,true);
  items=[item];escritura.resolve();await flush();await new Promise(resolve=>setTimeout(resolve,1));await flush();
  assert.equal(s.controller.snapshot().lista.length,1);assert.equal(s.controller.snapshot().pendiente,false);assert.equal(s.pendiente(),false);s.controller.cerrar();
});
test('mutación confirmada actualiza caché y bloqueo inmediato impide doble envío',async()=>{
  const escritura=diferida();let items=[];let envios=0;
  const s=escenario({cache:copia('a',[]),obtener:async()=>items,agregar:()=>{envios++;return escritura.promise;}});s.controller.iniciar();await flush();
  const p=s.controller.agregar(item);await assert.rejects(s.controller.agregar(item),/operación anterior/);await flush();
  items=[item];escritura.resolve();await p;assert.equal(envios,1);assert.equal(s.controller.snapshot().lista.length,1);assert.equal(s.escrituras.at(-1).items.length,1);s.controller.cerrar();
});
