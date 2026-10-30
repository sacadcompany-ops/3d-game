import React from 'react';
import {
  Play,
  Compass,
  Wrench,
  Settings,
  Gift,
  Coins,
  Gem,
  Award,
  Globe,
  Car,
  ShieldCheck,
} from 'lucide-react';
import { Language, PlayerSaveData, GameScreen } from '../types/game';
import { TRANSLATIONS } from '../constants/translations';
import { getXpRequiredForLevel } from '../utils/storage';
import { VEHICLES } from '../constants/vehicles';
import { soundManager } from '../utils/audio';

interface MainMenuProps {
  language: Language;
  saveData: PlayerSaveData;
  onNavigate: (screen: GameScreen) => void;
  onClaimDailyReward: () => void;
  onLanguageChange: (lang: Language) => void;
  onQuickPlay: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  language,
  saveData,
  onNavigate,
  onClaimDailyReward,
  onLanguageChange,
  onQuickPlay,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const currentCar = VEHICLES[saveData.currentCarId] || VEHICLES.compact;
  const xpNeeded = getXpRequiredForLevel(saveData.level);
  const xpProgress = Math.min(100, Math.round((saveData.xp / xpNeeded) * 100));

  const today = new Date().toISOString().slice(0, 10);
  const isDailyClaimed = saveData.lastDailyRewardDate === today;

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 z-20 pointer-events-auto select-none">
      {/* ----------------- TOP BAR: PLAYER LEVEL, CURRENCIES, LANGUAGE ----------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl">
        {/* Left: Player Profile & Level */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 border-2 border-white/80 flex items-center justify-center font-black text-white text-base shadow-md">
            {saveData.level}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wider">
                {t.LEVEL} {saveData.level}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {saveData.xp} / {Math.round(xpNeeded)} XP
              </span>
            </div>
            {/* XP progress bar */}
            <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center/Right: Currencies & Language */}
        <div className="flex items-center gap-3">
          {/* Gold Coins */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black font-mono text-amber-300 tabular-nums">
              {saveData.coins.toLocaleString()}
            </span>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-inner">
            <Gem className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-black font-mono text-sky-300 tabular-nums">
              {saveData.gems.toLocaleString()}
            </span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-xl">
            {(['en', 'so', 'ar'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  soundManager.playClick();
                  onLanguageChange(lang);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                  language === lang
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ----------------- TITLE & BRAND HERO ----------------- */}
      <div className="my-auto max-w-xl">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full mb-3 backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-black tracking-widest text-emerald-300 uppercase">
            3D Simulator Engine • Hargeisa Edition
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-none">
          URBAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300">DRIVE 3D</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 font-medium drop-shadow max-w-md">
          {t.SUBTITLE}
        </p>

        {/* Selected Car Showcase Card */}
        <div className="mt-4 inline-flex items-center gap-3 bg-slate-950/70 border border-slate-800 p-3 rounded-2xl backdrop-blur-md">
          <Car className="w-6 h-6 text-sky-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {t.SELECTED} {t.CARS}
            </span>
            <span className="text-sm font-black text-white">{currentCar.name}</span>
          </div>
        </div>
      </div>

      {/* ----------------- BOTTOM NAVIGATION DOCK ----------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        {/* Daily Reward Banner */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-xl">
          <Gift className="w-6 h-6 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-white">{t.DAILY_REWARD}</span>
            <span className="text-[11px] text-slate-400 font-medium">+500 Gold Coins</span>
          </div>
          <button
            disabled={isDailyClaimed}
            onClick={onClaimDailyReward}
            className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              !isDailyClaimed
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isDailyClaimed ? t.REWARD_CLAIMED : t.CLAIM_REWARD}
          </button>
        </div>

        {/* Main Menu Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Garage */}
          <button
            onClick={() => onNavigate('garage')}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3.5 py-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl active:scale-95 transition-all"
          >
            <Wrench className="w-4 sm:w-5 h-4 sm:h-5 text-sky-400" />
            <span>{t.GARAGE}</span>
          </button>

          {/* Missions */}
          <button
            onClick={() => onNavigate('missions')}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3.5 py-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl active:scale-95 transition-all"
          >
            <Compass className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" />
            <span>{t.MISSIONS}</span>
          </button>

          {/* Shop */}
          <button
            onClick={() => onNavigate('shop')}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3.5 py-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl active:scale-95 transition-all"
          >
            <Coins className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400" />
            <span>{t.SHOP}</span>
          </button>

          {/* Achievements */}
          <button
            onClick={() => onNavigate('achievements')}
            className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-2xl text-white shadow-xl active:scale-95 transition-all"
            title={t.ACHIEVEMENTS}
          >
            <Award className="w-4 sm:w-5 h-4 sm:h-5 text-amber-300" />
          </button>

          {/* Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-2xl text-white shadow-xl active:scale-95 transition-all"
            title={t.SETTINGS}
          >
            <Settings className="w-4 sm:w-5 h-4 sm:h-5 text-slate-300" />
          </button>

          {/* Primary PLAY CTA */}
          <button
            onClick={onQuickPlay}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-6 sm:px-7 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-2xl active:scale-95 transition-all"
          >
            <Play className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
            <span>{t.PLAY}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
