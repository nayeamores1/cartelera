import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { ListaController } from '../services/listaController';
export function useListaUsuario(uid: string | null) {
  const controller = useMemo(() => new ListaController(uid), [uid]);
  const estado = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  useEffect(() => { controller.iniciar(); return () => controller.cerrar(); }, [controller]);
  return { ...estado, refrescarLista: controller.refrescar, agregar: controller.agregar, actualizar: controller.actualizar, eliminar: controller.eliminar };
}
