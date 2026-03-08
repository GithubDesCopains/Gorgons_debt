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
  "width": 16,
  "height": 16,
  "entities": [
    {
      "type": "spawner",
      "x": 10,
      "y": 2
    },
    {
      "type": "enemy",
      "x": 10,
      "y": 3
    },
    {
      "type": "exit",
      "x": 13,
      "y": 4
    },
    {
      "type": "hammer",
      "x": 4,
      "y": 5,
      "orientation": "R"
    },
    {
      "type": "player",
      "x": 10,
      "y": 12
    }
  ],
  "map": [
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
    ],
    [
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
      0,
      0,
      0,
      0,
      0
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
