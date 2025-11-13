import mongoose from 'mongoose';
import Usuario from './Usuario.js';

export const RemedioSchema = new mongoose.Schema(
    {
        nomeRemedio: { type: String, required: true, trim: true },
        dosagem: { type: String, required: true, trim: true },
        vezesPorDia: { type: String, required: true, trim: true },
        horarioInicial: { type: String, required: true, trim: true },
        quantidadeInicial: { type: String, required: true, trim: true },
        usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: Usuario, required: true },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Remedio', RemedioSchema);