(() => {
    const socket = io();
    let allProducts = [];

    const productGrid = document.getElementById('productsContainer');
    const mainSearchInput = document.getElementById('mainSearchInput');
    const advFilterForm = document.getElementById('advancedFilterForm');
    const creationForm = document.getElementById('productForm');

    socket.on('updateProducts', (products) => {
        allProducts = products;
        applyAllFilters();
    });

    function applyAllFilters(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        const query = (mainSearchInput?.value || "").toLowerCase();
        const selectedCats = Array.from(document.querySelectorAll('.category-check:checked')).map(cb => cb.value);
        const sortOrder = document.querySelector('input[name="sortOrder"]:checked')?.value || 'none';
        const onlyAvailable = document.getElementById('stockFilter')?.checked || false;

        let filtered = allProducts.filter(p => {
            const matchesSearch = p.title?.toLowerCase().includes(query) || p.category?.toLowerCase().includes(query);
            const matchesCat = selectedCats.length === 0 || selectedCats.includes(p.category);
            const matchesStock = !onlyAvailable || p.stock > 0;
            return matchesSearch && matchesCat && matchesStock;
        });

        if (sortOrder === 'asc') filtered.sort((a, b) => a.price - b.price);
        if (sortOrder === 'desc') filtered.sort((a, b) => b.price - a.price);

        renderUI(filtered);
    }

    function renderUI(products) {
        if (!productGrid) return;
        productGrid.innerHTML = products.map(p => {
            const stockColor = p.stock > 0 ? 'text-success' : 'text-danger';
            const stockText = p.stock > 0 ? `${p.stock} unidades` : 'Agotado';

            return `
            <div class="col-md-6 mb-3">
                <div class="card h-100 border-0 shadow-sm overflow-hidden">
                    <div class="row g-0">
                        <div class="col-4 d-flex align-items-center justify-content-center bg-light p-2">
                            <img src="/assets/img/${p.thumbnails?.[0] || 'default.png'}" 
                                 class="img-fluid rounded" style="max-height: 80px;"
                                 onerror="this.src='https://via.placeholder.com/80?text=S/I'">
                        </div>
                        <div class="col-8 card-body p-2">
                            <h6 class="card-title fw-bold text-truncate mb-1">${p.title}</h6>
                            <p class="text-muted small mb-2">${p.category}</p>
                            
                            <div id="stock-container-${p._id}" class="mb-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <span class="small fw-bold ${stockColor}">${stockText}</span>
                                    <button class="btn btn-link btn-sm text-primary p-0 text-decoration-none" 
                                            onclick="enableStockEdit('${p._id}', ${p.stock})">
                                        Modificar stock
                                    </button>
                                </div>
                            </div>

                            <p class="fw-bold text-success mb-2">$${p.price}</p>
                            <button class="btn btn-danger btn-sm w-100" onclick="deleteProduct('${p._id}')">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // --- FUNCIONES GLOBALES (Para que el onclick las encuentre) ---

    window.enableStockEdit = (id, currentStock) => {
        const container = document.getElementById(`stock-container-${id}`);
        container.innerHTML = `
        <div class="input-group input-group-sm">
            <input type="number" id="input-stock-${id}" class="form-control" value="${currentStock}" min="0">
            <button class="btn btn-success" onclick="saveStockUpdate('${id}')">
                <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-outline-secondary" onclick="cancelStockEdit()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    };

    window.cancelStockEdit = () => {
        applyAllFilters(); 
    };

    window.saveStockUpdate = (id) => {
        const input = document.getElementById(`input-stock-${id}`);
        const newStock = parseInt(input.value);
        if (!isNaN(newStock) && newStock >= 0) {
            socket.emit('updateStockDirect', { id, newStock });
        }
    };

    window.deleteProduct = (id) => {
        Swal.fire({
            title: '¿Eliminar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, borrar'
        }).then(result => {
            if (result.isConfirmed) socket.emit('deleteProduct', id);
        });
    };

    // --- LISTENERS ---
    mainSearchInput?.addEventListener('input', applyAllFilters);
    advFilterForm?.addEventListener('submit', (e) => {
        applyAllFilters(e);
        const offcanvasElement = document.getElementById('filterSidebar');
        bootstrap.Offcanvas.getInstance(offcanvasElement)?.hide();
    });

    if (creationForm) {
        creationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('title', document.getElementById('title').value);
            formData.append('description', document.getElementById('description').value);
            formData.append('price', document.getElementById('price').value);
            formData.append('stock', document.getElementById('stock').value);
            formData.append('category', document.getElementById('category').value);
            formData.append('code', 'RT-' + Date.now());
            const file = document.getElementById('imageInput').files[0];
            if (file) formData.append('image', file);

            const res = await fetch('/api/products', { method: 'POST', body: formData });
            if (res.ok) {
                creationForm.reset();
                Swal.fire({ icon: 'success', title: '¡Producto Creado!', timer: 1000, showConfirmButton: false });
            }
        });
    }

    window.clearFilters = () => {
        advFilterForm?.reset();
        if (mainSearchInput) mainSearchInput.value = '';
        applyAllFilters();
    };
})();