import React from 'react';
import {
  X,
  Sliders,
  Monitor,
  Gamepad2,
  Volume2,
  Sun,
  Globe,
  RotateCcw,
  Home,
  Play,
  VolumeX,
} from 'lucide-react';
import { GameSettings, Language } from '../types/game';
import { TRANSLATIONS } from '../constants/translations';
import { soundManager } from '../utils/audio';

interface SettingsModalProps {
  language: Language;
  settings: GameSettings;
  isPausedMode?: boolean;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResume?: () => void;
  onRetry?: () => void;
  onExitToMenu?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  language,
  settings,
  isPausedMode = false,
  onUpdateSettings,
  onResume,
  onRetry,
  onExitToMenu,
  onClose,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-black text-white tracking-wide">
              {isPausedMode ? 'PAUSED' : t.SETTINGS_TITLE}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5 text-xs">
          {/* Pause Resume Options if paused */}
          {isPausedMode && (
            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <button
                onClick={onResume}
                className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>
              <button
                onClick={onRetry}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.RETRY}</span>
              </button>
              <button
                onClick={onExitToMenu}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>{t.EXIT_TO_MENU}</span>
              </button>
            </div>
          )}

          {/* Controls Scheme */}
          <div>
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Gamepad2 className="w-4 h-4 text-sky-400" />
              <span>{t.CONTROLS}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'wheel', label: t.STEERING_WHEEL },
                  { id: 'buttons', label: t.BUTTONS },
                  { id: 'tilt', label: t.TILT_GYRO },
                  { id: 'keyboard', label: 'WASD / Keys' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    soundManager.playClick();
                    onUpdateSettings({ controlMode: m.id });
                  }}
                  className={`py-2 px-2 rounded-xl font-black text-center transition-all ${
                    settings.controlMode === m.id
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Graphics Quality & Traffic Density */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-white font-bold mb-2">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <span>{t.GRAPHICS}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ graphicsQuality: g });
                    }}
                    className={`py-1.5 px-2 rounded-xl font-black uppercase text-center transition-all ${
                      settings.graphicsQuality === g
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-white font-bold mb-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{t.TRAFFIC_DENSITY}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ trafficDensity: d });
                    }}
                    className={`py-1.5 px-2 rounded-xl font-black uppercase text-center transition-all ${
                      settings.trafficDensity === d
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    {t[d.toUpperCase()] || d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audio Sliders */}
          <div>
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>{t.AUDIO}</span>
            </div>
            <div className="flex flex-col gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Master Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    soundManager.setMasterVolume(vol);
                    onUpdateSettings({ masterVolume: vol });
                  }}
                  className="w-40 accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Language Switcher */}
          <div>
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>{t.LANGUAGE}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English' },
                { id: 'so', label: 'Af-Soomaali' },
                { id: 'ar', label: 'العربية' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    soundManager.playClick();
                    onUpdateSettings({ language: l.id as Language });
                  }}
                  className={`py-2 px-3 rounded-xl font-black text-center transition-all ${
                    settings.language === l.id
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-lg"
          >
            {t.SAVE_CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
};
