import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export default function BackButton() {
  const { colors } = useTheme();

  // vuelve atrás; si no hay pantalla anterior (por ejemplo tras recargar), va al inicio
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Pressable
      onPress={goBack}
      hitSlop={14}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.hairline },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="chevron-back" size={22} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});