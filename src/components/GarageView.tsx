import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Wrench,
  Sparkles,
  Palette,
  Shield,
  Gauge,
  Zap,
  Disc,
  Fuel,
  ArrowRight,
  Coins,
  Lock,
  Check,
} from 'lucide-react';
import {
  CarId,
  CarUpgrades,
  CarCustomization,
  Language,
  PlayerSaveData,
} from '../types/game';
import { VEHICLES, VEHICLE_LIST } from '../constants/vehicles';
import { TRANSLATIONS } from '../constants/translations';
import { calculateRepairCost } from '../utils/storage';
import { soundManager } from '../utils/audio';

interface GarageViewProps {
  language: Language;
  saveData: PlayerSaveData;
  onSelectCar: (carId: CarId) => void;
  onUnlockCar: (carId: CarId) => void;
  onRepairCar: (carId: CarId, cost: number) => void;
  onUpgradeCar: (carId: CarId, category: keyof CarUpgrades, cost: number) => void;
  onCustomizeCar: (carId: CarId, customization: Partial<CarCustomization>) => void;
  onStartDrive: () => void;
  onBackToMenu: () => void;
  onRotateCar: (deltaX: number) => void;
}

export const GarageView: React.FC<GarageViewProps> = ({
  language,
  saveData,
  onSelectCar,
  onUnlockCar,
  onRepairCar,
  onUpgradeCar,
  onCustomizeCar,
  onStartDrive,
  onBackToMenu,
  onRotateCar,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [activeTab, setActiveTab] = useState<'stats' | 'upgrades' | 'customize'>('stats');
  const [carIndex, setCarIndex] = useState(() =>
    Math.max(0, VEHICLE_LIST.findIndex((v) => v.id === saveData.currentCarId))
  );

  const currentDef = VEHICLE_LIST[carIndex] || VEHICLE_LIST[0];
  const isOwned = saveData.ownedCarIds.includes(currentDef.id);
  const isSelected = saveData.currentCarId === currentDef.id;
  const condition = saveData.carConditions[currentDef.id] ?? 100;
  const upgrades = saveData.carUpgrades[currentDef.id];
  const customization = saveData.carCustomizations[currentDef.id];
  const repairCost = calculateRepairCost(condition);

  // Swipe / Drag turntable rotation
  const isDragging = React.useRef(false);
  const lastX = React.useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    onRotateCar(delta);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePrevCar = () => {
    soundManager.playClick();
    const nextIdx = (carIndex - 1 + VEHICLE_LIST.length) % VEHICLE_LIST.length;
    setCarIndex(nextIdx);
    onSelectCar(VEHICLE_LIST[nextIdx].id);
  };

  const handleNextCar = () => {
    soundManager.playClick();
    const nextIdx = (carIndex + 1) % VEHICLE_LIST.length;
    setCarIndex(nextIdx);
    onSelectCar(VEHICLE_LIST[nextIdx].id);
  };

  const renderStarRating = (value: number) => {
    const full = Math.floor(value);
    const hasHalf = value - full >= 0.5;
    return (
      <div className="flex gap-1 text-amber-400 text-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < full ? 'text-amber-400' : (i === full && hasHalf) ? 'text-amber-300' : 'text-slate-700'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  // Upgrade costs calculation (Level 1->2: 400, 2->3: 800, 3->4: 1500, 4->5: 3000)
  const getUpgradeCost = (currentLvl: number) => {
    const costs = [0, 400, 850, 1600, 3200];
    return costs[currentLvl] || 5000;
  };

  const paintPalette = [
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Somaliland Tri-Color', hex: '#16a34a', livery: true },
    { name: 'Sapphire', hex: '#3b82f6' },
    { name: 'Crimson', hex: '#ef4444' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Obsidian', hex: '#0f172a' },
    { name: 'Pure White', hex: '#f8fafc' },
    { name: 'Cyber Gold', hex: '#eab308' },
  ];

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 flex flex-col justify-between p-4 z-20 pointer-events-auto select-none"
    >
      {/* ----------------- TOP BAR ----------------- */}
      <div className="flex items-center justify-between gap-3">
        {/* Back Button */}
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-sky-400" />
          <span>{t.EXIT_TO_MENU}</span>
        </button>

        {/* Title & Currency */}
        <div className="flex items-center gap-3">
          {/* Repair Alert Badge */}
          <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-700 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="text-xs font-bold text-slate-300">{t.CONDITION}:</span>
            <span className={`text-xs font-black ${condition < 100 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {condition}%
            </span>
            {condition < 100 ? (
              <button
                onClick={() => onRepairCar(currentDef.id, repairCost)}
                className="ml-1.5 px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full text-[11px] font-black flex items-center gap-1 shadow-md active:scale-95 transition-all"
              >
                <Wrench className="w-3 h-3" />
                {t.REPAIR} ({repairCost} {t.REPAIR_COST})
              </button>
            ) : (
              <span className="text-[10px] text-emerald-400 font-bold ml-1">
                ✓ {t.NO_NEED_TO_REPAIR}
              </span>
            )}
          </div>

          {/* Coins Counter */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 border border-slate-700 px-3.5 py-1.5 rounded-full shadow-lg text-white font-mono font-black text-sm text-amber-300">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{saveData.coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ----------------- CAR SELECTOR ARROWS (LEFT & RIGHT) ----------------- */}
      <div className="flex items-center justify-between pointer-events-none px-2 my-auto">
        <button
          onClick={handlePrevCar}
          className="pointer-events-auto p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-sky-400 text-white shadow-2xl active:scale-90 transition-all"
          title="Previous Car"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Drag to rotate 360 hint */}
        <div className="bg-slate-950/70 border border-slate-800 px-3 py-1 rounded-full text-[11px] text-slate-400 font-bold backdrop-blur-xs">
          ↻ Drag anywhere to rotate 360°
        </div>

        <button
          onClick={handleNextCar}
          className="pointer-events-auto p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-sky-400 text-white shadow-2xl active:scale-90 transition-all"
          title="Next Car"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* ----------------- BOTTOM PANEL: STATS / UPGRADES / CUSTOMIZE ----------------- */}
      <div className="w-full max-w-4xl mx-auto bg-slate-950/90 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3">
        {/* Header: Car Name, Category & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {currentDef.name}
              </h2>
              <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                {currentDef.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-md truncate">
              {currentDef.description}
            </p>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === 'stats' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              {t.STATS}
            </button>
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === 'upgrades' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.UPGRADE}
            </button>
            <button
              onClick={() => setActiveTab('customize')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === 'customize' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              {t.CUSTOMIZE}
            </button>
          </div>
        </div>

        {/* Tab 1: Stats Radar / Bars */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-1">
            <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{t.SPEED}</span>
              {renderStarRating(currentDef.stats.speed + (upgrades.engine - 1) * 0.3)}
            </div>
            <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{t.ACCELERATION}</span>
              {renderStarRating(currentDef.stats.acceleration + (upgrades.transmission - 1) * 0.3)}
            </div>
            <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{t.BRAKING}</span>
              {renderStarRating(currentDef.stats.brake + (upgrades.brakes - 1) * 0.3)}
            </div>
            <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{t.HANDLING}</span>
              {renderStarRating(currentDef.stats.handling + (upgrades.tires - 1) * 0.3)}
            </div>
            <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{t.DURABILITY}</span>
              {renderStarRating(currentDef.stats.durability + (upgrades.durability - 1) * 0.3)}
            </div>
            <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{t.FUEL}</span>
              {renderStarRating(currentDef.stats.fuel + (upgrades.fuelSystem - 1) * 0.3)}
            </div>
          </div>
        )}

        {/* Tab 2: Upgrades (Engine, Transmission, Brakes, Tires, Durability, Fuel) */}
        {activeTab === 'upgrades' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {(
              [
                { key: 'engine', label: t.ENGINE, icon: Zap },
                { key: 'transmission', label: t.TRANSMISSION, icon: Gauge },
                { key: 'brakes', label: t.BRAKES, icon: Disc },
                { key: 'tires', label: t.TIRES, icon: Disc },
                { key: 'durability', label: t.SUSPENSION, icon: Shield },
                { key: 'fuelSystem', label: t.FUEL_SYSTEM, icon: Fuel },
              ] as const
            ).map((item) => {
              const lvl = upgrades[item.key] || 1;
              const isMax = lvl >= 5;
              const cost = getUpgradeCost(lvl);
              const canAfford = saveData.coins >= cost;

              return (
                <div
                  key={item.key}
                  className="flex flex-col justify-between bg-slate-900/70 border border-slate-800 p-2.5 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <item.icon className="w-3.5 h-3.5 text-sky-400" />
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono font-black text-amber-400">
                      Lvl {lvl}/5
                    </span>
                  </div>

                  {/* Level dots */}
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < lvl ? 'bg-sky-400' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  {isMax ? (
                    <span className="text-[10px] font-black text-emerald-400 text-center py-1">
                      {t.MAX_LEVEL}
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => onUpgradeCar(currentDef.id, item.key, cost)}
                      className={`w-full py-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3 h-3" />
                      {cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Customization (Paint colors, Spoilers, Rims, Window Tints, Headlights) */}
        {activeTab === 'customize' && (
          <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
            {/* Paint Palette */}
            <div>
              <span className="text-xs font-bold text-slate-300 mb-1.5 block">
                {t.CUSTOM_PAINT}
              </span>
              <div className="flex flex-wrap gap-2">
                {paintPalette.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      soundManager.playClick();
                      onCustomizeCar(currentDef.id, {
                        color: p.hex,
                        hasLivery: !!p.livery,
                      });
                    }}
                    className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                      customization.color === p.hex && (!p.livery || customization.hasLivery)
                        ? 'border-white scale-110 shadow-sky-500/30'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: p.hex }}
                    title={p.name}
                  >
                    {customization.color === p.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Spoilers & Rims */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-bold text-slate-300 mb-1 block">{t.CUSTOM_SPOILER}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['none', 'lip', 'sport', 'gt'] as const).map((sp) => (
                    <button
                      key={sp}
                      onClick={() => onCustomizeCar(currentDef.id, { spoiler: sp })}
                      className={`py-1 px-2 rounded-lg text-[11px] font-black uppercase transition-all ${
                        customization.spoiler === sp
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-300 mb-1 block">{t.CUSTOM_LIGHTS}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['white', 'halogen', 'amber', 'cyan'] as const).map((hl) => (
                    <button
                      key={hl}
                      onClick={() => onCustomizeCar(currentDef.id, { headlights: hl })}
                      className={`py-1 px-2 rounded-lg text-[11px] font-black uppercase transition-all ${
                        customization.headlights === hl
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {hl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions: Select / Unlock / Drive */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {!isOwned ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>
                  {currentDef.unlockLevel > saveData.level
                    ? `${t.REQUIRES_LEVEL} ${currentDef.unlockLevel}`
                    : `${currentDef.price.toLocaleString()} Coins`}
                </span>
              </div>
            ) : (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                {isSelected ? t.SELECTED : 'Owned'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isOwned ? (
              <button
                disabled={saveData.coins < currentDef.price || saveData.level < currentDef.unlockLevel}
                onClick={() => onUnlockCar(currentDef.id)}
                className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center gap-1.5 transition-all ${
                  saveData.coins >= currentDef.price && saveData.level >= currentDef.unlockLevel
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Coins className="w-4 h-4" />
                {t.UNLOCK_FOR} {currentDef.price.toLocaleString()}
              </button>
            ) : !isSelected ? (
              <button
                onClick={() => onSelectCar(currentDef.id)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all"
              >
                {t.SELECT}
              </button>
            ) : null}

            {/* DRIVE CTA */}
            {isOwned && (
              <button
                onClick={onStartDrive}
                className="px-7 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>{t.DRIVE}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
