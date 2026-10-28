// js/logic.js - V5.2 MODIFIERS INTEGRATED

// --- CONSTANTES ---
const COST_LOTE_WHITE = 5.00; const UNITS_LOTE_WHITE = 12; const PRICE_WHITE = 1.00; const PRES_WHITE = 0.50;
const COST_LOTE_BROWN = 12.00; const UNITS_LOTE_BROWN = 12; const PRICE_BROWN = 2.50; const PRES_BROWN = 2.00;
const COST_LOTE_WINTER = 30.00; const UNITS_LOTE_WINTER = 6; const PRICE_WINTER_BASE = 6.00; const PRICE_WINTER_FRESH = 30.00; const PRES_WINTER = 5.00;
const COST_LOTE_PUPS = 60.00; const UNITS_LOTE_PUPS = 12; const PRICE_PUP_CAGE = 9.00; const PRES_PUP_CAGE = 3.00;
const CHAOS_DURATION_DAYS = 5;
const BASE_MAX_SLOTS = 48;

const FIRST_NAMES = ["Alejandro", "Sofia", "Mateo", "Valentina", "Diego", "Camila"];
const LAST_NAMES = ["García", "Rodríguez", "Martínez", "López", "Hernández", "Torres"];

let gameInterval = null;
let winterCheckInterval = null;

// --- SISTEMA DE LOGROS ---
function unlockAchievement(id) {
    if (!gameState.achievements.unlocked.includes(id)) {
        gameState.achievements.unlocked.push(id);
        const ach = ACHIEVEMENTS[id];
        showModal("🏆 ¡LOGRO DESBLOQUEADO!", `${ach.title}\n\n${ach.desc}`);
        if (ach.isExclusive) document.getElementById('modal-title').style.color = "#ffd700";
        saveGame();
    }
}

function checkExclusiveAchievements() {
    const today = new Date();
    const deadline = new Date(ACHIEVEMENTS["demo_2027"].deadline);
    if (today < deadline) unlockAchievement("demo_2027");
}

// --- INICIALIZACIÓN CON MODIFIER ---
function initNewGame(modifierId = 'none') {
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    
    // Aplicar Modifier Seleccionado
    const mod = AVAILABLE_MODIFIERS.find(m => m.id === modifierId);
    if (mod && mod.effect) {
        mod.effect(gameState);
        gameState.selectedModifier = modifierId;
    }

    // Resetear valores base afectados por modifiers
    gameState.budget = 10.00; 
    if (gameState.baseBudgetBonus !== 0) {
        gameState.budget *= (1 + gameState.baseBudgetBonus);
    }
    
    gameState.inventory.white_wolfie = 24;
    gameState.daily_tracker.start_budget = gameState.budget; 
    gameState.daily_tracker.earned_today = 0;
    gameState.customers = []; 
    gameState.shopStatus = 'closed'; 
    gameState.currentMaxSlots = BASE_MAX_SLOTS;
    
    checkExclusiveAchievements(); 
    updateUI();
    
    let modMsg = mod ? `\nModificador: ${mod.name}` : "";
    showModal("Bienvenido", `Tu tienda ha sido inaugurada.\nTienes 24 Lobitos Básicos.${modMsg}\nPresiona 'ABRIR TIENDA' para comenzar.`);
}

// --- CONTROL TIENDA ---
function toggleShopState() { 
    if (gameState.shopStatus === 'closed') openShop(); 
    else closeShop(); 
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
    startWinterChecks(); 
    resetInactivityTimer();
    
    spawnCustomer(); 
    spawnCustomer();
}

function closeShop() {
    if (gameState.shopStatus === 'closed') return;
    clearInterval(gameInterval); gameInterval = null; 
    clearInterval(winterCheckInterval); winterCheckInterval = null;
    if(inactivityTimer) clearTimeout(inactivityTimer);
    
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
        
        // MOVIMIENTO MODIFICADO POR "CHAOTIC WALKERS"
        let speedMult = 1.0;
        if (gameState.modifierFlags.slowWalkers) {
            speedMult = 0.6; // Más lento
            if (Math.random() < 0.05) cust.progress -= 5; // Retrocede a veces
        }

        switch (cust.state) {
            case 'entering': 
                cust.progress += 10 * speedMult; 
                if (cust.progress >= 100) { 
                    cust.state = 'shopping'; 
                    cust.progress = 0; 
                    anyActionTaken = true; 
                } 
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
                    if(type==='pups') stock = gameState.inventory.curious_pups;

                    if (stock >= qty) { 
                        for(let k=0; k<qty; k++) { 
                            if(type==='white') { gameState.inventory.white_wolfie--; cust.cart.push({type:'white', price:PRICE_WHITE}); } 
                            if(type==='brown') { gameState.inventory.brown_wolfie--; cust.cart.push({type:'brown', price:PRICE_BROWN}); } 
                            if(type==='winter') { gameState.inventory.winteruff--; cust.cart.push({type:'winter', price:PRICE_WINTER_FRESH}); } 
                            if(type==='pups') { gameState.inventory.curious_pups--; cust.cart.push({type:'pups', price:PRICE_PUP_CAGE}); } 
                        } 
                        cust.state = 'going_to_checkout'; 
                        cust.progress = 0; 
                        anyActionTaken = true; 
                    } 
                    else if (stock > 0) { 
                        for(let k=0; k<stock; k++) { 
                            if(type==='white') { gameState.inventory.white_wolfie--; cust.cart.push({type:'white', price:PRICE_WHITE}); } 
                            if(type==='brown') { gameState.inventory.brown_wolfie--; cust.cart.push({type:'brown', price:PRICE_BROWN}); } 
                            if(type==='winter') { gameState.inventory.winteruff--; cust.cart.push({type:'winter', price:PRICE_WINTER_FRESH}); } 
                            if(type==='pups') { gameState.inventory.curious_pups--; cust.cart.push({type:'pups', price:PRICE_PUP_CAGE}); } 
                        } 
                        cust.state = 'going_to_checkout'; 
                        cust.progress = 0; 
                        anyActionTaken = true;  
                    }
                    else { 
                        cust.state = 'leaving_angry'; 
                        cust.progress = 100; 
                        anyActionTaken = true; 
                    }
                } 
                break;

            case 'going_to_checkout': 
                cust.progress += 15 * speedMult; 
                if (cust.progress >= 100) { 
                    cust.state = 'waiting_in_queue'; 
                    cust.progress = 100; 
                    anyActionTaken = true; 
                } 
                break;

            case 'waiting_in_queue': 
                if (hasAutoCashier && !cust.hasDanger && !cust.hasWinter && !cust.isBoss) { 
                    if (!cust.autoProcessed) { 
                        cust.autoTimer = (cust.autoTimer || 0) + 1; 
                        if (cust.autoTimer > 2) { 
                            const total = cust.cart.reduce((sum, item) => sum + item.price, 0); 
                            
                            // BONUS VIP
                            let finalTotal = total;
                            if (cust.isVIP) {
                                finalTotal = total * 2;
                                showToast(`💎 ¡CLIENTE VIP! Ganancia x2: $${finalTotal.toFixed(2)}`);
                            }

                            gameState.budget += finalTotal; 
                            gameState.daily_tracker.earned_today += finalTotal; 
                            gameState.stats.total_sales_lifetime += cust.cart.length; 
                            
                            // Actualizar stats para logros/caos
                            cust.cart.forEach(item => {
                                if (item.type === 'winter') gameState.stats.winter_sold_fresh++;
                                else if (item.type !== 'white') gameState.stats.has_sold_other_types = true;
                                if (item.type === 'pups') activateChaosTimer();
                            });

                            cust.state = 'leaving_happy'; 
                            cust.progress = 100; 
                            anyActionTaken = true; 
                            showToast("🤖 Cajero atendió a " + cust.name.split(' ')[0]); 
                        } 
                    } 
                } 
                break;

            case 'leaving_happy': 
            case 'leaving_angry': 
                cust.progress -= 20 * speedMult; 
                if (cust.progress <= -50) { 
                    gameState.customers.splice(i, 1); 
                    anyActionTaken = true; 
                } 
                break;
        }
    }

    // SPAWN RATE MODIFICADO
    if (gameState.customers.length < gameState.maxQueueLength) { 
        const baseChance = 0.15;
        const chance = baseChance * gameState.spawnRateMultiplier;
        if (Math.random() < chance) { 
            spawnCustomer(); 
            anyActionTaken = true; 
        } 
    }

    if (anyActionTaken) { 
        renderCustomers(); 
        updateStoreMapView(); 
    }
}

// --- SPAWN CON MODIFIERS ---
function spawnCustomer() {
    let firstName, lastName;
    let isCommunityMember = false;
    let memberColor = "#ffffff";
    let memberBorderType = "Default";
    let isVIP = false;

    // Check Community
    if (Math.random() < 0.05 && COMMUNITY_NAMES.length > 0) {
        const randomMember = COMMUNITY_NAMES[Math.floor(Math.random() * COMMUNITY_NAMES.length)];
        firstName = randomMember.name;
        lastName = ""; 
        isCommunityMember = true;
        memberColor = randomMember.color;
        memberBorderType = randomMember.specialTagBorder || "Default";
    } else {
        firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    }

    // Check VIP (Good Offers Modifier)
    if (gameState.modifierFlags.vipChance > 0 && Math.random() < gameState.modifierFlags.vipChance) {
        isVIP = true;
        firstName = "Sr./Sra. VIP";
        lastName = "";
    }

    let type = 'white'; 
    let qty = Math.floor(Math.random() * 4) + 1;
    const rand = Math.random();

    // 1% Cuarto Jinete (Jefe Winteruff)
    if (rand < 0.01 && gameState.inventory.winteruff >= 6) {
        const newCust = {
            id: Date.now() + Math.random(), 
            name: `${firstName} ${lastName} [EL JEFE]`, 
            state: 'entering', 
            progress: 0, 
            waitTimer: 0,
            cart: [], 
            desiredType: 'winter', 
            desiredQty: 6, 
            interactionStartTime: null,
            hasDanger: false, 
            hasWinter: true, 
            isBoss: true, 
            autoTimer: 0,
            isCommunity: isCommunityMember, 
            customColor: memberColor, 
            borderType: memberBorderType,
            isVIP: isVIP
        };
        gameState.customers.push(newCust);
        showToast("⚠️ ¡ALERTA! Ha entrado EL JEFE a la tienda...");
        return;
    }

    // Mixed Orders Logic (Complex Decisions Modifier)
    if (gameState.modifierFlags.mixedOrders && Math.random() < 0.4) {
        // Este cliente quiere una mezcla aleatoria
        const types = ['white', 'brown', 'winter', 'pups'];
        const availableTypes = types.filter(t => {
            if(t==='white') return gameState.inventory.white_wolfie > 0;
            if(t==='brown') return gameState.inventory.brown_wolfie > 0;
            if(t==='winter') return gameState.inventory.winteruff > 0;
            if(t==='pups') return gameState.inventory.curious_pups > 0;
            return false;
        });

        if (availableTypes.length > 1) {
            type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            qty = 1; // Solo 1 unidad de este tipo mixto (el resto lo decidirá en checkout o se simplifica aquí)
            // Nota: Para mantenerlo simple, hacemos que pidan 1 unidad de un tipo aleatorio disponible
        }
    } else {
        // Lógica estándar de preferencia
        if (gameState.inventory.curious_pups > 0 && rand > 0.85) { 
            type = 'pups'; 
            qty = Math.floor(Math.random() * 2) + 1; 
        }
        else if (gameState.inventory.brown_wolfie > 0 && rand < 0.3) { 
            type = 'brown'; 
            qty = Math.floor(Math.random() * 2) + 1; 
        }
        else if (gameState.inventory.winteruff > 0 && rand > 0.9) { 
            type = 'winter'; 
            qty = 1; 
        }
    }

    const newCust = {
        id: Date.now() + Math.random(), 
        name: `${firstName} ${lastName}`, 
        state: 'entering', 
        progress: 0, 
        waitTimer: 0,
        cart: [], 
        desiredType: type, 
        desiredQty: qty, 
        interactionStartTime: null,
        hasDanger: (type === 'brown'), 
        hasWinter: (type === 'winter'), 
        isBoss: false, 
        autoTimer: 0,
        isCommunity: isCommunityMember, 
        customColor: memberColor, 
        borderType: memberBorderType,
        isVIP: isVIP
    };
    gameState.customers.push(newCust);
}

// --- COBRO Y PELIGROS ---
function attemptCheckout(customerId) {
    resetInactivityTimer();
    const cust = gameState.customers.find(c => c.id == customerId);
    if (!cust || cust.state !== 'waiting_in_queue') return;

    cust.interactionStartTime = Date.now();

    if (cust.isBoss) showBossPayModal(cust);
    else if (cust.hasDanger) startDangerSequence(cust);
    else if (cust.hasWinter) showWinteruffPayModal(cust);
    else { 
        const types = new Set(cust.cart.map(i => i.type)); 
        if (types.size === 1) showQuickPayModal(cust); 
        else showManualCalcModal(cust); 
    }
}

// --- GESTIÓN STOCK CON MODIFIERS ---
function buyLote(type) {
    resetInactivityTimer(); 
    let cost = 0, units = 0;
    if(type==='white') { cost=COST_LOTE_WHITE; units=UNITS_LOTE_WHITE; }
    if(type==='brown') { cost=COST_LOTE_BROWN; units=UNITS_LOTE_BROWN; }
    if(type==='winter') { cost=COST_LOTE_WINTER; units=UNITS_LOTE_WINTER; }
    if(type==='pups') { cost=COST_LOTE_PUPS; units=UNITS_LOTE_PUPS; }

    // Descuento Good Offers (Simulado: reduce coste 20% si hay oferta activa, aquí simplificamos aplicándolo siempre si el mod está activo)
    if (gameState.modifierFlags.hasDiscounts) {
        cost *= 0.8; // 20% off
    }

    if (gameState.budget >= cost) {
        gameState.budget -= cost;
        
        // Delivery Fail (Database Hack)
        if (gameState.modifierFlags.deliveryFailChance > 0 && Math.random() < gameState.modifierFlags.deliveryFailChance) {
            showToast("❌ ERROR DELIVERY: El lote no llegó. Perdiste el dinero.");
            updateUI();
            return;
        }

        // Apply Inventory with Delay (Tech Failures)
        if (gameState.modifierFlags.deliveryDelay) {
            showToast("⏳ Procesando entrega... (Retraso técnico)");
            setTimeout(() => {
                addInventory(type, units);
                updateUI();
                showToast(`✅ Entrega completada (+${units} uds).`);
            }, 1000 + Math.random() * 4000); // 1-5 seg
        } else {
            addInventory(type, units);
            updateUI(); 
            showToast(`Comprado lote ${type}.`);
        }
    } else showErrorToast("Fondos insuficientes.");
}

function addInventory(type, units) {
    if(type==='white') gameState.inventory.white_wolfie += units;
    if(type==='brown') gameState.inventory.brown_wolfie += units;
    if(type==='winter') gameState.inventory.winteruff += units;
    if(type==='pups') gameState.inventory.curious_pups += units;
}

function fillStock(type) {
    resetInactivityTimer();
    let current = 0;
    if(type==='white') current = gameState.inventory.white_wolfie;
    if(type==='brown') current = gameState.inventory.brown_wolfie;
    if(type==='winter') current = gameState.inventory.winteruff;
    if(type==='pups') current = gameState.inventory.curious_pups;

    const max = gameState.currentMaxSlots;
    if(current >= max) return showToast("Lleno.");
    
    const needed = max - current; 
    let unitCost=0, loteSize=0;
    
    if(type==='white') { unitCost=COST_LOTE_WHITE; loteSize=UNITS_LOTE_WHITE; }
    if(type==='brown') { unitCost=COST_LOTE_BROWN; loteSize=UNITS_LOTE_BROWN; }
    if(type==='winter') { unitCost=COST_LOTE_WINTER; loteSize=UNITS_LOTE_WINTER; }
    if(type==='pups') { unitCost=COST_LOTE_PUPS; loteSize=UNITS_LOTE_PUPS; }

    if (gameState.modifierFlags.hasDiscounts) {
        unitCost *= 0.8;
    }

    const lots = Math.ceil(needed/loteSize); 
    const total = lots * unitCost;
    
    if(gameState.budget >= total) {
        gameState.budget -= total;
        
        if (gameState.modifierFlags.deliveryFailChance > 0 && Math.random() < gameState.modifierFlags.deliveryFailChance) {
             showToast("❌ ERROR DELIVERY MASIVO.");
             return;
        }

        const addedUnits = lots * loteSize;
        if (gameState.modifierFlags.deliveryDelay) {
            setTimeout(() => {
                addInventory(type, addedUnits);
                updateUI();
                showToast(`Estoque ${type} lleno.`);
            }, 1000 + Math.random() * 4000);
        } else {
            addInventory(type, addedUnits);
            updateUI(); 
            showToast(`Estoque ${type} lleno.`);
        }
    } else showErrorToast(`Necesitas $${total}.`);
}

function buyUpgrade(id) {
    resetInactivityTimer(); 
    let cost = 0;
    if(id==='exp1') cost = 50; 
    if(id==='ac') cost = 125; 
    if(id==='exp2') cost = 200;

    if(gameState.budget >= cost) {
        gameState.budget -= cost; 
        gameState.upgrades[id] = true;
        if(id==='exp1' || id==='exp2') gameState.currentMaxSlots += 12;
        updateUI(); 
        showToast("¡Mejora instalada!");
    } else showErrorToast("Fondos insuficientes.");
}

// --- FINALES Y GAME OVERS ---
function checkGoodEndings() {
    if (gameState.day >= 7 && gameState.budget >= 1000) { triggerGoodEnding('emprendedor'); return true; }
    if (gameState.day >= 7 && (gameState.stats.winter_sold_fresh || 0) >= 300) { triggerGoodEnding('hielo'); return true; }
    if (gameState.day >= 15 && gameState.budget >= 5000 && !gameState.stats.has_sold_other_types) { triggerGoodEnding('guiness'); return true; }
    return false;
}

function triggerGoodEnding(type) {
    clearInterval(gameInterval); 
    clearInterval(winterCheckInterval); 
    if(inactivityTimer) clearTimeout(inactivityTimer);
    
    const modal = document.getElementById('message-modal'); 
    const titleEl = document.getElementById('modal-title'); 
    const bodyEl = document.getElementById('modal-body'); 
    const btnClose = document.getElementById('btn-close-modal');
    
    let title="", msg="", color="";
    switch(type) {
        case 'emprendedor': title="EMPRENDEDOR DEL MES 🏆"; msg="Tus socios están impresionados.\nVacaciones pagadas en isla privada."; color="#ffd700"; break;
        case 'hielo': title="ERA DEL HIELO ❄️"; msg="Has vendido tantos Winteruffs que llueve nieve.\nBuena suerte con las peticiones."; color="#00bcd4"; break;
        case 'guiness': title="NAH I'D WIN 📖"; msg="Solo vendiste básicos y llegaste a $5000.\nLibro Guinness asegurado."; color="#4caf50"; break;
    }
    titleEl.textContent = title; 
    titleEl.style.color = color; 
    bodyEl.innerText = msg;
    btnClose.textContent = "DISFRUTAR VICTORIA (REINICIAR)"; 
    btnClose.onclick = () => { clearSave(); location.reload(); }; 
    modal.classList.remove('hidden');
}

function triggerGameOver(type) {
    clearInterval(gameInterval); 
    clearInterval(winterCheckInterval); 
    if(inactivityTimer) clearTimeout(inactivityTimer); 
    gameState.shopStatus = 'closed';
    
    let title="", message="", subtitle="", color="var(--accent-red)";
    switch(type) {
        case 'bancarrota': title="BANCARROTA"; message="Demasiados lobitos, poco dinero."; subtitle="El Irresponsable"; break;
        case 'fatality': title="FATALITY DEL HAMBRIENTO"; message="10 mordiscos en poco tiempo.\nDesmayo por sangrado."; subtitle="El Descuidado"; break;
        case 'accidente': title="ACCIDENTE FATAL"; message="Winteruff esperando >3min.\nAcusado de maltrato."; subtitle="El Negligente"; break;
        case 'siesta': title="LA ÚLTIMA SIESTA"; message="20min sin interactuar.\nClausura por abandono."; subtitle="El Somnoliento"; color="#9c27b0"; break;
        case 'microwave': title="KABOOOOOM 💥"; message="Un cachorro cocinó un utensilio en el microondas.\nTienda destruida."; subtitle="Experimento Culinario"; color="#ff5722"; break;
        case 'pup_closures': title="CLAUSURA POR RIESGO 🐾"; message=`${gameState.stats.chaos_warnings} advertencias.\nSellado por ternura peligrosa.`; subtitle="Cuidador Irresponsable"; color="#ff9800"; break;
    }
    const modal = document.getElementById('message-modal');
    document.getElementById('modal-title').textContent = title; 
    document.getElementById('modal-title').style.color = color;
    document.getElementById('modal-body').innerText = `${message}\n\n---\n${subtitle}`;
    const btnClose = document.getElementById('btn-close-modal'); 
    btnClose.textContent = "REINICIAR PARTIDA";
    btnClose.onclick = () => { clearSave(); location.reload(); }; 
    modal.classList.remove('hidden');
}

// --- MECÁNICAS DE CAOS ---
function activateChaosTimer() {
    gameState.stats.active_chaos_timers.push({ dayTriggered: gameState.day, expiresOn: gameState.day + CHAOS_DURATION_DAYS });
}

function processDailyPupChaos() {
    if (gameState.stats.active_chaos_timers.length === 0) return;
    
    const activeTimers = gameState.stats.active_chaos_timers.filter(t => t.expiresOn > gameState.day);
    gameState.stats.active_chaos_timers = activeTimers;
    if (activeTimers.length === 0) return;

    let dailyWarnings = 0; 
    let dailyDamageCost = 0; 
    let damageLog = [];

    for (let i = 0; i < activeTimers.length; i++) {
        const roll = Math.random();
        if (roll < 0.01 && !gameState.stats.microwave_incident) { 
            gameState.stats.microwave_incident = true; 
            triggerGameOver('microwave'); 
            return; 
        }
        if (roll < 0.11) {
            dailyWarnings++;
            const damages = [
                { cost: 8, msg: "Cables rojos mordidos (Reparación eléctrica)" },
                { cost: 12, msg: "Cliente tropezó con jaula (Indemnización)" },
                { cost: 15, msg: "Veterinario de urgencia (Ingestión de plástico)" },
                { cost: 5, msg: "Limpieza especializada (Accidente biológico)" },
                { cost: 20, msg: "Pie mordido durante revisión (Gastos médicos)" }
            ];
            const dmg = damages[Math.floor(Math.random() * damages.length)];
            dailyDamageCost += dmg.cost; 
            damageLog.push(dmg.msg);
        }
    }

    if (dailyWarnings > 0) {
        gameState.stats.chaos_warnings += dailyWarnings;
        gameState.budget -= dailyDamageCost;
        showToast(`🐾 ¡CAOS DIARIO! ${dailyWarnings} incidentes. Daños: -$${dailyDamageCost}`);
        gameState.daily_tracker.chaos_log = damageLog;
        if (gameState.stats.chaos_warnings >= 3) { 
            triggerGameOver('pup_closures'); 
            return; 
        }
    }

    if (Math.random() < 0.5) {
        const bonus = Math.floor(gameState.daily_tracker.earned_today * 0.10);
        if (bonus > 0) { 
            gameState.budget += bonus; 
            showToast(`🐾 ¡BONO DE TERNURA! Clientes felices donaron +$${bonus}`); 
        }
    }
}

function nextDay() {
    if (checkGoodEndings()) return;
    processDailyPupChaos();
    
    // Luxury Tax (Greedy Tax Modifier)
    if (gameState.modifierFlags.luxuryTax && gameState.budget > 1000) {
        const tax = gameState.budget * 0.10;
        gameState.budget -= tax;
        showToast(`💸 IMPUESTO DE LUJO aplicado: -$${tax.toFixed(2)}`);
    }

    const reportBody = document.getElementById('day-report-body');
    let currentReport = reportBody.textContent;
    
    if (gameState.daily_tracker.chaos_log && gameState.daily_tracker.chaos_log.length > 0) {
        currentReport += `\n\n--- 🐾 REPORTE DE CAOS ---\n`;
        gameState.daily_tracker.chaos_log.forEach(log => { currentReport += `• ${log}\n`; });
        currentReport += `------------------------\n`;
    }
    reportBody.textContent = currentReport;

    gameState.day++; 
    gameState.daily_tracker.start_budget = gameState.budget;
    gameState.daily_tracker.earned_today = 0; 
    gameState.daily_tracker.chaos_log = [];
    gameState.customers = []; 
    gameState.winterAbandonTimer = 0;
    
    saveGame(); 
    document.getElementById('day-end-modal').classList.remove('hidden'); 
    updateUI();
}

function processEndOfDay() {
    const w = gameState.inventory.white_wolfie; 
    const b = gameState.inventory.brown_wolfie;
    const wi = gameState.inventory.winteruff; 
    const p = gameState.inventory.curious_pups;
    
    // FIX: Multiplicaciones correctas
    const cost = (w * PRES_WHITE) + (b * PRES_BROWN) + (wi * PRES_WINTER) + (p * PRES_PUP_CAGE);
    gameState.budget -= cost;
    
    if(gameState.budget < 0) { 
        triggerGameOver('bancarrota'); 
        return; 
    }
    
    const report = document.getElementById('day-report-body');
    report.textContent = `Ventas: $${gameState.daily_tracker.earned_today.toFixed(2)}\nPreservación: -$${cost.toFixed(2)}\nBalance: $${gameState.budget.toFixed(2)}\n\n${gameState.daily_tracker.earned_today >= 30 ? '✅ Meta Cumplida' : '⚠️ Meta Fallida'}`;
    document.getElementById('day-end-modal').classList.remove('hidden');
}

function checkQuotaStatus() {
    const el = document.getElementById('display-quota-status');
    if(gameState.daily_tracker.earned_today >= 30) { 
        el.textContent = "Cumplida ✅"; 
        el.style.color="#4caf50"; 
    }
    else { 
        el.textContent = `$${gameState.daily_tracker.earned_today.toFixed(2)} / $30.00`; 
        el.style.color="#fff"; 
    }
}

function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (gameState && gameState.shopStatus === 'open') { 
        inactivityTimer = setTimeout(() => triggerGameOver('siesta'), INACTIVITY_LIMIT); 
    }
}

function startWinterChecks() {
    if(winterCheckInterval) clearInterval(winterCheckInterval);
    winterCheckInterval = setInterval(() => {
        if(gameState.shopStatus !== 'open') return;
        let hasWaiting = gameState.customers.some(c => c.state === 'waiting_in_queue' && c.hasWinter);
        if(hasWaiting) gameState.winterAbandonTimer++; 
        else gameState.winterAbandonTimer = 0;
        if(gameState.winterAbandonTimer >= 180) triggerGameOver('accidente');
    }, 1000);
}

function showErrorToast(msg) { console.error(msg); showToast(msg); }

// --- LÓGICA MINIJUEGO GORDINFLÓN ---
function startGordinflonMinigame(mode) {
    gameState.minigame.active = true;
    gameState.minigame.progress = 50; 
    gameState.minigame.needlePos = 0; 
    gameState.minigame.direction = 1; 
    
    document.getElementById('pc-hint').classList.toggle('hidden', mode !== 'PC');
    document.getElementById('mobile-hint').classList.toggle('hidden', mode !== 'MOVIL');
    document.getElementById('btn-start-minigame').classList.toggle('hidden', mode !== 'MOVIL');
    document.getElementById('btn-pet-action').classList.toggle('hidden', mode === 'MOVIL' && gameState.minigame.active);
    
    gameState.minigame.intervalId = setInterval(() => {
        if (!gameState.minigame.active) return;
        gameState.minigame.progress -= 0.033; 
        gameState.minigame.needlePos += 2.5 * gameState.minigame.direction; 
        
        if (gameState.minigame.needlePos >= 100 || gameState.minigame.needlePos <= 0) gameState.minigame.direction *= -1;
        if (gameState.minigame.progress <= 0) endMinigame(false);
        if (gameState.minigame.progress >= 100) endMinigame(true);
        
        updateMinigameUI();
    }, 16);
}

function performPetAction() {
    if (!gameState.minigame.active) return;
    const targetStart = 40; 
    const targetEnd = 60; 
    const hit = gameState.minigame.needlePos >= targetStart && gameState.minigame.needlePos <= targetEnd;
    
    if (hit) { 
        gameState.minigame.progress += 20; 
        showToast("¡Bien!"); 
    }
    else { 
        gameState.minigame.progress -= 10; 
        showToast("¡Fallaste!"); 
    }
    updateMinigameUI();
}

function endMinigame(success) {
    gameState.minigame.active = false; 
    clearInterval(gameState.minigame.intervalId);
    if (success) onGordinflonSuccess(); 
    else onGordinflonFail();
}

function updateMinigameUI() {
    const bar = document.getElementById('gordinflon-bar');
    const needle = document.getElementById('minigame-needle');
    if (bar && needle) {
        bar.style.width = `${Math.max(0, Math.min(100, gameState.minigame.progress))}%`;
        needle.style.left = `${gameState.minigame.needlePos}%`;
    }
}
