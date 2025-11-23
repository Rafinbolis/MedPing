# Serviços

Esta pasta contém todos os serviços da aplicação MedPing.

## Estrutura

### `api.ts`
Cliente HTTP para comunicação com a API backend. Fornece:
- Cliente HTTP baseado em `fetch`
- Gerenciamento automático de tokens de autenticação
- Tratamento de erros padronizado
- Funções utilitárias para extração de mensagens de erro

**Uso:**
```typescript
import { api, setAuthToken, clearAuthToken, extractErrorMessage } from '@/services/api';

// Fazer uma requisição GET
const response = await api.get('/remedios');

// Fazer uma requisição POST
const response = await api.post('/remedios', { nomeRemedio: 'Paracetamol' });

// Definir token de autenticação
setAuthToken('seu-token-aqui');

// Limpar token
clearAuthToken();
```

### `auth.ts`
Serviços relacionados à autenticação de usuários.

**Funções:**
- `login(credentials: LoginDto)` - Realiza login
- `register(data: RegisterDto)` - Registra novo usuário
- `getCurrentUser()` - Obtém dados do usuário autenticado

**Uso:**
```typescript
import { login, register, getCurrentUser } from '@/services/auth';

// Login
const { token, usuario } = await login({ login: 'usuario', senha: 'senha123' });

// Registro
const { usuario } = await register({ nome: 'João', login: 'joao', senha: 'senha123' });

// Obter usuário atual
const usuario = await getCurrentUser();
```

### `remedios.ts`
Serviços relacionados ao gerenciamento de remédios.

**Funções:**
- `listRemedios()` - Lista remédios ativos
- `getHistoricoRemedios()` - Obtém histórico de remédios
- `createRemedio(data: CreateRemedioDto)` - Cria novo remédio
- `updateRemedio(id: string, data: UpdateRemedioDto)` - Atualiza remédio
- `deleteRemedio(id: string)` - Deleta remédio
- `getRemedioById(id: string)` - Obtém remédio por ID

**Uso:**
```typescript
import { listRemedios, createRemedio, deleteRemedio } from '@/services/remedios';

// Listar remédios
const remedios = await listRemedios();

// Criar remédio
const novoRemedio = await createRemedio({
  nomeRemedio: 'Paracetamol',
  dosagem: '500mg',
  vezesPorDia: '3',
  horarioInicial: '08:00',
  quantidadeInicial: '30 comprimidos'
});

// Deletar remédio
await deleteRemedio('id-do-remedio');
```

### `notifications.ts`
Serviços relacionados a notificações locais.

**Funções:**
- `requestNotificationPermissions()` - Solicita permissões de notificação
- `scheduleMedicationNotifications(params)` - Agenda notificações para medicamento
- `cancelAllScheduledNotifications()` - Cancela todas as notificações
- `cancelMedicationNotifications(nomeRemedio)` - Cancela notificações de um medicamento
- `getAllScheduledNotifications()` - Lista todas as notificações agendadas
- `getExpoPushToken()` - Obtém token para push notifications

**Uso:**
```typescript
import {
  requestNotificationPermissions,
  scheduleMedicationNotifications,
  cancelAllScheduledNotifications
} from '@/services/notifications';

// Solicitar permissões
const hasPermission = await requestNotificationPermissions();

// Agendar notificações
await scheduleMedicationNotifications({
  nomeRemedio: 'Paracetamol',
  vezesPorDia: 3,
  horarioInicial: '08:00'
});

// Cancelar todas as notificações
await cancelAllScheduledNotifications();
```

### `config.ts`
Configurações centralizadas da aplicação.

**Uso:**
```typescript
import { config } from '@/services/config';

// URL da API
const apiUrl = config.apiUrl;

// Timeout de requisições
const timeout = config.requestTimeout;
```

## Configuração

### URL da API

A URL base da API pode ser configurada de três formas (em ordem de prioridade):

1. **Variável de ambiente:** `EXPO_PUBLIC_API_URL`
2. **app.json:** `extra.apiUrl`
3. **Valor padrão:** `http://localhost:3000`

Exemplo no `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://sua-api.com"
    }
  }
}
```

## Dependências Necessárias

Certifique-se de que as seguintes dependências estão instaladas:

```bash
npm install expo-notifications @react-native-async-storage/async-storage expo-constants
```

## Tratamento de Erros

Todos os serviços lançam erros que podem ser tratados com `extractErrorMessage`:

```typescript
import { extractErrorMessage } from '@/services/api';

try {
  await createRemedio(data);
} catch (error) {
  const message = extractErrorMessage(error);
  Alert.alert('Erro', message);
}
```

