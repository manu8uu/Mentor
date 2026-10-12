import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { GoalSummary, getGoals } from './api';

// carga los objetivos al entrar en la pantalla, también al volver desde otra
export function useGoals() {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setGoals(await getGoals());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se han podido cargar los objetivos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { goals, loading, refreshing, error, refresh };
}