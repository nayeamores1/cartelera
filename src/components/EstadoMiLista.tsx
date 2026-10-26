import { ActivityIndicator, Text, View } from 'react-native';
import { useCartelera } from '../context/CarteleraContext';
import { colors, styles as s } from '../theme';
import { Button } from './UI';
export function EstadoMiLista() {
  const c = useCartelera();
  return <View style={{ gap: 10 }}>
    {c.conexion === 'sin-conexion' && <Text style={s.body} accessibilityRole="alert">{c.tieneCopia ? 'Sin conexión. Estás viendo tu última copia guardada' : 'Sin conexión. No hay una copia guardada para esta cuenta.'}</Text>}
    {c.conexion === 'sin-comprobar' && <Text style={s.body}>Comprobando conexión. Las modificaciones están deshabilitadas.</Text>}
    {c.cargandoLista && <ActivityIndicator color={colors.accent} accessibilityLabel="Actualizando Mi lista" />}
    {c.pendiente && <Text style={s.body} accessibilityRole="alert">Hay una operación pendiente de confirmar. No la repitas; se reconciliará con el servidor.</Text>}
    {c.errorLista && <Text style={s.body} accessibilityRole="alert" accessibilityLiveRegion="assertive">{c.errorLista}</Text>}
    <Text style={s.body}>Última copia: {c.ultimaCopia ? new Date(c.ultimaCopia).toLocaleString('es-ES') : 'ninguna'}</Text>
    <Button title="Actualizar lista" secondary disabled={c.conexion !== 'conectado' || c.cargandoLista || c.mutandoLista} onPress={() => { void c.refrescarLista(); }} />
  </View>;
}
