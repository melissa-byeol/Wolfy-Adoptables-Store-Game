// js/logic.js - VERSIÓN V3.1 SIMULACIÓN ACTIVA + CARGA MÚLTIPLE

// --- CONSTANTES ECONÓMICAS Y DE CONFIGURACIÓN ---
const COST_LOTE_WHITE = 5.00;
const UNITS_PER_LOTE = 12;
const PRICE_WHITE_WOLFIE = 1.00; // Precio unitario de venta
const PRESERVATION_COST_PER_UNIT = 0.50;
const DAILY_QUOTA_GOAL = 30.00;
const MAX_CUSTOMERS_IN_STORE = 8; 
const SPAWN_RATE_CHANCE = 0.15;   
const MAX_CAPACITY_VISUAL = 72;

// Listas simplificadas
const FIRST_NAMES = ["Alejandro", "Sofia", "Mateo", "Valentina", "Diego", "Camila", "Lucas", "Emma"];
const LAST_NAMES = ["García", "Rodríguez", "Martínez", "López", "Hernández", "Torres", "Flores", "Rivera"];

let gameInterval = null; 

// --- INICIALIZACIÓN ---

function initNewGame() {
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    gameState.budget = 10.00; 
    gameState.inventory.white_wolfie = 24;
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

function gameTick() {
    let anyActionTaken = false;

    for (let i = gameState.customers.length - 1; i >= 0; i--) {
        const cust = gameState.customers[i];
        
        switch (cust.state) {
            case 'entering':
                cust.progress += 10; 
                if (cust.progress >= 100) {
                    cust.state = 'shopping';
                    cust.progress = 0; 
                    anyActionTaken = true;
                }
                break;

            case 'shopping':
                cust.waitTimer++; 
                if (cust.waitTimer > 2) { 
                    
                    // Lógica de cantidad aleatoria (1-4)
                    if (gameState.inventory.white_wolfie >= cust.desiredQty) {
                        for(let k = 0; k < cust.desiredQty; k++) {
                            gameState.inventory.white_wolfie--;
                            cust.cart.push({ type: 'white', price: PRICE_WHITE_WOLFIE });
                        }
                        cust.state = 'going_to_checkout';
                        cust.progress = 0;
                        anyActionTaken = true;
                        
                    } else if (gameState.inventory.white_wolfie > 0) {
                        // Toma lo que hay disponible
                        const availableStock = gameState.inventory.white_wolfie;
                        for(let k = 0; k < availableStock; k++) {
                            gameState.inventory.white_wolfie--;
                            cust.cart.push({ type: 'white', price: PRICE_WHITE_WOLFIE });
                        }
                        cust.state = 'going_to_checkout';
                        cust.progress = 0;
                        anyActionTaken = true;
                        
                    } else {
                        cust.state = 'leaving_angry';
                        cust.progress = 100;
                        anyActionTaken = true;
                    }
                }
                break;

            case 'going_to_checkout':
                cust.progress += 15; 
                if (cust.progress >= 100) {
                    cust.state = 'waiting_in_queue';
                    cust.progress = 100;
                    anyActionTaken = true;
                }
                break;

            case 'leaving_happy':
            case 'leaving_angry':
                cust.progress -= 20; 
                if (cust.progress <= -50) {
                    gameState.customers.splice(i, 1);
                    anyActionTaken = true;
                }
                break;
            
            case 'waiting_in_queue':
                break;
        }
    }

    if (gameState.customers.length < MAX_CUSTOMERS_IN_STORE) {
        if (Math.random() < SPAWN_RATE_CHANCE) {
            spawnCustomer();
            anyActionTaken = true;
        }
    }

    if (anyActionTaken) {
        renderCustomers();
        updateStoreMapView(); 
    }
}

function spawnCustomer() {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const desiredQuantity = Math.floor(Math.random() * 4) + 1; // 1 a 4
    
    const newCustomer = {
        id: Date.now() + Math.random(),
        name: `${firstName} ${lastName}`,
        state: 'entering',
        progress: 0,
        waitTimer: 0,
        cart: [],
        desiredQty: desiredQuantity 
    };
    
    gameState.customers.push(newCustomer);
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

function buySingleLote() {
    if (gameState.budget >= COST_LOTE_WHITE) {
        gameState.budget -= COST_LOTE_WHITE;
        gameState.inventory.white_wolfie += UNITS_PER_LOTE;
        updateUI(); 
        showToast(`Comprado 1 lote (+${UNITS_PER_LOTE} uds).`);
    } else {
        showErrorToast("Fondos insuficientes.");
    }
}

function fillMaxStock() {
    const currentStock = gameState.inventory.white_wolfie;
    const maxCapacity = MAX_CAPACITY_VISUAL; 
    
    if (currentStock >= maxCapacity) {
        showToast("El almacén ya está lleno.");
        return;
    }

    const neededUnits = maxCapacity - currentStock;
    const lotsNeeded = Math.ceil(neededUnits / UNITS_PER_LOTE);
    const totalCost = lotsNeeded * COST_LOTE_WHITE;

    if (gameState.budget >= totalCost) {
        gameState.budget -= totalCost;
        gameState.inventory.white_wolfie += (lotsNeeded * UNITS_PER_LOTE);
        
        updateUI();
        showToast(`Almacén repleto. Comprados ${lotsNeeded} lotes por $${totalCost}.`);
    } else {
        showErrorToast(`No tienes suficiente dinero. Necesitas $${totalCost}.`);
    }
}

function processEndOfDay() {
    const unitsLeft = gameState.inventory.white_wolfie;
    const preservationCost = unitsLeft * PRESERVATION_COST_PER_UNIT;
    
    gameState.budget -= preservationCost;
    
    if (gameState.budget < 0) {
        gameOver(`BANCARROTA.\nPierdes $${Math.abs(gameState.budget).toFixed(2)} adicionales.`);
        return;
    }

    const reportBody = document.getElementById('day-report-body');
    let msg = `VENTAS BRUTAS HOY: $${gameState.daily_tracker.earned_today.toFixed(2)}\n`;
    msg += `STOCK RESTANTE: ${unitsLeft} uds\n`;
    msg += `IMPUESTO PRESERVACIÓN: -$${preservationCost.toFixed(2)}\n`;
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
    showToast(msg); // Reutilizamos toast para errores simples
}

// Constantes nuevas
const COST_LOTE_BROWN = 12.00;
const PRICE_BROWN_WOLFIE = 2.50;
const PRESERVATION_COST_BROWN = 2.00;
const PET_DURATION_REQUIRED = 4; // Segundos necesarios

/**
 * Función llamada desde main.js cuando se presiona una tecla
 */
function handleKeyDown(key) {
    if (gameState.shopStatus !== 'open') return; // Solo interactuar con tienda abierta

    const k = key.toLowerCase();

    // 1. Intentar Agarrar (Tecla G)
    if (k === 'g') {
        // Verificar si hay un cliente esperando con un Gordinflón en su carrito
        // O si el jugador quiere inspeccionar el estante (opcional, por ahora nos centramos en cobro/peligro)
        
        // Para MVP: Simularemos que el peligro ocurre AL MOMENTO DE COBRAR 
        // si el cliente tiene un Gordinflón y el jugador no hace la secuencia correcta.
        // Pero mejor: Hagamos que sea una mini-interfaz modal obligatoria antes de cobrar.
        
        console.log("Modo Agarre activado.");
        gameState.interactionMode = 'grabbing';
        updateInteractionUI();
    }

    // 2. Intentar Acariciar (Tecla P) - Solo válido si ya agarraste
    if (k === 'p' && gameState.interactionMode === 'grabbing') {
        gameState.interactionMode = 'petting';
        gameState.petTimer = 0; // Resetear timer
        
        // Iniciar contador visual
        startPettingTimer();
        updateInteractionUI();
    }
}

function handleKeyUp(key) {
    const k = key.toLowerCase();
    
    // Si sueltas P antes de completar 4 segundos, fallas
    if (k === 'p' && gameState.interactionMode === 'petting') {
        failInteraction("Soltaste demasiado pronto. ¡Mordisco!");
    }
    
    // Si sueltas G mientras acaricias, también falla (perdiste el control)
    if (k === 'g' && gameState.interactionMode === 'petting') {
         failInteraction("Perdiste el agarre. ¡Mordisco!");
    }
}

let petInterval = null;

function startPettingTimer() {
    clearInterval(petInterval);
    petInterval = setInterval(() => {
        gameState.petTimer += 0.1; // Incremento cada 100ms
        
        // Actualizar barra de progreso visualmente
        const progressBar = document.getElementById('pet-progress-bar');
        if(progressBar) {
            const percent = Math.min((gameState.petTimer / PET_DURATION_REQUIRED) * 100, 100);
            progressBar.style.width = `${percent}%`;
        }

        // Éxito
        if (gameState.petTimer >= PET_DURATION_REQUIRED) {
            succeedInteraction();
        }
    }, 100);
}

function succeedInteraction() {
    clearInterval(petInterval);
    gameState.interactionMode = null;
    gameState.petTimer = 0;
    
    showToast("✅ Control exitoso. Puedes proceder con la venta.");
    updateInteractionUI();
    
    // Aquí liberaríamos al cliente para que pague normalmente
    // Por simplicidad, asumiremos que esto desbloquea el botón de "Confirmar Pago" en el modal
}

function failInteraction(reason) {
    clearInterval(petInterval);
    gameState.interactionMode = null;
    gameState.petTimer = 0;
    
    // Penalización: El cliente se va enfadado sin pagar o paga menos?
    // Digamos que pierde la confianza: El cliente se va ANGRY.
    showToast(`❌ ${reason}`);
    
    // Buscar al cliente actual (el que estaba en cola) y hacerlo salir
    // Esto requiere pasar el ID del cliente a esta función, lo cual haremos en el Modal
    updateInteractionUI();
}

function updateInteractionUI() {
    const overlay = document.getElementById('interaction-overlay');
    if (!overlay) return;

    if (gameState.interactionMode) {
        overlay.classList.remove('hidden');
        
        const instruction = document.getElementById('interaction-instruction');
        const barContainer = document.getElementById('pet-bar-container');
        
        if (gameState.interactionMode === 'grabbing') {
            instruction.textContent = "PRESIONA [G] PARA AGARRARLO DEL CUELLO";
            barContainer.classList.add('hidden');
        } else if (gameState.interactionMode === 'petting') {
            instruction.textContent = "MAINTÉN [P] POR 4 SEGUNDOS PARA ACARICIARLO";
            barContainer.classList.remove('hidden');
        }
    } else {
        overlay.classList.add('hidden');
    }
}
