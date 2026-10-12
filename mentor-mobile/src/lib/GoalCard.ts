import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GoalSummary } from '../lib/api';
import { deadlineText, paceInfo, percent } from '../lib/goals';
import { Theme, useTheme } from '../theme';
import Press from './Press';
import ProgressBar from './ProgressBar';

type Props = { goal: GoalSummary; onPress: () => void };

export default function GoalCard({ goal, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pace = paceInfo(goal.pace, colors);
  const hasTasks = goal.taskCount > 0;

  return (
    <Press
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${goal.title}, ${percent(goal.progress)} por ciento`}
    >
      <View style={styles.head}>
        <View style={[styles.tile, { backgroundColor: colors.accent + '22' }]}>
          <Ionicons name="flag-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={2}>{goal.title}</Text>
          <Text style={styles.deadline}>{deadlineText(goal.daysLeft)}</Text>
        </View>
        {hasTasks && (
          <View style={[styles.pill, { backgroundColor: pace.color + '22' }]}>
            <Text style={[styles.pillText, { color: pace.color }]}>{pace.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.barRow}>
        <View style={styles.bar}>
          <ProgressBar progress={goal.progress} />
        </View>
        <Text style={styles.percent}>{percent(goal.progress)} %</Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {hasTasks
            ? `${goal.completed} de ${goal.planned} sesiones`
            : 'Aún no tiene tareas'}
        </Text>
        {hasTasks && (
          <Text style={styles.metaText}>
            {goal.taskCount} {goal.taskCount === 1 ? 'tarea' : 'tareas'}
          </Text>
        )}
      </View>
    </Press>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
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
    head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    tile: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    texts: { flex: 1 },
    title: { fontSize: 17, fontWeight: '600', color: c.ink },
    deadline: { fontSize: 13, color: c.muted, marginTop: 2 },
    pill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12 },
    pillText: { fontSize: 12, fontWeight: '700' },

    barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bar: { flex: 1 },
    percent: {
      width: 48,
      textAlign: 'right',
      fontSize: 14,
      fontWeight: '700',
      color: c.ink,
      fontVariant: ['tabular-nums'],
    },

    meta: { flexDirection: 'row', justifyContent: 'space-between' },
    metaText: { fontSize: 13, color: c.muted, fontVariant: ['tabular-nums'] },
  });