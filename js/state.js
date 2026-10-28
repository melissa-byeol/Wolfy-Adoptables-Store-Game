// --- CONFIGURACIÓN DE LA COMUNIDAD ---
const COMMUNITY_STYLES = {
    "FanmadeG": { border: "#ff69b4", glow: "#ff69b4" }, // Amiga de la comunidad (Rosa)
    "FanmadeB": { border: "#69b4ff", glow: "#69b4ff" },
    "Default":   { border: "#ffffff", glow: "#ffffff" } // Por defecto
};

const COMMUNITY_NAMES = [
    { name: "Pekita", color: "#FFFFFF", specialTagBorder: "FanmadeG" },
    { name: "Yocch", color: "#B9CFEB", specialTagBorder: "FanmadeG" },
];

// --- LOGROS ---
const ACHIEVEMENTS = {
    "demo_2027": {
        id: "demo_2027",
        title: "¡Has Jugado La Demo!!",
        desc: "Has sido de las personas especiales que jugaron durante los primeros meses.",
        isExclusive: true,
        deadline: "2027-01-01"
    }
};

const DEFAULT_STATE = {
    day: 1,
    budget: 10.00,
    inventory: {
        white_wolfie: 24,
        brown_wolfie: 0,
        winteruff: 0,
        curious_pups: 0
    },
    shopStatus: 'closed',
    customers: [],
    stats: { 
        total_sales_lifetime: 0, 
        days_survived: 0,
        winter_sold_fresh: 0,
        has_sold_other_types: false,
        chaos_warnings: 0,      
        microwave_incident: false,
        active_chaos_timers: []
    },
    daily_tracker: { 
        start_budget: 0, 
        earned_today: 0,
        chaos_log: []
    },
    
    // NUEVO: Sistema de Logros
    achievements: {
        unlocked: []
    },

    interactionMode: null, 
    petTimer: 0,
    
    // VARIABLES MINIJUEGO GORDINFLÓN (LÍNEA MÓVIL)
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
