import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BackButton from '../components/BackButton';
import Press from '../components/Press';
import ProgressBar from '../components/ProgressBar';
import Screen from '../components/Screen';
import TaskSheet from '../components/TaskSheet';
import {
  Occurrence, Stats, addProgress, deleteTask, getOccurrences, getStats, skipOccurrence,
} from '../lib/api';
import { MONTHS, longDate, toIso } from '../lib/dates';
import { fmt } from '../lib/format';
import { iconFor } from '../lib/icons';
import { describeRule } from '../lib/recurrence';
import type { Item } from '../store';
import { useTasks } from '../store';
import { Theme, useTheme } from '../theme';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const mondayOffset = (date: Date) => (date.getDay() + 6) % 7;
const round2 = (n: number) => Math.round(n * 100) / 100;

const isDone = (o: Occurrence) => o.status === 'DONE' || o.currentValue >= o.targetValue;

// color del aro de cada día, siempre con la paleta del tema
function dayTone(done: number, total: number, isToday: boolean, c: Theme) {
  if (done >= total) return c.done;
  if (done > 0) return c.accent;
  // hoy todavía puede completarse, así que no se marca como fallado
  return isToday ? c.accent + '55' : c.danger + '99';
}

const toItem = (o: Occurrence): Item => ({
  id: o.id,
  taskId: o.taskId,
  title: o.taskTitle,
  unit: o.unit,
  current: o.currentValue,
  target: o.targetValue,
  repeat: describeRule(o.recurrenceRule),
  reminder: o.reminderTime ? o.reminderTime.slice(0, 5) : null,
});

const plural = (n: number) => (n === 1 ? 'tarea completada' : 'tareas completadas');

export default function Calendario() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { reload: reloadToday } = useTasks();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toIso(new Date()));
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const todayIso = toIso(new Date());
  const monthStart = toIso(startOfMonth(month));
  const monthEnd = toIso(endOfMonth(month));

  // initial: con indicador de carga; pull: al tirar hacia abajo; silent: tras guardar un cambio
  const load = useCallback(
    async (mode: 'initial' | 'pull' | 'silent' = 'initial') => {
      if (mode === 'pull') setRefreshing(true);
      else if (mode === 'initial') setLoading(true);
      setError(null);
      try {
        const [list, historical] = await Promise.all([
          getOccurrences(monthStart, monthEnd),
          getStats(52),
        ]);
        setOccurrences(list);
        setStats(historical);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se han podido cargar los datos.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [monthStart, monthEnd],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // guarda un cambio, recarga el calendario y avisa a la pantalla de Hoy
  const mutate = async (action: () => Promise<unknown>) => {
    try {
      await action();
      await load('silent');
      void reloadToday();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido guardar el cambio.');
    }
  };

  const statsByDate = useMemo(
    () => new Map((stats?.days ?? []).map((day) => [day.date, day])),
    [stats],
  );

  const occurrencesByDate = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of occurrences) {
      const list = map.get(o.date) ?? [];
      list.push(o);
      map.set(o.date, list);
    }
    return map;
  }, [occurrences]);

  const calendarDays = useMemo(() => {
    const first = startOfMonth(month);
    const count = endOfMonth(month).getDate();
    const cells: Array<string | null> = Array(mondayOffset(first)).fill(null);
    for (let day = 1; day <= count; day++) {
      cells.push(toIso(new Date(month.getFullYear(), month.getMonth(), day)));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const selectedOccurrences = occurrencesByDate.get(selectedDate) ?? [];
  const selectedStats = statsByDate.get(selectedDate);
  const dayTotal = selectedOccurrences.length || selectedStats?.total || 0;
  const dayDone = selectedOccurrences.length
    ? selectedOccurrences.filter(isDone).length
    : (selectedStats?.done ?? 0);
  const selectedPercent = dayTotal ? Math.round((dayDone / dayTotal) * 100) : 0;
  const canEdit = selectedDate <= todayIso;

  const changeMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    // mantenemos el número de día, ajustado al último día del mes si hace falta
    const day = Math.min(Number(selectedDate.slice(-2)), endOfMonth(next).getDate());
    setSelectedDate(toIso(new Date(next.getFullYear(), next.getMonth(), day)));
  };

  const goToToday = () => {
    setMonth(startOfMonth(new Date()));
    setSelectedDate(todayIso);
  };

  // acciones de la hoja inferior
  const open = occurrences.find((o) => o.id === openId) ?? null;

  const onAdd = (amount: number, note?: string) => {
    if (open) void mutate(() => addProgress(open.id, round2(amount), note));
  };

  const onSubtract = (amount: number, note?: string) => {
    if (!open) return;
    const quantity = round2(Math.min(amount, open.currentValue));
    if (quantity > 0) void mutate(() => addProgress(open.id, -quantity, note));
  };

  const onComplete = () => {
    if (!open) return;
    const missing = round2(open.targetValue - open.currentValue);
    if (missing > 0) void mutate(() => addProgress(open.id, missing));
  };

    const onDelete = (scope: 'day' | 'series') => {
    if (!open) return;
    void mutate(() =>
      scope === 'day'
        ? skipOccurrence(open.id)
        : deleteTask(open.taskId, open.recurrenceRule ? 'future' : 'all'),
    );
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('pull')}
            tintColor={colors.muted}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.topBar}>
          <BackButton />
        </View>

        <Text style={styles.heading}>Calendario</Text>
        <Text style={styles.lead}>Consulta tus tareas y revisa tu constancia día a día.</Text>

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Press
              onPress={() => changeMonth(-1)}
              style={styles.monthButton}
              accessibilityLabel="Mes anterior"
            >
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Press>
            <Text style={styles.monthTitle}>
              {MONTHS[month.getMonth()]} {month.getFullYear()}
            </Text>
            <Press
              onPress={() => changeMonth(1)}
              style={styles.monthButton}
              accessibilityLabel="Mes siguiente"
            >
              <Ionicons name="chevron-forward" size={20} color={colors.ink} />
            </Press>
          </View>

          <View style={styles.weekdays}>
            {WEEKDAYS.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((iso, index) => {
              if (!iso) return <View key={`empty-${index}`} style={styles.dayCell} />;

              const dayStats = statsByDate.get(iso);
              const dayList = occurrencesByDate.get(iso) ?? [];
              const total = dayStats?.total ?? dayList.length;
              const done = dayStats?.done ?? dayList.filter(isDone).length;
              const isSelected = iso === selectedDate;
              const isToday = iso === todayIso;
              const isFuture = iso > todayIso;

              let ring = 'transparent';
              if (total > 0) ring = isFuture ? colors.hairline : dayTone(done, total, isToday, colors);
              else if (isToday) ring = colors.hairline;

              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={`${longDate(iso)}${
                    total ? `, ${Math.round((done / total) * 100)} por ciento completado` : ', sin tareas'
                  }`}
                  onPress={() => setSelectedDate(iso)}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      { borderColor: ring },
                      isSelected && styles.selectedDayCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isSelected && styles.selectedDayNumber,
                        isFuture && styles.futureDayNumber,
                      ]}
                    >
                      {Number(iso.slice(-2))}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger + '99' }]} />
            <Text style={styles.legendText}>Sin completar</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendText}>Parcial</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.done }]} />
            <Text style={styles.legendText}>Completo</Text>
          </View>
        </View>

        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderText}>
            <Text style={styles.sectionTitle}>{longDate(selectedDate)}</Text>
            <Text style={styles.muted}>
              {dayTotal
                ? `${dayDone} de ${dayTotal} ${plural(dayDone)}`
                : 'Sin tareas programadas'}
            </Text>
          </View>
          {dayTotal > 0 && (
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{selectedPercent} %</Text>
            </View>
          )}
        </View>

        {dayTotal > 0 && (
          <View style={styles.dayBar}>
            <ProgressBar progress={selectedPercent / 100} height={8} />
          </View>
        )}

        {loading && occurrences.length === 0 && (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        )}

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

        {selectedOccurrences.length > 0 ? (
          <>
            <Text style={styles.hint}>
              {canEdit
                ? 'Toca una tarea para registrar su progreso.'
                : 'Los días futuros todavía no se pueden registrar.'}
            </Text>
            <View style={styles.tasksList}>
              {selectedOccurrences.map((o) => {
                const done = isDone(o);
                const ratio = o.targetValue > 0 ? o.currentValue / o.targetValue : 0;
                const tone = done ? colors.done : colors.accent;
                return (
                  <Press
                    key={o.id}
                    onPress={() => setOpenId(o.id)}
                    disabled={!canEdit}
                    style={styles.taskCard}
                    accessibilityLabel={`${o.taskTitle}, ${fmt(o.currentValue)} de ${fmt(o.targetValue)} ${o.unit}`}
                  >
                    <View style={[styles.taskIcon, { backgroundColor: tone + '22' }]}>
                      <Ionicons name={done ? 'checkmark' : iconFor(o.taskTitle)} size={20} color={tone} />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {o.taskTitle}
                      </Text>
                      <Text style={styles.taskMeta}>
                        {fmt(o.currentValue)} de {fmt(o.targetValue)} {o.unit}
                      </Text>
                      <ProgressBar progress={ratio} height={6} />
                    </View>
                    <Text style={[styles.taskPercent, done && { color: colors.done }]}>
                      {Math.min(Math.round(ratio * 100), 100)} %
                    </Text>
                  </Press>
                );
              })}
            </View>
          </>
        ) : !loading && !error ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-clear-outline" size={28} color={colors.accent} />
            <Text style={styles.emptyTitle}>No hay tareas este día</Text>
            <Text style={styles.emptyText}>
              Selecciona otra fecha para consultar su planificación y progreso.
            </Text>
          </View>
        ) : null}

        <Press onPress={goToToday} style={styles.todayButton}>
          <Ionicons name="today-outline" size={18} color={colors.accent} />
          <Text style={styles.todayButtonText}>Volver a hoy</Text>
        </Press>
      </ScrollView>

      <TaskSheet
        item={open ? toItem(open) : null}
        onClose={() => setOpenId(null)}
        onAdd={onAdd}
        onSubtract={onSubtract}
        onComplete={onComplete}
        onDelete={onDelete}
      />
    </Screen>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 48 },
    topBar: { paddingTop: 12 },
    heading: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8, color: c.ink, marginTop: 18 },
    lead: { fontSize: 15, lineHeight: 21, color: c.muted, marginTop: 4, marginBottom: 20 },

    calendarCard: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      padding: 14,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    monthButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.paper,
    },
    monthTitle: { fontSize: 18, fontWeight: '700', color: c.ink, textTransform: 'capitalize' },
    weekdays: { flexDirection: 'row', marginBottom: 6 },
    weekday: {
      width: '14.2857%',
      textAlign: 'center',
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    selectedDayCircle: { backgroundColor: c.accent + '1C' },
    dayNumber: { fontSize: 14, color: c.ink, fontWeight: '500', textAlign: 'center' },
    selectedDayNumber: { color: c.accent, fontWeight: '800' },
    futureDayNumber: { color: c.muted },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 12,
    },
    legendDot: { width: 7, height: 7, borderRadius: 4 },
    legendText: { color: c.muted, fontSize: 10, marginRight: 5 },

    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 24,
      marginBottom: 12,
    },
    dayHeaderText: { flex: 1, paddingRight: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: c.ink },
    muted: { fontSize: 13, color: c.muted, marginTop: 4 },
    percentBadge: {
      minWidth: 58,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: c.accent + '22',
      alignItems: 'center',
    },
    percentText: { color: c.accent, fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
    dayBar: { marginBottom: 16 },

    loader: { marginTop: 30 },
    error: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.danger + '55',
      backgroundColor: c.surface,
      marginTop: 12,
    },
    errorContent: { flex: 1, gap: 8 },
    errorText: { fontSize: 14, lineHeight: 20, color: c.ink },
    retry: { alignSelf: 'flex-start' },
    retryText: { color: c.accent, fontWeight: '700' },

    hint: { fontSize: 13, color: c.muted, marginBottom: 12 },
    tasksList: { gap: 10 },
    taskCard: {
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
    taskInfo: { flex: 1, gap: 5 },
    taskTitle: { fontSize: 15, fontWeight: '600', color: c.ink },
    taskMeta: { fontSize: 12, color: c.muted, fontVariant: ['tabular-nums'] },
    taskPercent: {
      width: 44,
      textAlign: 'right',
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },

    empty: { alignItems: 'center', padding: 24, borderRadius: 18, backgroundColor: c.surface, gap: 8 },
    emptyTitle: { color: c.ink, fontSize: 16, fontWeight: '700', marginTop: 4 },
    emptyText: { color: c.muted, textAlign: 'center', fontSize: 13, lineHeight: 19 },

    todayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 22,
      paddingVertical: 12,
    },
    todayButtonText: { color: c.accent, fontWeight: '700', fontSize: 14 },
  });