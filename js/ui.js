// js/ui.js - VERSIÓN V3 (SIMULACIÓN ACTIVA)

/**
 * Inicializa la estructura visual básica (solo una vez al cargar el juego)
 */
function initStoreGrid() {
    // En V3, los estantes son estáticos visualmente. 
    // No generamos slots individuales ni ponemos listeners aquí.
    // La función updateStoreMapView se encargará de pintarlos.
}

/**
 * Actualiza la vista de los estantes según el stock actual
 */
function updateStoreMapView() {
    if (!gameState) return;

    const shelvesGrid = document.getElementById('shelves-grid');
    if (!shelvesGrid) return;

    // Limpiamos el grid antes de redibujar (simple para MVP)
    shelvesGrid.innerHTML = '';

    // Mostramos hasta 24 slots visuales (representando capacidad máxima visible)
    // El stock real puede ser mayor, pero visualmente limitamos a lo que cabe en la rejilla
    const maxVisibleSlots = 24; 
    const currentStock = gameState.inventory.white_wolfie;
    
    // Calculamos cuántos slots llenos mostrar
    const filledSlotsCount = Math.min(currentStock, maxVisibleSlots);

    for (let i = 0; i < maxVisibleSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        
        if (i < filledSlotsCount) {
            slot.classList.add('filled');
        } else {
            slot.classList.add('empty');
        }
        
        shelvesGrid.appendChild(slot);
    }

    // Actualizar contador textual si existe
    const displayTotal = document.getElementById('display-total-stock-map');
    if (displayTotal) {
        displayTotal.textContent = `${currentStock}`;
    }
}

/**
 * RENDERIZA LOS CLIENTES EN EL PASILLO Y LA CAJA
 * Esta es la función más importante de la V3
 */
function renderCustomers() {
    if (!gameState) return;

    const aisleContainer = document.querySelector('.aisle-floor') || document.querySelector('.aisle-area');
    const queueContainer = document.querySelector('.queue-display');
    
    if (!aisleContainer || !queueContainer) return;

    // Limpiar contenedores
    aisleContainer.innerHTML = '';
    queueContainer.innerHTML = '';

    gameState.customers.forEach(cust => {
        // 1. Crear el elemento visual (la bolita)
        const blob = document.createElement('div');
        blob.classList.add('customer-blob');
        blob.dataset.id = cust.id;
        
        // Añadir etiqueta de nombre flotante
                // Añadir etiqueta de nombre flotante
        const nameTag = document.createElement('span');
        nameTag.classList.add('customer-name-tag');
        
        // MOSTRAR CANTIDAD DESEADA SI ESTÁ COMPRANDO O ESPERANDO
        let label = cust.name.split(' ')[0];
        if (cust.state === 'shopping' || cust.state === 'waiting_in_queue') {
             label += ` x${cust.desiredQty}`; // Ejemplo: "Sofia x3"
        }
        
        nameTag.textContent = label;
        blob.appendChild(nameTag);
        
        // 2. Determinar posición y clase según el ESTADO
        let leftPercent = 0;
        let topOffset = 50; // Centrado vertical por defecto

        switch (cust.state) {
            case 'entering':
                blob.classList.add('entering');
                // Moverse de izquierda (0%) hacia centro-izquierda (ej. 30%)
                leftPercent = cust.progress * 0.3; 
                break;

            case 'shopping':
                blob.classList.add('shopping');
                // Están parados frente a los estantes (zona izquierda-centro)
                leftPercent = 30 + (Math.random() * 10); // Pequeña variación aleatoria para que no se superpongan exactamente
                topOffset = 30 + (Math.random() * 40); // Variación vertical
                break;

            case 'going_to_checkout':
                blob.classList.add('going-to-checkout');
                // Moverse desde zona estantes (30%) hacia zona caja (80%)
                leftPercent = 30 + (cust.progress * 0.5);
                break;

            case 'waiting_in_queue':
                blob.classList.add('waiting-in-queue');
                // Estos NO van en el pasillo, van en la cola de la derecha
                // Pero como queremos verlos caminar hasta allí, los mantenemos en el pasillo 
                // al final de su recorrido o los movemos a la columna de la derecha.
                // Para simplificar: Si están esperando, los ponemos en la zona de la derecha del pasillo
                leftPercent = 80 + (Math.random() * 5); 
                
                // AÑADIR EVENT LISTENER PARA COBRAR
                blob.style.cursor = 'pointer';
                blob.onclick = () => attemptCheckout(cust.id);
                break;

            case 'leaving_happy':
                blob.classList.add('leaving-happy');
                // Retroceder desde la caja (80%) hacia la salida (100% o fuera)
                // Dependiendo de cómo implementes la salida. Asumiremos que salen por la derecha.
                leftPercent = 80 + ((100 - cust.progress) * 0.2); 
                break;

            case 'leaving_angry':
                blob.classList.add('leaving-angry');
                // Salen rápido o vuelven por donde entraron? 
                // Hagámoslos salir por la derecha también para consistencia visual simple
                leftPercent = 80 + ((100 - cust.progress) * 0.2);
                break;
        }

        // Aplicar estilos calculados
        blob.style.left = `${leftPercent}%`;
        blob.style.top = `${topOffset}%`;

        // Agregar al DOM
        aisleContainer.appendChild(blob);

        // 3. Opcional: Mostrar lista resumida en la zona de Caja (derecha)
        if (cust.state === 'waiting_in_queue') {
            const listItem = document.createElement('div');
            listItem.classList.add('queue-item');
            
            const totalItems = cust.cart.length;
            const totalPrice = cust.cart.reduce((sum, item) => sum + item.price, 0);
            
            listItem.innerHTML = `
                <span>${cust.name.split(' ')[0]}</span>
                <span class="price">$${totalPrice.toFixed(2)} (${totalItems})</span>
            `;
            listItem.onclick = () => attemptCheckout(cust.id); // Doble acceso: clic en bolita o en lista
            
            queueContainer.appendChild(listItem);
        }
    });
}

/**
 * Funciones Auxiliares de UI General
 */
function updateUI() {
    if (!gameState) return;

    // Header Stats
    document.getElementById('display-day').textContent = gameState.day;
    document.getElementById('display-budget').textContent = `$${gameState.budget.toFixed(2)}`;
    
    // Shop Status
    const statusEl = document.getElementById('display-shop-status');
    if (statusEl) {
        if (gameState.shopStatus === 'open') {
            statusEl.textContent = "ABIERTA";
            statusEl.className = "stat-item status-open";
        } else {
            statusEl.textContent = "CERRADA";
            statusEl.className = "stat-item status-closed";
        }
    }

    // Cuota
    checkQuotaStatus();

    // Mapas
    updateStoreMapView();
    renderCustomers(); // Importante: refrescar clientes cada vez que se actualice la UI principal

    // NUEVO: Mostrar/Ocultar alerta de bajo stock
    const lowStockAlert = document.getElementById('low-stock-alert');
    if (lowStockAlert) {
        // Consideramos "bajo" si quedan menos de 12 unidades (1 lote)
        if (gameState.inventory.white_wolfie < 12) {
            lowStockAlert.classList.remove('hidden');
        } else {
            lowStockAlert.classList.add('hidden');
        }
    }
}

function checkQuotaStatus() {
    const statusEl = document.getElementById('display-quota-status');
    if (!statusEl || !gameState) return;

    if (gameState.daily_tracker.earned_today >= DAILY_QUOTA_GOAL) {
        statusEl.textContent = "Cumplida ✅";
        statusEl.style.color = "#4caf50";
    } else {
        statusEl.textContent = `$${gameState.daily_tracker.earned_today.toFixed(2)} / $${DAILY_QUOTA_GOAL}`;
        statusEl.style.color = "#fff";
    }
}

/**
 * MODALES DE PAGO
 */
function showPaymentModal(customer) {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;

    const nameSpan = document.getElementById('pay-client-name');
    const listUl = document.getElementById('client-cart-list');
    const totalStrong = document.getElementById('pay-total-amount');
    const input = document.getElementById('pay-input-amount');
    const errorMsg = document.getElementById('pay-error-msg');

    // Llenar datos
    nameSpan.textContent = customer.name;
    listUl.innerHTML = '';
    
    let total = 0;
    customer.cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span>Lobito Básico x1</span> <span>$${item.price.toFixed(2)}</span>`;
        listUl.appendChild(li);
        total += item.price;
    });

    totalStrong.textContent = `$${total.toFixed(2)}`;
    input.value = '';
    input.focus();
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
    
    // Guardar ID para confirmación
    modal.dataset.currentCustomerId = customer.id;
    
    modal.classList.remove('hidden');
}

function hidePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.classList.add('hidden');
}

function showError(msg) {
    const errEl = document.getElementById('pay-error-msg');
    if (errEl) {
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
    }
}

/**
 * TOASTS / NOTIFICACIONES SIMPLES
 */
function showToast(message) {
    console.log(message);
    // Implementación futura: Div flotante animado
}

function showModal(title, body) {
    const modal = document.getElementById('message-modal');
    if(!modal) return;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerText = body; 
    modal.classList.remove('hidden');
}

function hideModal() {
    const modal = document.getElementById('message-modal');
    if(modal) modal.classList.add('hidden');
}
