import express from 'express';
import mongoose from 'mongoose';
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
const port = new SerialPort({path:"com3", baudRete:9600});
const parser = port.pipe(new RedlineParser ({delimiter: "\r\n"}));

parser.on("data", (data) =>{
    console.log("Mensagem no Arduino:", data);
});

//Criar remedios
app.post('/remedios',verifyToken, async (req, res) => {
    try{
        const novoRemedio = new Remedio({
            ...req.body,
            usuarioId: req.user.id //token codificado
        });
        await novoRemedio.save();
        res.json({ message : "Remedio cadastrado com sucesso!", remedio: novoRemedio});
    } catch (err){
        res.status(500).json({ error: err.message});
    }
});


//listar usuarios
app.post('/usuarios', async (req, res) => {
    try {
        const {nome, email, senha, idade} = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha.toString(), salt);
        const novoUsuario = new Usuario ({
            nome,
            email,
            senha: hashedPassword,
            idade,
        })
        await novoUsuario.save();
        res.json({ message: 'Usuario criado com sucesso!', usuario: novoUsuario});
    } catch(err){
        res.status(500).json({ error: err.message});
    }
});

//listar remedios 
app.get('/remedios', verifyToken, async (req, res) =>{
    try{
        const remedios = await Remedio.find({usuarioId: req.user.id});
        res.json(remedios)
    } catch(err){
        res.status(500).json({ error: err.message});
    }
});

//login 
app.post('/login', async (req, res) => {
    try {
        const { email, senha} = req.body;
        const  user = await Usuario.findOne({ email });

        if (!user) return res.status(400).json({message: 'Usuario não encontrado(a)!'});
        
        const validPassword = await bcrypt.compare(senha, user.senha );
        if (!validPassword) return res.status(400).json({message: "Senha incorreta, tente de novo "});
        //gera um token JWT 
        const  token = jwt.sign(
            { id: user._id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
    
});

//porta de servidor 
const port = 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));