import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Keyboard, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Heading, Page } from '../components/UI';
import { useCartelera } from '../context/CarteleraContext';
import { validarFormularioAuth } from '../utils/authValidation';
import type { RootStackParamList } from '../navigation/types';
import { colors, styles as s } from '../theme';
export function AuthScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Login' | 'Registro'>) {
  const registro = route.name === 'Registro';
  const { acciones, procesandoAuth } = useCartelera();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviando = useRef(false);
  const montado = useRef(true);
  const claveInput = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmacionInput = useRef<ComponentRef<typeof TextInput>>(null);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  async function enviar() {
    if (enviando.current || procesandoAuth) return;
    const mensaje = validarFormularioAuth(correo, clave, registro ? confirmacion : undefined);
    setError(mensaje);
    if (mensaje) return;
    enviando.current = true;
    Keyboard.dismiss();
    try {
      await (registro ? acciones.registrar(correo, clave) : acciones.ingresar(correo, clave));
      // El observador cambia la navegación; nunca navegamos antes de tener sesión.
    } catch (fallo: unknown) {
      if (montado.current) setError(fallo instanceof Error ? fallo.message : 'No se pudo completar la operación. Inténtalo nuevamente.');
    } finally { enviando.current = false; }
  }
  return <Page>
    <Text style={s.eyebrow}>MI CARTELERA PERSONAL</Text>
    <Heading title={registro ? 'Tu historia empieza aquí' : 'Qué bueno verte'} subtitle="Tu espacio personal para películas y series." />
    <Text style={s.label}>Correo electrónico</Text>
    <TextInput style={s.input} accessibilityLabel="Correo electrónico" placeholder="tu@correo.com" placeholderTextColor={colors.secondary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" value={correo} onChangeText={setCorreo} editable={!procesandoAuth} returnKeyType="next" onSubmitEditing={() => claveInput.current?.focus()} />
    <Text style={s.label}>Contraseña</Text>
    <TextInput ref={claveInput} style={s.input} accessibilityLabel="Contraseña" placeholder="Tu contraseña" placeholderTextColor={colors.secondary} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete={registro ? 'new-password' : 'current-password'} value={clave} onChangeText={setClave} editable={!procesandoAuth} returnKeyType={registro ? 'next' : 'done'} onSubmitEditing={() => { if (registro) confirmacionInput.current?.focus(); else void enviar(); }} />
    {registro && <>
      <Text style={s.body}>Usa al menos 6 caracteres. Firebase comprobará también la política de seguridad del proyecto.</Text>
      <Text style={s.label}>Confirmar contraseña</Text>
      <TextInput ref={confirmacionInput} style={s.input} accessibilityLabel="Confirmar contraseña" placeholder="Repite tu contraseña" placeholderTextColor={colors.secondary} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" value={confirmacion} onChangeText={setConfirmacion} editable={!procesandoAuth} returnKeyType="done" onSubmitEditing={() => { void enviar(); }} />
    </>}
    <Button title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} secondary disabled={procesandoAuth} onPress={() => setVisible(actual => !actual)} />
    {error && <View style={s.card}><Text style={s.body} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text></View>}
    {procesandoAuth && <View style={{ gap: 8 }}>
      <ActivityIndicator color={colors.accent} accessibilityLabel="Procesando solicitud" />
      <Text style={s.body} accessibilityLiveRegion="polite">{registro ? 'Creando tu cuenta…' : 'Iniciando sesión…'}</Text>
    </View>}
    <Button title={registro ? 'Crear cuenta' : 'Ingresar'} disabled={procesandoAuth} onPress={() => { void enviar(); }} />
    <Button title={registro ? 'Ya tengo una cuenta' : 'Quiero crear una cuenta'} secondary disabled={procesandoAuth} onPress={() => navigation.replace(registro ? 'Login' : 'Registro')} />
  </Page>;
}
