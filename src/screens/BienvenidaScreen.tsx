import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Button, Heading, Notice, Page } from '../components/UI';
import type { RootStackParamList } from '../navigation/types';
import { styles as s } from '../theme';
export function BienvenidaScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Bienvenida'>) {
  return <Page>
    <Text style={s.eyebrow}>TU PRÓXIMA HISTORIA</Text>
    <Heading title={'Mi Cartelera\nPersonal'} subtitle="Un lugar para las historias que quieres descubrir, seguir y recordar." />
    <View style={s.poster}><Text style={[s.title, { fontSize: 64 }]} accessible={false}>✦</Text><Text style={s.heading}>Elige tu próxima función</Text><Text style={s.body}>Películas y series, a tu ritmo.</Text></View>
    <Button title="Iniciar sesión" onPress={() => navigation.navigate('Login')} />
    <Button title="Crear una cuenta" secondary onPress={() => navigation.navigate('Registro')} />
    <Notice>Explora la estructura de la app. El acceso y la sincronización se conectarán en las siguientes etapas.</Notice>
    <Button title="Recorrer vista previa" secondary onPress={() => navigation.navigate('Cartelera')} />
  </Page>;
}
