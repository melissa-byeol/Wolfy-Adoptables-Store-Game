const DEFAULT_STATE = {
    day: 1,
    budget: 10.00,
    inventory: {
        white_wolfie: 24,
        brown_wolfie: 0 // Nuevo stock
    },
    shopStatus: 'closed',
    customers: [],
    stats: { total_sales_lifetime: 0, days_survived: 0 },
    daily_tracker: { start_budget: 0, earned_today: 0 },
    
    // --- NUEVO ESTADO DE INTERACCIÓN ---
    interactionMode: null, // null, 'grabbing', 'petting'
    petTimer: 0            // Segundos acumulados acariciando
};

let gameState = null;
