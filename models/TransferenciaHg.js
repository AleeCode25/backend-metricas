const mongoose = require("mongoose");

const transferenciaHgSchema = new mongoose.Schema({
  transaccionId: { type: String, required: true, unique: true },
  monto: { type: Number, required: true },
  coelsaCode: { type: String, required: true },
  remitente: { type: String, required: true },
  cuit: { type: String, required: true }, 
  
  // --- DATOS PANEL ---
  estado: { type: String, default: "PENDIENTE" }, // PENDIENTE, EN_PROCESO, CARGADA
  cajeroAsignado: { type: String, default: null }, 
  usuarioCasino: { type: String, default: null },
  conBono: { type: Boolean, default: false },
  montoBono: { type: Number, default: 0 },
  
  fechaIngreso: { type: Date, default: Date.now },
  fechaCarga: { type: Date, default: null }
});

module.exports = mongoose.model("TransferenciaHg", transferenciaHgSchema);