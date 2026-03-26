// Game dimensions and core constants
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 320;
export const TILE_SIZE = 16;
export const SCALE = 1;

// Map dimensions in tiles
export const MAP_COLS = 30;
export const MAP_ROWS = 20;

// Player
export const PLAYER_SPEED = 100;
export const PLAYER_SPRINT_SPEED = 160;
export const PLAYER_MAX_HEALTH = 6; // 3 hearts, each heart = 2 hp
export const PLAYER_INVULN_TIME = 1000; // ms
export const PLAYER_KNOCKBACK = 120;

// Combat
export const SWORD_DAMAGE = 1;
export const BLASTER_DAMAGE = 2;
export const BLASTER_COOLDOWN = 400;
export const BLASTER_MAX_AMMO = 30;
export const SHIELD_BLOCK_ARC = 90; // degrees

// Enemies
export const ENEMY_CHASE_RANGE = 100;
export const ENEMY_ATTACK_RANGE = 20;

// Currency
export const CURRENCY_NAME = 'Zlorps';

// Colors
export const COLORS = {
  BLACK: 0x000000,
  WHITE: 0xffffff,
  RED: 0xff0000,
  GREEN: 0x00ff00,
  BLUE: 0x0000ff,
  GOLD: 0xffd700,
  DARK_GREEN: 0x2d5a1e,
  BROWN: 0x8b5e3c,
  SKIN: 0xffcc99,
  PURPLE: 0x9b59b6,
  NEON_CYAN: 0x00ffff,
  NEON_PINK: 0xff00ff,
  NEON_GREEN: 0x39ff14,
  SEWER_GREEN: 0x4a7a2e,
  SWAMP: 0x556b2f,
  UI_BG: 0x1a1a2e,
  UI_BORDER: 0xe6c619,
  HEART_RED: 0xe74c3c,
  HEART_EMPTY: 0x555555,
};

// Dev mode - enabled via ?dev=1 query param
export const IS_DEV = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev');

// Scene keys
export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  TITLE: 'TitleScene',
  INTRO: 'IntroScene',
  VILLAGE: 'VillageScene',
  SHRINE: 'ShrineScene',
  FIELDS: 'FieldsScene',
  GATES: 'GatesScene',
  DIGITAL: 'DigitalRealmScene',
  SEWERS: 'MemeSewersScene',
  FORTRESS: 'FortressScene',
  FINALE: 'FinaleScene',
  UI: 'UIScene',
  INTERIOR: 'InteriorScene',
  GAMEOVER: 'GameOverScene',
} as const;
