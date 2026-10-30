import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CarId,
  CarCustomization,
  CarUpgrades,
  CameraMode,
  WeatherTime,
  MissionDefinition,
  ParkingSlot,
} from '../types/game';
import {
  createProceduralVehicle,
  createAsphaltTexture,
  createSidewalkTexture,
  createBuildingFacadeTexture,
  createPalmTree,
  createStreetLamp,
  createOverheadGantry,
  createBillboardProp,
  createGasStation,
  VehicleMeshBundle,
} from './three-models';
import { VehiclePhysics, CollisionObstacle, CarPhysicsState } from './physics';
import { TrafficManager } from './traffic';
import { ParkingEvaluator, createParkingSlotMesh, ParkingEvaluation } from './parking';
import { soundManager } from '../utils/audio';

export interface GameEngineCallbacks {
  onSpeedChange?: (mph: number, ratio: number) => void;
  onFuelChange?: (fuel: number) => void;
  onConditionChange?: (condition: number) => void;
  onParkingUpdate?: (evaluation: ParkingEvaluation) => void;
  onNavUpdate?: (bearingDeg: number, distanceMeters: number, targetName: string) => void;
  onNearGasStation?: (isNear: boolean) => void;
  onWrongWay?: (isWrongWay: boolean) => void;
  onCollision?: (intensity: 'small' | 'medium' | 'heavy') => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean = false;
  private clock: THREE.Clock;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Player Vehicle
  public physics: VehiclePhysics | null = null;
  private playerCarMesh: VehicleMeshBundle | null = null;
  private currentCarId: CarId = 'compact';
  private currentCustomization: CarCustomization | null = null;
  private currentUpgrades: CarUpgrades | null = null;

  // Environment & Systems
  private trafficManager: TrafficManager;
  private parkingEvaluator: ParkingEvaluator;
  private activeParkingSlotMesh: THREE.Group | null = null;
  private checkpointMeshes: THREE.Mesh[] = [];
  private staticObstacles: CollisionObstacle[] = [];

  // Weather & Lights
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private currentWeather: WeatherTime = 'day';

  // Camera & Mode
  private cameraMode: CameraMode = 'chase';
  private isGarageMode: boolean = false;
  private garageTurntableAngle: number = 0;
  private garageManualRotation: number = 0;

  // Input state
  public inputState = {
    throttle: 0,
    brake: 0,
    steer: 0,
  };

  // Callbacks
  private callbacks: GameEngineCallbacks = {};

  // Active mission
  private currentMission: MissionDefinition | null = null;
  private currentCheckpointIdx: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Detect software WebGL guard
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 3, -6);

    // 4. Studio Reflection Environment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Ignored
    }

    // 5. Lighting rig
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 0.7);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.dirLight.position.set(45, 65, 35);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 180;
    const d = 50;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // 6. Subsystems
    this.trafficManager = new TrafficManager(this.scene, this.isSoftwareGl);
    this.parkingEvaluator = new ParkingEvaluator();

    // 7. Build City & Environment
    this.buildCity();
    this.setWeather('day');

    // 8. Event listeners
    window.addEventListener('resize', this.onResize);

    // 9. Start Loop
    this.tick();
  }

  private buildCity() {
    // Ground Plane with Asphalt Roads
    const roadTexture = createAsphaltTexture();
    roadTexture.repeat.set(1, 24);

    // Central Avenue (4 lanes, 20m wide, 400m long)
    const avenueGeo = new THREE.PlaneGeometry(24, 400);
    avenueGeo.rotateX(-Math.PI / 2);
    const avenueMat = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.75,
      metalness: 0.1,
    });
    const mainAvenue = new THREE.Mesh(avenueGeo, avenueMat);
    mainAvenue.receiveShadow = !this.isSoftwareGl;
    this.scene.add(mainAvenue);

    // Cross Boulevards (East-West)
    const crossRoadTex = createAsphaltTexture();
    crossRoadTex.repeat.set(1, 24);
    const crossGeo = new THREE.PlaneGeometry(24, 400);
    crossGeo.rotateX(-Math.PI / 2);
    crossGeo.rotateY(Math.PI / 2);
    const crossMat = new THREE.MeshStandardMaterial({
      map: crossRoadTex,
      roughness: 0.75,
      metalness: 0.1,
    });

    const cross1 = new THREE.Mesh(crossGeo, crossMat);
    cross1.position.set(0, 0.01, -40);
    cross1.receiveShadow = !this.isSoftwareGl;
    this.scene.add(cross1);

    const cross2 = new THREE.Mesh(crossGeo, crossMat);
    cross2.position.set(0, 0.01, 40);
    cross2.receiveShadow = !this.isSoftwareGl;
    this.scene.add(cross2);

    // Outer Ground Grass / Sandy City Base
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.05;
    ground.receiveShadow = !this.isSoftwareGl;
    this.scene.add(ground);

    // Sidewalks
    const sidewalkTex = createSidewalkTexture();
    sidewalkTex.repeat.set(2, 40);
    const sidewalkMat = new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.8 });

    // Left Sidewalk along main avenue
    const swLeft = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 400), sidewalkMat);
    swLeft.position.set(-15, 0.125, 0);
    this.scene.add(swLeft);

    // Right Sidewalk along main avenue
    const swRight = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 400), sidewalkMat);
    swRight.position.set(15, 0.125, 0);
    this.scene.add(swRight);

    // Palm Trees & Bushes along Sidewalks & Medians
    for (let z = -180; z <= 180; z += 35) {
      if (Math.abs(z - (-40)) < 15 || Math.abs(z - 40) < 15) continue; // Skip intersections

      // Left sidewalk trees
      const treeL = createPalmTree();
      treeL.position.set(-15, 0.25, z);
      this.scene.add(treeL);

      // Right sidewalk trees
      const treeR = createPalmTree();
      treeR.position.set(15, 0.25, z);
      this.scene.add(treeR);

      // Street Lamps
      const lampL = createStreetLamp();
      lampL.position.set(-13, 0.25, z + 12);
      this.scene.add(lampL);

      const lampR = createStreetLamp();
      lampR.position.set(13, 0.25, z + 12);
      lampR.rotation.y = Math.PI;
      this.scene.add(lampR);

      // Add as collision obstacle
      this.staticObstacles.push(
        { x: -15, z, radius: 1.2, type: 'curb' },
        { x: 15, z, radius: 1.2, type: 'curb' }
      );
    }

    // Overhead Gantry Highway Signs ("Hargeisa", "Berbera", "Borama")
    const gantry1 = createOverheadGantry();
    gantry1.position.set(0, 0, -10);
    this.scene.add(gantry1);

    const gantry2 = createOverheadGantry();
    gantry2.position.set(0, 0, 90);
    gantry2.rotation.y = Math.PI;
    this.scene.add(gantry2);

    // City Banners & Billboards
    const bb1 = createBillboardProp();
    bb1.position.set(-25, 0, -80);
    bb1.rotation.y = Math.PI / 8;
    this.scene.add(bb1);

    const bb2 = createBillboardProp();
    bb2.position.set(25, 0, 70);
    bb2.rotation.y = -Math.PI / 8;
    this.scene.add(bb2);

    // Gas Station
    const gasStation = createGasStation();
    gasStation.position.set(38, 0, -100);
    this.scene.add(gasStation);
    this.staticObstacles.push({ x: 38, z: -100, radius: 6.5, type: 'building' });

    // Skyscrapers & Commercial Blocks (Building Facades)
    const buildingHeights = [24, 42, 60, 32, 50, 75, 36, 45, 55, 38];
    for (let i = 0; i < 20; i++) {
      const isLeft = i % 2 === 0;
      const xPos = isLeft ? -45 - (i % 3) * 16 : 45 + (i % 3) * 16;
      const zPos = -180 + (i * 20);

      // Skip gas station spot
      if (!isLeft && Math.abs(zPos - (-100)) < 30) continue;

      const height = buildingHeights[i % buildingHeights.length];
      const width = 16 + (i % 4) * 4;
      const depth = 16 + (i % 3) * 4;

      const facadeTex = createBuildingFacadeTexture(i);
      facadeTex.repeat.set(1, Math.max(1, Math.floor(height / 20)));

      const buildingMat = new THREE.MeshStandardMaterial({
        map: facadeTex,
        roughness: 0.35,
        metalness: 0.5,
      });

      const buildingGeo = new THREE.BoxGeometry(width, height, depth);
      const buildingMesh = new THREE.Mesh(buildingGeo, buildingMat);
      buildingMesh.position.set(xPos, height / 2, zPos);
      buildingMesh.castShadow = !this.isSoftwareGl;
      buildingMesh.receiveShadow = !this.isSoftwareGl;
      this.scene.add(buildingMesh);

      this.staticObstacles.push({
        x: xPos,
        z: zPos,
        radius: Math.max(width, depth) * 0.55,
        type: 'building',
      });
    }

    // Distant Citadel Mountain backdrop
    const mountainGeo = new THREE.ConeGeometry(90, 80, 16);
    const mountainMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.95 });
    const mountain1 = new THREE.Mesh(mountainGeo, mountainMat);
    mountain1.position.set(160, 30, -250);
    this.scene.add(mountain1);

    const mountain2 = new THREE.Mesh(new THREE.ConeGeometry(120, 100, 16), mountainMat);
    mountain2.position.set(-180, 40, -280);
    this.scene.add(mountain2);
  }

  public setWeather(weather: WeatherTime) {
    this.currentWeather = weather;

    if (weather === 'day') {
      this.scene.background = new THREE.Color('#38bdf8'); // sky blue
      this.scene.fog = new THREE.FogExp2(0xbbeafe, 0.007);
      this.dirLight.color.setHex(0xfff7ed);
      this.dirLight.intensity = 2.0;
      this.hemiLight.color.setHex(0xdbeafe);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.8;
    } else if (weather === 'sunset') {
      this.scene.background = new THREE.Color('#fdba74'); // golden orange
      this.scene.fog = new THREE.FogExp2(0xfbcfe8, 0.008);
      this.dirLight.color.setHex(0xf97316);
      this.dirLight.intensity = 1.6;
      this.hemiLight.color.setHex(0xfdba74);
      this.hemiLight.groundColor.setHex(0x4a044e);
      this.hemiLight.intensity = 0.6;
    } else if (weather === 'night') {
      this.scene.background = new THREE.Color('#090d16'); // deep midnight
      this.scene.fog = new THREE.FogExp2(0x090d16, 0.012);
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.35;
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.3;
    } else if (weather === 'rain') {
      this.scene.background = new THREE.Color('#475569'); // stormy gray
      this.scene.fog = new THREE.FogExp2(0x475569, 0.015);
      this.dirLight.color.setHex(0x94a3b8);
      this.dirLight.intensity = 1.0;
      this.hemiLight.color.setHex(0x64748b);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.5;
    }
  }

  public setupPlayerVehicle(
    carId: CarId,
    customization: CarCustomization,
    upgrades: CarUpgrades,
    spawnPos = { x: 0, z: -100, rotationY: 0 },
    initialCondition = 100,
    initialFuel = 100
  ) {
    // Clean old
    if (this.playerCarMesh) {
      this.scene.remove(this.playerCarMesh.group);
      this.playerCarMesh = null;
    }

    this.currentCarId = carId;
    this.currentCustomization = customization;
    this.currentUpgrades = upgrades;

    // Build 3D mesh
    this.playerCarMesh = createProceduralVehicle(carId, customization, this.isSoftwareGl);
    this.scene.add(this.playerCarMesh.group);

    // Init physics
    this.physics = new VehiclePhysics(carId, spawnPos, upgrades, initialCondition, initialFuel);
    this.playerCarMesh.group.position.set(spawnPos.x, 0, spawnPos.z);
    this.playerCarMesh.group.rotation.y = spawnPos.rotationY;

    // Reset audio
    soundManager.startEngine();
  }

  public setMission(mission: MissionDefinition | null) {
    this.currentMission = mission;
    this.currentCheckpointIdx = 0;

    // Clear old parking mesh
    if (this.activeParkingSlotMesh) {
      this.scene.remove(this.activeParkingSlotMesh);
      this.activeParkingSlotMesh = null;
    }

    // Clear checkpoint meshes
    this.checkpointMeshes.forEach((m) => this.scene.remove(m));
    this.checkpointMeshes = [];

    if (!mission) {
      this.parkingEvaluator.setSlot(undefined);
      return;
    }

    // Set weather if defined by mission
    if (mission.weatherTime) {
      this.setWeather(mission.weatherTime);
    }

    // Spawn parking bay mesh if defined
    if (mission.parkingSlot) {
      this.parkingEvaluator.setSlot(mission.parkingSlot);
      this.activeParkingSlotMesh = createParkingSlotMesh(mission.parkingSlot);
      this.scene.add(this.activeParkingSlotMesh);
    }

    // Spawn checkpoint cylinder markers
    if (mission.checkpoints && mission.checkpoints.length > 0) {
      const cpMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });

      mission.checkpoints.forEach((cp, idx) => {
        const ringGeo = new THREE.CylinderGeometry(cp.radius, cp.radius, 4, 24, 1, true);
        ringGeo.translate(0, 2, 0);
        const ring = new THREE.Mesh(ringGeo, cpMat);
        ring.position.set(cp.x, 0, cp.z);
        this.scene.add(ring);
        this.checkpointMeshes.push(ring);
      });
    }

    // Set traffic density
    this.trafficManager.populate(mission.trafficDensity);
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public setGarageMode(isGarage: boolean) {
    this.isGarageMode = isGarage;
    if (isGarage) {
      soundManager.stopEngine();
    } else {
      soundManager.startEngine();
    }
  }

  public rotateGarageCar(deltaX: number) {
    this.garageManualRotation += deltaX * 0.01;
  }

  public setInputs(throttle: number, brake: number, steer: number) {
    this.inputState.throttle = Math.max(0, Math.min(1, throttle));
    this.inputState.brake = Math.max(0, Math.min(1, brake));
    this.inputState.steer = Math.max(-1, Math.min(1, steer));
  }

  private tick = () => {
    if (this.isDestroyed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    // 1. Garage Mode
    if (this.isGarageMode && this.playerCarMesh) {
      this.garageTurntableAngle += 0.4 * dt;
      const angle = this.garageTurntableAngle + this.garageManualRotation;
      this.playerCarMesh.group.rotation.y = angle;
      this.playerCarMesh.group.position.set(0, 0, 0);

      // Studio turntable camera
      this.camera.position.set(Math.sin(angle * 0.3) * 6, 2.2, Math.cos(angle * 0.3) * 6);
      this.camera.lookAt(0, 0.8, 0);

      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(this.tick);
      return;
    }

    // 2. In-Game Mode: Physics & Traffic
    if (this.physics && this.playerCarMesh) {
      // Gather obstacles from static structures + moving traffic
      const trafficObstacles = this.trafficManager.getObstacles();
      const allObstacles = [...this.staticObstacles, ...trafficObstacles];

      const { collisionDetected, collisionIntensity } = this.physics.update(dt, this.inputState, allObstacles);

      if (collisionDetected && collisionIntensity) {
        this.callbacks.onCollision?.(collisionIntensity);
      }

      // Sync 3D Mesh with Physics
      const p = this.physics.state;
      this.playerCarMesh.group.position.set(p.x, p.y, p.z);
      this.playerCarMesh.group.rotation.y = p.rotationY;

      // Wheel turn & spin
      const wheelRollDelta = (p.speed / 0.35) * dt;
      this.playerCarMesh.wheels.forEach((wGroup, idx) => {
        // Roll all 4 wheels
        wGroup.rotation.x += wheelRollDelta;

        // Front 2 wheels turn left/right with steering angle
        if (idx === 0 || idx === 1) {
          wGroup.rotation.y = p.steeringAngle;
        }
      });

      // Taillights brake glow
      const isBraking = this.inputState.brake > 0 || p.gear === 'R';
      this.playerCarMesh.taillights.forEach((tl) => {
        (tl.material as THREE.MeshStandardMaterial).emissiveIntensity = isBraking ? 2.5 : 0.8;
      });

      // Sound update (RPM pitch, throttle rev)
      soundManager.updateEngineRpm(this.physics.getSpeedRatio(), this.inputState.throttle);

      // Update AI Traffic
      this.trafficManager.update(dt, { x: p.x, z: p.z, speed: p.speed });

      // Checkpoint sprint logic
      if (this.currentMission?.checkpoints && this.checkpointMeshes.length > 0) {
        const targetCp = this.currentMission.checkpoints[this.currentCheckpointIdx];
        if (targetCp) {
          const distToCp = Math.hypot(p.x - targetCp.x, p.z - targetCp.z);
          if (distToCp < targetCp.radius) {
            // Hit checkpoint!
            soundManager.playSuccessChime();
            // Hide hit checkpoint
            if (this.checkpointMeshes[this.currentCheckpointIdx]) {
              this.checkpointMeshes[this.currentCheckpointIdx].visible = false;
            }
            this.currentCheckpointIdx++;
          }
        }
      }

      // Parking Evaluation
      const parkingEval = this.parkingEvaluator.evaluate(
        { x: p.x, z: p.z, rotationY: p.rotationY, speed: p.speed },
        dt
      );
      this.callbacks.onParkingUpdate?.(parkingEval);

      // Gas Station Proximity check (around x: 38, z: -100)
      const distToGas = Math.hypot(p.x - 38, p.z - (-100));
      this.callbacks.onNearGasStation?.(distToGas < 12);

      // Wrong Way detection (driving opposite on main avenue)
      if (Math.abs(p.x) < 12 && p.speed > 5) {
        // Left lane (X < 0) should drive South (-Z), Right lane (X > 0) should drive North (+Z)
        const forwardZ = Math.cos(p.rotationY);
        const isWrong = (p.x < 0 && forwardZ > 0.4) || (p.x > 0 && forwardZ < -0.4);
        this.callbacks.onWrongWay?.(isWrong);
      } else {
        this.callbacks.onWrongWay?.(false);
      }

      // HUD Navigation Direction Arrow
      let targetX = 0;
      let targetZ = 0;
      let targetName = 'Destination';

      if (
        this.currentMission?.checkpoints &&
        this.currentCheckpointIdx < this.currentMission.checkpoints.length
      ) {
        const cp = this.currentMission.checkpoints[this.currentCheckpointIdx];
        targetX = cp.x;
        targetZ = cp.z;
        targetName = `Checkpoint ${this.currentCheckpointIdx + 1}`;
      } else if (this.currentMission?.parkingSlot) {
        targetX = this.currentMission.parkingSlot.x;
        targetZ = this.currentMission.parkingSlot.z;
        targetName = this.currentMission.parkingSlot.name;
      }

      const toTargetX = targetX - p.x;
      const toTargetZ = targetZ - p.z;
      const distToTarget = Math.hypot(toTargetX, toTargetZ);
      const angleToTarget = Math.atan2(toTargetX, toTargetZ);

      // Relative angle to vehicle heading
      let relativeAngle = angleToTarget - p.rotationY;
      while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
      while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;

      this.callbacks.onNavUpdate?.(
        (relativeAngle * 180) / Math.PI,
        Math.round(distToTarget),
        targetName
      );

      // Broadcast meters & stats
      this.callbacks.onSpeedChange?.(this.physics.getSpeedMph(), this.physics.getSpeedRatio());
      this.callbacks.onFuelChange?.(Math.round(p.fuel));
      this.callbacks.onConditionChange?.(Math.round(p.condition));

      // 3. Camera Positioning
      this.updateCamera(p, dt);
    }

    // Render Frame
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private updateCamera(p: CarPhysicsState, dt: number) {
    const forwardX = Math.sin(p.rotationY);
    const forwardZ = Math.cos(p.rotationY);

    if (this.cameraMode === 'chase') {
      // 3rd person chase camera smoothly trailing behind
      const distance = 5.8 + Math.min(3.5, Math.abs(p.speed) * 0.1);
      const height = 2.4;
      const targetCamX = p.x - forwardX * distance;
      const targetCamZ = p.z - forwardZ * distance;
      const targetCamY = p.y + height;

      // Smooth exponential damping
      this.camera.position.x += (targetCamX - this.camera.position.x) * 6 * dt;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 6 * dt;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 6 * dt;

      // Look at car slightly ahead of center
      const lookAtPoint = new THREE.Vector3(
        p.x + forwardX * 3,
        p.y + 1.2,
        p.z + forwardZ * 3
      );
      this.camera.lookAt(lookAtPoint);
    } else if (this.cameraMode === 'cockpit') {
      // 1st person cockpit view from driver's seat
      this.camera.position.set(
        p.x - 0.35 * Math.cos(p.rotationY) + forwardX * 0.2,
        p.y + 1.15,
        p.z + 0.35 * Math.sin(p.rotationY) + forwardZ * 0.2
      );
      this.camera.lookAt(
        p.x + forwardX * 20,
        p.y + 1.15,
        p.z + forwardZ * 20
      );
    } else if (this.cameraMode === 'top') {
      // Birds-eye top-down parking camera
      this.camera.position.set(p.x, p.y + 14, p.z);
      this.camera.lookAt(p.x, p.y, p.z);
      this.camera.rotation.z = -p.rotationY;
    } else if (this.cameraMode === 'cinematic') {
      // Low angle cinematic side-chase
      this.camera.position.set(
        p.x + Math.cos(p.rotationY) * 5 - forwardX * 3,
        p.y + 1.5,
        p.z - Math.sin(p.rotationY) * 5 - forwardZ * 3
      );
      this.camera.lookAt(p.x, p.y + 0.8, p.z);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    soundManager.stopEngine();
    this.trafficManager.clear();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
