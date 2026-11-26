import type { Estado } from '../types';

export function planificarCambioVista(
  anterior: Estado,
  nuevo: Estado,
): 'conservar' | 'limpiar' | 'servidor' {
  if (nuevo !== 'vista') return 'limpiar';
  return anterior === 'vista' ? 'conservar' : 'servidor';
}
