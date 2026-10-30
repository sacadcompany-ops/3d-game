import { VehicleDefinition, CarId } from '../types/game';

export const VEHICLES: Record<CarId, VehicleDefinition> = {
  compact: {
    id: 'compact',
    name: 'Aura Pulse Hatch',
    category: 'Compact',
    price: 0,
    unlockLevel: 1,
    stats: {
      speed: 3,
      acceleration: 3.5,
      brake: 4,
      handling: 4,
      durability: 3,
      fuel: 4,
    },
    defaultColor: '#10b981', // green default
    description: 'Agile and responsive hatchback, ideal for tight parking spots and bustling city streets.',
    dimensions: { width: 1.8, height: 1.45, length: 3.8, wheelBase: 2.3 },
  },
  taxi: {
    id: 'taxi',
    name: 'Sahil Metro Taxi',
    category: 'Commercial',
    price: 4500,
    unlockLevel: 2,
    stats: {
      speed: 3.5,
      acceleration: 4,
      brake: 3.5,
      handling: 3.5,
      durability: 3.5,
      fuel: 4.5,
    },
    defaultColor: '#eab308', // taxi yellow
    description: 'Iconic city taxi built for nonstop service, quick acceleration, and passenger transport.',
    dimensions: { width: 1.85, height: 1.5, length: 4.3, wheelBase: 2.5 },
  },
  sedan: {
    id: 'sedan',
    name: 'Monarch Executive',
    category: 'Sedan',
    price: 9500,
    unlockLevel: 3,
    stats: {
      speed: 4,
      acceleration: 3.5,
      brake: 4,
      handling: 3.5,
      durability: 3.5,
      fuel: 3.5,
    },
    defaultColor: '#3b82f6', // royal blue
    description: 'Refined executive sedan offering steady highway cruising and balanced road grip.',
    dimensions: { width: 1.9, height: 1.42, length: 4.6, wheelBase: 2.7 },
  },
  suv: {
    id: 'suv',
    name: 'Atlas Trail 4x4',
    category: 'SUV',
    price: 18000,
    unlockLevel: 4,
    stats: {
      speed: 3.5,
      acceleration: 3,
      brake: 4.5,
      handling: 3,
      durability: 5,
      fuel: 3,
    },
    defaultColor: '#dc2626', // bold red
    description: 'Heavy rugged SUV built with high ground clearance, heavy-duty chassis, and superior crash resistance.',
    dimensions: { width: 2.05, height: 1.75, length: 4.7, wheelBase: 2.8 },
  },
  pickup: {
    id: 'pickup',
    name: 'Golis Titan Pickup',
    category: 'Truck',
    price: 25000,
    unlockLevel: 5,
    stats: {
      speed: 3.5,
      acceleration: 3.5,
      brake: 4,
      handling: 3,
      durability: 4.5,
      fuel: 3,
    },
    defaultColor: '#d97706', // amber orange
    description: 'Rugged utility pickup with high torque and high durability for cargo and city hauling.',
    dimensions: { width: 2.0, height: 1.8, length: 4.9, wheelBase: 3.0 },
  },
  van: {
    id: 'van',
    name: 'TransCity Express Van',
    category: 'Van',
    price: 32000,
    unlockLevel: 6,
    stats: {
      speed: 3,
      acceleration: 3,
      brake: 3.5,
      handling: 2.5,
      durability: 4.5,
      fuel: 3.5,
    },
    defaultColor: '#f8fafc', // clean white
    description: 'High capacity delivery van tested for long hauls and tight delivery missions.',
    dimensions: { width: 2.0, height: 2.0, length: 5.1, wheelBase: 3.1 },
  },
  sports: {
    id: 'sports',
    name: 'Apex GT Predator',
    category: 'Sports',
    price: 48000,
    unlockLevel: 8,
    stats: {
      speed: 5,
      acceleration: 4.8,
      brake: 4.5,
      handling: 4.5,
      durability: 2.5,
      fuel: 2.5,
    },
    defaultColor: '#ef4444', // crimson red
    description: 'Low-slung twin-turbo coupe designed for lightning sprints, high speed, and razor-sharp turns.',
    dimensions: { width: 1.95, height: 1.25, length: 4.5, wheelBase: 2.6 },
  },
  luxury: {
    id: 'luxury',
    name: 'Kallisto Phantom V12',
    category: 'Super Luxury',
    price: 75000,
    unlockLevel: 10,
    stats: {
      speed: 4.8,
      acceleration: 4.5,
      brake: 5,
      handling: 4.2,
      durability: 4.5,
      fuel: 3,
    },
    defaultColor: '#0f172a', // midnight obsidian
    description: 'Ultra-exclusive luxury flagship with bespoke sound dampening and effortless power.',
    dimensions: { width: 2.0, height: 1.4, length: 5.2, wheelBase: 3.2 },
  },
};

export const VEHICLE_LIST: VehicleDefinition[] = Object.values(VEHICLES);
