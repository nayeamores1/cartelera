import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import type { ListaController } from '../services/listaController';
import { ResumenController } from '../services/resumenController';

export function useResumenAnual(lista: ListaController) {
  const controller = useMemo(() => new ResumenController(lista), [lista]);
  const estado = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  useEffect(() => {
    const cancelar = AppState.addEventListener('change', (state) => {
      if (state === 'active') controller.sincronizar();
    });
    return () => {
      cancelar.remove();
      controller.cerrar();
    };
  }, [controller]);
  return {
    estado,
    abrir: controller.iniciar,
    cerrar: controller.cerrar,
    seleccionar: controller.seleccionarAnio,
    reintentar: controller.reintentar,
  };
}
