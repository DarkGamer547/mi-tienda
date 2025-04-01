document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://fakestoreapi.com/products';
    let allProducts = []; // Para almacenar todos los productos de la API
    let cart = []; // Para almacenar los productos en el carrito

    // Referencias a Elementos del DOM
    const productListContainer = document.getElementById('product-list');
    const cartCountBadge = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const payBtn = document.getElementById('pay-btn');
    const searchInput = document.getElementById('search-input');

    // Referencias a Modales de Bootstrap
    const quantityModalElement = document.getElementById('quantityModal');
    const quantityModal = new bootstrap.Modal(quantityModalElement);
    const cartModalElement = document.getElementById('cartModal');
    const cartModal = new bootstrap.Modal(cartModalElement);
    const paymentModalElement = document.getElementById('paymentModal');
    const paymentModal = new bootstrap.Modal(paymentModalElement);

    // Referencias a Elementos dentro de los Modales
    const quantityInput = document.getElementById('quantity-input');
    const confirmQuantityBtn = document.getElementById('confirm-quantity-btn');
    const quantityProductIdInput = document.getElementById('quantity-product-id');
    const quantityProductName = document.getElementById('quantity-product-name');
    const paymentForm = document.getElementById('payment-form');
    const finalizePaymentBtn = document.getElementById('finalize-payment-btn');

    // --- CARGA INICIAL DE PRODUCTOS ---
    async function fetchProducts() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allProducts = await response.json();
            displayProducts(allProducts);
        } catch (error) {
            console.error("Error al cargar los productos:", error);
            productListContainer.innerHTML = `<p class="text-center text-danger">Error al cargar productos. Inténtalo más tarde.</p>`;
        }
    }

    // --- MOSTRAR PRODUCTOS EN EL DOM ---
    function displayProducts(productsToDisplay) {
        productListContainer.innerHTML = ''; // Limpiar contenedor

        if (productsToDisplay.length === 0) {
             productListContainer.innerHTML = `<p class="text-center text-muted">No se encontraron productos.</p>`;
             return;
        }

        productsToDisplay.forEach(product => {
            const productCard = `
                <div class="col">
                    <div class="card h-100">
                        <div class="card-img-container">
                             <img src="${product.image}" class="card-img-top" alt="${product.title}">
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${product.title}</h5>
                            <p class="card-text price">$${product.price.toFixed(2)}</p>
                            <button class="btn btn-primary w-100 btn-add-to-cart"
                                    data-id="${product.id}"
                                    data-name="${product.title}"
                                    data-price="${product.price}"
                                    data-image="${product.image}">
                                <i class="fas fa-cart-plus me-2"></i>Añadir al carrito
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productListContainer.innerHTML += productCard;
        });
    }

    // --- MANEJO DEL CARRITO ---

    // Event Listener para botones "Añadir al carrito" (delegación de eventos)
    productListContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-add-to-cart')) {
            const button = event.target;
            const productId = button.dataset.id;
            const productName = button.dataset.name;

            // Configurar y mostrar modal de cantidad
            quantityProductIdInput.value = productId;
            quantityProductName.textContent = productName;
            quantityInput.value = 1; // Resetear cantidad a 1
            quantityModal.show();
        }
    });

    // Event Listener para confirmar cantidad en el modal
    confirmQuantityBtn.addEventListener('click', () => {
        const productId = parseInt(quantityProductIdInput.value);
        const quantity = parseInt(quantityInput.value);

        if (quantity > 0) {
            const productToAdd = allProducts.find(p => p.id === productId);
            if (productToAdd) {
                addItemToCart(productToAdd, quantity);
                quantityModal.hide();
            } else {
                console.error("Producto no encontrado:", productId);
            }
        } else {
            alert("Por favor, introduce una cantidad válida (mayor que 0).");
        }
    });

    // Añadir item al carrito o actualizar cantidad
    function addItemToCart(product, quantity) {
        const existingCartItemIndex = cart.findIndex(item => item.id === product.id);

        if (existingCartItemIndex > -1) {
            // Si ya existe, actualiza la cantidad
            cart[existingCartItemIndex].quantity += quantity;
        } else {
            // Si no existe, añade el nuevo producto
            cart.push({
                id: product.id,
                name: product.title,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        updateCartUI();
    }

    // Actualizar la interfaz del carrito (modal y badge)
    function updateCartUI() {
        cartItemsContainer.innerHTML = ''; // Limpiar items actuales
        let total = 0;
        let itemCount = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-muted">Tu carrito está vacío.</p>';
            payBtn.disabled = true; // Deshabilitar botón de pagar si el carrito está vacío
        } else {
            cart.forEach(item => {
                const itemSubtotal = item.price * item.quantity;
                total += itemSubtotal;
                itemCount += item.quantity;

                const cartItemHTML = `
                    <div class="cart-item" data-id="${item.id}">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="cart-item-details">
                            <h6>${item.name}</h6>
                            <p>Cantidad: ${item.quantity} x $${item.price.toFixed(2)}</p>
                            <p>Subtotal: $${itemSubtotal.toFixed(2)}</p>
                        </div>
                        <div class="cart-item-actions">
                            <button class="btn-remove-item" title="Eliminar producto">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
                cartItemsContainer.innerHTML += cartItemHTML;
            });
            payBtn.disabled = false; // Habilitar botón de pagar
        }

        // Actualizar total y contador del badge
        cartTotalElement.textContent = `$${total.toFixed(2)}`;
        cartCountBadge.textContent = itemCount;
        cartCountBadge.style.display = itemCount > 0 ? 'inline-block' : 'none'; // Mostrar/ocultar badge
    }

     // Event Listener para eliminar items del carrito (delegación)
    cartItemsContainer.addEventListener('click', (event) => {
        const removeButton = event.target.closest('.btn-remove-item');
        if (removeButton) {
            const cartItemElement = removeButton.closest('.cart-item');
            const productId = parseInt(cartItemElement.dataset.id);
            removeItemFromCart(productId);
        }
    });

    // Función para eliminar un item completo del carrito
    function removeItemFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCartUI();
    }


    // --- BÚSQUEDA DINÁMICA ---
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();

        const filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        displayProducts(filteredProducts);
    });

    // --- PROCESO DE PAGO Y FACTURA ---

    // Event Listener para el botón "Proceder al Pago" en el modal del carrito
    payBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            cartModal.hide(); // Ocultar modal del carrito
            paymentModal.show(); // Mostrar modal de pago
        } else {
            alert("Tu carrito está vacío. Añade productos antes de proceder al pago.");
        }
    });

     // Event Listener para el envío del formulario de pago
    paymentForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenir envío real del formulario
        console.log("Simulando proceso de pago...");

        // Aquí podrías añadir validaciones más robustas si fuera necesario
        const payerName = document.getElementById('payer-name').value;
        if (!payerName) {
             alert("Por favor, introduce tu nombre.");
             return;
        }

        // Generar la factura PDF
        generateInvoice(payerName);

        // Limpiar carrito, actualizar UI y cerrar modal de pago
        cart = [];
        updateCartUI();
        paymentModal.hide();
        paymentForm.reset(); // Limpiar formulario

        // Mostrar mensaje de éxito (opcional)
        alert("¡Pago simulado con éxito! Tu factura se está descargando.");
    });


    // --- GENERACIÓN DE FACTURA PDF con jsPDF ---
    function generateInvoice(payerName) {
        // Asegurarse de que jsPDF esté cargado
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            console.error("jsPDF no está cargado.");
            alert("Error al generar la factura: la librería PDF no está disponible.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Contenido del PDF ---
        let y = 20; // Posición Y inicial

        // Título
        doc.setFontSize(18);
        doc.text("Factura de Compra - MiTienda", 105, y, { align: 'center' });
        y += 10;

        // Fecha
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 10, y);
         doc.text(`Cliente: ${payerName}`, 10, y + 5);
        y += 15;

        // Encabezados de la tabla
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold'); // Poner texto en negrita
        doc.text("Producto", 10, y);
        doc.text("Cantidad", 110, y, { align: 'right' });
        doc.text("Precio Unit.", 145, y, { align: 'right' });
        doc.text("Subtotal", 190, y, { align: 'right' });
        doc.setFont(undefined, 'normal'); // Quitar negrita
        y += 7;
        doc.setLineWidth(0.2);
        doc.line(10, y-2, 195, y-2); // Línea separadora

        // Items del carrito
        doc.setFontSize(10);
        let totalFactura = 0;
        cart.forEach(item => {
            const subtotal = item.quantity * item.price;
            totalFactura += subtotal;

            // Manejo de nombres largos (ajustar y si es necesario)
            const splitTitle = doc.splitTextToSize(item.name, 95); // Ancho máximo para nombre
            doc.text(splitTitle, 10, y);

            doc.text(item.quantity.toString(), 110, y, { align: 'right' });
            doc.text(`$${item.price.toFixed(2)}`, 145, y, { align: 'right' });
            doc.text(`$${subtotal.toFixed(2)}`, 190, y, { align: 'right' });

            // Incrementar y basado en la altura del nombre del producto
             y += (splitTitle.length * 4) + 3; // Ajustar espacio entre líneas

             // Salto de página si es necesario (raro en facturas cortas, pero buena práctica)
             if (y > 270) {
                 doc.addPage();
                 y = 20; // Resetear y en nueva página
             }
        });

         // Línea antes del total
         y+= 5;
         doc.line(110, y, 195, y);
         y += 7;

        // Total
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Total:", 145, y, { align: 'right' });
        doc.text(`$${totalFactura.toFixed(2)}`, 190, y, { align: 'right' });
        doc.setFont(undefined, 'normal');

        // Mensaje final
        y += 15;
        doc.setFontSize(10);
        doc.text("Gracias por tu compra en MiTienda.", 105, y, { align: 'center' });

        // --- Guardar el PDF ---
        try {
             doc.save(`factura-MiTienda-${Date.now()}.pdf`);
             console.log("Factura PDF generada y descargada.");
        } catch (e) {
            console.error("Error al guardar el PDF:", e);
            alert("Hubo un problema al generar el archivo PDF.");
        }
    }


    // --- INICIALIZACIÓN ---
    fetchProducts(); // Cargar productos al iniciar
    updateCartUI(); // Inicializar UI del carrito (mostrar que está vacío)

}); // Fin de DOMContentLoaded