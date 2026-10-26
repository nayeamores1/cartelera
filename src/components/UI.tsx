import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, styles as s } from '../theme';

export function Page({ children }: PropsWithChildren) {
  return <SafeAreaView style={s.page} edges={['left', 'right', 'bottom']}>
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Button({ title, onPress, disabled = false, secondary = false }: {
  title: string; onPress?: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, secondary && s.secondaryButton, (disabled || pressed) && s.disabled]}>
    <Text style={[s.buttonText, secondary && s.secondaryButtonText]}>{title}</Text>
  </Pressable>;
}
export function Notice({ children }: PropsWithChildren) {
  return <View style={[s.card, { borderLeftColor: colors.accent, borderLeftWidth: 3 }]}>
    <Text style={s.eyebrow}>VISTA PREVIA · ETAPA 1</Text><Text style={s.body}>{children}</Text>
  </View>;
}
export function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={{ gap: 10 }}><Text style={s.title} accessibilityRole="header">{title}</Text><Text style={s.body}>{subtitle}</Text></View>;
}
