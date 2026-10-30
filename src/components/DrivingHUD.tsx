import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Coins,
  Pause,
  Clock,
  Compass,
  AlertTriangle,
  Fuel,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ParkingEvaluation } from '../game/parking';
import { CameraMode, ControlMode, Language } from '../types/game';
import { TRANSLATIONS } from '../constants/translations';
import { soundManager } from '../utils/audio';

interface DrivingHUDProps {
  language: Language;
  coins: number;
  speedMph: number;
  speedRatio: number;
  fuel: number;
  condition: number;
  gear: 'P' | 'R' | 'N' | 'D';
  timeRemaining: number;
  totalTime: number;
  objectiveText: string;
  navBearingDeg: number;
  navDistanceMeters: number;
  navTargetName: string;
  parkingEval: ParkingEvaluation | null;
  cameraMode: CameraMode;
  controlMode: ControlMode;
  isWrongWay: boolean;
  isNearGasStation: boolean;
  onCameraSwitch: () => void;
  onPause: () => void;
  onRefuel: () => void;
  onThrottleChange: (val: number) => void;
  onBrakeChange: (val: number) => void;
  onSteerChange: (val: number) => void;
  onHonk: () => void;
}

export const DrivingHUD: React.FC<DrivingHUDProps> = ({
  language,
  coins,
  speedMph,
  speedRatio,
  fuel,
  condition,
  gear,
  timeRemaining,
  objectiveText,
  navBearingDeg,
  navDistanceMeters,
  navTargetName,
  parkingEval,
  cameraMode,
  controlMode,
  isWrongWay,
  isNearGasStation,
  onCameraSwitch,
  onPause,
  onRefuel,
  onThrottleChange,
  onBrakeChange,
  onSteerChange,
  onHonk,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Steering Wheel drag state
  const [wheelAngle, setWheelAngle] = useState(0); // in degrees
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDraggingWheel = useRef(false);
  const startWheelAngle = useRef(0);
  const startTouchAngle = useRef(0);

  // Pedal active states for visual depression
  const [isThrottleActive, setIsThrottleActive] = useState(false);
  const [isBrakeActive, setIsBrakeActive] = useState(false);
  const [isSteerLeftActive, setIsSteerLeftActive] = useState(false);
  const [isSteerRightActive, setIsSteerRightActive] = useState(false);

  // Keyboard controls listener (WASD / Arrows)
  useEffect(() => {
    const activeKeys = new Set<string>();

    const updateFromKeys = () => {
      let throttle = 0;
      let brake = 0;
      let steer = 0;

      if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) throttle = 1;
      if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) brake = 1;
      if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) steer = -1;
      if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) steer = 1;

      onThrottleChange(throttle);
      onBrakeChange(brake);
      onSteerChange(steer);

      setIsThrottleActive(throttle > 0);
      setIsBrakeActive(brake > 0);
      setWheelAngle(steer * 90);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      activeKeys.add(e.code);
      if (e.code === 'KeyC') onCameraSwitch();
      if (e.code === 'KeyH') onHonk();
      if (e.code === 'Escape') onPause();
      updateFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.code);
      updateFromKeys();
    };

    const handleBlur = () => {
      activeKeys.clear();
      updateFromKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onThrottleChange, onBrakeChange, onSteerChange, onCameraSwitch, onHonk, onPause]);

  // Touch / Pointer Steering Wheel Math
  const getAngleFromCenter = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - cy, clientX - cx);
    return (rad * 180) / Math.PI;
  }, []);

  const handleWheelPointerDown = (e: React.PointerEvent) => {
    isDraggingWheel.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startTouchAngle.current = getAngleFromCenter(e.clientX, e.clientY);
    startWheelAngle.current = wheelAngle;
  };

  const handleWheelPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingWheel.current) return;
    const currentTouchAngle = getAngleFromCenter(e.clientX, e.clientY);
    let delta = currentTouchAngle - startTouchAngle.current;

    // Handle crossing -180/180 boundary
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const newAngle = Math.max(-140, Math.min(140, startWheelAngle.current + delta));
    setWheelAngle(newAngle);

    // Map -140..140 deg to -1..1 steer value
    const normalizedSteer = newAngle / 140;
    onSteerChange(normalizedSteer);
  };

  const handleWheelPointerUp = (e: React.PointerEvent) => {
    isDraggingWheel.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    // Return wheel to center
    setWheelAngle(0);
    onSteerChange(0);
  };

  // Button Steer handlers (when in button mode)
  const handleSteerBtnDown = (dir: -1 | 1) => {
    if (dir === -1) setIsSteerLeftActive(true);
    if (dir === 1) setIsSteerRightActive(true);
    onSteerChange(dir);
    setWheelAngle(dir * 70);
  };

  const handleSteerBtnUp = () => {
    setIsSteerLeftActive(false);
    setIsSteerRightActive(false);
    onSteerChange(0);
    setWheelAngle(0);
  };

  // Throttle handlers
  const handleThrottleDown = () => {
    setIsThrottleActive(true);
    onThrottleChange(1);
  };
  const handleThrottleUp = () => {
    setIsThrottleActive(false);
    onThrottleChange(0);
  };

  // Brake handlers
  const handleBrakeDown = () => {
    setIsBrakeActive(true);
    onBrakeChange(1);
  };
  const handleBrakeUp = () => {
    setIsBrakeActive(false);
    onBrakeChange(0);
  };

  // Format Timer mm:ss.ms
  const formatTimer = (seconds: number) => {
    if (seconds >= 9000) return 'FREE';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Speedometer needle rotation (-130 deg to +130 deg mapped to 0..160 MPH)
  const needleAngle = -130 + Math.min(160, speedMph) * (260 / 160);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none overflow-hidden font-sans">
      {/* ----------------- TOP BAR ----------------- */}
      <div className="flex items-center justify-between gap-2 z-20">
        {/* Left: Timer Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 border border-slate-700/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full shadow-lg text-white">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="font-mono text-lg font-black tracking-wider tabular-nums">
            {formatTimer(timeRemaining)}
          </span>
        </div>

        {/* Center: 3D HUD Navigation Arrow */}
        <div className="flex flex-col items-center">
          <div
            className="flex items-center justify-center w-12 h-12 bg-emerald-500/90 border-2 border-white rounded-full shadow-xl transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${navBearingDeg}deg)` }}
          >
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-white transform -translate-y-0.5" />
          </div>
          <div className="bg-slate-900/80 border border-slate-700 px-2.5 py-0.5 rounded-full mt-1 text-[11px] font-bold text-emerald-300 tracking-wide tabular-nums">
            {navDistanceMeters}m • {navTargetName}
          </div>
        </div>

        {/* Right: Objective Pill & Currency */}
        <div className="flex items-center gap-2">
          {/* Mission Objective */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/85 border border-slate-700/80 px-3.5 py-1.5 rounded-full shadow-lg text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-100 max-w-[200px] truncate">
              {objectiveText}
            </span>
          </div>

          {/* Currency Pill */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 border border-slate-700/80 px-3 py-1.5 rounded-full shadow-lg text-white">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black font-mono tabular-nums text-amber-300">
              {coins.toLocaleString()}
            </span>
            <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white ml-0.5">
              +
            </div>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-full text-white shadow-lg active:scale-95 transition-all"
            title="Pause / Settings"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ----------------- WARNINGS & ALERTS (CENTER) ----------------- */}
      <div className="flex flex-col items-center gap-2 pointer-events-none my-auto z-10">
        {isWrongWay && (
          <div className="flex items-center gap-2 bg-red-600/95 border-2 border-white px-4 py-2 rounded-xl shadow-2xl text-white font-black text-sm tracking-widest animate-bounce">
            <AlertTriangle className="w-6 h-6 text-yellow-300" />
            {t.WRONG_WAY}
          </div>
        )}

        {speedMph > 75 && (
          <div className="flex items-center gap-2 bg-amber-600/90 border border-yellow-300 px-3 py-1 rounded-lg text-white font-bold text-xs tracking-wider">
            <AlertTriangle className="w-4 h-4 text-yellow-200" />
            {t.SLOW_DOWN}
          </div>
        )}

        {/* Parking Hold Progress Banner */}
        {parkingEval?.isInZone && (
          <div className="bg-slate-950/95 border-2 border-emerald-400 px-5 py-3 rounded-2xl shadow-2xl text-center flex flex-col items-center">
            <div className="text-emerald-400 font-black text-sm tracking-wider uppercase mb-1">
              {parkingEval.rating === 'PERFECT'
                ? t.PERFECT
                : parkingEval.rating === 'GREAT'
                ? t.GREAT
                : parkingEval.rating === 'GOOD'
                ? t.GOOD
                : t.HOLD_POSITION}
            </div>
            <div className="text-xs text-slate-300 font-semibold mb-2">
              Accuracy: {parkingEval.accuracyPercent}% • Offset: {parkingEval.distanceToCenter.toFixed(1)}m
            </div>
            {/* Hold progress bar */}
            <div className="w-48 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
                style={{
                  width: `${Math.round(((2.0 - parkingEval.holdTimeRemaining) / 2.0) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-mono text-emerald-300 mt-1 font-bold">
              {parkingEval.isVehicleStopped
                ? `Holding... ${parkingEval.holdTimeRemaining.toFixed(1)}s`
                : 'Stop vehicle to park!'}
            </span>
          </div>
        )}

        {/* Gas Station Refuel Popup */}
        {isNearGasStation && (
          <div className="pointer-events-auto bg-sky-950/95 border-2 border-sky-400 p-3 rounded-2xl shadow-2xl text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-sky-300 font-black text-sm">
              <Fuel className="w-5 h-5 text-amber-400" />
              {t.REFUEL_PROMPT}
            </div>
            <button
              onClick={onRefuel}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95 transition-all"
            >
              {fuel >= 100 ? t.TANK_FULL : `${t.REFUEL_COST}`}
            </button>
          </div>
        )}
      </div>

      {/* ----------------- BOTTOM CONTROLS & DASHBOARD ----------------- */}
      <div className="grid grid-cols-3 items-end gap-2 w-full max-w-5xl mx-auto z-20 pb-1">
        {/* LEFT COLUMN: Camera Switch Button & Brake Pedal */}
        <div className="flex flex-col items-start gap-3">
          {/* Camera Switch Pill Button */}
          <button
            onClick={onCameraSwitch}
            className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-white shadow-xl active:scale-95 transition-all"
            title="Switch Camera View"
          >
            <Camera className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
              {t.CAM_SWITCH} ({cameraMode.toUpperCase()})
            </span>
          </button>

          {/* Brake Pedal (Authentic Perforated Metal Plate) */}
          <div
            onPointerDown={handleBrakeDown}
            onPointerUp={handleBrakeUp}
            onPointerCancel={handleBrakeUp}
            className={`pointer-events-auto cursor-pointer flex flex-col items-center justify-center w-24 sm:w-28 h-36 rounded-2xl border-2 transition-all duration-75 select-none shadow-2xl ${
              isBrakeActive
                ? 'bg-gradient-to-b from-red-950 to-red-800 border-red-500 transform scale-95 translate-y-1'
                : 'bg-gradient-to-b from-slate-800 to-slate-950 border-slate-600 hover:border-slate-500'
            }`}
          >
            {/* Perforated holes pattern */}
            <div className="grid grid-cols-2 gap-2 mb-2 opacity-60">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 shadow-inner" />
              ))}
            </div>
            <span className="text-xs sm:text-sm font-black text-white tracking-widest uppercase">
              {t.BRAKE_PEDAL}
            </span>
          </div>
        </div>

        {/* CENTER COLUMN: Authentic Dashboard Gauge Cluster */}
        <div className="flex flex-col items-center justify-end pb-1">
          {/* Main Dial Speedometer & Gauges */}
          <div className="relative w-44 sm:w-52 h-44 sm:h-52 rounded-full bg-slate-950/90 border-4 border-slate-700 shadow-2xl flex flex-col items-center justify-center text-white overflow-hidden">
            {/* Speedometer Tick Marks */}
            <svg className="absolute inset-0 w-full h-full p-2 pointer-events-none" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#334155"
                strokeWidth="4"
                strokeDasharray="185 280"
                strokeDashoffset="-45"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeDasharray={`${(speedRatio * 185).toFixed(1)} 280`}
                strokeDashoffset="-45"
              />
            </svg>

            {/* Rotating Needle */}
            <div
              className="absolute w-1 h-20 bg-gradient-to-t from-transparent via-red-500 to-red-600 rounded-full origin-bottom transition-transform duration-75 ease-out"
              style={{
                top: '10px',
                transform: `rotate(${needleAngle}deg)`,
                transformOrigin: '50% 100%',
              }}
            />

            {/* Center Dial Hub & Readout */}
            <div className="z-10 flex flex-col items-center mt-4">
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight tabular-nums text-white drop-shadow">
                {speedMph}
              </span>
              <span className="text-[11px] font-black tracking-widest text-sky-400 uppercase -mt-1">
                {t.MPH}
              </span>

              {/* Gear Indicator */}
              <div className="flex items-center gap-1.5 mt-2 bg-slate-900/90 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-black">
                {(['P', 'R', 'N', 'D'] as const).map((g) => (
                  <span
                    key={g}
                    className={`px-1 rounded ${
                      gear === g ? 'bg-sky-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Sub-gauges: Fuel & Condition */}
            <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[10px] font-bold px-2 text-slate-300">
              {/* Fuel */}
              <div className="flex items-center gap-1">
                <Fuel className="w-3 h-3 text-amber-400" />
                <span className={fuel < 20 ? 'text-red-400 animate-pulse' : 'text-slate-300'}>
                  {fuel}%
                </span>
              </div>
              {/* Vehicle Condition */}
              <div className="flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span className={condition < 30 ? 'text-red-400 font-black' : 'text-emerald-300'}>
                  {condition}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Accelerator Pedal & Steering Wheel / Touch Steer */}
        <div className="flex items-end justify-end gap-3">
          {/* Accelerator Pedal (Authentic Perforated Metal Plate) */}
          <div
            onPointerDown={handleThrottleDown}
            onPointerUp={handleThrottleUp}
            onPointerCancel={handleThrottleUp}
            className={`pointer-events-auto cursor-pointer flex flex-col items-center justify-center w-20 sm:w-24 h-40 rounded-2xl border-2 transition-all duration-75 select-none shadow-2xl ${
              isThrottleActive
                ? 'bg-gradient-to-b from-emerald-950 to-emerald-700 border-emerald-400 transform scale-95 translate-y-1'
                : 'bg-gradient-to-b from-slate-800 to-slate-950 border-slate-600 hover:border-slate-500'
            }`}
          >
            {/* Perforated holes pattern */}
            <div className="grid grid-cols-2 gap-2 mb-3 opacity-60">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 shadow-inner" />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs font-black text-white tracking-widest uppercase text-center leading-tight">
              {t.ACCEL_PEDAL}
            </span>
          </div>

          {/* Steering Wheel (Rotatable with Touch Drag) or Buttons */}
          {controlMode === 'buttons' ? (
            <div className="pointer-events-auto flex gap-2">
              <button
                onPointerDown={() => handleSteerBtnDown(-1)}
                onPointerUp={handleSteerBtnUp}
                onPointerCancel={handleSteerBtnUp}
                className={`w-16 h-28 rounded-2xl border-2 flex items-center justify-center text-2xl font-black text-white shadow-2xl select-none ${
                  isSteerLeftActive
                    ? 'bg-sky-600 border-white scale-95'
                    : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                }`}
              >
                ◀
              </button>
              <button
                onPointerDown={() => handleSteerBtnDown(1)}
                onPointerUp={handleSteerBtnUp}
                onPointerCancel={handleSteerBtnUp}
                className={`w-16 h-28 rounded-2xl border-2 flex items-center justify-center text-2xl font-black text-white shadow-2xl select-none ${
                  isSteerRightActive
                    ? 'bg-sky-600 border-white scale-95'
                    : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                }`}
              >
                ▶
              </button>
            </div>
          ) : (
            <div
              ref={wheelRef}
              onPointerDown={handleWheelPointerDown}
              onPointerMove={handleWheelPointerMove}
              onPointerUp={handleWheelPointerUp}
              onPointerCancel={handleWheelPointerUp}
              className="pointer-events-auto relative w-36 sm:w-44 h-36 sm:h-44 rounded-full border-8 border-slate-900 bg-slate-950/70 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-transform duration-75"
              style={{
                transform: `rotate(${wheelAngle}deg)`,
                touchAction: 'none',
              }}
            >
              {/* Outer grip rim styling */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-700/80 pointer-events-none" />

              {/* Three spokes */}
              <div className="absolute w-full h-4 bg-slate-800 rounded pointer-events-none" />
              <div className="absolute w-4 h-full bg-slate-800 rounded pointer-events-none" />

              {/* Center Horn Button with Flag Badge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHonk();
                }}
                className="z-10 w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-slate-900 border-2 border-slate-600 flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform overflow-hidden"
                title="Tap Horn"
              >
                {/* Somaliland Flag Tricolor disk on horn */}
                <div className="w-full h-1/3 bg-emerald-600" />
                <div className="w-full h-1/3 bg-white flex items-center justify-center">
                  <span className="text-[10px] text-black font-black leading-none">★</span>
                </div>
                <div className="w-full h-1/3 bg-red-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
