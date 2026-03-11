// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTES GLOBALES
// ─────────────────────────────────────────────────────────────────────────────

const TILE_SIZE = 64;
let GRID_COLS = 20;   // mis à jour par _loadLevel()
let GRID_ROWS = 20;
let WORLD_W = GRID_COLS * TILE_SIZE;
let WORLD_H = GRID_ROWS * TILE_SIZE;

// ─────────────────────────────────────────────────────────────────────────────
//  DONNÉES DU NIVEAU ACTUEL (générées par l'éditeur)
//  Remplacez ce bloc pour changer de niveau.
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL_DATA = {
  "width": 15,
  "height": 15,
  "entities": [
    {
      "type": "exit",
      "x": 7,
      "y": 1
    },
    {
      "type": "statue",
      "x": 4,
      "y": 6
    },
    {
      "type": "pusher_enemy",
      "x": 1,
      "y": 7
    },
    {
      "type": "statue",
      "x": 4,
      "y": 7
    },
    {
      "type": "player",
      "x": 13,
      "y": 7
    },
    {
      "type": "statue",
      "x": 4,
      "y": 8
    },
    {
      "type": "item",
      "x": 2,
      "y": 10
    },
    {
      "type": "item",
      "x": 12,
      "y": 10
    },
    {
      "type": "item",
      "x": 2,
      "y": 11
    },
    {
      "type": "spawner",
      "x": 5,
      "y": 11
    },
    {
      "type": "spawner",
      "x": 9,
      "y": 11
    },
    {
      "type": "item",
      "x": 12,
      "y": 11
    }
  ],
  "map": [
    [
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2
    ],
    [
      2,
      2,
      2,
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      2,
      2,
      2,
      2,
      2
    ],
    [
      2,
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      2,
      2
    ],
    [
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      2
    ],
    [
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      2
    ],
    [
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2
    ],
    [
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      0,
      0,
      0,
      2
    ],
    [
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      0,
      0,
      0,
      2
    ],
    [
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      0,
      0,
      0,
      2
    ],
    [
      2,
      2,
      2,
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      2,
      2,
      2,
      2,
      2
    ],
    [
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      2
    ],
    [
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      2
    ],
    [
      2,
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      2,
      2
    ],
    [
      2,
      2,
      2,
      2,
      2,
      0,
      0,
      0,
      0,
      0,
      2,
      2,
      2,
      2,
      2
    ],
    [
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2
    ]
  ]
};

const MAX_RAY_BOUNCES = 3;    // [PETRIFY RAY] limite de rebonds sur miroirs
const RAY_DISPLAY_MS = 500;  // durée d'affichage du rayon (ms)

const TILE = { FLOOR: 0, WALL: 1, WATER: 2 };

const COLOR = {
  FLOOR: 0x3a2e1e,
  WALL: 0x1a1a2e,
  WATER: 0x0d47a1,
  WALL_BORDER: 0x0f0f20,
  GRID_LINE: 0x2a2018,
  PLAYER: 0x5b9bd5,
  ENEMY: 0xc0392b,
  ENEMY_STONE: 0x8a8a8a,   // gris pétrification
  MIRROR: 0xd4af37,   // or pour les miroirs
  RAY_CORE: 0x00ffff,   // cyan brillant
  RAY_GLOW: 0x0088ff,   // halo bleu
};

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

function gridToPixel(gx, gy) {
  return { x: gx * TILE_SIZE + TILE_SIZE / 2, y: gy * TILE_SIZE + TILE_SIZE / 2 };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SYSTÈME DE SAUVEGARDE
// ─────────────────────────────────────────────────────────────────────────────

let saveData = {
  unlockedLevels: 1,
  totalGems: 0,
  settings: {
    musicVolume: 0.6,
    sfxVolume: 0.8
  }
};

const SAVE_KEY = "gorgons_debt_save";

function saveGame() {
  try {
    const json = JSON.stringify(saveData);
    localStorage.setItem(SAVE_KEY, json);
    console.log("%c[SAVE] Jeu sauvegardé avec succès", "color: #00ffcc; font-weight: bold;", saveData);
  } catch (e) {
    console.error("[SAVE] Erreur lors de la sauvegarde :", e);
  }
}

function loadGame() {
  try {
    const json = localStorage.getItem(SAVE_KEY);
    if (json) {
      const loaded = JSON.parse(json);
      // Fusion récursive simple pour les settings
      if (loaded.settings) {
        saveData.settings = { ...saveData.settings, ...loaded.settings };
        delete loaded.settings;
      }
      saveData = { ...saveData, ...loaded };
      console.log("%c[SAVE] Sauvegarde chargée", "color: #00ffcc; font-weight: bold;", saveData);
    } else {
      console.log("[SAVE] Aucune sauvegarde trouvée, initialisation par défaut.");
    }
  } catch (e) {
    console.error("[SAVE] Erreur lors du chargement :", e);
  }
}

// Charger les données au démarrage
loadGame();
