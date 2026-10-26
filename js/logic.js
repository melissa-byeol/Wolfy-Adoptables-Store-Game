// js/logic.js - VERSIÓN V3.1 FIX SPAWN & MOBILE READY

// --- CONSTANTES ECONÓMICAS Y DE CONFIGURACIÓN ---
const COST_LOTE_WHITE = 5.00;
const UNITS_PER_LOTE_WHITE = 12;
const PRICE_WHITE_WOLFIE = 1.00; 

const COST_LOTE_BROWN = 12.00;
const UNITS_PER_LOTE_BROWN = 6;
const PRICE_BROWN_WOLFIE = 2.50;

const PRESERVATION_COST_PER_UNIT = 0.50;
const PRESERVATION_COST_BROWN = 2.00;

const DAILY_QUOTA_GOAL = 30.00;
const MAX_CUSTOMERS_IN_STORE = 8; 
const SPAWN_RATE_CHANCE = 0.15;   
const MAX_CAPACITY_VISUAL = 72;

let gameInterval = null; 

// Listas simplificadas
const FIRST_NAMES = ["Alejandro", "Sofia", "Mateo", "Valentina", "Diego", "Camila", "Lucas", "Emma"];
const LAST_NAMES = ["García", "Rodríguez", "Martínez", "López", "Hernández", "Torres", "Flores", "Rivera"];

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
    gameState.interactionMode = null;
    gameState.pendingCustomerForPayment = null;

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
    
    // Actualizar UI inmediata
    const btnToggle = document.getElementById('btn-toggle-shop');
    if(btnToggle) {
        btnToggle.textContent = "CERRAR TIENDA";
        btnToggle.classList.remove('success');
        btnToggle.classList.add('danger');
    }
    
    const statusEl = document.getElementById('display-shop-status');
    if(statusEl) {
        statusEl.textContent = "ABIERTA";
        statusEl.className = "stat-item status-open";
    }

    // Iniciar Loop Principal
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameTick, 500);
    
    // Spawn inicial garantizado
    setTimeout(() => {
        if(gameState.shopStatus === 'open') {
            spawnCustomer();
            spawnCustomer();
        }
    }, 100);
}

function closeShop() {
    if (gameState.shopStatus === 'closed') return;

    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    gameState.shopStatus = 'closed';
    gameState.customers = []; 

    processEndOfDay();
    
    const btnToggle = document.getElementById('btn-toggle-shop');
    if(btnToggle) {
        btnToggle.textContent = "ABRIR TIENDA";
        btnToggle.classList.remove('danger');
        btnToggle.classList.add('success');
    }
    
    const statusEl = document.getElementById('display-shop-status');
    if(statusEl) {
        statusEl.textContent = "CERRADA";
        statusEl.className = "stat-item status-closed";
    }
}

// --- LÓGICA DE SIMULACIÓN (EL TICK) ---

function spawnCustomer() {
    // Validación de estado
    if (!gameState || gameState.shopStatus !== 'open') return;
    if (gameState.customers.length >= MAX_CUSTOMERS_IN_STORE) return;

    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    let desiredType = 'white';
    let quantity = Math.floor(Math.random() * 4) + 1;
    
    // Lógica de preferencia Brown
    if (gameState.inventory.brown_wolfie > 0 && Math.random() < 0.3) {
        desiredType = 'brown';
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
    console.log(`Spawned: ${newCustomer.name} wants ${quantity}x ${desiredType}`);
}

function gameTick() {
    if (!gameState || gameState.shopStatus !== 'open') return;

    let anyActionTaken = false;

    // 1. Intentar Spawn Aleatorio
    if (Math.random() < SPAWN_RATE_CHANCE) {
        spawnCustomer();
        anyActionTaken = true;
    }

    // 2. Procesar Clientes Existentes
    // Iteramos hacia atrás para poder eliminar elementos sin romper índices
    for (let i = gameState.customers.length - 1; i >= 0; i--) {
        const cust = gameState.customers[i];
        
        switch (cust.state) {
            case 'entering':
                cust.progress += 5; // Velocidad de entrada
                if (cust.progress >= 100) {
                    cust.state = 'shopping';
                    cust.progress = 0;
                    cust.waitTimer = 0;
                    anyActionTaken = true;
                }
                break;

            case 'shopping':
                cust.waitTimer++; 
                // Tiempo de espera antes de decidir compra (simula mirar estantes)
                if (cust.waitTimer > 2) { 
                    
                    const typeToTake = cust.desiredType;
                    const qtyWanted = cust.desiredQty;
                    
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
                        // Sin stock -> Se va enfadado
                        cust.state = 'leaving_angry';
                        cust.progress = 0; // Reiniciamos progreso para animación de salida
                        anyActionTaken = true;
                    }
                }
                break;

            case 'going_to_checkout':
                cust.progress += 10; // Velocidad hacia caja
                if (cust.progress >= 100) {
                    cust.state = 'waiting_in_queue';
                    cust.progress = 0;
                    anyActionTaken = true;
                }
                break;

            case 'waiting_in_queue':
                // Paciencia infinita por ahora. El jugador debe actuar.
                break;

            case 'leaving_happy':
            case 'leaving_angry':
                cust.progress += 10; // Animación de salida
                if (cust.progress >= 100) {
                    gameState.customers.splice(i, 1); // Eliminar del array
                    anyActionTaken = true;
                }
                break;
        }
    }

    // Renderizar SIEMPRE si hubo cambios o siempre para suavidad
    // Nota: En móvil, renderizar cada 500ms es barato.
    renderCustomers();
    updateStoreMapView();
    updateUI(); // Actualiza textos de dinero/meta
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

    // VERIFICACIÓN DE PELIGRO (Brown Wolfies)
    const hasBrown = customer.cart.some(item => item.type === 'brown');
    
    if (hasBrown) {
        showDangerousPayModal(customer);
        return; // Detener flujo normal
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
    customer.progress = 0; // Reset para animación

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

    // Tolerancia pequeña para decimales flotantes (ej 2.50 vs 2.49999)
    if (Math.abs(paid - expectedTotal) < 0.01) {
        gameState.budget += paid;
        gameState.daily_tracker.earned_today += paid;
        gameState.stats.total_sales_lifetime += customer.cart.length;
        
        customer.state = 'leaving_happy';
        customer.progress = 0;
        
        hidePaymentModal();
        updateUI();
        renderCustomers();
        showToast(`✅ Pago Confirmado: $${paid.toFixed(2)}`);
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
    const maxCapacity = 48; // Límite visual/blanco
    
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
    const maxCapacity = 24; // Límite visual/marrón
    
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
    if(reportBody) {
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
}

function nextDay() {
    gameState.day++;
    gameState.daily_tracker.start_budget = gameState.budget;
    gameState.daily_tracker.earned_today = 0;
    gameState.customers = []; 
    gameState.shopStatus = 'closed'; // Forzar cierre lógico
    
    saveGame();
    
    const dayEndModal = document.getElementById('day-end-modal');
    if(dayEndModal) dayEndModal.classList.add('hidden');
    
    updateUI();
    
    // Resetear botón de tienda
    const btnToggle = document.getElementById('btn-toggle-shop');
    if(btnToggle) {
        btnToggle.textContent = "ABRIR TIENDA";
        btnToggle.className = "btn success large";
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

function gameOver(reason) {
    alert("JUEGO TERMINADO\n" + reason);
    clearSave();
    location.reload();
}

function showErrorToast(msg) {
    console.error(msg);
    showToast(msg);
}

// --- MECÁNICA DE PELIGRO (QTE) ---

const PET_DURATION_REQUIRED = 4; // Segundos necesarios

function handleKeyDown(key) {
    if (!gameState || gameState.shopStatus !== 'open') return; 

    const k = key.toLowerCase();

    // Solo interactuar si estamos en modo grabbing o petting
    if (gameState.interactionMode === 'grabbing') {
        if (k === 'g') {
             gameState.interactionMode = 'petting';
             gameState.petTimer = 0; 
             startPettingTimer();
             updateInteractionUI();
        }
    }
}

function handleKeyUp(key) {
    if (!gameState) return;
    const k = key.toLowerCase();
    
    // Si sueltas P durante el acariciado -> Falla
    if (k === 'p' && gameState.interactionMode === 'petting') {
        failInteraction("Soltaste demasiado pronto. ¡Mordisco!");
    }
    
    // Si sueltas G durante el acariciado -> Falla (perdiste control)
    if (k === 'g' && gameState.interactionMode === 'petting') {
         failInteraction("Perdiste el agarre. ¡Mordisco!");
    }
}

let petInterval = null;

function startPettingTimer() {
    clearInterval(petInterval);
    petInterval = setInterval(() => {
        if (!gameState || gameState.interactionMode !== 'petting') {
            clearInterval(petInterval);
            return;
        }
        
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
        // Reabrir modal de pago correspondiente
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
            gameState.customers[idx].progress = 0;
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
        
        if (instruction) {
            if (gameState.interactionMode === 'grabbing') {
                instruction.innerHTML = `⚠️ ATENCIÓN: Este cliente trae un <strong>Lobito Gordinflón</strong>.<br>Para evitar mordiscos:<br>1. Presiona <kbd>G</kbd> para agarrarlo.<br>2. Mantén <kbd>P</kbd> por 4s para calmarlo.`;
                if(barContainer) barContainer.classList.add('hidden');
            } else if (gameState.interactionMode === 'petting') {
                instruction.textContent = "MAINTÉN [P] POR 4 SEGUNDOS PARA ACARICIARLO";
                if(barContainer) barContainer.classList.remove('hidden');
            }
        }
    } else {
        overlay.classList.add('hidden');
    }
}
