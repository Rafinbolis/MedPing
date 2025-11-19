# Configuração da Vercel - Variáveis de Ambiente

## ⚠️ IMPORTANTE

A Vercel **NÃO lê arquivos `.env` automaticamente**. Você precisa configurar as variáveis de ambiente no painel da Vercel.

## Variáveis de Ambiente Obrigatórias

O servidor precisa das seguintes variáveis de ambiente:

1. **`MONGO_URL`** - URL de conexão do MongoDB
   - Exemplo: `mongodb+srv://usuario:senha@cluster.mongodb.net/nome-do-banco?retryWrites=true&w=majority`
   - Obtida no MongoDB Atlas em: Connect > Connect your application

2. **`JWT_SECRET`** - Chave secreta para assinar tokens JWT
   - Pode ser qualquer string aleatória e segura
   - Exemplo: `minha-chave-secreta-super-segura-123456789`
   - Recomendado: Use uma string longa e aleatória

## Como Configurar na Vercel

### Método 1: Via Painel Web

1. Acesse [https://vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Selecione seu projeto `med-ping-bak`
4. Vá em **Settings** (Configurações)
5. Clique em **Environment Variables** (Variáveis de Ambiente)
6. Adicione cada variável:
   - Clique em **Add New**
   - Digite o nome da variável (ex: `MONGO_URL`)
   - Digite o valor da variável
   - Selecione os ambientes (Production, Preview, Development)
   - Clique em **Save**
7. Repita para todas as variáveis necessárias

### Método 2: Via CLI da Vercel

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Adicionar variáveis de ambiente
vercel env add MONGO_URL
vercel env add JWT_SECRET

# Para produção especificamente
vercel env add MONGO_URL production
vercel env add JWT_SECRET production
```

### Método 3: Via arquivo `.env` (apenas desenvolvimento local)

Para desenvolvimento local, você pode criar um arquivo `.env` na raiz do projeto:

```env
MONGO_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/nome-do-banco?retryWrites=true&w=majority
JWT_SECRET=sua-chave-secreta-aqui
```

⚠️ **IMPORTANTE**: 
- NUNCA commite o arquivo `.env` no Git
- Adicione `.env` ao `.gitignore`
- O arquivo `.env` só funciona localmente, não na Vercel

## Verificar se Está Configurado

Após configurar as variáveis:

1. Faça um novo deploy na Vercel
2. Acesse os logs do deploy
3. Você deve ver: `✅ Conectado ao banco de dados MongoDB`
4. Se ver erros sobre variáveis ausentes, verifique se configurou corretamente

## Troubleshooting

### Erro: "Missing environment variables"
- **Causa**: Variáveis não configuradas na Vercel
- **Solução**: Configure as variáveis no painel da Vercel e faça um novo deploy

### Erro: "Erro ao conectar ao MongoDB"
- **Causa**: `MONGO_URL` incorreta ou MongoDB inacessível
- **Solução**: 
  - Verifique se a URL está correta
  - Verifique se o IP está liberado no MongoDB Atlas (0.0.0.0/0 para permitir todos)
  - Verifique se as credenciais estão corretas

### Erro: "Token inválido"
- **Causa**: `JWT_SECRET` não configurado ou diferente entre deploys
- **Solução**: Configure o `JWT_SECRET` na Vercel e use o mesmo valor sempre

## Segurança

- ⚠️ **NUNCA** compartilhe suas variáveis de ambiente
- ⚠️ **NUNCA** commite arquivos `.env` no Git
- ✅ Use valores diferentes para desenvolvimento e produção
- ✅ Use chaves JWT fortes e aleatórias
- ✅ Mantenha suas credenciais do MongoDB seguras

