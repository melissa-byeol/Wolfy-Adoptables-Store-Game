// js/logic.js - VERSIÓN V3 SIMULACIÓN ACTIVA

// --- CONSTANTES ECONÓMICAS Y DE CONFIGURACIÓN ---
const COST_LOTE_WHITE = 5.00;
const UNITS_PER_LOTE = 12;
const PRICE_WHITE_WOLFIE = 1.00; // Precio unitario de venta
const PRESERVATION_COST_PER_UNIT = 0.50;
const DAILY_QUOTA_GOAL = 30.00;
const MAX_CUSTOMERS_IN_STORE = 8; // Límite de bolitas visibles simultáneamente
const SPAWN_RATE_CHANCE = 0.15;   // Probabilidad de que entre alguien nuevo cada tick

// Listas simplificadas para el ejemplo (Usa tus listas completas luego)
const FIRST_NAMES = ["Alejandro", "Sofia", "Mateo", "Valentina", "Diego", "Camila", "Lucas", "Emma"];
const LAST_NAMES = ["García", "Rodríguez", "Martínez", "López", "Hernández", "Torres", "Flores", "Rivera"];

let gameInterval = null; // Referencia al intervalo del juego

// --- INICIALIZACIÓN ---

function initNewGame() {
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    
    // Presupuesto inicial bajo, dependemos del stock regalado
    gameState.budget = 10.00; 
    
    // Stock inicial: 2 lotes gratis (24 unidades)
    gameState.inventory.white_wolfie = 24;
    
    // Resetear trackers diarios
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
    gameState.customers = []; // Limpiar clientes residuales
    
    // Actualizar UI inmediata
    document.getElementById('btn-toggle-shop').textContent = "CERRAR TIENDA";
    document.getElementById('btn-toggle-shop').classList.remove('success');
    document.getElementById('btn-toggle-shop').classList.add('danger');
    document.getElementById('display-shop-status').textContent = "ABIERTA";
    document.getElementById('display-shop-status').style.color = "#4caf50";

    // Iniciar Bucle Principal (cada 500ms para suavidad visual)
    gameInterval = setInterval(gameTick, 500);
    
    // Generar primeros clientes inmediatamente
    spawnCustomer();
    spawnCustomer();
}

function closeShop() {
    if (gameState.shopStatus === 'closed') return;

    clearInterval(gameInterval);
    gameInterval = null;
    gameState.shopStatus = 'closed';
    
    // Los clientes que quedaban se van sin comprar (pérdida de oportunidad, pero no penalización directa aún)
    gameState.customers = []; 

    // Procesar fin de día automático o esperar botón? 
    // Según tu flujo: "una vez todo el stock se vaya... presionas cerrar".
    // Pero también necesitas poder cerrar manualmente si quieres parar.
    // Aquí llamamos a processEndOfDay solo si confirmamos cierre total.
    // Para MVP, asumiremos que Cerrar Tienda = Terminar Día.
    
    processEndOfDay();
    
    // Resetear botones para próximo día
    document.getElementById('btn-toggle-shop').textContent = "ABRIR TIENDA";
    document.getElementById('btn-toggle-shop').classList.remove('danger');
    document.getElementById('btn-toggle-shop').classList.add('success');
    document.getElementById('display-shop-status').textContent = "CERRADA";
    document.getElementById('display-shop-status').style.color = "#f44336";
}

// --- LÓGICA DE SIMULACIÓN (EL TICK) ---

function gameTick() {
    let anyActionTaken = false;

    // 1. Movimiento de Clientes Existentes
    for (let i = gameState.customers.length - 1; i >= 0; i--) {
        const cust = gameState.customers[i];
        
        switch (cust.state) {
            case 'entering':
                cust.progress += 10; // Avanza hacia estantes
                if (cust.progress >= 100) {
                    cust.state = 'shopping';
                    cust.progress = 0; // Reinicia progreso para fase shopping
                    anyActionTaken = true;
                }
                break;

                        case 'shopping':
                // Tiempo simulado en estante
                cust.waitTimer++; 
                
                if (cust.waitTimer > 2) { // Tarda 2 ticks (1 seg aprox)
                    
                    // Verificar si hay stock suficiente para lo que quiere
                    if (gameState.inventory.white_wolfie >= cust.desiredQty) {
                        
                        // Éxito: Se lleva TODOS los que quería
                        for(let i = 0; i < cust.desiredQty; i++) {
                            gameState.inventory.white_wolfie--;
                            cust.cart.push({ type: 'white', price: PRICE_WHITE_WOLFIE });
                        }
                        
                        cust.state = 'going_to_checkout';
                        cust.progress = 0;
                        anyActionTaken = true;
                        
                    } else if (gameState.inventory.white_wolfie > 0) {
                        
                        // Parcial: No tiene todos, pero toma lo que queda
                        // Esto crea drama: ¿Se irá enfadado o aceptará lo poco?
                        // Para MVP simple: Toma lo que hay y se va feliz con eso.
                        const availableStock = gameState.inventory.white_wolfie;
                        for(let i = 0; i < availableStock; i++) {
                            gameState.inventory.white_wolfie--;
                            cust.cart.push({ type: 'white', price: PRICE_WHITE_WOLFIE });
                        }
                        cust.state = 'going_to_checkout';
                        cust.progress = 0;
                        anyActionTaken = true;
                        
                    } else {
                        // Sin stock total: Se va molesto
                        cust.state = 'leaving_angry';
                        cust.progress = 100;
                        anyActionTaken = true;
                    }
                }
                break;

            case 'going_to_checkout':
                cust.progress += 15; // Más rápido caminando a caja
                if (cust.progress >= 100) {
                    cust.state = 'waiting_in_queue';
                    cust.progress = 100;
                    anyActionTaken = true;
                }
                break;

            case 'leaving_happy':
            case 'leaving_angry':
                cust.progress -= 20; // Retrocede hacia salida
                if (cust.progress <= -50) {
                    // Eliminar del array
                    gameState.customers.splice(i, 1);
                    anyActionTaken = true;
                }
                break;
            
            case 'waiting_in_queue':
                // No hace nada hasta que el jugador haga clic
                break;
        }
    }

    // 2. Spawn de Nuevos Clientes
    if (gameState.customers.length < MAX_CUSTOMERS_IN_STORE) {
        if (Math.random() < SPAWN_RATE_CHANCE) {
            spawnCustomer();
            anyActionTaken = true;
        }
    }

    // 3. Renderizado (Solo si hubo cambios para optimizar)
    if (anyActionTaken) {
        renderCustomers();
        updateStoreMapView(); // Actualizar estantes visuales
    }
}

function spawnCustomer() {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    // --- NUEVA LÓGICA DE CANTIDAD ALEATORIA ---
    // Genera un número entero entre 1 y 4 inclusive
    const desiredQuantity = Math.floor(Math.random() * 4) + 1; 
    // --------------------------------------------------

    const newCustomer = {
        id: Date.now() + Math.random(),
        name: `${firstName} ${lastName}`,
        state: 'entering',
        progress: 0,
        waitTimer: 0,
        cart: [],
        desiredQty: desiredQuantity // Guardamos cuántos QUIERE llevarse
    };
    
    gameState.customers.push(newCustomer);
}

// --- INTERACCIÓN DEL JUGADOR (COBRO) ---

function attemptCheckout(customerId) {
    const customerIndex = gameState.customers.findIndex(c => c.id == customerId);
    if (customerIndex === -1) return;

    const customer = gameState.customers[customerIndex];

    // Solo puede cobrar si está esperando en la cola
    if (customer.state !== 'waiting_in_queue') return;

    showPaymentModal(customer);
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

    // Comparación exacta (para MVP simple). En juegos reales permitirías cambio.
    if (paid === expectedTotal) {
        // Éxito
        gameState.budget += paid;
        gameState.daily_tracker.earned_today += paid;
        gameState.stats.total_sales_lifetime += customer.cart.length;
        
        // Cliente satisfecho se va
        customer.state = 'leaving_happy';
        customer.progress = 100; // Desde la caja hacia afuera
        
        hidePaymentModal();
        updateUI(); // Refrescar dinero
        renderCustomers(); // Refrescar movimiento
    } else {
        // Fallo
        showError(`Monto incorrecto. El recibo dice $${expectedTotal.toFixed(2)}. Tú ingresaste $${paid.toFixed(2)}.`);
    }
}

// --- GESTIÓN DE STOCK Y FIN DE DÍA ---

function buyLoteWhite() {
    // Permitir compra incluso con tienda abierta (reposición rápida)
    if (gameState.budget >= COST_LOTE_WHITE) {
        gameState.budget -= COST_LOTE_WHITE;
        gameState.inventory.white_wolfie += UNITS_PER_LOTE;
        updateUI();
        updateStoreMapView();
        showToast(`Reposición exitosa (+${UNITS_PER_LOTE} uds).`);
    } else {
        showToast("Fondos insuficientes para comprar lote ($5.00).");
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

    // Preparar reporte
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
    gameState.customers = []; // Asegurar limpieza
    
    saveGame();
    
    document.getElementById('day-end-modal').classList.add('hidden');
    updateUI();
}

function checkQuotaStatus() {
    const statusEl = document.getElementById('display-quota-status');
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
