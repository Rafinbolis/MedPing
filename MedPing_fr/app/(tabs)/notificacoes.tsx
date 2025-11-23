import { useState, useCallback, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  requestNotificationPermissions,
  getAllScheduledNotifications,
  cancelAllScheduledNotifications,
} from '@/services/notifications';
import * as Notifications from 'expo-notifications';

export default function NotificacoesScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const checkPermissions = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
      
      const notifications = await getAllScheduledNotifications();
      setScheduledCount(notifications.length);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const handleToggleNotifications = async (value: boolean) => {
    setLoading(true);
    try {
      if (value) {
        const granted = await requestNotificationPermissions();
        if (granted) {
          setNotificationsEnabled(true);
          Alert.alert('Sucesso', 'Notificações ativadas!');
        } else {
          Alert.alert('Permissão negada', 'As notificações precisam ser habilitadas nas configurações do dispositivo.');
        }
      } else {
        await cancelAllScheduledNotifications();
        setNotificationsEnabled(false);
        Alert.alert('Sucesso', 'Todas as notificações foram canceladas.');
      }
      await checkPermissions();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar as configurações de notificação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0ea5e9', '#0d4a7b']} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Notificações</Text>
            <Text style={styles.headerSubtitle}>
              Gerencie suas preferências de notificações
            </Text>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notificações Ativadas</Text>
                <Text style={styles.settingDescription}>
                  Receba lembretes para tomar seus remédios
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator color="#38bdf8" />
              ) : (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#475569', true: '#38bdf8' }}
                  thumbColor="#f8fafc"
                />
              )}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📊 Estatísticas</Text>
              <Text style={styles.infoText}>
                Notificações agendadas: {scheduledCount}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>ℹ️ Informações</Text>
              <Text style={styles.infoText}>
                As notificações são agendadas automaticamente quando você cadastra um novo
                remédio. Você pode desativá-las a qualquer momento.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  headerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    padding: 20,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#cbd5f5',
    fontSize: 13,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.16)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  infoTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#cbd5f5',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});

