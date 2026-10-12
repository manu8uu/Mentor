import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GoalSummary, getGoals } from '../lib/api';
import { Theme, useTheme } from '../theme';
import Press from './Press';

type Props = {
  value: number | null; // id del objetivo o null si no tiene
  onChange: (goalId: number | null) => void;
};

export default function GoalPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [goals, setGoals] = useState<GoalSummary[] | null>(null);

  // se recarga al volver de crear un objetivo
  useFocusEffect(
    useCallback(() => {
      getGoals().then(setGoals).catch(() => setGoals([]));
    }, []),
  );

  const chip = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <Press key={key} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Press>
  );

  if (goals !== null && goals.length === 0) {
    return (
      <View>
        <Text style={styles.hint}>Aún no tienes objetivos.</Text>
        <Press onPress={() => router.push('/goals/form')} style={styles.link}>
          <Text style={styles.linkText}>Crear un objetivo</Text>
        </Press>
      </View>
    );
  }

  return (
    <View style={styles.chips}>
      {chip('none', 'Sin objetivo', value === null, () => onChange(null))}
      {(goals ?? []).map((g) => chip(String(g.id), g.title, value === g.id, () => onChange(g.id)))}
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      maxWidth: 220,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    chipSelected: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { fontSize: 14, fontWeight: '500', color: c.ink },
    chipTextSelected: { color: c.onAccent, fontWeight: '700' },
    hint: { fontSize: 14, color: c.muted },
    link: { alignSelf: 'flex-start', marginTop: 8 },
    linkText: { fontSize: 14, fontWeight: '700', color: c.accent },
  });