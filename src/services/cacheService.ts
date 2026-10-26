import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CopiaLocal } from '../types';
import { validarCopia } from '../utils/lista';
import { conTiempo } from '../utils/tiempo';
const colas = new Map<string, Promise<unknown>>();
const sesiones = new Map<string, number>();
export function iniciarCache(uid: string): number { const nueva = (sesiones.get(uid) ?? 0) + 1; sesiones.set(uid, nueva); return nueva; }
function serial<T>(uid: string, tarea: () => Promise<T>): Promise<T> {
  const actual = (colas.get(uid) ?? Promise.resolve()).catch(() => {}).then(tarea);
  colas.set(uid, actual);
  void actual.finally(() => { if (colas.get(uid) === actual) colas.delete(uid); }).catch(() => {});
  return conTiempo(actual);
}
const clave = (uid: string) => `cartelera:lista:v1:${uid}`;
async function leer(uid: string): Promise<CopiaLocal | null> {
  return serial(uid, async () => { const raw = await AsyncStorage.getItem(clave(uid)); if (raw === null) return null; const data: unknown = JSON.parse(raw); validarCopia(data, uid); return data; });
}
async function guardar(copia: CopiaLocal, sesion: number): Promise<void> {
  validarCopia(copia, copia.uid);
  return serial(copia.uid, async () => { if (sesiones.get(copia.uid) === sesion) await AsyncStorage.setItem(clave(copia.uid), JSON.stringify(copia)); });
}
// Marcador separado: jamás destruye la última copia válida. Persiste incertidumbre
// si el proceso muere entre envío y confirmación.
async function marcarPendiente(uid: string, pendiente: boolean, sesion?: number): Promise<void> {
  return serial(uid, async () => { if (!pendiente && sesion !== undefined && sesiones.get(uid) !== sesion) return; const key = `${clave(uid)}:pendiente`; if (pendiente) await AsyncStorage.setItem(key, '1'); else await AsyncStorage.removeItem(key); });
}
async function tienePendiente(uid: string): Promise<boolean> { return serial(uid, async () => (await AsyncStorage.getItem(`${clave(uid)}:pendiente`)) === '1'); }
export const cacheService = { leer, guardar, marcarPendiente, tienePendiente };
