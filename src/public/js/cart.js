const cartActions = {
    // Eliminar un producto específico 
    removeItem: async (cartId, productId) => {
        const result = await Swal.fire({
            title: '¿Eliminar producto?',
            text: "Se quitará este item del carrito",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/carts/${cartId}/products/${productId}`, { method: 'DELETE' });
                if (response.ok) location.reload();
            } catch (error) {
                console.error("Error al eliminar item:", error);
            }
        }
    },

    // Vaciar carrito completo
    emptyCart: async (cartId) => {
        const result = await Swal.fire({
            title: '¿Vaciar carrito?',
            text: "Esta acción eliminará todos los productos",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Vaciar ahora'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/carts/${cartId}`, { method: 'DELETE' });
                if (response.ok) location.reload();
            } catch (error) {
                console.error("Error al vaciar carrito:", error);
            }
        }
    },

    // Actualizar cantidad 
    updateQty: async (cartId, productId, newQty) => {
        if (newQty < 1) return cartActions.removeItem(cartId, productId);
        
        try {
            await fetch(`/api/carts/${cartId}/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQty })
            });
            location.reload();
        } catch (error) {
            console.error("Error al actualizar cantidad:", error);
        }
    },

    // Finalizar Compra REAL
    checkout: async () => {
        const cartId = localStorage.getItem('cartId');
        
        if (!cartId) {
            return Swal.fire('Error', 'No se encontró un carrito activo', 'error');
        }

        const confirmacion = await Swal.fire({
            title: '¿Finalizar tu compra?',
            text: "Se procesarán los productos con stock disponible.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            confirmButtonText: 'Confirmar y Pagar',
            cancelButtonText: 'Seguir comprando'
        });

        if (confirmacion.isConfirmed) {
            try {
                const response = await fetch(`/api/carts/${cartId}/finalizar`, { method: 'POST' });
                const data = await response.json();

                if (data.status === "success") {
                    await Swal.fire({
                        title: '¡Compra Exitosa!',
                        html: `
                            <div class="text-start">
                                <p><b>Código:</b> ${data.boleta.codigo}</p>
                                <p><b>Total:</b> $${data.boleta.monto_total}</p>
                                <hr>
                                <p><small>Los productos sin stock permanecen en tu carrito.</small></p>
                            </div>
                        `,
                        icon: 'success'
                    });
                    
                    // Redirigimos al historial de compras
                    window.location.href = '/historial';
                } else {
                    Swal.fire('Atención', data.mensaje, 'warning');
                }
            } catch (error) {
                Swal.fire('Error', 'No pudimos procesar la compra', 'error');
            }
        }
    }
};