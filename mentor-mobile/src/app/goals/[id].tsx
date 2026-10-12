import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import Press from '../../components/Press';
import ProgressBar from '../../components/ProgressBar';
import Screen from '../../components/Screen';
import { GoalSummary, Task, deleteGoal, getGoal, getTasks, setTaskGoal } from '../../lib/api';
import { fmt } from '../../lib/format';
import { deadlineText, paceInfo, percent } from '../../lib/goals';
import { iconFor } from '../../lib/icons';
import { goBack } from '../../lib/nav';
import { describeRule } from '../../lib/recurrence';
import { Theme, useTheme } from '../../theme';

export default function DetalleObjetivo() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = Number(id);

  const [goal, setGoal] = useState<GoalSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [summary, all] = await Promise.all([getGoal(goalId), getTasks()]);
      setGoal(summary);
      setTasks(all.filter((t) => t.active));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se han podido cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  // se recarga al volver de editar el objetivo o de crear una tarea
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const link = async (taskId: number, target: number | null) => {
    try {
      await setTaskGoal(taskId, target);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido actualizar la tarea.');
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      `¿Eliminar «${goal?.title ?? 'este objetivo'}»?`,
      'Sus tareas no se borran: se quedan sin objetivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goalId);
              goBack();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'No se ha podido eliminar el objetivo.');
            }
          },
        },
      ],
    );

  const linked = tasks.filter((t) => t.goalId === goalId);
  const unlinked = tasks.filter((t) => t.goalId === null);
  const pace = goal ? paceInfo(goal.pace, colors) : null;

  const taskRow = (t: Task, action: string, onAction: () => void, withOpen: boolean) => {
    const repeat = describeRule(t.recurrenceRule);
    return (
      <Press
        key={t.id}
        onPress={() => (withOpen ? router.push(`/task/${t.id}`) : onAction())}
        style={styles.taskRow}
      >
        <View style={[styles.taskIcon, { backgroundColor: colors.accent + '22' }]}>
          <Ionicons name={iconFor(t.title)} size={20} color={colors.accent} />
        </View>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
          <Text style={styles.taskMeta}>
            Meta de {fmt(t.targetValue)} {t.unit}
            {repeat ? `. ${repeat}` : ''}
          </Text>
        </View>
        <Press onPress={onAction} hitSlop={10}>
          <Text style={styles.taskAction}>{action}</Text>
        </Press>
      </Press>
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <BackButton />
          {goal && (
            <Press
              onPress={() => router.push(`/goals/form?id=${goalId}`)}
              hitSlop={8}
              accessibilityLabel="Editar objetivo"
              style={styles.iconButton}
            >
              <Ionicons name="pencil-outline" size={19} color={colors.ink} />
            </Press>
          )}
        </View>

        {loading && !goal && <ActivityIndicator color={colors.accent} style={styles.loader} />}

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

        {goal && pace && (
          <>
            <Text style={styles.heading}>{goal.title}</Text>
            <Text style={styles.deadline}>{deadlineText(goal.daysLeft)}</Text>
            {goal.description ? <Text style={styles.description}>{goal.description}</Text> : null}

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.cardLabel}>Avance del plan</Text>
                  <Text style={styles.big}>{percent(goal.progress)} %</Text>
                </View>
                {goal.taskCount > 0 && (
                  <View style={[styles.pill, { backgroundColor: pace.color + '22' }]}>
                    <Text style={[styles.pillText, { color: pace.color }]}>{pace.label}</Text>
                  </View>
                )}
              </View>
              <ProgressBar progress={goal.progress} height={12} />
              <Text style={styles.cardText}>
                {goal.taskCount === 0
                  ? 'Añade tareas a este objetivo para empezar a medir tu avance.'
                  : `${goal.completed} de ${goal.planned} sesiones completadas.`}
              </Text>
              {goal.taskCount > 0 && (
                <Text style={styles.cardText}>
                  {goal.adherence === null
                    ? 'Todavía no hay días anteriores con los que medir tu ritmo.'
                    : `Has cumplido el ${percent(goal.adherence)} % de lo programado hasta ayer.`}
                </Text>
              )}
            </View>

            <Text style={styles.section}>Tareas del objetivo</Text>
            {linked.length === 0 ? (
              <Text style={styles.muted}>Todavía no hay tareas vinculadas.</Text>
            ) : (
              <View style={styles.list}>
                {linked.map((t) => taskRow(t, 'Quitar', () => link(t.id, null), true))}
              </View>
            )}

            <Press
              onPress={() => router.push(`/new?goalId=${goalId}`)}
              style={styles.newTask}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.newTaskText}>Nueva tarea para este objetivo</Text>
            </Press>

            {unlinked.length > 0 && (
              <>
                <Text style={styles.section}>Vincular una tarea existente</Text>
                <View style={styles.list}>
                  {unlinked.map((t) => taskRow(t, 'Vincular', () => link(t.id, goalId), false))}
                </View>
              </>
            )}

            <Press onPress={confirmDelete} style={styles.delete}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={styles.deleteText}>Eliminar objetivo</Text>
            </Press>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 48 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loader: { marginTop: 40 },

    heading: { fontSize: 30, fontWeight: '700', letterSpacing: -0.7, color: c.ink, marginTop: 18 },
    deadline: { fontSize: 15, fontWeight: '600', color: c.accent, marginTop: 6 },
    description: { fontSize: 15, lineHeight: 22, color: c.muted, marginTop: 10 },

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
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      padding: 18,
      gap: 12,
      marginTop: 22,
    },
    cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    cardLabel: { fontSize: 13, fontWeight: '600', color: c.muted },
    big: { fontSize: 38, fontWeight: '700', color: c.ink, fontVariant: ['tabular-nums'], marginTop: 2 },
    cardText: { fontSize: 14, lineHeight: 20, color: c.muted },
    pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
    pillText: { fontSize: 13, fontWeight: '700' },

    section: { fontSize: 18, fontWeight: '700', color: c.ink, marginTop: 30, marginBottom: 12 },
    muted: { fontSize: 15, lineHeight: 22, color: c.muted },
    list: { gap: 10 },

    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    taskIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: 15, fontWeight: '600', color: c.ink },
    taskMeta: { fontSize: 12, color: c.muted, marginTop: 2 },
    taskAction: { fontSize: 14, fontWeight: '700', color: c.accent },

    newTask: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
      paddingVertical: 12,
    },
    newTaskText: { fontSize: 15, fontWeight: '700', color: c.accent },

    delete: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 28,
      paddingVertical: 12,
    },
    deleteText: { fontSize: 15, fontWeight: '600', color: c.danger },
  });