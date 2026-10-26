export class TiempoAgotado extends Error { constructor() { super('La operación tardó demasiado.'); } }
// Solo limita la espera; no cancela la promesa original ni un commit enviado.
export async function conTiempo<T>(operacion: Promise<T>, ms = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([operacion, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new TiempoAgotado()), ms); })]); }
  finally { clearTimeout(timer); }
}
