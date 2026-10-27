// --- CONFIGURACIÓN DE LA COMUNIDAD ---
const COMMUNITY_STYLES = {
    "FanmadeG": { border: "#ff69b4", glow: "#ff69b4" }, // Amiga de la comunidad (Rosa)
    "Default":   { border: "#ffffff", glow: "#ffffff" } // Por defecto
};

const COMMUNITY_NAMES = [
    { name: "Pekita", color: "#FFFFFF", specialTagBorder: "FanmadeG" },
    // Añade más aquí: { name: "NombreAmigo", color: "#FFFFFF", specialTagBorder: "FanmadeG" },
];

const DEFAULT_STATE = {
    day: 1,
    budget: 10.00,
    inventory: { white_wolfie: 24, brown_wolfie: 0, winteruff: 0 },
    shopStatus: 'closed',
    customers: [],
    stats: { total_sales_lifetime: 0, days_survived: 0, winter_sold_fresh: 0, has_sold_other_types: false },
    daily_tracker: { start_budget: 0, earned_today: 0 },
    
    interactionMode: null, 
    petTimer: 0,
    
    // VARIABLES MINIJUEGO GORDINFLÓN
    minigame: {
        active: false,
        progress: 50,
        needlePos: 0,
        direction: 1,
        intervalId: null
    },

    upgrades: { expansion1: false, ac: false, expansion2: false },
    currentMaxSlots: 48,
    biteCounter: 0,
    winterAbandonTimer: 0,
    lastBiteTime: 0
};

let gameState = null;
let inactivityTimer = null;
const INACTIVITY_LIMIT = 20 * 60 * 1000;
