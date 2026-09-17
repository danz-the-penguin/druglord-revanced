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
  Crosshair,
  Globe,
  Coins,
  Skull,
} from 'lucide-react';
import { SYNDICATES, getStandingTier, calculatePeaceTributeCost } from '../engine/syndicates';
import { CITY_MAP, DRUG_MAP } from '../engine/constants';
import { SyndicateId } from '../engine/types';
import { SyndicateImage } from './SyndicateImage';
import {
  calculateTerritoryInfluences,
  calculateProtectionRacketRevenue,
  getStrikeContracts,
} from '../engine/syndicateWarRoom';

export const SyndicateModal: React.FC = () => {
  const isSyndicateModalOpen = useGameStore((s) => s.isSyndicateModalOpen);
  const closeSyndicateModal = useGameStore((s) => s.closeSyndicateModal);
  const player = useGameStore((s) => s.player);
  const acceptContract = useGameStore((s) => s.acceptContract);
  const deliverContract = useGameStore((s) => s.deliverContract);
  const paySyndicateTribute = useGameStore((s) => s.paySyndicateTribute);
  const collectProtectionRacketAction = useGameStore((s) => s.collectProtectionRacketAction);
  const executeStrikeContractAction = useGameStore((s) => s.executeStrikeContractAction);

  const [activeTab, setActiveTab] = useState<'war_room' | 'factions' | 'strikes' | 'contracts'>('war_room');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isSyndicateModalOpen) return null;

  const reputations = player.syndicateReputations || {};
  const allContracts = player.syndicateContracts || [];
  const activeContracts = allContracts.filter((c) => c.status === 'active');
  const availableContracts = allContracts.filter((c) => c.status === 'available');

  const strikeContracts = getStrikeContracts(player);
  const availableStrikes = strikeContracts.filter((s) => s.status !== 'completed');
  const racketRevenue = calculateProtectionRacketRevenue(player);
  const isRacketCollectedToday = player.lastRacketCollectedDay === player.currentDay;
  const territories = calculateTerritoryInfluences(player);

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

  const handleCollectRacket = () => {
    const res = collectProtectionRacketAction();
    setFeedbackMsg({ text: res.message, error: !res.success });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleExecuteStrike = (contractId: string) => {
    const res = executeStrikeContractAction(contractId);
    setFeedbackMsg({ text: res.message, error: !res.success });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-100 tracking-wider">
                  Syndicate War Room & Global Dominance
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300 text-[10px] font-bold">
                  TACTICAL CARTEL COUNCIL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Command global territory influence, collect daily protection racket kickbacks, launch black-ops strikes, and forge syndicate pacts.
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
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('war_room')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'war_room'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>War Room & Influence</span>
            </button>

            <button
              onClick={() => setActiveTab('strikes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'strikes'
                  ? 'bg-red-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Hitman Strikes ({availableStrikes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('factions')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'factions'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>5 Cartel Factions</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'contracts'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Cargo Contracts ({activeContracts.length} Active / {availableContracts.length} Board)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: WAR ROOM & INFLUENCE */}
          {activeTab === 'war_room' && (
            <div className="space-y-6">
              {/* Daily Protection Racket Collection Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <h4 className="font-black text-amber-300 text-sm tracking-wide uppercase">
                      Underworld Protection Racket Treasury
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed font-sans">
                    Syndicates with <strong>Associate (+15)</strong> or <strong>Allied Don (+50)</strong> standing pay daily protection tribute into your war chest. Claim dividends once per day.
                  </p>
                  {racketRevenue.breakdown.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="text-slate-400">Paying Syndicates:</span>
                      {racketRevenue.breakdown.map((b) => (
                        <span
                          key={b.syndicateId}
                          className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/40 text-amber-300 font-bold"
                        >
                          {b.syndicateName}: +${b.amount.toLocaleString()}/day ({b.tier})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-full md:w-auto text-right space-y-2">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-mono block">Daily Dividends</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      ${racketRevenue.totalRevenue.toLocaleString()}
                    </span>
                  </div>

                  {isRacketCollectedToday ? (
                    <button
                      disabled
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs cursor-default"
                    >
                      Dividends Collected (Day {player.currentDay})
                    </button>
                  ) : racketRevenue.totalRevenue > 0 ? (
                    <button
                      onClick={handleCollectRacket}
                      className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      <span>Collect Treasury (${racketRevenue.totalRevenue.toLocaleString()})</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-bold text-xs cursor-default"
                    >
                      No Active Tribute
                    </button>
                  )}
                </div>
              </div>

              {/* Global Territory Dominance Meters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>Global Underworld Territory Dominance (4 Theaters)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Influence scales with syndicate reputation & owned real estate
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {territories.map((t) => {
                    const domSyn = SYNDICATES.find((s) => s.id === t.dominatingSyndicateId);

                    return (
                      <div
                        key={t.region}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-bold text-slate-100 text-sm">{t.region}</h5>
                            <span className="text-[11px] text-slate-400 font-sans block mt-0.5">
                              Dominant Syndicate: <strong className="text-amber-300">{domSyn?.name}</strong>
                            </span>
                          </div>
                          <span className="text-xs font-black text-emerald-400 font-mono">
                            {t.playerInfluence}% Player Control
                          </span>
                        </div>

                        {/* Dominance Progress Bar */}
                        <div className="space-y-1">
                          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                              style={{ width: `${t.playerInfluence}%` }}
                            />
                            <div
                              className="h-full bg-slate-800"
                              style={{ width: `${100 - t.playerInfluence}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>0% Underworld Margin</span>
                            <span>100% Hegemony</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            Safehouse Network Boost:{' '}
                            <strong className="text-slate-200">
                              +{(player.ownedProperties || []).length * 8}%
                            </strong>
                          </span>
                          <span
                            className={
                              t.playerInfluence >= 50
                                ? 'text-emerald-400 font-bold'
                                : t.playerInfluence >= 25
                                ? 'text-amber-400 font-bold'
                                : 'text-slate-500'
                            }
                          >
                            {t.playerInfluence >= 50
                              ? '🏆 Contested Hegemony'
                              : t.playerInfluence >= 25
                              ? '⚡ Strong Foothold'
                              : 'Minor Infiltration'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HITMAN BLACK-OPS STRIKE CONTRACTS */}
          {activeTab === 'strikes' && (
            <div className="space-y-4">
              <div className="bg-red-950/20 border border-red-800/40 p-4 rounded-xl flex items-start gap-3 text-xs text-red-200">
                <Skull className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-red-300">Underworld Black-Ops Wetwork Contracts</div>
                  <p className="mt-0.5 text-slate-300 leading-relaxed font-sans">
                    Execute high-risk elimination contracts commissioned by cartel leadership. You must be present in the designated city to launch the strike. Combat causes tactical damage based on threat level.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {strikeContracts.map((strike) => {
                  const syn = SYNDICATES.find((s) => s.id === strike.syndicateId);
                  const city = CITY_MAP.get(strike.locationCityId);
                  const isHere = player.currentCityId === strike.locationCityId;
                  const isCompleted = strike.status === 'completed';
                  const isHealthLow = player.health < 30;

                  const dangerBadge =
                    strike.dangerLevel === 'extreme'
                      ? 'bg-red-950/80 border-red-600 text-red-300'
                      : strike.dangerLevel === 'high'
                      ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                      : 'bg-sky-950/80 border-sky-600 text-sky-300';

                  const expectedDamage =
                    strike.dangerLevel === 'extreme' ? 30 : strike.dangerLevel === 'high' ? 20 : 12;

                  return (
                    <div
                      key={strike.id}
                      className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isCompleted
                          ? 'bg-slate-950/40 border-slate-800 opacity-60'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-bold text-slate-100 text-sm">{strike.targetName}</h5>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${dangerBadge}`}>
                            {strike.dangerLevel} Hazard (~{expectedDamage} HP)
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                            {syn?.name}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <span>Target: <strong className="text-slate-200">{strike.targetTitle}</strong></span>
                          <span>•</span>
                          <span>Theater: <strong className={isHere ? 'text-emerald-400' : 'text-amber-300'}>{city?.name}</strong></span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed font-sans pt-1">
                          {strike.intelBrief}
                        </p>
                      </div>

                      <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                        <div className="text-left md:text-right font-mono">
                          <div className="text-emerald-400 font-bold text-sm">
                            +${strike.rewardCash.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-sky-400">
                            +{strike.repReward} {syn?.name.split(' ')[0]} Standing
                          </div>
                        </div>

                        {isCompleted ? (
                          <span className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-bold text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Eliminated</span>
                          </span>
                        ) : !isHere ? (
                          <button
                            disabled
                            className="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs cursor-default"
                            title={`You must travel to ${city?.name} to execute this hit`}
                          >
                            Travel to {city?.name}
                          </button>
                        ) : isHealthLow ? (
                          <button
                            disabled
                            className="px-3.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-700 text-rose-300 font-bold text-xs cursor-default"
                          >
                            Health Too Low (&lt;30 HP)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleExecuteStrike(strike.id)}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>Execute Strike</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 5 CARTEL FACTIONS DIPLOMACY */}
          {activeTab === 'factions' && (
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

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
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
          )}

          {/* TAB 4: BULK SMUGGLING CARGO CONTRACTS */}
          {activeTab === 'contracts' && (
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
