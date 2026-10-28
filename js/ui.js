// js/ui.js - V5 CAOS & DOMINANCIA + COMUNIDAD + MINIJUEVO

function initStoreGrid() {}

function updateStoreMapView() {
    if (!gameState) return;
    const grid = document.getElementById('shelves-grid');
    if(!grid) return;
    grid.innerHTML = '';
    const cols = 6;
    const rows = Math.ceil(gameState.currentMaxSlots / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const stocks = [
        ...Array(gameState.inventory.white_wolfie).fill('type-white'),
        ...Array(gameState.inventory.brown_wolfie).fill('type-brown'),
        ...Array(gameState.inventory.winteruff).fill('type-winter'),
        ...Array(gameState.inventory.curious_pups).fill('type-pups')
    ];

    for(let i=0; i<gameState.currentMaxSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        if(stocks[i]) slot.classList.add('filled', stocks[i]);
        grid.appendChild(slot);
    }
    document.getElementById('display-total-stock-map').textContent = stocks.length;
    document.getElementById('max-stock-display').textContent = gameState.currentMaxSlots;
    document.getElementById('slot-capacity-display').textContent = gameState.currentMaxSlots;
}

function renderCustomers() {
    if(!gameState) return;
    const aisle = document.querySelector('.aisle-floor');
    const queue = document.querySelector('.queue-display');
    if(!aisle || !queue) return;
    aisle.innerHTML = ''; queue.innerHTML = '';
    const hasAuto = gameState.upgrades.expansion2;

    gameState.customers.forEach(cust => {
        const blob = document.createElement('div');
        blob.classList.add('customer-blob');
        blob.dataset.id = cust.id;
        const tag = document.createElement('span');
        tag.classList.add('customer-name-tag');
        let icon = '⬜'; if(cust.desiredType==='brown') icon='🟤'; if(cust.desiredType==='winter') icon='❄️'; if(cust.desiredType==='pups') icon='🐾';
        
        // Lógica de estilo para la comunidad
        if (cust.isCommunity) {
            const styleConfig = COMMUNITY_STYLES[cust.borderType] || COMMUNITY_STYLES["Default"];
            tag.style.color = cust.customColor;
            tag.style.fontWeight = "bold";
            tag.style.border = `1px solid ${styleConfig.border}`; 
            tag.style.boxShadow = `0 0 5px ${styleConfig.glow}`;
            tag.style.padding = "1px 4px";
            tag.style.backgroundColor = "rgba(0,0,0,0.8)";
        }

        tag.textContent = `${cust.name.split(' ')[0]} ${icon}x${cust.desiredQty}`;
        blob.appendChild(tag);

        // Renderizado especial del Jefe
        if (cust.isBoss) {
            blob.style.width = "36px"; blob.style.height = "36px";
            blob.style.border = "3px solid #ffd700"; blob.style.boxShadow = "0 0 15px rgba(255, 215, 0, 0.8)";
            blob.style.zIndex = "20"; tag.style.background = "rgba(255, 215, 0, 0.9)"; tag.style.color = "#000";
        }

        let left=0, top=50;
        switch(cust.state) {
            case 'entering': blob.classList.add('entering'); left = cust.progress*0.3; break;
            case 'shopping': blob.classList.add('shopping'); left=30+(Math.random()*10); top=30+(Math.random()*40); break;
            case 'going_to_checkout': blob.classList.add('going-to-checkout'); left=30+(cust.progress*0.5); break;
            case 'waiting_in_queue': 
                blob.classList.add('waiting-in-queue'); left=80+(Math.random()*5); 
                if(!hasAuto || cust.hasDanger || cust.hasWinter || cust.isBoss) {
                    blob.style.cursor='pointer'; blob.onclick = () => attemptCheckout(cust.id);
                }
                break;
            case 'leaving_happy': blob.classList.add('leaving-happy'); left=80+((100-cust.progress)*0.2); break;
            case 'leaving_angry': blob.classList.add('leaving-angry'); left=80+((100-cust.progress)*0.2); break;
        }
        blob.style.left = `${left}%`; blob.style.top = `${top}%`;
        aisle.appendChild(blob);

        if(cust.state === 'waiting_in_queue') {
            const item = document.createElement('div');
            item.classList.add('queue-item');
            if (cust.isCommunity) {
                const styleConfig = COMMUNITY_STYLES[cust.borderType] || COMMUNITY_STYLES["Default"];
                item.style.border = `1px solid ${styleConfig.border}`;
                item.style.boxShadow = `inset 0 0 5px ${styleConfig.glow}`;
            }
            const total = cust.cart.reduce((s,i)=>s+i.price,0);
            // FIX: con "Hackeo A La Base De Datos" los precios se ocultan en la cola
            const priceLabel = gameState.modifierFlags.hidePrices ? '???' : `$${total.toFixed(2)}`;
            item.innerHTML = `<span>${cust.name.split(' ')[0]}</span><span class="price">${priceLabel}</span>`;
            if(!hasAuto || cust.hasDanger || cust.hasWinter || cust.isBoss) item.onclick = () => attemptCheckout(cust.id);
            queue.appendChild(item);
        }
    });
    
    const indicator = document.getElementById('auto-cashier-indicator');
    if(hasAuto) indicator.classList.remove('hidden'); else indicator.classList.add('hidden');
}

function updateUI() {
    if(!gameState) return;
    document.getElementById('display-day').textContent = gameState.day;
    document.getElementById('display-budget').textContent = `$${gameState.budget.toFixed(2)}`;
    const st = document.getElementById('display-shop-status');
    if(gameState.shopStatus==='open') { st.textContent="ABIERTA"; st.className="stat-item status-open"; }
    else { st.textContent="CERRADA"; st.className="stat-item status-closed"; }
    checkQuotaStatus();
    updateStoreMapView();
    renderCustomers();
    updateUpgradesUI();
    updateModifierBadge();
    
    // Alerta bajo stock
    const alert = document.getElementById('low-stock-alert');
    const totalStock = Object.values(gameState.inventory).reduce((a,b)=>a+b,0);
    if(totalStock < 12) alert.classList.remove('hidden'); else alert.classList.add('hidden');

    // Indicador Caos Activo
    const chaosDisplay = document.getElementById('chaos-active-display');
    if (chaosDisplay) {
        const activeCount = gameState.stats.active_chaos_timers.filter(t => t.expiresOn > gameState.day).length;
        if (activeCount > 0) {
            chaosDisplay.textContent = `🐾 Caos: ${activeCount}`;
            chaosDisplay.classList.remove('hidden');
            chaosDisplay.style.color = activeCount >= 3 ? "#f44336" : "#ff9800";
        } else {
            chaosDisplay.classList.add('hidden');
        }
    }
}

function updateModifierBadge() {
    const el = document.getElementById('active-modifier-display');
    if (!el) return;
    const strong = el.querySelector('strong');
    if (strong) {
        const mods = (gameState.activeModifiers && gameState.activeModifiers.length) ? gameState.activeModifiers : null;
        strong.textContent = mods ? mods.join(', ') : 'Ninguno';
    }
}

function updateUpgradesUI() {
    ['exp1', 'ac', 'exp2'].forEach(id => {
        const btn = document.getElementById(`btn-upg-${id}`);
        const item = document.getElementById(`upg-${id}`);
        if(gameState.upgrades[id]) {
            item.classList.add('purchased'); btn.textContent = "Comprado"; btn.disabled = true;
        }
    });
}

// --- MODALES DE PAGO ---
function showQuickPayModal(cust) {
    const m = document.getElementById('quick-pay-modal');
    const total = cust.cart.reduce((s,i)=>s+i.price,0);
    m.querySelector('#qp-client-name').textContent = cust.name;
    m.querySelector('#qp-total-amount').textContent = `$${total.toFixed(2)}`;
    m.querySelector('#qp-quantity').textContent = `${cust.cart.length} items`;
    m.dataset.cid = cust.id;
    m.querySelector('#btn-quick-confirm').onclick = () => processPayment(cust.id, total);
    // FIX: el botón "Cancelar" de caja rápida no tenía handler (quedaba inerte)
    const qpCancel = m.querySelector('#btn-quick-cancel');
    if (qpCancel) qpCancel.onclick = () => { cust.state = 'leaving_angry'; cust.progress = 100; hideAllModals(); renderCustomers(); };
    m.classList.remove('hidden');
}

function showManualCalcModal(cust) {
    const m = document.getElementById('payment-modal');
    const ul = m.querySelector('#client-cart-list');
    ul.innerHTML = ''; let total=0;
    cust.cart.forEach(i => {
        const li = document.createElement('li');
        let name = 'Básico'; if(i.type==='brown') name='Gordinflón'; if(i.type==='winter') name='Winteruff'; if(i.type==='pups') name='Curioso';
        li.innerHTML = `<span>${name} x1</span><span>$${i.price.toFixed(2)}</span>`;
        ul.appendChild(li); total+=i.price;
    });
    m.querySelector('#pay-total-amount').textContent = `$${total.toFixed(2)}`;
    m.querySelector('#pay-client-name').textContent = cust.name;
    m.querySelector('#pay-input-amount').value = '';
    m.dataset.cid = cust.id;
    m.classList.remove('hidden');
}

let winterInterval = null;
function showWinteruffPayModal(cust) {
    const m = document.getElementById('winteruff-modal');
    const bar = m.querySelector('#wu-heat-bar');
    const priceEl = m.querySelector('#wu-price-display');
    const limit = gameState.upgrades.ac ? 12000 : 4000;
    let elapsed = 0; let price = PRICE_WINTER_FRESH;
    
    m.querySelector('#wu-title').textContent = "❄️ VENTA URGENTE";
    m.querySelector('#wu-subtitle').textContent = "¡Vende antes de que se derrita!";
    priceEl.textContent = `$${price.toFixed(2)} (FRESCO)`; priceEl.style.color = "#4caf50";
    bar.style.width = "0%"; m.querySelector('#wu-client-name').textContent = cust.name;
    m.dataset.cid = cust.id;
    
    winterInterval = setInterval(() => {
        elapsed += 100; bar.style.width = `${Math.min((elapsed/limit)*100, 100)}%`;
        if(elapsed >= limit) {
            price = PRICE_WINTER_BASE; priceEl.textContent = `$${price.toFixed(2)} (DAÑADO)`;
            priceEl.style.color = "#f44336"; m.classList.add('shaking');
        }
    }, 100);
    // FIX: al confirmar/cancelar había que VOLVER a mostrar el modal ('hidden' añadido por
    // hideAllModals). Ahora solo se oculta; el siguiente cliente lo reconfigura.
    m.querySelector('#btn-wu-confirm').onclick = () => { clearInterval(winterInterval); processPayment(cust.id, price); m.classList.remove('shaking'); };
    m.querySelector('#btn-wu-cancel').onclick = () => { clearInterval(winterInterval); m.classList.add('hidden'); };
    m.classList.remove('hidden');
}

function showBossPayModal(cust) {
    const m = document.getElementById('winteruff-modal');
    const bar = m.querySelector('#wu-heat-bar');
    const priceEl = m.querySelector('#wu-price-display');
    const limit = gameState.upgrades.ac ? 9000 : 3000;
    let elapsed = 0; let price = PRICE_WINTER_FRESH * 6;
    
    m.querySelector('#wu-title').textContent = "👑 EL JEFE EXIGE ATENCIÓN";
    m.querySelector('#wu-subtitle').textContent = "¡3 segundos o pierdes $144!";
    priceEl.textContent = `$${price.toFixed(2)} (FRESCO)`; priceEl.style.color = "#ffd700";
    bar.style.width = "0%"; m.querySelector('#wu-client-name').textContent = cust.name;
    m.dataset.cid = cust.id;
    
    winterInterval = setInterval(() => {
        elapsed += 100; bar.style.width = `${Math.min((elapsed/limit)*100, 100)}%`;
        if(elapsed >= limit) {
            price = PRICE_WINTER_BASE * 6; priceEl.textContent = `$${price.toFixed(2)} (DAÑADO - PERDISTE $144)`;
            priceEl.style.color = "#f44336"; m.classList.add('shaking');
        }
    }, 100);
    m.querySelector('#btn-wu-confirm').onclick = () => { 
        clearInterval(winterInterval); processPayment(cust.id, price); 
        // FIX: no volver a mostrar el modal aquí (processPayment ya lo oculta)
        m.classList.remove('shaking');
        if(price === PRICE_WINTER_FRESH * 6) showToast("🏆 ¡DOMINANCIA ALCANZADA!");
    };
    m.querySelector('#btn-wu-cancel').onclick = () => { clearInterval(winterInterval); m.classList.remove('shaking'); m.classList.add('hidden'); };
    m.classList.remove('hidden');
}

// FIX: limpiador global de timers de modales (calor winteruff/jefe y minijuego)
// para que ningún intervalo siga corriendo al cerrar la tienda o cambiar de pantalla.
function clearAllPendingTimers() {
    if (winterInterval) { clearInterval(winterInterval); winterInterval = null; }
    if (gameState && gameState.minigame && gameState.minigame.intervalId) {
        clearInterval(gameState.minigame.intervalId);
        gameState.minigame.intervalId = null;
        gameState.minigame.active = false;
    }
}

function processPayment(cid, amount) {
    const cust = gameState.customers.find(c=>c.id==cid);
    if(!cust) return;
    gameState.budget += amount;
    gameState.daily_tracker.earned_today += amount;
    gameState.stats.total_sales_lifetime += cust.cart.length;
    cust.cart.forEach(item => {
        if (item.type === 'winter') gameState.stats.winter_sold_fresh++;
        else if (item.type !== 'white') gameState.stats.has_sold_other_types = true;
        if (item.type === 'pups') activateChaosTimer();
    });
    cust.state = 'leaving_happy'; cust.progress = 100;
    hideAllModals(); updateUI(); renderCustomers();
}

// --- PELIGRO GORDINFLÓN (MINIJUEVO) ---
let currentDangerCust = null;
function startDangerSequence(cust) {
    currentDangerCust = cust;
    const ov = document.getElementById('interaction-overlay');
    ov.classList.remove('hidden');

    const instructionEl = document.getElementById('interaction-instruction');
    if (instructionEl) instructionEl.textContent = "Un Gordinflón se ha alterado. ¡Calma la barra antes de que llegue a 0!";

    // FIX: el botón "Empezar" no tenía handler asignado (quedaba inerte).
    // Ahora inicia el minijuego en modo móvil (con botón ACARICIAR).
    const btnStartMg = document.getElementById('btn-start-minigame');
    if (btnStartMg) btnStartMg.onclick = () => startGordinflonMinigame('MOVIL');

    // FIX: el botón ACARICIAR tampoco tenía listener; ahora ejecuta la caricia.
    const btnPet = document.getElementById('btn-pet-action');
    if (btnPet) btnPet.onclick = () => handlePetInput();

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.getElementById('mobile-hint').classList.remove('hidden'); document.getElementById('pc-hint').classList.add('hidden');
        document.getElementById('btn-start-minigame').classList.remove('hidden'); document.getElementById('btn-pet-action').classList.add('hidden');
    } else {
        document.getElementById('pc-hint').classList.remove('hidden'); document.getElementById('mobile-hint').classList.add('hidden');
        document.getElementById('btn-start-minigame').classList.add('hidden'); startGordinflonMinigame('PC');
    }
}

function onGordinflonSuccess() {
    document.getElementById('interaction-overlay').classList.add('hidden'); showToast("✅ Lobito calmado. Procediendo al cobro...");
    if (currentDangerCust) { const cust = currentDangerCust; currentDangerCust = null; const types = new Set(cust.cart.map(i => i.type)); if (types.size === 1) showQuickPayModal(cust); else showManualCalcModal(cust); }
}

function onGordinflonFail() {
    document.getElementById('interaction-overlay').classList.add('hidden');
    const now = Date.now(); gameState.biteCounter++; if (now - gameState.lastBiteTime > 30000) { gameState.biteCounter = 1; } gameState.lastBiteTime = now;
    showToast(`⚠️ ¡Te ha mordido! (Mordiscos: ${gameState.biteCounter}/10)`);
    if (currentDangerCust) { currentDangerCust.state = 'leaving_angry'; currentDangerCust.progress = 100; renderCustomers(); }
    currentDangerCust = null;
    if (gameState.biteCounter >= 10) triggerGameOver('fatality');
}

function hideAllModals() { clearAllPendingTimers(); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); }
function showToast(msg) {
    console.log(msg);
    let host = document.getElementById('toast-container');
    if (!host) {
        host = document.createElement('div');
        host.id = 'toast-container';
        host.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:2000;display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:none;';
        document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = 'toast-msg';
    t.textContent = msg;
    t.style.cssText = 'background:rgba(0,0,0,0.9);color:#fff;padding:8px 14px;border-radius:8px;border:1px solid #555;font-size:0.9em;max-width:90vw;text-align:center;';
    host.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}
function showModal(t, b) {
    document.getElementById('modal-title').textContent = t;
    document.getElementById('modal-body').innerText = b;
    document.getElementById('message-modal').classList.remove('hidden');
}
