import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api, clearAuthToken, setAuthToken, getAuthToken } from '@/services/api';
import { cancelAllScheduledNotifications, getExpoPushToken, registerPushToken, unregisterPushToken } from '@/services/notifications';
import { Platform } from 'react-native';

export type AuthUser = {
  id: string;
  nome: string;
  login: string;
  createdAt?: string;
  updatedAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  authenticate: (token: string, usuario?: AuthUser | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const TOKEN_STORAGE_KEY = '@medping/token';

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  authenticate: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const { data } = await api.get<{ usuario: AuthUser }>('/auth/me');
    setUser(data.usuario);
  }, []);

  const authenticate = useCallback(
    async (newToken: string, usuario?: AuthUser | null) => {
      await setAuthToken(newToken);
      setToken(newToken);

      if (usuario) {
        setUser(usuario);
      } else {
        try {
          await fetchCurrentUser();
        } catch (error) {
          await clearAuthToken();
          await cancelAllScheduledNotifications();
          setToken(null);
          setUser(null);
          throw error;
        }
      }

      // Registra token de push após autenticação
      try {
        const pushToken = await getExpoPushToken();
        if (pushToken) {
          await registerPushToken(pushToken, Platform.OS);
        }
      } catch (error) {
        console.warn('Erro ao registrar token de push:', error);
      }
    },
    [fetchCurrentUser],
  );

  const logout = useCallback(async () => {
    try {
      await unregisterPushToken();
    } catch (error) {
      console.warn('Erro ao remover token de push:', error);
    }
    await clearAuthToken();
    await cancelAllScheduledNotifications();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const storedToken = await getAuthToken();

        if (storedToken) {
          await setAuthToken(storedToken);
          setToken(storedToken);
          try {
            await fetchCurrentUser();
            // Registra token de push se o usuário estiver autenticado
            const pushToken = await getExpoPushToken();
            if (pushToken) {
              await registerPushToken(pushToken, Platform.OS);
            }
          } catch (error) {
            await clearAuthToken();
            await cancelAllScheduledNotifications();
            setToken(null);
            setUser(null);
          }
        } else {
          await clearAuthToken();
          setToken(null);
          setUser(null);
          await cancelAllScheduledNotifications();
        }
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [fetchCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      authenticate,
      logout,
      refreshUser,
    }),
    [user, token, loading, authenticate, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

