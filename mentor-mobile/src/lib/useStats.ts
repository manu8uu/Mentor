import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Stats, getStats } from './api';

// carga las estadísticas al entrar en la pantalla y cada vez que cambia refreshKey
export function useStats(weeks = 13, refreshKey = 0) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await getStats(weeks));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido.');
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useFocusEffect(
    useCallback(() => {
      void refreshKey;
      load();
    }, [load, refreshKey]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { stats, error, loading, refreshing, refresh };
}