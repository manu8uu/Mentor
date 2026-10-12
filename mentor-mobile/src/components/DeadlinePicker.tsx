import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { MONTHS, parseIso, toIso } from '../lib/dates';
import { Theme, useTheme } from '../theme';
import Press from './Press';

function inMonths(n: number) {
  const d = new Date();
  return toIso(new Date(d.getFullYear(), d.getMonth() + n, d.getDate()));
}

function pretty(iso: string) {
  const d = parseIso(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

type Props = {
  value: string | null; // fecha ISO (2026-12-31) o null si no hay fecha límite
  onChange: (value: string | null) => void;
};

export default function DeadlinePicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [picking, setPicking] = useState(false);

  const year = new Date().getFullYear();
  const presets = [
    { label: 'En 3 meses', value: inMonths(3) },
    { label: 'En 6 meses', value: inMonths(6) },
    { label: `Fin de ${year}`, value: `${year}-12-31` },
  ];
  const custom = value !== null && !presets.some((p) => p.value === value);

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setPicking(false);
    if (event.type === 'dismissed') setPicking(false);
    if (event.type === 'set' && date) onChange(toIso(date));
  };

  const chip = (label: string, selected: boolean, onPress: () => void) => (
    <Press key={label} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Press>
  );

  return (
    <View>
      <View style={styles.chips}>
        {chip('Sin fecha', value === null, () => onChange(null))}
        {presets.map((p) => chip(p.label, value === p.value, () => onChange(p.value)))}
        {custom && chip(pretty(value as string), true, () => setPicking(true))}
        {chip('Otra fecha', false, () => setPicking(true))}
      </View>

      <Text style={styles.hint}>
        {value
          ? `Fecha límite: ${pretty(value)}.`
          : 'Sin fecha límite, el avance solo cuenta las próximas 4 semanas.'}
      </Text>

      {picking && (
        <View style={Platform.OS === 'ios' ? styles.iosPicker : undefined}>
          <DateTimePicker
            value={value ? parseIso(value) : new Date()}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant={colors.dark ? 'dark' : 'light'}
            onChange={onPick}
          />
          {Platform.OS === 'ios' && (
            <Press onPress={() => setPicking(false)} style={styles.done}>
              <Text style={styles.doneText}>Listo</Text>
            </Press>
          )}
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
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
    hint: { fontSize: 13, lineHeight: 19, color: c.muted, marginTop: 12 },
    iosPicker: { marginTop: 8, alignItems: 'center' },
    done: { paddingVertical: 8, paddingHorizontal: 20 },
    doneText: { fontSize: 15, fontWeight: '700', color: c.accent },
  });