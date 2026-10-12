import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BackButton from '../components/BackButton';
import GoalPicker from '../components/GoalPicker';
import Press from '../components/Press';
import ReminderPicker from '../components/ReminderPicker';
import Screen from '../components/Screen';
import { goBack } from '../lib/nav';
import { RepeatMode, WEEK, buildRule } from '../lib/recurrence';
import { ensureNotificationPermission } from '../lib/reminders';
import { useTasks } from '../store';
import { Theme, useTheme } from '../theme';

const UNITS = ['h', 'min', 'palabras', 'páginas', 'km', 'veces'];

const MODES: { key: RepeatMode; label: string }[] = [
  { key: 'once', label: 'Solo hoy' },
  { key: 'daily', label: 'Cada día' },
  { key: 'weekly', label: 'Días concretos' },
];

function toNumber(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function NuevaTarea() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { create } = useTasks();
  const params = useLocalSearchParams<{ goalId?: string }>();

  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('');
  const [target, setTarget] = useState('');
  const [mode, setMode] = useState<RepeatMode>('once');
  const [days, setDays] = useState<string[]>([]);
  const [reminder, setReminder] = useState<string | null>(null);
  // si llegamos desde la pantalla de un objetivo, ya viene elegido
  const [goalId, setGoalId] = useState<number | null>(params.goalId ? Number(params.goalId) : null);
  const [focus, setFocus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const targetValue = toNumber(target);
  const valid =
    title.trim().length > 0 &&
    unit.trim().length > 0 &&
    targetValue !== null &&
    (mode !== 'weekly' || days.length > 0);

  // JS cuenta el domingo como 0; nuestra semana empieza en lunes
  const todayCode = WEEK[(new Date().getDay() + 6) % 7].code;
  const appearsToday = mode !== 'weekly' || days.includes(todayCode);

  const toggleDay = (code: string) =>
    setDays((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const save = async () => {
    if (!valid || targetValue === null || saving) return;
    setSaving(true);
    setFormError(null);

    if (reminder && !(await ensureNotificationPermission())) {
      Alert.alert(
        'Notificaciones desactivadas',
        'La tarea se guardará, pero no recibirás el aviso hasta que permitas las notificaciones en los ajustes del móvil.',
      );
    }

    const failure = await create({
      title: title.trim(),
      unit: unit.trim(),
      target: targetValue,
      recurrenceRule: buildRule(mode, days),
      reminderTime: reminder ?? undefined,
      goalId: goalId ?? undefined,
    });
    setSaving(false);
    if (failure) {
      setFormError(failure);
      return;
    }
    if (!appearsToday) {
      Alert.alert(
        'Tarea guardada',
        'Hoy no toca. Aparecerá el próximo día que has elegido.',
        [{ text: 'Entendido', onPress: goBack }],
        { cancelable: false },
      );
      return;
    }
    goBack();
  };

  const fieldStyle = (name: string) => [styles.field, focus === name && styles.fieldFocused];
  const focusProps = (name: string) => ({
    onFocus: () => setFocus(name),
    onBlur: () => setFocus(null),
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <BackButton />
          </View>

          <Text style={styles.heading}>Nueva tarea</Text>
          <Text style={styles.lead}>Define qué quieres medir y cada cuánto.</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Estudiar inglés"
            placeholderTextColor={colors.muted}
            returnKeyType="next"
            style={fieldStyle('title')}
            {...focusProps('title')}
          />

          <Text style={styles.label}>Unidad de medida</Text>
          <TextInput
            value={unit}
            onChangeText={setUnit}
            placeholder="h, palabras, páginas…"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            returnKeyType="next"
            style={fieldStyle('unit')}
            {...focusProps('unit')}
          />
          <View style={styles.chips}>
            {UNITS.map((u) => {
              const selected = unit.trim() === u;
              return (
                <Press
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{u}</Text>
                </Press>
              );
            })}
          </View>

          <Text style={styles.label}>Meta</Text>
          <TextInput
            value={target}
            onChangeText={setTarget}
            placeholder="2"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            returnKeyType="done"
            style={fieldStyle('target')}
            {...focusProps('target')}
          />

          <Text style={styles.label}>Repetición</Text>
          <View style={styles.segment}>
            {MODES.map((m) => {
              const selected = mode === m.key;
              return (
                <Press
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  accessibilityState={{ selected }}
                  containerStyle={styles.segmentSlot}
                  scale={0.96}
                  style={[styles.segmentItem, selected && styles.segmentSelected]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {m.label}
                  </Text>
                </Press>
              );
            })}
          </View>

          {mode === 'weekly' && (
            <View style={styles.weekRow}>
              {WEEK.map((d) => {
                const selected = days.includes(d.code);
                return (
                  <Press
                    key={d.code}
                    onPress={() => toggleDay(d.code)}
                    accessibilityLabel={d.name}
                    accessibilityState={{ selected }}
                    scale={0.9}
                    style={[styles.dayChip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {d.short}
                    </Text>
                  </Press>
                );
              })}
            </View>
          )}

          <Text style={styles.label}>Recordatorio</Text>
          <ReminderPicker value={reminder} onChange={setReminder} />

          <Text style={styles.label}>Objetivo</Text>
          <GoalPicker value={goalId} onChange={setGoalId} />

          {formError && (
            <View style={styles.error}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}

          <Press
            onPress={save}
            disabled={!valid || saving}
            containerStyle={styles.saveSlot}
            style={[styles.save, (!valid || saving) && styles.saveOff]}
          >
            <LinearGradient
              colors={[colors.accent, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar tarea'}</Text>
          </Press>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 48 },

    topBar: { paddingTop: 12 },
    heading: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8, color: c.ink, marginTop: 18 },
    lead: { fontSize: 16, color: c.muted, marginTop: 4, marginBottom: 6 },

    label: { fontSize: 14, fontWeight: '600', color: c.muted, marginTop: 24, marginBottom: 8 },
    field: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.hairline,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 17,
      color: c.ink,
    },
    fieldFocused: { borderColor: c.accent },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
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

    segment: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.hairline,
      padding: 4,
      gap: 4,
    },
    segmentSlot: { flex: 1 },
    segmentItem: { paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
    segmentSelected: { backgroundColor: c.accent },
    segmentText: { fontSize: 14, fontWeight: '500', color: c.muted },
    segmentTextSelected: { color: c.onAccent, fontWeight: '700' },

    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    dayChip: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },

    error: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.danger + '55',
      padding: 14,
      marginTop: 24,
    },
    errorText: { flex: 1, fontSize: 14, lineHeight: 20, color: c.ink },

    saveSlot: { marginTop: 32 },
    save: {
      height: 56,
      borderRadius: 16,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveOff: { opacity: 0.4 },
    saveText: { fontSize: 17, fontWeight: '700', color: c.onAccent },
  });