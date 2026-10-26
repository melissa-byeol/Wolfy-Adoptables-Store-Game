// js/logic.js - V4 WINTER & UPGRADES

// --- CONSTANTES ---
const COST_LOTE_WHITE = 5.00; const UNITS_LOTE_WHITE = 12; const PRICE_WHITE = 1.00; const PRES_WHITE = 0.50;
const COST_LOTE_BROWN = 12.00; const UNITS_LOTE_BROWN = 12; const PRICE_BROWN = 2.50; const PRES_BROWN = 2.00;
const COST_LOTE_WINTER = 30.00; const UNITS_LOTE_WINTER = 6; const PRICE_WINTER_BASE = 6.00; const PRICE_WINTER_FRESH = 30.00; const PRES_WINTER = 5.00;

const BASE_MAX_SLOTS = 48;
const WINTER_HEAT_LIMIT_BASE = 4000; // 4s
const WINTER_HEAT_LIMIT_AC = 12000;  // 12s

const FIRST_NAMES = ["Alejandro", "Sofia", "Mateo", "Valentina", "Diego", "Camila"];
const LAST_NAMES = ["García", "Rodríguez", "Martínez", "López", "Hernández", "Torres"];

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
    gameState.currentMaxSlots = BASE_MAX_SLOTS;

    updateUI();
    showModal("Bienvenido", "Tu tienda ha sido inaugurada.\nTienes 24 Lobitos Básicos.\nPresiona 'ABRIR TIENDA' para comenzar.");
}

// --- CONTROL TIENDA ---
function toggleShopState() {
    if (gameState.shopStatus === 'closed') openShop(); else closeShop();
}

function openShop() {
    if (gameState.shopStatus === 'open') return;
    gameState.shopStatus = 'open';
    gameState.customers = []; 
    
    document.getElementById('btn-toggle-shop').textContent = "CERRAR TIENDA";
    document.getElementById('btn-toggle-shop').classList.replace('success', 'danger');
    document.getElementById('display-shop-status').textContent = "ABIERTA";
    document.getElementById('display-shop-status').className = "stat-item status-open";

    gameInterval = setInterval(gameTick, 500);
    spawnCustomer(); spawnCustomer();
}

function closeShop() {
    if (gameState.shopStatus === 'closed') return;
    clearInterval(gameInterval); gameInterval = null;
    gameState.shopStatus = 'closed';
    gameState.customers = []; 
    processEndOfDay();
    
    document.getElementById('btn-toggle-shop').textContent = "ABRIR TIENDA";
    document.getElementById('btn-toggle-shop').classList.replace('danger', 'success');
    document.getElementById('display-shop-status').textContent = "CERRADA";
    document.getElementById('display-shop-status').className = "stat-item status-closed";
}

// --- SIMULACIÓN ---
function gameTick() {
    let anyActionTaken = false;
    const hasAutoCashier = gameState.upgrades.expansion2;

    for (let i = gameState.customers.length - 1; i >= 0; i--) {
        const cust = gameState.customers[i];
        
        switch (cust.state) {
            case 'entering':
                cust.progress += 10; 
                if (cust.progress >= 100) { cust.state = 'shopping'; cust.progress = 0; anyActionTaken = true; }
                break;

            case 'shopping':
                cust.waitTimer++; 
                if (cust.waitTimer > 2) { 
                    const type = cust.desiredType;
                    const qty = cust.desiredQty;
                    let stock = 0;
                    if(type==='white') stock = gameState.inventory.white_wolfie;
                    if(type==='brown') stock = gameState.inventory.brown_wolfie;
                    if(type==='winter') stock = gameState.inventory.winteruff;

                    if (stock >= qty) {
                        for(let k=0; k<qty; k++) {
                            if(type==='white') { gameState.inventory.white_wolfie--; cust.cart.push({type:'white', price:PRICE_WHITE}); }
                            if(type==='brown') { gameState.inventory.brown_wolfie--; cust.cart.push({type:'brown', price:PRICE_BROWN}); }
                            if(type==='winter') { gameState.inventory.winteruff--; cust.cart.push({type:'winter', price:PRICE_WINTER_FRESH}); } // Precio inicial, se ajusta al cobrar
                        }
                        cust.state = 'going_to_checkout'; cust.progress = 0; anyActionTaken = true;
                    } else if (stock > 0) {
                        for(let k=0; k<stock; k++) {
                             if(type==='white') { gameState.inventory.white_wolfie--; cust.cart.push({type:'white', price:PRICE_WHITE}); }
                             if(type==='brown') { gameState.inventory.brown_wolfie--; cust.cart.push({type:'brown', price:PRICE_BROWN}); }
                             if(type==='winter') { gameState.inventory.winteruff--; cust.cart.push({type:'winter', price:PRICE_WINTER_FRESH}); }
                        }
                        cust.state = 'going_to_checkout'; cust.progress = 0; anyActionTaken = true;
                    } else {
                        cust.state = 'leaving_angry'; cust.progress = 100; anyActionTaken = true;
                    }
                }
                break;

            case 'going_to_checkout':
                cust.progress += 15; 
                if (cust.progress >= 100) {
                    cust.state = 'waiting_in_queue'; cust.progress = 100; anyActionTaken = true;
                }
                break;

            case 'waiting_in_queue':
                // Lógica de Cajero Automático
                if (hasAutoCashier && !cust.hasDanger && !cust.hasWinter) {
                    // El cajero lo atiende automáticamente después de un breve delay
                    if (!cust.autoProcessed) {
                        cust.autoTimer = (cust.autoTimer || 0) + 1;
                        if (cust.autoTimer > 2) { // 1 segundo de proceso
                            // Cobro automático
                            const total = cust.cart.reduce((sum, item) => sum + item.price, 0);
                            gameState.budget += total;
                            gameState.daily_tracker.earned_today += total;
                            gameState.stats.total_sales_lifetime += cust.cart.length;
                            cust.state = 'leaving_happy'; cust.progress = 100;
                            anyActionTaken = true;
                            showToast("🤖 Cajero atendió a " + cust.name.split(' ')[0]);
                        }
                    }
                }
                break;

            case 'leaving_happy': case 'leaving_angry':
                cust.progress -= 20; 
                if (cust.progress <= -50) { gameState.customers.splice(i, 1); anyActionTaken = true; }
                break;
        }
    }

    if (gameState.customers.length < 8) {
        if (Math.random() < 0.15) { spawnCustomer(); anyActionTaken = true; }
    }

    if (anyActionTaken) { renderCustomers(); updateStoreMapView(); }
}

function spawnCustomer() {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    let type = 'white'; let qty = Math.floor(Math.random() * 4) + 1;
    const rand = Math.random();
    
    if (gameState.inventory.brown_wolfie > 0 && rand < 0.3) { type = 'brown'; qty = Math.floor(Math.random() * 2) + 1; }
    else if (gameState.inventory.winteruff > 0 && rand > 0.9) { type = 'winter'; qty = 1; }

    const newCust = {
        id: Date.now() + Math.random(), name: `${fn} ${ln}`, state: 'entering', progress: 0, waitTimer: 0,
        cart: [], desiredType: type, desiredQty: qty, interactionStartTime: null,
        hasDanger: (type === 'brown'), hasWinter: (type === 'winter'), autoTimer: 0
    };
    gameState.customers.push(newCust);
}

// --- COBRO Y PELIGROS ---
function attemptCheckout(customerId) {
    const cust = gameState.customers.find(c => c.id == customerId);
    if (!cust || cust.state !== 'waiting_in_queue') return;

    cust.interactionStartTime = Date.now();

    if (cust.hasDanger) startDangerSequence(cust);
    else if (cust.hasWinter) showWinteruffPayModal(cust);
    else {
        // Normal
        const types = new Set(cust.cart.map(i => i.type));
        if (types.size === 1) showQuickPayModal(cust);
        else showManualCalcModal(cust);
    }
}

// --- GESTIÓN STOCK Y MEJORAS ---
function buyLote(type) {
    let cost = 0, units = 0;
    if(type==='white') { cost=COST_LOTE_WHITE; units=UNITS_LOTE_WHITE; }
    if(type==='brown') { cost=COST_LOTE_BROWN; units=UNITS_LOTE_BROWN; }
    if(type==='winter') { cost=COST_LOTE_WINTER; units=UNITS_LOTE_WINTER; }

    if (gameState.budget >= cost) {
        gameState.budget -= cost;
        gameState.inventory[type+'_wolfie'] += units; // Nota: winteruff key es 'winteruff' en state, ajustar si necesario
        if(type==='winter') gameState.inventory.winteruff += units; // Fix específico
        
        updateUI(); showToast(`Comprado lote ${type}.`);
    } else showErrorToast("Fondos insuficientes.");
}

function fillStock(type) {
    const current = gameState.inventory[type+'_wolfie'] || gameState.inventory[type]; // Fix keys
    const max = gameState.currentMaxSlots;
    if(current >= max) return showToast("Lleno.");
    
    const needed = max - current;
    let unitCost=0, loteSize=0;
    if(type==='white') { unitCost=COST_LOTE_WHITE; loteSize=UNITS_LOTE_WHITE; }
    if(type==='brown') { unitCost=COST_LOTE_BROWN; loteSize=UNITS_LOTE_BROWN; }
    if(type==='winter') { unitCost=COST_LOTE_WINTER; loteSize=UNITS_LOTE_WINTER; }

    const lots = Math.ceil(needed/loteSize);
    const total = lots * unitCost;
    
    if(gameState.budget >= total) {
        gameState.budget -= total;
        if(type==='white') gameState.inventory.white_wolfie += lots*loteSize;
        if(type==='brown') gameState.inventory.brown_wolfie += lots*loteSize;
        if(type==='winter') gameState.inventory.winteruff += lots*loteSize;
        updateUI(); showToast(`Estoque ${type} lleno.`);
    } else showErrorToast(`Necesitas $${total}.`);
}

function buyUpgrade(id) {
    let cost = 0;
    if(id==='exp1') cost = 50;
    if(id==='ac') cost = 125;
    if(id==='exp2') cost = 200;

    if(gameState.budget >= cost) {
        gameState.budget -= cost;
        gameState.upgrades[id] = true;
        
        if(id==='exp1') gameState.currentMaxSlots += 12;
        if(id==='exp2') gameState.currentMaxSlots += 12;
        
        updateUI(); showToast("¡Mejora instalada!");
    } else showErrorToast("Fondos insuficientes.");
}

function processEndOfDay() {
    const w = gameState.inventory.white_wolfie;
    const b = gameState.inventory.brown_wolfie;
    const wi = gameState.inventory.winteruff;
    
    const cost = (w*PRES_WHITE) + (b*PRES_BROWN) + (wi*PRES_WINTER);
    gameState.budget -= cost;
    
    if(gameState.budget < 0) { gameOver(`Bancarrota. Deuda: $${Math.abs(gameState.budget).toFixed(2)}`); return; }

    const report = document.getElementById('day-report-body');
    report.textContent = `Ventas: $${gameState.daily_tracker.earned_today.toFixed(2)}\nPreservación: -$${cost.toFixed(2)}\nBalance: $${gameState.budget.toFixed(2)}\n\n${gameState.daily_tracker.earned_today >= 30 ? '✅ Meta Cumplida' : '⚠️ Meta Fallida'}`;
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
    const el = document.getElementById('display-quota-status');
    if(gameState.daily_tracker.earned_today >= 30) { el.textContent = "Cumplida ✅"; el.style.color="#4caf50"; }
    else { el.textContent = `$${gameState.daily_tracker.earned_today.toFixed(2)} / $30.00`; el.style.color="#fff"; }
}

function gameOver(reason) { alert("FIN DEL JUEGO\n"+reason); clearSave(); location.reload(); }
function showErrorToast(msg) { console.error(msg); showToast(msg); }
