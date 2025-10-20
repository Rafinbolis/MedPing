const express = require('express');
const mongoose = require('mongoose');
const app = express();
import jtw from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';


app.use(express.json());

mongoose.connect('mongodb://localhost:27017/Medping')
.then(()=> console.log('Conectado ao banco de dados'))
.catch(err => console.error('Erro ao conectar', err));

// rota de teste
app.get('/', (req, res) =>{
    res.send('Servidor rodando com Expres e MongoDB');
});

const Usuario = require('./models/Usuario');
const Remedio = require('./models/Remedios')

//Criar remedios
app.post('/remedios', async (req, res) => {
    const novoRemedio = new Remedio(req.body);
    await novoRemedio.save();
    res.json({message: 'Remedio cadastrado com sucesso!', remedio: novoRemedio});
})

// criar usuário 
app.post('/usuarios', async (req, res) => {
    const novoUsuario = new Usuario(req.body);
    await novoUsuario.save();
    res.json({message: 'Usuario criado com sucesso!', usuario: novoUsuario});
});

//listar usuarios
app.get('/usuarios', async (req, res) => {
    const usuarios = await Usuario.find();
    res.json(usuarios);
});

//listar remedios 
app.get('/remedios', async (req, res) =>{
    const remedios = await Remedio.find();
    res.json(remedios);
})

//login 
app.post('/login', async (req, res) => {
    try {
        const { email, senha} = req.body;

        const  user = await Usuario.findOne({ email });
        if (!Usuario) return res.status(400).json({message: 'Usuario não encontrado(a)'});
        
        const validPassword = await bcrypt.compare(senha, Usuario.senha );
        if (!validPassword) return res.status(400).json({message: "Senha incorreta, tente de novo "});

        //gera um token JWT 
        const  token = jwt.sign(
            { id: user._id, email: user.email},
            process.env.JWT_SECRET,
            {expireId: "7d"}
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
    
});

//porta de servidor 
const port = 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));