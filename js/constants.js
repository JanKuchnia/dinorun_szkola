// ─── Game Constants ──────────────────────────────────────────────────────────

const CANVAS_WIDTH  = 900;
const CANVAS_HEIGHT = 400;

// Physics
const GRAVITY         = 0.6;
const JUMP_FORCE      = -14;
const GROUND_Y        = 310;  // y position of the ground surface
const PLAYER_X        = 110;  // fixed horizontal position of player

// Speed
const SPEED_INITIAL   = 6;
const SPEED_MAX       = 18;
const SPEED_INCREMENT = 0.4;   // added every SPEED_SCORE_INTERVAL points
const SPEED_SCORE_INTERVAL = 400;

// Scoring
const SCORE_PER_FRAME     = 0.1;
const EGG_SCORE           = 10;
const GOLDEN_EGG_SCORE    = 50;
const COIN_SCORE          = 25;

// Obstacle settings
const OBSTACLE_MIN_GAP    = 700;   // px between obstacles at start
const OBSTACLE_GAP_MIN    = 320;   // absolute minimum gap
const OBSTACLE_GAP_REDUCE = 15;    // reduced every SPEED_SCORE_INTERVAL
const AERIAL_SCORE_START  = 500;   // score at which pterodactyl appears
const COMBO_SCORE_START   = 1000;  // score at which obstacle pairs appear

// Collectible settings
const COLLECTIBLE_CHANCE  = 0.003; // per-frame chance to spawn (during game)

// Power-up durations (ms)
const WINGS_DURATION  = 10000;
const STAR_DURATION   = 8000;

// Ground
const GROUND_HEIGHT   = 14;
const TILE_WIDTH      = 60;

// Player sprite dimensions (logical)
const PLAYER_W = 56;
const PLAYER_H = 72;
const PLAYER_DUCK_H = 44;

// Colors (pixel-art palette)
const COLORS = {
  sky:        '#a8d8ea',
  ground:     '#8B6914',
  groundTop:  '#5a8a3c',
  stone:      '#8a8a8a',
  metal:      '#9badb7',
  dark:       '#2d2d2d',
  score:      '#e8d5a3',
  ui:         '#1a1a2e',
  uiAccent:   '#e94560',
};

// Skins
const SKINS = [
  { id: 'backpack', name: 'Z plecakiem',    colors: { body: '#3a7bd5', pants: '#5a5a8a', skin: '#f5c5a3', hair: '#3d2b1f', extra: '#8B4513' } },
  { id: 'varsity',  name: 'Gwiazda sportu',    colors: { body: '#c0392b', pants: '#5a5a8a', skin: '#f5c5a3', hair: '#2c1810', extra: '#f39c12' } },
  { id: 'hoodie',   name: 'W bluzie',      colors: { body: '#f39c12', pants: '#455a64', skin: '#f5c5a3', hair: '#5d4037', extra: '#78909c' } },
  { id: 'dino',     name: '🦕 Klasyczny Dino', colors: { body: '#4caf50', pants: '#388e3c', skin: '#81c784', hair: '#2e7d32', extra: '#a5d6a7' } },
];

// Obstacle types definition
const OBSTACLE_TYPES = [
  { id: 'rocks',       aerial: false, w: 52, h: 44 },
  { id: 'log',         aerial: false, w: 64, h: 34 },
  { id: 'tar',         aerial: false, w: 80, h: 18, slow: true },
  { id: 'pterodactyl', aerial: true,  w: 68, h: 46, minScore: AERIAL_SCORE_START },
  { id: 'volcano',     aerial: false, w: 60, h: 64 },
  { id: 'bones',       aerial: false, w: 44, h: 28 },
];

// Collectible types definition
const COLLECTIBLE_TYPES = [
  { id: 'egg',        w: 24, h: 30, score: EGG_SCORE,        powerup: null },
  { id: 'golden_egg', w: 24, h: 30, score: GOLDEN_EGG_SCORE, powerup: null },
  { id: 'coins',      w: 40, h: 28, score: COIN_SCORE,       powerup: null },
  { id: 'wings',      w: 32, h: 28, score: 0,                powerup: 'wings' },
  { id: 'star',       w: 30, h: 30, score: 0,                powerup: 'star' },
  { id: 'shield',     w: 28, h: 32, score: 0,                powerup: 'shield' },
];

// ─── Sprite Maps (14 cols x 18 rows, each block 4x4) ────────────
// Keys: D=Outline, B=Body, P=Pants, +=Skin, ^=Hair, E=Extra, O=Eye, S=Shoes
const SPRITE_MAPS = {
  human: {
    run1: [
      "     DDDD     ",
      "    D^^^^D    ",
      "   D^^^^^^D   ",
      "   D+++++OD   ",
      "   D++++++D   ",
      "    DBBBBD    ",
      "  DDEBBBBEED  ",
      "  DBEBBBBEBD  ",
      "  DBBBBBBBBD  ",
      "   DBBBBBDD   ",
      "    DPPPPD    ",
      "    DPP DP    ",
      "    DP  DP    ",
      "   DP   DPP   ",
      "   DP    DP   ",
      "  DSD    DSD  ",
      "  DDD    DDD  ",
      "              "
    ],
    run2: [
      "     DDDD     ",
      "    D^^^^D    ",
      "   D^^^^^^D   ",
      "   D+++++OD   ",
      "   D++++++D   ",
      "    DBBBBD    ",
      "  DDEBBBBEED  ",
      "  DBEBBBBEBD  ",
      "  DBBBBBBBDD  ",
      "   DDBBBBBD   ",
      "    DPPPPD    ",
      "   DP  DPP    ",
      "   DPP  DP    ",
      "    DP   DP   ",
      "    DP  DP    ",
      "   DSD  DSD   ",
      "   DDD  DDD   ",
      "              "
    ],
    duck: [
      "              ",
      "              ",
      "              ",
      "              ",
      "     DDDD     ",
      "    D^^^^D    ",
      "   D^^^^^^D   ",
      "   D+++++OD   ",
      "   D++++++D   ",
      "    DBBBBD    ",
      "  DDEBBBBEEDD ",
      "  DBEBBBBEBBD ",
      "  DBBBBBBBBD  ",
      "  DPPPDPPPD   ",
      "  DP DDP DD   ",
      " DSD  DSD     ",
      " DDD  DDD     ",
      "              "
    ]
  },
  dino: {
    run1: [
      "         DDDDD",
      "        DBBBBD",
      "        DB BOD",
      "        DBBBBD",
      "        DBBBD ",
      " D      DBBD  ",
      " DD   DDBBBBD ",
      " DBDDDBBBBBBD ",
      " DBBBBBBBBBBD ",
      "  DBBBBBBBBBD ",
      "   DBBBD DBBD ",
      "   DBB   DBB  ",
      "   DBB        ",
      "  DBBD        ",
      "              ",
      "              ",
      "              ",
      "              "
    ],
    run2: [
      "         DDDDD",
      "        DBBBBD",
      "        DB BOD",
      "        DBBBBD",
      "        DBBBD ",
      " D      DBBD  ",
      " DD   DDBBBBD ",
      " DBDDDBBBBBBD ",
      " DBBBBBBBBBBD ",
      "  DBBBBBBBBBD ",
      "   DBBBD DBB  ",
      "   DBB   DBB  ",
      "         DBBD ",
      "              ",
      "              ",
      "              ",
      "              ",
      "              "
    ],
    duck: [
      "              ",
      "              ",
      "              ",
      "              ",
      "         DDDDD",
      "        DBBBBD",
      "  D     DB BOD",
      "  DD  DDBBBBBD",
      "  DBDDDBBBBBBD",
      "  DBBBBBBBBBBD",
      "   DBBBD DBBD ",
      "   DB     DB  ",
      "  DBBD   DBBD ",
      "              ",
      "              ",
      "              ",
      "              ",
      "              "
    ]
  }
};
