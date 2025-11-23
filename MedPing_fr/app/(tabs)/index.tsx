import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/services/api';
import {
  cancelMedicationNotifications,
} from '@/services/notifications';
import { deleteRemedio, updateRemedio } from '@/services/remedios';

type Remedio = {
  _id: string;
  nomeRemedio: string;
  dosagem: string;
  vezesPorDia: string;
  horarioInicial: string;
  quantidadeInicial: string;
  createdAt?: string;
};

type FormState = {
  nomeRemedio: string;
  dosagem: string;
  vezesPorDia: string;
  horarioInicial: string;
  quantidadeInicial: string;
};

const formatTime = (date: Date) =>
  date
    .toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .padStart(5, '0');

const parseTimeToDate = (time: string) => {
  const [hourStr, minuteStr] = time.split(':');
  const date = new Date();
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  date.setHours(Number.isNaN(hour) ? 0 : hour);
  date.setMinutes(Number.isNaN(minute) ? 0 : minute);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

const createInitialFormState = (): FormState => {
  const now = new Date();
  return {
    nomeRemedio: '',
    dosagem: '',
    vezesPorDia: '',
    horarioInicial: formatTime(now),
    quantidadeInicial: '',
  };
};

export default function HomeScreen() {
  const { user } = useAuth();
  const initialFormState = useMemo(() => createInitialFormState(), []);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [selectedTime, setSelectedTime] = useState<Date>(() =>
    parseTimeToDate(initialFormState.horarioInicial),
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [remedios, setRemedios] = useState<Remedio[]>([]);
  const [historico, setHistorico] = useState<Remedio[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingRemedio, setEditingRemedio] = useState<Remedio | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const isFormValid = useMemo(() => {
    return Object.values(form).every((value) => value.trim().length > 0) && !submitting;
  }, [form, submitting]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [remediosResponse, historicoResponse] = await Promise.all([
        api.get<Remedio[]>('/remedios'),
        api.get<Remedio[]>('/remedios/historico'),
      ]);
      setRemedios(remediosResponse.data);
      setHistorico(historicoResponse.data);
    } catch (error) {
      Alert.alert('Erro', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTimePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }
      return;
    }

    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (date) {
      setSelectedTime(date);
      handleChange('horarioInicial', formatTime(date));
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      return;
    }

    setSubmitting(true);
    try {
      if (editingRemedio) {
        // Editar remédio existente
        await updateRemedio(editingRemedio._id, form);
        
        // Notificações agora são gerenciadas pelo servidor
        // Não precisa mais agendar localmente
        
        Alert.alert('Sucesso', 'Remédio atualizado com sucesso!');
        setEditingRemedio(null);
        setShowEditModal(false);
      } else {
        // Criar novo remédio
        await api.post('/remedios', form);
        // Notificações agora são gerenciadas pelo servidor
        Alert.alert('Sucesso', 'Remédio cadastrado com sucesso!');
      }
      
      const freshForm = createInitialFormState();
      setForm(freshForm);
      setSelectedTime(parseTimeToDate(freshForm.horarioInicial));
      await fetchData();
    } catch (error) {
      Alert.alert('Erro', extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (remedio: Remedio) => {
    setEditingRemedio(remedio);
    setForm({
      nomeRemedio: remedio.nomeRemedio,
      dosagem: remedio.dosagem,
      vezesPorDia: remedio.vezesPorDia,
      horarioInicial: remedio.horarioInicial,
      quantidadeInicial: remedio.quantidadeInicial,
    });
    setSelectedTime(parseTimeToDate(remedio.horarioInicial));
    setShowEditModal(true);
  };

  const handleDelete = (remedio: Remedio) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o remédio "${remedio.nomeRemedio}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRemedio(remedio._id);
              await cancelMedicationNotifications(remedio.nomeRemedio);
              Alert.alert('Sucesso', 'Remédio excluído com sucesso!');
              await fetchData();
            } catch (error) {
              Alert.alert('Erro', extractErrorMessage(error));
            }
          },
        },
      ],
    );
  };

  const handleCancelEdit = () => {
    setEditingRemedio(null);
    setShowEditModal(false);
    const freshForm = createInitialFormState();
    setForm(freshForm);
    setSelectedTime(parseTimeToDate(freshForm.horarioInicial));
  };

  return (
    <LinearGradient colors={['#0ea5e9', '#0d4a7b']} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Olá, {user?.nome ?? 'usuário'} 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              Organize seus medicamentos, acompanhe horários e mantenha seu histórico em um só
              lugar.
            </Text>
          </View>

          {!showEditModal && (
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Cadastrar Remédio</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do remédio"
                placeholderTextColor="#cbd5f5"
                value={form.nomeRemedio}
                onChangeText={(text) => handleChange('nomeRemedio', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dosagem</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 500mg"
                placeholderTextColor="#cbd5f5"
                value={form.dosagem}
                onChangeText={(text) => handleChange('dosagem', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vezes ao dia</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 3"
                placeholderTextColor="#cbd5f5"
                keyboardType="numeric"
                value={form.vezesPorDia}
                onChangeText={(text) => handleChange('vezesPorDia', text)}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Início (horário)</Text>
                <TouchableOpacity
                  style={[styles.input, styles.timeInput]}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timeText}>{form.horarioInicial}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <View>
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleTimePickerChange}
                      locale="pt-BR"
                    />
                    {Platform.OS === 'ios' && (
                      <View style={styles.pickerActions}>
                        <TouchableOpacity
                          onPress={() => setShowTimePicker(false)}
                          style={styles.pickerButton}
                        >
                          <Text style={styles.pickerButtonText}>Concluir</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Quantidade inicial</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 30 comprimidos"
                  placeholderTextColor="#cbd5f5"
                  value={form.quantidadeInicial}
                  onChangeText={(text) => handleChange('quantidadeInicial', text)}
                />
              </View>
            </View>

            <View style={styles.formActions}>
              {editingRemedio && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                  disabled={submitting}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isFormValid || submitting) && styles.disabledButton,
                  editingRemedio && styles.submitButtonEdit,
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid}
              >
                {submitting ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text style={styles.submitText}>
                    {editingRemedio ? 'Salvar Alterações' : 'Confirmar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          )}

          <View style={styles.listCard}>
            <Text style={styles.cardTitle}>Remédios Ativos</Text>
            {loading ? (
              <ActivityIndicator color="#38bdf8" />
            ) : remedios.length === 0 ? (
              <Text style={styles.emptyText}>
                Você ainda não possui remédios cadastrados. Comece adicionando um novo!
              </Text>
            ) : (
              remedios.map((remedio) => (
                <View key={remedio._id} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemHeaderLeft}>
                      <Text style={styles.itemTitle}>{remedio.nomeRemedio}</Text>
                      <Text style={styles.itemDosage}>{remedio.dosagem}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEdit(remedio)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(remedio)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Vezes/dia:</Text>
                    <Text style={styles.itemValue}>{remedio.vezesPorDia}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Início:</Text>
                    <Text style={styles.itemValue}>{remedio.horarioInicial}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Quantidade:</Text>
                    <Text style={styles.itemValue}>{remedio.quantidadeInicial}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.listCard}>
            <Text style={styles.cardTitle}>Histórico</Text>
            {loading ? (
              <ActivityIndicator color="#38bdf8" />
            ) : historico.length === 0 ? (
              <Text style={styles.emptyText}>
                Seu histórico aparecerá aqui conforme você cadastrar novos remédios.
              </Text>
            ) : (
              historico.map((registro) => (
                <View key={`${registro._id}-historico`} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyTitle}>{registro.nomeRemedio}</Text>
                    <Text style={styles.historySubtitle}>{registro.dosagem}</Text>
                  </View>
                  <View>
                    <Text style={styles.historyDate}>
                      {registro.createdAt
                        ? new Date(registro.createdAt).toLocaleString()
                        : 'Sem data'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Edição */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>Editar Remédio</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do remédio"
                  placeholderTextColor="#cbd5f5"
                  value={form.nomeRemedio}
                  onChangeText={(text) => handleChange('nomeRemedio', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dosagem</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 500mg"
                  placeholderTextColor="#cbd5f5"
                  value={form.dosagem}
                  onChangeText={(text) => handleChange('dosagem', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vezes ao dia</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 3"
                  placeholderTextColor="#cbd5f5"
                  keyboardType="numeric"
                  value={form.vezesPorDia}
                  onChangeText={(text) => handleChange('vezesPorDia', text)}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.label}>Início (horário)</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.timeInput]}
                    onPress={() => setShowTimePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.timeText}>{form.horarioInicial}</Text>
                  </TouchableOpacity>
                  {showTimePicker && (
                    <View>
                      <DateTimePicker
                        value={selectedTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleTimePickerChange}
                        locale="pt-BR"
                      />
                      {Platform.OS === 'ios' && (
                        <View style={styles.pickerActions}>
                          <TouchableOpacity
                            onPress={() => setShowTimePicker(false)}
                            style={styles.pickerButton}
                          >
                            <Text style={styles.pickerButtonText}>Concluir</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.label}>Quantidade inicial</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 30 comprimidos"
                    placeholderTextColor="#cbd5f5"
                    value={form.quantidadeInicial}
                    onChangeText={(text) => handleChange('quantidadeInicial', text)}
                  />
                </View>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                  disabled={submitting}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, (!isFormValid || submitting) && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={!isFormValid}
                >
                  {submitting ? (
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <Text style={styles.submitText}>Salvar Alterações</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  welcomeCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 24,
    padding: 20,
  },
  welcomeTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#cbd5f5',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
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
  timeInput: {
    justifyContent: 'center',
  },
  timeText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
    gap: 8,
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.2)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 245, 0.3)',
  },
  cancelText: {
    color: '#cbd5f5',
    fontSize: 18,
    fontWeight: '700',
  },
  submitButtonEdit: {
    flex: 1,
  },
  itemHeaderLeft: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(190, 18, 60, 0.2)',
  },
  actionButtonText: {
    fontSize: 16,
  },
  listCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  emptyText: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '500',
  },
  item: {
    backgroundColor: 'rgba(14, 165, 233, 0.16)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  itemDosage: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemLabel: {
    color: '#cbd5f5',
    fontSize: 14,
    fontWeight: '600',
  },
  itemValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  historyItem: {
    backgroundColor: 'rgba(8, 47, 73, 0.9)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  historySubtitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  historyDate: {
    color: '#cbd5f5',
    fontSize: 12,
    fontWeight: '600',
  },
  pickerActions: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  pickerButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pickerButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0d4a7b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingTop: 24,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});
