import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { configureNotifications } from '../lib/reminders';
import { TasksProvider } from '../store';
import { ThemeProvider, useTheme } from '../theme';

configureNotifications();

function Shell() {
  const { colors } = useTheme();
  return (
    <>
      <StatusBar style={colors.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="new" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <TasksProvider>
        <Shell />
      </TasksProvider>
    </ThemeProvider>
  );
}