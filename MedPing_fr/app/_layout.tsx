import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { requestNotificationPermissions } from '@/services/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGuardedStack() {
  const { loading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const isInAuthGroup = segments[0] === '(auth)';
  const hasSegments = segments.length > 0;

  useEffect(() => {
    if (loading || !hasSegments) {
      return;
    }

    if (!user && !isInAuthGroup) {
      router.replace('/(auth)/Login');
    } else if (user && isInAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [loading, hasSegments, user, isInAuthGroup, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    requestNotificationPermissions().catch((error) =>
      console.warn('Erro ao solicitar permissões de notificação:', error),
    );
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuardedStack />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});
