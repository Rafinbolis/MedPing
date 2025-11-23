import { useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/services/api';

export default function PerfilScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Nota: Você precisará criar uma rota PUT /usuarios/:id no backend
      // Por enquanto, apenas mostra uma mensagem
      Alert.alert('Info', 'Funcionalidade de editar perfil será implementada em breve.');
      // await api.put(`/usuarios/${user?.id}`, { nome: nome.trim() });
      // await refreshUser();
      // Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      router.back();
    } catch (error) {
      Alert.alert('Erro', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0ea5e9', '#0d4a7b']} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <Text style={styles.headerSubtitle}>Atualize suas informações pessoais</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#cbd5f5"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Login</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.login || ''}
                editable={false}
                placeholderTextColor="#cbd5f5"
              />
              <Text style={styles.helperText}>O login não pode ser alterado</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              )}
            </TouchableOpacity>
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
  formCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#cbd5f5',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(248, 250, 252, 0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledInput: {
    opacity: 0.6,
  },
  helperText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
});

