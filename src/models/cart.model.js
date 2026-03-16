const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'productos' 
            },
            quantity: { type: Number, default: 1 }
        }
    ]
});

// Este middleware se ejecuta automáticamente antes de cualquier findOne/findById
cartSchema.pre(['find', 'findOne', 'findById'], function() {
    this.populate('products.product');
});

module.exports = mongoose.model('carritos', cartSchema);