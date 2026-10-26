import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Heading, Page } from '../components/UI';
import { ImagenCatalogo } from '../components/ImagenCatalogo';
import { EstadoMiLista } from '../components/EstadoMiLista';
import { useCartelera } from '../context/CarteleraContext';
import type { RootStackParamList } from '../navigation/types';
import { esCancelacionTmdb, mensajeErrorTmdb, tmdbService } from '../services/tmdbService';
import type { Detalle, EstadoPeticion, TipoMedio } from '../types';
import { colors, styles as s } from '../theme';
export function DetalleScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Detalle'>) {
  const { tipo, id } = route.params;
  return <FichaDetalle key={`${tipo}_${id}`} tipo={tipo} id={id} editar={() => navigation.navigate('Editar', { itemId: `${tipo}_${id}` })} />;
}
function FichaDetalle({ tipo, id, editar }: { tipo: TipoMedio; id: number; editar: () => void }) {
  const cartelera = useCartelera();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoPeticion<Detalle>>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void tmdbService.obtenerDetalle(tipo, id, controller.signal).then(datos => {
      if (!controller.signal.aborted) setEstado({ estado: 'exito', datos });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !esCancelacionTmdb(error)) setEstado({ estado: 'error', mensaje: mensajeErrorTmdb(error) });
    });
    return () => controller.abort();
  }, [tipo, id, intento]);
  if (estado.estado !== 'exito') return <Page>
    {estado.estado === 'error' ? <><Text style={s.body} accessibilityRole="alert" accessibilityLiveRegion="assertive">{estado.mensaje}</Text><Button title="Reintentar" onPress={() => { setEstado({ estado: 'cargando' }); setIntento(value => value + 1); }} /></> : <><ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Cargando detalle" /><Text style={s.body}>Cargando detalle…</Text></>}
  </Page>;
  const detalle = estado.datos;
  return <Page>
    <ImagenCatalogo uri={detalle.posterUrl} label={`Póster de ${detalle.titulo}`} style={{ width: '70%', maxWidth: 340, alignSelf: 'center' }} />
    <Heading title={detalle.titulo} subtitle={`${detalle.anio ?? 'Fecha no disponible'} · ${detalle.tipo === 'movie' ? 'Película' : 'Serie'}`} />
    <View style={s.card}><Text style={s.heading}>Puntuación TMDB</Text><Text style={s.body}>{detalle.totalVotos > 0 ? `${detalle.puntuacionTmdb.toLocaleString('es-ES', { maximumFractionDigits: 1 })} / 10 · ${detalle.totalVotos} votos` : 'Sin calificaciones'}</Text></View>
    <Text style={s.heading} accessibilityRole="header">Sinopsis</Text><Text style={s.body}>{detalle.sinopsis}</Text>
    <Text style={s.heading} accessibilityRole="header">Elenco</Text>
    {detalle.elenco.length ? <FlatList horizontal data={detalle.elenco} keyExtractor={actor => String(actor.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }} renderItem={({ item }) => <View style={{ width: 112, gap: 8 }}>
      <ImagenCatalogo uri={item.perfilUrl} label={`Foto de ${item.nombre}`} style={{ width: 112 }} />
      <Text style={s.label}>{item.nombre}</Text><Text style={s.body}>{item.personaje}</Text>
    </View>} /> : <Text style={s.body}>No hay información del elenco disponible.</Text>}
    <EstadoMiLista />
    {mensaje && <Text style={s.body} accessibilityLiveRegion="polite">{mensaje}</Text>}
    {cartelera.lista.some(item => item.tipo === tipo && item.tmdbId === id) ? <Button title="Editar mi entrada" onPress={editar} /> : <Button title={cartelera.mutandoLista ? 'Agregando…' : 'Agregar a mi lista'} disabled={!cartelera.confirmada || cartelera.conexion !== 'conectado' || cartelera.mutandoLista || cartelera.cargandoLista || cartelera.pendiente} onPress={() => {
      setMensaje(null);
      void cartelera.acciones.agregar({ tmdbId: detalle.tmdbId, tipo: detalle.tipo, titulo: detalle.titulo, anio: detalle.anio ?? '', posterPath: detalle.posterPath }).then(() => setMensaje('Entrada confirmada en Mi lista.')).catch((error: unknown) => setMensaje(error instanceof Error ? error.message : 'No se pudo agregar la entrada.'));
    }} />}
  </Page>;
}
