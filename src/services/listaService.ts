import {
  collection,
  doc,
  getDocsFromServer,
  getFirestore,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type FieldValue,
} from 'firebase/firestore';
import { getFirebaseAuth } from '../firebase/config';
import type { Edicion, ListaItem, ObraLista, MetadatosObra } from '../types';
import {
  normalizarEdicion,
  validarItem,
  validarObra,
  validarMetadatos,
} from '../utils/lista';
import { tmdbService } from './tmdbService';
import { planificarCambioVista } from '../dominio/cambioVista';
import { conTiempo } from '../utils/tiempo';

export interface EntradaFirestore extends Omit<
  ListaItem,
  'agregadoEn' | 'actualizadoEn' | 'vistaEn'
> {
  agregadoEn: Timestamp;
  actualizadoEn: Timestamp;
  vistaEn?: Timestamp | null;
}
export interface NuevaEntradaFirestore
  extends
    Omit<
      EntradaFirestore,
      'agregadoEn' | 'actualizadoEn' | 'vistaEn' | keyof MetadatosObra
    >,
    MetadatosObra {
  agregadoEn: FieldValue;
  actualizadoEn: FieldValue;
  vistaEn: null;
}
function dbUsuario(uid: string) {
  const auth = getFirebaseAuth();
  if (!uid || auth.currentUser?.uid !== uid || auth.currentUser.isAnonymous)
    throw new Error('La sesión cambió. Inicia sesión con tu cuenta.');
  return getFirestore(auth.app);
}
function referencia(uid: string, id: string) {
  if (!/^(movie|tv)_[1-9]\d*$/.test(id))
    throw new Error('La entrada no es válida.');
  return doc(dbUsuario(uid), 'usuarios', uid, 'mi_lista', id);
}
export function mensajeErrorLista(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === 'permission-denied')
      return 'Firestore denegó el acceso. Revisa que las reglas de Mi lista estén publicadas para este proyecto.';
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded')
      return 'No se pudo conectar con Firestore. Se conserva la última copia guardada.';
    if (error.code === 'unauthenticated')
      return 'Tu sesión ya no es válida. Vuelve a iniciar sesión.';
  }
  return error instanceof Error && !('code' in error)
    ? error.message
    : 'No se pudo completar la operación de Mi lista.';
}
async function obtener(uid: string): Promise<ListaItem[]> {
  const snapshot = await conTiempo(
    getDocsFromServer(collection(dbUsuario(uid), 'usuarios', uid, 'mi_lista')),
  );
  const result = snapshot.docs.map((document) => {
    const raw = document.data();
    if (
      !(raw.agregadoEn instanceof Timestamp) ||
      !(raw.actualizadoEn instanceof Timestamp)
    )
      throw new Error('La lista remota contiene fechas no válidas.');
    if (
      raw.vistaEn !== undefined &&
      raw.vistaEn !== null &&
      !(raw.vistaEn instanceof Timestamp)
    )
      throw new Error('La fecha de visionado no es válida.');
    const item: unknown = {
      ...raw,
      ...(raw.vistaEn instanceof Timestamp
        ? { vistaEn: raw.vistaEn.toDate().toISOString() }
        : {}),
      agregadoEn: raw.agregadoEn.toDate().toISOString(),
      actualizadoEn: raw.actualizadoEn.toDate().toISOString(),
    };
    validarItem(item);
    if (document.id !== `${item.tipo}_${item.tmdbId}`)
      throw new Error('La lista remota contiene una entrada no válida.');
    return item;
  });
  return result.sort((a, b) => b.agregadoEn.localeCompare(a.agregadoEn));
}
// Las mutaciones devuelven la promesa REAL; el controlador limita espera y
// conserva esa promesa hasta conocer su resultado. Transacciones no hacen cola offline.
async function agregar(
  uid: string,
  obra: ObraLista,
  vigente: () => boolean = () => true,
): Promise<void> {
  validarObra(obra);
  if (!vigente()) throw new Error('La sesión o conexión cambió.');
  const ref = referencia(uid, `${obra.tipo}_${obra.tmdbId}`);
  // Una sola petición por alta, nunca dentro del callback reintentable.
  const metadatos = await tmdbService.obtenerMetadatos(obra.tipo, obra.tmdbId);
  validarMetadatos({ ...metadatos, tipo: obra.tipo }, true);
  await runTransaction(
    ref.firestore,
    async (tx) => {
      const snapshot = await tx.get(ref);
      if (!vigente())
        throw new Error('La operación expiró antes de enviar cambios.');
      dbUsuario(uid);
      if (snapshot.exists()) return;
      const data: NuevaEntradaFirestore = {
        ...metadatos,
        vistaEn: null,
        tmdbId: obra.tmdbId,
        tipo: obra.tipo,
        titulo: obra.titulo,
        anio: obra.anio,
        posterPath: obra.posterPath,
        estado: 'por_ver',
        calificacionPersonal: null,
        comentario: '',
        agregadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      };
      tx.set(ref, data);
    },
    { maxAttempts: 3 },
  );
}
async function actualizar(
  uid: string,
  id: string,
  cambios: Edicion,
  vigente: () => boolean = () => true,
): Promise<void> {
  const edicion = normalizarEdicion(cambios);
  const ref = referencia(uid, id);
  await runTransaction(
    ref.firestore,
    async (tx) => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists())
        throw new Error('Esta entrada ya no existe. Actualiza tu lista.');
      if (!vigente())
        throw new Error('La operación expiró antes de enviar cambios.');
      dbUsuario(uid);
      const anterior = snapshot.data();
      const orden = planificarCambioVista(anterior.estado, edicion.estado);
      const fecha =
        orden === 'limpiar'
          ? { vistaEn: null }
          : orden === 'servidor'
            ? { vistaEn: serverTimestamp() }
            : {};
      tx.update(ref, {
        ...edicion,
        ...fecha,
        actualizadoEn: serverTimestamp(),
      });
    },
    { maxAttempts: 3 },
  );
}
async function eliminar(
  uid: string,
  id: string,
  vigente: () => boolean = () => true,
): Promise<void> {
  const ref = referencia(uid, id);
  await runTransaction(
    ref.firestore,
    async (tx) => {
      await tx.get(ref);
      if (!vigente())
        throw new Error('La operación expiró antes de enviar cambios.');
      dbUsuario(uid);
      tx.delete(ref);
    },
    { maxAttempts: 3 },
  );
}
// Guard obligatorio: el controlador lo liga a conexión, sesión y selección.
async function migrarFecha(
  uid: string,
  id: string,
  vigente: () => boolean,
): Promise<void> {
  if (!vigente()) throw new Error('La sesión o conexión cambió.');
  const ref = referencia(uid, id);
  await runTransaction(
    ref.firestore,
    async (tx) => {
      const snapshot = await tx.get(ref);
      if (!vigente()) throw new Error('La sesión o conexión cambió.');
      dbUsuario(uid);
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (data.estado !== 'vista' || data.vistaEn != null) return;
      if (!(data.actualizadoEn instanceof Timestamp))
        throw new Error('PA-02: falta una fecha de origen válida.');
      tx.update(ref, {
        vistaEn: data.actualizadoEn,
        actualizadoEn: serverTimestamp(),
      });
    },
    { maxAttempts: 3 },
  );
}
async function completarMetadatos(
  uid: string,
  id: string,
  anio: number,
  metadatos: MetadatosObra,
  vigente: () => boolean,
): Promise<void> {
  if (!vigente()) throw new Error('La sesión, selección o conexión cambió.');
  if (!Number.isInteger(anio)) throw new Error('El año no es válido.');
  const ref = referencia(uid, id);
  await runTransaction(
    ref.firestore,
    async (tx) => {
      const snapshot = await tx.get(ref);
      if (!vigente())
        throw new Error('La sesión, selección o conexión cambió.');
      dbUsuario(uid);
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (
        data.estado !== 'vista' ||
        !(data.vistaEn instanceof Timestamp) ||
        data.vistaEn.toDate().getFullYear() !== anio
      )
        return;
      validarMetadatos({ ...metadatos, tipo: data.tipo }, true);
      const faltantes: Record<string, unknown> = {};
      for (const key of ['generos', 'duracionMin', 'directores'] as const)
        if (!Object.hasOwn(data, key)) faltantes[key] = metadatos[key];
      if (Object.keys(faltantes).length)
        tx.update(ref, { ...faltantes, actualizadoEn: serverTimestamp() });
    },
    { maxAttempts: 3 },
  );
}
export const listaService = {
  obtener,
  agregar,
  actualizar,
  eliminar,
  migrarFecha,
  completarMetadatos,
};
