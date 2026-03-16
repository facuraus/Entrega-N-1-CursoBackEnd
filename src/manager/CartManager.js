const cartModel = require('../models/cart.model.js');

class CartManager {
    constructor() { }

    async getCarritos() {
        try { 
            return await cartModel.find().lean(); 
        } catch (error) { 
            return []; 
        }
    }

    async crearCarrito() {
        try {
            return await cartModel.create({ products: [] });
        } catch (error) { 
            throw error; 
        }
    }

    async getCarritoById(cid) {
        try {
            // El .populate es clave para que la vista vea los nombres y precios
            return await cartModel.findById(cid).populate('products.product').lean();
        } catch (error) { 
            throw error; 
        }
    }

    async agregarProductosAlCarrito(cid, pid) {
        try {
            const carrito = await cartModel.findById(cid);
            if (!carrito) return null;

            const indiceProducto = carrito.products.findIndex(p => {
                const idEnCarrito = p.product._id ? p.product._id.toString() : p.product.toString();
                return idEnCarrito === pid.toString();
            });

            if (indiceProducto !== -1) {
                carrito.products[indiceProducto].quantity += 1;
            } else {
                carrito.products.push({ product: pid, quantity: 1 });
            }

            // AVISO A MONGOOSE: Esto es vital para que detecte el cambio en el array
            carrito.markModified('products'); 

            await carrito.save();
            return carrito;
        } catch (error) { 
            console.error("Error al guardar en Mongo:", error);
            throw error; 
        }
    }

    async eliminarProductoDelCarrito(cid, pid) {
        try {
            return await cartModel.findByIdAndUpdate(
                cid,
                { $pull: { products: { product: pid } } },
                { returnDocument: 'after' }
            );
        } catch (error) { 
            throw error; 
        }
    }

    async vaciarCarrito(cid) {
        try {
            return await cartModel.findByIdAndUpdate(
                cid,
                { $set: { products: [] } },
                { returnDocument: 'after' }
            );
        } catch (error) { 
            throw error; 
        }
    }

    async actualizarCantidad(cid, pid, nuevaCantidad) {
        try {
            const carrito = await cartModel.findById(cid);
            const indice = carrito.products.findIndex(p => p.product.toString() === pid.toString());
            
            if (indice !== -1) {
                carrito.products[indice].quantity = nuevaCantidad;
                carrito.markModified('products');
                await carrito.save();
            }
            return carrito;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CartManager;