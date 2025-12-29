const mongoose = require('mongoose');

const registroSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    token: {
        type: String,
        required: true,
    },
    pixel: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        required: true,
    },
    fbclid: String,
    fbclidTimestamp: {
        type: Date,
        default: null
    },
    eventSentToMeta: {
        type: Boolean,
        default: false
    },
    lastEventSentAt: {
        type: Date,
        default: null
    },
    mensaje: String,
    kommoAccount: {
        type: String,
    },
    whatsappNumber: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pendiente', 'verificado', 'fallido'],
        default: 'pendiente'
    },
    verificationError: {
        tipo: String,
        mensaje: String,
        timestamp: Date
    },
    leadId: {
        type: String,
    },
});

module.exports = mongoose.model('RegistroCash', registroSchema);