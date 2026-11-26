import { afterEach, expect, it, vi } from 'vitest';
import { tmdbService } from '../src/services/tmdbService';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function responder(raw: unknown) {
  vi.stubEnv('EXPO_PUBLIC_TMDB_TOKEN', 'fixture-sin-credenciales-reales');
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () => new Response(JSON.stringify(raw), { status: 200 }),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
it('V04: película guarda nombres es-ES, minutos y solo equipo Director', async () => {
  const fetch = responder({
    id: 1,
    genres: [{ name: 'Ciencia ficción' }, { name: 'Drama' }],
    runtime: 120,
    credits: {
      crew: [
        { name: 'Ana', job: 'Director' },
        { name: 'Otra', job: 'Writer' },
      ],
    },
  });
  expect(await tmdbService.obtenerMetadatos('movie', 1)).toEqual({
    generos: ['Ciencia ficción', 'Drama'],
    duracionMin: 120,
    directores: ['Ana'],
  });
  const url = new URL(fetch.mock.calls[0][0] as string);
  expect(url.searchParams.get('language')).toBe('es-ES');
  expect(url.searchParams.get('append_to_response')).toBe('credits');
});
it('V04: series sin minutos/directores y null legítimo de película', async () => {
  responder({ id: 1, genres: [{ name: 'Drama' }] });
  expect(await tmdbService.obtenerMetadatos('tv', 1)).toEqual({
    generos: ['Drama'],
    duracionMin: null,
    directores: [],
  });
  responder({ id: 1, genres: [], runtime: null, credits: { crew: [] } });
  expect(await tmdbService.obtenerMetadatos('movie', 1)).toEqual({
    generos: [],
    duracionMin: null,
    directores: [],
  });
});
it('V04: rechaza respuesta incompleta y duración negativa sin inventar metadatos', async () => {
  responder({ id: 1 });
  await expect(tmdbService.obtenerMetadatos('movie', 1)).rejects.toThrow(
    'incompletos',
  );
  responder({ id: 1, genres: [], runtime: -5, credits: { crew: [] } });
  await expect(tmdbService.obtenerMetadatos('movie', 1)).rejects.toThrow(
    'no válidos',
  );
});
