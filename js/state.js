const DEFAULT_STATE = {
    day: 1,
    budget: 10.00,
    inventory: {
        white_wolfie: 24, // 2 lotes iniciales
        brown_wolfie: 0,
        winteruff: 0
    },
    shopStatus: 'closed',
    customers: [],
    stats: { total_sales_lifetime: 0, days_survived: 0 },
    daily_tracker: { start_budget: 0, earned_today: 0 },
    
    // Estado de Interacción
    interactionMode: null, 
    petTimer: 0,
    
    // Mejoras Compradas
    upgrades: {
        expansion1: false, // +12 slots (Total 60)
        ac: false,         // Aire Acondicionado (12s frescura)
        expansion2: false  // +12 slots + Cajero (Total 72)
    },
    
    // Capacidad Actual Calculada
    currentMaxSlots: 48
};

let gameState = null;
