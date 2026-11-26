import { listaService } from '../src/services/listaService';
import { Timestamp } from 'firebase/firestore';
import { beforeEach, expect, it, vi } from 'vitest';
import { planificarCambioVista } from '../src/dominio/cambioVista';

const memoria = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  escrituras: 0,
}));
vi.mock('../src/firebase/config', () => ({
  getFirebaseAuth: () => ({
    app: {},
    currentUser: { uid: 'a', isAnonymous: false },
  }),
}));
vi.mock('../src/services/tmdbService', () => ({
  tmdbService: {
    obtenerMetadatos: vi.fn(async () => ({
      generos: ['Drama'],
      duracionMin: 120,
      directores: ['Ana'],
    })),
  },
}));
vi.mock('firebase/firestore', () => {
  class Timestamp {
    private date: Date;
    constructor(seconds: number, nanoseconds = 0) {
      this.date = new Date(seconds * 1000 + nanoseconds / 1e6);
    }
    toDate() {
      return this.date;
    }
  }
  const marca = () => new Timestamp(Date.parse('2025-08-02T12:00:00Z') / 1000);
  return {
    Timestamp,
    serverTimestamp: marca,
    getFirestore: () => ({}),
    doc: (_db: unknown, ...p: string[]) => ({ firestore: {}, id: p.join('/') }),
    collection: vi.fn(),
    getDocsFromServer: vi.fn(),
    runTransaction: async (
      _db: unknown,
      callback: (tx: unknown) => Promise<void>,
    ) =>
      callback({
        get: async (ref: { id: string }) => ({
          exists: () => memoria.docs.has(ref.id),
          data: () => memoria.docs.get(ref.id),
        }),
        set: (ref: { id: string }, data: Record<string, unknown>) => {
          memoria.escrituras++;
          memoria.docs.set(ref.id, data);
        },
        update: (ref: { id: string }, data: Record<string, unknown>) => {
          memoria.escrituras++;
          memoria.docs.set(ref.id, { ...memoria.docs.get(ref.id), ...data });
        },
        delete: vi.fn(),
      }),
  };
});
const key = 'usuarios/a/mi_lista/movie_1';
const obra = {
  tmdbId: 1,
  tipo: 'movie' as const,
  titulo: 'Historia',
  anio: '2020',
  posterPath: null,
};
const edicion = {
  estado: 'vista' as const,
  comentario: '',
  calificacionPersonal: 4 as const,
};
beforeEach(() => {
  memoria.docs.clear();
  memoria.escrituras = 0;
});

it('V01/V02/V03: órdenes puras y servicio con transacción simulada conserva/limpia/renueva fecha', async () => {
  expect(planificarCambioVista('por_ver', 'vista')).toBe('servidor');
  expect(planificarCambioVista('vista', 'vista')).toBe('conservar');
  expect(planificarCambioVista('vista', 'viendo')).toBe('limpiar');
  await listaService.agregar('a', obra);
  expect(memoria.docs.get(key)).toMatchObject({
    ...obra,
    vistaEn: null,
    generos: ['Drama'],
    duracionMin: 120,
    directores: ['Ana'],
  });
  await listaService.actualizar('a', 'movie_1', edicion);
  const fecha = memoria.docs.get(key)!.vistaEn;
  expect(fecha).toBeInstanceOf(Timestamp);
  await listaService.actualizar('a', 'movie_1', {
    ...edicion,
    comentario: 'Nuevo',
  });
  expect(memoria.docs.get(key)!.vistaEn).toBe(fecha);
  await listaService.actualizar('a', 'movie_1', {
    ...edicion,
    estado: 'viendo',
  });
  expect(memoria.docs.get(key)).toMatchObject({
    vistaEn: null,
    calificacionPersonal: null,
  });
  await listaService.actualizar('a', 'movie_1', edicion);
  expect(memoria.docs.get(key)!.vistaEn).not.toBe(fecha);
});
it('V16/V17: legado migra exactamente actualizadoEn y repetir no escribe', async () => {
  const fecha = new Timestamp(Date.parse('1970-06-01T12:00:00Z') / 1000, 0);
  memoria.docs.set(key, { ...obra, estado: 'vista', actualizadoEn: fecha });
  await listaService.migrarFecha('a', 'movie_1', () => true);
  expect(memoria.docs.get(key)!.vistaEn).toBe(fecha);
  await listaService.migrarFecha('a', 'movie_1', () => true);
  expect(memoria.escrituras).toBe(1);
});
it('V18: completa solo ausentes, conserva null/[] existentes y repetir no escribe', async () => {
  memoria.docs.set(key, {
    ...obra,
    estado: 'vista',
    vistaEn: new Timestamp(Date.parse('1970-06-01T12:00:00Z') / 1000, 0),
    generos: [],
    duracionMin: null,
    comentario: 'Conservar',
  });
  const datos = { generos: ['Drama'], duracionMin: 120, directores: ['Ana'] };
  await listaService.completarMetadatos(
    'a',
    'movie_1',
    1970,
    datos,
    () => true,
  );
  expect(memoria.docs.get(key)).toMatchObject({
    generos: [],
    duracionMin: null,
    directores: ['Ana'],
    comentario: 'Conservar',
  });
  await listaService.completarMetadatos(
    'a',
    'movie_1',
    1970,
    datos,
    () => true,
  );
  expect(memoria.escrituras).toBe(1);
});
it('V17/V23: guard, otro usuario, otro año y entrada eliminada impiden escribir', async () => {
  memoria.docs.set(key, {
    ...obra,
    estado: 'vista',
    vistaEn: new Timestamp(Date.parse('1970-06-01T12:00:00Z') / 1000, 0),
  });
  await expect(
    listaService.migrarFecha('a', 'movie_1', () => false),
  ).rejects.toThrow();
  await expect(
    listaService.migrarFecha('b', 'movie_1', () => true),
  ).rejects.toThrow('sesión');
  await listaService.completarMetadatos(
    'a',
    'movie_1',
    2025,
    { generos: [], duracionMin: null, directores: [] },
    () => true,
  );
  memoria.docs.clear();
  await listaService.migrarFecha('a', 'movie_1', () => true);
  expect(memoria.escrituras).toBe(0);
});
