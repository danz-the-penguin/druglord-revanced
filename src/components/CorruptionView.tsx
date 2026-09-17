import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  CORRUPT_OFFICIALS,
  SOVEREIGN_SANCTUARIES,
  hasActiveOfficial,
  getRicoThreatLevel,
  isSovereignSanctuary,
} from '../engine/corruption';
import { CorruptOfficialId } from '../engine/corruptionTypes';
import { CITY_MAP } from '../engine/constants';
import {
  Radio,
  Shield,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Briefcase,
  Plane,
  Scale,
  DollarSign,
  Lock,
} from 'lucide-react';

export const CorruptionView: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const hireOfficialAction = useGameStore((s) => s.hireOfficialAction);
  const fireOfficialAction = useGameStore((s) => s.fireOfficialAction);
  const bribeGrandJuryAction = useGameStore((s) => s.bribeGrandJuryAction);
  const emergencyExtraditionEscapeAction = useGameStore((s) => s.emergencyExtraditionEscapeAction);
  const buyIntelAction = useGameStore((s) => s.buyIntelAction);

  const [activeTab, setActiveTab] = useState<'wiretaps' | 'officials' | 'rico'>('officials');
  const [selectedSanctuary, setSelectedSanctuary] = useState<string>('dubai');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleHire = (officialId: CorruptOfficialId) => {
    const res = hireOfficialAction(officialId);
    showFeedback(res.message);
  };

  const handleFire = (officialId: CorruptOfficialId) => {
    const res = fireOfficialAction(officialId);
    showFeedback(res.message);
  };

  const handleBribeJury = () => {
    const res = bribeGrandJuryAction(50000);
    showFeedback(res.message);
  };

  const handleEscape = () => {
    const res = emergencyExtraditionEscapeAction(selectedSanctuary);
    showFeedback(res.message);
  };

  const currentCity = CITY_MAP.get(player.currentCityId);
  const currentHeat = player.cityHeat?.[player.currentCityId] ?? 0;
  const ricoMeter = player.ricoMeter ?? 0;
  const threat = getRicoThreatLevel(ricoMeter);
  const activeOfficialsCount = CORRUPT_OFFICIALS.filter((o) => hasActiveOfficial(player, o.id)).length;
  const dailyPayroll = CORRUPT_OFFICIALS.reduce((sum, o) => {
    return sum + (hasActiveOfficial(player, o.id) ? o.dailyRetainer : 0);
  }, 0);

  const isCurrentSanctuary = isSovereignSanctuary(player.currentCityId, player.ownedProperties);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Top Banner Navigation */}
      <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm uppercase">
            <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
            Corruption, Informants & Federal Wiretaps
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Place corrupt officials on your underworld payroll, intercept market tips, and manage federal grand jury scrutiny before RICO asset freezes trigger.
          </p>
        </div>

        {/* Action Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
            <div className="text-[9px] text-slate-400 uppercase">Officials on Retainer</div>
            <div className="text-base font-black text-sky-400">
              {activeOfficialsCount} / {CORRUPT_OFFICIALS.length}
              {dailyPayroll > 0 && (
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  (-${dailyPayroll.toLocaleString()}/d)
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
            <div className="text-[9px] text-slate-400 uppercase">Federal RICO Meter</div>
            <div className={`text-base font-black ${threat.color}`}>
              {ricoMeter}%
              {player.isBankFrozen && (
                <span className="text-[10px] text-rose-400 font-bold ml-1 animate-pulse">
                  [FROZEN]
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('officials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'officials'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Corrupt Officials on Retainer ({activeOfficialsCount})
        </button>

        <button
          onClick={() => setActiveTab('rico')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rico'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" /> Grand Jury RICO Meter ({ricoMeter}%)
          {player.isBankFrozen && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('wiretaps')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'wiretaps'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> Decrypted Market Wiretaps (
          {player.activeIntel?.filter((t) => t.purchased).length ?? 0}/{player.activeIntel?.length ?? 0})
        </button>
      </div>

      {/* Action Notification Toast */}
      {actionFeedback && (
        <div className="bg-slate-900/90 border border-sky-500/50 p-3 rounded-xl text-xs text-sky-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* TAB 1: CORRUPT OFFICIALS ON RETAINER */}
      {activeTab === 'officials' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            💡 <strong>Underworld Retainer Agreement</strong>: Officials require an upfront recruitment bribe to join your payroll, followed by a daily retainer upkeep deducted automatically during calendar advance.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CORRUPT_OFFICIALS.map((official) => {
              const isActive = hasActiveOfficial(player, official.id);
              const stateObj = player.corruptOfficials?.[official.id];
              const canAfford = player.cash + (player.isBankFrozen ? 0 : player.bank) >= official.initialBribeCost;

              return (
                <div
                  key={official.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isActive
                      ? 'bg-slate-950/90 border-sky-500/60 shadow-lg shadow-sky-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Icon & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                        {official.icon}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          isActive
                            ? 'bg-sky-950 text-sky-300 border-sky-600 animate-pulse'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {isActive ? 'Active on Payroll' : 'Available for Bribe'}
                      </span>
                    </div>

                    {/* Official Details */}
                    <div>
                      <h4 className="text-sm font-black text-slate-200">{official.name}</h4>
                      <p className="text-[11px] text-slate-400">{official.roleTitle}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{official.agency}</p>
                    </div>

                    {/* Quote */}
                    <div className="text-[11px] italic text-slate-400 border-l-2 border-slate-700 pl-2">
                      &ldquo;{official.quote}&rdquo;
                    </div>

                    {/* Perk Banner */}
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-sky-400" /> {official.perkTitle}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {official.perkDescription}
                      </p>
                    </div>

                    {/* Financial Specs */}
                    <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60 text-[10px] space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Recruitment Bribe:</span>
                        <span className="font-bold text-emerald-400">
                          ${official.initialBribeCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Daily Upkeep:</span>
                        <span className="font-bold text-amber-400">
                          ${official.dailyRetainer.toLocaleString()}/day
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Monthly Est:</span>
                        <span className="text-slate-400">
                          ~${official.monthlyCostEstimate.toLocaleString()}/mo
                        </span>
                      </div>
                      {stateObj && (
                        <div className="flex justify-between pt-1 border-t border-slate-800 text-[9px] text-slate-500">
                          <span>Total Paid:</span>
                          <span>${stateObj.totalBribesPaid.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    {isActive ? (
                      <button
                        onClick={() => handleFire(official.id)}
                        className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-800 hover:border-rose-800 transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Terminate Retainer
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHire(official.id)}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-950/50 cursor-pointer'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        {canAfford ? `Hire for $${official.initialBribeCost.toLocaleString()}` : 'Insufficient Funds'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FEDERAL GRAND JURY & RICO INDICTMENT METER */}
      {activeTab === 'rico' && (
        <div className="space-y-6">
          {/* Frozen Alert Banner */}
          {player.isBankFrozen && (
            <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-600 flex items-start gap-3 text-rose-200 animate-pulse">
              <Lock className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-black text-sm text-rose-300 uppercase">
                  🚨 SEALED FEDERAL RICO INDICTMENT UNSEALED — BANK ASSETS FROZEN
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  The United States Grand Jury has issued a criminal indictment against your syndicate. All offshore bank accounts are frozen under federal receivership! You must immediately initiate an <strong>Emergency Sovereign Extradition Escape Flight</strong> to a recognized sanctuary to establish diplomatic asylum and restore your funds.
                </p>
              </div>
            </div>
          )}

          {/* Pending Raid Alert Banner */}
          {player.pendingRaidWarning && (
            <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-600 flex items-start gap-3 text-amber-200">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <div className="font-bold text-xs uppercase text-amber-300">
                  🚨 POLICE DISPATCH EARLY WARNING (PRECINCT RAID IMMINENT)
                </div>
                <p className="text-xs text-amber-200/90">
                  {player.pendingRaidWarning.message} Move your product into safehouse vaults or fly to another city before tomorrow morning!
                </p>
              </div>
            </div>
          )}

          {/* Grand Jury Meter Card */}
          <div className="bg-slate-950/90 p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-rose-400" /> Federal Grand Jury Investigation
                </span>
                <h3 className="text-lg font-black text-slate-100">
                  RICO Indictment Threat Meter
                </h3>
              </div>
              <div className={`text-xs uppercase font-bold px-3 py-1 rounded-xl border ${threat.badgeBg}`}>
                {threat.label}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Prosecution Readiness</span>
                <span className={`font-black ${threat.color}`}>{ricoMeter}% / 100%</span>
              </div>
              <div className="h-4 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ricoMeter >= 100
                      ? 'bg-rose-500 animate-pulse'
                      : ricoMeter >= 75
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                      : ricoMeter >= 45
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, ricoMeter))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% Safe</span>
                <span>50% Subpoenas</span>
                <span>75% Warrants</span>
                <span>100% Asset Freeze & Extradition</span>
              </div>
            </div>

            {/* Analysis Grid: Pressures vs Defenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Pressures */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-rose-400 uppercase flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> Active Surveillance Pressures
                </div>
                <ul className="text-xs space-y-1.5 text-slate-300">
                  <li className="flex justify-between items-center">
                    <span>Local City Heat ({currentCity?.name}):</span>
                    <span className={`font-bold ${currentHeat >= 70 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {currentHeat}% {currentHeat >= 70 ? '(+4% to +6%/day)' : '(Normal)'}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Unlaundered Bank Assets:</span>
                    <span className={`font-bold ${player.bank >= 1000000 && (player.ownedBusinesses?.length ?? 0) === 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      ${player.bank.toLocaleString()}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Active Shell Businesses:</span>
                    <span className="font-bold text-slate-300">
                      {player.ownedBusinesses?.length ?? 0} Shells Owned
                    </span>
                  </li>
                </ul>
              </div>

              {/* Defenses */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Active Defenses & Retainers
                </div>
                <ul className="text-xs space-y-1.5 text-slate-300">
                  <li className="flex justify-between items-center">
                    <span>FinCEN Regulatory Auditor:</span>
                    <span className={`font-bold ${hasActiveOfficial(player, 'fincen_auditor') ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {hasActiveOfficial(player, 'fincen_auditor') ? 'ACTIVE (-60% RICO + Passive Decay)' : 'None'}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Offshore Retained Counsel:</span>
                    <span className={`font-bold ${player.corporateUpgrades?.includes('offshore_legal') ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {player.corporateUpgrades?.includes('offshore_legal') ? 'ACTIVE (-40% Growth)' : 'None'}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Current Jurisdiction:</span>
                    <span className={`font-bold ${isCurrentSanctuary ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {currentCity?.name} {isCurrentSanctuary ? '(Sovereign Asylum)' : '(Extradition Risk)'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Direct Payoff: Bribe Grand Jury Prosecutor */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Wire Backchannel Payoff to Grand Jury Special Prosecutor
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Deposit $50,000 to file emergency motions, suppress sealed evidence, and knock -20% off the RICO Indictment Meter.
                </div>
              </div>

              <button
                onClick={handleBribeJury}
                disabled={ricoMeter <= 0 || player.cash < 50000}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ricoMeter > 0 && player.cash >= 50000
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Bribe Prosecutor ($50,000)
              </button>
            </div>
          </div>

          {/* Emergency Sovereign Extradition Escape Flight Section */}
          <div className="bg-slate-950/90 p-6 rounded-2xl border border-rose-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-rose-400 uppercase flex items-center gap-2">
                  <Plane className="w-4 h-4 text-rose-400" /> Emergency Sovereign Extradition Escape Flight
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  When facing sealed indictments, chartered emergency smuggling flights take you to foreign non-extradition sanctuaries to establish legal asylum, quash the federal indictment, and unfreeze bank assets.
                </p>
              </div>
            </div>

            {/* Sanctuary City Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SOVEREIGN_SANCTUARIES.map((sanctuary) => {
                const isSelected = selectedSanctuary === sanctuary.cityId;
                const isHere = player.currentCityId === sanctuary.cityId;

                return (
                  <div
                    key={sanctuary.cityId}
                    onClick={() => !isHere && setSelectedSanctuary(sanctuary.cityId)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isHere
                        ? 'bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-slate-900 border-rose-500 shadow-md shadow-rose-950/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{sanctuary.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{sanctuary.name}</div>
                          <div className="text-[10px] text-slate-400">{sanctuary.country}</div>
                        </div>
                      </div>
                      {isHere && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Current City
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                      {sanctuary.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[9px] text-sky-400 font-medium">
                      🛡️ {sanctuary.extraditionShield}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Escape Execution Button */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Selected Haven: <strong className="text-rose-400">{CITY_MAP.get(selectedSanctuary)?.name}</strong> (Cost: $12,000 charter or fuel).
                {player.isBankFrozen && (
                  <span className="text-amber-400 ml-1">
                    (DOJ levies a 15% settlement fee to release frozen assets).
                  </span>
                )}
              </div>

              <button
                onClick={handleEscape}
                disabled={player.currentCityId === selectedSanctuary}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plane className="w-4 h-4" /> Execute Sovereign Escape Flight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DECRYPTED MARKET WIRETAPS */}
      {activeTab === 'wiretaps' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!player.activeIntel || player.activeIntel.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-500 italic bg-slate-950/50 rounded-2xl border border-slate-800">
                No active wire chatter detected. Advance the calendar or travel to intercept new signals.
              </div>
            ) : (
              player.activeIntel.map((tip) => {
                const daysAway = tip.targetDay - player.currentDay;
                const isToday = daysAway === 0;
                const canAfford = player.cash >= tip.cost;

                return (
                  <div
                    key={tip.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                      tip.purchased
                        ? 'bg-slate-950/90 border-orange-500/60 shadow-lg shadow-orange-950/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold">
                          📡 {tip.source}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            isToday
                              ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {isToday
                            ? '🎯 Expected TODAY (Day ' + tip.targetDay + ')'
                            : `Hits Day ${tip.targetDay} (In ${daysAway}d)`}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                          {tip.cityName}: {tip.drugName}
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.2 rounded uppercase ${
                              tip.eventType === 'surge_spike'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : tip.eventType === 'market_glut'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-sky-950 text-sky-400 border border-sky-800'
                            }`}
                          >
                            {tip.eventType === 'surge_spike'
                              ? '🚀 +100-300% Spike'
                              : tip.eventType === 'market_glut'
                              ? '💥 -50-80% Crash'
                              : '🚨 Police Task Force'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {tip.purchased ? tip.headline : '🔒 Encrypted intercept — purchase decryption key to view.'}
                        </p>
                      </div>

                      {tip.purchased ? (
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                          💡 Tactical Intel: High volatility projected for {tip.drugName} in {tip.cityName} on Day {tip.targetDay}. Leverage vault reserves and flight arbitrage.
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">
                          Decryption clearance will reveal exact timing and market triggers.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-slate-500 text-[10px] uppercase block">Decryption Key</span>
                        <span className="font-black text-emerald-400">
                          {tip.purchased ? 'DECRYPTED' : `$${tip.cost.toLocaleString()}`}
                        </span>
                      </div>

                      {tip.purchased ? (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold border border-slate-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Decrypted
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const res = buyIntelAction(tip.id);
                            showFeedback(res.message);
                          }}
                          disabled={!canAfford}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-md shadow-orange-950/40 cursor-pointer'
                              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          Decrypt Intel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
