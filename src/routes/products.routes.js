const express = require('express');
const router = express.Router();
const ProductManager = require('../manager/ProductManager');

const productManager = new ProductManager('products.json');

// GET /api/products/
router.get('/', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.json({ status: "success", payload: products });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error al obtener los productos" });
    }
});

// Get/api/products/:pid
router.get('/:pid', async (req,res) =>{
    try{
    const {pid} = req.params;
    const producto = await productManager.getProductById(pid);

    if(!producto){
        return res.status(404).json({ status: "error", message: "Producto no encontrado" });    
    }

    res.json({ status: "success", payload: producto });
    }catch (error){
        res.status(500).json({ status: "error", message: "Error al buscar el producto" });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, description, code, price, stock, category, thumbnails } = req.body;

        // Validación básica de campos obligatorios
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: "error", message: "Faltan campos obligatorios" });
        }

        const nuevoProducto = await productManager.addProduct({
            title,
            description,
            code,
            price,
            stock,
            category,
            thumbnails: thumbnails || []
        });

        res.status(201).json({ status: "success", data: nuevoProducto });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
});

router.put("/:pid", async (req,res)=>{
    try{
        const {pid} = req.params;
        const datosDelBody= req.body;

        const productoActualizado = await productManager.updateProduct(pid, datosDelBody);

        if (!productoActualizado) {
            return res.status(404).json({ 
                status: "error", 
                message: "Producto no encontrado" 
            });
        }

        // Si todo salió bien, respondemos con el producto ya cambiado
        res.json({ 
            status: "success", 
            message: "Producto actualizado", 
            payload: productoActualizado 
        });
        

    }catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ 
            status: "error", 
            message: "Error interno al actualizar el producto"  
        });
    }
})

// DELETE /api/products/:pid
router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;

        const resultado = await productManager.deleteProduct(pid);

        if (!resultado) {
            return res.status(404).json({ 
                status: "error", 
                message: "No se pudo eliminar: Producto no encontrado" 
            });
        }

        res.json({ 
            status: "success", 
            message: `Producto con ID ${pid} eliminado correctamente` 
        });

    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error interno al eliminar el producto" 
        });
    }
});

module.exports = router;    