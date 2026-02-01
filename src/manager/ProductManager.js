const fs = require('fs/promises');
const path = require('path');

class ProductManager {

    static idCounter = 0;

    constructor(filePath) {
        this.path = path.resolve(__dirname, '..', 'data', filePath);
    }

    async getProducts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async getProductById(id) {
        try {
            const productos = await this.getProducts();

            const producto = productos.find(p => p.id === Number(id))
            return producto
        } catch {
            console.error("Error al buscar el producto por ID", error);
            throw error;
        }
    }

    async addProduct(productData) {
        try {
            const products = await this.getProducts();

            // Sincronizamos el contador estático con el ID más alto existente
            if (products.length > 0 && ProductManager.idCounter === 0) {
                console.log("BUSCO EL ID MAS GRANDE")
                console.log(...products.map(p => p.id))

                const maxId = Math.max(...products.map(p => p.id));
                ProductManager.idCounter = maxId;
            }

            ProductManager.idCounter++;

            const newProduct = {
                id: ProductManager.idCounter,
                ...productData,
                status: true
            };

            products.push(newProduct);

            // Guardamos en el archivo
            await fs.writeFile(this.path, JSON.stringify(products, null, 2));
            return newProduct;

        } catch (error) {
            console.error("Error al agregar producto", error);
            throw error;
        }
    }

    async updateProduct(id, datosActualizados) {
        try {
            const products = await this.getProducts();

            //BUSCO LA POSICION
            const pos = products.findIndex(p => p.id === Number(id));
            console.log(`\n --- EL PRODUCTO CON ID:${id} ES ---`)
            console.log(products[pos]);

            if (pos === -1) return null;

            const productoOriginal = products[pos];


            //REMPLAZO LOS DATOS QUE COINCIDEN
            console.log("\n --- LOS DATOS DEL BODY SON: ---");
            console.log(datosActualizados);

            const productoActualizado = {
                ...productoOriginal,
                ...datosActualizados,
                id: productoOriginal.id
            }

            console.log("\n --- EL PRODUCTO ACTUALIZADO QUEDO COMO: ---");
            console.log(productoActualizado);

            products[pos] = productoActualizado

            await fs.writeFile(this.path, JSON.stringify(products, null, 2));

            return products[pos];

        } catch (error) {
            console.error("Error al actualizar:", error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            console.log("\n--- ANTES DEL DELETE ---")
            const products = await this.getProducts();
            console.log(products)

            //veo si existe el prducto 
            //some() == alguno      
            const existe = products.some(p => p.id === Number(id));
            if (!existe) return false;

            //filter() crea un nuevo array con todos los elementos que cumplan la condición
            const productosFiltrado = products.filter(p => p.id !== Number(id));

            await fs.writeFile(this.path, JSON.stringify(productosFiltrado, null, 2));

            console.log("\n--- DESPUES DEL DELETE ---")
            console.log(productosFiltrado)

            return true;
        }catch (error) {
            console.error("Error al eliminar el producto", error);
            throw error;
        }

    }

}

module.exports = ProductManager;