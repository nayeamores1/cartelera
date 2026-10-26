import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Text, View } from 'react-native';
import { Button, Heading, Page } from '../components/UI';
import { useCartelera } from '../context/CarteleraContext';
import { colors, styles as s } from '../theme';
export function AcercaScreen() {
  const { usuario, acciones, procesandoAuth } = useCartelera();
  const [error, setError] = useState<string | null>(null);
  const saliendo = useRef(false);
  async function salir() {
    if (saliendo.current || procesandoAuth) return;
    saliendo.current = true;
    setError(null);
    try { await acciones.salir(); }
    catch (fallo: unknown) { setError(fallo instanceof Error ? fallo.message : 'No se pudo cerrar sesión. Inténtalo nuevamente.'); }
    finally { saliendo.current = false; }
  }
  return <Page>
    <Text style={s.eyebrow}>HECHA PARA TUS HISTORIAS</Text>
    <Heading title="Mi Cartelera Personal" subtitle="Proyecto académico · versión 1.0.0 · autenticación" />
    <View style={s.card}><Text style={s.heading}>Tu cuenta</Text><Text style={s.body} selectable>{usuario?.email ?? 'Correo no disponible'}</Text></View>
    <View style={s.card}><Text style={s.heading}>Datos de The Movie Database</Text>
      <Text style={s.body}>Esta aplicación utiliza la API de TMDB, pero no está avalada ni certificada por TMDB.</Text>
      <Text style={s.body}>This product uses the TMDB API but is not endorsed or certified by TMDB.</Text>
      <Image source={require('../../assets/tmdb-logo.png')} accessibilityLabel="Logo oficial de The Movie Database" style={{ width: 130, height: 50, resizeMode: 'contain' }} />
    </View>
    <Button title="Visitar TMDB" secondary onPress={() => { void Linking.openURL('https://www.themoviedb.org').catch(() => Alert.alert('No se pudo abrir TMDB', 'Inténtalo nuevamente.')); }} />
    {error && <Text style={s.body} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text>}
    {procesandoAuth && <ActivityIndicator color={colors.accent} accessibilityLabel="Cerrando sesión" />}
    <Button title={procesandoAuth ? 'Cerrando sesión…' : 'Cerrar sesión'} disabled={procesandoAuth} onPress={() => { void salir(); }} />
  </Page>;
}
