require('dotenv').config();
const express = require('express');
const { engine } = require('express-handlebars');
const { Server } = require('socket.io');
const path = require('path');

const mongoose = require('mongoose');

const productModel = require('./models/product.model.js');

// 1. Importa clase ProductManager 
const ProductManager = require('./manager/ProductManager.js'); 
const manager = new ProductManager(); 

const productsRouter = require('./routes/products.routes.js');
const cartsRouter = require('./routes/carts.routes.js');
const viewsRouter = require('./routes/views.router.js');

const app = express();
const PORT = process.env.PORT || 8080; // Usa el puerto del .env o el 8080


// --- CONFIGURACIÓN DE MONGODB ATLAS ---
const MONGO_URL = process.env.MONGO_URL; 

mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Conectado exitosamente a MongoDB ATLAS (Nube)"))
    .catch(error => {
        console.error("❌ Error de conexión a Atlas:", error);
        process.exit();
    });

// 2. Handlebars
app.engine('handlebars', engine({
    helpers: {
        multiply: (a, b) => a * b,
        gt: (a, b) => a > b,
        lte: (a, b) => a <= b
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
    partialsDir: path.resolve(__dirname, 'views/components') 
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CONFIGURACIÓN DE CARPETAS ESTÁTICAS
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 3. INYECTAR EL MANAGER 
app.set('productManager', manager);

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

const httpServer = app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// --- SOCKET.IO ---
const io = new Server(httpServer);
app.set('socketio', io);

io.on('connection', async (socket) => {
    console.log('📱 Cliente conectado al sistema de productos');

    try {
        const products = await productModel.find().lean();
        socket.emit('updateProducts', products);

        socket.on('addProduct', async (newProd) => {
            try {
                await productModel.create(newProd);
                const updatedList = await productModel.find().lean();
                io.emit('updateProducts', updatedList);
            } catch (err) {
                console.error("Error al guardar en DB:", err.message);
            }
        });

        socket.on('deleteProduct', async (id) => {
            try {
                await productModel.findByIdAndDelete(id);
                const updatedList = await productModel.find().lean();
                io.emit('updateProducts', updatedList);
            } catch (err) {
                console.error("Error al eliminar de DB:", err.message);
            }
        });

        socket.on('updateStockDirect', async ({ id, newStock }) => {
            try {
                await productModel.findByIdAndUpdate(id, { stock: newStock });
                const updatedList = await productModel.find().lean();
                io.emit('updateProducts', updatedList);
            } catch (err) {
                console.error("Error al actualizar stock en DB:", err.message);
            }
        });

    } catch (error) {
        console.error("Error en el socket:", error);
    }
});