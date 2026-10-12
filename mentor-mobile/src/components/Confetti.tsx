import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

const COUNT = 22;

// cada vez que fireKey sube, sale una ráfaga desde el punto donde se coloque
export default function Confetti({ fireKey }: { fireKey: number }) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  const particles = useMemo(() => {
    const palette = [colors.accent, colors.accent2, colors.done, '#F2B84B', '#E8735A'];
    return Array.from({ length: COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.4;
      const distance = 70 + Math.random() * 90;
      const size = 5 + Math.random() * 5;
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 40,
        spin: (Math.random() - 0.5) * 720,
        size,
        round: i % 3 === 0,
        color: palette[i % palette.length],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireKey]);

  useEffect(() => {
    if (fireKey === 0) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 950,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fireKey, progress]);

  if (fireKey === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? p.size / 2 : 1.5,
            backgroundColor: p.color,
            opacity: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, p.dy, p.dy + 90],
                }),
              },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${p.spin}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}