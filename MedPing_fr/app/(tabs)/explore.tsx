import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/services/api';

type RemedioRegistro = {
  _id: string;
  nomeRemedio: string;
  dosagem: string;
  vezesPorDia: string;
  horarioInicial: string;
  quantidadeInicial: string;
  createdAt?: string;
};

export default function HistoricoScreen() {
  const { user } = useAuth();
  const [historico, setHistorico] = useState<RemedioRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistorico = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<RemedioRegistro[]>('/remedios/historico');
      setHistorico(response.data);
    } catch (error) {
      console.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistorico();
    }, [fetchHistorico]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchHistorico();
    } finally {
      setRefreshing(false);
    }
  }, [fetchHistorico]);

  return (
    <LinearGradient colors={['#0ea5e9', '#0d4a7b']} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Histórico de registros</Text>
            <Text style={styles.headerSubtitle}>
              {`Monitorando os cadastros de ${user?.nome ?? 'usuário'}`}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#f8fafc" />
          ) : historico.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum registro encontrado. Cadastre um novo remédio para iniciar o histórico.
            </Text>
          ) : (
            historico.map((registro) => (
              <View key={`${registro._id}-timeline`} style={styles.timelineItem}>
                <View style={styles.timelineMarker}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{registro.nomeRemedio}</Text>
                  <Text style={styles.timelineDosage}>{registro.dosagem}</Text>
                  <View style={styles.timelineRow}>
                    <Text style={styles.timelineLabel}>Vezes/dia:</Text>
                    <Text style={styles.timelineValue}>{registro.vezesPorDia}</Text>
                  </View>
                  <View style={styles.timelineRow}>
                    <Text style={styles.timelineLabel}>Início:</Text>
                    <Text style={styles.timelineValue}>{registro.horarioInicial}</Text>
                  </View>
                  <View style={styles.timelineRow}>
                    <Text style={styles.timelineLabel}>Quantidade:</Text>
                    <Text style={styles.timelineValue}>{registro.quantidadeInicial}</Text>
                  </View>
                  <Text style={styles.timelineDate}>
                    {registro.createdAt
                      ? new Date(registro.createdAt).toLocaleString()
                      : 'Sem data registrada'}
                  </Text>
                </View>
              </View>
            ))
          )}
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
  emptyText: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '500',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(8, 47, 73, 0.9)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  timelineMarker: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#38bdf8',
    marginBottom: 8,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
  },
  timelineContent: {
    flex: 1,
    gap: 6,
  },
  timelineTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  timelineDosage: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    color: '#cbd5f5',
    fontSize: 13,
    fontWeight: '600',
  },
  timelineValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '500',
  },
  timelineDate: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
