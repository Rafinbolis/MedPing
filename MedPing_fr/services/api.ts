import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from './config';

const TOKEN_STORAGE_KEY = '@medping/token';

// Cache do token em memória para evitar chamadas repetidas ao AsyncStorage
let cachedToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

// Função para obter token com cache
const getCachedToken = async (): Promise<string | null> => {
  // Se já temos uma promise em andamento, aguarda ela
  if (tokenPromise) {
    return tokenPromise;
  }

  // Se temos token em cache, retorna imediatamente
  if (cachedToken !== null) {
    return cachedToken;
  }

  // Busca o token do AsyncStorage
  tokenPromise = AsyncStorage.getItem(TOKEN_STORAGE_KEY)
    .then((token) => {
      cachedToken = token;
      tokenPromise = null;
      return token;
    })
    .catch((error) => {
      console.warn('Erro ao obter token do AsyncStorage:', error);
      tokenPromise = null;
      return null;
    });

  return tokenPromise;
};

// Log da URL da API para debug
if (__DEV__) {
  console.log('🔗 API URL configurada:', config.apiUrl);
  console.log('⏱️ Timeout configurado:', config.requestTimeout, 'ms');
}

// Instância do axios configurada
const axiosInstance: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: config.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Validação padrão: apenas status 2xx são considerados sucesso
  // Isso garante que erros 400, 401, 403, 404, 409, etc. sejam tratados como erros
  validateStatus: (status: number) => status >= 200 && status < 300,
});

// Interceptor para adicionar token de autenticação nas requisições
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Obtém o token do cache
      const token = await getCachedToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Erro ao obter token no interceptor:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  },
);

// Interceptor para tratar erros de resposta
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log de sucesso para debug (pode ser removido em produção)
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Log de erro para debug
    if (__DEV__) {
      if (error.response) {
        console.error(
          `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response.status}`,
          error.response.data,
        );
      } else if (error.request) {
        console.error(`❌ Erro de rede: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.message);
      } else {
        console.error('❌ Erro na requisição:', error.message);
      }
    }

    // Se o token for inválido ou expirado, remove do storage e cache
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        // Limpa o cache
        cachedToken = null;
        tokenPromise = null;
      } catch (storageError) {
        console.warn('Erro ao remover token do AsyncStorage:', storageError);
        // Limpa o cache mesmo em caso de erro
        cachedToken = null;
        tokenPromise = null;
      }
    }
    return Promise.reject(error);
  },
);

// Cliente API usando axios
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(instance: AxiosInstance) {
    this.axiosInstance = instance;
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(endpoint, config);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(endpoint, data, config);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(endpoint, data, config);
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(endpoint, config);
  }
}

// Instância do cliente API
export const api = new ApiClient(axiosInstance);

/**
 * Define o token de autenticação no AsyncStorage
 * O interceptor do axios irá buscar automaticamente nas próximas requisições
 */
export const setAuthToken = async (token: string | null): Promise<void> => {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      // Atualiza o cache
      cachedToken = token;
      tokenPromise = null;
    } else {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      // Limpa o cache
      cachedToken = null;
      tokenPromise = null;
    }
  } catch (error) {
    console.error('Erro ao salvar token no AsyncStorage:', error);
    // Limpa o cache em caso de erro
    cachedToken = null;
    tokenPromise = null;
    throw error;
  }
};

/**
 * Remove o token de autenticação do AsyncStorage
 */
export const clearAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    // Limpa o cache
    cachedToken = null;
    tokenPromise = null;
  } catch (error) {
    console.error('Erro ao remover token do AsyncStorage:', error);
    // Limpa o cache mesmo em caso de erro
    cachedToken = null;
    tokenPromise = null;
  }
};

/**
 * Obtém o token de autenticação do AsyncStorage
 */
export const getAuthToken = async (): Promise<string | null> => {
  return getCachedToken();
};

/**
 * Extrai mensagem de erro de uma resposta de API
 */
export const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  // Erro do axios
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;

    // Erro de rede ou timeout
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
        return 'Tempo de requisição esgotado. O servidor pode estar demorando para responder. Tente novamente.';
      }
      if (axiosError.message === 'Network Error' || axiosError.code === 'ERR_NETWORK') {
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      if (axiosError.code === 'ERR_INTERNET_DISCONNECTED') {
        return 'Sem conexão com a internet. Verifique sua conexão.';
      }
      return `Erro de conexão: ${axiosError.message || 'Erro desconhecido'}. Verifique sua internet.`;
    }

    // Erro com resposta do servidor
    const responseData = axiosError.response.data;
    if (responseData) {
      if (typeof responseData === 'string') {
        return responseData;
      }
      if (responseData.message) {
        return responseData.message;
      }
      if (responseData.error) {
        return responseData.error;
      }
    }

    // Mensagens padrão por status code
    switch (axiosError.response.status) {
      case 400:
        return 'Requisição inválida. Verifique os dados enviados.';
      case 401:
        return 'Não autorizado. Faça login novamente.';
      case 403:
        return 'Acesso negado.';
      case 404:
        return 'Recurso não encontrado.';
      case 409:
        return 'Conflito. O recurso já existe.';
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      default:
        return `Erro ${axiosError.response.status}: ${axiosError.response.statusText || 'Erro desconhecido'}`;
    }
  }

  // Erro genérico
  if (error?.message) {
    return error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
};
