import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '@/components/layout/app-header';
import { Sidebar } from '@/components/layout/sidebar';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { user, logout } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleOpenSidebar = () => setSidebarVisible(true);
  const handleCloseSidebar = () => setSidebarVisible(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarButton: HapticTab,
          header: () => <AppHeader onMenuPress={handleOpenSidebar} user={user} />,
          tabBarStyle: {
            backgroundColor: '#0d4a7b',
            borderTopColor: 'transparent',
            paddingBottom: 6,
            paddingTop: 6,
            height: 64,
          },
          tabBarActiveTintColor: '#38bdf8',
          tabBarInactiveTintColor: '#cbd5f5',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Histórico',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notificacoes"
          options={{
            title: 'Notificações',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="privacidade"
          options={{
            href: null, // Oculta da navegação inferior
          }}
        />
        <Tabs.Screen
          name="preferencias"
          options={{
            href: null, // Oculta da navegação inferior
          }}
        />
      </Tabs>

      <Sidebar
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
        onLogout={logout}
        user={user}
      />
    </>
  );
}
