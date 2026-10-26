// js/ui.js - V4

function initStoreGrid() { /* No hace nada, se genera dinámicamente */ }

function updateStoreMapView() {
    if (!gameState) return;
    const grid = document.getElementById('shelves-grid');
    if(!grid) return;
    
    grid.innerHTML = '';
    
    // Configurar grilla según capacidad actual
    // Si son 48 slots: 6 cols x 8 rows. Si son 60: 6x10. Si son 72: 6x12.
    const cols = 6;
    const rows = Math.ceil(gameState.currentMaxSlots / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const stocks = [
        ...Array(gameState.inventory.white_wolfie).fill('type-white'),
        ...Array(gameState.inventory.brown_wolfie).fill('type-brown'),
        ...Array(gameState.inventory.winteruff).fill('type-winter')
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
        let icon = '⬜'; if(cust.desiredType==='brown') icon='🟤'; if(cust.desiredType==='winter') icon='❄️';
        tag.textContent = `${cust.name.split(' ')[0]} ${icon}x${cust.desiredQty}`;
        blob.appendChild(tag);

        let left=0, top=50;
        switch(cust.state) {
            case 'entering': blob.classList.add('entering'); left = cust.progress*0.3; break;
            case 'shopping': blob.classList.add('shopping'); left=30+(Math.random()*10); top=30+(Math.random()*40); break;
            case 'going_to_checkout': blob.classList.add('going-to-checkout'); left=30+(cust.progress*0.5); break;
            case 'waiting_in_queue': 
                blob.classList.add('waiting-in-queue'); left=80+(Math.random()*5); 
                if(!hasAuto || cust.hasDanger || cust.hasWinter) {
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
            const total = cust.cart.reduce((s,i)=>s+i.price,0);
            item.innerHTML = `<span>${cust.name.split(' ')[0]}</span><span class="price">$${total.toFixed(2)}</span>`;
            if(!hasAuto || cust.hasDanger || cust.hasWinter) item.onclick = () => attemptCheckout(cust.id);
            queue.appendChild(item);
        }
    });
    
    // Mostrar/Ocultar indicador de cajero
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
    
    const alert = document.getElementById('low-stock-alert');
    const totalStock = gameState.inventory.white_wolfie + gameState.inventory.brown_wolfie + gameState.inventory.winteruff;
    if(totalStock < 12) alert.classList.remove('hidden'); else alert.classList.add('hidden');
}

function updateUpgradesUI() {
    const ids = ['exp1', 'ac', 'exp2'];
    ids.forEach(id => {
        const btn = document.getElementById(`btn-upg-${id}`);
        const item = document.getElementById(`upg-${id}`);
        if(gameState.upgrades[id]) {
            item.classList.add('purchased');
            btn.textContent = "Comprado";
            btn.disabled = true;
        }
    });
}

// --- MODALES ---

function showQuickPayModal(cust) {
    const m = document.getElementById('quick-pay-modal');
    const total = cust.cart.reduce((s,i)=>s+i.price,0);
    m.querySelector('#qp-client-name').textContent = cust.name;
    m.querySelector('#qp-total-amount').textContent = `$${total.toFixed(2)}`;
    m.querySelector('#qp-quantity').textContent = `${cust.cart.length} items`;
    m.dataset.cid = cust.id;
    m.querySelector('#btn-quick-confirm').onclick = () => processPayment(cust.id, total);
    m.classList.remove('hidden');
}

function showManualCalcModal(cust) {
    const m = document.getElementById('payment-modal');
    const ul = m.querySelector('#client-cart-list');
    ul.innerHTML = ''; let total=0;
    cust.cart.forEach(i => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${i.type==='white'?'Básico':i.type==='brown'?'Gordinflón':'Winteruff'} x1</span><span>$${i.price.toFixed(2)}</span>`;
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
    
    let elapsed = 0;
    let price = PRICE_WINTER_FRESH;
    
    priceEl.textContent = `$${price.toFixed(2)} (FRESCO)`;
    priceEl.style.color = "#4caf50";
    bar.style.width = "0%";
    
    m.querySelector('#wu-client-name').textContent = cust.name;
    m.dataset.cid = cust.id;
    
    winterInterval = setInterval(() => {
        elapsed += 100;
        bar.style.width = `${Math.min((elapsed/limit)*100, 100)}%`;
        if(elapsed >= limit) {
            price = PRICE_WINTER_BASE;
            priceEl.textContent = `$${price.toFixed(2)} (DAÑADO)`;
            priceEl.style.color = "#f44336";
            m.classList.add('shaking');
        }
    }, 100);
    
    m.querySelector('#btn-wu-confirm').onclick = () => {
        clearInterval(winterInterval);
        processPayment(cust.id, price);
        m.classList.remove('shaking');
        m.classList.add('hidden');
    };
    m.querySelector('#btn-wu-cancel').onclick = () => {
        clearInterval(winterInterval);
        m.classList.remove('shaking');
        m.classList.add('hidden');
    };
    
    m.classList.remove('hidden');
}

function processPayment(cid, amount) {
    const cust = gameState.customers.find(c=>c.id==cid);
    if(!cust) return;
    gameState.budget += amount;
    gameState.daily_tracker.earned_today += amount;
    gameState.stats.total_sales_lifetime += cust.cart.length;
    cust.state = 'leaving_happy'; cust.progress = 100;
    
    hideAllModals();
    updateUI(); renderCustomers();
}

// --- PELIGRO ---
let currentDangerCust = null;
function startDangerSequence(cust) {
    currentDangerCust = cust;
    const ov = document.getElementById('interaction-overlay');
    ov.classList.remove('hidden');
    document.getElementById('interaction-instruction').innerHTML = `⚠️ ¡PELIGRO!<br>Presiona <kbd>G</kbd> para agarrar.`;
    gameState.interactionMode = 'idle_danger';
    gameState.petTimer = 0;
}

function handleDangerKey(k) {
    if(!currentDangerCust) return;
    k = k.toLowerCase();
    if(gameState.interactionMode === 'idle_danger' && k==='g') {
        gameState.interactionMode = 'grabbing';
        document.getElementById('interaction-instruction').innerHTML = `Agarrado. Mantén <kbd>P</kbd> 4s.`;
        startPetting();
    }
}
function handleDangerKeyUp(k) {
    if(!currentDangerCust) return;
    k = k.toLowerCase();
    if(gameState.interactionMode === 'petting' && k==='p') failDanger("Soltaste pronto.");
    if(gameState.interactionMode === 'grabbing' && k==='g') failDanger("Perdiste agarre.");
}

let petInt = null;
function startPetting() {
    clearInterval(petInt);
    gameState.interactionMode = 'petting';
    document.getElementById('pet-bar-container').classList.remove('hidden');
    petInt = setInterval(() => {
        gameState.petTimer += 0.1;
        document.getElementById('pet-progress-bar').style.width = `${Math.min((gameState.petTimer/4)*100,100)}%`;
        if(gameState.petTimer >= 4) succeedDanger();
    }, 100);
}

function succeedDanger() {
    clearInterval(petInt);
    document.getElementById('interaction-overlay').classList.add('hidden');
    document.getElementById('pet-bar-container').classList.add('hidden');
    showToast("✅ Calma restaurada.");
    const cust = currentDangerCust;
    currentDangerCust = null;
    // Abrir modal normal
    const types = new Set(cust.cart.map(i=>i.type));
    if(types.size===1) showQuickPayModal(cust); else showManualCalcModal(cust);
}

function failDanger(reason) {
    clearInterval(petInt);
    document.getElementById('interaction-overlay').classList.add('hidden');
    document.getElementById('pet-bar-container').classList.add('hidden');
    showToast(`❌ ${reason}`);
    if(currentDangerCust) {
        currentDangerCust.state = 'leaving_angry'; currentDangerCust.progress = 100;
        renderCustomers();
    }
    currentDangerCust = null;
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function showToast(msg) { console.log(msg); }
function showModal(t, b) {
    document.getElementById('modal-title').textContent = t;
    document.getElementById('modal-body').innerText = b;
    document.getElementById('message-modal').classList.remove('hidden');
}
