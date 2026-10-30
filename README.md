# 🚗 Somaliland Driving Simulator

**Developer / Studio**: Somaliland Game Studio  
**Application ID**: `com.somaliland.driving.simulator`  
**Target Platform**: Android ARM64 (`arm64-v8a`) / ARMv7 & Web  
**Version**: `1.0.0` (Bundle Version Code: `1`)  
**Downloadable APK Artifact**: `Somaliland-Driving-Simulator-APK` (`Somaliland-Driving-Simulator.apk`)  

A high-fidelity 3D mobile driving and precision parking simulator featuring authentic Somaliland city avenues, regional highway signage (*Hargeisa*, *Berbera*, *Borama*), 8 customizable vehicles with the national tricolor livery, traffic AI, 360° interactive turntable garage, and mobile touchscreen controls.

---

## 🎮 Core Gameplay Loop

```
Main Menu / Garage ──> Choose & Upgrade Vehicle ──> Select Mission / Free Drive
                                                            │
                                                            ▼
Complete Parking / Transit ◄── Avoid Collisions ◄── Navigate 3D City & Traffic
            │
            ▼
Earn Coins, XP & Stars ──> Level Up ──> Repair Damage ──> Unlock New Cars & Fleet
```

---

## ✨ Features & Systems

### 1. 🌆 High-Fidelity 3D City Environment
- **Multi-Lane Road Grid**: Wide 4-lane central avenue, cross boulevards, intersections, and lane dividers.
- **Urban Details**: Palm tree median strips, sidewalks, streetlights, glowing traffic lights with real-time signal cycles (Green ➔ Yellow ➔ Red).
- **Overhead Gantry Signs**: Regional destination signage (*Hargeisa*, *Berbera*, *Borama*).
- **Landmarks & Props**: City billboards, roadside commercial towers, backdrop mountains, and a roadside drive-in gas station with refueling bay.

### 2. 🚘 Diverse 8-Vehicle Fleet
1. **Aura Pulse Hatch** (Compact): Agile city starter vehicle with national tricolor livery option.
2. **Sahil Metro Taxi** (Commercial): Quick acceleration taxi with roof sign.
3. **Monarch Executive** (Sedan): Smooth luxury cruiser.
4. **Atlas Trail 4x4** (SUV): Rugged heavy chassis with maximum collision absorption.
5. **Golis Titan Pickup** (Utility): High-torque flatbed pickup.
6. **TransCity Express Van** (Van): Heavy-duty delivery van.
7. **Apex GT Predator** (Sports): Low-slung supercar with sport exhaust and rear wing.
8. **Kallisto Phantom V12** (Luxury): Supreme top-tier flagship hypercar.

### 3. 🎯 Precision Parking & Mission Evaluation
- **Parking Evaluation Engine**:
  - Distance-to-center offset measurement.
  - Angular alignment detection (forward and reverse parking).
  - Accuracy ratings: **PERFECT PARKING** (⭐⭐⭐⭐⭐), **GREAT**, **GOOD**, **PASS**, and **FAILED**.
  - 2.0-second hold timer verification to ensure complete vehicle stop.
- **10 Structured Missions + Free Drive**:
  - Speed Parking, Downtown Parallel Parking, Rush Hour Traffic, Berbera Express Delivery, Taxi Passenger Run, Reverse Precision Bay, Boulevard Checkpoint Sprint, Emergency Fast Transit, Night City Cruise, and Master Chauffeur Test.

### 4. 🛠️ Interactive 360° Garage & Tuning
- **Turntable Inspection**: 360° touch/mouse drag vehicle rotation.
- **Vehicle Condition & Repair**: Real-time condition meter (100% down to 0%). Dynamic repair cost calculation in gold coins (*"No need to repair"* at 100% vs. *"Repair required"* when damaged).
- **5-Tier Upgrades**: Engine, Transmission, Brakes, Tires & Grip, Suspension & Durability, and Fuel System.
- **Visual Customization**: Exterior paint swatches, rear spoilers, wheel rims, window tinting, and xenon/amber/cyan headlights.

### 5. 🕹️ Mobile-First & Desktop Controls
- **Steering Modes**:
  - Touch-drag 360° interactive Steering Wheel with center horn button.
  - On-screen Left/Right arrow buttons.
  - Gyro tilt simulation.
  - Desktop Keyboard controls (`WASD` or `Arrow Keys`, `Space` for brake, `C` for camera switch, `H` for horn, `Esc` for pause).
- **Perforated Metal Pedals**: Authentic textured plates with depression animations.
- **Camera Views**: 3rd-Person Chase, 1st-Person Cockpit Interior, Top-Down Birds-Eye Parking Camera, and Cinematic Free-cam.

### 6. 🔊 Zero-Dependency Procedural Web Audio Synthesizer
- Real-time procedural engine pitch mapped to velocity and throttle (RPM synthesis).
- High-frequency brake squeals during rapid deceleration.
- Bandpass noise skid screech on high-speed drifts.
- Low-frequency impact thud on collisions.
- Dual-tone horn and celebratory parking chimes.

### 7. 🌍 Multilingual Localization
- Full UI and mission translation support for:
  - **English**
  - **Somali (Af-Soomaali)**
  - **Arabic (العربية)**

---

## 🏗️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Declarative component UI and application lifecycle |
| **Three.js** | 3D WebGL renderer, procedural geometry, PBR lighting & shaders |
| **TypeScript** | Strict compile-time typing for vehicles, physics, and state |
| **Tailwind CSS 4** | Zero-bloat utility styling for HUD and modals |
| **Lucide Icons** | Vector iconography for dashboard, menus, and controls |
| **Web Audio API** | 100% procedural synthesized audio (zero external asset latency) |
| **HTML5 LocalStorage** | Automatic persistence for fleet, upgrades, missions, and currency |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Run TypeScript type-checking and linter
npm run lint

# Build production bundle
npm run build
```

## 🚀 Automatic GitHub Pages Deployment

This project includes a pre-configured automated GitHub Actions workflow in `.github/workflows/deploy.yml`.

Whenever you push to the `main` branch, GitHub will automatically:
1. Check out code
2. Install dependencies
3. Type-check & lint (`npm run lint`)
4. Build the production bundle (`npm run build`) with relative asset paths
5. Automatically deploy and publish the live game to **GitHub Pages**!

### How to enable on GitHub:
1. Go to your repository on **GitHub** ➔ **Settings** ➔ **Pages**.
2. Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
3. Push your code to the `main` branch.
4. Your game will automatically go live at:
   `https://<YOUR_GITHUB_USERNAME>.github.io/<REPO_NAME>/`

---

## 🔒 Security & Privacy

- No hardcoded API keys or external secrets.
- Client state persists strictly in standard browser `localStorage`.
- `.gitignore` ensures all local artifacts and environment overrides remain private.
