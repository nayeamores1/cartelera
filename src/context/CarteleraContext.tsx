import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import type { Edicion, ObraLista, Usuario } from '../types';
import { authService } from '../services/authService';
import { useListaUsuario } from '../hooks/useListaUsuario';
import type { EstadoLista } from '../services/listaController';

interface CarteleraContextValue extends EstadoLista {
  usuario: Usuario | null;
  recuperandoSesion: boolean;
  procesandoAuth: boolean;
  errorSesion: string | null;
  reintentarSesion: () => void;
  refrescarLista: () => Promise<boolean>;
  acciones: {
    registrar: (correo: string, clave: string) => Promise<Usuario>;
    ingresar: (correo: string, clave: string) => Promise<Usuario>;
    salir: () => Promise<void>;
    agregar: (contenido: ObraLista) => Promise<void>;
    editar: (id: string, cambios: Edicion) => Promise<void>;
    eliminar: (id: string) => Promise<void>;
  };
}
const Context = createContext<CarteleraContextValue | undefined>(undefined);
export function CarteleraProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [recuperandoSesion, setRecuperandoSesion] = useState(true);
  const [procesandoAuth, setProcesandoAuth] = useState(false);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [ocultandoLista, setOcultandoLista] = useState(false);
  const estadoLista = useListaUsuario(ocultandoLista ? null : usuario?.uid ?? null);
  const enCurso = useRef(false);
  useEffect(() => {
    let activo = true;
    const cancelar = authService.observarSesion(user => {
      if (!activo) return;
      if (user) setOcultandoLista(false);
      setUsuario(user);
      setErrorSesion(null);
      setRecuperandoSesion(false);
    }, mensaje => {
      if (!activo) return;
      setUsuario(null);
      setErrorSesion(mensaje);
      setRecuperandoSesion(false);
    });
    return () => { activo = false; cancelar(); };
  }, [intento]);
  async function conBloqueo<T,>(operacion: () => Promise<T>): Promise<T> {
    if (enCurso.current) throw new Error('Hay una operación en curso. Espera un momento.');
    enCurso.current = true;
    setProcesandoAuth(true);
    try { return await operacion(); }
    finally { enCurso.current = false; setProcesandoAuth(false); }
  }
  const value: CarteleraContextValue = {
    usuario, recuperandoSesion, procesandoAuth, errorSesion,
    reintentarSesion: () => { setRecuperandoSesion(true); setErrorSesion(null); setIntento(actual => actual + 1); },
    ...estadoLista,
    acciones: {
      registrar: (correo, clave) => conBloqueo(() => authService.registrar(correo, clave)),
      ingresar: (correo, clave) => conBloqueo(() => authService.ingresar(correo, clave)),
      salir: () => conBloqueo(async () => { setOcultandoLista(true); try { await authService.salir(); } catch (error: unknown) { setOcultandoLista(false); throw error; } }),
      agregar: estadoLista.agregar, editar: estadoLista.actualizar, eliminar: estadoLista.eliminar,
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCartelera() {
  const context = useContext(Context);
  if (!context) throw new Error('CarteleraProvider no está disponible.');
  return context;
}
