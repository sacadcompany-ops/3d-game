import React, { useState } from 'react';
import {
  X,
  Compass,
  Clock,
  Coins,
  Zap,
  ShieldAlert,
  Star,
  CheckCircle,
  Play,
  Navigation,
} from 'lucide-react';
import { MissionDefinition, Language, PlayerSaveData } from '../types/game';
import { MISSIONS, FREE_DRIVE_MISSION } from '../constants/missions';
import { TRANSLATIONS } from '../constants/translations';
import { soundManager } from '../utils/audio';

interface MissionsModalProps {
  language: Language;
  saveData: PlayerSaveData;
  onSelectMission: (mission: MissionDefinition) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  language,
  saveData,
  onSelectMission,
  onClose,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [filter, setFilter] = useState<'all' | 'parking' | 'traffic' | 'special'>('all');

  const filteredMissions = MISSIONS.filter((m) => {
    if (filter === 'parking') {
      return (
        m.type === 'speed_parking' ||
        m.type === 'normal_parking' ||
        m.type === 'reverse_parking' ||
        m.type === 'parallel_parking'
      );
    }
    if (filter === 'traffic') {
      return m.type === 'traffic_driving' || m.type === 'delivery' || m.type === 'taxi';
    }
    if (filter === 'special') {
      return (
        m.type === 'checkpoint_race' ||
        m.type === 'emergency' ||
        m.type === 'time_challenge' ||
        m.type === 'precision_driving'
      );
    }
    return true;
  });

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {t.MISSIONS}
              </h2>
              <p className="text-xs text-slate-400">
                Choose a driving or parking mission to earn coins and level up.
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

        {/* Category Filters */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800/80 bg-slate-900/50 overflow-x-auto">
          {[
            { id: 'all', label: 'All Missions' },
            { id: 'parking', label: 'Parking Bays' },
            { id: 'traffic', label: 'City & Traffic' },
            { id: 'special', label: 'Challenges' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playClick();
                setFilter(cat.id as typeof filter);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                filter === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Quick Free Drive CTA */}
          <button
            onClick={() => {
              soundManager.playClick();
              onSelectMission(FREE_DRIVE_MISSION);
            }}
            className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-black bg-sky-500/20 border border-sky-400 text-sky-300 hover:bg-sky-500 hover:text-slate-950 whitespace-nowrap transition-all flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            {t.FREE_DRIVE}
          </button>
        </div>

        {/* Missions Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredMissions.map((mission) => {
            const title = t[mission.titleKey] || mission.titleKey;
            const desc = t[mission.descriptionKey] || mission.descriptionKey;
            const progress = saveData.completedMissions[mission.id];

            return (
              <div
                key={mission.id}
                className="flex flex-col justify-between bg-slate-950/60 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl shadow-lg transition-all group"
              >
                <div>
                  {/* Top: Difficulty Stars & Saved Stars */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < mission.difficulty
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {progress ? (
                      <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-black">
                        <CheckCircle className="w-3 h-3" />
                        <span>Completed ({progress.stars}★)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {mission.type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                </div>

                {/* Specs & Rewards footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    {/* Time */}
                    <div className="flex items-center gap-1 text-slate-300 font-mono">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>{mission.timeLimit}s</span>
                    </div>

                    {/* Reward Coins */}
                    <div className="flex items-center gap-1 text-amber-300 font-black font-mono">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>+{mission.rewardCoins}</span>
                    </div>

                    {/* Reward XP */}
                    <div className="flex items-center gap-1 text-sky-300 font-bold font-mono">
                      <Zap className="w-3.5 h-3.5 text-sky-400" />
                      <span>+{mission.rewardXp} XP</span>
                    </div>
                  </div>

                  {/* START CTA */}
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onSelectMission(mission);
                    }}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t.START_MISSION}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
