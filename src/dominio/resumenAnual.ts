import type { ListaItem } from '../types';

/** Contrato serializable del resumen; no cambia aún el modelo de persistencia. */
export interface EntradaResumen extends ListaItem {
  readonly vistaEn?: string | null;
  readonly generos?: readonly string[];
  readonly duracionMin?: number | null;
  readonly directores?: readonly string[];
}

export interface ItemResumen {
  readonly entrada: EntradaResumen;
  /** Proyección del instante a la hora local, calculada por la capa exterior. */
  readonly visionadoLocal: {
    readonly anio: number;
    readonly mes: number;
    readonly instanteMs: number;
  } | null;
  readonly estadoMetadatos: 'completos' | 'pendientes' | 'fallo';
}

export interface ResumenAnual {
  anio: number;
  totalObras: number;
  peliculas: number;
  series: number;
  horas: number;
  peliculasSinDuracion: number;
  obrasSinDatos: number;
  generoTop: { nombre: string; obras: number } | null;
  directorTop: { nombre: string; obras: number } | null;
  obrasPorMes: number[];
  mesTop: number | null;
  destacada: EntradaResumen | null;
}

type PuntoPendiente = 'PA-01' | 'PA-02/PA-04' | 'PA-03' | 'PA-05';

/** Precondición de contrato no resuelta: no es una decisión de producto ni UI. */
export class PuntoAbiertoError extends Error {
  constructor(public readonly punto: PuntoPendiente) {
    super(
      `El contrato necesita resolver ${punto} antes de calcular este caso.`,
    );
    this.name = 'PuntoAbiertoError';
  }
}

type ObraVista = ItemResumen & {
  visionadoLocal: NonNullable<ItemResumen['visionadoLocal']>;
};

function vistasUnicas(items: readonly ItemResumen[]): ObraVista[] {
  const keys = new Set<string>();
  const result: ObraVista[] = [];
  for (const item of items) {
    if (item.entrada.estado !== 'vista') continue;
    const local = item.visionadoLocal;
    if (
      !item.entrada.vistaEn ||
      !local ||
      !Number.isInteger(local.anio) ||
      !Number.isInteger(local.mes) ||
      local.mes < 0 ||
      local.mes > 11 ||
      !Number.isFinite(local.instanteMs)
    )
      throw new PuntoAbiertoError('PA-02/PA-04');
    const key = `${item.entrada.tipo}_${item.entrada.tmdbId}`;
    if (keys.has(key)) continue;
    keys.add(key);
    result.push({ ...item, visionadoLocal: local });
  }
  return result;
}

function comprobarAnio(anio: number): void {
  if (!Number.isInteger(anio))
    throw new RangeError('El año debe ser un entero.');
}

export function aniosDisponibles(
  items: readonly ItemResumen[],
  anioActual: number,
): number[] {
  comprobarAnio(anioActual);
  const years = new Set([anioActual]);
  for (const item of vistasUnicas(items)) years.add(item.visionadoLocal.anio);
  return [...years].sort((a, b) => b - a);
}

interface Conteo {
  nombre: string;
  obras: number;
  calificadas: number;
  suma: number;
}

function sumarNombres(
  conteos: Map<string, Conteo>,
  nombres: readonly string[],
  nota: EntradaResumen['calificacionPersonal'],
): void {
  for (const nombre of new Set(nombres)) {
    const conteo = conteos.get(nombre) ?? {
      nombre,
      obras: 0,
      calificadas: 0,
      suma: 0,
    };
    conteo.obras += 1;
    if (nota !== null) {
      conteo.calificadas += 1;
      conteo.suma += nota;
    }
    conteos.set(nombre, conteo);
  }
}

function compararPromedios(a: Conteo, b: Conteo): number {
  if (!a.calificadas || !b.calificadas)
    return Number(a.calificadas > 0) - Number(b.calificadas > 0);
  return a.suma * b.calificadas - b.suma * a.calificadas;
}

function compararAlfabetico(a: string, b: string): number {
  // Solo ordenar diferencias alfabéticas inequívocas. No adoptar silenciosamente
  // un locale, normalización de acentos o prioridad de mayúsculas para PA-05.
  const left = Array.from(a);
  const right = Array.from(b);
  for (let i = 0; i < Math.min(left.length, right.length); i += 1) {
    if (left[i] === right[i]) continue;
    const mismasMayusculas =
      /^[A-Z]$/.test(left[i]) && /^[A-Z]$/.test(right[i]);
    const mismasMinusculas =
      /^[a-z]$/.test(left[i]) && /^[a-z]$/.test(right[i]);
    if (!mismasMayusculas && !mismasMinusculas)
      throw new PuntoAbiertoError('PA-05');
    return left[i] < right[i] ? -1 : 1;
  }
  return left.length - right.length;
}

function elegirTop(conteos: Map<string, Conteo>): ResumenAnual['generoTop'] {
  if (!conteos.size) return null;
  const valores = [...conteos.values()];
  const maxObras = Math.max(...valores.map((value) => value.obras));
  const porObras = valores.filter((value) => value.obras === maxObras);
  const mejorPromedio = porObras.reduce((best, current) =>
    compararPromedios(current, best) > 0 ? current : best,
  );
  const empatados = porObras.filter(
    (value) => compararPromedios(value, mejorPromedio) === 0,
  );
  const top = empatados.reduce((best, current) =>
    compararAlfabetico(current.nombre, best.nombre) < 0 ? current : best,
  );
  return { nombre: top.nombre, obras: top.obras };
}

function elegirDestacada(items: readonly ObraVista[]): EntradaResumen | null {
  const calificadas = items.filter(
    (item) => item.entrada.calificacionPersonal !== null,
  );
  if (!calificadas.length) return null;
  const nota = Math.max(
    ...calificadas.map((item) => item.entrada.calificacionPersonal ?? 0),
  );
  const mejores = calificadas.filter(
    (item) => item.entrada.calificacionPersonal === nota,
  );
  const instante = Math.max(
    ...mejores.map((item) => item.visionadoLocal.instanteMs),
  );
  const recientes = mejores.filter(
    (item) => item.visionadoLocal.instanteMs === instante,
  );
  if (recientes.length > 1) throw new PuntoAbiertoError('PA-01');
  return recientes[0].entrada;
}

export function resumenAnual(
  items: readonly ItemResumen[],
  anio: number,
): ResumenAnual {
  comprobarAnio(anio);
  const vistas = vistasUnicas(items).filter(
    (item) => item.visionadoLocal.anio === anio,
  );
  const obrasPorMes = Array<number>(12).fill(0);
  const generos = new Map<string, Conteo>();
  const directores = new Map<string, Conteo>();
  let peliculas = 0;
  let minutos = 0;
  let peliculasSinDuracion = 0;
  let obrasSinDatos = 0;
  for (const item of vistas) {
    const entrada = item.entrada;
    obrasPorMes[item.visionadoLocal.mes] += 1;
    if (entrada.tipo === 'movie') {
      peliculas += 1;
      if (entrada.duracionMin === null || entrada.duracionMin === undefined)
        peliculasSinDuracion += 1;
    }
    // No clasificar pendientes o campos ausentes como null/[] legítimos (PA-03).
    if (item.estadoMetadatos === 'pendientes')
      throw new PuntoAbiertoError('PA-03');
    if (item.estadoMetadatos === 'fallo') {
      obrasSinDatos += 1;
      continue;
    }
    if (
      entrada.generos === undefined ||
      entrada.directores === undefined ||
      entrada.duracionMin === undefined
    )
      throw new PuntoAbiertoError('PA-03');
    sumarNombres(generos, entrada.generos, entrada.calificacionPersonal);
    if (entrada.tipo === 'movie') {
      minutos += entrada.duracionMin ?? 0;
      sumarNombres(
        directores,
        entrada.directores,
        entrada.calificacionPersonal,
      );
    }
  }
  let mesTop: number | null = null;
  let maximo = 0;
  obrasPorMes.forEach((obras, mes) => {
    if (obras > 0 && obras >= maximo) {
      maximo = obras;
      mesTop = mes;
    }
  });
  return {
    anio,
    totalObras: vistas.length,
    peliculas,
    series: vistas.length - peliculas,
    horas: Math.round((minutos / 60) * 10) / 10,
    peliculasSinDuracion,
    obrasSinDatos,
    generoTop: elegirTop(generos),
    directorTop: elegirTop(directores),
    obrasPorMes,
    mesTop,
    destacada: elegirDestacada(vistas),
  };
}
