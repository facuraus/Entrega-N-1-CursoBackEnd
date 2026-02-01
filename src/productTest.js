const ProductManager = require('./manager/ProductManager'); // Ajusta la ruta a tu Manager
const manager = new ProductManager('products.json');

// --- PRUEBA: AGREGAR PRODUCTO ---
async function probandoAdd() {
    try {
        console.log("\n--- Probando el Add de Producto ---");
        const nuevoProd = {
            title: "Producto de Prueba",
            description: "Descripción del producto",
            price: 1500,
            thumbnail: "sin imagen",
            code: "P001",
            stock: 25
        };
        const resultado = await manager.addProduct(nuevoProd);
        console.log("Producto agregado:", resultado);
    } catch (error) {
        console.error("Error en addProduct:", error);
    }
}

// --- PRUEBA: OBTENER TODOS ---
async function probandoGetProducts() {
    try {
        console.log("\n--- Probando Obtener Todos los Productos ---");
        const productos = await manager.getProducts();
        console.log("Lista de productos:", productos);
    } catch (error) {
        console.error("Error en getProducts:", error);
    }
}

// --- PRUEBA: OBTENER POR ID ---
async function probandoGetById(id) {
    try {
        console.log(`\n--- Probando Get ID: ${id} ---`);
        const producto = await manager.getProductById(id);
        if (producto) {
            console.log("Producto encontrado:", producto);
        } else {
            console.log("Producto no encontrado.");
        }
    } catch (error) {
        console.error("Error en getProductById:", error);
    }
}

// --- TUS FUNCIONES ORIGINALES ---
async function probandoManager(id, data) {
    try {
        console.log("\n--- Probando el Update del Producto ---");
        const actualizado = await manager.updateProduct(id, data);
        console.log("Resultado update:", actualizado);
    } catch (error) {
        console.error("Hubo un error en la prueba:", error);
    }
}

async function probandoDelete(param) {
    try {
        console.log("\n--- Probando el Delete del Producto ---");
        const borrado = await manager.deleteProduct(param);
        console.log(borrado ? "Borrado exitoso" : "No se pudo borrar (ID inexistente)");
    } catch (error) {
        console.error("Error en delete:", error);
    }
}

// --- EJECUCIÓN ---
// Puedes comentar o descomentar las que necesites probar:

// probandoAdd();
// probandoGetProducts();
// probandoGetById(1);
// probandoManager(1, { price: 999 });
probandoDelete(5);