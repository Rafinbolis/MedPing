import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { config } from './config';

// Configuração do comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type MedicationNotificationParams = {
  nomeRemedio: string;
  vezesPorDia: number;
  horarioInicial: string;
};

/**
 * Solicita permissões para exibir notificações
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permissão de notificação negada');
      return false;
    }

    // No Android, também é necessário solicitar permissão de canal
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(config.notifications.channelId, {
        name: config.notifications.channelName,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#38bdf8',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissões de notificação:', error);
    return false;
  }
}

/**
 * Calcula os horários das notificações baseado no horário inicial e vezes por dia
 * Exemplo: 2 vezes por dia começando às 12h = notificações às 12h e 00h (meia-noite)
 * O ciclo se repete diariamente até a quantidade de remédios acabar
 */
function calculateNotificationTimes(
  horarioInicial: string,
  vezesPorDia: number,
): string[] {
  const [hourStr, minuteStr] = horarioInicial.split(':');
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return [];
  }

  const times: number[] = []; // Array de minutos desde meia-noite
  const initialMinutes = hour * 60 + minute; // Minutos desde meia-noite do horário inicial
  const totalMinutesInDay = 24 * 60; // Total de minutos em um dia
  const intervalMinutes = Math.floor(totalMinutesInDay / vezesPorDia); // Intervalo em minutos

  // Calcula cada horário de notificação
  // Começa no horário inicial e adiciona intervalos de forma cíclica
  for (let i = 0; i < vezesPorDia; i++) {
    // Calcula o horário: horário inicial + (intervalo * índice)
    // Usa módulo para garantir que volte ao início do dia quando passar de 24h
    const notificationMinutes = (initialMinutes + i * intervalMinutes) % totalMinutesInDay;
    times.push(notificationMinutes);
  }

  // Ordena os horários cronologicamente dentro do dia
  // Isso garante que horários após meia-noite (ex: 00:00) venham depois dos anteriores
  times.sort((a, b) => a - b);

  // Converte minutos para formato HH:MM
  const timeStrings = times.map((totalMinutes) => {
    const notificationHour = Math.floor(totalMinutes / 60);
    const notificationMinute = totalMinutes % 60;
    return `${notificationHour.toString().padStart(2, '0')}:${notificationMinute.toString().padStart(2, '0')}`;
  });

  return timeStrings;
}

/**
 * Agenda notificações para um medicamento
 */
export async function scheduleMedicationNotifications(
  params: MedicationNotificationParams,
): Promise<void> {
  const { nomeRemedio, vezesPorDia, horarioInicial } = params;

  // IMPORTANTE: Cancela notificações antigas primeiro para evitar duplicatas
  await cancelMedicationNotifications(nomeRemedio);

  // Verifica permissões
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error('Permissão de notificação não concedida');
  }

  // Validações
  if (vezesPorDia <= 0 || vezesPorDia > 1440) {
    throw new Error('Número de vezes por dia deve estar entre 1 e 1440');
  }

  const totalMinutesInDay = 24 * 60; // 1440 minutos
  const intervalSeconds = Math.floor((totalMinutesInDay * 60) / vezesPorDia); // Intervalo em segundos

  // Para frequências muito altas (>= 100 notificações/dia ou intervalo < 1 minuto),
  // usa TimeIntervalTrigger ao invés de criar muitas notificações individuais
  const useIntervalTrigger = vezesPorDia >= 100 || intervalSeconds < 60;

  if (useIntervalTrigger) {
    // Usa TimeIntervalTrigger para notificações de alta frequência
    // Para 1440 vezes por dia = intervalo de 60 segundos (1 notificação por minuto)
    const [hourStr, minuteStr] = horarioInicial.split(':');
    const hour = Number.parseInt(hourStr, 10);
    const minute = Number.parseInt(minuteStr, 10);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      throw new Error('Horário inicial inválido');
    }

    // Calcula quando a primeira notificação deve ser disparada
    const now = new Date();
    const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const initialTotalMinutes = hour * 60 + minute;
    const minutesInDay = 24 * 60;
    const intervalMinutes = Math.floor(minutesInDay / vezesPorDia);

    // Calcula quantos minutos faltam até o próximo horário de notificação no ciclo
    let minutesUntilNext = 0;
    if (nowTotalMinutes < initialTotalMinutes) {
      // O horário inicial ainda não passou hoje
      minutesUntilNext = initialTotalMinutes - nowTotalMinutes;
    } else {
      // O horário inicial já passou, calcula até o próximo ponto no ciclo
      const minutesSinceInitial = nowTotalMinutes - initialTotalMinutes;
      const minutesIntoCycle = minutesSinceInitial % intervalMinutes;
      minutesUntilNext = intervalMinutes - minutesIntoCycle;
    }

    // Converte para segundos e ajusta para começar no próximo minuto completo
    const secondsUntilNext = minutesUntilNext * 60 - now.getSeconds();
    const firstTriggerSeconds = Math.max(intervalSeconds, secondsUntilNext > 0 ? secondsUntilNext : intervalSeconds);

    const normalizedNome = nomeRemedio.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const identifier = `medication-${normalizedNome}-interval`;

    // Agenda notificação com intervalo
    // O trigger começa após 'firstTriggerSeconds' segundos e repete a cada 'intervalSeconds' segundos
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: '💊 Hora do Remédio',
        body: `É hora de tomar ${nomeRemedio}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          nomeRemedio,
          horario: horarioInicial,
          vezesPorDia,
        },
      },
      trigger: {
        seconds: intervalSeconds,
        repeats: true,
      } as Notifications.TimeIntervalTriggerInput,
    });

    console.log(`✅ Agendada notificação com intervalo de ${intervalSeconds}s (${vezesPorDia}x/dia = 1 a cada ${Math.round(intervalSeconds / 60)} minuto(s)) para ${nomeRemedio}`);
    console.log(`   Primeira notificação em aproximadamente ${Math.round(firstTriggerSeconds / 60)} minuto(s), depois a cada ${Math.round(intervalSeconds / 60)} minuto(s)`);
  } else {
    // Para frequências menores, usa notificações individuais com horários específicos
    const times = calculateNotificationTimes(horarioInicial, vezesPorDia);

    if (times.length === 0) {
      throw new Error('Horário inicial inválido');
    }

    console.log(`📅 Horários calculados para ${nomeRemedio} (${vezesPorDia}x/dia começando às ${horarioInicial}):`, times);

    // Agenda uma notificação para cada horário
    const notificationPromises = times.map((time) => {
      const [hourStr, minuteStr] = time.split(':');
      const hour = Number.parseInt(hourStr, 10);
      const minute = Number.parseInt(minuteStr, 10);

      const normalizedNome = nomeRemedio.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const identifier = `medication-${normalizedNome}-${hour}-${minute}`;

      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      };

      return Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '💊 Hora do Remédio',
          body: `É hora de tomar ${nomeRemedio}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            nomeRemedio,
            horario: time,
          },
        },
        trigger,
      });
    });

    await Promise.all(notificationPromises);
    console.log(`✅ Agendadas ${times.length} notificações diárias para ${nomeRemedio} nos horários: ${times.join(', ')}`);
  }
}

/**
 * Cancela todas as notificações agendadas
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Erro ao cancelar notificações:', error);
  }
}

/**
 * Cancela notificações específicas de um medicamento
 */
export async function cancelMedicationNotifications(
  nomeRemedio: string,
): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    const medicationNotifications = scheduledNotifications.filter(
      (notification) => notification.content.data?.nomeRemedio === nomeRemedio,
    );

    const cancelPromises = medicationNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    );

    await Promise.all(cancelPromises);
  } catch (error) {
    console.error('Erro ao cancelar notificações do medicamento:', error);
  }
}

/**
 * Lista todas as notificações agendadas
 */
export async function getAllScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return [];
  }
}

/**
 * Obtém o token do dispositivo para push notifications e registra no servidor
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: config.notifications.projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Erro ao obter token de push:', error);
    return null;
  }
}

/**
 * Registra o token de push no servidor
 */
export async function registerPushToken(expoPushToken: string, dispositivo?: string): Promise<void> {
  try {
    const { api } = await import('./api');
    await api.post('/push-token', {
      expoPushToken,
      dispositivo: dispositivo || 'unknown',
    });
    console.log('✅ Token de push registrado no servidor');
  } catch (error) {
    console.error('Erro ao registrar token de push:', error);
    throw error;
  }
}

/**
 * Remove o token de push do servidor
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const { api } = await import('./api');
    await api.delete('/push-token');
    console.log('✅ Token de push removido do servidor');
  } catch (error) {
    console.error('Erro ao remover token de push:', error);
    throw error;
  }
}

