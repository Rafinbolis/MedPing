const express = require('express');
const mongoose = require('mongoose');
const app = express();
const jwt = require( 'jsonwebtoken');
const bcrypt = require('bcryptjs')
const Usuario = require('./models/Usuario.js');
const Remedio = require('./models/Remedios.js');
const {verifyToken} = require('./middleware/authMiddlewre.js');
import dotenv from 'dotenv';
dotenv.config()


app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
    .then(()=> console.log('Conectado ao banco de dados'))
    .catch(err => console.error('Erro ao conectar', err));

// rota de teste
app.get('/', (req, res) =>{
    res.send('Servidor rodando com Expres e MongoDB');
});



//Criar remedios
app.post('/remedios', async (req, res) => {
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

// criar usuário 
app.post('/usuarios', async (req, res) => {
    const novoUsuario = new Usuario(req.body);
    await novoUsuario.save();
    res.json({message: 'Usuario criado com sucesso!', usuario: novoUsuario});
});

//listar usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const {nome, email, senha, idade} = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);
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
        if (!user) return res.status(400).json({message: 'Usuario não encontrado(a)'});
        
        const validPassword = await bcrypt.compare(senha, Usuario.senha );
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