import { api, extractErrorMessage } from './api';
import type { AuthUser } from '@/context/auth-context';

export type LoginDto = {
  login: string;
  senha: string;
};

export type RegisterDto = {
  nome: string;
  login: string;
  senha: string;
};

export type LoginResponse = {
  token: string;
  usuario: AuthUser;
};

/**
 * Realiza login do usuário
 */
export async function login(credentials: LoginDto): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/login', {
      login: credentials.login.trim().toLowerCase(),
      senha: credentials.senha,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Registra um novo usuário
 */
export async function register(data: RegisterDto): Promise<{ message: string; usuario: AuthUser }> {
  try {
    const response = await api.post<{ message: string; usuario: AuthUser }>('/usuarios', {
      nome: data.nome.trim(),
      login: data.login.trim().toLowerCase(),
      senha: data.senha,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Obtém os dados do usuário autenticado
 */
export async function getCurrentUser(): Promise<AuthUser> {
  try {
    const response = await api.get<{ usuario: AuthUser }>('/auth/me');
    return response.data.usuario;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

