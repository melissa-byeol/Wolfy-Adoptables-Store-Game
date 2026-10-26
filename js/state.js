const DEFAULT_STATE = {
    day: 1,
    budget: 10.00,
    inventory: {
        white_wolfie: 24,
        brown_wolfie: 0,
        winteruff: 0
    },
    shopStatus: 'closed',
    customers: [],
    stats: { 
        total_sales_lifetime: 0, 
        days_survived: 0,
        winter_sold_fresh: 0,      // Para final Era del Hielo
        has_sold_other_types: false // Para final Nah I'd Win
    },
    daily_tracker: { start_budget: 0, earned_today: 0 },
    
    interactionMode: null, 
    petTimer: 0,
    
    upgrades: {
        expansion1: false,
        ac: false,
        expansion2: false
    },
    
    currentMaxSlots: 48,
    
    biteCounter: 0,
    winterAbandonTimer: 0,
    lastBiteTime: 0
};

let gameState = null;
let inactivityTimer = null;
const INACTIVITY_LIMIT = 20 * 60 * 1000;
