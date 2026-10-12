import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  value: number; // 0 a 1
  label: string;
  size?: number;
  stroke?: number;
};

export default function ProgressRing({ value, label, size = 88, stroke = 9 }: Props) {
  const { colors } = useTheme();
  const clamped = Math.min(Math.max(value, 0), 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, anim]);

  const offset = anim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.hairline}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={clamped >= 1 ? colors.done : colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          fill="none"
        />
      </Svg>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] }}>
        {label}
      </Text>
    </View>
  );
}