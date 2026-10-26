// js/logic.js - VERSIÓN V3.1 SIMULACIÓN ACTIVA + CARGA MÚLTIPLE

// --- CONSTANTES ECONÓMICAS Y DE CONFIGURACIÓN ---
const COST_LOTE_WHITE = 5.00;
const UNITS_PER_LOTE_WHITE = 12;
const PRICE_WHITE_WOLFIE = 1.00; 

const COST_LOTE_BROWN = 12.00;
const UNITS_PER_LOTE_BROWN = 6; // Los gordinflones son grandes, vienen menos por lote
const PRICE_BROWN_WOLFIE = 2.50;

const PRESERVATION_COST_PER_UNIT = 0.50;
const PRESERVATION_COST_BROWN = 2.00; // Más caro de mantener

const DAILY_QUOTA_GOAL = 30.00;
const MAX_CUSTOMERS_IN_STORE = 8; 
const SPAWN_RATE_CHANCE = 0.15;   
const MAX_CAPACITY_VISUAL = 72; // Capacidad total combinada o individual? Usaremos límite global simple para MVP

let gameInterval = null; 

// --- INICIALIZACIÓN ---

function initNewGame() {
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    gameState.budget = 10.00; 
    gameState.inventory.white_wolfie = 24;
    gameState.inventory.brown_wolfie = 0;
    gameState.daily_tracker.start_budget = gameState.budget;
    gameState.daily_tracker.earned_today = 0;
    gameState.customers = [];
    gameState.shopStatus = 'closed';

    updateUI();
    showModal("Bienvenido", "Tu tienda ha sido inaugurada.\nTienes 24 Lobitos Básicos.\nPresiona 'ABRIR TIENDA' para comenzar.");
}

// --- CONTROL DE APERTURA/CIERRE ---

function toggleShopState() {
    if (gameState.shopStatus === 'closed') {
        openShop();
    } else {
        closeShop();
    }
}

function openShop() {
    if (gameState.shopStatus === 'open') return;
    
    gameState.shopStatus = 'open';
    gameState.customers = []; 
    
    document.getElementById('btn-toggle-shop').textContent = "CERRAR TIENDA";
    document.getElementById('btn-toggle-shop').classList.remove('success');
    document.getElementById('btn-toggle-shop').classList.add('danger');
    document.getElementById('display-shop-status').textContent = "ABIERTA";
    document.getElementById('display-shop-status').className = "stat-item status-open";

    gameInterval = setInterval(gameTick, 500);
    
    spawnCustomer();
    spawnCustomer();
}

function closeShop() {
    if (gameState.shopStatus === 'closed') return;

    clearInterval(gameInterval);
    gameInterval = null;
    gameState.shopStatus = 'closed';
    gameState.customers = []; 

    processEndOfDay();
    
    document.getElementById('btn-toggle-shop').textContent = "ABRIR TIENDA";
    document.getElementById('btn-toggle-shop').classList.remove('danger');
    document.getElementById('btn-toggle-shop').classList.add('success');
    document.getElementById('display-shop-status').textContent = "CERRADA";
    document.getElementById('display-shop-status').className = "stat-item status-closed";
}

// --- LÓGICA DE SIMULACIÓN (EL TICK) ---

function spawnCustomer() {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    let desiredType = 'white';
    let quantity = Math.floor(Math.random() * 4) + 1; // 1 a 4 unidades
    
    // Si hay stock de marrones, hay un 30% de probabilidad de querer uno
    if (gameState.inventory.brown_wolfie > 0 && Math.random() < 0.3) {
        desiredType = 'brown';
        // Los gordinflones son caros/peligrosos, la gente compra menos cantidad (1-2)
        quantity = Math.floor(Math.random() * 2) + 1; 
    }

    const newCustomer = {
        id: Date.now() + Math.random(),
        name: `${firstName} ${lastName}`,
        state: 'entering',
        progress: 0,
        waitTimer: 0,
        cart: [],
        desiredType: desiredType,
        desiredQty: quantity
    };
    
    gameState.customers.push(newCustomer);
}

function gameTick() {
    if (gameState.shopStatus !== 'open') return;

    let anyActionTaken = false;

    // Spawn aleatorio
    if (Math.random() < SPAWN_RATE_CHANCE && gameState.customers.length < MAX_CUSTOMERS_IN_STORE) {
        spawnCustomer();
        anyActionTaken = true;
    }

    // Procesar clientes existentes
    for (let i = gameState.customers.length - 1; i >= 0; i--) {
        const cust = gameState.customers[i];
        
        switch (cust.state) {
            case 'entering':
                cust.progress += 5;
                if (cust.progress >= 100) {
                    cust.state = 'shopping';
                    cust.progress = 0;
                    cust.waitTimer = 0;
                }
                break;

            case 'shopping':
                cust.waitTimer++; 
                if (cust.waitTimer > 2) { 
                    
                    const typeToTake = cust.desiredType;
                    const qtyWanted = cust.desiredQty;
                    
                    // Verificar disponibilidad específica
                    let availableStock = 0;
                    if (typeToTake === 'white') availableStock = gameState.inventory.white_wolfie;
                    if (typeToTake === 'brown') availableStock = gameState.inventory.brown_wolfie;

                    if (availableStock >= qtyWanted) {
                        // Éxito total
                        for(let k = 0; k < qtyWanted; k++) {
                            if (typeToTake === 'white') {
                                gameState.inventory.white_wolfie--;
                                cust.cart.push({ type: 'white', price: PRICE_WHITE_WOLFIE });
                            } else {
                                gameState.inventory.brown_wolfie--;
                                cust.cart.push({ type: 'brown', price: PRICE_BROWN_WOLFIE });
                            }
                        }
                        cust.state = 'going_to_checkout';
                        cust.progress = 0;
                        anyActionTaken = true;
                        
                    } else if (availableStock > 0) {
                        // Parcial
                        for(let k = 0; k < availableStock; k++) {
                             if (typeToTake === 'white') {
                                gameState.inventory.white_wolfie--;
                                cust.cart.push({ type: 'white', price: PRICE_WHITE_WOLFIE });
                            } else {
                                gameState.inventory.brown_wolfie--;
                                cust.cart.push({ type: 'brown', price: PRICE_BROWN_WOLFIE });
                            }
                        }
                        cust.state = 'going_to_checkout';
                        cust.progress = 0;
                        anyActionTaken = true;
                        
                    } else {
                        // Sin stock
                        cust.state = 'leaving_angry';
                        cust.progress = 100;
                        anyActionTaken = true;
                    }
                }
                break;

            case 'going_to_checkout':
                cust.progress += 10;
                if (cust.progress >= 100) {
                    cust.state = 'waiting_in_queue';
                    cust.progress = 0;
                }
                break;

            case 'waiting_in_queue':
                // Espera paciencia infinita por ahora, o timeout largo
                break;

            case 'leaving_happy':
            case 'leaving_angry':
                cust.progress += 10;
                if (cust.progress >= 100) {
                    gameState.customers.splice(i, 1);
                    anyActionTaken = true;
                }
                break;
        }
    }

    if (anyActionTaken || true) { // Siempre renderizar para suavidad
        renderCustomers();
        updateStoreMapView();
    }
}

// --- INTERACCIÓN DEL JUGADOR (COBRO) ---

function analyzeCartComplexity(customer) {
    const typesInCart = new Set(customer.cart.map(item => item.type));
    return typesInCart.size === 1 ? 'simple' : 'complex';
}

function attemptCheckout(customerId) {
    const customerIndex = gameState.customers.findIndex(c => c.id == customerId);
    if (customerIndex === -1) return;

    const customer = gameState.customers[customerIndex];

    if (customer.state !== 'waiting_in_queue') return;

    // NUEVO: Verificar si tiene un Gordinflón (brown)
    const hasBrown = customer.cart.some(item => item.type === 'brown');
    
    if (hasBrown) {
        // Activar la interacción peligrosa ANTES de permitir pago
        showDangerousPayModal(customer);
        return; // Salir aquí, no abrir modal de pago normal todavía
    }

    const complexity = analyzeCartComplexity(customer);

    if (complexity === 'simple') {
        showQuickPayModal(customer);
    } else {
        showManualCalcModal(customer);
    }
}

function processQuickPayment(customerId, expectedAmount) {
    const customer = gameState.customers.find(c => c.id == customerId);
    if (!customer) return;

    gameState.budget += expectedAmount;
    gameState.daily_tracker.earned_today += expectedAmount;
    gameState.stats.total_sales_lifetime += customer.cart.length;
    
    customer.state = 'leaving_happy';
    customer.progress = 100;

    hideQuickPayModal();
    updateUI();
    renderCustomers();
    showToast(`✅ Cobrado: $${expectedAmount.toFixed(2)}`);
}

function confirmPayment(inputAmount, customerId) {
    const customer = gameState.customers.find(c => c.id == customerId);
    if (!customer) return;

    const expectedTotal = customer.cart.reduce((sum, item) => sum + item.price, 0);
    const paid = parseFloat(inputAmount);

    if (isNaN(paid)) {
        showError("Por favor ingresa un número válido.");
        return;
    }

    if (paid === expectedTotal) {
        gameState.budget += paid;
        gameState.daily_tracker.earned_today += paid;
        gameState.stats.total_sales_lifetime += customer.cart.length;
        
        customer.state = 'leaving_happy';
        customer.progress = 100;
        
        hidePaymentModal();
        updateUI();
        renderCustomers();
    } else {
        showError(`Monto incorrecto. Esperado: $${expectedTotal.toFixed(2)}. Recibido: $${paid.toFixed(2)}.`);
    }
}

// --- GESTIÓN DE STOCK Y FIN DE DÍA ---

function buySingleLoteWhite() {
    if (gameState.budget >= COST_LOTE_WHITE) {
        gameState.budget -= COST_LOTE_WHITE;
        gameState.inventory.white_wolfie += UNITS_PER_LOTE_WHITE;
        updateUI(); 
        showToast(`Comprado 1 lote Blanco (+${UNITS_PER_LOTE_WHITE} uds).`);
    } else {
        showErrorToast("Fondos insuficientes.");
    }
}

function fillMaxStockWhite() {
    const currentStock = gameState.inventory.white_wolfie;
    // Límite arbitrario para blancos, digamos 48
    const maxCapacity = 48; 
    
    if (currentStock >= maxCapacity) {
        showToast("Almacén Blanco lleno.");
        return;
    }

    const neededUnits = maxCapacity - currentStock;
    const lotsNeeded = Math.ceil(neededUnits / UNITS_PER_LOTE_WHITE);
    const totalCost = lotsNeeded * COST_LOTE_WHITE;

    if (gameState.budget >= totalCost) {
        gameState.budget -= totalCost;
        gameState.inventory.white_wolfie += (lotsNeeded * UNITS_PER_LOTE_WHITE);
        
        updateUI();
        showToast(`Almacén Blanco repleto.`);
    } else {
        showErrorToast(`No tienes suficiente dinero. Necesitas $${totalCost}.`);
    }
}

function buySingleLoteBrown() {
    if (gameState.budget >= COST_LOTE_BROWN) {
        gameState.budget -= COST_LOTE_BROWN;
        gameState.inventory.brown_wolfie += UNITS_PER_LOTE_BROWN;
        updateUI(); 
        showToast(`Comprado 1 lote Marrón (+${UNITS_PER_LOTE_BROWN} uds).`);
    } else {
        showErrorToast("Fondos insuficientes para Gordinflones.");
    }
}

function fillMaxStockBrown() {
    const currentStock = gameState.inventory.brown_wolfie;
    // Límite arbitrario para marrones, digamos 24
    const maxCapacity = 24; 
    
    if (currentStock >= maxCapacity) {
        showToast("Almacén Marrón lleno.");
        return;
    }

    const neededUnits = maxCapacity - currentStock;
    const lotsNeeded = Math.ceil(neededUnits / UNITS_PER_LOTE_BROWN);
    const totalCost = lotsNeeded * COST_LOTE_BROWN;

    if (gameState.budget >= totalCost) {
        gameState.budget -= totalCost;
        gameState.inventory.brown_wolfie += (lotsNeeded * UNITS_PER_LOTE_BROWN);
        
        updateUI();
        showToast(`Almacén Marrón repleto.`);
    } else {
        showErrorToast(`No tienes suficiente dinero. Necesitas $${totalCost}.`);
    }
}

function processEndOfDay() {
    const whiteLeft = gameState.inventory.white_wolfie;
    const brownLeft = gameState.inventory.brown_wolfie;
    
    const preservationWhite = whiteLeft * PRESERVATION_COST_PER_UNIT;
    const preservationBrown = brownLeft * PRESERVATION_COST_BROWN;
    const totalPreservation = preservationWhite + preservationBrown;
    
    gameState.budget -= totalPreservation;
    
    if (gameState.budget < 0) {
        gameOver(`BANCARROTA.\nPierdes $${Math.abs(gameState.budget).toFixed(2)} adicionales.`);
        return;
    }

    const reportBody = document.getElementById('day-report-body');
    let msg = `VENTAS BRUTAS HOY: $${gameState.daily_tracker.earned_today.toFixed(2)}\n`;
    msg += `STOCK BLANCO RESTANTE: ${whiteLeft} uds (-$${preservationWhite.toFixed(2)})\n`;
    msg += `STOCK MARRÓN RESTANTE: ${brownLeft} uds (-$${preservationBrown.toFixed(2)})\n`;
    msg += `----------------------------------\n`;
    msg += `BALANCE FINAL: $${gameState.budget.toFixed(2)}\n\n`;
    
    if (gameState.daily_tracker.earned_today >= DAILY_QUOTA_GOAL) {
        msg += "✅ META DIARIA SUPERADA.";
    } else {
        msg += "⚠️ NO SE CUMPLIÓ LA META ($30.00).";
    }
    
    reportBody.textContent = msg;
    document.getElementById('day-end-modal').classList.remove('hidden');
}

function nextDay() {
    gameState.day++;
    gameState.daily_tracker.start_budget = gameState.budget;
    gameState.daily_tracker.earned_today = 0;
    gameState.customers = []; 
    
    saveGame();
    
    document.getElementById('day-end-modal').classList.add('hidden');
    updateUI();
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

function gameOver(reason) {
    alert("JUEGO TERMINADO\n" + reason);
    clearSave();
    location.reload();
}

function showErrorToast(msg) {
    console.error(msg);
    showToast(msg);
}

// Constantes nuevas
const PET_DURATION_REQUIRED = 4; // Segundos necesarios

/**
 * Función llamada desde main.js cuando se presiona una tecla
 */
function handleKeyDown(key) {
    if (gameState.shopStatus !== 'open') return; 

    const k = key.toLowerCase();

    // 1. Intentar Agarrar (Tecla G)
    if (k === 'g') {
        if (gameState.interactionMode === 'grabbing') {
             gameState.interactionMode = 'petting';
             gameState.petTimer = 0; 
             startPettingTimer();
             updateInteractionUI();
        }
    }
}

function handleKeyUp(key) {
    const k = key.toLowerCase();
    
    // Si sueltas P antes de completar 4 segundos, fallas
    if (k === 'p' && gameState.interactionMode === 'petting') {
        failInteraction("Soltaste demasiado pronto. ¡Mordisco!");
    }
    
    // Si sueltas G mientras acaricias, también falla
    if (k === 'g' && gameState.interactionMode === 'petting') {
         failInteraction("Perdiste el agarre. ¡Mordisco!");
    }
}

let petInterval = null;

function startPettingTimer() {
    clearInterval(petInterval);
    petInterval = setInterval(() => {
        gameState.petTimer += 0.1; 
        
        const progressBar = document.getElementById('pet-progress-bar');
        if(progressBar) {
            const percent = Math.min((gameState.petTimer / PET_DURATION_REQUIRED) * 100, 100);
            progressBar.style.width = `${percent}%`;
        }

        if (gameState.petTimer >= PET_DURATION_REQUIRED) {
            succeedInteraction();
        }
    }, 100);
}

function succeedInteraction() {
    clearInterval(petInterval);
    gameState.interactionMode = null;
    gameState.petTimer = 0;
    
    showToast("✅ Control exitoso. Procediendo a caja.");
    updateInteractionUI();
    
    const pendingCustomer = gameState.pendingCustomerForPayment;
    if (pendingCustomer) {
        const complexity = analyzeCartComplexity(pendingCustomer);
        if (complexity === 'simple') showQuickPayModal(pendingCustomer);
        else showManualCalcModal(pendingCustomer);
        
        gameState.pendingCustomerForPayment = null; 
    }
}

function failInteraction(reason) {
    clearInterval(petInterval);
    gameState.interactionMode = null;
    gameState.petTimer = 0;
    
    showToast(`❌ ${reason}`);
    
    // Penalización: El cliente se va angry
    if (gameState.pendingCustomerForPayment) {
        const idx = gameState.customers.findIndex(c => c.id == gameState.pendingCustomerForPayment.id);
        if (idx !== -1) {
            gameState.customers[idx].state = 'leaving_angry';
            gameState.customers[idx].progress = 100;
        }
        gameState.pendingCustomerForPayment = null;
    }
    
    updateInteractionUI();
    renderCustomers();
}

function updateInteractionUI() {
    const overlay = document.getElementById('interaction-overlay');
    if (!overlay) return;

    if (gameState.interactionMode) {
        overlay.classList.remove('hidden');
        
        const instruction = document.getElementById('interaction-instruction');
        const barContainer = document.getElementById('pet-bar-container');
        
        if (gameState.interactionMode === 'grabbing') {
            instruction.innerHTML = `⚠️ ATENCIÓN: Este cliente trae un <strong>Lobito Gordinflón</strong>.<br>Para evitar mordiscos:<br>1. Presiona <kbd>G</kbd> para agarrarlo.<br>2. Mantén <kbd>P</kbd> por 4s para calmarlo.`;
            barContainer.classList.add('hidden');
        } else if (gameState.interactionMode === 'petting') {
            instruction.textContent = "MAINTÉN [P] POR 4 SEGUNDOS PARA ACARICIARLO";
            barContainer.classList.remove('hidden');
        }
    } else {
        overlay.classList.add('hidden');
    }
}
