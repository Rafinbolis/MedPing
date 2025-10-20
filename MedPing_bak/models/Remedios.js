const mongoose = require('mongoose');

const RemedioSchema = new mongoose.Schema ({
    nome: String,
    dosagem: String,
    horarioInicial: String,
    intervalo: String, 
    quantidade: String
});

module.exports = mongoose.model('Remdio', RemedioSchema);