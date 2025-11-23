import { api, extractErrorMessage } from './api';

export type Remedio = {
  _id: string;
  nomeRemedio: string;
  dosagem: string;
  vezesPorDia: string;
  horarioInicial: string;
  quantidadeInicial: string;
  usuarioId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateRemedioDto = {
  nomeRemedio: string;
  dosagem: string;
  vezesPorDia: string;
  horarioInicial: string;
  quantidadeInicial: string;
};

export type UpdateRemedioDto = Partial<CreateRemedioDto>;

/**
 * Lista todos os remédios ativos do usuário
 */
export async function listRemedios(): Promise<Remedio[]> {
  try {
    const response = await api.get<Remedio[]>('/remedios');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Obtém o histórico de remédios do usuário
 */
export async function getHistoricoRemedios(): Promise<Remedio[]> {
  try {
    const response = await api.get<Remedio[]>('/remedios/historico');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Cria um novo remédio
 */
export async function createRemedio(data: CreateRemedioDto): Promise<Remedio> {
  try {
    const response = await api.post<{ message: string; remedio: Remedio }>('/remedios', data);
    return response.data.remedio;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Atualiza um remédio existente
 */
export async function updateRemedio(
  id: string,
  data: UpdateRemedioDto,
): Promise<Remedio> {
  try {
    const response = await api.put<Remedio>(`/remedios/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Deleta um remédio
 */
export async function deleteRemedio(id: string): Promise<void> {
  try {
    await api.delete(`/remedios/${id}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Obtém um remédio específico por ID
 */
export async function getRemedioById(id: string): Promise<Remedio> {
  try {
    const response = await api.get<Remedio>(`/remedios/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

