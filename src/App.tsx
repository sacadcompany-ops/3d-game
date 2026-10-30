import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { DrivingHUD } from './components/DrivingHUD';
import { MainMenu } from './components/MainMenu';
import { GarageView } from './components/GarageView';
import { MissionsModal } from './components/MissionsModal';
import { MissionResultModal } from './components/MissionResultModal';
import { SettingsModal } from './components/SettingsModal';
import { ShopModal } from './components/ShopModal';
import { AchievementsModal } from './components/AchievementsModal';
import {
  GameScreen,
  PlayerSaveData,
  MissionDefinition,
  MissionResult,
  CameraMode,
  CarId,
  CarUpgrades,
  CarCustomization,
  Language,
} from './types/game';
import {
  loadSaveData,
  saveGameData,
  getXpRequiredForLevel,
  calculateRepairCost,
} from './utils/storage';
import { MISSIONS, FREE_DRIVE_MISSION } from './constants/missions';
import { VEHICLES } from './constants/vehicles';
import { soundManager } from './utils/audio';
import { ParkingEvaluation } from './game/parking';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Persistent Player Save State
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => loadSaveData());

  // Navigation & Screens
  const [gameScreen, setGameScreen] = useState<GameScreen>('main_menu');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active Mission & Telemetry
  const [activeMission, setActiveMission] = useState<MissionDefinition | null>(null);
  const [missionTimeRemaining, setMissionTimeRemaining] = useState<number>(75);
  const [missionResult, setMissionResult] = useState<MissionResult | null>(null);

  const [speedMph, setSpeedMph] = useState(0);
  const [speedRatio, setSpeedRatio] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [condition, setCondition] = useState(100);
  const [gear, setGear] = useState<'P' | 'R' | 'N' | 'D'>('P');
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');

  const [navBearingDeg, setNavBearingDeg] = useState(0);
  const [navDistanceMeters, setNavDistanceMeters] = useState(0);
  const [navTargetName, setNavTargetName] = useState('Destination');

  const [parkingEval, setParkingEval] = useState<ParkingEvaluation | null>(null);
  const [isWrongWay, setIsWrongWay] = useState(false);
  const [isNearGasStation, setIsNearGasStation] = useState(false);

  // Mission runtime tracker
  const missionStartTimeRef = useRef(0);
  const startConditionRef = useRef(100);
  const missionFinishedRef = useRef(false);

  // Save changes to localStorage
  const updateSaveData = useCallback((updater: (prev: PlayerSaveData) => PlayerSaveData) => {
    setSaveData((prev) => {
      const next = updater(prev);
      saveGameData(next);
      return next;
    });
  }, []);

  // 1. Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onSpeedChange: (mph, ratio) => {
        setSpeedMph(mph);
        setSpeedRatio(ratio);
        if (engineRef.current?.physics) {
          setGear(engineRef.current.physics.state.gear);
        }
      },
      onFuelChange: (val) => setFuel(val),
      onConditionChange: (val) => setCondition(val),
      onParkingUpdate: (evaluation) => {
        setParkingEval(evaluation);
      },
      onNavUpdate: (bearing, distance, targetName) => {
        setNavBearingDeg(bearing);
        setNavDistanceMeters(distance);
        setNavTargetName(targetName);
      },
      onNearGasStation: (near) => setIsNearGasStation(near),
      onWrongWay: (wrong) => setIsWrongWay(wrong),
    });

    engineRef.current = engine;

    // Setup initial player vehicle from save data
    const currentCar = saveData.currentCarId;
    const custom = saveData.carCustomizations[currentCar];
    const upg = saveData.carUpgrades[currentCar];
    const cond = saveData.carConditions[currentCar] ?? 100;
    const f = saveData.carFuels[currentCar] ?? 100;

    engine.setupPlayerVehicle(currentCar, custom, upg, { x: 0, z: -100, rotationY: 0 }, cond, f);
    engine.setGarageMode(false);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync sound volume on settings change
  useEffect(() => {
    soundManager.setMasterVolume(saveData.settings.masterVolume);
  }, [saveData.settings.masterVolume]);

  // 2. Mission Countdown Timer & Win/Fail Condition Checker
  useEffect(() => {
    if (gameScreen !== 'playing' || !activeMission) return;

    const interval = setInterval(() => {
      // Free drive has no time limit
      if (activeMission.type === 'free_drive') return;

      setMissionTimeRemaining((prev) => {
        if (missionFinishedRef.current) return prev;

        const next = Math.max(0, prev - 0.1);
        if (next <= 0 && !missionFinishedRef.current) {
          // Time out!
          missionFinishedRef.current = true;
          soundManager.playFailSound();
          setMissionResult({
            completed: false,
            stars: 0,
            timeTaken: activeMission.timeLimit,
            damageTaken: Math.max(0, startConditionRef.current - condition),
            parkingAccuracy: 0,
            parkingRating: 'FAILED',
            coinsEarned: 0,
            xpEarned: 0,
            failureReason: 'Time ran out!',
          });
        }
        return next;
      });

      // Check vehicle destruction
      if (condition <= 0 && !missionFinishedRef.current) {
        missionFinishedRef.current = true;
        soundManager.playFailSound();
        setMissionResult({
          completed: false,
          stars: 0,
          timeTaken: activeMission.timeLimit - missionTimeRemaining,
          damageTaken: 100,
          parkingAccuracy: 0,
          parkingRating: 'FAILED',
          coinsEarned: 0,
          xpEarned: 0,
          failureReason: 'Vehicle too damaged!',
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameScreen, activeMission, condition, missionTimeRemaining]);

  // 3. Handle Parking Success
  useEffect(() => {
    if (gameScreen !== 'playing' || !activeMission || missionFinishedRef.current) return;

    if (parkingEval?.isCompleted) {
      missionFinishedRef.current = true;
      soundManager.playSuccessChime();

      const timeTaken = Math.max(1, (performance.now() - missionStartTimeRef.current) / 1000);
      const damageIncurred = Math.max(0, startConditionRef.current - condition);

      // Star calculation
      let stars = 3;
      if (parkingEval.rating === 'PERFECT') stars = 5;
      else if (parkingEval.rating === 'GREAT') stars = 4;
      else if (parkingEval.rating === 'GOOD') stars = 3;
      else stars = 2;

      // Penalize stars for heavy damage
      if (damageIncurred > 20) stars = Math.max(1, stars - 1);
      if (damageIncurred > 40) stars = Math.max(1, stars - 2);

      const baseCoins = activeMission.rewardCoins;
      const coinBonus = stars * 100;
      const totalCoins = baseCoins + coinBonus;
      const totalXp = activeMission.rewardXp;

      // Update player save data
      updateSaveData((prev) => {
        let newXp = prev.xp + totalXp;
        let newLevel = prev.level;
        const xpRequired = getXpRequiredForLevel(newLevel);
        if (newXp >= xpRequired) {
          newLevel++;
          newXp -= xpRequired;
        }

        const missionKey = activeMission.id;
        const prevRecord = prev.completedMissions[missionKey];
        const bestStars = prevRecord ? Math.max(prevRecord.stars, stars) : stars;
        const bestTime = prevRecord ? Math.min(prevRecord.bestTime, timeTaken) : timeTaken;

        return {
          ...prev,
          coins: prev.coins + totalCoins,
          xp: newXp,
          level: newLevel,
          completedMissions: {
            ...prev.completedMissions,
            [missionKey]: { stars: bestStars, bestTime },
          },
          carConditions: {
            ...prev.carConditions,
            [prev.currentCarId]: condition,
          },
          carFuels: {
            ...prev.carFuels,
            [prev.currentCarId]: fuel,
          },
        };
      });

      setMissionResult({
        completed: true,
        stars,
        timeTaken,
        damageTaken: damageIncurred,
        parkingAccuracy: parkingEval.accuracyPercent,
        parkingRating: parkingEval.rating,
        coinsEarned: totalCoins,
        xpEarned: totalXp,
      });
    }
  }, [parkingEval, gameScreen, activeMission, condition, fuel, updateSaveData]);

  // Start a mission
  const handleStartMission = useCallback((mission: MissionDefinition) => {
    setActiveMission(mission);
    setMissionTimeRemaining(mission.timeLimit);
    setMissionResult(null);
    missionFinishedRef.current = false;
    missionStartTimeRef.current = performance.now();
    startConditionRef.current = condition;

    if (engineRef.current) {
      engineRef.current.setGarageMode(false);
      engineRef.current.setMission(mission);

      const carId = saveData.currentCarId;
      const custom = saveData.carCustomizations[carId];
      const upg = saveData.carUpgrades[carId];
      const cond = saveData.carConditions[carId] ?? 100;
      const f = saveData.carFuels[carId] ?? 100;

      engineRef.current.setupPlayerVehicle(carId, custom, upg, mission.spawnPos, cond, f);
    }

    setGameScreen('playing');
  }, [condition, saveData]);

  // Quick Play (starts Mission 1 or highest unlocked)
  const handleQuickPlay = useCallback(() => {
    soundManager.playClick();
    const firstIncomplete = MISSIONS.find((m) => !saveData.completedMissions[m.id]);
    handleStartMission(firstIncomplete || MISSIONS[0]);
  }, [handleStartMission, saveData]);

  // Switch to garage
  const handleOpenGarage = useCallback(() => {
    soundManager.playClick();
    setGameScreen('garage');
    if (engineRef.current) {
      engineRef.current.setGarageMode(true);
      engineRef.current.setMission(null);

      const carId = saveData.currentCarId;
      const custom = saveData.carCustomizations[carId];
      const upg = saveData.carUpgrades[carId];
      engineRef.current.setupPlayerVehicle(carId, custom, upg, { x: 0, z: 0, rotationY: 0 }, 100, 100);
    }
  }, [saveData]);

  // Switch camera
  const handleCameraSwitch = useCallback(() => {
    soundManager.playClick();
    const modes: CameraMode[] = ['chase', 'cockpit', 'top', 'cinematic'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setCameraMode(nextMode);
    engineRef.current?.setCameraMode(nextMode);
  }, [cameraMode]);

  // Refuel full tank
  const handleRefuel = useCallback(() => {
    if (saveData.coins < 50 || fuel >= 100) return;
    updateSaveData((prev) => ({
      ...prev,
      coins: prev.coins - 50,
      carFuels: { ...prev.carFuels, [prev.currentCarId]: 100 },
    }));
    engineRef.current?.physics?.refuel(100);
    setFuel(100);
  }, [fuel, saveData.coins, updateSaveData]);

  // Repair car in garage
  const handleRepairCar = useCallback((carId: CarId, cost: number) => {
    if (saveData.coins < cost) return;
    soundManager.playClick();
    updateSaveData((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      carConditions: { ...prev.carConditions, [carId]: 100 },
    }));
    engineRef.current?.physics?.repair();
    setCondition(100);
  }, [saveData.coins, updateSaveData]);

  // Upgrade car
  const handleUpgradeCar = useCallback((carId: CarId, category: keyof CarUpgrades, cost: number) => {
    if (saveData.coins < cost) return;
    soundManager.playClick();
    updateSaveData((prev) => {
      const curUpgrades = prev.carUpgrades[carId];
      const newLvl = Math.min(5, (curUpgrades[category] || 1) + 1);
      return {
        ...prev,
        coins: prev.coins - cost,
        carUpgrades: {
          ...prev.carUpgrades,
          [carId]: {
            ...curUpgrades,
            [category]: newLvl,
          },
        },
      };
    });
  }, [saveData.coins, updateSaveData]);

  // Customize car
  const handleCustomizeCar = useCallback((carId: CarId, customization: Partial<CarCustomization>) => {
    updateSaveData((prev) => {
      const current = prev.carCustomizations[carId];
      const updated = { ...current, ...customization };
      // Refresh 3D vehicle in engine
      if (engineRef.current) {
        engineRef.current.setupPlayerVehicle(
          carId,
          updated,
          prev.carUpgrades[carId],
          { x: 0, z: 0, rotationY: 0 },
          prev.carConditions[carId] ?? 100,
          prev.carFuels[carId] ?? 100
        );
      }
      return {
        ...prev,
        carCustomizations: {
          ...prev.carCustomizations,
          [carId]: updated,
        },
      };
    });
  }, [updateSaveData]);

  // Claim daily reward (+500 coins)
  const handleClaimDailyReward = useCallback(() => {
    soundManager.playSuccessChime();
    const today = new Date().toISOString().slice(0, 10);
    updateSaveData((prev) => ({
      ...prev,
      coins: prev.coins + 500,
      lastDailyRewardDate: today,
    }));
  }, [updateSaveData]);

  // Steering & Pedals input forwarding to engine
  const handleThrottleChange = useCallback((val: number) => {
    if (engineRef.current) {
      engineRef.current.setInputs(val, engineRef.current.inputState.brake, engineRef.current.inputState.steer);
    }
  }, []);

  const handleBrakeChange = useCallback((val: number) => {
    if (engineRef.current) {
      engineRef.current.setInputs(engineRef.current.inputState.throttle, val, engineRef.current.inputState.steer);
    }
  }, []);

  const handleSteerChange = useCallback((val: number) => {
    if (engineRef.current) {
      engineRef.current.setInputs(engineRef.current.inputState.throttle, engineRef.current.inputState.brake, val);
    }
  }, []);

  const handleHonk = useCallback(() => {
    soundManager.playHonk();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0" />

      {/* Screen 1: MAIN MENU */}
      {gameScreen === 'main_menu' && (
        <MainMenu
          language={saveData.settings.language}
          saveData={saveData}
          onNavigate={(screen) => {
            soundManager.playClick();
            if (screen === 'garage') handleOpenGarage();
            else if (screen === 'settings') setIsSettingsOpen(true);
            else setGameScreen(screen);
          }}
          onClaimDailyReward={handleClaimDailyReward}
          onLanguageChange={(lang) => {
            updateSaveData((prev) => ({
              ...prev,
              settings: { ...prev.settings, language: lang },
            }));
          }}
          onQuickPlay={handleQuickPlay}
        />
      )}

      {/* Screen 2: GARAGE 360 */}
      {gameScreen === 'garage' && (
        <GarageView
          language={saveData.settings.language}
          saveData={saveData}
          onSelectCar={(carId) => {
            updateSaveData((prev) => ({ ...prev, currentCarId: carId }));
            if (engineRef.current) {
              engineRef.current.setupPlayerVehicle(
                carId,
                saveData.carCustomizations[carId],
                saveData.carUpgrades[carId],
                { x: 0, z: 0, rotationY: 0 },
                saveData.carConditions[carId] ?? 100,
                saveData.carFuels[carId] ?? 100
              );
            }
          }}
          onUnlockCar={(carId) => {
            const def = VEHICLES[carId];
            if (saveData.coins < def.price || saveData.level < def.unlockLevel) return;
            soundManager.playSuccessChime();
            updateSaveData((prev) => ({
              ...prev,
              coins: prev.coins - def.price,
              ownedCarIds: [...prev.ownedCarIds, carId],
              currentCarId: carId,
            }));
          }}
          onRepairCar={handleRepairCar}
          onUpgradeCar={handleUpgradeCar}
          onCustomizeCar={handleCustomizeCar}
          onStartDrive={() => {
            handleStartMission(FREE_DRIVE_MISSION);
          }}
          onBackToMenu={() => {
            soundManager.playClick();
            setGameScreen('main_menu');
            if (engineRef.current) {
              engineRef.current.setGarageMode(false);
            }
          }}
          onRotateCar={(deltaX) => {
            engineRef.current?.rotateGarageCar(deltaX);
          }}
        />
      )}

      {/* Screen 3: MISSIONS BROWSER MODAL */}
      {gameScreen === 'missions' && (
        <MissionsModal
          language={saveData.settings.language}
          saveData={saveData}
          onSelectMission={handleStartMission}
          onClose={() => setGameScreen('main_menu')}
        />
      )}

      {/* Screen 4: DRIVING HUD */}
      {gameScreen === 'playing' && (
        <DrivingHUD
          language={saveData.settings.language}
          coins={saveData.coins}
          speedMph={speedMph}
          speedRatio={speedRatio}
          fuel={fuel}
          condition={condition}
          gear={gear}
          timeRemaining={missionTimeRemaining}
          totalTime={activeMission?.timeLimit || 90}
          objectiveText={
            activeMission?.parkingSlot
              ? `PARK AT ${activeMission.parkingSlot.name}`
              : 'EXPLORE CITY'
          }
          navBearingDeg={navBearingDeg}
          navDistanceMeters={navDistanceMeters}
          navTargetName={navTargetName}
          parkingEval={parkingEval}
          cameraMode={cameraMode}
          controlMode={saveData.settings.controlMode}
          isWrongWay={isWrongWay}
          isNearGasStation={isNearGasStation}
          onCameraSwitch={handleCameraSwitch}
          onPause={() => setGameScreen('paused')}
          onRefuel={handleRefuel}
          onThrottleChange={handleThrottleChange}
          onBrakeChange={handleBrakeChange}
          onSteerChange={handleSteerChange}
          onHonk={handleHonk}
        />
      )}

      {/* Screen 5: MISSION RESULT MODAL (SUCCESS / FAILED) */}
      {missionResult && activeMission && (
        <MissionResultModal
          language={saveData.settings.language}
          mission={activeMission}
          result={missionResult}
          onNextMission={() => {
            const currentIdx = MISSIONS.findIndex((m) => m.id === activeMission.id);
            const nextMission = MISSIONS[currentIdx + 1] || MISSIONS[0];
            handleStartMission(nextMission);
          }}
          onRetry={() => handleStartMission(activeMission)}
          onGoToGarage={handleOpenGarage}
          onGoToMenu={() => {
            soundManager.playClick();
            setMissionResult(null);
            setGameScreen('main_menu');
          }}
        />
      )}

      {/* Screen 6: SETTINGS / PAUSED MODAL */}
      {(isSettingsOpen || gameScreen === 'paused') && (
        <SettingsModal
          language={saveData.settings.language}
          settings={saveData.settings}
          isPausedMode={gameScreen === 'paused'}
          onUpdateSettings={(newSettings) => {
            updateSaveData((prev) => ({
              ...prev,
              settings: { ...prev.settings, ...newSettings },
            }));
            if (newSettings.language) {
              // Updated language
            }
          }}
          onResume={() => setGameScreen('playing')}
          onRetry={() => {
            if (activeMission) handleStartMission(activeMission);
          }}
          onExitToMenu={() => {
            setGameScreen('main_menu');
            setIsSettingsOpen(false);
          }}
          onClose={() => {
            setIsSettingsOpen(false);
            if (gameScreen === 'paused') setGameScreen('playing');
          }}
        />
      )}

      {/* Screen 7: SHOP MODAL */}
      {gameScreen === 'shop' && (
        <ShopModal
          language={saveData.settings.language}
          saveData={saveData}
          onBuyCoinsWithGems={(coinsAmount, gemCost) => {
            updateSaveData((prev) => ({
              ...prev,
              coins: prev.coins + coinsAmount,
              gems: prev.gems - gemCost,
            }));
          }}
          onClaimFreeGems={() => {
            updateSaveData((prev) => ({
              ...prev,
              gems: prev.gems + 15,
            }));
          }}
          onInstantRepairAll={() => {
            updateSaveData((prev) => {
              const newConditions = { ...prev.carConditions };
              Object.keys(newConditions).forEach((k) => {
                newConditions[k as CarId] = 100;
              });
              return {
                ...prev,
                coins: Math.max(0, prev.coins - 300),
                carConditions: newConditions,
              };
            });
            engineRef.current?.physics?.repair();
            setCondition(100);
          }}
          onClose={() => setGameScreen('main_menu')}
        />
      )}

      {/* Screen 8: ACHIEVEMENTS MODAL */}
      {gameScreen === 'achievements' && (
        <AchievementsModal
          language={saveData.settings.language}
          saveData={saveData}
          onClaimAchievement={(id, coins, xp) => {
            updateSaveData((prev) => {
              let newXp = prev.xp + xp;
              let newLevel = prev.level;
              const req = getXpRequiredForLevel(newLevel);
              if (newXp >= req) {
                newLevel++;
                newXp -= req;
              }
              const claimed = prev.claimedAchievements || [];
              return {
                ...prev,
                coins: prev.coins + coins,
                xp: newXp,
                level: newLevel,
                claimedAchievements: [...claimed, id],
              };
            });
          }}
          onClose={() => setGameScreen('main_menu')}
        />
      )}
    </div>
  );
}
