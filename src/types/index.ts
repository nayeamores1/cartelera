export type TipoMedio = 'movie' | 'tv';
export type TipoContenido = TipoMedio;
export type FiltroTipo = 'todo' | TipoMedio;
export type EstadoPeticion<T> =
  | { estado: 'inicial' }
  | { estado: 'cargando'; datos?: T }
  | { estado: 'error'; mensaje: string; datos?: T }
  | { estado: 'exito'; datos: T };
export type Estado = 'por_ver' | 'viendo' | 'vista';
export type Calificacion = 1 | 2 | 3 | 4 | 5 | null;
export interface Usuario { uid: string; email: string | null }
export interface Contenido {
  tmdbId: number;
  tipo: TipoContenido;
  titulo: string;
  posterPath: string | null;
}
export interface Detalle extends Contenido {
  anio: string | null;
  posterUrl: string | null;
  sinopsis: string;
  puntuacionTmdb: number;
  totalVotos: number;
  elenco: IntegranteElenco[];
}
export interface IntegranteElenco { id: number; nombre: string; personaje: string; perfilUrl: string | null }
export interface ResultadoBusqueda extends Contenido { anio: string | null; posterUrl: string | null }
export interface ConfiguracionImagenes { secureBaseUrl: string; posterSizes: string[]; profileSizes: string[] }
export interface ObraLista extends Contenido { anio: string }
export interface ListaItem extends ObraLista {
  estado: Estado;
  calificacionPersonal: Calificacion;
  comentario: string;
  agregadoEn: string;
  actualizadoEn: string;
}
export type Edicion = Pick<ListaItem, 'estado' | 'calificacionPersonal' | 'comentario'>;
export interface CopiaLocal { version: 1; uid: string; savedAt: string; items: ListaItem[] }
export interface PaginaResultados { resultados: ResultadoBusqueda[]; pagina: number; totalPaginas: number; totalResultados: number }
