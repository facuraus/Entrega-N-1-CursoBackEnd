const socket = io(); 

socket.on('connect', () => {
    console.log("✅ Conectado al servidor de Sockets desde el navegador");
});

const searchInput = document.getElementById('mainSearchInput');
const resultsContainer = document.getElementById('liveSearchResults');
let debounceTimer;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    
    const titleParam = params.get('title');
    const searchInput = document.getElementById('mainSearchInput');
    if (titleParam && searchInput) searchInput.value = titleParam;

    const categoryParam = params.get('category');
    if (categoryParam) {
        const selectedCats = categoryParam.split(',');
        selectedCats.forEach(cat => {
            const cb = document.querySelector(`.category-check[value="${cat}"]`);
            if (cb) cb.checked = true;
        });
    }

    const sortParam = params.get('sort');
    if (sortParam) {
        const rb = document.querySelector(`input[name="sortOrder"][value="${sortParam}"]`);
        if (rb) rb.checked = true;
    }
});

// --- LÓGICA DE BÚSQUEDA Y FILTRADO ---
function executeSearch() {
    const searchInput = document.getElementById('mainSearchInput');
    const textQuery = searchInput ? searchInput.value.trim() : '';
    const selectedCats = Array.from(document.querySelectorAll('.category-check:checked')).map(cb => cb.value);
    const sort = document.querySelector('input[name="sortOrder"]:checked')?.value;
    
    // CAPTURAR EL FILTRO DE STOCK
    const hasStock = document.getElementById('stockFilter').checked;

    const params = new URLSearchParams();
    params.set('page', '1');

    if (textQuery) params.set('title', textQuery); // Asegúrate que el backend busque 'title'
    if (selectedCats.length > 0) params.set('category', selectedCats.join(','));
    if (sort) params.set('sort', sort);
    
    // CAMBIO AQUÍ: Usamos 'status' en lugar de 'stock'
    if (hasStock) params.set('status', 'true');

    window.location.href = `/products?${params.toString()}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);    
    const statusParam = params.get('status'); 
    if (statusParam === 'true') {
        const filterEl = document.getElementById('stockFilter');
        if (filterEl) filterEl.checked = true;
    }
});

function clearFilters() {
    window.location.href = '/products?page=1';
}

// --- Buscador con autocompletado ---
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < 2) {
            resultsContainer.classList.add('d-none');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/products?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                const products = data.payload?.docs || data.payload || [];

                if (products.length > 0) renderLiveResults(products);
                else {
                    resultsContainer.innerHTML = '<div class="list-group-item text-muted small">Sin resultados</div>';
                    resultsContainer.classList.remove('d-none');
                }
            } catch (error) {
                console.error(error); 
                res.status(500).json({ status: "error", message: error.message });
            }
        }, 300);
    });
}

function renderLiveResults(products) {
    resultsContainer.innerHTML = products.slice(0, 6).map(p => `
        <a href="/products/${p._id}" class="list-group-item list-group-item-action d-flex align-items-center gap-3">
            <img src="/assets/img/${p.thumbnails?.[0] || 'placeholder.png'}" class="search-img-thumb rounded border" onerror="this.src='https://via.placeholder.com/50'">
            <div>
                <div class="fw-bold text-dark small">${p.title}</div>
                <div class="text-success small fw-bold">$${p.price}</div>
                <div class="text-muted" style="font-size: 0.7rem;">${p.category}</div>
            </div>
        </a>
    `).join('');
    resultsContainer.classList.remove('d-none');
}

// --- ACCIONES DE USUARIO (CARRITO) ---
async function addToCart(productId) {
    let cartId = localStorage.getItem('cartId');

    try {
        // 1. Crear carrito si no existe
        if (!cartId || cartId === "undefined" || cartId === "null") {
            const res = await fetch('/api/carts', { method: 'POST' });
            const data = await res.json();
            cartId = data.payload._id;
            localStorage.setItem('cartId', cartId);
        }

        // 2. Enviar producto al carrito
        const resAdd = await fetch(`/api/carts/${cartId}/products/${productId}`, { 
            method: 'POST' 
        });

        // 3. Si el carrito ya no existe en la DB, limpiar y reintentar
        if (resAdd.status === 404) {
            localStorage.removeItem('cartId');
            return addToCart(productId);
        }

        if (resAdd.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Producto añadido!',
                text: 'El catálogo se actualizará.',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.reload(); 
            });
        }
    } catch (error) {
        console.error("Error al agregar:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'No se pudo agregar el producto',
        });
    }
}

// --- EVENT LISTENERS ---
document.getElementById('advancedFilterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    executeSearch();
});

searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

// Cerrar autocompletado si se hace clic fuera
document.addEventListener('click', (e) => {
    if (searchInput && !searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.classList.add('d-none');
    }
});