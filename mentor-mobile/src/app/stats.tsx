import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { goBack } from '../lib/nav';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Press from '../components/Press';
import Screen from '../components/Screen';
import { DayStats } from '../lib/api';
import { MONTHS_SHORT, longDate, parseIso, toIso } from '../lib/dates';
import { useStats } from '../lib/useStats';
import { Theme, useTheme } from '../theme';
import BackButton from '../components/BackButton';


const WEEKS = 13;
const GAP = 4;
const LABEL_W = 16;
const ROW_LABELS = ['L', '', 'X', '', 'V', '', ''];

function cellColor(day: DayStats | undefined, c: Theme) {
  if (!day || day.total === 0) return 'transparent';
  if (day.done === day.total) return c.accent;
  if (day.progress >= 0.5) return c.accent + 'B3';
  if (day.progress > 0) return c.accent + '66';
  return c.hairline;
}

function Stat({
  icon, value, unit, label, styles, color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  unit?: string;
  label: string;
  styles: ReturnType<typeof makeStyles>;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function Estadisticas() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const { stats, error, loading, refreshing, refresh } = useStats(WEEKS);
  const [selected, setSelected] = useState<string | null>(null);

  const todayIso = toIso(new Date());
  const size = Math.max(10, Math.floor((width - 40 - 36 - LABEL_W - GAP * WEEKS) / WEEKS));

  const byDate = useMemo(
    () => new Map((stats?.days ?? []).map((d): [string, DayStats] => [d.date, d])),
    [stats],
  );

  // una columna por semana, de lunes a domingo
  const columns = useMemo(() => {
    if (!stats) return [] as string[][];
    const start = parseIso(stats.from);
    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, r) =>
        toIso(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + r)),
      ),
    );
  }, [stats]);

  const detail = selected ? byDate.get(selected) : undefined;
  const streak = stats?.currentStreak ?? 0;
  const best = stats?.bestStreak ?? 0;
  const week = stats ? `${stats.weekDone}/${stats.weekTotal}` : '–';

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.muted}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.topBar}>
          <BackButton />
        </View>

        <Text style={styles.heading}>Estadísticas</Text>
        <Text style={styles.lead}>Tu constancia de los últimos tres meses.</Text>

        {loading && !stats && <ActivityIndicator color={colors.accent} style={styles.loader} />}

        {error && (
          <View style={styles.error}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {stats && (
          <>
            <View style={styles.stats}>
              <Stat
                icon="flame"
                value={String(streak)}
                unit={streak === 1 ? 'día' : 'días'}
                label="Racha actual"
                color={streak > 0 ? colors.accent : colors.muted}
                styles={styles}
              />
              <Stat
                icon="trophy-outline"
                value={String(best)}
                unit={best === 1 ? 'día' : 'días'}
                label="Mejor racha"
                color={colors.accent}
                styles={styles}
              />
              <Stat
                icon="calendar-outline"
                value={week}
                label="Esta semana"
                color={colors.accent}
                styles={styles}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Actividad</Text>

              <View style={[styles.months, { marginLeft: LABEL_W + GAP }]}>
                {columns.map((col, w) => {
                  const month = parseIso(col[0]).getMonth();
                  const prev = w > 0 ? parseIso(columns[w - 1][0]).getMonth() : -1;
                  return month !== prev ? (
                    <Text key={w} style={[styles.month, { left: w * (size + GAP) }]}>
                      {MONTHS_SHORT[month]}
                    </Text>
                  ) : null;
                })}
              </View>

              <View style={styles.grid}>
                <View style={{ width: LABEL_W, gap: GAP }}>
                  {ROW_LABELS.map((label, r) => (
                    <View key={r} style={{ height: size, justifyContent: 'center' }}>
                      <Text style={styles.rowLabel}>{label}</Text>
                    </View>
                  ))}
                </View>

                {columns.map((col, w) => (
                  <View key={w} style={{ gap: GAP }}>
                    {col.map((iso) => {
                      const future = iso > todayIso;
                      const marked = iso === todayIso || iso === selected;
                      return (
                        <Pressable
                          key={iso}
                          disabled={future}
                          onPress={() => setSelected(iso)}
                          accessibilityLabel={longDate(iso)}
                          style={{
                            width: size,
                            height: size,
                            borderRadius: 4,
                            backgroundColor: future ? 'transparent' : cellColor(byDate.get(iso), colors),
                            borderWidth: future ? 0 : marked ? 1.5 : StyleSheet.hairlineWidth,
                            borderColor: marked ? colors.ink : colors.hairline,
                          }}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>

              <View style={styles.legend}>
                <Text style={styles.legendText}>Menos</Text>
                {[colors.hairline, colors.accent + '66', colors.accent + 'B3', colors.accent].map((bg) => (
                  <View key={bg} style={[styles.legendCell, { backgroundColor: bg }]} />
                ))}
                <Text style={styles.legendText}>Más</Text>
              </View>

              <Text style={styles.detail}>
                {selected
                  ? detail && detail.total > 0
                    ? `${longDate(selected)}: ${detail.done} de ${detail.total} ${
                        detail.total === 1 ? 'tarea completada' : 'tareas completadas'
                      }`
                    : `${longDate(selected)}: sin tareas programadas`
                  : 'Toca un día para ver el detalle.'}
              </Text>
            </View>

            <Text style={styles.total}>
              {stats.totalCompleted}{' '}
              {stats.totalCompleted === 1 ? 'tarea completada' : 'tareas completadas'} en total
            </Text>
            <Text style={styles.note}>
              Un día cuenta cuando completas todas sus tareas. Los días sin tareas programadas no
              rompen la racha, y hoy no la rompe mientras siga pendiente.
            </Text>
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
    heading: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8, color: c.ink, marginTop: 18 },
    lead: { fontSize: 16, color: c.muted, marginTop: 4, marginBottom: 22 },
    loader: { marginTop: 40 },

    error: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.danger + '55',
      padding: 16,
    },
    errorText: { flex: 1, fontSize: 14, lineHeight: 20, color: c.ink },

    stats: { flexDirection: 'row', gap: 10 },
    stat: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      padding: 14,
      gap: 6,
    },
    statValue: { fontSize: 26, fontWeight: '700', color: c.ink, fontVariant: ['tabular-nums'] },
    statUnit: { fontSize: 13, fontWeight: '500', color: c.muted },
    statLabel: { fontSize: 13, color: c.muted },

    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      padding: 18,
      marginTop: 14,
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: c.ink, marginBottom: 14 },

    months: { height: 16 },
    month: { position: 'absolute', top: 0, fontSize: 11, color: c.muted },
    grid: { flexDirection: 'row', gap: GAP, marginTop: 4 },
    rowLabel: { fontSize: 10, color: c.muted },

    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 5,
      marginTop: 14,
    },
    legendText: { fontSize: 11, color: c.muted },
    legendCell: { width: 12, height: 12, borderRadius: 3 },

    detail: { fontSize: 14, color: c.ink, marginTop: 14, minHeight: 20 },

    total: { fontSize: 15, fontWeight: '600', color: c.ink, marginTop: 22 },
    note: { fontSize: 13, lineHeight: 19, color: c.muted, marginTop: 6 },
  });