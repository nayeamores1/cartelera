import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResumenController } from '../src/services/resumenController';
import {
  adaptarResumen,
  candidataAprobada,
} from '../src/services/adaptarResumen';
import type { ListaItem } from '../src/types';
import type { EstadoLista } from '../src/services/listaController';

const fecha = '2025-06-01T12:00:00.000Z';
const obra: ListaItem = {
  tmdbId: 1,
  tipo: 'movie',
  titulo: 'Historia',
  anio: '2020',
  posterPath: null,
  estado: 'vista',
  calificacionPersonal: 4,
  comentario: '',
  agregadoEn: fecha,
  actualizadoEn: fecha,
  vistaEn: fecha,
  generos: ['Drama'],
  duracionMin: 120,
  directores: ['Ana'],
};
const reloj = () => new Date('2025-08-01T12:00:00Z');
const clientes: ResumenController[] = [];
afterEach(() => {
  clientes.forEach((c) => c.cerrar());
  clientes.length = 0;
  vi.unstubAllEnvs();
});
const flush = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
};
function diferida<T>() {
  let resolve!: (valor: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function escenario(
  items: ListaItem[] = [obra],
  cambios: Partial<EstadoLista> = {},
) {
  let base: EstadoLista = {
    lista: items,
    ultimaCopia: fecha,
    tieneCopia: true,
    cargandoLista: false,
    mutandoLista: false,
    errorLista: null,
    pendiente: false,
    confirmada: true,
    conexion: 'conectado',
    ...cambios,
  };
  const listeners = new Set<() => void>();
  const cambiar = (cambio: Partial<EstadoLista>) => {
    base = { ...base, ...cambio };
    listeners.forEach((f) => f());
  };
  const fuente = {
    snapshot: () => base,
    subscribe: (callback: () => void) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    refrescar: vi.fn(async () => true),
    migrarFecha: vi.fn(async (id: string, vigente: () => boolean) => {
      if (!vigente()) throw new Error('Cambio de sesión');
      cambiar({
        lista: base.lista.map((item) =>
          `${item.tipo}_${item.tmdbId}` === id
            ? { ...item, vistaEn: item.actualizadoEn }
            : item,
        ),
      });
    }),
    completarMetadatos: vi.fn(
      async (
        id: string,
        _anio: number,
        datos: {
          generos: readonly string[];
          duracionMin: number | null;
          directores: readonly string[];
        },
        vigente: () => boolean,
      ) => {
        if (!vigente()) throw new Error('Cambio de sesión');
        cambiar({
          lista: base.lista.map((item) =>
            `${item.tipo}_${item.tmdbId}` === id ? { ...item, ...datos } : item,
          ),
        });
      },
    ),
  };
  const tmdb = {
    obtenerMetadatos: vi.fn(async () => ({
      generos: ['Drama'],
      duracionMin: 90,
      directores: ['Ana'],
    })),
    obtenerConfiguracion: vi.fn(async () => ({
      secureBaseUrl: 'https://images.example/',
      posterSizes: ['w185'],
      profileSizes: [],
    })),
    construirUrlImagen: vi.fn(() => 'https://images.example/w185/p.jpg'),
  };
  const controller = new ResumenController(fuente, reloj, tmdb);
  clientes.push(controller);
  return { controller, fuente, tmdb, cambiar, base: () => base };
}
describe('P16 integración real del controlador, sin servicios remotos', () => {
  it('V16/V23: reconectar espera confirmación remota y migra D2 una sola vez', async () => {
    const e = escenario([{ ...obra, vistaEn: undefined }], {
      conexion: 'sin-conexion',
      confirmada: false,
    });
    e.controller.iniciar();
    expect(e.controller.snapshot().puntoPendiente).toBe('PA-02/PA-04');
    e.cambiar({ conexion: 'conectado' });
    await flush();
    expect(e.fuente.migrarFecha).not.toHaveBeenCalled();
    e.cambiar({ confirmada: true });
    await flush();
    expect(e.controller.snapshot().peticion.estado).toBe('exito');
    e.cambiar({});
    await flush();
    expect(e.fuente.migrarFecha).toHaveBeenCalledTimes(1);
  });
  it('V23: error remoto previo no impide consultar la copia al perder conexión', () => {
    const e = escenario([obra], {
      conexion: 'sin-conexion',
      confirmada: false,
      cargandoLista: true,
      errorLista: 'El servidor tardó demasiado',
    });
    e.controller.iniciar();
    expect(e.controller.snapshot().peticion).toMatchObject({
      estado: 'exito',
      datos: { totalObras: 1 },
    });
    expect(e.tmdb.obtenerMetadatos).not.toHaveBeenCalled();
    expect(e.fuente.migrarFecha).not.toHaveBeenCalled();
  });
  it('V05/V07/V14: calcula datos conocidos y años exactos; ignora estreno/alta', async () => {
    const e = escenario([
      obra,
      { ...obra, tmdbId: 2, vistaEn: '2024-06-01T12:00:00Z' },
    ]);
    e.controller.iniciar();
    await flush();
    expect(e.controller.snapshot().anios).toEqual([2025, 2024]);
    expect(e.controller.snapshot().peticion).toMatchObject({
      estado: 'exito',
      datos: { totalObras: 1, horas: 2, peliculas: 1 },
    });
    expect(e.tmdb.obtenerMetadatos).not.toHaveBeenCalled();
  });
  it('V20/V21: carga no es vacío y vacío confirmado corresponde al actual', async () => {
    const e = escenario([], {
      cargandoLista: true,
      confirmada: false,
      tieneCopia: false,
    });
    e.controller.iniciar();
    expect(e.controller.snapshot().peticion.estado).toBe('cargando');
    e.cambiar({ cargandoLista: false, confirmada: true });
    await flush();
    expect(e.controller.snapshot().peticion).toMatchObject({
      estado: 'exito',
      datos: { totalObras: 0 },
    });
    expect(e.controller.snapshot().anios).toEqual([2025]);
  });
  it('V16/V17: conecta D2, muestra progreso y no vuelve a migrar por renders/listeners', async () => {
    const e = escenario([{ ...obra, vistaEn: undefined }]);
    const progreso: unknown[] = [];
    e.controller.subscribe(() => {
      const p = e.controller.snapshot().progreso;
      if (p) progreso.push(p);
    });
    e.controller.iniciar();
    e.controller.iniciar();
    await flush();
    expect(e.fuente.migrarFecha).toHaveBeenCalledTimes(1);
    expect(progreso).toContainEqual({
      fase: 'fechas',
      procesadas: 1,
      total: 1,
    });
    e.cambiar({});
    await flush();
    expect(e.fuente.migrarFecha).toHaveBeenCalledTimes(1);
    expect(e.base().lista[0].vistaEn).toBe(fecha);
  });
  it('V23: offline calcula con copia y cero escrituras/TMDB, incluso marcador incierto', async () => {
    const e = escenario([obra], {
      conexion: 'sin-conexion',
      confirmada: false,
      pendiente: true,
    });
    e.controller.iniciar();
    await flush();
    expect(e.controller.snapshot().peticion.estado).toBe('exito');
    expect(e.fuente.migrarFecha).not.toHaveBeenCalled();
    expect(e.fuente.completarMetadatos).not.toHaveBeenCalled();
    expect(e.tmdb.obtenerConfiguracion).not.toHaveBeenCalled();
    expect(e.tmdb.obtenerMetadatos).not.toHaveBeenCalled();
  });
  it('V25: sin copia offline informa PA-06, nunca vacío', () => {
    const e = escenario([], {
      conexion: 'sin-conexion',
      tieneCopia: false,
      ultimaCopia: null,
      confirmada: false,
    });
    e.controller.iniciar();
    expect(e.controller.snapshot()).toMatchObject({
      puntoPendiente: 'PA-06',
      peticion: { estado: 'error' },
    });
  });
  it('V24: PA-03 no clasifica vacíos como fallo ni inicia enriquecimiento', async () => {
    const e = escenario([{ ...obra, generos: [], duracionMin: null }]);
    e.controller.iniciar();
    await flush();
    expect(e.controller.snapshot()).toMatchObject({
      puntoPendiente: 'PA-03',
      peticion: { estado: 'error' },
    });
    expect(e.tmdb.obtenerMetadatos).not.toHaveBeenCalled();
    expect(() => candidataAprobada({ ...obra, generos: undefined })).toThrow(
      'PA-03',
    );
  });
  it('V12: empate completo de destacada captura PA-01 sin caída ni vacío', async () => {
    const e = escenario([obra, { ...obra, tmdbId: 2 }]);
    e.controller.iniciar();
    await flush();
    expect(e.controller.snapshot().puntoPendiente).toBe('PA-01');
    expect(e.controller.snapshot().peticion.estado).toBe('error');
  });
  it('V09: empate con mayúsculas/acentos captura PA-05 sin elegir ganador', async () => {
    const e = escenario([
      obra,
      {
        ...obra,
        tmdbId: 2,
        generos: ['drama'],
        vistaEn: '2025-07-01T12:00:00Z',
      },
    ]);
    e.controller.iniciar();
    await flush();
    expect(e.controller.snapshot().puntoPendiente).toBe('PA-05');
  });
  it('V25: fecha ausente offline conserva PA-02/PA-04, no inventa año', () => {
    const e = escenario([{ ...obra, vistaEn: undefined }], {
      conexion: 'sin-conexion',
      confirmada: false,
    });
    e.controller.iniciar();
    expect(e.controller.snapshot().puntoPendiente).toBe('PA-02/PA-04');
    expect(e.controller.snapshot().anios).toEqual([]);
  });
  it('V22: error remoto se muestra; reintento restaura datos sin fingir vacío', async () => {
    const e = escenario([obra], {
      confirmada: false,
      errorLista: 'No se pudo conectar',
    });
    e.controller.iniciar();
    expect(e.controller.snapshot().peticion).toMatchObject({
      estado: 'error',
      mensaje: 'No se pudo conectar',
    });
    e.fuente.refrescar.mockImplementation(async () => {
      e.cambiar({ confirmada: true, errorLista: null });
      return true;
    });
    await e.controller.reintentar();
    await flush();
    expect(e.controller.snapshot().peticion.estado).toBe('exito');
  });
  it('V15: cambia de año y descarta póster tardío del año anterior', async () => {
    const e = escenario([
      { ...obra, posterPath: '/p.jpg' },
      { ...obra, tmdbId: 2, vistaEn: '2024-07-01T12:00:00Z' },
    ]);
    const pendiente =
      diferida<Awaited<ReturnType<typeof e.tmdb.obtenerConfiguracion>>>();
    e.tmdb.obtenerConfiguracion.mockReturnValue(pendiente.promise);
    e.controller.iniciar();
    await flush();
    e.controller.seleccionarAnio(2024);
    await flush();
    pendiente.resolve({
      secureBaseUrl: 'https://images.example/',
      posterSizes: ['w185'],
      profileSizes: [],
    });
    await flush();
    expect(e.controller.snapshot().anio).toBe(2024);
    expect(e.controller.snapshot().poster).toBe(null);
    expect(e.controller.snapshot().peticion).toMatchObject({
      estado: 'exito',
      datos: { anio: 2024, totalObras: 1 },
    });
  });
  it('V15/V23: cerrar sesión/controlador invalida una migración diferida', async () => {
    const e = escenario([{ ...obra, vistaEn: undefined }]);
    const pendiente = diferida<void>();
    let vigente = () => false;
    e.fuente.migrarFecha.mockImplementation(async (_id, guard) => {
      vigente = guard;
      await pendiente.promise;
    });
    e.controller.iniciar();
    await flush();
    e.controller.cerrar();
    expect(vigente()).toBe(false);
    const anterior = e.controller.snapshot();
    pendiente.resolve();
    await flush();
    expect(e.controller.snapshot()).toBe(anterior);
    const otra = escenario([]);
    otra.controller.iniciar();
    await flush();
    expect(otra.controller.snapshot().peticion).toMatchObject({
      estado: 'exito',
      datos: { totalObras: 0 },
    });
  });
  it('V19: cola conectada continúa tras fallo TMDB con política inyectada solo en fixture', async () => {
    const e = escenario([
      { ...obra, generos: undefined },
      {
        ...obra,
        tmdbId: 2,
        generos: undefined,
        vistaEn: '2025-07-01T12:00:00Z',
      },
    ]);
    e.tmdb.obtenerMetadatos.mockRejectedValueOnce(new Error('red'));
    // Esta política es únicamente un dato de prueba, no la decisión PA-03 de producción.
    const c = new ResumenController(e.fuente, reloj, e.tmdb, () => true);
    clientes.push(c);
    c.iniciar();
    await flush();
    expect(e.tmdb.obtenerMetadatos).toHaveBeenCalledTimes(2);
    expect(e.fuente.completarMetadatos).toHaveBeenCalledTimes(1);
    expect(c.snapshot().peticion).toMatchObject({
      estado: 'exito',
      datos: { totalObras: 2, obrasSinDatos: 1, horas: 1.5 },
    });
  });
  it('V23: desconexión invalida guarda de una escritura aún no enviada', async () => {
    const e = escenario([{ ...obra, vistaEn: undefined }]);
    const pendiente = diferida<void>();
    let vigente = () => false;
    e.fuente.migrarFecha.mockImplementation(async (_id, guard) => {
      vigente = guard;
      await pendiente.promise;
    });
    e.controller.iniciar();
    await flush();
    e.cambiar({ conexion: 'sin-conexion', confirmada: false });
    expect(vigente()).toBe(false);
    pendiente.resolve();
    await flush();
    expect(e.controller.snapshot().puntoPendiente).toBe('PA-02/PA-04');
  });
});
it('V06: proyección usa fecha local con zona controlada, sin modificar el instante', () => {
  vi.stubEnv('TZ', 'America/Guayaquil');
  const entrada = { ...obra, vistaEn: '2026-01-01T02:00:00.000Z' };
  expect(adaptarResumen([entrada])[0].visionadoLocal).toEqual({
    anio: 2025,
    mes: 11,
    instanteMs: Date.parse(entrada.vistaEn),
  });
});
