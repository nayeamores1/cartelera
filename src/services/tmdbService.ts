import type { ConfiguracionImagenes, Detalle, FiltroTipo, IntegranteElenco, PaginaResultados, ResultadoBusqueda, TipoMedio } from '../types';

const BASE = 'https://api.themoviedb.org/3';
const TIMEOUT_MS = 15000;
const CONFIG_TTL_MS = 24 * 60 * 60 * 1000;
let cache: { datos: ConfiguracionImagenes; expira: number } | null = null;
export class TmdbError extends Error {
  constructor(message: string, public readonly codigo: 'cancelada' | 'timeout' | 'red' | 'http' | 'respuesta' | 'configuracion', public readonly http?: number) { super(message); }
}
export function esCancelacionTmdb(error: unknown): boolean { return error instanceof TmdbError && error.codigo === 'cancelada'; }
export function mensajeErrorTmdb(error: unknown): string { return error instanceof TmdbError ? error.message : 'No se pudieron cargar los datos. Inténtalo nuevamente.'; }

async function peticion(ruta: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<unknown> {
  if (signal?.aborted) throw new TmdbError('Solicitud cancelada.', 'cancelada');
  const token = process.env.EXPO_PUBLIC_TMDB_TOKEN;
  if (!token?.trim()) throw new TmdbError('Falta configurar EXPO_PUBLIC_TMDB_TOKEN. Reinicia Expo después de completarlo.', 'configuracion');
  const controller = new AbortController();
  let timeout = false;
  const cancelar = () => controller.abort();
  signal?.addEventListener('abort', cancelar);
  const timer = setTimeout(() => { timeout = true; controller.abort(); }, TIMEOUT_MS);
  try {
    const url = new URL(`${BASE}${ruta}`);
    url.searchParams.set('language', 'es-ES');
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) {
      const mensajes: Record<number, string> = {
        401: 'TMDB rechazó la autorización. Revisa la configuración del token.',
        403: 'TMDB no permite acceder a estos datos.',
        404: 'Este título ya no está disponible en TMDB.',
        429: 'TMDB recibió demasiadas solicitudes. Espera un momento antes de reintentar.',
      };
      throw new TmdbError(mensajes[response.status] ?? 'TMDB no pudo completar la solicitud. Inténtalo más tarde.', 'http', response.status);
    }
    try { return await response.json(); }
    catch { if (controller.signal.aborted) throw new Error('aborted'); throw new TmdbError('TMDB devolvió una respuesta que no se pudo interpretar.', 'respuesta'); }
  } catch (error: unknown) {
    if (signal?.aborted) throw new TmdbError('Solicitud cancelada.', 'cancelada');
    if (timeout) throw new TmdbError('La solicitud tardó demasiado. Revisa tu conexión y vuelve a intentarlo.', 'timeout');
    if (error instanceof TmdbError) throw error;
    throw new TmdbError('No se pudo conectar con TMDB. Revisa tu conexión a Internet.', 'red');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancelar); }
}
function objeto(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TmdbError('TMDB devolvió datos inesperados.', 'respuesta');
  return value as Record<string, unknown>;
}
function texto(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value : null; }
function numero(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function anio(value: unknown): string | null { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(0, 4) : null; }
function tamanos(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && (/^w\d+$/.test(item) || item === 'original')) : []; }
async function obtenerConfiguracion(signal?: AbortSignal): Promise<ConfiguracionImagenes> {
  if (signal?.aborted) throw new TmdbError('Solicitud cancelada.', 'cancelada');
  if (cache && cache.expira > Date.now()) return cache.datos;
  const raw = objeto(await peticion('/configuration', {}, signal));
  const images = objeto(raw.images);
  const base = texto(images.secure_base_url);
  if (!base || !base.startsWith('https://')) throw new TmdbError('La configuración de imágenes de TMDB no es válida.', 'respuesta');
  const datos: ConfiguracionImagenes = { secureBaseUrl: base.endsWith('/') ? base : `${base}/`, posterSizes: tamanos(images.poster_sizes), profileSizes: tamanos(images.profile_sizes) };
  cache = { datos, expira: Date.now() + CONFIG_TTL_MS };
  return datos;
}
export function construirUrlImagen(config: ConfiguracionImagenes, path: string | null, uso: 'tarjeta' | 'detalle' | 'elenco'): string | null {
  if (!path || !/^\/[\w.\/-]+$/.test(path)) return null;
  const disponibles = uso === 'elenco' ? config.profileSizes : config.posterSizes;
  const widths = disponibles.filter(size => /^w\d+$/.test(size)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const objetivo = uso === 'detalle' ? 500 : uso === 'elenco' ? 185 : 185;
  const size = widths.find(item => Number(item.slice(1)) >= objetivo) ?? widths.at(-1) ?? (disponibles.includes('original') ? 'original' : null);
  return size ? `${config.secureBaseUrl}${size}${path}` : null;
}
async function buscar(titulo: string, pagina = 1, filtroTipo: FiltroTipo = 'todo', signal?: AbortSignal): Promise<PaginaResultados> {
  const consulta = titulo.trim();
  if (!consulta) return { resultados: [], pagina: 0, totalPaginas: 0, totalResultados: 0 };
  if (!Number.isInteger(pagina) || pagina < 1 || pagina > 500) throw new TmdbError('La página solicitada no es válida.', 'respuesta');
  const endpoint = filtroTipo === 'todo' ? 'multi' : filtroTipo;
  const raw = objeto(await peticion(`/search/${endpoint}`, { query: consulta, page: String(pagina), include_adult: 'false' }, signal));
  if (!Array.isArray(raw.results) || numero(raw.page) < 1) throw new TmdbError('TMDB devolvió una búsqueda incompleta.', 'respuesta');
  const config = await obtenerConfiguracion(signal);
  const resultados: ResultadoBusqueda[] = [];
  for (const value of raw.results) {
    const item = objeto(value);
    const tipo = filtroTipo === 'todo' ? item.media_type : filtroTipo;
    if ((tipo !== 'movie' && tipo !== 'tv') || !Number.isInteger(item.id) || numero(item.id) <= 0) continue;
    const posterPath = texto(item.poster_path);
    resultados.push({ tmdbId: numero(item.id), tipo, titulo: texto(tipo === 'movie' ? item.title : item.name) ?? 'Título no disponible', anio: anio(tipo === 'movie' ? item.release_date : item.first_air_date), posterPath, posterUrl: construirUrlImagen(config, posterPath, 'tarjeta') });
  }
  return { resultados, pagina: numero(raw.page), totalPaginas: Math.min(500, Math.max(0, numero(raw.total_pages))), totalResultados: numero(raw.total_results) };
}
async function obtenerDetalle(tipo: TipoMedio, id: number, signal?: AbortSignal): Promise<Detalle> {
  if ((tipo !== 'movie' && tipo !== 'tv') || !Number.isInteger(id) || id <= 0) throw new TmdbError('El título solicitado no es válido.', 'respuesta');
  const raw = objeto(await peticion(`/${tipo}/${id}`, { append_to_response: 'credits' }, signal));
  if (raw.id !== id) throw new TmdbError('TMDB devolvió un detalle inesperado.', 'respuesta');
  const config = await obtenerConfiguracion(signal);
  const posterPath = texto(raw.poster_path);
  const credits = raw.credits && typeof raw.credits === 'object' ? objeto(raw.credits) : {};
  const elenco: IntegranteElenco[] = [];
  const ids = new Set<number>();
  for (const value of Array.isArray(credits.cast) ? credits.cast : []) {
    const actor = objeto(value);
    const actorId = numero(actor.id);
    if (!Number.isInteger(actorId) || actorId <= 0 || ids.has(actorId)) continue;
    ids.add(actorId);
    elenco.push({ id: actorId, nombre: texto(actor.name) ?? 'Nombre no disponible', personaje: texto(actor.character) ?? 'Personaje no disponible', perfilUrl: construirUrlImagen(config, texto(actor.profile_path), 'elenco') });
  }
  return { tmdbId: id, tipo, titulo: texto(tipo === 'movie' ? raw.title : raw.name) ?? 'Título no disponible', anio: anio(tipo === 'movie' ? raw.release_date : raw.first_air_date), posterPath, posterUrl: construirUrlImagen(config, posterPath, 'detalle'), sinopsis: texto(raw.overview) ?? 'No hay sinopsis disponible en español.', puntuacionTmdb: Math.min(10, Math.max(0, numero(raw.vote_average))), totalVotos: Math.max(0, numero(raw.vote_count)), elenco };
}
export const tmdbService = { buscar, obtenerDetalle, obtenerConfiguracion, construirUrlImagen };
