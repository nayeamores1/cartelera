import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Heading } from '../components/UI';
import { ImagenCatalogo } from '../components/ImagenCatalogo';
import { useBusqueda } from '../hooks/useBusqueda';
import type { RootStackParamList, TabsParamList } from '../navigation/types';
import type { FiltroTipo } from '../types';
import { colors, styles as s } from '../theme';
import { claveContenido } from '../utils/catalogo';

type Props = CompositeScreenProps<BottomTabScreenProps<TabsParamList, 'Explorar'>, NativeStackScreenProps<RootStackParamList>>;
const filtros: { valor: FiltroTipo; label: string }[] = [{ valor: 'todo', label: 'Todo' }, { valor: 'movie', label: 'Películas' }, { valor: 'tv', label: 'Series' }];
export function ExplorarScreen({ navigation }: Props) {
  const { titulo, filtro, estado, cambiarTitulo, cambiarFiltro, cargarMas, reintentar } = useBusqueda();
  const datos = 'datos' in estado ? estado.datos : undefined;
  const resultados = datos?.resultados ?? [];
  return <SafeAreaView style={s.page} edges={['left', 'right']}>
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <FlatList data={resultados} numColumns={2} keyExtractor={claveContenido} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 24, gap: 16, flexGrow: 1, maxWidth: 640, width: '100%', alignSelf: 'center' }} columnWrapperStyle={{ gap: 12 }}
        ListHeaderComponent={<View style={{ gap: 20, marginBottom: 8 }}>
          <Text style={s.eyebrow}>DESCUBRE TU PRÓXIMA FAVORITA</Text>
          <Heading title="Tu próxima historia empieza aquí" subtitle="Encuentra películas y series para tu cartelera." />
          <Text style={s.label}>Título de película o serie</Text>
          <TextInput style={s.input} accessibilityLabel="Buscar película o serie" placeholder="Escribe un título…" placeholderTextColor={colors.secondary} value={titulo} onChangeText={cambiarTitulo} returnKeyType="search" autoCorrect={false} />
          <View style={s.row}>{filtros.map(item => <Pressable key={item.valor} accessibilityRole="button" accessibilityState={{ selected: filtro === item.valor }} onPress={() => cambiarFiltro(item.valor)} style={[s.chip, filtro === item.valor && s.chipActive]}><Text style={s.chipText}>{item.label}</Text></Pressable>)}</View>
        </View>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.titulo}, ${item.anio ?? 'año no disponible'}, ${item.tipo === 'movie' ? 'película' : 'serie'}. Abrir detalle`} onPress={() => navigation.navigate('Detalle', { tipo: item.tipo, id: item.tmdbId })} style={({ pressed }) => [{ flex: 1, maxWidth: '48%', minHeight: 44, gap: 8, opacity: pressed ? 0.7 : 1 }]}>
          <ImagenCatalogo uri={item.posterUrl} label={`Póster de ${item.titulo}`} style={{ width: '100%' }} />
          <Text style={s.label} numberOfLines={3}>{item.titulo}</Text>
          <Text style={s.body}>{item.anio ?? 'Sin fecha'} · {item.tipo === 'movie' ? 'Película' : 'Serie'}</Text>
        </Pressable>}
        ListFooterComponent={<View style={{ gap: 16, paddingBottom: 24 }}>
          {estado.estado === 'inicial' && <Text style={s.body} accessibilityLiveRegion="polite">{titulo.trim() ? 'Preparando búsqueda…' : 'Escribe un título para descubrir tu próxima historia.'}</Text>}
          {estado.estado === 'cargando' && <><ActivityIndicator color={colors.accent} accessibilityLabel="Buscando títulos" /><Text style={s.body} accessibilityLiveRegion="polite">{datos ? 'Cargando más títulos…' : 'Buscando…'}</Text></>}
          {estado.estado === 'error' && <><Text style={s.body} accessibilityRole="alert" accessibilityLiveRegion="assertive">{estado.mensaje}</Text><Button title="Reintentar" onPress={reintentar} /></>}
          {estado.estado === 'exito' && <>
            {resultados.length === 0 && <Text style={s.body} accessibilityLiveRegion="polite">{datos && datos.pagina < datos.totalPaginas ? 'Esta página no contiene películas ni series. Puedes continuar con la siguiente.' : 'No encontramos películas ni series para este título.'}</Text>}
            <Text style={s.body}>Página {estado.datos.pagina} de {Math.max(1, estado.datos.totalPaginas)}</Text>
            {estado.datos.pagina < estado.datos.totalPaginas && <Button title="Cargar más" onPress={cargarMas} />}
          </>}
        </View>} />
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
