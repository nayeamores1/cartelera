import {
  aniosDisponibles,
  PuntoAbiertoError,
  resumenAnual,
  type ResumenAnual,
} from '../dominio/resumenAnual';
import type { EstadoPeticion, ListaItem } from '../types';
import type { ListaController } from './listaController';
import {
  adaptarResumen,
  candidataAprobada,
  escenarioPendiente,
} from './adaptarResumen';
import { prepararResumen, type ProgresoResumen } from './prepararResumen';
import { tmdbService } from './tmdbService';
import type { Conexion } from './conectividadService';

export interface EstadoResumen {
  anio: number;
  anios: number[];
  peticion: EstadoPeticion<ResumenAnual>;
  progreso: ProgresoResumen | null;
  puntoPendiente: string | null;
  poster: string | null;
  conexion: Conexion;
  ultimaCopia: string | null;
}
type Fuente = Pick<
  ListaController,
  'snapshot' | 'subscribe' | 'refrescar' | 'migrarFecha' | 'completarMetadatos'
>;
type Tmdb = Pick<
  typeof tmdbService,
  'obtenerMetadatos' | 'obtenerConfiguracion' | 'construirUrlImagen'
>;

export class ResumenController {
  private estado: EstadoResumen;
  private listeners = new Set<() => void>();
  private activo = false;
  private version = 0;
  private ejecutando: number | null = null;
  private cancelarLista?: () => void;
  private abort?: AbortController;
  private marca: string | null = null;
  private conexion: Conexion = 'sin-comprobar';
  private fallos = new Set<string>();
  constructor(
    private readonly lista: Fuente,
    private readonly reloj = () => new Date(),
    private readonly tmdb: Tmdb = tmdbService,
    private readonly esCandidata: (
      item: ListaItem,
    ) => boolean = candidataAprobada,
  ) {
    this.estado = {
      anio: reloj().getFullYear(),
      anios: [],
      peticion: { estado: 'inicial' },
      progreso: null,
      puntoPendiente: null,
      poster: null,
      conexion: 'sin-comprobar',
      ultimaCopia: null,
    };
  }
  snapshot = () => this.estado;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emitir(cambio: Partial<EstadoResumen>) {
    if (!this.activo) return;
    this.estado = { ...this.estado, ...cambio };
    this.listeners.forEach((listener) => listener());
  }
  private invalidar() {
    this.version++;
    this.abort?.abort();
    this.ejecutando = null;
    this.marca = null;
  }
  iniciar = () => {
    if (this.activo) return;
    this.activo = true;
    this.estado = {
      ...this.estado,
      anio: this.reloj().getFullYear(),
      peticion: { estado: 'inicial' },
      progreso: null,
      poster: null,
      puntoPendiente: null,
    };
    this.marca = null;
    this.cancelarLista = this.lista.subscribe(this.sincronizar);
    this.sincronizar();
  };
  cerrar = () => {
    this.activo = false;
    this.invalidar();
    this.cancelarLista?.();
    this.cancelarLista = undefined;
  };
  private firma() {
    const base = this.lista.snapshot();
    return JSON.stringify([
      this.estado.anio,
      this.reloj().getFullYear(),
      base.lista,
      base.conexion,
    ]);
  }
  sincronizar = () => {
    if (!this.activo) return;
    const base = this.lista.snapshot();
    if (base.conexion !== this.conexion) {
      this.invalidar();
      this.conexion = base.conexion;
    }
    this.emitir({ conexion: base.conexion, ultimaCopia: base.ultimaCopia });
    if (this.ejecutando !== null) return;
    // Un error remoto previo o una promesa todavía en vuelo no impiden consultar
    // la copia propia al perder conexión. No se inicia trabajo remoto en esta rama.
    if (base.conexion === 'sin-conexion' && base.tieneCopia) {
      this.calcular();
      return;
    }
    if (
      base.cargandoLista ||
      base.mutandoLista ||
      (base.pendiente && base.conexion === 'conectado')
    ) {
      this.emitir({
        peticion:
          base.pendiente && base.errorLista
            ? { estado: 'error', mensaje: base.errorLista }
            : { estado: 'cargando' },
        puntoPendiente: null,
      });
      return;
    }
    if (base.errorLista && !base.confirmada) {
      this.emitir({
        peticion: { estado: 'error', mensaje: base.errorLista },
        puntoPendiente: null,
        progreso: null,
      });
      return;
    }
    if (base.conexion === 'sin-comprobar') {
      this.emitir({ peticion: { estado: 'cargando' } });
      return;
    }
    if (base.conexion !== 'conectado') {
      if (!base.tieneCopia) this.pendiente('PA-06');
      else this.calcular();
      return;
    }
    if (!base.confirmada) {
      this.emitir({ peticion: { estado: 'cargando' } });
      return;
    }
    const firma = this.firma();
    if (this.marca === firma) {
      this.calcular();
      return;
    }
    this.marca = firma;
    void this.preparar();
  };
  private pendiente(punto: string) {
    this.emitir({
      puntoPendiente: punto,
      peticion: { estado: 'error', mensaje: escenarioPendiente(punto) },
      progreso: null,
      poster: null,
    });
  }
  private calcular() {
    try {
      const items = adaptarResumen(this.lista.snapshot().lista, this.fallos);
      const anios = aniosDisponibles(items, this.reloj().getFullYear());
      const anio = anios.includes(this.estado.anio)
        ? this.estado.anio
        : this.reloj().getFullYear();
      this.emitir({ anios, anio });
      const datos = resumenAnual(items, anio);
      this.emitir({
        peticion: { estado: 'exito', datos },
        progreso: null,
        puntoPendiente: null,
        poster:
          this.estado.peticion.estado === 'exito' &&
          this.estado.peticion.datos.destacada?.tmdbId ===
            datos.destacada?.tmdbId &&
          this.estado.peticion.datos.destacada?.tipo === datos.destacada?.tipo
            ? this.estado.poster
            : null,
      });
    } catch (error: unknown) {
      if (error instanceof PuntoAbiertoError) {
        if (error.punto === 'PA-02/PA-04') this.emitir({ anios: [] });
        this.pendiente(error.punto);
      } else
        this.emitir({
          peticion: {
            estado: 'error',
            mensaje: 'No pudimos calcular tu resumen.',
          },
          puntoPendiente: null,
          progreso: null,
        });
    }
  }
  private async preparar() {
    const version = ++this.version;
    this.ejecutando = version;
    this.abort = new AbortController();
    let firmaProcesada: string | null = null;
    const vigente = () =>
      this.activo &&
      version === this.version &&
      this.lista.snapshot().conexion === 'conectado';
    this.emitir({
      peticion: { estado: 'cargando' },
      progreso: null,
      puntoPendiente: null,
      poster: null,
    });
    try {
      const resultado = await prepararResumen(
        this.estado.anio,
        this.esCandidata,
        {
          vigente,
          obtenerLista: async () => this.lista.snapshot().lista,
          migrarFecha: (id) => this.lista.migrarFecha(id, vigente),
          completarMetadatos: (id, anio, datos) =>
            this.lista.completarMetadatos(id, anio, datos, vigente),
          obtenerMetadatos: this.tmdb.obtenerMetadatos,
        },
        (progreso) => {
          if (vigente()) this.emitir({ progreso });
        },
        this.abort.signal,
      );
      if (!vigente()) return;
      this.fallos = new Set(resultado.fallosTmdb);
      firmaProcesada = this.firma();
      this.calcular();
      const peticion = this.estado.peticion;
      if (peticion.estado === 'exito' && peticion.datos.destacada?.posterPath) {
        try {
          const config = await this.tmdb.obtenerConfiguracion(
            this.abort.signal,
          );
          if (vigente())
            this.emitir({
              poster: this.tmdb.construirUrlImagen(
                config,
                peticion.datos.destacada.posterPath,
                'tarjeta',
              ),
            });
        } catch {
          /* El póster tiene alternativa local; no invalida las métricas. */
        }
      }
    } catch (error: unknown) {
      if (!vigente()) return;
      if (error instanceof PuntoAbiertoError) this.calcular();
      else
        this.emitir({
          peticion: {
            estado: 'error',
            mensaje:
              error instanceof Error
                ? error.message
                : 'No pudimos cargar tu resumen.',
          },
          puntoPendiente: null,
          progreso: null,
        });
    } finally {
      if (this.activo && version === this.version) {
        this.ejecutando = null;
        this.marca = firmaProcesada ?? this.firma();
        if (this.marca !== this.firma()) this.sincronizar();
      }
    }
  }
  seleccionarAnio = (anio: number) => {
    if (
      !this.activo ||
      anio === this.estado.anio ||
      !this.estado.anios.includes(anio)
    )
      return;
    this.invalidar();
    this.emitir({
      anio,
      peticion: { estado: 'cargando' },
      poster: null,
      progreso: null,
    });
    this.sincronizar();
  };
  reintentar = async () => {
    if (!this.activo || this.ejecutando !== null || this.estado.puntoPendiente)
      return;
    this.marca = null;
    try {
      await this.lista.refrescar();
      this.sincronizar();
    } catch {
      this.emitir({
        peticion: {
          estado: 'error',
          mensaje: 'No pudimos actualizar la lista.',
        },
      });
    }
  };
}
