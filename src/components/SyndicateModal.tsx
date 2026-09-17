import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  Shield,
  X,
  Clock,
  DollarSign,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { SYNDICATES, getStandingTier, calculatePeaceTributeCost } from '../engine/syndicates';
import { CITY_MAP, DRUG_MAP } from '../engine/constants';
import { SyndicateId } from '../engine/types';
import { SyndicateImage } from './SyndicateImage';

export const SyndicateModal: React.FC = () => {
  const isSyndicateModalOpen = useGameStore((s) => s.isSyndicateModalOpen);
  const closeSyndicateModal = useGameStore((s) => s.closeSyndicateModal);
  const player = useGameStore((s) => s.player);
  const acceptContract = useGameStore((s) => s.acceptContract);
  const deliverContract = useGameStore((s) => s.deliverContract);
  const paySyndicateTribute = useGameStore((s) => s.paySyndicateTribute);

  const [activeTab, setActiveTab] = useState<'factions' | 'contracts'>('factions');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isSyndicateModalOpen) return null;

  const reputations = player.syndicateReputations || {};
  const allContracts = player.syndicateContracts || [];
  const activeContracts = allContracts.filter((c) => c.status === 'active');
  const availableContracts = allContracts.filter((c) => c.status === 'available');

  const handleAccept = (contractId: string) => {
    const res = acceptContract(contractId);
    setFeedbackMsg({ text: res.message, error: !res.success });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDeliver = (contractId: string) => {
    const res = deliverContract(contractId);
    setFeedbackMsg({ text: res.message, error: !res.success });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleTribute = (synId: SyndicateId) => {
    const res = paySyndicateTribute(synId);
    setFeedbackMsg({ text: res.message, error: !res.success });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl">
              🤝
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-100 tracking-wider">
                  Global Syndicate Factions & Cartel Diplomacy
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300 text-[10px] font-bold">
                  UNDERWORLD COUNCIL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage diplomatic relations, fulfill bulk cartel contracts, and unlock wholesale black-market discounts.
              </p>
            </div>
          </div>

          <button
            onClick={closeSyndicateModal}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('factions')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'factions'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>5 Crime Syndicates</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'contracts'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Smuggling Contracts ({activeContracts.length} Active / {availableContracts.length} Available)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Cash: <strong className="text-emerald-400">${player.cash.toLocaleString()}</strong>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2 text-xs font-bold text-center border-b ${
              feedbackMsg.error
                ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                : 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'factions' ? (
            <div className="space-y-4">
              {SYNDICATES.map((syndicate) => {
                const rep = reputations[syndicate.id] ?? 0;
                const tier = getStandingTier(rep);
                const tributeCost = calculatePeaceTributeCost(rep);

                const tierBadgeColor =
                  tier === 'Allied Don'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : tier === 'Associate'
                    ? 'bg-sky-950/80 border-sky-500 text-sky-300'
                    : tier === 'Neutral'
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : tier === 'Hostile'
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                    : 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse';

                return (
                  <div
                    key={syndicate.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <SyndicateImage syndicate={syndicate} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-100 text-sm tracking-wide">
                              {syndicate.name}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-normal">
                              "{syndicate.moniker}"
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Leader: <strong className="text-slate-300">{syndicate.leader}</strong></span>
                            <span>•</span>
                            <span>HQ: <strong className="text-slate-300">{syndicate.headquarters}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg border text-xs font-black uppercase ${tierBadgeColor}`}>
                          {tier} ({rep > 0 ? `+${rep}` : rep})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {syndicate.description}
                    </p>

                    {/* Standing Meter */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>-100 Nemesis</span>
                        <span>0 Neutral</span>
                        <span>+100 Allied Don</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                        {/* Negative bar */}
                        <div className="w-1/2 flex justify-end bg-slate-900">
                          {rep < 0 && (
                            <div
                              className="h-full bg-rose-500 rounded-l-full"
                              style={{ width: `${Math.min(100, Math.abs(rep))}%` }}
                            />
                          )}
                        </div>
                        {/* Positive bar */}
                        <div className="w-1/2 flex justify-start bg-slate-900 border-l border-slate-700">
                          {rep > 0 && (
                            <div
                              className="h-full bg-emerald-500 rounded-r-full"
                              style={{ width: `${Math.min(100, rep)}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Perks & Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Specialties:</span>
                        {syndicate.specialtyDrugs.map((dId) => (
                          <span
                            key={dId}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold"
                          >
                            {DRUG_MAP.get(dId)?.name ?? dId}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {tier === 'Allied Don' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                            <Sparkles className="w-3.5 h-3.5" /> 30% Wholesale Discount Active
                          </span>
                        ) : tier === 'Associate' ? (
                          <span className="text-sky-400 font-bold flex items-center gap-1 text-xs">
                            <Sparkles className="w-3.5 h-3.5" /> 15% Wholesale Discount Active
                          </span>
                        ) : rep < 0 ? (
                          <button
                            onClick={() => handleTribute(syndicate.id)}
                            disabled={player.cash < tributeCost}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all shadow"
                          >
                            Pay Truce Tribute (${tributeCost.toLocaleString()})
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">Deliver contracts to earn reputation</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Contracts */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Active Syndicate Contracts ({activeContracts.length})
                </div>

                {activeContracts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 text-xs text-center">
                    No active contracts signed. Accept a contract from the board below!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeContracts.map((c) => {
                      const drug = DRUG_MAP.get(c.drugId);
                      const destCity = CITY_MAP.get(c.destinationCityId);
                      const playerHasUnits = player.inventory[c.drugId]?.units ?? 0;
                      const isAtDestination = player.currentCityId === c.destinationCityId;
                      const canDeliver = isAtDestination && playerHasUnits >= c.unitsRequired;

                      return (
                        <div
                          key={c.id}
                          className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-2.5"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-200 text-sm">{c.title}</div>
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                                <span>Cargo: <strong className="text-slate-200">{c.unitsRequired}x {drug?.name}</strong></span>
                                <span>•</span>
                                <span>Destination: <strong className="text-amber-300">{destCity?.name}</strong></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/60 text-amber-300 font-mono text-xs font-bold">
                                {c.daysRemaining} days left
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs font-mono">
                            <div className="flex gap-4">
                              <span>Payout: <strong className="text-emerald-400">${c.payoutCash.toLocaleString()}</strong></span>
                              <span>Rep Reward: <strong className="text-sky-400">+{c.repReward}</strong></span>
                              <span>Held in Briefcase: <strong className={playerHasUnits >= c.unitsRequired ? 'text-emerald-400' : 'text-rose-400'}>{playerHasUnits}/{c.unitsRequired}</strong></span>
                            </div>

                            <button
                              onClick={() => handleDeliver(c.id)}
                              disabled={!canDeliver}
                              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Deliver Cargo</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Available Contracts */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Available Syndicate Contracts
                </div>

                <div className="space-y-2">
                  {availableContracts.map((c) => {
                    const drug = DRUG_MAP.get(c.drugId);
                    const destCity = CITY_MAP.get(c.destinationCityId);

                    return (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-200">{c.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                            <span>Deliver: <strong className="text-slate-300">{c.unitsRequired}x {drug?.name}</strong></span>
                            <span>Target: <strong className="text-sky-300">{destCity?.name}</strong></span>
                            <span>Deadline: <strong className="text-amber-300">{c.daysRemaining} days</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono">
                            <div className="text-emerald-400 font-bold">${c.payoutCash.toLocaleString()}</div>
                            <div className="text-[10px] text-sky-400">+{c.repReward} Cartel Rep</div>
                          </div>

                          <button
                            onClick={() => handleAccept(c.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1"
                          >
                            <span>Accept</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
