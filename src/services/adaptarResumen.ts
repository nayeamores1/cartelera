import { PuntoAbiertoError, type ItemResumen } from '../dominio/resumenAnual';
import type { ListaItem } from '../types';

export const claveResumen = (item: ListaItem) => `${item.tipo}_${item.tmdbId}`;

/** Solo reconoce datos presentes inequívocos; no decide completitud de vacíos. */
export function metadatosInequivocos(item: ListaItem): boolean {
  return (
    !!item.generos?.length &&
    (item.tipo === 'tv'
      ? item.duracionMin === null && item.directores?.length === 0
      : typeof item.duracionMin === 'number' &&
        item.duracionMin > 0 &&
        !!item.directores?.length)
  );
}

/** Guarda de integración de D6 hasta que se apruebe su clasificación (PA-03). */
export function candidataAprobada(item: ListaItem): boolean {
  if (!metadatosInequivocos(item)) throw new PuntoAbiertoError('PA-03');
  return false;
}

export function adaptarResumen(
  items: readonly ListaItem[],
  fallos: ReadonlySet<string> = new Set(),
): ItemResumen[] {
  return items.map((entrada) => {
    const fecha = entrada.vistaEn ? new Date(entrada.vistaEn) : null;
    return {
      entrada,
      visionadoLocal:
        fecha && Number.isFinite(fecha.getTime())
          ? {
              anio: fecha.getFullYear(),
              mes: fecha.getMonth(),
              instanteMs: fecha.getTime(),
            }
          : null,
      estadoMetadatos: fallos.has(claveResumen(entrada))
        ? 'fallo'
        : metadatosInequivocos(entrada)
          ? 'completos'
          : 'pendientes',
    };
  });
}

export function escenarioPendiente(punto: string): string {
  const mensajes: Record<string, string> = {
    'PA-01':
      'Dos obras comparten calificación y fecha de visionado. Falta definir cómo elegir la destacada.',
    'PA-02/PA-04':
      'Hay una obra vista sin fecha utilizable. Falta definir cómo incluirla en el año.',
    'PA-03':
      'Hay obras con metadatos ausentes o vacíos. Falta definir cómo completar y clasificar esos datos.',
    'PA-05':
      'Hay un empate de nombres con diferencias de mayúsculas o acentos. Falta definir ese desempate.',
    'PA-06':
      'No hay copia disponible sin conexión. El tratamiento de este escenario está pendiente.',
  };
  return `${mensajes[punto] ?? 'Este escenario requiere una decisión pendiente.'} (${punto})`;
}
