import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Press from '../components/Press';
import ProgressRing from '../components/ProgressRing';
import Screen from '../components/Screen';
import TaskCard from '../components/TaskCard';
import TaskSheet from '../components/TaskSheet';
import { useStats } from '../lib/useStats';
import { useTasks } from '../store';
import { Theme, useTheme } from '../theme';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function greeting(hour: number) {
  if (hour >= 6 && hour < 13) return 'Buenos días';
  if (hour >= 13 && hour < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Hoy() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { items, loading, error, reload, add, subtract, complete, remove } = useTasks();
  const [openId, setOpenId] = useState<number | null>(null);

  const open = items.find((i) => i.id === openId) ?? null;
  const today = new Date();
  const pending = items.filter((i) => i.current < i.target);
  const completed = items.filter((i) => i.current >= i.target);
  const ratio = items.length ? completed.length / items.length : 0;

  // la racha se vuelve a pedir cuando cambia el número de tareas completadas
  const { stats } = useStats(13, completed.length + items.length * 1000);
  const streak = stats?.currentStreak ?? 0;

  const subtitle =
    items.length === 0
      ? null
      : pending.length === 0
        ? 'Todo completado por hoy'
        : `${pending.length} ${pending.length === 1 ? 'pendiente' : 'pendientes'}`;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={reload}
            tintColor={colors.muted}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.topBar}>
          <Press
            onPress={() => router.push('/stats')}
            hitSlop={8}
            accessibilityLabel={`Racha de ${streak} días. Abrir estadísticas`}
            style={styles.streakChip}
          >
            <Ionicons name="flame" size={18} color={streak > 0 ? colors.accent : colors.muted} />
            <Text style={[styles.streakText, streak === 0 && { color: colors.muted }]}>
              {streak}
            </Text>
          </Press>

          <View style={styles.topActions}>
            <Press
              onPress={() => router.push('/goals')}
              hitSlop={8}
              accessibilityLabel="Objetivos"
              style={styles.iconButton}
            >
              <Ionicons name="flag-outline" size={20} color={colors.ink} />
            </Press>
            <Press
              onPress={() => router.push('/calendar')}
              hitSlop={8}
              accessibilityLabel="Calendario"
              style={styles.iconButton}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.ink} />
            </Press>
            
<Press
  onPress={() => router.push('/chat')}
  hitSlop={8}
  accessibilityLabel="Abrir asistente de IA"
  style={styles.iconButton}
>
  <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.ink} />
</Press>

            <Press
              onPress={() => router.push('/settings')}
              hitSlop={8}
              accessibilityLabel="Ajustes"
              style={styles.iconButton}
            >
              <Ionicons name="settings-outline" size={20} color={colors.ink} />
            </Press>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTexts}>
            <Text style={styles.greeting}>{greeting(today.getHours())}</Text>
            <Text style={styles.weekday}>{DAYS[today.getDay()]}</Text>
            <Text style={styles.date}>
              {today.getDate()} de {MONTHS[today.getMonth()]}
            </Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {items.length > 0 && (
            <ProgressRing value={ratio} label={`${completed.length}/${items.length}`} />
          )}
        </View>

        {error && (
          <View style={styles.error}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
            <View style={styles.errorTexts}>
              <Text style={styles.errorText}>{error}</Text>
              <Press onPress={reload} hitSlop={8} style={styles.retry}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Press>
            </View>
          </View>
        )}

        {loading && items.length === 0 && !error && (
          <Text style={styles.muted}>Cargando tareas…</Text>
        )}

        {!loading && !error && items.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles-outline" size={30} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Sin tareas para hoy</Text>
            <Text style={styles.emptyText}>
              Crea tu primera tarea y empieza a medir tu progreso.
            </Text>
            <Press onPress={() => router.push('/new')} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Crear tarea</Text>
            </Press>
          </View>
        )}

        {pending.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pendientes</Text>
              <View style={styles.count}>
                <Text style={styles.countText}>{pending.length}</Text>
              </View>
            </View>
            <View style={styles.list}>
              {pending.map((i, n) => (
                <TaskCard
                  key={i.id}
                  title={i.title}
                  unit={i.unit}
                  current={i.current}
                  target={i.target}
                  repeat={i.repeat}
                  reminder={i.reminder}
                  index={n}
                  onOpen={() => setOpenId(i.id)}
                  onComplete={() => complete(i.id)}
                />
              ))}
            </View>
          </>
        )}

        {completed.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completadas</Text>
              <View style={styles.count}>
                <Text style={styles.countText}>{completed.length}</Text>
              </View>
            </View>
            <View style={styles.list}>
              {completed.map((i, n) => (
                <TaskCard
                  key={i.id}
                  title={i.title}
                  unit={i.unit}
                  current={i.current}
                  target={i.target}
                  repeat={i.repeat}
                  reminder={i.reminder}
                  index={pending.length + n}
                  onOpen={() => setOpenId(i.id)}
                  onComplete={() => complete(i.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Press
        onPress={() => router.push('/new')}
        containerStyle={styles.fabSlot}
        style={styles.fab}
        accessibilityLabel="Nueva tarea"
        scale={0.92}
      >
        <LinearGradient
          colors={[colors.accent, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="add" size={30} color={colors.onAccent} />
      </Press>

      <TaskSheet
        item={open}
        onClose={() => setOpenId(null)}
        onAdd={(amount, note) => open && add(open.id, amount, note)}
        onSubtract={(amount, note) => open && subtract(open.id, amount, note)}
        onComplete={() => open && complete(open.id)}
        onDelete={(scope) => open && remove(open.id, scope)}
      />
    </Screen>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 120 },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
    },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
    streakChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 42,
      paddingHorizontal: 14,
      borderRadius: 21,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    streakText: { fontSize: 16, fontWeight: '700', color: c.accent, fontVariant: ['tabular-nums'] },

    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 18,
      paddingBottom: 26,
    },
    heroTexts: { flex: 1, paddingRight: 16 },
    greeting: { fontSize: 15, fontWeight: '500', color: c.muted, marginBottom: 2 },
    weekday: { fontSize: 36, fontWeight: '700', letterSpacing: -0.8, color: c.ink },
    date: { fontSize: 17, color: c.muted, marginTop: 2 },
    subtitle: { fontSize: 14, fontWeight: '600', color: c.accent, marginTop: 12 },

    section: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: c.ink },
    count: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 8,
      backgroundColor: c.accent + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: { fontSize: 13, fontWeight: '700', color: c.accent, fontVariant: ['tabular-nums'] },
    list: { gap: 14, marginBottom: 22 },

    muted: { fontSize: 16, color: c.muted },

    error: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.danger + '55',
      padding: 16,
      marginBottom: 20,
    },
    errorTexts: { flex: 1, gap: 8 },
    errorText: { fontSize: 14, lineHeight: 20, color: c.ink },
    retry: { alignSelf: 'flex-start' },
    retryText: { fontSize: 14, fontWeight: '700', color: c.accent },

    empty: { alignItems: 'center', paddingTop: 36, paddingHorizontal: 20 },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.accent + '22',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: c.ink },
    emptyText: { fontSize: 15, lineHeight: 22, color: c.muted, textAlign: 'center', marginTop: 6 },
    emptyButton: {
      marginTop: 22,
      paddingVertical: 13,
      paddingHorizontal: 26,
      borderRadius: 14,
      backgroundColor: c.accent,
    },
    emptyButtonText: { fontSize: 16, fontWeight: '700', color: c.onAccent },

    fabSlot: { position: 'absolute', right: 20, bottom: 24 },
    fab: {
      width: 60,
      height: 60,
      borderRadius: 30,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.accent,
      shadowOpacity: 0.4,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  });