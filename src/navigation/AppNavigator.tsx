import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList, TabsParamList } from './types';
import { AuthScreen } from '../screens/AuthScreen';
import { ExplorarScreen } from '../screens/ExplorarScreen';
import { ListaScreen } from '../screens/ListaScreen';
import { AcercaScreen } from '../screens/AcercaScreen';
import { DetalleScreen } from '../screens/DetalleScreen';
import { EditarScreen } from '../screens/EditarScreen';
import { colors, styles as s } from '../theme';
import { useCartelera } from '../context/CarteleraContext';
import { Button } from '../components/UI';
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.accent, background: colors.background, card: colors.surface, text: colors.text, border: colors.border } };
function Tabs() {
  return <Tab.Navigator screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.secondary,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarItemStyle: { minHeight: 44 },
    tabBarIcon: ({ color }) => <Text accessible={false} style={{ color, fontSize: 22 }}>{route.name === 'Explorar' ? '⌕' : route.name === 'Lista' ? '▤' : 'ⓘ'}</Text>,
  })}>
    <Tab.Screen name="Explorar" component={ExplorarScreen} options={{ title: 'Buscar' }} />
    <Tab.Screen name="Lista" component={ListaScreen} options={{ title: 'Mi lista' }} />
    <Tab.Screen name="Acerca" component={AcercaScreen} options={{ title: 'Acerca de' }} />
  </Tab.Navigator>;
}
export function AppNavigator() {
  const { usuario, recuperandoSesion, errorSesion, reintentarSesion } = useCartelera();
  if (recuperandoSesion || errorSesion) return <SafeAreaView style={s.page}>
    <View style={[s.content, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={s.title}>Mi Cartelera Personal</Text>
      {recuperandoSesion ? <>
        <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Recuperando sesión" />
        <Text style={s.body} accessibilityLiveRegion="polite">Recuperando tu sesión…</Text>
      </> : <>
        <Text style={s.body} accessibilityRole="alert" accessibilityLiveRegion="assertive">{errorSesion}</Text>
        <Button title="Reintentar" onPress={reintentarSesion} />
      </>}
    </View>
  </SafeAreaView>;
  return <NavigationContainer theme={theme}>
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}>
      {usuario ? <Stack.Group navigationKey={usuario.uid}>
        <Stack.Screen name="Cartelera" component={Tabs} options={{ title: 'Mi Cartelera' }} />
        <Stack.Screen name="Detalle" component={DetalleScreen} options={{ title: 'Detalle' }} />
        <Stack.Screen name="Editar" component={EditarScreen} options={{ title: 'Editar título' }} />
      </Stack.Group> : <Stack.Group navigationKey="sin-sesion">
        <Stack.Screen name="Login" component={AuthScreen} options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="Registro" component={AuthScreen} options={{ title: 'Crear cuenta' }} />
      </Stack.Group>}
    </Stack.Navigator>
  </NavigationContainer>;
}
