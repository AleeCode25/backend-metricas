const mongoose = require("mongoose");

const UsuarioPanelSchema = new mongoose.Schema({
    usuario: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true,
        lowercase: true
    },
    contrasena: { 
        type: String, 
        required: true 
    },
    numeros: { 
        type: [String], 
        default: [] 
    }
}, { 
    timestamps: true,
    collection: 'usuariosPanel' // 🔥 Esto fuerza a Mongoose a usar exactamente este nombre de colección
});

module.exports = mongoose.model("UsuarioPanel", UsuarioPanelSchema);