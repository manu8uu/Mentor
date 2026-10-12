import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { fmt } from '../lib/format';
import { iconFor } from '../lib/icons';
import { Theme, useTheme } from '../theme';
import Confetti from './Confetti';
import Press from './Press';
import ProgressBar from './ProgressBar';

type Props = {
  title: string;
  unit: string;
  current: number;
  target: number;
  repeat?: string | null;
  reminder?: string | null;
  index: number;
  onOpen: () => void;
  onComplete: () => void;
};

export default function TaskCard({
  title, unit, current, target, repeat, reminder, index, onOpen, onComplete,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const ratio = current / target;
  const done = ratio >= 1;
  const tone = done ? colors.done : colors.accent;

  // entrada escalonada al abrir la pantalla
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index, 6) * 70,
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  // confeti solo cuando pasa de pendiente a completada
  const wasDone = useRef(done);
  const [fire, setFire] = useState(0);
  useEffect(() => {
    if (done && !wasDone.current) {
      setFire((n) => n + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    wasDone.current = done;
  }, [done]);

  return (
    <Animated.View
      style={[
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
        fire > 0 && styles.raised,
      ]}
    >
      <Press
        onPress={onOpen}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`${title}. Abrir para registrar progreso`}
      >
        <View style={styles.row}>
          <View style={[styles.tile, { backgroundColor: tone + '22' }]}>
            <Ionicons name={iconFor(title)} size={22} color={tone} />
          </View>

          <View style={styles.texts}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.amount}>
              {fmt(current)} de {fmt(target)} {unit}
            </Text>
          </View>

          <Press
            onPress={onComplete}
            disabled={done}
            hitSlop={8}
            scale={0.88}
            accessibilityLabel={done ? 'Completada' : 'Marcar como completada'}
            style={[styles.check, done ? { backgroundColor: colors.done, borderColor: colors.done } : null]}
          >
            {done && <Ionicons name="checkmark" size={20} color={colors.onAccent} />}
          </Press>
        </View>

        <View style={styles.barRow}>
          <View style={styles.bar}>
            <ProgressBar progress={ratio} />
          </View>
          <Text style={[styles.percent, done && { color: colors.done }]}>
            {Math.min(Math.round(ratio * 100), 100)} %
          </Text>
        </View>

        {repeat || reminder ? (
          <View style={styles.infoRow}>
            {repeat ? (
              <View style={styles.info}>
                <Ionicons name="repeat-outline" size={14} color={colors.muted} />
                <Text style={styles.infoText}>{repeat}</Text>
              </View>
            ) : null}
            {reminder ? (
              <View style={styles.info}>
                <Ionicons name="notifications-outline" size={14} color={colors.muted} />
                <Text style={styles.infoText}>{reminder}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Press>

      <View pointerEvents="none" style={styles.anchor}>
        <Confetti fireKey={fire} />
      </View>
    </Animated.View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    raised: { zIndex: 10, elevation: 10 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      gap: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      shadowColor: '#000',
      shadowOpacity: c.dark ? 0.35 : 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    tile: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    texts: { flex: 1 },
    title: { fontSize: 17, fontWeight: '600', color: c.ink },
    amount: { fontSize: 14, color: c.muted, marginTop: 2, fontVariant: ['tabular-nums'] },

    check: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: c.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },

    barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bar: { flex: 1 },
    percent: {
      width: 48,
      textAlign: 'right',
      fontSize: 13,
      fontWeight: '600',
      color: c.muted,
      fontVariant: ['tabular-nums'],
    },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: -2 },
    info: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 13, color: c.muted, fontVariant: ['tabular-nums'] },

    // punto del que sale el confeti: sobre el botón de completar
    anchor: { position: 'absolute', right: 33, top: 39, width: 0, height: 0 },
  });