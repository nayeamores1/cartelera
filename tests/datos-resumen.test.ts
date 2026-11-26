import { describe, expect, it, vi } from 'vitest';
import {
  prepararResumen,
  type OperacionesResumen,
} from '../src/services/prepararResumen';
import { validarItem, validarMetadatos } from '../src/utils/lista';
import type { ListaItem } from '../src/types';

const item: ListaItem = {
  tmdbId: 1,
  tipo: 'movie',
  titulo: 'Historia',
  anio: '2000',
  posterPath: null,
  estado: 'vista',
  calificacionPersonal: 4,
  comentario: '',
  agregadoEn: '2025-06-01T12:00:00.000Z',
  actualizadoEn: '2025-06-01T12:00:00.000Z',
  vistaEn: '2025-06-01T12:00:00.000Z',
};
const datos = { generos: ['Drama'], duracionMin: 120, directores: ['Ana'] };
function escenario(lista: ListaItem[] = [item]) {
  const ops: OperacionesResumen = {
    vigente: () => true,
    obtenerLista: vi.fn(async () => lista),
    migrarFecha: vi.fn(async () => {}),
    completarMetadatos: vi.fn(async () => {}),
    obtenerMetadatos: vi.fn(async () => datos),
  };
  return ops;
}
describe('T-DAT: preparación aislada, sin invocar backend real', () => {
  it('V23: offline no lee, migra ni consulta TMDB', async () => {
    const ops = escenario();
    ops.vigente = () => false;
    await expect(
      prepararResumen(2025, () => true, ops, vi.fn()),
    ).rejects.toThrow('Proceso detenido');
    expect(ops.obtenerLista).not.toHaveBeenCalled();
    expect(ops.obtenerMetadatos).not.toHaveBeenCalled();
    expect(ops.migrarFecha).not.toHaveBeenCalled();
  });
  it('V18/V19: secuencial, progreso, fallo parcial conserva candidatas y continúa', async () => {
    const segundo = { ...item, tmdbId: 2 };
    const ops = escenario([
      item,
      segundo,
      { ...item, tmdbId: 3, estado: 'por_ver', vistaEn: null },
      { ...item, tmdbId: 4, vistaEn: '2024-06-01T12:00:00.000Z' },
    ]);
    let activos = 0;
    let maximo = 0;
    ops.obtenerMetadatos = vi.fn(async (_tipo, id) => {
      activos++;
      maximo = Math.max(maximo, activos);
      await Promise.resolve();
      activos--;
      if (id === 1) throw new Error('red');
      return datos;
    });
    const progreso = vi.fn();
    const resultado = await prepararResumen(2025, () => true, ops, progreso);
    expect(resultado.fallosTmdb).toEqual(['movie_1']);
    expect(maximo).toBe(1);
    expect(ops.completarMetadatos).toHaveBeenCalledExactlyOnceWith(
      'movie_2',
      2025,
      datos,
    );
    expect(progreso).toHaveBeenLastCalledWith({
      fase: 'metadatos',
      procesadas: 2,
      total: 2,
    });
    expect(item.comentario).toBe('');
  });
  it('V16: fechas antes de seleccionar año, incluyendo otros años', async () => {
    const ops = escenario([{ ...item, vistaEn: undefined }]);
    await prepararResumen(2024, () => true, ops, vi.fn());
    expect(ops.migrarFecha).toHaveBeenCalledExactlyOnceWith('movie_1');
    expect(ops.obtenerMetadatos).not.toHaveBeenCalled();
  });
  it('V15: descarta respuesta TMDB tras cambiar selección/cuenta', async () => {
    const ops = escenario();
    let vigente = true;
    ops.vigente = () => vigente;
    ops.obtenerMetadatos = vi.fn(async () => {
      vigente = false;
      return datos;
    });
    await expect(
      prepararResumen(2025, () => true, ops, vi.fn()),
    ).rejects.toThrow('Proceso detenido');
    expect(ops.completarMetadatos).not.toHaveBeenCalled();
  });
  it('V22: escritura incierta detiene cola y no se presenta como fallo parcial TMDB', async () => {
    const ops = escenario([item, { ...item, tmdbId: 2 }]);
    ops.completarMetadatos = vi.fn(async () => {
      throw new Error('Resultado incierto');
    });
    await expect(
      prepararResumen(2025, () => true, ops, vi.fn()),
    ).rejects.toThrow('Resultado incierto');
    expect(ops.obtenerMetadatos).toHaveBeenCalledTimes(1);
  });
  it('V04/V24: documentos antiguos y null legítimo siguen siendo distintos de ausencia', () => {
    const legado = { ...item };
    delete legado.vistaEn;
    validarItem(legado);
    validarItem({ ...item, ...datos });
    validarMetadatos(
      { tipo: 'tv', generos: [], directores: [], duracionMin: null },
      true,
    );
    expect(legado).not.toHaveProperty('generos');
    for (const duracionMin of [-5, 0, 1.5, 1001, '120'])
      expect(() => validarMetadatos({ ...datos, duracionMin }, true)).toThrow();
    expect(() => validarItem({ ...item, ...datos, directores: [1] })).toThrow();
    expect(() =>
      validarItem({ ...item, estado: 'por_ver', calificacionPersonal: null }),
    ).toThrow();
  });
});
