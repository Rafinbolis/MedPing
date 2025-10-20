const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    nome: { type :String, required: true, unique : true },
    email:{ type :String, required: true, unique : true },
    senha:{ type :String, required: true, unique : true },
    idade:{ type :String, required: true},
});

module.exports = mongoose.model('Usuario', UsuarioSchema);