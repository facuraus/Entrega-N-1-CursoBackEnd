const express = require('express');
const { engine } = require('express-handlebars');
const { Server } = require('socket.io');
const path = require('path');

// Importa tu clase ProductManager (ajusta la ruta según tu proyecto)
const ProductManager = require('../src/manager/ProductManager.js'); 
const manager = new ProductManager('products.json');

const productsRouter = require('./routes/products.routes.js');
const cartsRouter = require('./routes/carts.routes.js');
const viewsRouter = require('./routes/views.router.js');

const app = express();
const PORT = 8080;

// Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'assets')));

app.set('productManager', manager);

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

const httpServer = app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Socket.io
const io = new Server(httpServer);
app.set('socketio', io);

io.on('connection', async (socket) => {
    console.log('Nuevo cliente conectado');

    // 1. Enviar productos al conectarse
    const products = await manager.getProducts();
    socket.emit('updateProducts', products);

    // 2. Escuchar creación de producto desde el cliente
    socket.on('addProduct', async (newProd) => {
        await manager.addProduct(newProd);
        const updatedList = await manager.getProducts();
        io.emit('updateProducts', updatedList); // Emitir a todos
    });

    // 3. Escuchar eliminación de producto
    socket.on('deleteProduct', async (id) => {
        await manager.deleteProduct(id);
        const updatedList = await manager.getProducts();
        io.emit('updateProducts', updatedList); // Emitir a todos
    });
});