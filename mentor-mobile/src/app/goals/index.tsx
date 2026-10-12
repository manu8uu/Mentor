import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import GoalCard from '../../components/GoalCard';
import Press from '../../components/Press';
import Screen from '../../components/Screen';
import { useGoals } from '../../lib/useGoals';
import { Theme, useTheme } from '../../theme';

export default function Objetivos() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { goals, loading, refreshing, error, refresh } = useGoals();

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

        <Text style={styles.heading}>Objetivos</Text>
        <Text style={styles.lead}>Lo que quieres conseguir y cómo vas.</Text>

        {loading && goals.length === 0 && !error && (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        )}

        {error && (
          <View style={styles.error}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && goals.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flag-outline" size={30} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Sin objetivos todavía</Text>
            <Text style={styles.emptyText}>
              Crea un objetivo, como «Aprobar el B2», y agrupa debajo las tareas que te acercan a él.
            </Text>
            <Press onPress={() => router.push('/goals/form')} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Crear objetivo</Text>
            </Press>
          </View>
        )}

        <View style={styles.list}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onPress={() => router.push(`/goals/${goal.id}`)} />
          ))}
        </View>
      </ScrollView>

      <Press
        onPress={() => router.push('/goals/form')}
        containerStyle={styles.fabSlot}
        style={styles.fab}
        accessibilityLabel="Nuevo objetivo"
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
    </Screen>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 120 },
    topBar: { paddingTop: 12 },
    heading: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8, color: c.ink, marginTop: 18 },
    lead: { fontSize: 16, color: c.muted, marginTop: 4, marginBottom: 22 },
    loader: { marginTop: 40 },
    list: { gap: 14 },

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

    empty: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 12 },
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