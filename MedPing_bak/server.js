import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import SerialPort from "serialport";
import  ReadlineParser  from 'serialport';

import Usuario from './models/Usuario.js';
import Remedio from './models/Remedios.js';
import { verifyToken } from './middleware/authMiddlewre.js';

dotenv.config(); // carrega as variáveis do .env

// Validação de variáveis de ambiente obrigatórias
const requiredEnvVars = ['MONGO_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ ERRO: Variáveis de ambiente obrigatórias não configuradas:');
  missingEnvVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Para configurar na Vercel:');
  console.error('   1. Acesse o painel da Vercel (https://vercel.com)');
  console.error('   2. Vá em Settings > Environment Variables');
  console.error('   3. Adicione as variáveis:', requiredEnvVars.join(', '));
  console.error('\n⚠️  O servidor pode não funcionar corretamente sem essas variáveis!');
}

const app = express();
app.use(cors());
app.use(express.json());

// Middleware para verificar variáveis de ambiente em produção
app.use((req, res, next) => {
  if (!process.env.MONGO_URL || !process.env.JWT_SECRET) {
    return res.status(500).json({
      message: 'Servidor não configurado corretamente. Variáveis de ambiente ausentes.',
      error: 'Missing environment variables',
      required: requiredEnvVars,
      missing: missingEnvVars,
    });
  }
  next();
});

// Configurações de conexão do MongoDB com timeout
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // Timeout de 10 segundos para seleção do servidor
  socketTimeoutMS: 45000, // Timeout de 45 segundos para operações
  connectTimeoutMS: 10000, // Timeout de 10 segundos para conexão inicial
  maxPoolSize: 10, // Máximo de conexões no pool
  minPoolSize: 1, // Mínimo de conexões no pool
  retryWrites: true,
  w: 'majority',
};

// Só tenta conectar se MONGO_URL estiver configurado
if (process.env.MONGO_URL) {
  mongoose.connect(process.env.MONGO_URL, mongooseOptions)
    .then(() => {
        console.log('✅ Conectado ao banco de dados MongoDB');
        console.log('📊 Estado da conexão:', mongoose.connection.readyState);
    })
    .catch(err => {
        console.error('❌ Erro ao conectar ao MongoDB:', err.message);
        console.error('🔍 Verifique se:');
        console.error('   1. A variável MONGO_URL está configurada na Vercel');
        console.error('   2. A URL do MongoDB está correta');
        console.error('   3. O MongoDB está acessível');
        console.error('   4. As credenciais estão corretas');
        console.error('   5. A conexão de internet está funcionando');
    });
} else {
  console.error('❌ MONGO_URL não configurada. Não é possível conectar ao banco de dados.');
}

// Eventos de conexão do MongoDB
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Erro na conexão do Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Mongoose desconectado do MongoDB');
});

// Tratamento de erros não capturados
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 Conexão MongoDB fechada devido ao encerramento da aplicação');
    process.exit(0);
});

// Middleware para verificar conexão com MongoDB
const checkMongoConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
            message: 'Serviço temporariamente indisponível. Banco de dados não conectado.',
            error: 'MongoDB connection not ready'
        });
    }
    next();
};

// rota de teste
app.get('/', (req, res) =>{
    res.send('Servidor rodando com Expres e MongoDB');
});

//intreração com o arduino
//trocar pela porta do arduino depois 

/*
const porta = new SerialPort({path:"com3", baudRete:9600});
const parser = porta.pipe(new RedlineParser ({delimiter: "\r\n"}));

parser.on("data", (data) =>{
    console.log("Mensagem no Arduino:", data);
});*/

//Criar remedios
app.post('/remedios', verifyToken, checkMongoConnection, async (req, res) => {
    try {
        const {
            nomeRemedio,
            dosagem,
            vezesPorDia,
            horarioInicial,
            quantidadeInicial,
        } = req.body;

        if (!nomeRemedio || !dosagem || !vezesPorDia || !horarioInicial || !quantidadeInicial) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const novoRemedio = new Remedio({
            nomeRemedio: nomeRemedio.toString().trim(),
            dosagem: dosagem.toString().trim(),
            vezesPorDia: vezesPorDia.toString().trim(),
            horarioInicial: horarioInicial.toString().trim(),
            quantidadeInicial: quantidadeInicial.toString().trim(),
            usuarioId: req.user.id,
        });

        await novoRemedio.save();

        res.status(201).json({ message: 'Remédio cadastrado com sucesso!', remedio: novoRemedio });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Atualizar remedio
app.put('/remedios/:id', verifyToken, checkMongoConnection, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nomeRemedio,
            dosagem,
            vezesPorDia,
            horarioInicial,
            quantidadeInicial,
        } = req.body;

        const remedio = await Remedio.findOne({ _id: id, usuarioId: req.user.id })
            .maxTimeMS(10000);

        if (!remedio) {
            return res.status(404).json({ message: 'Remédio não encontrado.' });
        }

        // Atualiza apenas os campos fornecidos
        if (nomeRemedio !== undefined) remedio.nomeRemedio = nomeRemedio.toString().trim();
        if (dosagem !== undefined) remedio.dosagem = dosagem.toString().trim();
        if (vezesPorDia !== undefined) remedio.vezesPorDia = vezesPorDia.toString().trim();
        if (horarioInicial !== undefined) remedio.horarioInicial = horarioInicial.toString().trim();
        if (quantidadeInicial !== undefined) remedio.quantidadeInicial = quantidadeInicial.toString().trim();

        await remedio.save();

        res.json({ message: 'Remédio atualizado com sucesso!', remedio });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Deletar remedio
app.delete('/remedios/:id', verifyToken, checkMongoConnection, async (req, res) => {
    try {
        const { id } = req.params;

        const remedio = await Remedio.findOneAndDelete({ _id: id, usuarioId: req.user.id })
            .maxTimeMS(10000);

        if (!remedio) {
            return res.status(404).json({ message: 'Remédio não encontrado.' });
        }

        res.json({ message: 'Remédio deletado com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Obter remedio por ID
app.get('/remedios/:id', verifyToken, checkMongoConnection, async (req, res) => {
    try {
        const { id } = req.params;

        const remedio = await Remedio.findOne({ _id: id, usuarioId: req.user.id })
            .maxTimeMS(10000)
            .lean();

        if (!remedio) {
            return res.status(404).json({ message: 'Remédio não encontrado.' });
        }

        res.json(remedio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//listar usuarios
app.post('/usuarios', checkMongoConnection, async (req, res) => {
    try {
        const { nome, login, senha } = req.body;

        if (!nome || !login || !senha) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
        }

        const normalizedLogin = login.toString().trim().toLowerCase();
        
        // Adiciona timeout explícito na query
        const existingUser = await Usuario.findOne({ login: normalizedLogin })
            .maxTimeMS(10000); // Timeout de 10 segundos para a query

        if (existingUser) {
            return res.status(409).json({ message: 'Login já está em uso. Escolha outro login.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha.toString(), salt);

        const novoUsuario = new Usuario({
            nome: nome.toString().trim(),
            login: normalizedLogin,
            senha: hashedPassword,
        });

        // Tenta salvar - se houver erro de duplicata (índice único), captura
        try {
            await novoUsuario.save();
        } catch (saveError) {
            // Se for erro de duplicata (E11000), retorna erro 409
            if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
                return res.status(409).json({ message: 'Login já está em uso. Escolha outro login.' });
            }
            // Se for outro erro, propaga
            throw saveError;
        }

        const { senha: _, ...usuarioSeguro } = novoUsuario.toObject();

        res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: usuarioSeguro });
    } catch (err) {
        console.error('Erro ao criar usuário:', err);
        res.status(500).json({ error: err.message || 'Erro ao criar usuário. Tente novamente.' });
    }
});

//listar remedios 
app.get('/remedios', verifyToken, checkMongoConnection, async (req, res) =>{
    try{
        const remedios = await Remedio.find({usuarioId: req.user.id})
            .sort({ nomeRemedio: 1 })
            .maxTimeMS(10000) // Timeout de 10 segundos para a query
            .lean(); // Usa lean() para melhor performance
        res.json(remedios)
    } catch(err){
        res.status(500).json({ error: err.message});
    }
});

app.get('/remedios/historico', verifyToken, checkMongoConnection, async (req, res) => {
    try {
        const historico = await Remedio.find({ usuarioId: req.user.id })
            .sort({ createdAt: -1 })
            .maxTimeMS(10000) // Timeout de 10 segundos para a query
            .lean(); // Usa lean() para melhor performance
        res.json(historico);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//login 
app.post('/login', checkMongoConnection, async (req, res) => {
    try {
        const { login, senha } = req.body;

        if (!login || !senha) {
            return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
        }

        // Adiciona timeout explícito na query
        const user = await Usuario.findOne({ login: login.toString().trim().toLowerCase() })
            .maxTimeMS(10000); // Timeout de 10 segundos para a query

        if (!user) {
            return res.status(400).json({ message: 'Usuário não encontrado.' });
        }

        const validPassword = await bcrypt.compare(senha, user.senha);

        if (!validPassword) {
            return res.status(400).json({ message: 'Senha incorreta. Tente novamente.' });
        }

        const token = jwt.sign(
            { id: user._id, nome: user.nome, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { senha: _, ...usuarioSeguro } = user.toObject();

        res.json({ token, usuario: usuarioSeguro });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//usuario logado
app.get('/auth/me', verifyToken, checkMongoConnection, async (req, res) => {
    try {
        // Adiciona timeout explícito na query
        const usuario = await Usuario.findById(req.user.id)
            .select('-senha')
            .maxTimeMS(10000); // Timeout de 10 segundos para a query

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json({ usuario });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*porta de servidor LOCALHOST:3000
 const port = 3000;
 app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
*/

export default app;