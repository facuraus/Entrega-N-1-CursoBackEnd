const express = require('express');
const router = express.Router();
const CartManager = require('../manager/CartManager');

const cartManager = new CartManager('carts.json');

router.post('/', async (req,res)=>{
    try{
        const nuevoCarrito = await cartManager.crearCarrito({}); 

        res.status(201).json({
            status: "success",
            message: "Carrito creado exitosamente",
            payload: nuevoCarrito
        })
    }catch (error) {
        res.status(500).json({
            status: "error",
            message: "No se pudo crear el carrito"
        });
    }
});

router.get('/:cid', async (req,res)=>{
    try{
    const {cid} = req.params;
    const carrito = await cartManager.getCarritoById(cid)

    if (!carrito) {
        return res.status(404).json({
            status: "error",
            message: "El carrito solicitado no existe"
        });
    }

    res.json({
        status: "success",
        payload: carrito.products 
    });

    }catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error al obtener los productos del carrito"
        });
    }

});

router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        
        // Llamamos al manager pasando ambos IDs
        const carritoActualizado = await cartManager.agregarProductoAlCarrito(cid, pid);

        if (!carritoActualizado) {
            return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
        }

        res.status(200).json({
            status: "success",
            message: "Producto agregado al carrito",
            payload: carritoActualizado
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

module.exports = router;    