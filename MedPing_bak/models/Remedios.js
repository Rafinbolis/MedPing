import mongoose from 'mongoose';
import Usuario from './Usuario.js';

export const RemedioSchema = new mongoose.Schema ({
    nomeRemedio: String,
    dosagem: String,
    horarioInicial: String,
    intervalo: String, 
    quantidadeInicial: String,
    usuarioId: {type: mongoose.Schema.Types.ObjectId, ref: Usuario, required: true}
});

export default mongoose.model('Remedio', RemedioSchema);