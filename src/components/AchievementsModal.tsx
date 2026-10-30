import React from 'react';
import {
  X,
  Award,
  Coins,
  Zap,
  CheckCircle,
  Trophy,
  Shield,
  Star,
} from 'lucide-react';
import { Language, PlayerSaveData } from '../types/game';
import { TRANSLATIONS } from '../constants/translations';
import { soundManager } from '../utils/audio';

export interface AchievementItem {
  id: string;
  title: string;
  desc: string;
  rewardCoins: number;
  rewardXp: number;
  isUnlocked: (data: PlayerSaveData) => boolean;
}

export const ACHIEVEMENTS_LIST: AchievementItem[] = [
  {
    id: 'first_park',
    title: 'First Milestone',
    desc: 'Successfully complete any driving or parking mission in the city.',
    rewardCoins: 400,
    rewardXp: 80,
    isUnlocked: (data) => Object.keys(data.completedMissions).length >= 1,
  },
  {
    id: 'perfect_park',
    title: 'Precision Master',
    desc: 'Achieve a PERFECT 5-star parking evaluation score in any mission.',
    rewardCoins: 600,
    rewardXp: 120,
    isUnlocked: (data) =>
      Object.values(data.completedMissions).some((m) => m.stars === 5),
  },
  {
    id: 'fleet_owner',
    title: 'Fleet Collector',
    desc: 'Own 2 or more distinct vehicles in your garage.',
    rewardCoins: 800,
    rewardXp: 150,
    isUnlocked: (data) => data.ownedCarIds.length >= 2,
  },
  {
    id: 'tuner',
    title: 'Street Tuner',
    desc: 'Upgrade any vehicle component (Engine, Brakes, Tires) to Level 3 or higher.',
    rewardCoins: 750,
    rewardXp: 140,
    isUnlocked: (data) =>
      Object.values(data.carUpgrades).some((upg) =>
        Object.values(upg).some((lvl) => lvl >= 3)
      ),
  },
  {
    id: 'level_up',
    title: 'Rising Star',
    desc: 'Reach Player Level 2 or higher.',
    rewardCoins: 1000,
    rewardXp: 200,
    isUnlocked: (data) => data.level >= 2,
  },
  {
    id: 'taxi_run',
    title: 'Metro Chauffeur',
    desc: 'Complete the City Taxi Passenger mission.',
    rewardCoins: 700,
    rewardXp: 130,
    isUnlocked: (data) => !!data.completedMissions['m05'],
  },
  {
    id: 'checkpoint_ace',
    title: 'Checkpoint Sprint Ace',
    desc: 'Complete the Boulevard Checkpoint sprint mission.',
    rewardCoins: 900,
    rewardXp: 180,
    isUnlocked: (data) => !!data.completedMissions['m07'],
  },
  {
    id: 'master_chauffeur',
    title: 'Master Chauffeur Elite',
    desc: 'Complete the Master Chauffeur Test.',
    rewardCoins: 1500,
    rewardXp: 300,
    isUnlocked: (data) => !!data.completedMissions['m10'],
  },
];

interface AchievementsModalProps {
  language: Language;
  saveData: PlayerSaveData;
  onClaimAchievement: (id: string, coins: number, xp: number) => void;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  language,
  saveData,
  onClaimAchievement,
  onClose,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const claimedList = saveData.claimedAchievements || [];

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {t.ACHIEVEMENTS}
              </h2>
              <p className="text-xs text-slate-400">
                Complete milestones to earn bonus coins and experience.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3">
          {ACHIEVEMENTS_LIST.map((ach) => {
            const unlocked = ach.isUnlocked(saveData);
            const claimed = claimedList.includes(ach.id);

            return (
              <div
                key={ach.id}
                className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                  claimed
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : unlocked
                    ? 'bg-slate-950/80 border-amber-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                      claimed
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : unlocked
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white">{ach.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {ach.desc}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        +{ach.rewardCoins}
                      </span>
                      <span className="text-sky-300 font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-sky-400" />
                        +{ach.rewardXp} XP
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {claimed ? (
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold px-3 py-1.5 bg-slate-900 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Claimed</span>
                    </div>
                  ) : unlocked ? (
                    <button
                      onClick={() => {
                        soundManager.playSuccessChime();
                        onClaimAchievement(ach.id, ach.rewardCoins, ach.rewardXp);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95 transition-all"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500 px-3 py-1.5 bg-slate-900/50 rounded-xl">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
