import { useState } from 'react';
import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, styles as s } from '../theme';

function Imagen({ uri, label, style }: { uri: string | null; label: string; style?: StyleProp<ViewStyle> }) {
  const [fallo, setFallo] = useState(false);
  return <View style={[{ aspectRatio: 2 / 3, backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }, style]}>
    {uri && !fallo ? <Image source={{ uri }} accessibilityLabel={label} resizeMode="cover" style={{ width: '100%', height: '100%' }} onError={() => setFallo(true)} /> : <Text style={[s.body, { textAlign: 'center', padding: 8 }]} accessibilityLabel={`${label}. Sin imagen disponible`}>Sin imagen</Text>}
  </View>;
}
export function ImagenCatalogo(props: { uri: string | null; label: string; style?: StyleProp<ViewStyle> }) {
  return <Imagen key={props.uri ?? 'sin-imagen'} {...props} />;
}
