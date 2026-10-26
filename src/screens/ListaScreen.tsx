import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Heading } from '../components/UI';
import { EstadoMiLista } from '../components/EstadoMiLista';
import { ImagenCatalogo } from '../components/ImagenCatalogo';
import { useCartelera } from '../context/CarteleraContext';
import { tmdbService } from '../services/tmdbService';
import type { ConfiguracionImagenes, Estado, FiltroTipo } from '../types';
import type { RootStackParamList, TabsParamList } from '../navigation/types';
import { nombreEstado } from '../utils/lista';
import { claveContenido } from '../utils/catalogo';
import { styles as s } from '../theme';
type Props = CompositeScreenProps<BottomTabScreenProps<TabsParamList, 'Lista'>, NativeStackScreenProps<RootStackParamList>>;
export function ListaScreen({ navigation }: Props) {
  const c = useCartelera();
  const [estado, setEstado] = useState<Estado | 'todos'>('todos');
  const [tipo, setTipo] = useState<FiltroTipo>('todo');
  const [imagenes, setImagenes] = useState<ConfiguracionImagenes | null>(null);
  useEffect(() => {
    if (c.conexion !== 'conectado') return;
    const controller = new AbortController();
    void tmdbService.obtenerConfiguracion(controller.signal).then(config => { if (!controller.signal.aborted) setImagenes(config); }).catch(() => {});
    return () => controller.abort();
  }, [c.conexion]);
  const resultados = c.lista.filter(item => (estado === 'todos' || item.estado === estado) && (tipo === 'todo' || item.tipo === tipo));
  return <SafeAreaView style={s.page} edges={['left', 'right']}>
    <FlatList data={resultados} numColumns={2} keyExtractor={claveContenido} contentContainerStyle={{ padding: 24, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' }} columnWrapperStyle={{ gap: 12 }}
      ListHeaderComponent={<View style={{ gap: 20 }}>
        <Heading title="Mi lista" subtitle="Tus próximas historias y las que ya forman parte de ti." />
        <EstadoMiLista />
        <Text style={s.label}>Estado</Text><View style={s.row}>{(['todos', 'por_ver', 'viendo', 'vista'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: estado === value }} style={[s.chip, estado === value && s.chipActive]} onPress={() => setEstado(value)}><Text style={s.chipText}>{value === 'todos' ? 'Todos' : nombreEstado[value]}</Text></Pressable>)}</View>
        <Text style={s.label}>Tipo</Text><View style={s.row}>{([{ value: 'todo', label: 'Todos' }, { value: 'movie', label: 'Películas' }, { value: 'tv', label: 'Series' }] as const).map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: tipo === item.value }} style={[s.chip, tipo === item.value && s.chipActive]} onPress={() => setTipo(item.value)}><Text style={s.chipText}>{item.label}</Text></Pressable>)}</View>
      </View>}
      ListEmptyComponent={<Text style={s.body}>{c.lista.length > 0 ? 'No hay coincidencias con estos filtros.' : c.cargandoLista ? 'Cargando tu cartelera…' : c.tieneCopia || c.confirmada ? 'Tu lista está vacía. Agrega una película o serie desde su detalle.' : 'No hay una copia disponible. Conéctate y actualiza tu lista.'}</Text>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.titulo}, ${nombreEstado[item.estado]}, ${item.calificacionPersonal ?? 'sin calificación'}. Editar mi entrada`} onPress={() => navigation.navigate('Editar', { itemId: claveContenido(item) })} style={{ flex: 1, maxWidth: '48%', gap: 8, minHeight: 44 }}>
        <ImagenCatalogo uri={imagenes ? tmdbService.construirUrlImagen(imagenes, item.posterPath, 'tarjeta') : null} label={`Póster de ${item.titulo}`} style={{ width: '100%' }} />
        <Text style={s.label}>{item.titulo}</Text><Text style={s.body}>{item.anio || 'Sin fecha'} · {item.tipo === 'movie' ? 'Película' : 'Serie'}</Text>
        <Text style={s.body}>{nombreEstado[item.estado]} · {item.calificacionPersonal === null ? 'Sin calificar' : `${item.calificacionPersonal} ★ / 5`}</Text>
      </Pressable>} />
  </SafeAreaView>;
}
