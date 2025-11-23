import Constants from 'expo-constants';

/**
 * Configurações da aplicação
 */
export const config = {
  /**
   * URL base da API
   * Pode ser configurada via:
   * 1. Variável de ambiente EXPO_PUBLIC_API_URL
   * 2. app.json -> extra.apiUrl
   * 3. Valor padrão: http://localhost:3000
   */
  apiUrl:
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://med-ping-bak.vercel.app',

  /**
   * Timeout padrão para requisições (em milissegundos)
   * Aumentado para 90 segundos para evitar timeouts em operações do MongoDB
   * Especialmente importante para cold starts no Vercel
   */
  requestTimeout: 90000,

  /**
   * Configurações de notificações
   */
  notifications: {
    /**
     * ID do projeto Expo (para push notifications)
     */
    projectId: Constants.expoConfig?.extra?.eas?.projectId || undefined,

    /**
     * Nome do canal de notificações no Android
     */
    channelName: 'MedPing Notificações',

    /**
     * ID do canal de notificações no Android
     */
    channelId: 'default',
  },
} as const;

