import { describe, expect, it } from 'vitest';
import { normalizarEdicion, validarEdicion } from '../src/utils/lista';

describe('RF6: calificación personal solo en Vista', () => {
  it.each(['por_ver', 'viendo'] as const)(
    '%s rechaza una calificación y la limpia al cambiar desde Vista',
    (estado) => {
      const edicion = {
        estado,
        calificacionPersonal: 4 as const,
        comentario: 'Mi comentario',
      };
      expect(() => validarEdicion(edicion)).toThrow();
      expect(normalizarEdicion(edicion)).toEqual({
        estado,
        calificacionPersonal: null,
        comentario: 'Mi comentario',
      });
    },
  );

  it.each(['por_ver', 'viendo'] as const)('%s admite null', (estado) => {
    expect(() =>
      validarEdicion({ estado, calificacionPersonal: null, comentario: '' }),
    ).not.toThrow();
  });

  it('Vista admite una calificación válida sin alterarla', () => {
    const edicion = {
      estado: 'vista' as const,
      calificacionPersonal: 4 as const,
      comentario: 'Mi comentario',
    };
    expect(() => validarEdicion(edicion)).not.toThrow();
    expect(normalizarEdicion(edicion)).toEqual(edicion);
  });
});
