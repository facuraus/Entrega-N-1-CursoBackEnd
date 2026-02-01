const express = require('express');
const productsRouter = require('./routes/products.routes.js');
const cartsRouter = require('./routes/carts.routes.js');

const app = express();
const PORT = 8080;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Endpoints de los productos
app.use('/api/products', productsRouter);

//Endpoints de los productos
app.use('/api/carts', cartsRouter);
 

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});