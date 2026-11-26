import type { Calificacion, Estado, ListaItem, TipoMedio } from '../../types';

// Tipos de fixtures del contrato documental, no implementaciones de dominio.
interface EntradaFixture extends ListaItem {
  vistaEn: string | null;
  generos?: string[];
  duracionMin?: number | null;
  directores?: string[];
}

export interface ItemResumenFixture {
  entrada: EntradaFixture;
  visionadoLocal: { anio: number; mes: number; instanteMs: number } | null;
  estadoMetadatos: 'completos' | 'pendientes' | 'fallo';
}

interface FechaFixture {
  iso: string;
  anio: number;
  mes: number;
}

// Proyecciones fijas de America/Guayaquil, excepto la comparación explícita con UTC.
// No prueban ni implementan el adaptador de zona horaria de la capa exterior.
export const FECHAS = {
  anterior: { iso: '2024-06-10T17:00:00.000Z', anio: 2024, mes: 5 },
  limiteLocal: { iso: '2026-01-01T00:30:00.000Z', anio: 2025, mes: 11 },
  limiteUtc: { iso: '2026-01-01T00:30:00.000Z', anio: 2026, mes: 0 },
  enero: { iso: '2026-01-10T17:00:00.000Z', anio: 2026, mes: 0 },
  marzo: { iso: '2026-03-10T17:00:00.000Z', anio: 2026, mes: 2 },
  mayo: { iso: '2026-05-10T17:00:00.000Z', anio: 2026, mes: 4 },
  septiembre: { iso: '2026-09-10T17:00:00.000Z', anio: 2026, mes: 8 },
  diciembre: { iso: '2026-12-10T17:00:00.000Z', anio: 2026, mes: 11 },
} satisfies Record<string, FechaFixture>;

interface OpcionesFixture {
  id: number;
  tipo?: TipoMedio;
  estado?: Estado;
  calificacion?: Calificacion;
  fecha?: FechaFixture;
  generos?: string[];
  duracionMin?: number | null;
  directores?: string[];
  estadoMetadatos?: ItemResumenFixture['estadoMetadatos'];
}

export function obra({
  id,
  tipo = 'movie',
  estado = 'vista',
  calificacion = null,
  fecha = FECHAS.enero,
  generos = ['Drama'],
  duracionMin = tipo === 'movie' ? 120 : null,
  directores = [],
  estadoMetadatos = 'completos',
}: OpcionesFixture): ItemResumenFixture {
  // Instantes reproducibles distintos por ID evitan empates completos PA-01
  // accidentales en casos que prueban otra decisión. No se usa el reloj actual.
  const instanteMs = Date.parse(fecha.iso) + id * 1000;
  const vistaEn =
    estado === 'vista' ? new Date(instanteMs).toISOString() : null;
  return {
    entrada: {
      tmdbId: id,
      tipo,
      titulo: `Obra de prueba ${id}`,
      anio: '1999',
      posterPath: null,
      estado,
      calificacionPersonal: calificacion,
      comentario: 'Comentario conservado',
      agregadoEn: '2024-01-01T17:00:00.000Z',
      actualizadoEn: new Date(instanteMs).toISOString(),
      vistaEn,
      generos: [...generos],
      duracionMin,
      directores: [...directores],
    },
    visionadoLocal: vistaEn
      ? { anio: fecha.anio, mes: fecha.mes, instanteMs }
      : null,
    // Clasificación suministrada como dato: no decide cuándo null/[] es ausencia.
    estadoMetadatos,
  };
}

export function obraConDatosAusentes(
  id: number,
  tipo: TipoMedio,
): ItemResumenFixture {
  const item = obra({ id, tipo, estadoMetadatos: 'fallo' });
  delete item.entrada.generos;
  delete item.entrada.duracionMin;
  delete item.entrada.directores;
  return item;
}
