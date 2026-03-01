const express = require('express'); 
const router = express.Router();    

router.get('/', async (req, res) => {
    try {
        const manager = req.app.get('productManager');
        const productosOriginales = await manager.getProducts();
        
        //console.log("Productos recuperados del manager:", productosOriginales);

        // Convertimos a objetos planos para evitar restricciones de Handlebars
        const productos = productosOriginales.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            price: p.price,
            thumbnails: p.thumbnails,
            stock: p.stock,
            category: p.category
        }));

        res.render('home', { productos });
    } catch (error) {
        res.status(500).send("Error al renderizar la vista");
    }
});

router.get('/realtimeproducts', async (req, res) => {
    try {
        const manager = req.app.get('productManager');
        const productosOriginales = await manager.getProducts();
        
        const productos = productosOriginales.map(p => ({ ...p }));

        // Renderizamos la vista específica
        res.render('realTimeProducts', { productos });
    } catch (error) {
        res.status(500).send("Error al cargar la vista en tiempo real");
    }
});

module.exports = router;