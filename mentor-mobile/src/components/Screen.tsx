import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '../theme';

export default function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: colors.paper }]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern id="dots" width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle
              cx={2}
              cy={2}
              r={1.1}
              fill={colors.accent}
              fillOpacity={colors.dark ? 0.2 : 0.16}
            />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#dots)" />
      </Svg>

      <LinearGradient
        colors={[colors.accent + '33', colors.paper + '00']}
        style={styles.wash}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.fill}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
});