const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // En producción se debería encriptar
  role: { 
    type: String, 
    enum: ['asistente', 'organizador', 'expositor', 'administrador'], 
    default: 'asistente' 
  },
  totpSecret: { type: String },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);