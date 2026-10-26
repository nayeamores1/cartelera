import type { Edicion, ListaItem, ObraLista } from '../types';
import { cacheService, iniciarCache } from './cacheService';
import { conectividadService, type Conexion } from './conectividadService';
import { listaService, mensajeErrorLista } from './listaService';
import { conTiempo, TiempoAgotado } from '../utils/tiempo';
import { normalizarEdicion, validarObra } from '../utils/lista';

export interface EstadoLista {
  lista: ListaItem[]; ultimaCopia: string | null; tieneCopia: boolean;
  cargandoLista: boolean; mutandoLista: boolean; errorLista: string | null;
  pendiente: boolean; confirmada: boolean; conexion: Conexion;
}
export const listaInicial: EstadoLista = { lista: [], ultimaCopia: null, tieneCopia: false, cargandoLista: false, mutandoLista: false, errorLista: null, pendiente: false, confirmada: false, conexion: 'sin-comprobar' };
// Promesas reales, fuera de un montaje concreto: nunca olvidar un commit en vuelo
// por cambiar de cuenta o recrear el proveedor.
const operaciones = new Map<string, Promise<void>>();
const alTerminar = new Set<(uid: string) => void>();
export class ListaController {
  private estado: EstadoLista = { ...listaInicial };
  private listeners = new Set<() => void>();
  private activo = false;
  private preparada = false;
  private revision = 0;
  private lectura = 0;
  private sesionCache = 0;
  private carga: Promise<boolean> | null = null;
  private cancelarConexion?: () => void;
  constructor(private readonly uid: string | null) {}
  snapshot = () => this.estado;
  subscribe = (callback: () => void) => { this.listeners.add(callback); return () => { this.listeners.delete(callback); }; };
  private emitir(cambio: Partial<EstadoLista>) { if (!this.activo) return; this.estado = { ...this.estado, ...cambio }; this.listeners.forEach(cb => cb()); }
  private fin = (uid: string) => { if (this.uid === uid && this.activo && this.preparada && this.estado.conexion === 'conectado') void this.refrescar(); };
  iniciar() {
    if (!this.uid) return;
    this.activo = true;
    this.preparada = false;
    this.sesionCache = iniciarCache(this.uid);
    const revision = ++this.revision;
    alTerminar.add(this.fin);
    this.cancelarConexion = conectividadService.observar(conexion => {
      if (!this.activo || revision !== this.revision) return;
      this.emitir({ conexion, confirmada: conexion === 'conectado' ? this.estado.confirmada : false });
      if (conexion === 'conectado' && this.preparada) void this.refrescar();
    });
    this.emitir({ cargandoLista: true });
    void (async () => {
      try {
        const copia = await cacheService.leer(this.uid!);
        if (!this.activo || revision !== this.revision) return;
        if (copia) this.emitir({ lista: copia.items, ultimaCopia: copia.savedAt, tieneCopia: true });
      } catch { if (this.activo && revision === this.revision) this.emitir({ errorLista: 'No se pudo leer la copia local. Se intentará recuperar la lista del servidor.' }); }
      try {
        const pendiente = await cacheService.tienePendiente(this.uid!);
        if (!this.activo || revision !== this.revision) return;
        this.emitir({ pendiente });
      } catch { if (this.activo && revision === this.revision) this.emitir({ pendiente: true, errorLista: 'No se pudo comprobar el estado de la última operación. Actualiza desde el servidor antes de editar.' }); }
      if (!this.activo || revision !== this.revision) return;
      this.preparada = true;
      this.emitir({ cargandoLista: false });
      if (this.estado.conexion === 'conectado') await this.refrescar();
    })();
  }
  cerrar() { this.activo = false; this.revision++; this.lectura++; this.carga = null; this.cancelarConexion?.(); alTerminar.delete(this.fin); }
  refrescar = (): Promise<boolean> => {
    if (!this.uid || !this.activo || !this.preparada || this.estado.conexion !== 'conectado') return Promise.resolve(false);
    if (this.carga) return this.carga;
    const uid = this.uid;
    const revision = this.revision;
    const lectura = ++this.lectura;
    const teniaEnVuelo = operaciones.has(uid);
    this.emitir({ cargandoLista: true });
    this.carga = (async () => {
      try {
        const items = await listaService.obtener(uid);
        if (!this.activo || revision !== this.revision || this.estado.conexion !== 'conectado') return false;
        const savedAt = new Date().toISOString();
        const pendiente = teniaEnVuelo || operaciones.has(uid);
        this.emitir({ lista: items, pendiente, confirmada: !pendiente, errorLista: pendiente ? 'Hay una escritura pendiente de confirmación. No repitas la operación.' : null });
        try {
          await cacheService.guardar({ version: 1, uid, savedAt, items }, this.sesionCache);
          if (!this.activo || revision !== this.revision) return false;
          this.emitir({ ultimaCopia: savedAt, tieneCopia: true });
          if (!pendiente) await cacheService.marcarPendiente(uid, false, this.sesionCache);
          if (pendiente && !operaciones.has(uid)) setTimeout(() => { void this.refrescar(); }, 0);
        } catch { this.emitir({ errorLista: 'Lista recibida del servidor, pero no se pudo actualizar la copia local.' }); }
        return !pendiente;
      } catch (error: unknown) {
        if (this.activo && revision === this.revision) this.emitir({ errorLista: error instanceof TiempoAgotado ? 'El servidor tardó demasiado. Se conserva la última copia válida. Vuelve a intentar.' : mensajeErrorLista(error), confirmada: false });
        return false;
      } finally { if (this.activo && revision === this.revision) this.emitir({ cargandoLista: false }); if (lectura === this.lectura) this.carga = null; }
    })();
    return this.carga;
  };
  private async mutar(operacion: (uid: string, vigente: () => boolean) => Promise<void>) {
    const uid = this.uid;
    if (!uid || !this.activo || this.estado.conexion !== 'conectado') throw new Error('Sin conexión. Las modificaciones están deshabilitadas.');
    if (!this.estado.confirmada || this.estado.cargandoLista || this.estado.mutandoLista || this.estado.pendiente || operaciones.has(uid)) throw new Error('Actualiza tu lista y espera a que termine la operación anterior.');
    this.emitir({ mutandoLista: true, errorLista: null });
    const revision = this.revision;
    const limite = Date.now() + 15000;
    try {
      await cacheService.marcarPendiente(uid, true);
      if (!this.activo || revision !== this.revision || this.estado.conexion !== 'conectado') throw new Error('La sesión o la conexión cambió antes de enviar la operación.');
      this.emitir({ pendiente: true });
      const promesa = operacion(uid, () => this.activo && revision === this.revision && Date.now() < limite && this.estado.conexion === 'conectado');
      operaciones.set(uid, promesa);
      const finalizar = () => { if (operaciones.get(uid) === promesa) operaciones.delete(uid); alTerminar.forEach(cb => cb(uid)); };
      void promesa.then(finalizar, finalizar);
      await conTiempo(promesa, Math.max(1, limite - Date.now()));
      if (!this.activo || revision !== this.revision) return;
      if (!await this.refrescar()) throw new Error('La escritura fue confirmada, pero falta reconciliar la copia con el servidor. Actualiza tu lista antes de continuar.');
    } catch (error: unknown) {
      const mensaje = error instanceof TiempoAgotado ? 'No pudimos confirmar el resultado. La escritura podría completarse. No la repitas: se reconciliará al recuperar conexión o al actualizar la lista.' : mensajeErrorLista(error);
      this.emitir({ errorLista: mensaje });
      throw new Error(mensaje);
    } finally { if (this.activo && revision === this.revision) this.emitir({ mutandoLista: false }); }
  }
  agregar = (obra: ObraLista) => { validarObra(obra); return this.mutar((uid, vigente) => listaService.agregar(uid, obra, vigente)); };
  actualizar = (id: string, cambios: Edicion) => { const edicion = normalizarEdicion(cambios); return this.mutar((uid, vigente) => listaService.actualizar(uid, id, edicion, vigente)); };
  eliminar = (id: string) => this.mutar((uid, vigente) => listaService.eliminar(uid, id, vigente));
}
