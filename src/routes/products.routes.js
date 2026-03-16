const express = require('express');
const router = express.Router();
const ProductManager = require('../manager/ProductManager');
const productModel = require('../models/product.model');
const multer = require('multer');
const path = require('path');

const productManager = new ProductManager();

// GET /api/products/
router.get('/', async (req, res) => {
    try {

        let { limit = 10, page = 1, sort, query, status, category, title } = req.query;

        const filter = {};

        if (query) {
            filter.$or = [
                { category: { $regex: query, $options: 'i' } },
                { title: { $regex: query, $options: 'i' } }
            ];
        }

        if (status === 'true') filter.stock = { $gt: 0 };
        if (category) filter.category = { $in: category.split(',') };
        if (title) filter.title = { $regex: title, $options: 'i' };

        const options = {
            limit: parseInt(limit),
            page: parseInt(page),
            lean: true,
            sort: sort ? { price: sort === 'asc' ? 1 : -1 } : {}
        };

        const result = await productModel.paginate(filter, options);

        const baseUrl = `/api/products?limit=${limit}&sort=${sort || ''}&query=${query || ''}&status=${status || ''}&category=${category || ''}&title=${title || ''}`;

        res.json({
            status: "success",
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `${baseUrl}&page=${result.prevPage}` : null,
            nextLink: result.hasNextPage ? `${baseUrl}&page=${result.nextPage}` : null
        });

    } catch (error) {
        console.error("Error en GET /api/products:", error);
        res.status(500).json({
            status: "error", // <-- SIEMPRE 'error' en el catch
            message: error.message
        });
    }
});

// Get/api/products/:pid
router.get('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const producto = await productManager.getProductById(pid);

        if (!producto) {
            return res.status(404).json({ status: "error", message: "Producto no encontrado" });
        }

        res.json({ status: "success", payload: producto });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error al buscar el producto" });
    }
});

// Configuración Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../assets/img'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// POST /api/products 
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, description, code, price, stock, category } = req.body;

        // Validamos que los campos requeridos por el Schema estén presentes
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: "error", message: "Faltan campos obligatorios" });
        }

        const imageName = req.file ? req.file.filename : 'default.png';

        const nuevoProducto = await productManager.addProduct({
            title,
            description,
            code,
            price: Number(price),
            stock: Number(stock),
            category,
            thumbnails: [imageName],
            status: true
        });

        const io = req.app.get('socketio');
        const updatedProducts = await productManager.getProducts();
        io.emit('updateProducts', updatedProducts);

        res.status(201).json({ status: "success", payload: nuevoProducto });
    } catch (error) {
        console.error("Error al crear producto:", error);

        // Manejo específico para códigos duplicados (error 11000 de Mongo)
        if (error.code === 11000) {
            return res.status(400).json({ status: "error", message: `El código "${req.body.code}" ya existe.` });
        }

        res.status(500).json({ status: "error", message: error.message });
    }
});

router.put("/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const datosDelBody = req.body;

        const productoActualizado = await productManager.updateProduct(pid, datosDelBody);

        if (!productoActualizado) {
            return res.status(404).json({
                status: "error",
                message: "Producto no encontrado"
            });
        }

        res.json({
            status: "success",
            message: "Producto actualizado",
            payload: productoActualizado
        });


    } catch (error) {
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

        const io = req.app.get('socketio');
        const updatedProducts = await productManager.getProducts();
        io.emit('updateProducts', updatedProducts);

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