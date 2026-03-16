const mongoose = require('mongoose');

const esquemaTicket = new mongoose.Schema({
    codigo: { 
        type: String, 
        unique: true, 
        required: true,
        default: () => `BOL-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
    },
    fecha_compra: { type: Date, default: Date.now },
    monto_total: { type: Number, required: true },
    productos_comprados: { type: Array, default: [] } 
});

module.exports = mongoose.model('tickets', esquemaTicket);