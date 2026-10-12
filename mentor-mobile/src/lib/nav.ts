import { router } from 'expo-router';

// vuelve atrás; si no hay pantalla anterior (por ejemplo tras recargar), va al inicio
export function goBack() {
  if (router.canGoBack()) {
    goBack;
  } else {
    router.replace('/');
  }
}