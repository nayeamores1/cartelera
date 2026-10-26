import { StyleSheet } from 'react-native';
export const colors = {
  background: '#0B1020', surface: '#171E32', accent: '#B7A0FF',
  text: '#F5F6FA', secondary: '#AAB3C7', border: '#303A54',
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 20, flexGrow: 1, maxWidth: 640, width: '100%', alignSelf: 'center' },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', lineHeight: 39 },
  heading: { color: colors.text, fontSize: 20, fontWeight: '700' },
  body: { color: colors.secondary, fontSize: 16, lineHeight: 25 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  card: { padding: 20, borderRadius: 16, backgroundColor: colors.surface, gap: 12, borderWidth: 1, borderColor: colors.border },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, padding: 14, fontSize: 16 },
  button: { minHeight: 50, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.text },
  disabled: { opacity: 0.65 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, padding: 12, borderRadius: 22, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', backgroundColor: colors.surface },
  chipActive: { borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14 },
  poster: { minHeight: 220, backgroundColor: colors.surface, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
});
