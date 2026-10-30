import { PlayerSaveData, CarId, CarUpgrades, CarCustomization } from '../types/game';

const STORAGE_KEY = 'URBAN_DRIVE_3D_SAVE_DATA_V1';

export const DEFAULT_UPGRADES: CarUpgrades = {
  engine: 1,
  transmission: 1,
  brakes: 1,
  tires: 1,
  durability: 1,
  fuelSystem: 1,
};

export const DEFAULT_CUSTOMIZATION: Record<CarId, CarCustomization> = {
  compact: { color: '#10b981', spoiler: 'none', rims: 'stock', windowTint: 'smoke', headlights: 'white', hasLivery: false },
  taxi: { color: '#eab308', spoiler: 'none', rims: 'stock', windowTint: 'clear', headlights: 'amber', hasLivery: false },
  sedan: { color: '#3b82f6', spoiler: 'lip', rims: 'sport', windowTint: 'smoke', headlights: 'cyan', hasLivery: false },
  suv: { color: '#dc2626', spoiler: 'none', rims: 'star', windowTint: 'dark', headlights: 'white', hasLivery: false },
  pickup: { color: '#d97706', spoiler: 'none', rims: 'blackout', windowTint: 'smoke', headlights: 'halogen', hasLivery: false },
  van: { color: '#f8fafc', spoiler: 'none', rims: 'stock', windowTint: 'clear', headlights: 'white', hasLivery: false },
  sports: { color: '#ef4444', spoiler: 'gt', rims: 'sport', windowTint: 'mirror', headlights: 'cyan', hasLivery: false },
  luxury: { color: '#0f172a', spoiler: 'lip', rims: 'blackout', windowTint: 'dark', headlights: 'white', hasLivery: false },
};

export const DEFAULT_SAVE_DATA: PlayerSaveData = {
  coins: 2450, // Matches initial reference screenshot currency
  gems: 25,
  level: 1,
  xp: 0,
  currentCarId: 'compact',
  ownedCarIds: ['compact'],
  carUpgrades: {
    compact: { ...DEFAULT_UPGRADES },
    taxi: { ...DEFAULT_UPGRADES },
    sedan: { ...DEFAULT_UPGRADES },
    suv: { ...DEFAULT_UPGRADES },
    pickup: { ...DEFAULT_UPGRADES },
    van: { ...DEFAULT_UPGRADES },
    sports: { ...DEFAULT_UPGRADES },
    luxury: { ...DEFAULT_UPGRADES },
  },
  carCustomizations: { ...DEFAULT_CUSTOMIZATION },
  carConditions: {
    compact: 100,
    taxi: 100,
    sedan: 100,
    suv: 100,
    pickup: 100,
    van: 100,
    sports: 100,
    luxury: 100,
  },
  carFuels: {
    compact: 100,
    taxi: 100,
    sedan: 100,
    suv: 100,
    pickup: 100,
    van: 100,
    sports: 100,
    luxury: 100,
  },
  completedMissions: {},
  settings: {
    language: 'en',
    controlMode: 'wheel',
    graphicsQuality: 'high',
    targetFps: 60,
    masterVolume: 0.8,
    sfxVolume: 0.8,
    engineVolume: 0.8,
    musicVolume: 0.6,
    cameraFov: 60,
    trafficDensity: 'medium',
    steeringSensitivity: 1.0,
    showWrongWayWarning: true,
  },
};

export function loadSaveData(): PlayerSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE_DATA };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      settings: { ...DEFAULT_SAVE_DATA.settings, ...(parsed.settings || {}) },
      carUpgrades: { ...DEFAULT_SAVE_DATA.carUpgrades, ...(parsed.carUpgrades || {}) },
      carCustomizations: { ...DEFAULT_SAVE_DATA.carCustomizations, ...(parsed.carCustomizations || {}) },
      carConditions: { ...DEFAULT_SAVE_DATA.carConditions, ...(parsed.carConditions || {}) },
      carFuels: { ...DEFAULT_SAVE_DATA.carFuels, ...(parsed.carFuels || {}) },
    };
  } catch {
    return { ...DEFAULT_SAVE_DATA };
  }
}

export function saveGameData(data: PlayerSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // LocalStorage full or private browsing
  }
}

export function getXpRequiredForLevel(level: number): number {
  return level * 150 + Math.pow(level, 1.8) * 80;
}

export function calculateRepairCost(condition: number): number {
  if (condition >= 100) return 0;
  const missing = 100 - condition;
  return Math.ceil(missing * 0.85); // e.g. 72% condition missing 28% -> ~24 coins
}
