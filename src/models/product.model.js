const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'El título es obligatorio'],
        trim: true 
    },
    description: { 
        type: String, 
        required: [true, 'La descripción es obligatoria'] 
    },
    price: { 
        type: Number, 
        required: [true, 'El precio es obligatorio'],
        min: [0, 'El precio no puede ser un valor negativo'] 
    },
    status: { 
        type: Boolean, 
        default: true 
    },
    stock: { 
        type: Number, 
        required: [true, 'El stock es obligatorio'],
        min: [0, 'El stock no puede ser negativo'],
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} debe ser un número entero (no se aceptan decimales)'
        }
    },
    category: { 
        type: String, 
        required: [true, 'La categoría es obligatoria'],
        index: true
    },
    thumbnails: { 
        type: [String], 
        default: [] 
    },
    code: { 
        type: String, 
        unique: true, 
        required: [true, 'El código es obligatorio'] 
    }
}, {
    timestamps: true 
});

// Aplicar el plugin para habilitar el método .paginate()
productSchema.plugin(mongoosePaginate);

const productModel = mongoose.model('productos', productSchema);
module.exports = productModel;