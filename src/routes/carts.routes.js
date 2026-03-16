const express = require('express');
const router = express.Router();
const CartManager = require('../manager/CartManager.js');
const cartModel = require('../models/cart.model.js'); 
const modeloTicket = require('../models/ticket.model.js');
const modeloProducto = require('../models/product.model.js');

const cartManager = new CartManager();

// --- POST api/carts ---> Crea un nuevo carrito
router.post('/', async (req, res) => {
    try {
        const nuevoCarrito = await cartManager.crearCarrito();
        res.status(201).json({ status: "success", payload: nuevoCarrito });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// --- GET api/carts/:cid ---> Obtiene un carrito
router.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const carrito = await cartModel.findById(cid).populate('products.product').lean();
        
        if (!carrito) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
        res.json({ status: "success", payload: carrito });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// --- POST api/carts/:cid/products/:pid ---> Agrega producto
router.post('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const result = await cartManager.agregarProductosAlCarrito(cid, pid);
        if (!result) return res.status(404).json({ status: "error", message: "Error al agregar producto" });
        res.json({ status: "success", payload: result });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// --- PUT api/carts/:cid/products/:pid ---> Actualizar cantidad
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;
        if (!quantity || isNaN(quantity)) return res.status(400).json({ status: "error", message: "Cantidad inválida" });

        const result = await cartModel.findOneAndUpdate(
            { _id: cid, "products.product": pid },
            { $set: { "products.$.quantity": quantity } },
            { returnDocument: 'after' } 
        );
        res.json({ status: "success", payload: result });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// --- DELETEs ---
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const result = await cartManager.eliminarProductoDelCarrito(cid, pid);
        res.json({ status: "success", message: "Producto eliminado", payload: result });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const result = await cartManager.vaciarCarrito(cid);
        res.json({ status: "success", payload: result });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// ---  FINALIZAR  ---
router.post('/:cid/finalizar', async (req, res) => {
    try {
        const { cid } = req.params;
        
        const carrito = await cartModel.findById(cid).populate('products.product');

        if (!carrito || carrito.products.length === 0) {
            return res.status(400).json({ status: "error", mensaje: "El carrito no tiene productos" });
        }

        const itemsAceptados = [];
        const itemsRechazados = [];
        let totalFacturado = 0;

        for (const item of carrito.products) {
            const prodBD = item.product;

            if (prodBD.stock >= item.quantity) {
                totalFacturado += prodBD.price * item.quantity;
                
                await modeloProducto.findByIdAndUpdate(prodBD._id, {
                    $inc: { stock: -item.quantity }
                });

                itemsAceptados.push({
                    titulo: prodBD.title,
                    cantidad: item.quantity,
                    precio: prodBD.price
                });
            } else {
                itemsRechazados.push(item);
            }
        }

        if (itemsAceptados.length === 0) {
            return res.status(400).json({ 
                status: "error", 
                mensaje: "No hay stock para procesar ningún producto" 
            });
        }

        const nuevaBoleta = await modeloTicket.create({
            monto_total: totalFacturado,
            productos_comprados: itemsAceptados
        });

        await cartModel.findByIdAndUpdate(cid, { 
            products: itemsRechazados.map(i => ({
                product: i.product._id,
                quantity: i.quantity
            }))
        });

        const io = req.app.get('socketio');
        if (io) {
            const productosActualizados = await modeloProducto.find().lean();
            io.emit('updateProducts', productosActualizados);
        }

        res.json({ 
            status: "success", 
            mensaje: "¡Compra confirmada!",
            boleta: nuevaBoleta,
            pendientes: itemsRechazados.map(i => i.product.title)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", mensaje: error.message });
    }
});

module.exports = router;