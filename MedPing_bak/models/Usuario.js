import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema(
    {
        nome: { type: String, required: true, trim: true },
        login: { type: String, required: true, unique: true, lowercase: true, trim: true },
        senha: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Usuario', UsuarioSchema);