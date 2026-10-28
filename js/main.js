// js/main.js - V5.2 MULTI-MODIFIERS & FULL INTEGRATION

document.addEventListener('DOMContentLoaded', () => {
    
    // --- REFERENCIAS DOM: PANTALLAS ---
    const screenStart = document.getElementById('start-screen');
    const screenMods = document.getElementById('modifier-screen');
    const screenGame = document.getElementById('game-screen');
    
    // --- REFERENCIAS DOM: MENÚ PRINCIPAL ---
    const btnNew = document.getElementById('btn-new-game');
    const btnLoad = document.getElementById('btn-load-game');
    
    // --- REFERENCIAS DOM: SELECTOR DE MODIFIERS ---
    const modifierListContainer = document.getElementById('modifier-list');
    const btnBackMenu = document.getElementById('btn-back-menu');
    const btnStartWithMod = document.getElementById('btn-start-with-modifier');
    
    // --- REFERENCIAS DOM: JUEGO PRINCIPAL ---
    const btnToggle = document.getElementById('btn-toggle-shop');
    const btnNext = document.getElementById('btn-next-day');
    const btnCloseGen = document.getElementById('btn-close-modal');
    
    // Reposición Stock
    const btnBuyW = document.getElementById('btn-buy-lote-white');
    const btnMaxW = document.getElementById('btn-buy-max-white');
    const btnBuyB = document.getElementById('btn-buy-lote-brown');
    const btnMaxB = document.getElementById('btn-buy-max-brown');
    const btnBuyWi = document.getElementById('btn-buy-lote-winter');
    const btnMaxWi = document.getElementById('btn-buy-max-winter');
    const btnBuyPups = document.getElementById('btn-buy-lote-pups');
    const btnMaxPups = document.getElementById('btn-buy-max-pups');
    
    // Mejoras
    const btnUpg1 = document.getElementById('btn-upg-exp1');
    const btnUpgAc = document.getElementById('btn-upg-ac');
    const btnUpg2 = document.getElementById('btn-upg-exp2');

    // Pago Manual
    const btnConfPay = document.getElementById('btn-confirm-payment');
    const btnCancelPay = document.getElementById('btn-cancel-payment');
    const inpPay = document.getElementById('pay-input-amount');
    const payModal = document.getElementById('payment-modal');

    // Minijuego Gordinflón
    const btnStartMinigame = document.getElementById('btn-start-minigame');
    const btnPetAction = document.getElementById('btn-pet-action');

    // --- ESTADO LOCAL PARA SELECCIÓN DE MODIFIERS ---
    let selectedModifiersTemp = new Set();

    // --- INICIALIZACIÓN Y CARGA GUARDADA ---
    const saved = loadGame();
    if(saved) { 
        btnLoad.disabled = false; 
        btnLoad.textContent = `Continuar (Día ${saved.day})`; 
    }

    // --- FUNCIONES AUXILIARES UI ---
    
    /**
     * Genera las tarjetas visuales de los modificadores disponibles
     */
    function renderModifierCards() {
        if (!modifierListContainer) return;
        modifierListContainer.innerHTML = '';
        
        AVAILABLE_MODIFIERS.forEach(mod => {
            const card = document.createElement('div');
            // Añadir clase de tier para colores CSS (.tier-GOOD, .tier-BAD, etc.)
            card.classList.add('modifier-card', `tier-${mod.tier}`);
            card.dataset.id = mod.id;
            
            card.innerHTML = `
                <h4>${mod.name}</h4>
                <p>${mod.description}</p>
            `;
            
            card.onclick = () => {
                if (selectedModifiersTemp.has(mod.id)) {
                    // Deseleccionar
                    selectedModifiersTemp.delete(mod.id);
                    card.classList.remove('selected');
                } else {
                    // Seleccionar
                    selectedModifiersTemp.add(mod.id);
                    card.classList.add('selected');
                }
                
                // Actualizar botón de inicio
                updateStartButtonState();
            };
            
            modifierListContainer.appendChild(card);
        });
    }

    /**
     * Actualiza el texto y estado del botón "Iniciar Partida" según cuántos mods hay seleccionados
     */
    function updateStartButtonState() {
        const count = selectedModifiersTemp.size;
        if (count > 0) {
            btnStartWithMod.disabled = false;
            btnStartWithMod.textContent = `INICIAR (${count} Mods)`;
        } else {
            // Permitir iniciar sin mods también si quieres, o mantenerlo deshabilitado.
            // Para esta versión, permitiremos iniciar con 0 mods (juego vanilla).
            btnStartWithMod.disabled = false; 
            btnStartWithMod.textContent = "INICIAR PARTIDA";
        }
    }

    // Ejecutar generación inicial
    renderModifierCards();


    // --- EVENT LISTENERS: NAVEGACIÓN ENTRE PANTALLAS ---

    // 1. Click "Nueva Partida" -> Ir a Selector de Mods
    btnNew.addEventListener('click', () => {
        screenStart.classList.add('hidden');
        screenMods.classList.remove('hidden');
        
        // Resetear selección visual al entrar
        selectedModifiersTemp.clear();
        document.querySelectorAll('.modifier-card').forEach(c => c.classList.remove('selected'));
        updateStartButtonState();
    });

    // 2. Click "Volver al Menú" desde Selector
    btnBackMenu.addEventListener('click', () => {
        screenMods.classList.add('hidden');
        screenStart.classList.remove('hidden');
    });

    // 3. Click "Iniciar Partida" desde Selector -> Iniciar Juego con Mods
    btnStartWithMod.addEventListener('click', () => {
        screenMods.classList.add('hidden');
        screenGame.classList.remove('hidden');
        
        // Convertir Set a Array para passing a logic.js
        const modsArray = Array.from(selectedModifiersTemp);
        
        // Llamar a la función de lógica que acepta múltiples modifiers
        initNewGame(modsArray);
        updateUI();
    });

    // 4. Click "Cargar Partida" -> Saltar Selector, ir directo al Juego
    btnLoad.addEventListener('click', () => {
        const d = loadGame();
        if(d) {
            gameState = d;
            // Seguridad: Si estaba abierta, cerrarla para evitar bugs de intervalos duplicados
            if(gameState.shopStatus === 'open') { 
                gameState.shopStatus = 'closed'; 
                gameState.customers = []; 
            }
            
            screenStart.classList.add('hidden');
            screenGame.classList.remove('hidden');
            
            updateUI();
            
            // Asegurar que el botón de tienda esté en estado correcto
            if(gameState.shopStatus === 'closed') { 
                btnToggle.textContent = "ABRIR TIENDA"; 
                btnToggle.className = "btn success large"; 
            }
        }
    });


    // --- EVENT LISTENERS: CONTROLES DE JUEGO PRINCIPAL ---

    // Abrir/Cerrar Tienda
    btnToggle.addEventListener('click', () => {
        toggleShopState();
        if(gameState.shopStatus === 'open') { 
            btnToggle.textContent = "CERRAR TIENDA"; 
            btnToggle.className = "btn danger large"; 
        } else { 
            btnToggle.textContent = "ABRIR TIENDA"; 
            btnToggle.className = "btn success large"; 
        }
    });

    // Siguiente Día
    btnNext.addEventListener('click', () => {
        nextDay();
        // El modal se cierra dentro de nextDay(), pero aseguramos limpieza visual aquí por si acaso
        btnToggle.textContent = "ABRIR TIENDA"; 
        btnToggle.className = "btn success large";
        gameState.shopStatus = 'closed'; 
    });

    // Modal Genérico (Bienvenida/Errores/Game Over/Victoria)
    btnCloseGen.addEventListener('click', () => {
        document.getElementById('message-modal').classList.add('hidden');
    });


    // --- EVENT LISTENERS: REPOSICIÓN STOCK ---
    
    if(btnBuyW) btnBuyW.addEventListener('click', () => buyLote('white'));
    if(btnMaxW) btnMaxW.addEventListener('click', () => fillStock('white'));
    
    if(btnBuyB) btnBuyB.addEventListener('click', () => buyLote('brown'));
    if(btnMaxB) btnMaxB.addEventListener('click', () => fillStock('brown'));
    
    if(btnBuyWi) btnBuyWi.addEventListener('click', () => buyLote('winter'));
    if(btnMaxWi) btnMaxWi.addEventListener('click', () => fillStock('winter'));
    
    if(btnBuyPups) btnBuyPups.addEventListener('click', () => buyLote('pups'));
    if(btnMaxPups) btnMaxPups.addEventListener('click', () => fillStock('pups'));


    // --- EVENT LISTENERS: MEJORAS DE TIENDA ---
    
    if(btnUpg1) btnUpg1.addEventListener('click', () => buyUpgrade('exp1'));
    if(btnUpgAc) btnUpgAc.addEventListener('click', () => buyUpgrade('ac'));
    if(btnUpg2) btnUpg2.addEventListener('click', () => buyUpgrade('exp2'));


    // --- EVENT LISTENERS: MODAL PAGO MANUAL ---
    
    if(btnConfPay) {
        btnConfPay.addEventListener('click', () => {
            const cid = parseFloat(payModal.dataset.cid);
            confirmPayment(inpPay.value, cid);
        });
    }
    
    if(btnCancelPay) {
        btnCancelPay.addEventListener('click', () => {
            payModal.classList.add('hidden');
        });
    }
    
    if(inpPay) {
        inpPay.addEventListener('keypress', e => { 
            if(e.key === 'Enter') btnConfPay.click(); 
        });
    }

    // Helper local para confirmar pago manual (llama a processPayment en ui.js)
    function confirmPayment(val, cid) {
        const cust = gameState.customers.find(c => c.id == cid);
        if(!cust) return;
        
        const expected = cust.cart.reduce((sum, item) => sum + item.price, 0);
        const paid = parseFloat(val);
        
        const errEl = document.getElementById('pay-error-msg');
        
        if(isNaN(paid)) { 
            if(errEl) {
                errEl.textContent = "Número inválido."; 
                errEl.classList.remove('hidden'); 
            }
            return; 
        }
        
        if(Math.abs(paid - expected) < 0.01) { // Comparación tolerante a floats
            processPayment(cid, paid);
        } else { 
            if(errEl) {
                errEl.textContent = `Incorrecto. Esperado: $${expected.toFixed(2)}`; 
                errEl.classList.remove('hidden'); 
            }
        }
    }


    // --- EVENT LISTENERS: MINIJUEGO GORDINFLÓN ---
    
    // Botón Empezar (Móvil)
    if(btnStartMinigame) {
        btnStartMinigame.addEventListener('click', () => {
            startGordinflonMinigame('MOVIL');
        });
    }
    
    // Botón Acariciar (Móvil)
    if(btnPetAction) {
        btnPetAction.addEventListener('mousedown', performPetAction);
        btnPetAction.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Evitar zoom/scrolleo accidental
            performPetAction();
        });
    }


    // --- EVENT LISTENERS: TECLADO GLOBAL (PELIGRO & INACTIVIDAD) ---
    
    window.addEventListener('keydown', e => {
        // 1. Lógica del Minijuego PC
        if(gameState && gameState.minigame && gameState.minigame.active) {
            if(e.key.toLowerCase() === 'p') {
                performPetAction();
            }
        }
        
        // 2. Resetear timer de inactividad si hay interacción válida
        resetInactivityTimer();
    });

    window.addEventListener('keyup', e => {
        // En este diseño simple, no necesitamos keyup específico para el minijuego de línea móvil,
        // ya que solo importa el momento exacto del click/tap.
        // Pero si implementaras un sistema de "mantener presionado", usarías keydown/keyup pares.
    });
    
    // Vigilante de Inactividad (Para Game Over #4)
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(eventType => {
        window.addEventListener(eventType, () => {
            resetInactivityTimer();
        }, { passive: true });
    });

});
