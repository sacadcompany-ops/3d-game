export type Language = 'en' | 'so' | 'ar';

export type CarId = 'compact' | 'sedan' | 'suv' | 'sports' | 'taxi' | 'pickup' | 'van' | 'luxury';

export interface CarStats {
  speed: number;       // 1 - 5
  acceleration: number;// 1 - 5
  brake: number;       // 1 - 5
  handling: number;    // 1 - 5
  durability: number;  // 1 - 5
  fuel: number;        // 1 - 5
}

export interface CarUpgrades {
  engine: number;       // 1 - 5
  transmission: number; // 1 - 5
  brakes: number;       // 1 - 5
  tires: number;        // 1 - 5
  durability: number;   // 1 - 5
  fuelSystem: number;   // 1 - 5
}

export interface CarCustomization {
  color: string;
  hasLivery?: boolean;
  spoiler: 'none' | 'sport' | 'gt' | 'lip';
  rims: 'stock' | 'sport' | 'star' | 'blackout';
  windowTint: 'clear' | 'smoke' | 'dark' | 'mirror';
  headlights: 'white' | 'halogen' | 'amber' | 'cyan';
}

export interface VehicleDefinition {
  id: CarId;
  name: string;
  category: string;
  price: number;
  unlockLevel: number;
  stats: CarStats;
  defaultColor: string;
  description: string;
  dimensions: { width: number; height: number; length: number; wheelBase: number };
}

export type MissionType =
  | 'speed_parking'
  | 'normal_parking'
  | 'traffic_driving'
  | 'checkpoint_race'
  | 'time_challenge'
  | 'delivery'
  | 'taxi'
  | 'emergency'
  | 'precision_driving'
  | 'reverse_parking'
  | 'parallel_parking'
  | 'free_drive';

export type ParkingRating = 'PERFECT' | 'GREAT' | 'GOOD' | 'PASS' | 'FAILED';

export interface ParkingSlot {
  x: number;
  z: number;
  rotationY: number; // in radians
  width: number;
  length: number;
  type: 'straight' | 'reverse' | 'parallel' | 'angle';
  name: string;
}

export interface MissionDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  type: MissionType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeLimit: number; // in seconds
  rewardCoins: number;
  rewardXp: number;
  damageLimit: number; // e.g. 30% max damage
  parkingSlot?: ParkingSlot;
  checkpoints?: Array<{ x: number; z: number; radius: number }>;
  spawnPos: { x: number; z: number; rotationY: number };
  trafficDensity: 'low' | 'medium' | 'high';
  weatherTime?: 'day' | 'sunset' | 'night' | 'rain';
}

export interface MissionResult {
  completed: boolean;
  stars: number; // 0 to 5
  timeTaken: number;
  damageTaken: number;
  parkingAccuracy: number; // 0 - 100%
  parkingRating: ParkingRating;
  coinsEarned: number;
  xpEarned: number;
  failureReason?: string;
}

export type ControlMode = 'wheel' | 'buttons' | 'tilt' | 'keyboard';
export type CameraMode = 'chase' | 'cockpit' | 'top' | 'cinematic';
export type WeatherTime = 'day' | 'sunset' | 'night' | 'rain';
export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface GameSettings {
  language: Language;
  controlMode: ControlMode;
  graphicsQuality: GraphicsQuality;
  targetFps: 30 | 60;
  masterVolume: number; // 0 - 1
  sfxVolume: number;
  engineVolume: number;
  musicVolume: number;
  cameraFov: number;
  trafficDensity: 'low' | 'medium' | 'high';
  steeringSensitivity: number;
  showWrongWayWarning: boolean;
}

export interface PlayerSaveData {
  coins: number;
  gems: number;
  level: number;
  xp: number;
  currentCarId: CarId;
  ownedCarIds: CarId[];
  carUpgrades: Record<CarId, CarUpgrades>;
  carCustomizations: Record<CarId, CarCustomization>;
  carConditions: Record<CarId, number>; // 0 to 100 condition %
  carFuels: Record<CarId, number>; // 0 to 100 fuel %
  completedMissions: Record<string, { stars: number; bestTime: number }>;
  claimedAchievements?: string[];
  settings: GameSettings;
  lastDailyRewardDate?: string;
}

export type GameScreen = 'main_menu' | 'garage' | 'missions' | 'playing' | 'paused' | 'settings' | 'shop' | 'achievements';
