const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';
const TIMEOUT_MS = 8000;

export type OccurrenceStatus = 'PENDING' | 'DONE' | 'MISSED' | 'SKIPPED';

export type Occurrence = {
  id: number;
  taskId: number;
  taskTitle: string;
  unit: string;
  date: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  status: OccurrenceStatus;
  recurrenceRule: string | null;
  reminderTime: string | null; // "20:30" o "20:30:00"
};

export type Task = {
  id: number;
  goalId: number | null;
  title: string;
  unit: string;
  targetValue: number;
  recurrenceRule: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  reminderTime: string | null;
};

export type NewTask = {
  title: string;
  unit: string;
  targetValue: number;
  goalId?: number;
  recurrenceRule?: string;
  startDate?: string;
  endDate?: string;
  reminderTime?: string;
};

export type HistoryEntry = {
  id: number;
  date: string; // día de la tarea al que pertenece el registro
  amount: number;
  note: string | null;
  createdAt: string; // instante en el que se registró
};

export type DayStats = {
  date: string;
  total: number;
  done: number;
  progress: number;
};

export type Stats = {
  currentStreak: number;
  bestStreak: number;
  weekDone: number;
  weekTotal: number;
  totalCompleted: number;
  from: string;
  days: DayStats[];
};

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
    if (!BASE_URL) {
      throw new ApiError('Falta EXPO_PUBLIC_API_URL en el archivo .env de la app.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...options.headers,
      },
    });

    if (res.status === 401) {
      throw new ApiError('La clave de la API no coincide con la del backend.', 401);
    }
    if (!res.ok) {
      throw new ApiError(`El servidor respondió con el error ${res.status}.`, res.status);
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      `No se puede conectar con ${BASE_URL}. Comprueba que el backend está en marcha y que el móvil usa la misma wifi.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export function getOccurrences(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return request<Occurrence[]>(`/api/occurrences${query ? `?${query}` : ''}`);
}

export function addProgress(occurrenceId: number, amount: number, note?: string) {
  return request<Occurrence>(`/api/occurrences/${occurrenceId}/progress`, {
    method: 'POST',
    body: JSON.stringify({ amount, note }),
  });
}

// omite ese día de una tarea recurrente
export function skipOccurrence(id: number) {
  return request<void>(`/api/occurrences/${id}`, { method: 'DELETE' });
}

export function getTasks() {
  return request<Task[]>('/api/tasks');
}

export function createTask(task: NewTask) {
  return request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

// all: borra la tarea con su historial; future: la elimina desde hoy y conserva el pasado
export function deleteTask(id: number, scope: 'all' | 'future' = 'all') {
  return request<void>(`/api/tasks/${id}?scope=${scope}`, { method: 'DELETE' });
}

export function getHistory(taskId: number, limit = 50) {
  return request<HistoryEntry[]>(`/api/tasks/${taskId}/history?limit=${limit}`);
}

// time = "20:30"; null quita el recordatorio
export function setReminder(taskId: number, time: string | null) {
  return request<Task>(`/api/tasks/${taskId}/reminder`, {
    method: 'PUT',
    body: JSON.stringify({ time }),
  });
}

export function getStats(weeks = 13) {
  return request<Stats>(`/api/stats?weeks=${weeks}`);
}
export type GoalPace = 'ON_TRACK' | 'IRREGULAR' | 'BEHIND' | null;

export type GoalSummary = {
  id: number;
  title: string;
  description: string | null;
  targetDate: string | null;
  taskCount: number;
  planned: number; // sesiones previstas hasta la fecha límite
  completed: number;
  progress: number; // 0 a 1
  adherence: number | null; // 0 a 1; null si aún no hay días anteriores
  daysLeft: number | null; // negativo si ya venció
  pace: GoalPace;
};

export type GoalInput = {
  title: string;
  description?: string;
  targetDate?: string;
};

export function getGoals() {
  return request<GoalSummary[]>('/api/goals');
}

export function getGoal(id: number) {
  return request<GoalSummary>(`/api/goals/${id}`);
}

export function createGoal(goal: GoalInput) {
  return request<unknown>('/api/goals', { method: 'POST', body: JSON.stringify(goal) });
}

export function updateGoal(id: number, goal: GoalInput) {
  return request<unknown>(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify(goal) });
}

// las tareas del objetivo no se borran: quedan sin objetivo
export function deleteGoal(id: number) {
  return request<void>(`/api/goals/${id}`, { method: 'DELETE' });
}

// goalId = null desvincula la tarea
export function setTaskGoal(taskId: number, goalId: number | null) {
  return request<Task>(`/api/tasks/${taskId}/goal`, {
    method: 'PUT',
    body: JSON.stringify({ goalId }),
  });
}

export type MentorChatResponse = {
  reply: string;
};

export function chatWithMentor(message: string) {
  return request<MentorChatResponse>(
    '/api/ai/chat',
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    },
    60000,
  );
}