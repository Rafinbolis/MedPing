import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacidadeScreen() {
  return (
    <LinearGradient colors={['#0ea5e9', '#0d4a7b']} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="lock-closed" size={32} color="#38bdf8" />
            </View>
            <Text style={styles.headerTitle}>Privacidade e Segurança</Text>
            <Text style={styles.headerSubtitle}>
              Informações sobre como protegemos seus dados
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🔒 Segurança dos Dados</Text>
            <Text style={styles.infoText}>
              Todos os seus dados são armazenados de forma segura e criptografada. Suas senhas
              são protegidas usando hash bcrypt e nunca são armazenadas em texto plano.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📱 Dados Locais</Text>
            <Text style={styles.infoText}>
              O token de autenticação é armazenado localmente no seu dispositivo usando
              AsyncStorage. Nenhum dado sensível é compartilhado com terceiros.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🔔 Notificações</Text>
            <Text style={styles.infoText}>
              As notificações são processadas localmente no seu dispositivo. Nenhuma informação
              sobre seus medicamentos é enviada para serviços externos de notificação.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🌐 Comunicação com o Servidor</Text>
            <Text style={styles.infoText}>
              Todas as comunicações com o servidor são feitas através de conexões HTTPS
              criptografadas, garantindo a segurança dos dados em trânsito.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>👤 Seus Direitos</Text>
            <Text style={styles.infoText}>
              Você tem o direito de acessar, editar ou excluir seus dados a qualquer momento
              através da aplicação. Ao fazer logout, todos os dados locais são removidos.
            </Text>
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
  infoCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  infoTitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoText: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
});

