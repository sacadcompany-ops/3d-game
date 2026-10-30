import * as THREE from 'three';
import { CollisionObstacle } from './physics';

export interface TrafficVehicle {
  id: number;
  type: 'car' | 'bus' | 'van' | 'taxi';
  mesh: THREE.Group;
  x: number;
  z: number;
  rotationY: number;
  speed: number;
  targetSpeed: number;
  length: number;
  width: number;
  currentWaypointIdx: number;
  laneId: number;
  isBraking: boolean;
  taillights: THREE.Mesh[];
}

export interface Waypoint {
  x: number;
  z: number;
}

export class TrafficManager {
  public vehicles: TrafficVehicle[] = [];
  public trafficLightsState: 'green' | 'yellow' | 'red' = 'green';
  private lightTimer: number = 0;
  private lanes: Waypoint[][] = [];
  private scene: THREE.Scene;
  private isSoftwareGl: boolean;

  constructor(scene: THREE.Scene, isSoftwareGl: boolean = false) {
    this.scene = scene;
    this.isSoftwareGl = isSoftwareGl;
    this.initLanes();
  }

  private initLanes() {
    // Multi-lane closed circuit loops around the city grid
    // Lane 1: Main North-South Avenue Right Lane (heading North +Z)
    this.lanes.push([
      { x: 5, z: -180 },
      { x: 5, z: -80 },
      { x: 5, z: 20 },
      { x: 5, z: 120 },
      { x: 5, z: 180 },
      { x: 30, z: 190 },
      { x: 80, z: 160 },
      { x: 80, z: -150 },
      { x: 30, z: -190 },
    ]);

    // Lane 2: Main North-South Avenue Left Lane (heading South -Z)
    this.lanes.push([
      { x: -5, z: 180 },
      { x: -5, z: 100 },
      { x: -5, z: 0 },
      { x: -5, z: -100 },
      { x: -5, z: -180 },
      { x: -35, z: -190 },
      { x: -85, z: -140 },
      { x: -85, z: 150 },
      { x: -35, z: 190 },
    ]);

    // Lane 3: East-West Cross Boulevard Eastbound (+X)
    this.lanes.push([
      { x: -160, z: -40 },
      { x: -60, z: -40 },
      { x: 0, z: -40 },
      { x: 60, z: -40 },
      { x: 160, z: -40 },
      { x: 170, z: -20 },
      { x: 150, z: 30 },
      { x: -150, z: 30 },
    ]);

    // Lane 4: East-West Cross Boulevard Westbound (-X)
    this.lanes.push([
      { x: 160, z: 40 },
      { x: 60, z: 40 },
      { x: 0, z: 40 },
      { x: -60, z: 40 },
      { x: -160, z: 40 },
      { x: -170, z: 10 },
      { x: -150, z: -30 },
      { x: 150, z: -30 },
    ]);
  }

  public populate(density: 'low' | 'medium' | 'high') {
    // Clear existing
    this.clear();

    const count = density === 'low' ? 6 : density === 'medium' ? 12 : 20;
    const types: Array<'car' | 'bus' | 'van' | 'taxi'> = ['car', 'bus', 'van', 'taxi', 'car'];

    for (let i = 0; i < count; i++) {
      const laneIdx = i % this.lanes.length;
      const lane = this.lanes[laneIdx];
      const startWpIdx = Math.floor((i / count) * lane.length);
      const wp = lane[startWpIdx];
      const nextWp = lane[(startWpIdx + 1) % lane.length];

      const type = types[i % types.length];
      const meshBundle = this.createTrafficVehicleMesh(type);

      const dx = nextWp.x - wp.x;
      const dz = nextWp.z - wp.z;
      const heading = Math.atan2(dx, dz);

      meshBundle.group.position.set(wp.x, 0, wp.z);
      meshBundle.group.rotation.y = heading;
      this.scene.add(meshBundle.group);

      this.vehicles.push({
        id: i + 1,
        type,
        mesh: meshBundle.group,
        x: wp.x,
        z: wp.z,
        rotationY: heading,
        speed: 8 + Math.random() * 4,
        targetSpeed: type === 'bus' ? 9 : 13,
        length: type === 'bus' ? 8.5 : type === 'van' ? 5.2 : 4.4,
        width: type === 'bus' ? 2.6 : 2.0,
        currentWaypointIdx: (startWpIdx + 1) % lane.length,
        laneId: laneIdx,
        isBraking: false,
        taillights: meshBundle.taillights,
      });
    }
  }

  private createTrafficVehicleMesh(type: 'car' | 'bus' | 'van' | 'taxi'): { group: THREE.Group; taillights: THREE.Mesh[] } {
    const group = new THREE.Group();
    const taillights: THREE.Mesh[] = [];

    const isBus = type === 'bus';
    const isVan = type === 'van';
    const isTaxi = type === 'taxi';

    const w = isBus ? 2.6 : 2.0;
    const h = isBus ? 3.0 : isVan ? 2.3 : 1.45;
    const l = isBus ? 8.5 : isVan ? 5.2 : 4.4;

    const colors = isTaxi
      ? ['#eab308']
      : isBus
      ? ['#f8fafc'] // White city bus with red stripe
      : ['#3b82f6', '#ef4444', '#10b981', '#64748b', '#0f172a', '#f59e0b'];

    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    const bodyMat = new THREE.MeshStandardMaterial({
      color: chosenColor,
      roughness: 0.35,
      metalness: 0.4,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.1,
      metalness: 0.3,
    });

    // Main Box Hull
    const hullGeo = new THREE.BoxGeometry(w, h * 0.75, l);
    const hull = new THREE.Mesh(hullGeo, bodyMat);
    hull.position.y = h * 0.5;
    group.add(hull);

    if (isBus) {
      // Red Stripe along bus sides
      const stripeGeo = new THREE.BoxGeometry(w + 0.02, 0.4, l);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = h * 0.45;
      group.add(stripe);
    }

    // Windows
    const winGeo = new THREE.BoxGeometry(w * 0.95, h * 0.35, l * 0.75);
    const win = new THREE.Mesh(winGeo, glassMat);
    win.position.y = h * 0.7;
    group.add(win);

    // Headlights
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 });
    const hlGeo = new THREE.BoxGeometry(w * 0.25, 0.2, 0.1);
    const hl1 = new THREE.Mesh(hlGeo, hlMat);
    hl1.position.set(-w * 0.35, h * 0.35, l * 0.5 + 0.05);
    const hl2 = new THREE.Mesh(hlGeo, hlMat);
    hl2.position.set(w * 0.35, h * 0.35, l * 0.5 + 0.05);
    group.add(hl1, hl2);

    // Taillights
    const tlMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.8 });
    const tlGeo = new THREE.BoxGeometry(w * 0.25, 0.2, 0.1);
    const tl1 = new THREE.Mesh(tlGeo, tlMat);
    tl1.position.set(-w * 0.35, h * 0.35, -l * 0.5 - 0.05);
    const tl2 = new THREE.Mesh(tlGeo, tlMat);
    tl2.position.set(w * 0.35, h * 0.35, -l * 0.5 - 0.05);
    group.add(tl1, tl2);
    taillights.push(tl1, tl2);

    // Wheels (4 cylinders)
    const tireMat = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.9 });
    const wheelRadius = isBus ? 0.45 : 0.32;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.25, 12);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelOffsetZ = l * 0.32;
    const wheelPositions = [
      { x: -w * 0.5, z: wheelOffsetZ },
      { x: w * 0.5, z: wheelOffsetZ },
      { x: -w * 0.5, z: -wheelOffsetZ },
      { x: w * 0.5, z: -wheelOffsetZ },
    ];

    wheelPositions.forEach((pos) => {
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.position.set(pos.x, wheelRadius, pos.z);
      group.add(tire);
    });

    return { group, taillights };
  }

  public update(dt: number, playerCarPos: { x: number; z: number; speed: number }) {
    // 1. Cycle traffic lights (Green 18s -> Yellow 4s -> Red 12s)
    this.lightTimer += dt;
    if (this.lightTimer > 34) {
      this.lightTimer = 0;
    }

    if (this.lightTimer < 18) {
      this.trafficLightsState = 'green';
    } else if (this.lightTimer < 22) {
      this.trafficLightsState = 'yellow';
    } else {
      this.trafficLightsState = 'red';
    }

    // 2. Update each traffic vehicle
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const lane = this.lanes[v.laneId];
      if (!lane || lane.length === 0) continue;

      const targetWp = lane[v.currentWaypointIdx];
      const dx = targetWp.x - v.x;
      const dz = targetWp.z - v.z;
      const distToWp = Math.hypot(dx, dz);

      // Advance waypoint if close
      if (distToWp < 5.0) {
        v.currentWaypointIdx = (v.currentWaypointIdx + 1) % lane.length;
      }

      // Smooth steering toward waypoint
      const targetHeading = Math.atan2(dx, dz);
      let angleDiff = targetHeading - v.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      v.rotationY += angleDiff * 3.5 * dt;

      // Check for obstacles ahead (player or another traffic vehicle)
      let shouldBrake = false;

      // Traffic light check near intersection (Z around 0 on main avenue)
      if (this.trafficLightsState === 'red') {
        if (Math.abs(v.x) < 15 && Math.abs(v.z) < 25 && Math.abs(v.z) > 10) {
          shouldBrake = true;
        }
      }

      // Player car distance check
      const distToPlayer = Math.hypot(playerCarPos.x - v.x, playerCarPos.z - v.z);
      if (distToPlayer < 14) {
        const toPlayerX = playerCarPos.x - v.x;
        const toPlayerZ = playerCarPos.z - v.z;
        const forwardX = Math.sin(v.rotationY);
        const forwardZ = Math.cos(v.rotationY);
        const dot = (toPlayerX * forwardX + toPlayerZ * forwardZ) / distToPlayer;
        if (dot > 0.6) {
          // Player is directly ahead!
          shouldBrake = true;
        }
      }

      // Check other traffic vehicles ahead in same lane
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        const distToOther = Math.hypot(other.x - v.x, other.z - v.z);
        if (distToOther < 12) {
          const toOtherX = other.x - v.x;
          const toOtherZ = other.z - v.z;
          const forwardX = Math.sin(v.rotationY);
          const forwardZ = Math.cos(v.rotationY);
          const dot = (toOtherX * forwardX + toOtherZ * forwardZ) / distToOther;
          if (dot > 0.65) {
            shouldBrake = true;
            break;
          }
        }
      }

      // Speed adjustment
      if (shouldBrake) {
        v.speed = Math.max(0, v.speed - 15 * dt);
        v.isBraking = true;
      } else {
        v.speed = Math.min(v.targetSpeed, v.speed + 6 * dt);
        v.isBraking = false;
      }

      // Visual taillight brake glow
      v.taillights.forEach((tl) => {
        (tl.material as THREE.MeshStandardMaterial).emissiveIntensity = v.isBraking ? 2.5 : 0.8;
      });

      // Move vehicle
      v.x += Math.sin(v.rotationY) * v.speed * dt;
      v.z += Math.cos(v.rotationY) * v.speed * dt;

      v.mesh.position.set(v.x, 0, v.z);
      v.mesh.rotation.y = v.rotationY;
    }
  }

  public getObstacles(): CollisionObstacle[] {
    return this.vehicles.map((v) => ({
      x: v.x,
      z: v.z,
      radius: v.length * 0.45,
      type: 'traffic',
    }));
  }

  public clear() {
    this.vehicles.forEach((v) => {
      this.scene.remove(v.mesh);
    });
    this.vehicles = [];
  }
}
