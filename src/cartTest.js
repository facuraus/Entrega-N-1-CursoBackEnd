const CartManager = require('./manager/cartManager');
const manager = new CartManager('carts.json');


async function probandoCrearCarrito() {
    return manager.crearCarrito();
}

async function probargetCarritoById(cid) {
    return manager.getCarritoById(cid);
}

async function probaragregarProductosAlCarrito(cid, pid){
    return manager.agregarProductosAlCarrito(cid,pid);
}

//probandoCrearCarrito();
//probargetCarritoById(1);
probaragregarProductosAlCarrito(1,2);