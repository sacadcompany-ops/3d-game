import * as THREE from 'three';
import { CarId, CarCustomization } from '../types/game';
import { VEHICLES } from '../constants/vehicles';

// Procedural Canvas Texture Helpers
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#262930';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle noise for road grit
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Road lane dashed markings
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.setLineDash([40, 40]);
  ctx.beginPath();
  ctx.moveTo(170, 0);
  ctx.lineTo(170, 512);
  ctx.moveTo(342, 0);
  ctx.lineTo(342, 512);
  ctx.stroke();

  // Solid side road edges
  ctx.strokeStyle = '#facc15'; // yellow curb line
  ctx.setLineDash([]);
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(12, 512);
  ctx.moveTo(500, 0);
  ctx.lineTo(500, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSidewalkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 256; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBuildingFacadeTexture(style: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const baseColors = ['#1e293b', '#334155', '#475569', '#1e1b4b', '#0f172a'];
  ctx.fillStyle = baseColors[style % baseColors.length];
  ctx.fillRect(0, 0, 512, 1024);

  // Windows grid
  const cols = 8;
  const rows = 24;
  const padX = 14;
  const padY = 12;
  const winW = (512 - padX * (cols + 1)) / cols;
  const winH = (1024 - padY * (rows + 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (winW + padX);
      const y = padY + r * (winH + padY);

      const isLit = Math.random() > 0.45;
      if (isLit) {
        ctx.fillStyle = Math.random() > 0.3 ? '#fef08a' : '#93c5fd';
      } else {
        ctx.fillStyle = '#090d16';
      }
      ctx.fillRect(x, y, winW, winH);

      // Window frame
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, winW, winH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSomalilandFlagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  const h = 340 / 3;

  // Top band: Green
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, 512, h);

  // Middle band: White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, h, 512, h);

  // Bottom band: Red
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, h * 2, 512, h);

  // Black Star in the center of white band
  ctx.fillStyle = '#000000';
  const cx = 256;
  const cy = h * 1.5;
  const rOuter = 34;
  const rInner = 14;

  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const angle2 = angle1 + (2 * Math.PI) / 10;
    const x1 = cx + Math.cos(angle1) * rOuter;
    const y1 = cy + Math.sin(angle1) * rOuter;
    const x2 = cx + Math.cos(angle2) * rInner;
    const y2 = cy + Math.sin(angle2) * rInner;
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGantrySignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Green Highway sign
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 1004, 236);

  // Dividers
  ctx.beginPath();
  ctx.moveTo(512, 10);
  ctx.lineTo(512, 246);
  ctx.stroke();

  // Left side: Hargeisa / Berbera
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('⬆ Hargeisa', 40, 95);
  ctx.fillText('➡ Berbera', 40, 185);

  // Right side: Borama / Destination
  ctx.fillText('Berbera ➡', 560, 95);
  ctx.fillText('Borama ➜', 560, 185);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCityBillboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, 0, 1024, 512);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 76px sans-serif';
  ctx.fillText('SOMALILAND', 60, 120);

  ctx.fillStyle = '#86efac';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('Nabad • Horumar • Midnimo', 65, 190);

  // Landmark graphic box
  ctx.fillStyle = '#047857';
  ctx.fillRect(60, 240, 904, 230);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('★ Welcome to Hargeisa City Center ★', 120, 360);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// -------------------------------------------------------------
// Vehicle Procedural Model Builder (Composite 3-12 parts Group)
// -------------------------------------------------------------
export interface VehicleMeshBundle {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheels: THREE.Group[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  spoilerGroup?: THREE.Group;
  materials: {
    paint: THREE.MeshStandardMaterial;
    glass: THREE.MeshPhysicalMaterial;
    wheel: THREE.MeshStandardMaterial;
    taillight: THREE.MeshStandardMaterial;
    headlight: THREE.MeshStandardMaterial;
  };
}

export function createProceduralVehicle(
  carId: CarId,
  customization?: CarCustomization,
  isSoftwareGl: boolean = false
): VehicleMeshBundle {
  const def = VEHICLES[carId] || VEHICLES.compact;
  const { width, height, length, wheelBase } = def.dimensions;
  const cust = customization || {
    color: def.defaultColor,
    spoiler: 'none',
    rims: 'stock',
    windowTint: 'smoke',
    headlights: 'white',
    hasLivery: carId === 'compact', // Compact car gets the iconic Somaliland livery by default
  };

  const carGroup = new THREE.Group();
  carGroup.name = `vehicle_${carId}`;

  // 1. Materials
  const paintMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cust.color),
    metalness: 0.65,
    roughness: 0.22,
  });

  if (cust.hasLivery) {
    paintMat.map = createSomalilandFlagTexture();
    paintMat.map.wrapS = THREE.ClampToEdgeWrapping;
    paintMat.map.wrapT = THREE.ClampToEdgeWrapping;
  }

  const glassOpacity = cust.windowTint === 'dark' ? 0.85 : cust.windowTint === 'smoke' ? 0.6 : 0.35;
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: cust.windowTint === 'mirror' ? '#93c5fd' : '#1e293b',
    metalness: 0.4,
    roughness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.8,
    transparent: true,
    opacity: isSoftwareGl ? 0.6 : glassOpacity,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    metalness: 0.95,
    roughness: 0.1,
  });

  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.8,
    metalness: 0.1,
  });

  const headlightColorMap: Record<string, number> = {
    white: 0xffffff,
    halogen: 0xfef08a,
    amber: 0xf59e0b,
    cyan: 0x38bdf8,
  };
  const headlightColor = headlightColorMap[cust.headlights] || 0xffffff;

  const headlightMat = new THREE.MeshStandardMaterial({
    color: headlightColor,
    emissive: headlightColor,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x991b1b,
    emissiveIntensity: 0.9,
    roughness: 0.15,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: '#171717',
    roughness: 0.9,
    metalness: 0.05,
  });

  // 2. Primary Body Silhouette
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = height * 0.45;

  // Lower Main Hull
  const lowerGeo = new THREE.BoxGeometry(width, height * 0.45, length);
  const lowerMesh = new THREE.Mesh(lowerGeo, paintMat);
  lowerMesh.castShadow = !isSoftwareGl;
  lowerMesh.receiveShadow = !isSoftwareGl;
  bodyGroup.add(lowerMesh);

  // Upper Cabin / Greenhouse
  const cabinWidth = width * 0.88;
  const cabinHeight = height * 0.52;
  const cabinLength = length * (carId === 'sports' ? 0.45 : carId === 'van' ? 0.85 : carId === 'pickup' ? 0.42 : 0.58);
  const cabinZOffset = carId === 'sports' ? 0.2 : carId === 'van' ? 0.1 : carId === 'pickup' ? -0.4 : 0.1;

  const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
  const cabinMesh = new THREE.Mesh(cabinGeo, paintMat);
  cabinMesh.position.set(0, height * 0.42, cabinZOffset);
  cabinMesh.castShadow = !isSoftwareGl;
  bodyGroup.add(cabinMesh);

  // Windshield & Windows
  const windshieldGeo = new THREE.PlaneGeometry(cabinWidth * 0.92, cabinHeight * 0.8);
  const frontWindshield = new THREE.Mesh(windshieldGeo, glassMat);
  frontWindshield.position.set(0, height * 0.42, cabinZOffset + cabinLength / 2 + 0.02);
  frontWindshield.rotation.x = -0.25;
  bodyGroup.add(frontWindshield);

  const rearWindshield = new THREE.Mesh(windshieldGeo, glassMat);
  rearWindshield.position.set(0, height * 0.42, cabinZOffset - cabinLength / 2 - 0.02);
  rearWindshield.rotation.x = Math.PI + 0.25;
  bodyGroup.add(rearWindshield);

  // Side Windows (Left & Right)
  const sideWinGeo = new THREE.PlaneGeometry(cabinLength * 0.88, cabinHeight * 0.7);
  const leftWin = new THREE.Mesh(sideWinGeo, glassMat);
  leftWin.position.set(-cabinWidth / 2 - 0.02, height * 0.42, cabinZOffset);
  leftWin.rotation.y = -Math.PI / 2;
  bodyGroup.add(leftWin);

  const rightWin = new THREE.Mesh(sideWinGeo, glassMat);
  rightWin.position.set(cabinWidth / 2 + 0.02, height * 0.42, cabinZOffset);
  rightWin.rotation.y = Math.PI / 2;
  bodyGroup.add(rightWin);

  // Front Grille & Bumpers
  const grilleGeo = new THREE.BoxGeometry(width * 0.65, height * 0.2, 0.1);
  const grille = new THREE.Mesh(grilleGeo, blackPlasticMat);
  grille.position.set(0, -0.05, length / 2 + 0.05);
  bodyGroup.add(grille);

  // Front Headlights
  const headlightMeshes: THREE.Mesh[] = [];
  const hlGeo = new THREE.BoxGeometry(width * 0.22, height * 0.12, 0.08);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
  hlLeft.position.set(-width * 0.35, 0.08, length / 2 + 0.04);
  const hlRight = new THREE.Mesh(hlGeo, headlightMat);
  hlRight.position.set(width * 0.35, 0.08, length / 2 + 0.04);
  bodyGroup.add(hlLeft, hlRight);
  headlightMeshes.push(hlLeft, hlRight);

  // Taillights
  const taillightMeshes: THREE.Mesh[] = [];
  const tlGeo = new THREE.BoxGeometry(width * 0.24, height * 0.12, 0.08);
  const tlLeft = new THREE.Mesh(tlGeo, taillightMat);
  tlLeft.position.set(-width * 0.34, 0.08, -length / 2 - 0.04);
  const tlRight = new THREE.Mesh(tlGeo, taillightMat);
  tlRight.position.set(width * 0.34, 0.08, -length / 2 - 0.04);
  bodyGroup.add(tlLeft, tlRight);
  taillightMeshes.push(tlLeft, tlRight);

  // Twin Exhaust Pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const exh1 = new THREE.Mesh(exhaustGeo, chromeMat);
  exh1.position.set(-width * 0.28, -height * 0.18, -length / 2 - 0.08);
  const exh2 = new THREE.Mesh(exhaustGeo, chromeMat);
  exh2.position.set(width * 0.28, -height * 0.18, -length / 2 - 0.08);
  bodyGroup.add(exh1, exh2);

  // Side Mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.18, 0.1, 0.12);
  const mirrorL = new THREE.Mesh(mirrorGeo, paintMat);
  mirrorL.position.set(-width / 2 - 0.1, height * 0.25, cabinZOffset + cabinLength / 2 - 0.1);
  const mirrorR = new THREE.Mesh(mirrorGeo, paintMat);
  mirrorR.position.set(width / 2 + 0.1, height * 0.25, cabinZOffset + cabinLength / 2 - 0.1);
  bodyGroup.add(mirrorL, mirrorR);

  // Vehicle-Specific Accents
  if (carId === 'taxi') {
    // Taxi Roof Top Sign
    const signGeo = new THREE.BoxGeometry(0.7, 0.2, 0.25);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8,
    });
    const taxiSign = new THREE.Mesh(signGeo, signMat);
    taxiSign.position.set(0, height * 0.72, cabinZOffset);
    bodyGroup.add(taxiSign);
  } else if (carId === 'pickup') {
    // Truck Bed
    const bedGeo = new THREE.BoxGeometry(width * 0.9, height * 0.35, length * 0.45);
    const bedMesh = new THREE.Mesh(bedGeo, blackPlasticMat);
    bedMesh.position.set(0, 0.05, -length * 0.26);
    bodyGroup.add(bedMesh);
  }

  // Rear Spoiler Options
  let spoilerGroup: THREE.Group | undefined;
  if (cust.spoiler !== 'none') {
    spoilerGroup = new THREE.Group();
    const wingWidth = width * (cust.spoiler === 'gt' ? 1.05 : 0.9);
    const wingHeight = cust.spoiler === 'gt' ? 0.35 : 0.15;
    const wingBladeGeo = new THREE.BoxGeometry(wingWidth, 0.05, 0.25);
    const wingBlade = new THREE.Mesh(wingBladeGeo, cust.spoiler === 'gt' ? blackPlasticMat : paintMat);
    wingBlade.position.y = wingHeight;

    const postGeo = new THREE.CylinderGeometry(0.025, 0.025, wingHeight, 8);
    const postL = new THREE.Mesh(postGeo, blackPlasticMat);
    postL.position.set(-wingWidth * 0.35, wingHeight / 2, 0);
    const postR = new THREE.Mesh(postGeo, blackPlasticMat);
    postR.position.set(wingWidth * 0.35, wingHeight / 2, 0);

    spoilerGroup.add(wingBlade, postL, postR);
    spoilerGroup.position.set(0, height * 0.22, -length / 2 + 0.15);
    bodyGroup.add(spoilerGroup);
  }

  carGroup.add(bodyGroup);

  // 3. Wheels & Rims (4 units)
  const wheelRadius = height * 0.25;
  const wheelThickness = 0.26;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 24);
  wheelGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelThickness + 0.02, 16);
  rimGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    { x: -width / 2, y: wheelRadius, z: wheelBase / 2 },  // Front Left
    { x: width / 2, y: wheelRadius, z: wheelBase / 2 },   // Front Right
    { x: -width / 2, y: wheelRadius, z: -wheelBase / 2 }, // Rear Left
    { x: width / 2, y: wheelRadius, z: -wheelBase / 2 },  // Rear Right
  ];

  const wheels: THREE.Group[] = [];
  wheelPositions.forEach((pos, idx) => {
    const wheelAssembly = new THREE.Group();
    wheelAssembly.position.set(pos.x, pos.y, pos.z);

    const tire = new THREE.Mesh(wheelGeo, tireRubberMat);
    tire.castShadow = !isSoftwareGl;
    wheelAssembly.add(tire);

    const rimMat = cust.rims === 'blackout' ? blackPlasticMat : chromeMat;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelAssembly.add(rim);

    // Subtle brake caliper behind rim
    const caliperGeo = new THREE.BoxGeometry(0.08, wheelRadius * 0.5, 0.12);
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(pos.x > 0 ? -0.06 : 0.06, wheelRadius * 0.1, 0);
    wheelAssembly.add(caliper);

    carGroup.add(wheelAssembly);
    wheels.push(wheelAssembly);
  });

  return {
    group: carGroup,
    bodyMesh: lowerMesh,
    wheels,
    headlights: headlightMeshes,
    taillights: taillightMeshes,
    spoilerGroup,
    materials: {
      paint: paintMat,
      glass: glassMat,
      wheel: tireRubberMat,
      taillight: taillightMat,
      headlight: headlightMat,
    },
  };
}

// -------------------------------------------------------------
// City Environment Props (Trees, Lamps, Buildings, Signs, Bays)
// -------------------------------------------------------------
export function createPalmTree(): THREE.Group {
  const tree = new THREE.Group();

  // Segmented Trunk
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 6, 8);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 3;
  trunk.rotation.z = (Math.random() - 0.5) * 0.1;
  tree.add(trunk);

  // Palm Fronds
  const frondMat = new THREE.MeshStandardMaterial({
    color: '#15803d',
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const frondCount = 7;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i * Math.PI * 2) / frondCount;
    const frondGeo = new THREE.ConeGeometry(0.8, 4, 4);
    frondGeo.translate(0, 2, 0);
    frondGeo.rotateX(Math.PI / 3);

    const frond = new THREE.Mesh(frondGeo, frondMat);
    frond.position.set(0, 5.8, 0);
    frond.rotation.y = angle;
    tree.add(frond);
  }

  return tree;
}

export function createStreetLamp(): THREE.Group {
  const lamp = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 });

  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 7, 8);
  const pole = new THREE.Mesh(poleGeo, metalMat);
  pole.position.y = 3.5;
  lamp.add(pole);

  // Horizontal Arm
  const armGeo = new THREE.BoxGeometry(0.12, 0.12, 1.8);
  const arm = new THREE.Mesh(armGeo, metalMat);
  arm.position.set(0, 6.9, 0.8);
  lamp.add(arm);

  // Light fixture
  const fixtureGeo = new THREE.BoxGeometry(0.3, 0.15, 0.5);
  const fixtureMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 1.5,
  });
  const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
  fixture.position.set(0, 6.8, 1.6);
  lamp.add(fixture);

  return lamp;
}

export function createOverheadGantry(): THREE.Group {
  const gantry = new THREE.Group();
  const trussMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.4 });

  // Two vertical support towers
  const towerGeo = new THREE.CylinderGeometry(0.2, 0.25, 9, 8);
  const towerLeft = new THREE.Mesh(towerGeo, trussMat);
  towerLeft.position.set(-14, 4.5, 0);

  const towerRight = new THREE.Mesh(towerGeo, trussMat);
  towerRight.position.set(14, 4.5, 0);

  // Cross beam
  const beamGeo = new THREE.BoxGeometry(28.5, 0.5, 0.5);
  const beam = new THREE.Mesh(beamGeo, trussMat);
  beam.position.set(0, 8.5, 0);

  // Signboard
  const signGeo = new THREE.PlaneGeometry(16, 4);
  const signMat = new THREE.MeshBasicMaterial({
    map: createGantrySignTexture(),
    side: THREE.DoubleSide,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 7.8, 0.3);

  gantry.add(towerLeft, towerRight, beam, sign);
  return gantry;
}

export function createBillboardProp(): THREE.Group {
  const bb = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 });

  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 10, 8), postMat);
  postL.position.set(-5, 5, 0);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 10, 8), postMat);
  postR.position.set(5, 5, 0);

  const boardGeo = new THREE.PlaneGeometry(14, 7);
  const boardMat = new THREE.MeshBasicMaterial({
    map: createCityBillboardTexture(),
    side: THREE.DoubleSide,
  });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0, 8, 0.2);

  bb.add(postL, postR, board);
  return bb;
}

export function createTrafficLight(): { group: THREE.Group; setLight: (state: 'green' | 'yellow' | 'red') => void } {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.7, roughness: 0.4 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 8), poleMat);
  pole.position.y = 2.5;

  const boxGeo = new THREE.BoxGeometry(0.5, 1.4, 0.4);
  const box = new THREE.Mesh(boxGeo, poleMat);
  box.position.set(0, 4.4, 0);

  const redMat = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xdc2626, emissiveIntensity: 0.2 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0x222200, emissive: 0xeab308, emissiveIntensity: 0.2 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x002200, emissive: 0x16a34a, emissiveIntensity: 1.8 });

  const lensGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const redLens = new THREE.Mesh(lensGeo, redMat);
  redLens.position.set(0, 4.8, 0.2);

  const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
  yellowLens.position.set(0, 4.4, 0.2);

  const greenLens = new THREE.Mesh(lensGeo, greenMat);
  greenLens.position.set(0, 4.0, 0.2);

  group.add(pole, box, redLens, yellowLens, greenLens);

  const setLight = (state: 'green' | 'yellow' | 'red') => {
    redMat.emissiveIntensity = state === 'red' ? 2.0 : 0.1;
    yellowMat.emissiveIntensity = state === 'yellow' ? 2.0 : 0.1;
    greenMat.emissiveIntensity = state === 'green' ? 2.0 : 0.1;
  };

  return { group, setLight };
}

export function createGasStation(): THREE.Group {
  const station = new THREE.Group();
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.3 });
  const columnMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });

  // Canopy
  const canopyGeo = new THREE.BoxGeometry(16, 0.8, 12);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 6.5, 0);

  // 4 Support Columns
  const colGeo = new THREE.CylinderGeometry(0.3, 0.3, 6.5, 12);
  const col1 = new THREE.Mesh(colGeo, columnMat);
  col1.position.set(-6, 3.25, -4);
  const col2 = new THREE.Mesh(colGeo, columnMat);
  col2.position.set(6, 3.25, -4);
  const col3 = new THREE.Mesh(colGeo, columnMat);
  col3.position.set(-6, 3.25, 4);
  const col4 = new THREE.Mesh(colGeo, columnMat);
  col4.position.set(6, 3.25, 4);

  // Gas Pumps
  const pumpMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.3 });
  const pumpGeo = new THREE.BoxGeometry(1.2, 2.2, 0.8);
  const pump1 = new THREE.Mesh(pumpGeo, pumpMat);
  pump1.position.set(-2.5, 1.1, 0);
  const pump2 = new THREE.Mesh(pumpGeo, pumpMat);
  pump2.position.set(2.5, 1.1, 0);

  station.add(canopy, col1, col2, col3, col4, pump1, pump2);
  return station;
}
