import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api, extractErrorMessage } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

type ModalState = {
  visible: boolean;
  message: string;
  type: 'error' | 'success';
};

const initialModalState: ModalState = {
  visible: false,
  message: '',
  type: 'success',
};

export default function LoginScreen() {
  const router = useRouter();
  const { authenticate, loading: authLoading, user } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  const isSubmitDisabled = useMemo(() => {
    if (authLoading || loading) {
      return true;
    }

    if (isLoginMode) {
      return !login.trim() || !senha.trim();
    }

    return !nome.trim() || !login.trim() || !senha.trim();
  }, [isLoginMode, login, senha, nome, loading, authLoading]);

  const resetForm = () => {
    setNome('');
    setLogin('');
    setSenha('');
  };

  const closeModal = () => {
    setModalState(initialModalState);
  };

  const showModal = (message: string, type: ModalState['type']) => {
    setModalState({ visible: true, message, type });
  };

  const handleLogin = async () => {
    try {
      const response = await api.post('/login', {
        login: login.trim().toLowerCase(),
        senha,
      });

      await authenticate(response.data?.token, response.data?.usuario);
      showModal('Login realizado com sucesso!', 'success');

      setTimeout(() => {
        closeModal();
        router.replace('/(tabs)');
      }, 1200);
    } catch (error) {
      showModal(extractErrorMessage(error), 'error');
    }
  };

  const handleRegister = async () => {
    try {
      await api.post('/usuarios', {
        nome: nome.trim(),
        login: login.trim().toLowerCase(),
        senha,
      });

      showModal('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
      resetForm();
      setIsLoginMode(true);
    } catch (error) {
      showModal(extractErrorMessage(error), 'error');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setLoading(true);

    try {
      if (isLoginMode) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode((prev) => !prev);
    setModalState(initialModalState);
  };

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/(tabs)');
    }
  }, [authLoading, user, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>MedPing</Text>
            <Text style={styles.subtitle}>
              {isLoginMode ? 'Acesse sua conta' : 'Crie sua conta'}
            </Text>
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                autoCapitalize="words"
                value={nome}
                onChangeText={setNome}
                placeholder="Digite seu nome completo"
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Login</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              value={login}
              onChangeText={setLogin}
              placeholder="Seu login de acesso"
              style={styles.input}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                secureTextEntry={!senhaVisivel}
                autoCapitalize="none"
                value={senha}
                onChangeText={setSenha}
                placeholder="••••••••"
                style={[styles.input, styles.passwordInput]}
                placeholderTextColor="#9ca3af"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                onPress={() => setSenhaVisivel((prev) => !prev)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={senhaVisivel ? 'eye-off' : 'eye'}
                  size={22}
                  color="#64748b"
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              (isSubmitDisabled || pressed) && styles.submitButtonDisabled,
            ]}
            disabled={isSubmitDisabled}
          >
            {loading || authLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>{isLoginMode ? 'Entrar' : 'Cadastrar'}</Text>
            )}
          </Pressable>

          <Pressable onPress={toggleMode} style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLoginMode ? 'Não tem conta? Cadastre-se' : 'Já possui conta? Faça login'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent
        visible={modalState.visible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              modalState.type === 'error' ? styles.modalError : styles.modalSuccess,
            ]}
          >
            <Text style={styles.modalMessage}>{modalState.message}</Text>
            <Pressable onPress={closeModal} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Ok</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#38bdf8',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#e2e8f0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  toggleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalError: {
    backgroundColor: '#fee2e2',
  },
  modalSuccess: {
    backgroundColor: '#dcfce7',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#111827',
    marginBottom: 16,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
});

