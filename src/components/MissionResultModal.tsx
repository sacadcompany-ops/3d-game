import React from 'react';
import {
  Trophy,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Coins,
  Zap,
  Star,
  RotateCcw,
  ArrowRight,
  Wrench,
  Home,
  CheckCircle,
} from 'lucide-react';
import { MissionResult, MissionDefinition, Language } from '../types/game';
import { TRANSLATIONS } from '../constants/translations';
import { soundManager } from '../utils/audio';

interface MissionResultModalProps {
  language: Language;
  mission: MissionDefinition;
  result: MissionResult;
  onNextMission: () => void;
  onRetry: () => void;
  onGoToGarage: () => void;
  onGoToMenu: () => void;
}

export const MissionResultModal: React.FC<MissionResultModalProps> = ({
  language,
  mission,
  result,
  onNextMission,
  onRetry,
  onGoToGarage,
  onGoToMenu,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isSuccess = result.completed;

  // Format time taken
  const mins = Math.floor(result.timeTaken / 60);
  const secs = Math.floor(result.timeTaken % 60);
  const ms = Math.floor((result.timeTaken % 1) * 100);
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 text-center flex flex-col items-center">
        {/* Success / Failure Icon Header */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl mb-3 border-2 ${
            isSuccess
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 border-white text-slate-950'
              : 'bg-gradient-to-tr from-red-600 to-rose-400 border-white text-white'
          }`}
        >
          {isSuccess ? (
            <Trophy className="w-10 h-10 fill-current" />
          ) : (
            <AlertOctagon className="w-10 h-10" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
          {isSuccess ? t.MISSION_COMPLETE : t.MISSION_FAILED}
        </h2>

        {/* Failure reason or Success subtitle */}
        <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 mb-4">
          {isSuccess ? (
            <span className="text-emerald-400 font-bold">
              {t[result.parkingRating] || result.parkingRating} ({result.parkingAccuracy}% accuracy)
            </span>
          ) : (
            <span className="text-red-400 font-bold">
              {result.failureReason || t.FAIL_TIMEOUT}
            </span>
          )}
        </p>

        {/* Star Rating on Success */}
        {isSuccess && (
          <div className="flex gap-2 text-amber-400 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-7 h-7 ${
                  i < result.stars ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-800'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full bg-slate-950/60 border border-slate-800 p-3 rounded-2xl mb-5 text-left text-xs">
          <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl">
            <Clock className="w-4 h-4 text-sky-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">{t.TIME_TAKEN}</span>
              <span className="font-mono font-bold text-white text-sm">{formattedTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">{t.DAMAGE_TAKEN}</span>
              <span className="font-mono font-bold text-white text-sm">{result.damageTaken}%</span>
            </div>
          </div>

          {isSuccess && (
            <>
              <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl">
                <Coins className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Coins Earned</span>
                  <span className="font-mono font-black text-amber-300 text-sm">
                    +{result.coinsEarned}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl">
                <Zap className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">XP Earned</span>
                  <span className="font-mono font-black text-sky-300 text-sm">
                    +{result.xpEarned} XP
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {isSuccess ? (
            <button
              onClick={() => {
                soundManager.playClick();
                onNextMission();
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>{t.NEXT_MISSION}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                onRetry();
              }}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.RETRY}</span>
            </button>
          )}

          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                soundManager.playClick();
                onRetry();
              }}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.RETRY}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onGoToGarage();
              }}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t.GARAGE}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onGoToMenu();
              }}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.EXIT_TO_MENU}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
