// js/ui.js - VERSIÓN V3.1

function initStoreGrid() {
    // No hace nada específico en V3, la vista se genera dinámicamente
}

function updateStoreMapView() {
    if (!gameState) return;

    const shelvesGridWhite = document.getElementById('shelves-grid-white');
    const shelvesGridBrown = document.getElementById('shelves-grid-brown');
    
    if (!shelvesGridWhite || !shelvesGridBrown) return;

    // Limpiar
    shelvesGridWhite.innerHTML = '';
    shelvesGridBrown.innerHTML = '';

    // Config White Grid (24 slots)
    const maxVisibleSlots = 24; 
    const currentStockWhite = gameState.inventory.white_wolfie;
    const filledSlotsCountWhite = Math.min(currentStockWhite, maxVisibleSlots);

    for (let i = 0; i < maxVisibleSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        if (i < filledSlotsCountWhite) {
            slot.classList.add('filled');
        } else {
            slot.classList.add('empty');
        }
        shelvesGridWhite.appendChild(slot);
    }

    // Config Brown Grid (24 slots)
    const currentStockBrown = gameState.inventory.brown_wolfie;
    const filledSlotsCountBrown = Math.min(currentStockBrown, maxVisibleSlots);

    for (let i = 0; i < maxVisibleSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        if (i < filledSlotsCountBrown) {
            slot.classList.add('filled');
        } else {
            slot.classList.add('empty');
        }
        shelvesGridBrown.appendChild(slot);
    }

    const displayTotal = document.getElementById('display-total-stock-map');
    if (displayTotal) {
        displayTotal.textContent = `${currentStockWhite + currentStockBrown}`;
    }
}

function renderCustomers() {
    if (!gameState) return;

    const aisleContainer = document.querySelector('.aisle-floor');
    const queueContainer = document.querySelector('.queue-display');
    
    if (!aisleContainer || !queueContainer) return;

    aisleContainer.innerHTML = '';
    queueContainer.innerHTML = '';

    gameState.customers.forEach(cust => {
        const blob = document.createElement('div');
        blob.classList.add('customer-blob');
        blob.dataset.id = cust.id;
        
        const nameTag = document.createElement('span');
        nameTag.classList.add('customer-name-tag');
        
        let label = cust.name.split(' ')[0];
        if (cust.state === 'shopping' || cust.state === 'waiting_in_queue') {
             label += ` x${cust.desiredQty}`;
        }
        
        nameTag.textContent = label;
        blob.appendChild(nameTag);

        let leftPercent = 0;
        let topOffset = 50;

        switch (cust.state) {
            case 'entering':
                blob.classList.add('entering');
                leftPercent = cust.progress * 0.3; 
                break;

            case 'shopping':
                blob.classList.add('shopping');
                // Posición fija relativa al progreso para evitar jitter extremo
                leftPercent = 30 + (cust.progress % 20); 
                topOffset = 30 + (cust.id % 40); 
                break;

            case 'going_to_checkout':
                blob.classList.add('going-to-checkout');
                leftPercent = 30 + (cust.progress * 0.5);
                break;

            case 'waiting_in_queue':
                blob.classList.add('waiting-in-queue');
                leftPercent = 80 + (Math.random() * 5); 
                
                blob.style.cursor = 'pointer';
                blob.onclick = () => attemptCheckout(cust.id);
                break;

            case 'leaving_happy':
                blob.classList.add('leaving-happy');
                leftPercent = 80 + ((100 - cust.progress) * 0.2); 
                break;

            case 'leaving_angry':
                blob.classList.add('leaving-angry');
                leftPercent = 80 + ((100 - cust.progress) * 0.2);
                break;
        }

        blob.style.left = `${leftPercent}%`;
        blob.style.top = `${topOffset}%`;

        aisleContainer.appendChild(blob);

        if (cust.state === 'waiting_in_queue') {
            const listItem = document.createElement('div');
            listItem.classList.add('queue-item');
            
            const totalItems = cust.cart.length;
            const totalPrice = cust.cart.reduce((sum, item) => sum + item.price, 0);
            
            listItem.innerHTML = `
                <span>${cust.name.split(' ')[0]}</span>
                <span class="price">$${totalPrice.toFixed(2)} (${totalItems})</span>
            `;
            listItem.onclick = () => attemptCheckout(cust.id); 
            
            queueContainer.appendChild(listItem);
        }
    });
}

function updateUI() {
    if (!gameState) return;

    document.getElementById('display-day').textContent = gameState.day;
    document.getElementById('display-budget').textContent = `$${gameState.budget.toFixed(2)}`;
    
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

    checkQuotaStatus();
    updateStoreMapView();
    renderCustomers();

    // Alerta bajo stock (combinado o separado? Hagámoslo separado simple)
    const lowStockAlert = document.getElementById('low-stock-alert');
    if (lowStockAlert) {
        if (gameState.inventory.white_wolfie < 12 || gameState.inventory.brown_wolfie < 6) {
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

// --- MODALES DE PAGO ---

function showQuickPayModal(customer) {
    const modal = document.getElementById('quick-pay-modal');
    if (!modal) return;

    const nameSpan = modal.querySelector('#qp-client-name');
    const totalSpan = modal.querySelector('#qp-total-amount');
    const qtySpan = modal.querySelector('#qp-quantity');
    const confirmBtn = modal.querySelector('#btn-quick-confirm');

    const total = customer.cart.reduce((sum, item) => sum + item.price, 0);
    const qty = customer.cart.length;

    nameSpan.textContent = customer.name;
    totalSpan.textContent = `$${total.toFixed(2)}`;
    qtySpan.textContent = `${qty} x Lobito`;

    modal.dataset.currentCustomerId = customer.id;

    confirmBtn.onclick = () => processQuickPayment(customer.id, total);

    modal.classList.remove('hidden');
}

function showDangerousPayModal(customer) {
    gameState.pendingCustomerForPayment = customer; 
    
    const overlay = document.getElementById('interaction-overlay');
    overlay.classList.remove('hidden');
    
    // Iniciar modo grabbing automáticamente al mostrar el overlay
    gameState.interactionMode = 'grabbing';
    updateInteractionUI();
}

function hideQuickPayModal() {
    document.getElementById('quick-pay-modal').classList.add('hidden');
}

function showManualCalcModal(customer) {
    const modal = document.getElementById('payment-modal'); 
    if(!modal) return;

    const titleEl = modal.querySelector('.modal-content h2');
    if(titleEl) titleEl.innerHTML = `⚠️ CALCULAR TOTAL<br><span style="font-size:0.8em; color:#aaa;">${customer.name}</span>`;

    const listUl = document.getElementById('client-cart-list');
    const totalStrong = document.getElementById('pay-total-amount');
    const input = document.getElementById('pay-input-amount');
    const errorMsg = document.getElementById('pay-error-msg');

    listUl.innerHTML = '';
    let total = 0;
    
    const groupedItems = {};
    customer.cart.forEach(item => {
        if(!groupedItems[item.type]) groupedItems[item.type] = { count: 0, price: item.price };
        groupedItems[item.type].count++;
    });

    for(const [type, data] of Object.entries(groupedItems)) {
        const li = document.createElement('li');
        const typeName = type === 'white' ? 'Lobito Básico' : `Lobito ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        li.innerHTML = `<span>${typeName} x${data.count}</span> <span>$${(data.count * data.price).toFixed(2)}</span>`;
        listUl.appendChild(li);
        total += data.count * data.price;
    }

    totalStrong.textContent = `$${total.toFixed(2)}`;
    input.value = '';
    input.focus();
    errorMsg.textContent = '';
    
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

function showToast(message) {
    console.log(message);
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
