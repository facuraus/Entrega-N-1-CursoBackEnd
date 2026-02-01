const fs = require('fs/promises');
const path = require('path');

class CartManager {
    static idCounter = 0;

    constructor(filePath) {
        this.path = path.resolve(__dirname, '..', 'data', filePath);
    }

    async getCarritos (){
        try{
            const carritos = await fs.readFile(this.path,'utf-8');
            return JSON.parse(carritos);
        }catch (error){
            console.log("algo salio mal en getCarritos")
            return [];
        }
    }

    async crearCarrito (){
        try{
        const carritos = await this.getCarritos()
        console.log("\n --- Los CARRITOS EXISTENTES SON: --- \n")
        console.log(carritos);

        //busco el ID mas alto y lo incremento 
        if(carritos.length >0 && CartManager.idCounter ===0){
            console.log("\n LISTA DE IDs: \n");
            console.log(carritos.map(p => p.id));
           
            const idMasAlto = Math.max(...carritos.map(p => p.id));
            CartManager.idCounter = idMasAlto;
        }

        CartManager.idCounter++;

        const nuevoCarrito = {
            id: CartManager.idCounter,
            products:[]
        };
        console.log("\n --- EL NUEVO CARRITO ES ---\n")
        console.log(nuevoCarrito)
        carritos.push(nuevoCarrito);

        await fs.writeFile(this.path, JSON.stringify(carritos,null,2));
        return nuevoCarrito  
        }catch(error){
            console.error("Error al agregar producto", error);
            throw error;
        }
    }

    async getCarritoById(cid){
        try{
            const carritos = await this.getCarritos();
           // console.log(carritos.find(p => p.id ===Number(cid)))
            
            const carrito = carritos.find(p => p.id ===Number(cid))

            if (!carrito) {
                console.log("❌ Carrito no encontrado");
                return null;
            }   

            return carrito;
        }catch(error){
            console.error(`Carrito con id: ${cid} no encontrado`, error);
            throw error;
        }
    }

async agregarProductosAlCarrito(cid, pid) { 
    const carritos = await this.getCarritos();
    const index = carritos.findIndex(c => c.id == cid);
    
    // SI NO EXISTE EL CARRITO
    if (index === -1) {
        console.log("❌ Carrito no encontrado");
        return null;
    }

    // SI EXISTE
    const carrito = carritos[index];
    console.log(`\n --- EL CARRITO CON ID: ${cid} TIENE ESTOS PRODUCTOS---`);
    console.log(carrito.products);

    // BUSCAMOS SI EL PRODUCTO YA ESTÁ EN EL CARRITO
    const indexProducto = carrito.products.findIndex(p => p.product == pid);

    if (indexProducto !== -1) {
        // SI EXISTE: INCREMENTAMOS
        console.log(`\n --- EL PRODUCTO ${pid} YA EXISTE, SUMANDO 1 ---`);
        carrito.products[indexProducto].quantity++;
    } else {
        // SI NO EXISTE: AGREGAMOS NUEVO OBJETO
        console.log(`\n --- AGREGANDO PRODUCTO ${pid} POR PRIMERA VEZ ---`);
        carrito.products.push({
            product: Number(pid),
            quantity: 1
        });
    }

    console.log("\n --- ESTADO FINAL DEL CARRITO ---");
    console.log(JSON.stringify(carrito, null, 2));

    // ACTUALIZO EL ARCHIVO
    await fs.writeFile(this.path, JSON.stringify(carritos, null, 2));

    return carrito;
}

}

module.exports = CartManager;       