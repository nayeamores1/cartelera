import type { CopiaLocal, Edicion, ListaItem, ObraLista } from '../types';
const campos = [
  'tmdbId',
  'tipo',
  'titulo',
  'anio',
  'posterPath',
  'estado',
  'calificacionPersonal',
  'comentario',
  'agregadoEn',
  'actualizadoEn',
];
const nuevos = ['vistaEn', 'generos', 'duracionMin', 'directores'];
export function validarMetadatos(
  v: Record<string, unknown>,
  completos = false,
): void {
  const nombres = (a: unknown) =>
    Array.isArray(a) &&
    a.length <= 10 &&
    Array.from(a).every((n) => typeof n === 'string');
  if (
    ((completos || Object.hasOwn(v, 'generos')) && !nombres(v.generos)) ||
    ((completos || Object.hasOwn(v, 'directores')) && !nombres(v.directores)) ||
    ((completos || Object.hasOwn(v, 'duracionMin')) &&
      !(
        v.duracionMin === null ||
        (typeof v.duracionMin === 'number' &&
          Number.isInteger(v.duracionMin) &&
          v.duracionMin >= 1 &&
          v.duracionMin <= 1000)
      )) ||
    (v.tipo === 'tv' &&
      ((v.duracionMin !== undefined && v.duracionMin !== null) ||
        (Array.isArray(v.directores) && v.directores.length > 0)))
  )
    throw new Error('Los metadatos de la obra no son válidos.');
}
export function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
export function validarObra(v: unknown): asserts v is ObraLista {
  if (
    !esObjeto(v) ||
    typeof v.tmdbId !== 'number' ||
    !Number.isInteger(v.tmdbId) ||
    v.tmdbId <= 0 ||
    typeof v.tipo !== 'string' ||
    !['movie', 'tv'].includes(v.tipo) ||
    typeof v.titulo !== 'string' ||
    !v.titulo.trim() ||
    v.titulo.length > 200 ||
    typeof v.anio !== 'string' ||
    !(v.posterPath === null || typeof v.posterPath === 'string')
  )
    throw new Error('Los datos de la obra no son válidos.');
}
export function validarEdicion(v: unknown): asserts v is Edicion {
  if (
    !esObjeto(v) ||
    typeof v.estado !== 'string' ||
    !['por_ver', 'viendo', 'vista'].includes(v.estado) ||
    typeof v.comentario !== 'string' ||
    v.comentario.length > 500 ||
    !(
      v.calificacionPersonal === null ||
      (typeof v.calificacionPersonal === 'number' &&
        Number.isInteger(v.calificacionPersonal) &&
        v.calificacionPersonal >= 1 &&
        v.calificacionPersonal <= 5)
    ) ||
    (v.estado !== 'vista' && v.calificacionPersonal !== null)
  )
    throw new Error(
      'Revisa el estado, la calificación (1–5 solo en Vista) y el comentario (máximo 500 caracteres).',
    );
}
export function normalizarEdicion(v: Edicion): Edicion {
  const result = {
    estado: v.estado,
    calificacionPersonal: v.estado === 'vista' ? v.calificacionPersonal : null,
    comentario: v.comentario,
  };
  validarEdicion(result);
  return result;
}
export function esFecha(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    !Number.isNaN(Date.parse(v)) &&
    new Date(v).toISOString() === v
  );
}
export function validarItem(v: unknown): asserts v is ListaItem {
  validarObra(v);
  validarEdicion(v);
  if (
    !esObjeto(v) ||
    !Object.keys(v).every((key) => [...campos, ...nuevos].includes(key)) ||
    !campos.every((key) => Object.hasOwn(v, key)) ||
    !esFecha(v.agregadoEn) ||
    !esFecha(v.actualizadoEn) ||
    (Object.hasOwn(v, 'vistaEn') &&
      !(v.vistaEn === null || (v.estado === 'vista' && esFecha(v.vistaEn))))
  )
    throw new Error('La copia contiene una entrada no válida.');
  validarMetadatos(v);
}
export function validarCopia(v: unknown, uid: string): asserts v is CopiaLocal {
  if (
    !esObjeto(v) ||
    (v.version !== 1 && v.version !== 2) ||
    v.uid !== uid ||
    !esFecha(v.savedAt) ||
    !Array.isArray(v.items) ||
    Object.keys(v).length !== 4
  )
    throw new Error('No se pudo leer la copia guardada.');
  const ids = new Set<string>();
  for (const item of v.items) {
    validarItem(item);
    const id = `${item.tipo}_${item.tmdbId}`;
    if (ids.has(id)) throw new Error('La copia contiene entradas repetidas.');
    ids.add(id);
  }
}
export const nombreEstado = {
  por_ver: 'Por ver',
  viendo: 'Viendo',
  vista: 'Vista',
};
