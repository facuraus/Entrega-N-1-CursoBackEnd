const socket = io(); 

const form = document.getElementById('productForm');
const container = document.getElementById('productsContainer');

// 1. ESCUCHAR ACTUALIZACIONES DEL SERVIDOR
socket.on('updateProducts', (products) => {
    container.innerHTML = '';   // Limpiamos la vista actual para no duplicar

    if (products.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay productos disponibles.</p>';
        return;
    }

    products.forEach(prod => {
        const div = document.createElement('div');
        div.classList.add('col-md-4', 'mb-3'); 
        div.innerHTML = `
            <div class="card p-3 border-primary shadow-sm h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-primary font-weight-bold">${prod.title}</h5>
                    <p class="text-muted small mb-1">ID: <span class="badge badge-light text-dark">${prod.id}</span></p>
                    <p class="card-text flex-grow-1">${prod.description || 'Sin descripción'}</p>
                    <p class="fw-bold text-success fs-4 mb-3">$${prod.price}</p>
                    <button class="btn btn-outline-danger btn-block mt-auto" 
                            onclick="deleteProduct('${prod.id}')">
                        <i class="fas fa-trash"></i> Eliminar Producto
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
});

// 2. ENVIAR NUEVO PRODUCTO (CLIENTE -> SERVIDOR)
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Creamos el objeto capturando los valores actuales del formulario
        const product = {
            title: document.getElementById('title').value,
            description: document.getElementById('description')?.value || "Producto agregado via sockets",
            price: Number(document.getElementById('price').value),
            code: document.getElementById('code').value,
            stock: Number(document.getElementById('stock').value),
            category: document.getElementById('category')?.value || "General",
            status: true,
            thumbnails: []
        };

        // Emitimos el evento 'addProduct' que el servidor debe estar escuchando en io.on('connection')
        socket.emit('addProduct', product); 
        
        form.reset(); // Limpiamos el formulario para el siguiente ingreso
    });
}

// 3. ELIMINAR PRODUCTO (CLIENTE -> SERVIDOR)
function deleteProduct(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        socket.emit('deleteProduct', id);
    }
}