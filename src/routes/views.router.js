const express = require('express');
const router = express.Router();
const productModel = require('../models/product.model.js');
const cartModel = require('../models/cart.model.js');
const modeloTicket = require('../models/ticket.model.js');

// REDIRECCIÓN RAÍZ
router.get('/', (req, res) => {
    res.redirect('/products');
});

// CATÁLOGO DE PRODUCTOS (PAGINADO)
router.get('/products', async (req, res) => {
    try {
        let { page = 1, limit = 10, sort, category, title, status } = req.query;
        
        let filter = {};

        // Filtro por Disponibilidad (SOLO EN STOCK)
        if (status === 'true') {
            filter.stock = { $gt: 0 }; 
        }

        // Filtro por texto
        if (title) {
            filter.title = { $regex: title, $options: 'i' }; 
        }

        // Filtro por categorías
        if (category) {
            const categoriesArray = category.split(',');
            filter.category = { $in: categoriesArray };
        }

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            lean: true,
            sort: sort ? { price: sort === 'asc' ? 1 : -1 } : {}
        };

        const result = await productModel.paginate(filter, options);

        const baseUrl = `/products?limit=${limit}&sort=${sort || ''}&category=${category || ''}&title=${title || ''}&status=${status || ''}`;
        
        result.prevLink = result.hasPrevPage ? `${baseUrl}&page=${result.prevPage}` : null;
        result.nextLink = result.hasNextPage ? `${baseUrl}&page=${result.nextPage}` : null;

        res.render('home', { 
            productos: result.docs, 
            pagination: result 
        });
    } catch (error) {
        console.error("Error en views router:", error);
        res.status(500).render('error', { error: "Error al filtrar catálogo" });
    }
});

router.get('/carts', (req, res) => {
    res.send(`
        <script>
            const cartId = localStorage.getItem('cartId');
            if (cartId && cartId !== "undefined") {
                window.location.href = '/carts/' + cartId;
            } else {
                alert('No tienes un carrito activo. Agrega un producto primero.');
                window.location.href = '/products';
            }
        </script>
    `);
});

// 4. VISTA DE UN CARRITO ESPECÍFICO
router.get('/carts/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        
        // Validación de ObjectId de MongoDB
        if (!cid.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).render('error', { error: "ID de carrito inválido" });
        }

        const carrito = await cartModel.findById(cid).populate('products.product').lean();
        
        if (!carrito) {
            return res.status(404).render('error', { 
                error: "El carrito ya no existe. Por favor, vuelve a la tienda y agrega un producto." 
            });
        }

        res.render('cart', { 
            cartId: cid, 
            productos: carrito.products 
        });
    } catch (error) {
        console.error("Error al obtener carrito:", error);
        res.status(500).render('error', { error: "Error interno al obtener el carrito" });
    }
});

// 5. DETALLE DE PRODUCTO
router.get('/products/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        
        if (!pid.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).render('error', { error: "ID de producto inválido" });
        }

        const producto = await productModel.findById(pid).lean();
        if (!producto) return res.status(404).render('error', { error: "Producto no encontrado" });
        
        res.render('productDetail', { producto });
    } catch (error) {
        res.status(500).render('error', { error: "Error al cargar detalle del producto" });
    }
});

// 6. REAL TIME PRODUCTS
router.get('/realtimeproducts', async (req, res) => {
    res.render('realTimeProducts');
});

router.get('/historial', async (req, res) => {
    try {
        // Traemos todos los tickets, ordenados del más nuevo al más viejo
        const tickets = await modeloTicket.find().lean().sort({ fecha_compra: -1 });

        res.render('historial', { 
            tickets,
            title: "Mi Historial de Compras",
            style: "index.css"
        });
    } catch (error) {
        console.error("Error al cargar historial:", error);
        res.status(500).send("Error al cargar el historial de compras");
    }
});

module.exports = router;