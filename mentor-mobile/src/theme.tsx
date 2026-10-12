import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = {
  label: string;
  dark: boolean;
  paper: string; // fondo
  surface: string; // tarjetas y hojas
  ink: string; // texto principal
  muted: string; // texto secundario
  hairline: string; // líneas y pistas
  accent: string;
  accent2: string; // extremo claro del degradado
  onAccent: string; // texto sobre el acento
  done: string;
  danger: string;
};

// para añadir un estilo nuevo, copia una entrada y cambia los colores
export const palettes = {
  marino: {
    label: 'Marino',
    dark: false,
    paper: '#F2F5F9',
    surface: '#FFFFFF',
    ink: '#16202C',
    muted: '#677384',
    hairline: '#DCE2EA',
    accent: '#27415F',
    accent2: '#5B86B3',
    onAccent: '#FFFFFF',
    done: '#2E7D5B',
    danger: '#B3402F',
  },
  bosque: {
    label: 'Bosque',
    dark: false,
    paper: '#F3F6F3',
    surface: '#FFFFFF',
    ink: '#1A2420',
    muted: '#66736C',
    hairline: '#DAE1DB',
    accent: '#2F6B55',
    accent2: '#6FAF93',
    onAccent: '#FFFFFF',
    done: '#1F5E45',
    danger: '#B3402F',
  },
  granate: {
    label: 'Granate',
    dark: false,
    paper: '#F8F4F5',
    surface: '#FFFFFF',
    ink: '#231A1D',
    muted: '#76696D',
    hairline: '#E6DCDF',
    accent: '#8A3347',
    accent2: '#C8627A',
    onAccent: '#FFFFFF',
    done: '#2E7D5B',
    danger: '#B3402F',
  },
  petroleo: {
    label: 'Petróleo',
    dark: false,
    paper: '#F2F6F7',
    surface: '#FFFFFF',
    ink: '#15222A',
    muted: '#64747C',
    hairline: '#D8E1E4',
    accent: '#1F6272',
    accent2: '#4FA3B6',
    onAccent: '#FFFFFF',
    done: '#3C8A4F',
    danger: '#B3402F',
  },
  grafito: {
    label: 'Grafito (oscuro)',
    dark: true,
    paper: '#12151A',
    surface: '#1B2027',
    ink: '#E6E8EB',
    muted: '#8A929B',
    hairline: '#2A3039',
    accent: '#8FB3D1',
    accent2: '#B9D2E8',
    onAccent: '#0E1A24',
    done: '#74B596',
    danger: '#E5736A',
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof palettes;

type ThemeContextValue = {
  colors: Theme;
  name: ThemeName;
  setName: (name: ThemeName) => void;
};

const STORAGE_KEY = 'mentor.theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState<ThemeName>('marino');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && saved in palettes) setNameState(saved as ThemeName);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setName = useCallback((next: ThemeName) => {
    setNameState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => ({ colors: palettes[name], name, setName }), [name, setName]);

  // no pintamos nada hasta leer el estilo guardado, para evitar un parpadeo
  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}