import { useCallback, useEffect, useRef, useState } from 'react';
import { esCancelacionTmdb, mensajeErrorTmdb, tmdbService } from '../services/tmdbService';
import type { EstadoPeticion, FiltroTipo, PaginaResultados } from '../types';
import { combinarResultados } from '../utils/catalogo';

export function useBusqueda() {
  const [titulo, setTitulo] = useState('');
  const [filtro, setFiltro] = useState<FiltroTipo>('todo');
  const [estado, setEstado] = useState<EstadoPeticion<PaginaResultados>>({ estado: 'inicial' });
  const version = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const ultima = useRef<PaginaResultados | null>(null);
  const ocupada = useRef(false);
  const paginaFallida = useRef(1);
  const solicitar = useCallback(async (pagina: number, revision = version.current) => {
    if (!titulo.trim() || ocupada.current || revision !== version.current) return;
    ocupada.current = true;
    const abort = new AbortController();
    controller.current = abort;
    const datos = pagina > 1 ? ultima.current ?? undefined : undefined;
    setEstado({ estado: 'cargando', datos });
    try {
      const respuesta = await tmdbService.buscar(titulo, pagina, filtro, abort.signal);
      if (abort.signal.aborted || revision !== version.current) return;
      const nueva = { ...respuesta, resultados: combinarResultados(datos?.resultados ?? [], respuesta.resultados) };
      ultima.current = nueva;
      setEstado({ estado: 'exito', datos: nueva });
    } catch (error: unknown) {
      if (revision !== version.current || abort.signal.aborted || esCancelacionTmdb(error)) return;
      paginaFallida.current = pagina;
      setEstado({ estado: 'error', mensaje: mensajeErrorTmdb(error), datos });
    } finally { if (revision === version.current) ocupada.current = false; }
  }, [titulo, filtro]);
  useEffect(() => {
    const revision = ++version.current;
    if (!titulo.trim()) return;
    const timer = setTimeout(() => { void solicitar(1, revision); }, 350);
    return () => { clearTimeout(timer); version.current += 1; controller.current?.abort(); ocupada.current = false; };
  }, [titulo, filtro, solicitar]);
  function invalidar() {
    version.current += 1;
    controller.current?.abort();
    ocupada.current = false;
    ultima.current = null;
    paginaFallida.current = 1;
    setEstado({ estado: 'inicial' });
  }
  return {
    titulo, filtro, estado,
    cambiarTitulo: (value: string) => { if (value !== titulo) { invalidar(); setTitulo(value); } },
    cambiarFiltro: (value: FiltroTipo) => { if (value !== filtro) { invalidar(); setFiltro(value); } },
    cargarMas: () => {
      const actual = ultima.current;
      if (actual && actual.pagina < actual.totalPaginas) void solicitar(actual.pagina + 1);
    },
    reintentar: () => { void solicitar(paginaFallida.current); },
  };
}
