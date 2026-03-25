// Save/Load system using LocalStorage

export interface SaveData {
  currentScene: string;
  playerHealth: number;
  maxHealth: number;
  zlorps: number;
  ammo: number;
  inventory: string[];
  questFlags: Record<string, boolean>;
  hasLegendSword: boolean;
  hasShield: boolean;
  hasBlaster: boolean;
  checkpointX: number;
  checkpointY: number;
  playTime: number; // seconds
}

const SAVE_KEY = 'zeldor_save';

export function getDefaultSave(): SaveData {
  return {
    currentScene: 'VillageScene',
    playerHealth: 6,
    maxHealth: 6,
    zlorps: 0,
    ammo: 0,
    inventory: [],
    questFlags: {},
    hasLegendSword: false,
    hasShield: false,
    hasBlaster: false,
    checkpointX: 240,
    checkpointY: 200,
    playTime: 0,
  };
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch (e) {
    console.warn('Failed to load save:', e);
    return null;
  }
}

export function hasSaveData(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
