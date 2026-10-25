// js/ui.js - VERSIÓN ACTUALIZADA PARA MAPA 8x11 CON ESTANTES

/**
 * Genera la cuadrícula visual de los estantes (3 estantes x 24 slots = 72 total)
 */
function initStoreGrid() {
    const shelvesContainers = document.querySelectorAll('.shelf-slots-container');
    
    // Limpiamos primero por si acaso se llama múltiples veces
    shelvesContainers.forEach(container => {
        container.innerHTML = ''; 
        
        // Cada estante tiene capacidad para 24 lobitos (4 columnas x 6 filas)
        for (let i = 0; i < 24; i++) {
            const slot = document.createElement('div');
            slot.classList.add('slot', 'empty');
            
            // Asignamos evento de click para vender individualmente
            // Usamos una función anónima para capturar el elemento 'slot' correcto
            slot.addEventListener('click', () => handleSlotClick(slot));
            
            container.appendChild(slot);
        }
    });
}

/**
 * Sincroniza el estado lógico (gameState.inventory) con la vista visual (DOM)
 */
function updateStoreMapView() {
    if (!gameState) return;

    const totalStock = gameState.inventory.white_wolfie;
    const allSlots = document.querySelectorAll('.slot');
    
    let filledCount = 0;

    // Iteramos sobre TODOS los slots del documento (orden natural: Estante A -> B -> C)
    allSlots.forEach((slot) => {
        if (filledCount < totalStock) {
            // Si aún hay stock por colocar, pintamos el slot de blanco
            slot.classList.remove('empty');
            slot.classList.add('filled');
            filledCount++;
        } else {
            // Si ya colocamos todo el stock, aseguramos que el resto esté vacío
            slot.classList.remove('filled');
            slot.classList.add('empty');
        }
    });

    // Actualizamos el contador numérico inferior
    const displayTotal = document.getElementById('display-total-stock-map');
    if(displayTotal) {
        displayTotal.textContent = `${totalStock}/72`;
    }
}

/**
 * Maneja el clic en un slot específico del estante
 */
function handleSlotClick(slotElement) {
    // Solo permitimos acción si el slot está lleno (hay un lobito ahí)
    if (slotElement.classList.contains('filled')) {
        sellUnitWhite(); // Llamamos a la lógica global de venta
        updateStoreMapView(); // Refrescamos toda la vista para mover los "lobitos restantes"
                             // (Nota: En una versión avanzada, solo refrescaríamos ese slot, 
                             // pero para MVP esto es más simple y evita bugs de sincronización)
    } else {
        showToast("Este hueco está vacío.");
    }
}

/**
 * Funciones auxiliares de interfaz general (Header, Modal, Toasts)
 * Estas se mantienen igual que antes, pero las incluyo aquí por completitud
 */
function updateUI() {
    if (!gameState) return;

    // Actualizar textos superiores
    document.getElementById('display-day').textContent = gameState.day;
    document.getElementById('display-budget').textContent = `$${gameState.budget.toFixed(2)}`;
    
    // Actualizar mapa visual
    updateStoreMapView();
    
    // Verificar estado de cuota
    checkQuotaStatus();
}

function showModal(title, body) {
    const modal = document.getElementById('message-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerText = body; 
    modal.classList.remove('hidden');
}

function hideModal() {
    document.getElementById('message-modal').classList.add('hidden');
}

function showToast(message) {
    console.log(message);
    // Para un prototipo rápido, puedes descomentar la línea de abajo 
    // si quieres ver alertas emergentes en lugar de solo consola:
    // alert(message); 
}
