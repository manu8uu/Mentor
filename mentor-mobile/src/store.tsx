import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as api from './lib/api';
import { mentorTaskCompleted } from './lib/mentorVoice';
import { describeRule } from './lib/recurrence';
import { syncReminders } from './lib/reminders';

export type Item = {
  id: number; 
  taskId: number;
  title: string;
  unit: string;
  current: number;
  target: number;
  repeat: string | null; 
  reminder: string | null; 
};


type Store = {
  items: Item[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  create: (data: NewItem) => Promise<string | null>; // null = guardada; si no, el motivo del fallo
  add: (id: number, amount: number, note?: string) => Promise<void>;
  subtract: (id: number, amount: number, note?: string) => Promise<void>;
  complete: (id: number) => Promise<void>;
  remove: (id: number, scope: 'day' | 'series') => Promise<void>;
};

type NewItem = {
  title: string;
  unit: string;
  target: number;
  recurrenceRule?: string;
  reminderTime?: string;
  goalId?: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const toItem = (o: api.Occurrence): Item => ({
  id: o.id,
  taskId: o.taskId,
  title: o.taskTitle,
  unit: o.unit,
  current: o.currentValue,
  target: o.targetValue,
  repeat: describeRule(o.recurrenceRule),
  reminder: o.reminderTime ? o.reminderTime.slice(0, 5) : null,
});

const StoreContext = createContext<Store | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ejecuta una operación y recoge el error en vez de romper la pantalla;
  // si sale bien, vuelve a calcular los recordatorios
  const guard = async (fn: () => Promise<void>): Promise<string | null> => {
    try {
      await fn();
      setError(null);
      void syncReminders();
      return null;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido.';
      setError(message);
      return message;
    }
  };

  const fetchItems = async () => {
    const list = await api.getOccurrences();
    setItems(list.map(toItem));
  };

  const replace = (o: api.Occurrence) =>
    setItems((prev) => prev.map((i) => (i.id === o.id ? toItem(o) : i)));

  const reload = async () => {
    setLoading(true);
    await guard(fetchItems);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  // al volver a la app (por ejemplo, al día siguiente) se refresca sin mostrar el indicador de carga
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void guard(fetchItems);
    });
    return () => subscription.remove();
  }, []);

  const store: Store = {
    items,
    loading,
    error,
    reload,

    create: (data) =>
      guard(async () => {
        await api.createTask({
          title: data.title,
          unit: data.unit,
          targetValue: round2(data.target),
          recurrenceRule: data.recurrenceRule,
          reminderTime: data.reminderTime,
          goalId: data.goalId,
        });
        await fetchItems();
      }),

    add: async (id, amount, note) => {
      await guard(async () => replace(await api.addProgress(id, round2(amount), note)));
    },

    // no se puede restar más de lo que hay
    subtract: async (id, amount, note) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const quantity = round2(Math.min(amount, item.current));
      if (quantity <= 0) return;
      await guard(async () => replace(await api.addProgress(id, -quantity, note)));
    },

 complete: async (id) => {
  const item = items.find((i) => i.id === id);
  if (!item) return;

  const missing = round2(item.target - item.current);
  if (missing <= 0) return;

  const error = await guard(async () => {
    const updated = await api.addProgress(id, missing);
    replace(updated);

    console.log('[Tasks] Tarea actualizada:', updated.taskTitle, updated.status);

      if (updated.status === 'DONE') {
        console.log('[Tasks] Lanzando intervención de Mentor...');
        void mentorTaskCompleted(item.title);
      }
  });
},

    remove: async (id, scope) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      await guard(async () => {
        if (scope === 'day') {
          await api.skipOccurrence(id);
        } else {
          await api.deleteTask(item.taskId, item.repeat ? 'future' : 'all');
        }
        setItems((prev) => prev.filter((i) => i.id !== id));
      });
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useTasks debe usarse dentro de TasksProvider');
  return ctx;
}