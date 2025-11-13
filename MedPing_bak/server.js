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

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URL)
    .then(()=> console.log('Conectado ao banco de dados'))
    .catch(err => console.error('Erro ao conectar', err));

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
app.post('/remedios', verifyToken, async (req, res) => {
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


//listar usuarios
app.post('/usuarios', async (req, res) => {
    try {
        const { nome, login, senha } = req.body;

        if (!nome || !login || !senha) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
        }

        const normalizedLogin = login.toString().trim().toLowerCase();
        const existingUser = await Usuario.findOne({ login: normalizedLogin });

        if (existingUser) {
            return res.status(409).json({ message: 'Login já está em uso.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha.toString(), salt);

        const novoUsuario = new Usuario({
            nome: nome.toString().trim(),
            login: normalizedLogin,
            senha: hashedPassword,
        });

        await novoUsuario.save();

        const { senha: _, ...usuarioSeguro } = novoUsuario.toObject();

        res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: usuarioSeguro });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//listar remedios 
app.get('/remedios', verifyToken, async (req, res) =>{
    try{
        const remedios = await Remedio.find({usuarioId: req.user.id}).sort({ nomeRemedio: 1 });
        res.json(remedios)
    } catch(err){
        res.status(500).json({ error: err.message});
    }
});

app.get('/remedios/historico', verifyToken, async (req, res) => {
    try {
        const historico = await Remedio.find({ usuarioId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(historico);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//login 
app.post('/login', async (req, res) => {
    try {
        const { login, senha } = req.body;

        if (!login || !senha) {
            return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
        }

        const user = await Usuario.findOne({ login: login.toString().trim().toLowerCase() });

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
app.get('/auth/me', verifyToken, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user.id).select('-senha');

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