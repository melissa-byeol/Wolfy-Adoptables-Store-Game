// js/logic.js - V4.2 FINALES BUENOS
const COST_LOTE_WHITE = 5.00; const UNITS_LOTE_WHITE = 12; const PRICE_WHITE = 1.00; const PRES_WHITE = 0.50;
const COST_LOTE_BROWN = 12.00; const UNITS_LOTE_BROWN = 12; const PRICE_BROWN = 2.50; const PRES_BROWN = 2.00;
const COST_LOTE_WINTER = 30.00; const UNITS_LOTE_WINTER = 6; const PRICE_WINTER_BASE = 6.00; const PRICE_WINTER_FRESH = 30.00; const PRES_WINTER = 5.00;
const BASE_MAX_SLOTS = 48; const WINTER_HEAT_LIMIT_BASE = 4000; const WINTER_HEAT_LIMIT_AC = 12000;
const FIRST_NAMES = ["Alejandro", "Sofia", "Mateo", "Valentina", "Diego", "Camila"];
const LAST_NAMES = ["García", "Rodríguez", "Martínez", "López", "Hernández", "Torres"];

let gameInterval = null; let winterCheckInterval = null;

function initNewGame() {
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    gameState.budget = 10.00; gameState.inventory.white_wolfie = 24;
    gameState.daily_tracker.start_budget = gameState.budget; gameState.daily_tracker.earned_today = 0;
    gameState.customers = []; gameState.shopStatus = 'closed'; gameState.currentMaxSlots = BASE_MAX_SLOTS;
    updateUI(); showModal("Bienvenido", "Tu tienda ha sido inaugurada.\nTienes 24 Lobitos Básicos.\nPresiona 'ABRIR TIENDA' para comenzar.");
}

function toggleShopState() { if (gameState.shopStatus === 'closed') openShop(); else closeShop(); }
function openShop() {
    if (gameState.shopStatus === 'open') return;
    gameState.shopStatus = 'open'; gameState.customers = [];
    document.getElementById('btn-toggle-shop').textContent = "CERRAR TIENDA";
    document.getElementById('btn-toggle-shop').classList.replace('success', 'danger');
    document.getElementById('display-shop-status').textContent = "ABIERTA";
    document.getElementById('display-shop-status').className = "stat-item status-open";
    gameInterval = setInterval(gameTick, 500); startWinterChecks(); resetInactivityTimer();
    spawnCustomer(); spawnCustomer();
}
function closeShop() {
    if (gameState.shopStatus === 'closed') return;
    clearInterval(gameInterval); gameInterval = null; clearInterval(winterCheckInterval); winterCheckInterval = null;
    if(inactivityTimer) clearTimeout(inactivityTimer);
    gameState.shopStatus = 'closed'; gameState.customers = []; processEndOfDay();
    document.getElementById('btn-toggle-shop').textContent = "ABRIR TIENDA";
    document.getElementById('btn-toggle-shop').classList.replace('danger', 'success');
    document.getElementById('display-shop-status').textContent = "CERRADA";
    document.getElementById('display-shop-status').className = "stat-item status-closed";
}

function gameTick() {
    let anyActionTaken = false; const hasAutoCashier = gameState.upgrades.expansion2;
    for (let i = gameState.customers.length - 1; i >= 0; i--) {
        const cust = gameState.customers[i];
        switch (cust.state) {
            case 'entering': cust.progress += 10; if (cust.progress >= 100) { cust.state = 'shopping'; cust.progress = 0; anyActionTaken = true; } break;
            case 'shopping': cust.waitTimer++; if (cust.waitTimer > 2) {
                const type = cust.desiredType; const qty = cust.desiredQty; let stock = 0;
                if(type==='white') stock = gameState.inventory.white_wolfie; if(type==='brown') stock = gameState.inventory.brown_wolfie; if(type==='winter') stock = gameState.inventory.winteruff;
                if (stock >= qty) { for(let k=0; k<qty; k++) { if(type==='white') { gameState.inventory.white_wolfie--; cust.cart.push({type:'white', price:PRICE_WHITE}); } if(type==='brown') { gameState.inventory.brown_wolfie--; cust.cart.push({type:'brown', price:PRICE_BROWN}); } if(type==='winter') { gameState.inventory.winteruff--; cust.cart.push({type:'winter', price:PRICE_WINTER_FRESH}); } } cust.state = 'going_to_checkout'; cust.progress = 0; anyActionTaken = true; }
                else if (stock > 0) { for(let k=0; k<stock; k++) { if(type==='white') { gameState.inventory.white_wolfie--; cust.cart.push({type:'white', price:PRICE_WHITE}); } if(type==='brown') { gameState.inventory.brown_wolfie--; cust.cart.push({type:'brown', price:PRICE_BROWN}); } if(type==='winter') { gameState.inventory.winteruff--; cust.cart.push({type:'winter', price:PRICE_WINTER_FRESH}); } } cust.state = 'going_to_checkout'; cust.progress = 0; anyActionTaken = true; }
                else { cust.state = 'leaving_angry'; cust.progress = 100; anyActionTaken = true; }
            } break;
            case 'going_to_checkout': cust.progress += 15; if (cust.progress >= 100) { cust.state = 'waiting_in_queue'; cust.progress = 100; anyActionTaken = true; } break;
            case 'waiting_in_queue': if (hasAutoCashier && !cust.hasDanger && !cust.hasWinter) { if (!cust.autoProcessed) { cust.autoTimer = (cust.autoTimer || 0) + 1; if (cust.autoTimer > 2) { const total = cust.cart.reduce((sum, item) => sum + item.price, 0); gameState.budget += total; gameState.daily_tracker.earned_today += total; gameState.stats.total_sales_lifetime += cust.cart.length; cust.state = 'leaving_happy'; cust.progress = 100; anyActionTaken = true; showToast("🤖 Cajero atendió a " + cust.name.split(' ')[0]); } } } break;
            case 'leaving_happy': case 'leaving_angry': cust.progress -= 20; if (cust.progress <= -50) { gameState.customers.splice(i, 1); anyActionTaken = true; } break;
        }
    }
    if (gameState.customers.length < 8) { if (Math.random() < 0.15) { spawnCustomer(); anyActionTaken = true; } }
    if (anyActionTaken) { renderCustomers(); updateStoreMapView(); }
}

function spawnCustomer() {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]; const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    let type = 'white'; let qty = Math.floor(Math.random() * 4) + 1; const rand = Math.random();
    if (gameState.inventory.brown_wolfie > 0 && rand < 0.3) { type = 'brown'; qty = Math.floor(Math.random() * 2) + 1; }
    else if (gameState.inventory.winteruff > 0 && rand > 0.9) { type = 'winter'; qty = 1; }
    const newCust = { id: Date.now() + Math.random(), name: `${fn} ${ln}`, state: 'entering', progress: 0, waitTimer: 0, cart: [], desiredType: type, desiredQty: qty, interactionStartTime: null, hasDanger: (type === 'brown'), hasWinter: (type === 'winter'), autoTimer: 0 };
    gameState.customers.push(newCust);
}

function attemptCheckout(customerId) {
    resetInactivityTimer(); const cust = gameState.customers.find(c => c.id == customerId);
    if (!cust || cust.state !== 'waiting_in_queue') return;
    cust.interactionStartTime = Date.now();
    if (cust.hasDanger) startDangerSequence(cust);
    else if (cust.hasWinter) showWinteruffPayModal(cust);
    else { const types = new Set(cust.cart.map(i => i.type)); if (types.size === 1) showQuickPayModal(cust); else showManualCalcModal(cust); }
}

function buyLote(type) {
    resetInactivityTimer(); let cost = 0, units = 0;
    if(type==='white') { cost=COST_LOTE_WHITE; units=UNITS_LOTE_WHITE; } if(type==='brown') { cost=COST_LOTE_BROWN; units=UNITS_LOTE_BROWN; } if(type==='winter') { cost=COST_LOTE_WINTER; units=UNITS_LOTE_WINTER; }
    if (gameState.budget >= cost) { gameState.budget -= cost; if(type==='white') gameState.inventory.white_wolfie += units; if(type==='brown') gameState.inventory.brown_wolfie += units; if(type==='winter') gameState.inventory.winteruff += units; updateUI(); showToast(`Comprado lote ${type}.`); } else showErrorToast("Fondos insuficientes.");
}

function fillStock(type) {
    resetInactivityTimer(); const current = gameState.inventory[type+'_wolfie'] || gameState.inventory[type]; const max = gameState.currentMaxSlots;
    if(current >= max) return showToast("Lleno."); const needed = max - current; let unitCost=0, loteSize=0;
    if(type==='white') { unitCost=COST_LOTE_WHITE; loteSize=UNITS_LOTE_WHITE; } if(type==='brown') { unitCost=COST_LOTE_BROWN; loteSize=UNITS_LOTE_BROWN; } if(type==='winter') { unitCost=COST_LOTE_WINTER; loteSize=UNITS_LOTE_WINTER; }
    const lots = Math.ceil(needed/loteSize); const total = lots * unitCost;
    if(gameState.budget >= total) { gameState.budget -= total; if(type==='white') gameState.inventory.white_wolfie += lots*loteSize; if(type==='brown') gameState.inventory.brown_wolfie += lots*loteSize; if(type==='winter') gameState.inventory.winteruff += lots*loteSize; updateUI(); showToast(`Estoque ${type} lleno.`); } else showErrorToast(`Necesitas $${total}.`);
}

function buyUpgrade(id) {
    resetInactivityTimer(); let cost = 0; if(id==='exp1') cost = 50; if(id==='ac') cost = 125; if(id==='exp2') cost = 200;
    if(gameState.budget >= cost) { gameState.budget -= cost; gameState.upgrades[id] = true; if(id==='exp1') gameState.currentMaxSlots += 12; if(id==='exp2') gameState.currentMaxSlots += 12; updateUI(); showToast("¡Mejora instalada!"); } else showErrorToast("Fondos insuficientes.");
}

function processEndOfDay() {
    const w = gameState.inventory.white_wolfie; const b = gameState.inventory.brown_wolfie; const wi = gameState.inventory.winteruff;
    const cost = (w*PRES_WHITE) + (b*PRES_BROWN) + (wi*PRES_WINTER); gameState.budget -= cost;
    if(gameState.budget < 0) { triggerGameOver('bancarrota'); return; }
    const report = document.getElementById('day-report-body');
    report.textContent = `Ventas: $${gameState.daily_tracker.earned_today.toFixed(2)}\nPreservación: -$${cost.toFixed(2)}\nBalance: $${gameState.budget.toFixed(2)}\n\n${gameState.daily_tracker.earned_today >= 30 ? '✅ Meta Cumplida' : '⚠️ Meta Fallida'}`;
    document.getElementById('day-end-modal').classList.remove('hidden');
}

function nextDay() { if (checkGoodEndings()) return; gameState.day++; gameState.daily_tracker.start_budget = gameState.budget; gameState.daily_tracker.earned_today = 0; gameState.customers = []; gameState.winterAbandonTimer = 0; saveGame(); document.getElementById('day-end-modal').classList.add('hidden'); updateUI(); }
function checkQuotaStatus() { const el = document.getElementById('display-quota-status'); if(gameState.daily_tracker.earned_today >= 30) { el.textContent = "Cumplida ✅"; el.style.color="#4caf50"; } else { el.textContent = `$${gameState.daily_tracker.earned_today.toFixed(2)} / $30.00`; el.style.color="#fff"; } }

function triggerGameOver(type) {
    clearInterval(gameInterval); clearInterval(winterCheckInterval); if(inactivityTimer) clearTimeout(inactivityTimer); gameState.shopStatus = 'closed';
    let title = "GAME OVER"; let message = ""; let subtitle = ""; let color = "var(--accent-red)";
    switch(type) {
        case 'bancarrota': title = "BANCARROTA"; message = "Tienes demasiados lobitos para tu presupuesto."; subtitle = "El Game Over del Irresponsable"; break;
        case 'fatality': title = "FATALITY DEL HAMBRIENTO"; message = "Has recibido 10 mordiscos."; subtitle = "El Game Over del Descuidado"; break;
        case 'accidente': title = "ACCIDENTE FATAL"; message = "Dejaste esperar a un Winteruff por más de 3 minutos."; subtitle = "El Game Over del Negligente"; break;
        case 'siesta': title = "LA ÚLTIMA SIESTA"; message = "Te despertaron con el documento de clausura."; subtitle = "El Game Over del Emprendedor Somnoliento"; color = "#9c27b0"; break;
    }
    const modal = document.getElementById('message-modal'); document.getElementById('modal-title').textContent = title; document.getElementById('modal-title').style.color = color; document.getElementById('modal-body').innerText = `${message}\n\n---\n${subtitle}`;
    const btnClose = document.getElementById('btn-close-modal'); btnClose.textContent = "REINICIAR PARTIDA"; btnClose.onclick = () => { clearSave(); location.reload(); }; modal.classList.remove('hidden');
}

function checkGoodEndings() {
    if (gameState.day >= 7 && gameState.budget >= 1000) { triggerGoodEnding('emprendedor'); return true; }
    if (gameState.day >= 7 && (gameState.stats.winter_sold_fresh || 0) >= 300) { triggerGoodEnding('hielo'); return true; }
    if (gameState.day >= 15 && gameState.budget >= 5000 && !gameState.stats.has_sold_other_types) { triggerGoodEnding('guiness'); return true; }
    return false;
}

function triggerGoodEnding(type) {
    clearInterval(gameInterval); clearInterval(winterCheckInterval); if(inactivityTimer) clearTimeout(inactivityTimer);
    const modal = document.getElementById('message-modal'); const titleEl = document.getElementById('modal-title'); const bodyEl = document.getElementById('modal-body'); const btnClose = document.getElementById('btn-close-modal');
    let title = "", msg = "", color = "";
    switch(type) {
        case 'emprendedor': title = "EMPRENDEDOR DEL MES 🏆"; msg = "Tus socios están impresionados."; color = "#ffd700"; break;
        case 'hielo': title = "REALZAMINETO DE LA ERA DEL HIELO ❄️"; msg = "Ahora las lluvias son nevadas."; color = "#00bcd4"; break;
        case 'guiness': title = "NAH I'D WIN 📖"; msg = "Entraste al libro de records."; color = "#4caf50"; break;
    }
    titleEl.textContent = title; titleEl.style.color = color; bodyEl.innerText = msg; btnClose.textContent = "DISFRUTAR VICTORIA (REINICIAR)"; btnClose.onclick = () => { clearSave(); location.reload(); }; modal.classList.remove('hidden');
}

function resetInactivityTimer() { if (inactivityTimer) clearTimeout(inactivityTimer); if (gameState && gameState.shopStatus === 'open') { inactivityTimer = setTimeout(() => { triggerGameOver('siesta'); }, INACTIVITY_LIMIT); } }
function startWinterChecks() {
    if(winterCheckInterval) clearInterval(winterCheckInterval);
    winterCheckInterval = setInterval(() => {
        if(gameState.shopStatus !== 'open') return; let hasWaitingWinteruff = false;
        gameState.customers.forEach(cust => { if(cust.state === 'waiting_in_queue' && cust.hasWinter) hasWaitingWinteruff = true; });
        if(hasWaitingWinteruff) gameState.winterAbandonTimer += 1; else gameState.winterAbandonTimer = 0;
        if(gameState.winterAbandonTimer >= 180) triggerGameOver('accidente');
    }, 1000);
}
function showErrorToast(msg) { console.error(msg); showToast(msg); }

// --- LÓGICA MINIJUEGO GORDINFLÓN ---
function startGordinflonMinigame(mode) {
    gameState.minigame.active = true; gameState.minigame.progress = 50; gameState.minigame.direction = 1;
    document.getElementById('pc-hint').classList.toggle('hidden', mode !== 'PC');
    document.getElementById('mobile-hint').classList.toggle('hidden', mode !== 'MOVIL');
    document.getElementById('btn-start-minigame').classList.toggle('hidden', mode !== 'MOVIL');
    document.getElementById('btn-pet-action').classList.toggle('hidden', mode === 'MOVIL' && gameState.minigame.active);
    gameState.minigame.intervalId = setInterval(() => {
        if (!gameState.minigame.active) return;
        gameState.minigame.progress -= 0.033;
        gameState.minigame.targetPos += 1.5 * gameState.minigame.direction;
        if (gameState.minigame.targetPos > 85 || gameState.minigame.targetPos < 0) gameState.minigame.direction *= -1;
        if (gameState.minigame.progress <= 0) endMinigame(false);
        if (gameState.minigame.progress >= 100) endMinigame(true);
        updateMinigameUI();
    }, 16);
}

function performPetAction() {
    if (!gameState.minigame.active) return;
    const hit = Math.abs(gameState.minigame.progress - gameState.minigame.targetPos) < 10;
    if (hit) gameState.minigame.progress += 20; else gameState.minigame.progress -= 10;
    updateMinigameUI();
}

function endMinigame(success) {
    gameState.minigame.active = false; clearInterval(gameState.minigame.intervalId);
    if (success) onGordinflonSuccess(); else onGordinflonFail();
}

function updateMinigameUI() {
    const bar = document.getElementById('gordinflon-bar'); const target = document.getElementById('gordinflon-target');
    if (bar && target) { bar.style.width = `${Math.max(0, Math.min(100, gameState.minigame.progress))}%`; target.style.left = `${gameState.minigame.targetPos}%`; }
}
