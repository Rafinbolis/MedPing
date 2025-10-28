const mongoose = require('mongoose');
const Usuario = require('./Usuario');

const RemedioSchema = new mongoose.Schema ({
    nomeRemedio: String,
    dosagem: String,
    horarioInicial: String,
    intervalo: String, 
    quantidadeInicial: String,
    usuarioId: {type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true}
});

module.exports = mongoose.model('Remdio', RemedioSchema);