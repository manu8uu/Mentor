import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  progress: number; // 0 a 1; si pasa de 1 se queda llena
  height?: number;
};

export default function ProgressBar({ progress, height = 10 }: Props) {
  const { colors } = useTheme();
  const clamped = Math.min(Math.max(progress, 0), 1);
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: clamped,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // el ancho no admite driver nativo
    }).start();
  }, [clamped, value]);

  const width = value.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.hairline }]}
    >
      <Animated.View style={{ width, height: '100%' }}>
        <LinearGradient
          colors={clamped >= 1 ? [colors.done, colors.done] : [colors.accent, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: height / 2 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});