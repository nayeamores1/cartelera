import { collection, doc, getDocsFromServer, getFirestore, runTransaction, serverTimestamp, Timestamp, type FieldValue } from 'firebase/firestore';
import { getFirebaseAuth } from '../firebase/config';
import type { Edicion, ListaItem, ObraLista } from '../types';
import { normalizarEdicion, validarItem, validarObra } from '../utils/lista';
import { conTiempo } from '../utils/tiempo';

export interface EntradaFirestore extends Omit<ListaItem, 'agregadoEn' | 'actualizadoEn'> { agregadoEn: Timestamp; actualizadoEn: Timestamp }
export interface NuevaEntradaFirestore extends Omit<EntradaFirestore, 'agregadoEn' | 'actualizadoEn'> { agregadoEn: FieldValue; actualizadoEn: FieldValue }
function dbUsuario(uid: string) {
  const auth = getFirebaseAuth();
  if (!uid || auth.currentUser?.uid !== uid || auth.currentUser.isAnonymous) throw new Error('La sesión cambió. Inicia sesión con tu cuenta.');
  return getFirestore(auth.app);
}
function referencia(uid: string, id: string) {
  if (!/^(movie|tv)_[1-9]\d*$/.test(id)) throw new Error('La entrada no es válida.');
  return doc(dbUsuario(uid), 'usuarios', uid, 'mi_lista', id);
}
export function mensajeErrorLista(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === 'permission-denied') return 'Firestore denegó el acceso. Revisa que las reglas de Mi lista estén publicadas para este proyecto.';
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') return 'No se pudo conectar con Firestore. Se conserva la última copia guardada.';
    if (error.code === 'unauthenticated') return 'Tu sesión ya no es válida. Vuelve a iniciar sesión.';
  }
  return error instanceof Error && !('code' in error) ? error.message : 'No se pudo completar la operación de Mi lista.';
}
async function obtener(uid: string): Promise<ListaItem[]> {
  const snapshot = await conTiempo(getDocsFromServer(collection(dbUsuario(uid), 'usuarios', uid, 'mi_lista')));
  const result = snapshot.docs.map(document => {
    const raw = document.data();
    if (!(raw.agregadoEn instanceof Timestamp) || !(raw.actualizadoEn instanceof Timestamp)) throw new Error('La lista remota contiene fechas no válidas.');
    const item: unknown = { ...raw, agregadoEn: raw.agregadoEn.toDate().toISOString(), actualizadoEn: raw.actualizadoEn.toDate().toISOString() };
    validarItem(item);
    if (document.id !== `${item.tipo}_${item.tmdbId}`) throw new Error('La lista remota contiene una entrada no válida.');
    return item;
  });
  return result.sort((a, b) => b.agregadoEn.localeCompare(a.agregadoEn));
}
// Las mutaciones devuelven la promesa REAL; el controlador limita espera y
// conserva esa promesa hasta conocer su resultado. Transacciones no hacen cola offline.
async function agregar(uid: string, obra: ObraLista, vigente: () => boolean = () => true): Promise<void> {
  validarObra(obra);
  const ref = referencia(uid, `${obra.tipo}_${obra.tmdbId}`);
  await runTransaction(ref.firestore, async tx => {
    const snapshot = await tx.get(ref);
    if (!vigente()) throw new Error('La operación expiró antes de enviar cambios.');
    dbUsuario(uid);
    if (snapshot.exists()) return;
    const data: NuevaEntradaFirestore = { tmdbId: obra.tmdbId, tipo: obra.tipo, titulo: obra.titulo, anio: obra.anio, posterPath: obra.posterPath, estado: 'por_ver', calificacionPersonal: null, comentario: '', agregadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() };
    tx.set(ref, data);
  }, { maxAttempts: 3 });
}
async function actualizar(uid: string, id: string, cambios: Edicion, vigente: () => boolean = () => true): Promise<void> {
  const edicion = normalizarEdicion(cambios);
  const ref = referencia(uid, id);
  await runTransaction(ref.firestore, async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) throw new Error('Esta entrada ya no existe. Actualiza tu lista.');
    if (!vigente()) throw new Error('La operación expiró antes de enviar cambios.');
    dbUsuario(uid);
    tx.update(ref, { ...edicion, actualizadoEn: serverTimestamp() });
  }, { maxAttempts: 3 });
}
async function eliminar(uid: string, id: string, vigente: () => boolean = () => true): Promise<void> {
  const ref = referencia(uid, id);
  await runTransaction(ref.firestore, async tx => {
    await tx.get(ref);
    if (!vigente()) throw new Error('La operación expiró antes de enviar cambios.');
    dbUsuario(uid);
    tx.delete(ref);
  }, { maxAttempts: 3 });
}
export const listaService = { obtener, agregar, actualizar, eliminar };
