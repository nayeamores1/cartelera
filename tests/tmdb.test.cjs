/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function cargar(file, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(outputText, { exports, URL, AbortController, setTimeout, clearTimeout, process: { env: { EXPO_PUBLIC_TMDB_TOKEN: 'fixture-sin-credenciales-reales' } }, ...globals });
  return exports;
}
const configuracion = { images: { secure_base_url: 'https://images.example/', poster_sizes: ['w92', 'w185', 'w500', 'original'], profile_sizes: ['w45', 'w185', 'original'] } };
const movie = { id: 1, title: 'Película', poster_path: '/poster.jpg', release_date: '2024-02-01' };
const tv = { id: 1, name: 'Serie', poster_path: null, first_air_date: '' };
function sdk(resolver) {
  const llamadas = [];
  const service = cargar('src/services/tmdbService.ts', { fetch: async (url, options) => {
    llamadas.push({ url: new URL(url), options });
    const data = await resolver(new URL(url), options);
    return { ok: true, status: 200, json: async () => data };
  } });
  return { ...service, llamadas };
}
test('texto vacío no consulta ni necesita token', async () => {
  const { tmdbService } = cargar('src/services/tmdbService.ts', { process: { env: {} }, fetch: () => assert.fail('No debe consultar') });
  assert.equal((await tmdbService.buscar('  ', 1, 'todo')).resultados.length, 0);
});
test('endpoints, Bearer, idioma, normalización y caché de configuración', async () => {
  const { tmdbService, llamadas } = sdk(url => url.pathname.endsWith('/configuration') ? configuracion : { page: 1, total_pages: 3, total_results: 40, results: url.pathname.endsWith('/tv') ? [tv] : [movie] });
  const peliculas = await tmdbService.buscar('  historia  ', 1, 'movie');
  const series = await tmdbService.buscar('historia', 1, 'tv');
  assert.equal(peliculas.resultados[0].tipo, 'movie');
  assert.equal(peliculas.resultados[0].anio, '2024');
  assert.equal(peliculas.resultados[0].posterUrl, 'https://images.example/w185/poster.jpg');
  assert.equal(series.resultados[0].tipo, 'tv');
  assert.equal(series.resultados[0].anio, null);
  assert.equal(series.resultados[0].posterUrl, null);
  assert.equal(llamadas.filter(x => x.url.pathname.endsWith('/configuration')).length, 1);
  for (const call of llamadas) {
    assert.equal(call.url.searchParams.get('language'), 'es-ES');
    assert.match(call.options.headers.Authorization, /^Bearer /);
    assert.equal(call.url.searchParams.has('api_key'), false);
  }
  assert.equal(llamadas[0].url.searchParams.get('query'), 'historia');
});
test('multi excluye personas y conserva páginas aunque no queden obras', async () => {
  const { tmdbService } = sdk(url => url.pathname.endsWith('/configuration') ? configuracion : { page: 2, total_pages: 4, total_results: 80, results: [{ id: 9, media_type: 'person', name: 'Persona' }] });
  const pagina = await tmdbService.buscar('persona', 2, 'todo');
  assert.equal(pagina.resultados.length, 0);
  assert.equal(pagina.pagina, 2);
  assert.equal(pagina.totalPaginas, 4);
});
test('deduplicación usa tipo más ID y conserva orden', () => {
  const { combinarResultados } = cargar('src/utils/catalogo.ts');
  const result = combinarResultados([{ tipo: 'movie', tmdbId: 1 }], [{ tipo: 'movie', tmdbId: 1 }, { tipo: 'tv', tmdbId: 1 }]);
  assert.equal(result.length, 2);
  assert.equal(result[1].tipo, 'tv');
});
test('detalle usa credits en una petición, sinopsis alternativa y votos ausentes', async () => {
  const { tmdbService, llamadas } = sdk(url => url.pathname.endsWith('/configuration') ? configuracion : { ...movie, overview: '', vote_count: 0, vote_average: 0, credits: { cast: [{ id: 2, name: 'Actor', character: '', profile_path: '/actor.jpg' }] } });
  const detalle = await tmdbService.obtenerDetalle('movie', 1);
  assert.match(detalle.sinopsis, /No hay sinopsis/);
  assert.equal(detalle.totalVotos, 0);
  assert.equal(detalle.posterUrl, 'https://images.example/w500/poster.jpg');
  assert.equal(detalle.elenco[0].personaje, 'Personaje no disponible');
  assert.equal(llamadas[0].url.searchParams.get('append_to_response'), 'credits');
  assert.equal(llamadas.some(x => x.url.pathname.endsWith('/credits')), false);
});
test('imágenes respetan tamaños disponibles y path ausente', () => {
  const { construirUrlImagen } = sdk(() => ({}));
  const config = { secureBaseUrl: 'https://images.example/', posterSizes: ['w300'], profileSizes: ['original'] };
  assert.equal(construirUrlImagen(config, '/x.jpg', 'detalle'), 'https://images.example/w300/x.jpg');
  assert.equal(construirUrlImagen(config, null, 'tarjeta'), null);
  assert.equal(construirUrlImagen(config, 'https://otro.example/x.jpg', 'tarjeta'), null);
});
test('429 y fallos HTTP no se reintentan automáticamente ni exponen respuesta', async () => {
  let llamadas = 0;
  const { tmdbService } = cargar('src/services/tmdbService.ts', { fetch: async () => { llamadas++; return { ok: false, status: 429 }; } });
  await assert.rejects(tmdbService.buscar('historia'), error => error.http === 429 && error.codigo === 'http' && /Espera/.test(error.message));
  assert.equal(llamadas, 1);
});
test('red, JSON inválido, timeout y cancelación se distinguen', async () => {
  const red = cargar('src/services/tmdbService.ts', { fetch: async () => { throw new Error('contenido privado'); } });
  await assert.rejects(red.tmdbService.buscar('historia'), error => error.codigo === 'red' && !error.message.includes('contenido privado'));
  const json = cargar('src/services/tmdbService.ts', { fetch: async () => ({ ok: true, json: async () => { throw new Error(); } }) });
  await assert.rejects(json.tmdbService.buscar('historia'), error => error.codigo === 'respuesta');
  const abortedFetch = async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error())));
  const cancel = cargar('src/services/tmdbService.ts', { fetch: abortedFetch });
  const controller = new AbortController();
  const p = cancel.tmdbService.buscar('historia', 1, 'todo', controller.signal);
  controller.abort();
  await assert.rejects(p, error => error.codigo === 'cancelada');
  const timeout = cargar('src/services/tmdbService.ts', { fetch: abortedFetch, setTimeout: callback => setTimeout(callback, 1) });
  await assert.rejects(timeout.tmdbService.buscar('historia'), error => error.codigo === 'timeout');
});
