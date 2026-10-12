import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Theme, useTheme } from '../theme';
import Press from './Press';

const PRESETS = ['08:00', '13:00', '20:00'];

const pad = (n: number) => String(n).padStart(2, '0');
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function toDate(time: string | null) {
  const d = new Date();
  const [hours, minutes] = (time ?? '09:00').split(':').map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

type Props = {
  value: string | null; // "20:00" o null si no hay recordatorio
  onChange: (value: string | null) => void;
};

export default function ReminderPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [picking, setPicking] = useState(false);

  const custom = value !== null && !PRESETS.includes(value);

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setPicking(false);
    if (event.type === 'dismissed') setPicking(false);
    if (event.type === 'set' && date) onChange(toTime(date));
  };

  const chip = (label: string, selected: boolean, onPress: () => void) => (
    <Press key={label} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Press>
  );

  return (
    <View>
      <View style={styles.chips}>
        {chip('Sin aviso', value === null, () => onChange(null))}
        {PRESETS.map((time) => chip(time, value === time, () => onChange(time)))}
        {custom && chip(value as string, true, () => setPicking(true))}
        {chip('Otra hora', false, () => setPicking(true))}
      </View>

      <Text style={styles.hint}>
        {value
          ? `Te avisaremos a las ${value} los días que toque esta tarea.`
          : 'No recibirás ningún aviso para esta tarea.'}
      </Text>

      {picking && (
        <View style={Platform.OS === 'ios' ? styles.iosPicker : undefined}>
          <DateTimePicker
            value={toDate(value)}
            mode="time"
            is24Hour
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
    chipText: { fontSize: 14, fontWeight: '500', color: c.ink, fontVariant: ['tabular-nums'] },
    chipTextSelected: { color: c.onAccent, fontWeight: '700' },
    hint: { fontSize: 13, color: c.muted, marginTop: 12 },
    iosPicker: { marginTop: 8, alignItems: 'center' },
    done: { paddingVertical: 8, paddingHorizontal: 20 },
    doneText: { fontSize: 15, fontWeight: '700', color: c.accent },
  });