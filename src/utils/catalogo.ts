import type { ResultadoBusqueda } from '../types';
export function claveContenido(item: { tipo: string; tmdbId: number }): string { return `${item.tipo}_${item.tmdbId}`; }
export function combinarResultados(previos: ResultadoBusqueda[], nuevos: ResultadoBusqueda[]): ResultadoBusqueda[] {
  const vistos = new Set<string>();
  return [...previos, ...nuevos].filter(item => {
    const key = claveContenido(item);
    if (vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });
}
