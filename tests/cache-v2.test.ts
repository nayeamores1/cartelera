import { beforeEach, expect, it, vi } from 'vitest';
import { cacheService, iniciarCache } from '../src/services/cacheService';
import type { CopiaLocal } from '../src/types';
const store = vi.hoisted(() => new Map<string, string>());
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  },
}));
const copia: CopiaLocal = {
  version: 1,
  uid: 'a',
  savedAt: '2025-06-01T12:00:00.000Z',
  items: [],
};
beforeEach(() => store.clear());
it('v1 se conserva; v2 tiene prioridad y marcador incierto sobrevive al cambio de versión', async () => {
  const key = 'cartelera:lista:v1:a';
  store.set(key, JSON.stringify(copia));
  await cacheService.marcarPendiente('a', true);
  expect(await cacheService.leer('a')).toEqual(copia);
  await cacheService.guardar({ ...copia, version: 2 }, iniciarCache('a'));
  expect((await cacheService.leer('a'))!.version).toBe(2);
  expect(store.get(key)).toBe(JSON.stringify(copia));
  expect(await cacheService.tienePendiente('a')).toBe(true);
  expect(await cacheService.leer('b')).toBe(null);
});
it('rechaza una nueva copia malformada conservando las dos copias válidas', async () => {
  const sesion = iniciarCache('a');
  store.set('cartelera:lista:v1:a', JSON.stringify(copia));
  await cacheService.guardar({ ...copia, version: 2 }, sesion);
  const anterior = new Map(store);
  await expect(
    cacheService.guardar({ ...copia, version: 2, savedAt: 'inválido' }, sesion),
  ).rejects.toThrow();
  expect(store).toEqual(anterior);
});
