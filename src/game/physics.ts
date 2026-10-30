import * as THREE from 'three';
import { CarId, CarUpgrades, CarStats } from '../types/game';
import { VEHICLES } from '../constants/vehicles';
import { soundManager } from '../utils/audio';

export interface CarPhysicsState {
  x: number;
  y: number;
  z: number;
  rotationY: number; // heading angle in radians
  speed: number;     // in m/s (positive = forward, negative = reverse)
  steeringAngle: number; // in radians
  pitch: number;     // suspension pitch (dive / squat)
  roll: number;      // suspension roll (body lean)
  condition: number; // 0 - 100%
  fuel: number;      // 0 - 100%
  gear: 'P' | 'R' | 'N' | 'D';
  isDrifting: boolean;
  totalDistanceTraveled: number;
}

export interface CollisionObstacle {
  x: number;
  z: number;
  radius: number;
  type: 'building' | 'barrier' | 'traffic' | 'curb';
}

export class VehiclePhysics {
  public state: CarPhysicsState;
  private def: typeof VEHICLES['compact'];
  private upgrades: CarUpgrades;

  // Multipliers derived from upgrades
  private maxSpeedForward: number = 28; // ~63 MPH default
  private maxSpeedReverse: number = -9;  // ~20 MPH reverse
  private accelerationRate: number = 14;
  private brakeRate: number = 24;
  private reverseAccelRate: number = 9;
  private dragCoefficient: number = 1.2;
  private maxSteerAngle: number = 0.55; // radians (~31 degrees)
  private steerSpeed: number = 2.4;
  private autoCenterSpeed: number = 4.0;
  private damageMultiplier: number = 1.0;
  private fuelBurnRate: number = 0.035;

  private lastCollisionTime: number = 0;

  constructor(
    carId: CarId,
    initialPos: { x: number; z: number; rotationY: number },
    upgrades: CarUpgrades,
    initialCondition: number = 100,
    initialFuel: number = 100
  ) {
    this.def = VEHICLES[carId] || VEHICLES.compact;
    this.upgrades = upgrades;

    this.state = {
      x: initialPos.x,
      y: 0,
      z: initialPos.z,
      rotationY: initialPos.rotationY,
      speed: 0,
      steeringAngle: 0,
      pitch: 0,
      roll: 0,
      condition: Math.max(0, Math.min(100, initialCondition)),
      fuel: Math.max(0, Math.min(100, initialFuel)),
      gear: 'D',
      isDrifting: false,
      totalDistanceTraveled: 0,
    };

    this.applyUpgrades();
  }

  private applyUpgrades() {
    const s = this.def.stats;
    const engLvl = this.upgrades.engine;
    const transLvl = this.upgrades.transmission;
    const brakeLvl = this.upgrades.brakes;
    const tireLvl = this.upgrades.tires;
    const duraLvl = this.upgrades.durability;
    const fuelLvl = this.upgrades.fuelSystem;

    // Speeds in m/s (1 m/s = 2.23694 MPH)
    // 30 m/s is ~67 MPH, 45 m/s is ~100 MPH
    this.maxSpeedForward = (18 + s.speed * 3.5 + engLvl * 1.8 + transLvl * 1.4);
    this.accelerationRate = (9 + s.acceleration * 2.2 + engLvl * 1.5 + transLvl * 1.0);
    this.brakeRate = (16 + s.brake * 3.0 + brakeLvl * 2.5);
    this.steerSpeed = (2.0 + s.handling * 0.4 + tireLvl * 0.3);
    this.damageMultiplier = Math.max(0.35, 1.0 - (s.durability * 0.06 + duraLvl * 0.08));
    this.fuelBurnRate = Math.max(0.015, 0.04 - (fuelLvl * 0.005));
  }

  public update(
    dt: number,
    inputs: { throttle: number; brake: number; steer: number; handbrake?: boolean },
    obstacles: CollisionObstacle[] = []
  ): { collisionDetected: boolean; collisionIntensity?: 'small' | 'medium' | 'heavy' } {
    // Clamp delta time to avoid physics tunneling
    const clampedDt = Math.min(dt, 0.05);

    // 1. Steering input & auto-centering
    if (Math.abs(inputs.steer) > 0.01) {
      this.state.steeringAngle += inputs.steer * this.steerSpeed * clampedDt;
      this.state.steeringAngle = Math.max(-this.maxSteerAngle, Math.min(this.maxSteerAngle, this.state.steeringAngle));
    } else {
      // Auto-center steering wheel when no steer input
      if (this.state.steeringAngle > 0) {
        this.state.steeringAngle = Math.max(0, this.state.steeringAngle - this.autoCenterSpeed * clampedDt);
      } else if (this.state.steeringAngle < 0) {
        this.state.steeringAngle = Math.min(0, this.state.steeringAngle + this.autoCenterSpeed * clampedDt);
      }
    }

    // 2. Throttle & Braking logic
    let targetPitch = 0;
    const hasFuel = this.state.fuel > 0;

    if (inputs.throttle > 0 && hasFuel) {
      // Accelerate forward or brake if reversing
      if (this.state.speed < 0) {
        this.state.speed += this.brakeRate * clampedDt * inputs.throttle;
      } else {
        this.state.speed += this.accelerationRate * inputs.throttle * clampedDt;
        if (this.state.speed > this.maxSpeedForward) {
          this.state.speed = this.maxSpeedForward;
        }
        targetPitch = -0.04 * inputs.throttle; // squat back
      }
      this.state.gear = 'D';
      this.state.fuel = Math.max(0, this.state.fuel - this.fuelBurnRate * inputs.throttle * clampedDt);
    } else if (inputs.brake > 0) {
      if (this.state.speed > 0.5) {
        // Normal braking forward
        this.state.speed -= this.brakeRate * inputs.brake * clampedDt;
        targetPitch = 0.06 * inputs.brake; // dive nose
        if (this.state.speed > 12 && inputs.brake > 0.7) {
          soundManager.playBrakeSqueal();
        }
        this.state.gear = 'D';
      } else {
        // Reverse gear when stopped or moving very slow backwards
        this.state.speed -= this.reverseAccelRate * inputs.brake * clampedDt;
        if (this.state.speed < this.maxSpeedReverse) {
          this.state.speed = this.maxSpeedReverse;
        }
        this.state.gear = 'R';
      }
    } else {
      // Natural rolling friction & aerodynamic drag
      if (Math.abs(this.state.speed) < 0.2) {
        this.state.speed = 0;
        this.state.gear = 'P';
      } else {
        const drag = this.dragCoefficient * Math.sign(this.state.speed) * clampedDt * 3.5;
        this.state.speed -= drag;
      }
    }

    // 3. Turning Physics (Ackermann kinematic model)
    const turnSensitivity = Math.min(1.0, Math.abs(this.state.speed) / 4.0);
    const effectiveSteer = this.state.steeringAngle * turnSensitivity;
    const angularVelocity = (this.state.speed / (this.def.dimensions.wheelBase || 2.6)) * Math.sin(effectiveSteer);

    this.state.rotationY += angularVelocity * clampedDt;

    // Detect drift / skid on sharp turns at high speed
    const lateralG = Math.abs(this.state.speed * angularVelocity);
    if (lateralG > 8.0 && Math.abs(this.state.speed) > 10) {
      if (!this.state.isDrifting) {
        soundManager.playTireSkid();
        this.state.isDrifting = true;
      }
    } else {
      this.state.isDrifting = false;
    }

    // 4. Position update
    const forwardX = Math.sin(this.state.rotationY);
    const forwardZ = Math.cos(this.state.rotationY);

    const prevX = this.state.x;
    const prevZ = this.state.z;

    this.state.x += forwardX * this.state.speed * clampedDt;
    this.state.z += forwardZ * this.state.speed * clampedDt;

    const frameDistance = Math.hypot(this.state.x - prevX, this.state.z - prevZ);
    this.state.totalDistanceTraveled += frameDistance;

    // 5. Suspension pitch & roll smoothing
    const targetRoll = -angularVelocity * 0.18; // body lean outward
    this.state.pitch += (targetPitch - this.state.pitch) * 8 * clampedDt;
    this.state.roll += (targetRoll - this.state.roll) * 8 * clampedDt;

    // 6. Collision detection & damage
    let collisionDetected = false;
    let collisionIntensity: 'small' | 'medium' | 'heavy' | undefined;

    const carRadius = Math.max(this.def.dimensions.width, this.def.dimensions.length) * 0.45;
    const now = performance.now();

    for (const obs of obstacles) {
      const dx = this.state.x - obs.x;
      const dz = this.state.z - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = carRadius + obs.radius;

      if (dist < minDist) {
        // We have a collision!
        collisionDetected = true;
        const speedMagnitude = Math.abs(this.state.speed);

        // Intensity based on impact speed
        if (speedMagnitude > 16) {
          collisionIntensity = 'heavy';
        } else if (speedMagnitude > 7) {
          collisionIntensity = 'medium';
        } else {
          collisionIntensity = 'small';
        }

        // Damage calculation
        let rawDamage = collisionIntensity === 'heavy' ? 10 : collisionIntensity === 'medium' ? 5 : 2;
        const actualDamage = Math.round(rawDamage * this.damageMultiplier);
        this.state.condition = Math.max(0, this.state.condition - actualDamage);

        // Sound & physical recoil
        if (now - this.lastCollisionTime > 400) {
          soundManager.playCollisionSound(collisionIntensity);
          this.lastCollisionTime = now;
        }

        // Push car back out of obstacle along normal
        const overlap = minDist - dist;
        const nx = dx / (dist || 1);
        const nz = dz / (dist || 1);
        this.state.x += nx * (overlap + 0.1);
        this.state.z += nz * (overlap + 0.1);

        // Rebound speed
        this.state.speed = -this.state.speed * 0.35;
        break;
      }
    }

    return { collisionDetected, collisionIntensity };
  }

  public getSpeedMph(): number {
    // 1 m/s = 2.23694 MPH
    return Math.abs(Math.round(this.state.speed * 2.23694));
  }

  public getSpeedRatio(): number {
    return Math.min(1.0, Math.abs(this.state.speed) / this.maxSpeedForward);
  }

  public refuel(amount: number = 100) {
    this.state.fuel = Math.min(100, this.state.fuel + amount);
    soundManager.playRefuel();
  }

  public repair() {
    this.state.condition = 100;
  }
}
