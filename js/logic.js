// Constantes Económicas
const COST_LOTE_WHITE = 5.00;
const UNITS_PER_LOTE = 12;
const PROFIT_PER_UNIT_WHITE = 1.00;
const PRESERVATION_COST_PER_UNIT = 0.50;
const DAILY_QUOTA_GOAL = 30.00;

function initNewGame() {
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    
    // Regla especial: Empezamos con 2 lotes gratis (24 uds) y $0 cash? 
    // O mejor: Nos dan el stock Y algo de dinero para operar?
    // Según tu regla: "quizas podría dar 2 lotes... en vez de $100".
    // Asumiremos que empezamos con $0 cash pero con stock, o quizás un pequeño colchón.
    // Para hacerlo jugable, demos $10 de efectivo inicial además del stock, 
    // o simplemente permitamos vender lo que tenemos.
    
    gameState.budget = 10.00; // Pequeño fondo operativo inicial
    gameState.daily_tracker.start_budget = gameState.budget;
    gameState.daily_tracker.earned_today = 0;
    
    updateUI();
    showModal("Bienvenido", "Has recibido 2 lotes de Lobitos Básicos (24 unidades).\nTu meta es superar tus gastos diarios.");
}

function buyLoteWhite() {
    if (gameState.budget >= COST_LOTE_WHITE) {
        gameState.budget -= COST_LOTE_WHITE;
        gameState.inventory.white_wolfie += UNITS_PER_LOTE;
        
        // Nota: Comprar no cuenta como "ganancia" directa, es inversión.
        // Pero reduce el presupuesto disponible.
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
        
        // Registrar ganancia para la cuota diaria
        gameState.daily_tracker.earned_today += PROFIT_PER_UNIT_WHITE;
        gameState.stats.total_sales_lifetime++;
        
        updateUI();
        checkQuotaStatus();
    } else {
        showToast("No hay stock de Lobitos Básicos.");
    }
}

function endDay() {
    // 1. Calcular costo de preservación sobre EL STOCK RESTANTE
    const unitsLeft = gameState.inventory.white_wolfie;
    const preservationCost = unitsLeft * PRESERVATION_COST_PER_UNIT;
    
    // 2. Aplicar costo
    gameState.budget -= preservationCost;
    
    // 3. Verificar Bancarrota
    if (gameState.budget < 0) {
        gameOver(`Bancarrota.\nPierdes $${Math.abs(gameState.budget).toFixed(2)} adicionales.`);
        return;
    }

    // 4. Verificar Cumplimiento de Cuota (Opcional: penalización si no cumples?)
    // Tu regla decía: "tienes que vender hasta haber ganado esa cantidad por sobre el presupuesto".
    // Implementaremos un sistema simple: Si earned_today < QUOTA, avisamos, pero no cerramos tienda aún (para MVP).
    let quotaMessage = "";
    if (gameState.daily_tracker.earned_today < DAILY_QUOTA_GOAL) {
        quotaMessage = `\n⚠️ Advertencia: No cumpliste la meta de ventas de hoy (${DAILY_QUOTA_GOAL}).`;
    } else {
        quotaMessage = "\n✅ Meta diaria superada.";
    }

    // 5. Avanzar día
    gameState.day++;
    gameState.stats.days_survived++;
    
    // Resetear tracker diario
    gameState.daily_tracker.start_budget = gameState.budget;
    gameState.daily_tracker.earned_today = 0;

    // 6. Guardar automáticamente
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
    location.reload(); // Volver al menú principal
}
