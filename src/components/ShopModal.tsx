import React from 'react';
import {
  X,
  ShoppingBag,
  Coins,
  Gem,
  Sparkles,
  Zap,
  Wrench,
  Fuel,
  Check,
} from 'lucide-react';
import { Language, PlayerSaveData } from '../types/game';
import { TRANSLATIONS } from '../constants/translations';
import { soundManager } from '../utils/audio';

interface ShopModalProps {
  language: Language;
  saveData: PlayerSaveData;
  onBuyCoinsWithGems: (coinsAmount: number, gemCost: number) => void;
  onClaimFreeGems: () => void;
  onInstantRepairAll: () => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  language,
  saveData,
  onBuyCoinsWithGems,
  onClaimFreeGems,
  onInstantRepairAll,
  onClose,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const coinBundles = [
    { id: 'starter', coins: 3500, gems: 20, badge: 'Popular' },
    { id: 'pro', coins: 12000, gems: 65, badge: 'Best Value' },
    { id: 'tycoon', coins: 40000, gems: 180, badge: 'Mega' },
  ];

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {t.SHOP}
              </h2>
              <p className="text-xs text-slate-400">
                Exchange gems, buy coin packs, and boost your garage fleet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black font-mono text-amber-300">
                {saveData.coins.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl">
              <Gem className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-black font-mono text-sky-300">
                {saveData.gems.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5">
          {/* Section 1: Gold Coin Packs */}
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Gold Coin Bundles</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {coinBundles.map((b) => {
                const canAfford = saveData.gems >= b.gems;

                return (
                  <div
                    key={b.id}
                    className="relative flex flex-col justify-between bg-slate-950/60 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl text-center shadow-lg"
                  >
                    {b.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md">
                        {b.badge}
                      </span>
                    )}

                    <div className="my-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2 text-amber-400">
                        <Coins className="w-6 h-6" />
                      </div>
                      <span className="text-lg font-black text-white block">
                        +{b.coins.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400">Coins</span>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        soundManager.playSuccessChime();
                        onBuyCoinsWithGems(b.coins, b.gems);
                      }}
                      className={`w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        canAfford
                          ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Gem className="w-3.5 h-3.5" />
                      <span>{b.gems} Gems</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Fleet Perks & Free Gems */}
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Fleet Services & Bonuses</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Daily Free Gem Grant */}
              <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                    <Gem className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">VIP Gem Reward</span>
                    <span className="text-[11px] text-slate-400">+15 Free Gems</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundManager.playSuccessChime();
                    onClaimFreeGems();
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all"
                >
                  Claim
                </button>
              </div>

              {/* Instant Full Fleet Repair Card */}
              <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Master Fleet Overhaul</span>
                    <span className="text-[11px] text-slate-400">Repair all owned vehicles to 100%</span>
                  </div>
                </div>

                <button
                  disabled={saveData.coins < 300}
                  onClick={() => {
                    soundManager.playSuccessChime();
                    onInstantRepairAll();
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                    saveData.coins >= 300
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>300</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
