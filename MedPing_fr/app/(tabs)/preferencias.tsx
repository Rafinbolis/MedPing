import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PreferenciasScreen() {
  const [somAtivado, setSomAtivado] = useState(true);
  const [vibracaoAtivada, setVibracaoAtivada] = useState(true);

  return (
    <LinearGradient colors={['#0ea5e9', '#0d4a7b']} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="settings" size={32} color="#38bdf8" />
            </View>
            <Text style={styles.headerTitle}>Preferências</Text>
            <Text style={styles.headerSubtitle}>
              Personalize sua experiência no MedPing
            </Text>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notificações</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Som</Text>
                  <Text style={styles.settingDescription}>
                    Reproduzir som nas notificações
                  </Text>
                </View>
                <Switch
                  value={somAtivado}
                  onValueChange={setSomAtivado}
                  trackColor={{ false: '#475569', true: '#38bdf8' }}
                  thumbColor="#f8fafc"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Vibração</Text>
                  <Text style={styles.settingDescription}>
                    Vibrar ao receber notificações
                  </Text>
                </View>
                <Switch
                  value={vibracaoAtivada}
                  onValueChange={setVibracaoAtivada}
                  trackColor={{ false: '#475569', true: '#38bdf8' }}
                  thumbColor="#f8fafc"
                />
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                💡 As preferências são salvas localmente no seu dispositivo.
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
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
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
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
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
  infoText: {
    color: '#cbd5f5',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});

