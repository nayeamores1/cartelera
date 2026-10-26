export const MENSAJE_ETAPA = 'Disponible en una próxima etapa. Esta entrega es una vista previa visual.';
export async function pendiente(): Promise<never> {
  throw new Error(MENSAJE_ETAPA);
}
