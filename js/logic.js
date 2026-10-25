// Constantes Económicas
const COST_LOTE_WHITE = 5.00;
const UNITS_PER_LOTE = 12;
const PROFIT_PER_UNIT_WHITE = 1.00;
const PRESERVATION_COST_PER_UNIT = 0.50;
const DAILY_QUOTA_GOAL = 30.00;
const MAX_CAPACITY_VISUAL = 72;

function initNewGame() {
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    gameState.budget = 10.00; // Fondo inicial pequeño
    gameState.daily_tracker.start_budget = gameState.budget;
    gameState.daily_tracker.earned_today = 0;
    
    // IMPORTANTE: Construir la rejilla antes de actualizar UI
    initStoreGrid(); 
    
    updateUI();
    showModal("Bienvenido", "Tu tienda está lista.\nHaz clic en las cajas blancas para venderlas.\nCapacidad máxima: 72 unidades.");
}

function buyLoteWhite() {
    if (gameState.budget >= COST_LOTE_WHITE) {
        gameState.budget -= COST_LOTE_WHITE;
        gameState.inventory.white_wolfie += UNITS_PER_LOTE;
        updateUI();
        checkQuotaStatus();
    } else {
        showToast("Fondos insuficientes para comprar lote.");
    }
}

function sellUnitWhite() {
    if (gameState.inventory.white_wolfie > 0) {
        gameState.inventory.white_wolfie -= 1;
        gameState.budget += PROFIT_PER_UNIT_WHITE;
        gameState.daily_tracker.earned_today += PROFIT_PER_UNIT_WHITE;
        gameState.stats.total_sales_lifetime++;
        
        updateUI();
        checkQuotaStatus();
    } else {
        showToast("No hay stock de Lobitos Básicos.");
    }
}

function restockAllShelves() {
    const currentStock = gameState.inventory.white_wolfie;
    
    if (currentStock >= MAX_CAPACITY_VISUAL) {
        showToast("Los estantes ya están llenos.");
        return;
    }

    const neededUnits = MAX_CAPACITY_VISUAL - currentStock;
    const lotsToBuy = Math.ceil(neededUnits / UNITS_PER_LOTE);
    const cost = lotsToBuy * COST_LOTE_WHITE;

    if (gameState.budget >= cost) {
        gameState.budget -= cost;
        gameState.inventory.white_wolfie += (lotsToBuy * UNITS_PER_LOTE);
        
        // Cap opcional: Si compraste de más, lo guardamos en "almacén invisible"?
        // Por ahora, permitimos que el número suba, pero visualmente solo se ven 72.
        // Para mantener la coherencia simple, no limitamos el número interno, 
        // pero el usuario sabe que visualmente hay tope.
        
        updateUI();
        showToast(`Comprados ${lotsToBuy} lotes por $${cost}.`);
    } else {
        showToast("Fondos insuficientes para rellenar todo.");
    }
}

function endDay() {
    const unitsLeft = gameState.inventory.white_wolfie;
    const preservationCost = unitsLeft * PRESERVATION_COST_PER_UNIT;
    
    gameState.budget -= preservationCost;
    
    if (gameState.budget < 0) {
        gameOver(`Bancarrota.\nPierdes $${Math.abs(gameState.budget).toFixed(2)} adicionales.`);
        return;
    }

    let quotaMessage = "";
    if (gameState.daily_tracker.earned_today < DAILY_QUOTA_GOAL) {
        quotaMessage = `\n⚠️ Advertencia: No cumpliste la meta de ventas (${DAILY_QUOTA_GOAL}).`;
    } else {
        quotaMessage = "\n✅ Meta diaria superada.";
    }

    gameState.day++;
    gameState.stats.days_survived++;
    gameState.daily_tracker.start_budget = gameState.budget;
    gameState.daily_tracker.earned_today = 0;

    saveGame();
    updateUI();
    showModal(`Fin del Día ${gameState.day - 1}`, `Costo de preservación: -$${preservationCost.toFixed(2)}\nNuevo Balance: $${gameState.budget.toFixed(2)}${quotaMessage}`);
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
