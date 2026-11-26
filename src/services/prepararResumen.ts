import type { ListaItem, MetadatosObra, TipoMedio } from '../types';
import { conTiempo } from '../utils/tiempo';

export interface ProgresoResumen {
  fase: 'fechas' | 'metadatos';
  procesadas: number;
  total: number;
}
export interface OperacionesResumen {
  vigente: () => boolean;
  // Estas escrituras deben pasar por ListaController: bloqueo, promesa real y caché.
  migrarFecha: (id: string) => Promise<void>;
  completarMetadatos: (
    id: string,
    anio: number,
    datos: MetadatosObra,
  ) => Promise<void>;
  obtenerLista: () => Promise<readonly ListaItem[]>;
  obtenerMetadatos: (
    tipo: TipoMedio,
    id: number,
    signal?: AbortSignal,
  ) => Promise<MetadatosObra>;
}

/** No se invoca automáticamente. La selección de candidatas requiere PA-03. */
export async function prepararResumen(
  anio: number,
  esCandidata: (item: ListaItem) => boolean,
  operaciones: OperacionesResumen,
  progreso: (estado: ProgresoResumen) => void,
  signal?: AbortSignal,
): Promise<{ fallosTmdb: string[] }> {
  if (!Number.isInteger(anio)) throw new Error('El año no es válido.');
  const comprobar = () => {
    if (signal?.aborted || !operaciones.vigente())
      throw new Error(
        'Proceso detenido: cambió la sesión, selección o conexión.',
      );
  };
  comprobar();
  const inicial = await conTiempo(operaciones.obtenerLista());
  comprobar();
  const fechas = inicial.filter(
    (item) => item.estado === 'vista' && item.vistaEn == null,
  );
  progreso({ fase: 'fechas', procesadas: 0, total: fechas.length });
  for (const [index, item] of fechas.entries()) {
    comprobar();
    await operaciones.migrarFecha(`${item.tipo}_${item.tmdbId}`);
    comprobar();
    progreso({ fase: 'fechas', procesadas: index + 1, total: fechas.length });
  }
  comprobar();
  const actuales = await conTiempo(operaciones.obtenerLista());
  comprobar();
  const candidatas = actuales.filter(
    (item) =>
      item.estado === 'vista' &&
      item.vistaEn &&
      new Date(item.vistaEn).getFullYear() === anio &&
      esCandidata(item),
  );
  const fallosTmdb: string[] = [];
  progreso({ fase: 'metadatos', procesadas: 0, total: candidatas.length });
  for (const [index, item] of candidatas.entries()) {
    comprobar();
    const id = `${item.tipo}_${item.tmdbId}`;
    let datos: MetadatosObra;
    try {
      datos = await conTiempo(
        operaciones.obtenerMetadatos(item.tipo, item.tmdbId, signal),
      );
    } catch {
      comprobar();
      fallosTmdb.push(id);
      progreso({
        fase: 'metadatos',
        procesadas: index + 1,
        total: candidatas.length,
      });
      continue;
    }
    comprobar();
    // Un fallo/timeout de escritura es bloqueante: no contarlo como fallo TMDB.
    await operaciones.completarMetadatos(id, anio, datos);
    comprobar();
    progreso({
      fase: 'metadatos',
      procesadas: index + 1,
      total: candidatas.length,
    });
  }
  return { fallosTmdb };
}
