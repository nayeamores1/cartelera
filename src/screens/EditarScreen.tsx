import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Heading, Page } from '../components/UI';
import { EstadoMiLista } from '../components/EstadoMiLista';
import { useCartelera } from '../context/CarteleraContext';
import type { RootStackParamList } from '../navigation/types';
import type { Calificacion, Edicion, Estado, ListaItem } from '../types';
import { nombreEstado } from '../utils/lista';
import { colors, styles as s } from '../theme';
type Props = NativeStackScreenProps<RootStackParamList, 'Editar'>;
type Eliminacion =
  | { estado: 'inactiva' }
  | { estado: 'eliminando' | 'eliminada'; item: ListaItem }
  | { estado: 'error'; item: ListaItem; mensaje: string };
export function EditarScreen(props: Props) {
  return <EditorEntrada key={props.route.params.itemId} {...props} />;
}
function EditorEntrada(props: Props) {
  const c = useCartelera();
  const [eliminacion, setEliminacion] = useState<Eliminacion>({ estado: 'inactiva' });
  const eliminando = useRef(false);
  const itemActual = c.lista.find(entry => `${entry.tipo}_${entry.tmdbId}` === props.route.params.itemId);
  // La lista puede cambiar antes de que la acción termine de confirmar/cachar.
  // Conservar el formulario durante ese intervalo, sin confundirlo con ausencia.
  const item = itemActual ?? (eliminacion.estado !== 'inactiva' ? eliminacion.item : null);
  async function eliminar(entrada: ListaItem) {
    if (eliminando.current || c.mutandoLista || c.cargandoLista || c.pendiente || !c.confirmada || c.conexion !== 'conectado') return;
    eliminando.current = true;
    setEliminacion({ estado: 'eliminando', item: entrada });
    try {
      await c.acciones.eliminar(props.route.params.itemId);
      setEliminacion({ estado: 'eliminada', item: entrada });
    } catch (error: unknown) {
      setEliminacion({ estado: 'error', item: entrada, mensaje: error instanceof Error ? error.message : 'No se pudo confirmar la eliminación.' });
    } finally { eliminando.current = false; }
  }
  if (eliminacion.estado === 'eliminada') return <RegresoMiLista navigation={props.navigation} />;
  if (!item) return <Page>
    <Heading title="Entrada no disponible" subtitle="Puede haberse eliminado o la copia aún no está disponible." />
    <EstadoMiLista />
    <Button title="Volver a Mi lista" onPress={() => props.navigation.popTo('Cartelera', { screen: 'Lista' })} />
  </Page>;
  return <Formulario {...props} item={item} eliminando={eliminacion.estado === 'eliminando'} errorEliminacion={eliminacion.estado === 'error' ? eliminacion.mensaje : null} eliminar={entrada => { void eliminar(entrada); }} />;
}
function RegresoMiLista({ navigation }: Pick<Props, 'navigation'>) {
  // El formulario ya está desmontado: su usePreventRemove se ha retirado
  // antes de este efecto, por lo que eliminar no dispara el aviso de borrador.
  useEffect(() => { navigation.popTo('Cartelera', { screen: 'Lista' }); }, [navigation]);
  return <Page><ActivityIndicator color={colors.accent} accessibilityLabel="Volviendo a Mi lista" /><Text style={s.body} accessibilityLiveRegion="polite">Entrada eliminada. Volviendo a Mi lista…</Text></Page>;
}
function Formulario({ item, navigation, route, eliminando, errorEliminacion, eliminar }: Props & { item: ListaItem; eliminando: boolean; errorEliminacion: string | null; eliminar: (item: ListaItem) => void }) {
  const c = useCartelera();
  const [estado, setEstado] = useState<Estado>(item.estado);
  const [calificacion, setCalificacion] = useState<Calificacion>(item.calificacionPersonal);
  const [comentario, setComentario] = useState(item.comentario);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const enviando = useRef(false);
  const sucio = estado !== item.estado || calificacion !== item.calificacionPersonal || comentario !== item.comentario;
  usePreventRemove(sucio && !!c.usuario, ({ data }) => Alert.alert('Cambios sin guardar', '¿Quieres salir y descartar tus cambios?', [{ text: 'Seguir editando', style: 'cancel' }, { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) }]));
  const bloqueado = eliminando || c.conexion !== 'conectado' || !c.confirmada || c.pendiente || c.mutandoLista || c.cargandoLista;
  async function guardar() {
    if (enviando.current || bloqueado) return;
    enviando.current = true; setMensaje(null);
    const cambios: Edicion = { estado, calificacionPersonal: estado === 'vista' ? calificacion : null, comentario };
    try { await c.acciones.editar(route.params.itemId, cambios); setMensaje('Cambios confirmados y lista actualizada.'); }
    catch (error: unknown) { setMensaje(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    finally { enviando.current = false; }
  }
  function quitar() {
    Alert.alert('Quitar de Mi lista', `¿Quieres quitar «${item.titulo}»?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Quitar', style: 'destructive', onPress: () => {
      if (enviando.current || bloqueado) return;
      eliminar(item);
    } }]);
  }
  return <Page>
    <Heading title={item.titulo} subtitle="Tu experiencia con esta historia" />
    <EstadoMiLista />
    <Text style={s.label}>Estado</Text><View style={s.row}>{(['por_ver', 'viendo', 'vista'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === estado, disabled: c.mutandoLista }} disabled={c.mutandoLista} style={[s.chip, value === estado && s.chipActive]} onPress={() => { setEstado(value); if (value !== 'vista') { setCalificacion(null); if (calificacion !== null) setMensaje('Se quitó la calificación al salir del estado Vista.'); } }}><Text style={s.chipText}>{nombreEstado[value]}</Text></Pressable>)}</View>
    <Text style={s.label}>Calificación personal</Text><View style={s.row}>{([1, 2, 3, 4, 5] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} de 5 estrellas`} accessibilityState={{ selected: calificacion === value, disabled: estado !== 'vista' || c.mutandoLista }} disabled={estado !== 'vista' || c.mutandoLista} style={[s.chip, estado !== 'vista' && s.disabled]} onPress={() => setCalificacion(value)}><Text style={{ color: colors.accent, fontSize: 22 }}>{calificacion !== null && value <= calificacion ? '★' : '☆'}</Text></Pressable>)}</View>
    <Button title="Sin calificar" secondary disabled={estado !== 'vista' || c.mutandoLista} onPress={() => setCalificacion(null)} />
    {estado !== 'vista' && <Text style={s.body}>Las estrellas solo están disponibles en Vista. Cambiar a otro estado elimina la calificación.</Text>}
    <Text style={s.label}>Comentario</Text><TextInput style={[s.input, { minHeight: 140, textAlignVertical: 'top' }]} accessibilityLabel="Comentario, máximo 500 caracteres" placeholder="¿Qué te pareció?" placeholderTextColor={colors.secondary} multiline maxLength={500} value={comentario} onChangeText={setComentario} editable={!c.mutandoLista} />
    <Text style={s.body}>{comentario.length}/500 caracteres</Text>
    {mensaje && <Text style={s.body} accessibilityLiveRegion="polite">{mensaje}</Text>}
    {errorEliminacion && <Text style={s.body} accessibilityRole="alert" accessibilityLiveRegion="assertive">{errorEliminacion}</Text>}
    <Button title={c.mutandoLista ? 'Confirmando…' : 'Guardar'} disabled={bloqueado || !sucio} onPress={() => { void guardar(); }} />
    <Button title={eliminando ? 'Confirmando eliminación…' : 'Quitar de Mi lista'} secondary disabled={bloqueado} onPress={quitar} />
  </Page>;
}
