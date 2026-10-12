import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import GoalPicker from '../../components/GoalPicker';
import Press from '../../components/Press';
import ReminderPicker from '../../components/ReminderPicker';
import Screen from '../../components/Screen';
import {
  HistoryEntry,
  Task,
  getHistory,
  getTasks,
  setReminder,
  setTaskGoal,
} from '../../lib/api';
import { longDate, shortDateTime, toIso } from '../../lib/dates';
import { fmt } from '../../lib/format';
import { describeRule } from '../../lib/recurrence';
import { ensureNotificationPermission, syncReminders } from '../../lib/reminders';
import { useTasks } from '../../store';
import { Theme, useTheme } from '../../theme';

export default function DetalleTarea() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { reload: reloadToday } = useTasks();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Number(id);

  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [tasks, entries] = await Promise.all([getTasks(), getHistory(taskId)]);
      setTask(tasks.find((t) => t.id === taskId) ?? null);
      setHistory(entries);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se han podido cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeReminder = async (time: string | null) => {
    if (time && !(await ensureNotificationPermission())) {
      Alert.alert(
        'Notificaciones desactivadas',
        'El recordatorio se guardará, pero no recibirás el aviso hasta que permitas las notificaciones en los ajustes del móvil.',
      );
    }
    try {
      setTask(await setReminder(taskId, time));
      setError(null);
      void syncReminders();
      void reloadToday();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido guardar el recordatorio.');
    }
  };

  const changeGoal = async (goalId: number | null) => {
    try {
      setTask(await setTaskGoal(taskId, goalId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido cambiar el objetivo.');
    }
  };

  const repeat = describeRule(task?.recurrenceRule);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <BackButton />
        </View>

        {loading && <ActivityIndicator color={colors.accent} style={styles.loader} />}

        {error && (
          <View style={styles.error}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
            <View style={styles.errorContent}>
              <Text style={styles.errorText}>{error}</Text>
              <Press onPress={() => void load()} style={styles.retry}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Press>
            </View>
          </View>
        )}

        {!loading && !error && !task && (
          <Text style={styles.muted}>Esta tarea ya no existe.</Text>
        )}

        {task && (
          <>
            <Text style={styles.heading}>{task.title}</Text>
            <Text style={styles.lead}>
              Meta de {fmt(task.targetValue)} {task.unit}
              {repeat ? `. ${repeat}.` : '.'}
            </Text>

            <Text style={styles.section}>Objetivo</Text>
            <GoalPicker value={task.goalId} onChange={changeGoal} />

            <Text style={styles.section}>Recordatorio</Text>
            <ReminderPicker
              value={task.reminderTime ? task.reminderTime.slice(0, 5) : null}
              onChange={changeReminder}
            />

            <Text style={styles.section}>Historial</Text>
            {history.length === 0 ? (
              <Text style={styles.muted}>
                Todavía no hay registros. Cada vez que añadas progreso aparecerá aquí, con su nota
                si escribes una.
              </Text>
            ) : (
              <View style={styles.card}>
                {history.map((h, index) => {
                  const positive = h.amount > 0;
                  const otherDay = h.date !== toIso(new Date(h.createdAt));
                  return (
                    <View key={h.id} style={[styles.entry, index > 0 && styles.entryDivider]}>
                      <View style={styles.entryHead}>
                        <Text style={styles.entryDate}>{shortDateTime(h.createdAt)}</Text>
                        <Text
                          style={[styles.entryAmount, { color: positive ? colors.done : colors.muted }]}
                        >
                          {positive ? '+' : '−'}
                          {fmt(Math.abs(h.amount))} {task.unit}
                        </Text>
                      </View>
                      {otherDay && (
                        <Text style={styles.entryFor}>
                          Para el {longDate(h.date).toLowerCase()}
                        </Text>
                      )}
                      {h.note ? <Text style={styles.entryNote}>{h.note}</Text> : null}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 48 },
    topBar: { paddingTop: 12 },
    heading: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, color: c.ink, marginTop: 18 },
    lead: { fontSize: 15, lineHeight: 21, color: c.muted, marginTop: 4 },
    section: { fontSize: 18, fontWeight: '700', color: c.ink, marginTop: 30, marginBottom: 12 },
    muted: { fontSize: 15, lineHeight: 22, color: c.muted },
    loader: { marginTop: 40 },

    error: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.danger + '55',
      backgroundColor: c.surface,
      marginTop: 20,
    },
    errorContent: { flex: 1, gap: 8 },
    errorText: { fontSize: 14, lineHeight: 20, color: c.ink },
    retry: { alignSelf: 'flex-start' },
    retryText: { color: c.accent, fontWeight: '700' },

    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      paddingHorizontal: 16,
    },
    entry: { paddingVertical: 14, gap: 4 },
    entryDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline },
    entryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    entryDate: { fontSize: 14, fontWeight: '600', color: c.ink },
    entryAmount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
    entryFor: { fontSize: 13, color: c.muted },
    entryNote: { fontSize: 15, lineHeight: 21, color: c.ink, marginTop: 2 },
  });