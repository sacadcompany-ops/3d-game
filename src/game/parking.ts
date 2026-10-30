import * as THREE from 'three';
import { ParkingSlot, ParkingRating, MissionResult } from '../types/game';

export interface ParkingEvaluation {
  isInZone: boolean;
  distanceToCenter: number;
  angleOffsetDeg: number;
  accuracyPercent: number; // 0 - 100
  rating: ParkingRating;
  isVehicleStopped: boolean;
  holdTimeRemaining: number; // in seconds, counts down from 2.0 to 0
  isCompleted: boolean;
}

export class ParkingEvaluator {
  private slot: ParkingSlot | null = null;
  private holdTimer: number = 2.0;
  private readonly requiredHoldDuration: number = 2.0;

  public setSlot(slot?: ParkingSlot) {
    this.slot = slot || null;
    this.holdTimer = this.requiredHoldDuration;
  }

  public evaluate(
    carPos: { x: number; z: number; rotationY: number; speed: number },
    dt: number
  ): ParkingEvaluation {
    if (!this.slot) {
      return {
        isInZone: false,
        distanceToCenter: 999,
        angleOffsetDeg: 180,
        accuracyPercent: 0,
        rating: 'FAILED',
        isVehicleStopped: false,
        holdTimeRemaining: 2.0,
        isCompleted: false,
      };
    }

    const dx = carPos.x - this.slot.x;
    const dz = carPos.z - this.slot.z;
    const distanceToCenter = Math.hypot(dx, dz);

    // Bounding box containment check in slot local space
    const cosSlot = Math.cos(-this.slot.rotationY);
    const sinSlot = Math.sin(-this.slot.rotationY);
    const localX = dx * cosSlot - dz * sinSlot;
    const localZ = dx * sinSlot + dz * cosSlot;

    const halfW = this.slot.width * 0.6;
    const halfL = this.slot.length * 0.6;

    const isInZone = Math.abs(localX) <= halfW && Math.abs(localZ) <= halfL;

    // Angle offset
    let angleDiff = carPos.rotationY - this.slot.rotationY;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // If reverse parking, player should match target rotation within ~30 deg
    const angleOffsetDeg = Math.abs((angleDiff * 180) / Math.PI);

    // Accuracy calculation
    const posScore = Math.max(0, 100 - (distanceToCenter / 2.5) * 50);
    const angleScore = Math.max(0, 100 - (angleOffsetDeg / 30) * 50);
    const accuracyPercent = Math.round(Math.min(100, Math.max(0, (posScore + angleScore) / 2)));

    // Rating
    let rating: ParkingRating = 'FAILED';
    if (isInZone && angleOffsetDeg <= 12 && distanceToCenter < 0.8) {
      rating = 'PERFECT';
    } else if (isInZone && angleOffsetDeg <= 20 && distanceToCenter < 1.4) {
      rating = 'GREAT';
    } else if (isInZone && angleOffsetDeg <= 32 && distanceToCenter < 2.0) {
      rating = 'GOOD';
    } else if (isInZone && distanceToCenter < 2.8) {
      rating = 'PASS';
    }

    const isVehicleStopped = Math.abs(carPos.speed) < 0.4;
    let isCompleted = false;

    if (isInZone && isVehicleStopped && rating !== 'FAILED') {
      this.holdTimer = Math.max(0, this.holdTimer - dt);
      if (this.holdTimer <= 0) {
        isCompleted = true;
      }
    } else {
      // Reset hold timer if car moves or leaves zone
      this.holdTimer = this.requiredHoldDuration;
    }

    return {
      isInZone,
      distanceToCenter,
      angleOffsetDeg,
      accuracyPercent,
      rating,
      isVehicleStopped,
      holdTimeRemaining: Math.max(0, this.holdTimer),
      isCompleted,
    };
  }

  public reset() {
    this.holdTimer = this.requiredHoldDuration;
  }
}

export function createParkingSlotMesh(slot: ParkingSlot): THREE.Group {
  const group = new THREE.Group();
  group.position.set(slot.x, 0.03, slot.z);
  group.rotation.y = slot.rotationY;

  const w = slot.width;
  const l = slot.length;

  // Luminous outline box
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e, // bright neon green
    transparent: true,
    opacity: 0.9,
  });

  const borderThickness = 0.16;

  // Left & Right boundary lines
  const sideGeo = new THREE.PlaneGeometry(borderThickness, l);
  sideGeo.rotateX(-Math.PI / 2);

  const leftLine = new THREE.Mesh(sideGeo, lineMat);
  leftLine.position.set(-w / 2, 0, 0);

  const rightLine = new THREE.Mesh(sideGeo, lineMat);
  rightLine.position.set(w / 2, 0, 0);

  // Back boundary stopper line
  const backGeo = new THREE.PlaneGeometry(w, borderThickness);
  backGeo.rotateX(-Math.PI / 2);
  const backLine = new THREE.Mesh(backGeo, lineMat);
  backLine.position.set(0, 0, -l / 2);

  // Wheel bumper curb stop
  const stopperMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.4 });
  const stopperGeo = new THREE.BoxGeometry(w * 0.7, 0.15, 0.25);
  const stopper = new THREE.Mesh(stopperGeo, stopperMat);
  stopper.position.set(0, 0.08, -l / 2 + 0.5);

  // Ground glowing chevron arrows & "P" decal
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
  ctx.fillRect(0, 0, 256, 512);

  // Big Parking "P"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 96px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('P', 128, 220);

  // Direction chevron arrow pointing forward
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(128, 280);
  ctx.lineTo(190, 370);
  ctx.lineTo(150, 370);
  ctx.lineTo(150, 440);
  ctx.lineTo(106, 440);
  ctx.lineTo(106, 370);
  ctx.lineTo(66, 370);
  ctx.closePath();
  ctx.fill();

  const bayTexture = new THREE.CanvasTexture(canvas);
  bayTexture.colorSpace = THREE.SRGBColorSpace;

  const floorDecalGeo = new THREE.PlaneGeometry(w * 0.9, l * 0.9);
  floorDecalGeo.rotateX(-Math.PI / 2);
  const floorDecalMat = new THREE.MeshBasicMaterial({
    map: bayTexture,
    transparent: true,
    opacity: 0.85,
  });
  const floorDecal = new THREE.Mesh(floorDecalGeo, floorDecalMat);

  group.add(leftLine, rightLine, backLine, stopper, floorDecal);
  return group;
}
