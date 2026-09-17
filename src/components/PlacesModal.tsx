import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  LOAN_SHARKS,
  SHARK_MAP,
  WEAPONS,
  PROPERTIES,
  CITY_MAP,
  CITIES,
  DRUGS,
  DRUG_MAP,
  SHIPPERS,
  SHIPPER_MAP,
} from '../engine/constants';
import {
  getEarlyRepayDetails,
  getTotalWealth,
  getCityHeat,
  getCityVaultUnits,
  getCityVaultCapacity,
  getCarryingCapacity,
  getInventoryTotalUnits,
  getShipmentCost,
} from '../engine/game';
import {
  SHELL_BUSINESSES,
  CORPORATE_UPGRADES,
  SHELL_MAP,
  calculateEffectiveFeeRate,
  calculateEffectiveDailyCapacity,
  calculateTotalPassiveIncome,
  calculateTotalHeatShield,
} from '../engine/laundering';
import { PropertyImage } from './PropertyImage';
import { ArmoryPreviewCard } from './ArmoryPreviewCard';
import {
  Building2,
  Skull,
  HeartPulse,
  Crosshair,
  Landmark,
  ArrowRight,
  Home,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Palmtree,
  FileCheck,
  Sparkles,
  Flame,
  Package,
  Radio,
  Truck,
  Send,
  Lock,
  Unlock,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  Layers,
  Briefcase,
  ShieldCheck,
  Plane,
  FlaskConical,
} from 'lucide-react';
import { AIRCRAFT_FLEET, calculateAircraftFlightCost } from '../engine/aviation';
import { AircraftImage } from './AircraftImage';
import { ShellImage } from './ShellImage';
import { SharkImage } from './SharkImage';
import { ClandestineLabsView } from './ClandestineLabsView';

export const PlacesModal: React.FC = () => {
  const {
    player,
    market,
    placesSubTab,
    setPlacesSubTab,
    deposit,
    withdraw,
    repay,
    borrow,
    heal,
    buyPropertyAction,
    buyWeaponAction,
    buyAircraftAction,
    selectActiveAircraftAction,
    retireEmpireAction,
    buyCleanIdentityAction,
    bribePoliceAction,
    depositToVaultAction,
    withdrawFromVaultAction,
    dispatchCourierAction,
    buyIntelAction,
    buyShellBusinessAction,
    buyCorporateUpgradeAction,
    executeBusinessLaunderAction,
  } = useGameStore();

  const [bankAmount, setBankAmount] = useState<number>(0);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [selectedSharkId, setSelectedSharkId] = useState<string>('buddles');
  const [launderAmount, setLaunderAmount] = useState<number>(0);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('laundromat');
  const [confirmRetire, setConfirmRetire] = useState<boolean>(false);

  // Vault & Logistics Couriers state
  const [vaultSelectedCity, setVaultSelectedCity] = useState<string>(player.currentCityId);
  const [vaultActionAmount, setVaultActionAmount] = useState<Record<string, number>>({});
  const [vaultSubMode, setVaultSubMode] = useState<'vault' | 'couriers'>('vault');

  const [courierOriginCity, setCourierOriginCity] = useState<string>(player.currentCityId);
  const [courierTargetCity, setCourierTargetCity] = useState<string>(
    player.currentCityId === 'new_york' ? 'london' : 'new_york'
  );
  const [courierDrugId, setCourierDrugId] = useState<string>('cocaine');
  const [courierUnits, setCourierUnits] = useState<number>(1);
  const [courierShipperId, setCourierShipperId] = useState<string>('courier_stan');
  const [courierSource, setCourierSource] = useState<'inventory' | 'vault'>('inventory');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const totalWealth = getTotalWealth(player);
  const activeShark = player.loanSharkId ? SHARK_MAP.get(player.loanSharkId) : null;
  const isEarly = (player.loanDaysLeft ?? 0) > 0;
  const earlyFeeRate = isEarly ? (activeShark?.earlyFeeRate ?? activeShark?.interestRate ?? 0.10) : 0;
  const repayDetails = getEarlyRepayDetails(player, loanAmount);
  const maxAffordablePrincipal = isEarly
    ? Math.min(player.debt, Math.floor(player.cash / (1 + earlyFeeRate)))
    : Math.min(player.cash, player.debt);
  const canAffordCurrent = loanAmount > 0 && player.cash >= repayDetails.totalCashRequired;

  // Hospital cost
  const hpNeeded = 100 - player.health;
  const hospitalCost = Math.round(hpNeeded * 25 + Math.pow(hpNeeded, 1.3) * 5);

  const handleDeposit = () => {
    setFeedback(null);
    const res = deposit(bankAmount);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) setBankAmount(0);
  };

  const handleWithdraw = () => {
    setFeedback(null);
    const res = withdraw(bankAmount);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) setBankAmount(0);
  };

  const handleRepay = () => {
    setFeedback(null);
    const res = repay(loanAmount);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) setLoanAmount(0);
  };

  const handleBorrow = () => {
    setFeedback(null);
    const res = borrow(selectedSharkId, loanAmount);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) setLoanAmount(0);
  };

  const handleHeal = () => {
    setFeedback(null);
    const res = heal(100);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleBuyProperty = (propertyId: string) => {
    setFeedback(null);
    const res = buyPropertyAction(propertyId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleBuyWeapon = (weaponId: string) => {
    setFeedback(null);
    const res = buyWeaponAction(weaponId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleBuyAircraft = (aircraftId: string) => {
    setFeedback(null);
    const res = buyAircraftAction(aircraftId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleSelectActiveAircraft = (aircraftId: string | null) => {
    setFeedback(null);
    const res = selectActiveAircraftAction(aircraftId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleBuyCleanIdentity = () => {
    setFeedback(null);
    const res = buyCleanIdentityAction();
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleRetireEmpire = () => {
    setFeedback(null);
    const res = retireEmpireAction();
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    setConfirmRetire(false);
  };

  const handleBribePolice = () => {
    setFeedback(null);
    const res = bribePoliceAction();
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleDepositVault = (drugId: string, units: number) => {
    setFeedback(null);
    const res = depositToVaultAction(drugId, units, player.currentCityId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) {
      setVaultActionAmount((prev) => ({ ...prev, [`dep_${drugId}`]: 0 }));
    }
  };

  const handleWithdrawVault = (drugId: string, units: number) => {
    setFeedback(null);
    const res = withdrawFromVaultAction(drugId, units, player.currentCityId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) {
      setVaultActionAmount((prev) => ({ ...prev, [`wth_${drugId}`]: 0 }));
    }
  };

  const handleDispatchCourier = () => {
    setFeedback(null);
    const res = dispatchCourierAction({
      shipperId: courierShipperId,
      originCityId: courierOriginCity,
      targetCityId: courierTargetCity,
      drugId: courierDrugId,
      units: courierUnits,
      source: courierSource,
    });
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleBuyIntel = (tipId: string) => {
    setFeedback(null);
    const res = buyIntelAction(tipId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleLaunder = () => {
    setFeedback(null);
    if (launderAmount <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid amount to wash' });
      return;
    }
    const res = executeBusinessLaunderAction(selectedBusinessId, launderAmount);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) {
      setLaunderAmount(0);
    }
  };

  const handleBuyBusiness = (businessId: string) => {
    setFeedback(null);
    const res = buyShellBusinessAction(businessId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleBuyUpgrade = (upgradeId: string) => {
    setFeedback(null);
    const res = buyCorporateUpgradeAction(upgradeId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono backdrop-blur-md">
      {/* Subtab navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/80 overflow-x-auto text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setPlacesSubTab('bank')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'bank'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Offshore Bank
        </button>

        <button
          onClick={() => setPlacesSubTab('properties')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'properties'
              ? 'border-amber-400 text-amber-400 bg-amber-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" /> Safehouses & Real Estate
        </button>

        <button
          onClick={() => setPlacesSubTab('aviation')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'aviation'
              ? 'border-sky-400 text-sky-400 bg-sky-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plane className="w-4 h-4" /> Aviation Fleet & Jets
        </button>

        <button
          onClick={() => setPlacesSubTab('vaults')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'vaults'
              ? 'border-teal-400 text-teal-400 bg-teal-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" /> Stash Vaults & Couriers
        </button>

        <button
          onClick={() => setPlacesSubTab('labs')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'labs'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <span>Clandestine Labs</span>
          {(player.activeCookBatches?.filter((b) => b.status === 'ready').length || 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black animate-pulse">
              {player.activeCookBatches?.filter((b) => b.status === 'ready').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setPlacesSubTab('informant')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'informant'
              ? 'border-orange-400 text-orange-400 bg-orange-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 text-orange-400 animate-pulse" /> Informant Wire
        </button>

        <button
          onClick={() => setPlacesSubTab('laundering')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'laundering'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-4 h-4" /> Shells & Laundering
        </button>

        <button
          onClick={() => setPlacesSubTab('loans')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'loans'
              ? 'border-rose-400 text-rose-400 bg-rose-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Skull className="w-4 h-4" /> Loan Sharks
        </button>

        <button
          onClick={() => setPlacesSubTab('hospital')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'hospital'
              ? 'border-pink-400 text-pink-400 bg-pink-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4" /> Clinic
        </button>

        <button
          onClick={() => setPlacesSubTab('armory')}
          className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'armory'
              ? 'border-indigo-400 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crosshair className="w-4 h-4" /> Armory
        </button>
      </div>

      {/* Feedback Banner */}
      <div className="p-6">
        {feedback && (
          <div
            className={`mb-5 p-3.5 rounded-xl text-sm font-bold border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/60 border-rose-700 text-rose-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* BANK TAB */}
        {placesSubTab === 'bank' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Offshore Private Account (Cayman Islands)
              </div>
              <div className="text-4xl font-black text-cyan-400 mt-2">
                ${player.bank.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Offshore bank funds earn 0.1% daily compounding interest and are completely immune to street muggings and police confiscation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Transaction Amount:</span>
                <span className="text-slate-300">
                  Cash on Hand: <strong className="text-emerald-400 font-bold">${player.cash.toLocaleString()}</strong>
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={bankAmount || ''}
                onChange={(e) => setBankAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="Enter dollar amount..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-bold focus:outline-none focus:border-cyan-500 text-base"
              />

              {/* Quick Deposit Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Quick Deposit Presets (Cash):</span>
                  <span className="text-emerald-400 font-bold">${player.cash.toLocaleString()} in Briefcase</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setBankAmount(Math.floor(player.cash * 0.25))}
                    className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 font-mono font-bold text-xs transition-colors shadow-sm"
                  >
                    Deposit 25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankAmount(Math.floor(player.cash * 0.50))}
                    className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 font-mono font-bold text-xs transition-colors shadow-sm"
                  >
                    Deposit 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankAmount(Math.floor(player.cash * 0.75))}
                    className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 font-mono font-bold text-xs transition-colors shadow-sm"
                  >
                    Deposit 75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankAmount(player.cash)}
                    className="py-1.5 px-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-mono font-black text-xs transition-colors shadow-sm"
                  >
                    Deposit ALL
                  </button>
                </div>
              </div>

              {/* Quick Withdraw Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Quick Withdraw Presets (Bank):</span>
                  <span className="text-cyan-400 font-bold">${player.bank.toLocaleString()} in Offshore</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setBankAmount(Math.floor(player.bank * 0.25))}
                    className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 font-mono font-bold text-xs transition-colors shadow-sm"
                  >
                    Withdraw 25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankAmount(Math.floor(player.bank * 0.50))}
                    className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 font-mono font-bold text-xs transition-colors shadow-sm"
                  >
                    Withdraw 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankAmount(Math.floor(player.bank * 0.75))}
                    className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 font-mono font-bold text-xs transition-colors shadow-sm"
                  >
                    Withdraw 75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankAmount(player.bank)}
                    className="py-1.5 px-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 font-mono font-black text-xs transition-colors shadow-sm"
                  >
                    Withdraw ALL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDeposit}
                  disabled={bankAmount <= 0 || player.cash < bankAmount}
                  className="py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm transition-all shadow-md active:scale-95"
                >
                  Deposit Cash
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={bankAmount <= 0 || player.bank < bankAmount}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-bold text-sm border border-slate-700 transition-colors"
                >
                  Withdraw to Pocket
                </button>
              </div>
            </div>

            {/* Underworld Legal & Retirement Services */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Underworld Consular & Retirement Services</span>
              </div>

              {/* Clean Identity Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-100">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>Diplomatic Clean Identity & Passport</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Wipe active law enforcement heat dossiers and purchase diplomatic immunity credentials. Grants <strong className="text-emerald-400">+30 Days</strong> to your syndicate lifespan.
                    </p>
                  </div>
                  <span className="text-xs font-black text-emerald-400 shrink-0">
                    {player.isEndless ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ∞ Endless
                      </span>
                    ) : (
                      `$${(50000 + (player.cleanIdentityRenewals || 0) * 25000).toLocaleString()}`
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>
                    Renewals Purchased:{' '}
                    <strong className="text-slate-200">{player.cleanIdentityRenewals || 0}</strong>
                  </span>
                  <span>
                    Current Horizon:{' '}
                    <strong className="text-amber-400">{player.isEndless ? '∞ Endless' : `Day ${player.maxDays}`}</strong>
                  </span>
                </div>

                {player.isEndless ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-bold text-xs cursor-default"
                  >
                    Endless Mode Active (No Day Limit)
                  </button>
                ) : (
                  <button
                    onClick={handleBuyCleanIdentity}
                    disabled={player.cash < (50000 + (player.cleanIdentityRenewals || 0) * 25000)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
                  >
                    {player.cash >= (50000 + (player.cleanIdentityRenewals || 0) * 25000)
                      ? `Secure +30 Days Extension ($${(50000 + (player.cleanIdentityRenewals || 0) * 25000).toLocaleString()})`
                      : `Insufficient Cash ($${(50000 + (player.cleanIdentityRenewals || 0) * 25000).toLocaleString()} required)`}
                  </button>
                )}
              </div>

              {/* Police Heat Scrub Card */}
              {(() => {
                const currentHeat = getCityHeat(player, player.currentCityId);
                const cityName = CITY_MAP.get(player.currentCityId)?.name ?? 'City';
                const bribeCost = Math.max(2500, Math.round(currentHeat * 150));
                const canAfford = player.cash >= bribeCost;

                return (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-black text-slate-100">
                          <Flame className="w-4 h-4 text-red-400" />
                          <span>Police Commissioner Dossier Scrub ({cityName})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Pay off precinct commanders and internal narcotics detectives to shred wiretap logs, purge informant dossiers, and lower local heat by <strong className="text-emerald-400">-50%</strong>.
                        </p>
                      </div>
                      <span className="text-xs font-black text-amber-400 shrink-0">
                        {currentHeat > 0 ? `$${bribeCost.toLocaleString()}` : '0% Heat'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>
                        Current City Heat:{' '}
                        <strong
                          className={
                            currentHeat >= 70
                              ? 'text-red-400 font-bold'
                              : currentHeat >= 30
                              ? 'text-amber-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          {currentHeat}%
                        </strong>
                      </span>
                      <span>
                        Surveillance Status:{' '}
                        <strong
                          className={
                            currentHeat >= 70
                              ? 'text-red-400 font-black animate-pulse'
                              : currentHeat >= 30
                              ? 'text-amber-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {currentHeat >= 70 ? '🚨 DEA Raid Risk' : currentHeat >= 30 ? 'Elevated Patrol' : 'Calm'}
                        </strong>
                      </span>
                    </div>

                    <button
                      onClick={handleBribePolice}
                      disabled={currentHeat <= 0 || !canAfford}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
                    >
                      {currentHeat <= 0
                        ? 'Precinct Dossier Clean (0% Heat)'
                        : canAfford
                        ? `Scrub Police Records in ${cityName} ($${bribeCost.toLocaleString()})`
                        : `Insufficient Cash ($${bribeCost.toLocaleString()} required)`}
                    </button>
                  </div>
                );
              })()}

              {/* Voluntary Retirement Card */}
              <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/20 to-slate-950/60 flex flex-col justify-between gap-3 shadow-lg shadow-amber-950/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black text-amber-300">
                      <Palmtree className="w-4 h-4 text-amber-400" />
                      <span>Liquidate Empire & Retire to Caribbean</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Cash out your operations immediately. Liquidates all assets into offshore bearer bonds and generates your final syndicate victory dossier.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase text-slate-500 block">Current Wealth</span>
                    <span className="text-sm font-black text-amber-400">
                      ${totalWealth.toLocaleString()}
                    </span>
                  </div>
                </div>

                {confirmRetire ? (
                  <div className="p-3 bg-red-950/60 border border-red-700/80 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-xs text-red-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>Liquidate everything and conclude your run on Day {player.currentDay}?</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetireEmpire}
                        className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-md"
                      >
                        Yes, Retire Now (${totalWealth.toLocaleString()})
                      </button>
                      <button
                        onClick={() => setConfirmRetire(false)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRetire(true)}
                    className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 hover:border-amber-400 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Liquidate & Retire to Caribbean (${totalWealth.toLocaleString()})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CLANDESTINE LABS & PRECURSORS TAB */}
        {placesSubTab === 'labs' && <ClandestineLabsView />}

        {/* SAFETHOUSES & REAL ESTATE TAB */}
        {placesSubTab === 'properties' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase">
                  <Home className="w-5 h-5" /> Underworld Real Estate Empire
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Acquire fortified properties to permanently expand your drug stash carrying capacity and lower local police heat.
                </p>
              </div>
              <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-right">
                <div className="text-[11px] text-slate-400 uppercase">Owned Estates</div>
                <div className="text-xl font-black text-amber-400">
                  {player.ownedProperties?.length ?? 0} / {PROPERTIES.length}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROPERTIES.map((prop) => {
                const isOwned = (player.ownedProperties || []).includes(prop.id);
                const canAfford = player.cash >= prop.price;

                return (
                  <div
                    key={prop.id}
                    className={`bg-slate-950/70 border rounded-2xl p-4 flex flex-col justify-between transition-all group ${
                      isOwned
                        ? 'border-amber-500/80 bg-amber-950/20 shadow-lg shadow-amber-950/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Property Image Render */}
                      <PropertyImage property={prop} className="w-full h-36 mb-3" />

                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-100 text-base group-hover:text-amber-300 transition-colors">
                          {prop.name}
                        </h4>
                        <span className="text-amber-400 font-black text-base shrink-0">
                          ${prop.price.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {prop.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase block">Vault Stash</span>
                          <strong className="text-emerald-400 text-sm">+{prop.storageUnits.toLocaleString()}</strong>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase block">Heat Shield</span>
                          <strong className="text-sky-400 text-sm">
                            {prop.heatReduction > 0 ? `-${Math.round(prop.heatReduction * 100)}%` : 'None'}
                          </strong>
                        </div>
                      </div>

                      {isOwned ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-default"
                        >
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          <span>Title Deed Secured</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyProperty(prop.id)}
                          disabled={!canAfford}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
                        >
                          {canAfford ? `Acquire Title Deed ($${prop.price.toLocaleString()})` : 'Insufficient Cash'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STASH VAULTS & LOGISTICS COURIERS TAB */}
        {placesSubTab === 'vaults' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Top Navigation Mode Toggle */}
            <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-2xl border border-slate-800 gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm uppercase">
                  <Package className="w-5 h-5" /> Multi-City Stash Vaults & Smuggling Logistics
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Permanent off-street storage immune to customs airport sniffer dogs, street muggers, and demotion scavengers.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setVaultSubMode('vault')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    vaultSubMode === 'vault'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> City Stash Vault
                </button>
                <button
                  onClick={() => setVaultSubMode('couriers')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    vaultSubMode === 'couriers'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" /> Cargo Couriers
                  {player.shipments?.filter((s) => s.status === 'in_transit').length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            {vaultSubMode === 'vault' ? (
              <div className="space-y-6">
                {/* City Selector & Capacity Stats */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Select Vault City:</span>
                    <select
                      value={vaultSelectedCity}
                      onChange={(e) => setVaultSelectedCity(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-teal-400"
                    >
                      {CITIES.map((c) => {
                        const unitsStored = getCityVaultUnits(player, c.id);
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.id === player.currentCityId ? '📍 [Current Location]' : ''} {unitsStored > 0 ? `(${unitsStored} units stashed)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Vault Capacity Indicator */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">
                        {CITY_MAP.get(vaultSelectedCity)?.name} Stash Capacity
                      </div>
                      <div className="text-sm font-black text-teal-300 font-mono">
                        {getCityVaultUnits(player, vaultSelectedCity).toLocaleString()} / {getCityVaultCapacity(player, vaultSelectedCity).toLocaleString()} Units
                      </div>
                    </div>
                    <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-400 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (getCityVaultUnits(player, vaultSelectedCity) /
                              Math.max(1, getCityVaultCapacity(player, vaultSelectedCity))) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Main Vault Panel */}
                {vaultSelectedCity === player.currentCityId ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: Pocket Inventory (To Deposit) */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Unlock className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold uppercase text-slate-200">Pocket Contraband</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Carrying: <strong className="text-slate-200">{getInventoryTotalUnits(player)}</strong> / {getCarryingCapacity(player)} units
                        </span>
                      </div>

                      {Object.keys(player.inventory).length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 italic">
                          Your pocket is empty. Buy contraband on the Street Market to deposit into this vault.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                          {Object.entries(player.inventory).map(([drugId, invItem]) => {
                            const drug = DRUG_MAP.get(drugId);
                            const currentAmt = vaultActionAmount[`dep_${drugId}`] ?? invItem.units;
                            const currentVaultUnits = getCityVaultUnits(player, player.currentCityId);
                            const maxVaultSpace = Math.max(0, getCityVaultCapacity(player, player.currentCityId) - currentVaultUnits);
                            const canDeposit = Math.min(invItem.units, maxVaultSpace);

                            return (
                              <div
                                key={drugId}
                                className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 flex flex-col gap-2"
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-bold text-slate-100">{drug?.name ?? drugId}</span>
                                    <span className="text-slate-400 ml-2">({invItem.units} in pocket)</span>
                                  </div>
                                  <span className="text-emerald-400 font-bold">
                                    ${(market[drugId]?.price ?? drug?.basePrice ?? 0).toLocaleString()}/ea
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setVaultActionAmount((p) => ({ ...p, [`dep_${drugId}`]: 1 }))}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                                    >
                                      1
                                    </button>
                                    <button
                                      onClick={() =>
                                        setVaultActionAmount((p) => ({
                                          ...p,
                                          [`dep_${drugId}`]: Math.max(1, Math.floor(invItem.units / 2)),
                                        }))
                                      }
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                                    >
                                      ½
                                    </button>
                                    <button
                                      onClick={() =>
                                        setVaultActionAmount((p) => ({
                                          ...p,
                                          [`dep_${drugId}`]: canDeposit,
                                        }))
                                      }
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                                    >
                                      Max
                                    </button>
                                  </div>

                                  <input
                                    type="number"
                                    min={1}
                                    max={invItem.units}
                                    value={currentAmt || ''}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                      setVaultActionAmount((p) => ({ ...p, [`dep_${drugId}`]: val }));
                                    }}
                                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-slate-200 font-bold focus:outline-none"
                                  />

                                  <button
                                    onClick={() => handleDepositVault(drugId, currentAmt)}
                                    disabled={currentAmt <= 0 || currentAmt > invItem.units || maxVaultSpace <= 0}
                                    className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-lg transition-all"
                                  >
                                    Deposit
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Local City Vault (To Withdraw) */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-teal-400" />
                          <span className="text-xs font-bold uppercase text-slate-200">
                            {CITY_MAP.get(player.currentCityId)?.name} Stash Vault
                          </span>
                        </div>
                        <span className="text-[11px] text-teal-400">
                          {getCityVaultUnits(player, player.currentCityId)} Units Stashed
                        </span>
                      </div>

                      {!player.vaults?.[player.currentCityId] ||
                      Object.keys(player.vaults[player.currentCityId]).length === 0 ||
                      getCityVaultUnits(player, player.currentCityId) === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 italic">
                          Safehouse vault in {CITY_MAP.get(player.currentCityId)?.name} is currently empty.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                          {Object.entries(player.vaults[player.currentCityId])
                            .filter(([, u]) => u > 0)
                            .map(([drugId, unitsStored]) => {
                              const drug = DRUG_MAP.get(drugId);
                              const currentAmt = vaultActionAmount[`wth_${drugId}`] ?? unitsStored;
                              const currentCarrying = getInventoryTotalUnits(player);
                              const remainingCarrying = Math.max(0, getCarryingCapacity(player) - currentCarrying);
                              const canWithdraw = Math.min(unitsStored, remainingCarrying);

                              return (
                                <div
                                  key={drugId}
                                  className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 flex flex-col gap-2"
                                >
                                  <div className="flex justify-between items-center text-xs">
                                    <div>
                                      <span className="font-bold text-slate-100">{drug?.name ?? drugId}</span>
                                      <span className="text-teal-400 ml-2">({unitsStored} stashed)</span>
                                    </div>
                                    <span className="text-slate-300 font-bold">
                                      Est. Value: ${(unitsStored * (market[drugId]?.price ?? drug?.basePrice ?? 0)).toLocaleString()}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setVaultActionAmount((p) => ({ ...p, [`wth_${drugId}`]: 1 }))}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                                      >
                                        1
                                      </button>
                                      <button
                                        onClick={() =>
                                          setVaultActionAmount((p) => ({
                                            ...p,
                                            [`wth_${drugId}`]: Math.max(1, Math.floor(unitsStored / 2)),
                                          }))
                                        }
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                                      >
                                        ½
                                      </button>
                                      <button
                                        onClick={() =>
                                          setVaultActionAmount((p) => ({
                                            ...p,
                                            [`wth_${drugId}`]: canWithdraw,
                                          }))
                                        }
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                                      >
                                        Max
                                      </button>
                                    </div>

                                    <input
                                      type="number"
                                      min={1}
                                      max={unitsStored}
                                      value={currentAmt || ''}
                                      onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                        setVaultActionAmount((p) => ({ ...p, [`wth_${drugId}`]: val }));
                                      }}
                                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-slate-200 font-bold focus:outline-none"
                                    />

                                    <button
                                      onClick={() => handleWithdrawVault(drugId, currentAmt)}
                                      disabled={currentAmt <= 0 || currentAmt > unitsStored || remainingCarrying <= 0}
                                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-teal-300 border border-teal-600/40 font-bold text-xs rounded-lg transition-all"
                                    >
                                      Withdraw
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Remote City Vault View */
                  <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-teal-400">
                      <Lock className="w-4 h-4" />
                      <span>Remote Safehouse Vault: {CITY_MAP.get(vaultSelectedCity)?.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-lg mx-auto">
                      You are currently in <strong className="text-slate-200">{CITY_MAP.get(player.currentCityId)?.name}</strong>.
                      Contraband held in this remote safehouse is completely secured from airport customs searches.
                    </p>

                    {!player.vaults?.[vaultSelectedCity] ||
                    getCityVaultUnits(player, vaultSelectedCity) === 0 ? (
                      <div className="py-6 text-xs text-slate-500 italic">
                        No contraband is stored in {CITY_MAP.get(vaultSelectedCity)?.name}.
                      </div>
                    ) : (
                      <div className="max-w-md mx-auto space-y-2">
                        {Object.entries(player.vaults[vaultSelectedCity])
                          .filter(([, u]) => u > 0)
                          .map(([drugId, unitsStored]) => {
                            const drug = DRUG_MAP.get(drugId);
                            return (
                              <div
                                key={drugId}
                                className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                              >
                                <span className="font-bold text-slate-100">{drug?.name ?? drugId}</span>
                                <span className="text-teal-400 font-bold">{unitsStored.toLocaleString()} units stored</span>
                              </div>
                            );
                          })}

                        <div className="pt-3">
                          <button
                            onClick={() => {
                              setCourierOriginCity(vaultSelectedCity);
                              setCourierTargetCity(player.currentCityId);
                              setCourierSource('vault');
                              const firstDrug = Object.keys(player.vaults[vaultSelectedCity] || {})[0] || 'cocaine';
                              setCourierDrugId(firstDrug);
                              setCourierUnits(player.vaults[vaultSelectedCity][firstDrug] || 1);
                              setVaultSubMode('couriers');
                            }}
                            className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Hire Courier to Ship to {CITY_MAP.get(player.currentCityId)?.name}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Global Syndicate Vaults Ledger */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Layers className="w-4 h-4 text-teal-400" />
                    <span>Global Safehouse Network Ledger</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {CITIES.map((c) => {
                      const units = getCityVaultUnits(player, c.id);
                      const isCurrent = c.id === player.currentCityId;
                      const isSelected = c.id === vaultSelectedCity;

                      return (
                        <button
                          key={c.id}
                          onClick={() => setVaultSelectedCity(c.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-teal-400 bg-teal-950/30'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200 truncate">{c.name}</span>
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Current Location" />}
                          </div>
                          <div className="text-[11px] text-teal-300 mt-1 font-mono">
                            {units > 0 ? `${units.toLocaleString()} units` : <span className="text-slate-600">Empty</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* COURIER LOGISTICS DISPATCHER */
              <div className="space-y-6">
                <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                    <Send className="w-4 h-4" />
                    <span>Contract Underworld Courier Smuggler</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    {/* Origin & Source */}
                    <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <label className="text-[11px] text-slate-400 uppercase font-bold block">1. Origin & Source</label>
                      <select
                        value={courierOriginCity}
                        onChange={(e) => {
                          const newOrigin = e.target.value;
                          setCourierOriginCity(newOrigin);
                          if (newOrigin !== player.currentCityId) {
                            setCourierSource('vault');
                          }
                          if (newOrigin === courierTargetCity) {
                            const next = CITIES.find((c) => c.id !== newOrigin)?.id ?? 'london';
                            setCourierTargetCity(next);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-100 font-bold focus:outline-none"
                      >
                        {CITIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.id === player.currentCityId ? '(Here)' : ''}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          disabled={courierOriginCity !== player.currentCityId}
                          onClick={() => setCourierSource('inventory')}
                          className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors ${
                            courierSource === 'inventory'
                              ? 'bg-teal-500 text-slate-950 border-teal-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800 disabled:opacity-30'
                          }`}
                        >
                          Pocket
                        </button>
                        <button
                          type="button"
                          onClick={() => setCourierSource('vault')}
                          className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors ${
                            courierSource === 'vault'
                              ? 'bg-teal-500 text-slate-950 border-teal-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          Vault
                        </button>
                      </div>
                    </div>

                    {/* Cargo & Quantity */}
                    <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <label className="text-[11px] text-slate-400 uppercase font-bold block">2. Cargo & Quantity</label>
                      <select
                        value={courierDrugId}
                        onChange={(e) => setCourierDrugId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-100 font-bold focus:outline-none"
                      >
                        {DRUGS.map((d) => {
                          const available =
                            courierSource === 'inventory'
                              ? player.inventory[d.id]?.units ?? 0
                              : player.vaults?.[courierOriginCity]?.[d.id] ?? 0;
                          return (
                            <option key={d.id} value={d.id}>
                              {d.name} ({available} avail)
                            </option>
                          );
                        })}
                      </select>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          min={1}
                          value={courierUnits || ''}
                          onChange={(e) => setCourierUnits(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const avail =
                              courierSource === 'inventory'
                                ? player.inventory[courierDrugId]?.units ?? 0
                                : player.vaults?.[courierOriginCity]?.[courierDrugId] ?? 0;
                            setCourierUnits(Math.max(1, avail));
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    {/* Destination City */}
                    <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <label className="text-[11px] text-slate-400 uppercase font-bold block">3. Destination City</label>
                      <select
                        value={courierTargetCity}
                        onChange={(e) => setCourierTargetCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-100 font-bold focus:outline-none"
                      >
                        {CITIES.filter((c) => c.id !== courierOriginCity).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Auto-delivered into destination vault.
                      </div>
                    </div>
                  </div>

                  {/* Courier Contractors Grid */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Select Courier Smuggler Service:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {SHIPPERS.map((s) => {
                        const isSelected = courierShipperId === s.id;
                        const cost = getShipmentCost(s.id, courierDrugId, courierUnits);
                        const originHeat = getCityHeat(player, courierOriginCity);
                        const targetHeat = getCityHeat(player, courierTargetCity);
                        const heatPenalty = Math.round(((originHeat + targetHeat) / 200) * 15);
                        const estReliability = Math.max(10, Math.round(s.reliability * 100) - heatPenalty);

                        return (
                          <div
                            key={s.id}
                            onClick={() => setCourierShipperId(s.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-teal-400 bg-teal-950/30 shadow-md'
                                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <h5 className="font-bold text-slate-100 text-xs">{s.name}</h5>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                  {s.id === 'quicker_shipper' || s.id === 'international_couriers' ? '1 Day ETA' : '2 Days ETA'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{s.description}</p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-[10px]">Fee:</span>
                                <strong className="text-teal-400">${cost.toLocaleString()}</strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-[10px]">Reliability:</span>
                                <span
                                  className={`text-[11px] font-bold ${
                                    estReliability >= 90
                                      ? 'text-emerald-400'
                                      : estReliability >= 70
                                      ? 'text-amber-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  ~{estReliability}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dispatch Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleDispatchCourier}
                      disabled={
                        player.cash < getShipmentCost(courierShipperId, courierDrugId, courierUnits) ||
                        courierUnits <= 0
                      }
                      className="py-3 px-6 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        Contract Courier & Smuggle Cargo ($
                        {getShipmentCost(courierShipperId, courierDrugId, courierUnits).toLocaleString()})
                      </span>
                    </button>
                  </div>
                </div>

                {/* Active Logistics Radar */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <Truck className="w-4 h-4 text-teal-400" />
                      <span>Active In-Transit Cargo Radar</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {player.shipments?.filter((s) => s.status === 'in_transit').length ?? 0} Active Shipments
                    </span>
                  </div>

                  {!player.shipments || player.shipments.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 italic">
                      No courier shipments currently dispatched. Contract a smuggler above to transport contraband between cities.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {player.shipments.map((s) => {
                        const drug = DRUG_MAP.get(s.drugId);
                        const origin = CITY_MAP.get(s.originCityId)?.name ?? s.originCityId;
                        const target = CITY_MAP.get(s.targetCityId)?.name ?? s.targetCityId;
                        const shipper = SHIPPER_MAP.get(s.shipperId);

                        return (
                          <div
                            key={s.id}
                            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
                              s.status === 'in_transit'
                                ? 'border-teal-500/60 bg-teal-950/20 shadow'
                                : s.status === 'delivered'
                                ? 'border-emerald-800/60 bg-emerald-950/10 text-slate-400'
                                : 'border-rose-800/60 bg-rose-950/10 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                <Truck
                                  className={`w-4 h-4 ${
                                    s.status === 'in_transit'
                                      ? 'text-teal-400 animate-pulse'
                                      : s.status === 'delivered'
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }`}
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                  <span>{s.units.toLocaleString()}x {drug?.name ?? s.drugId}</span>
                                  <span className="text-slate-500">|</span>
                                  <span className="text-slate-300">{origin} ➔ {target}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Courier: {shipper?.name ?? s.shipperId} • Cost: ${s.costPaid.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div>
                              {s.status === 'in_transit' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-950 text-teal-300 border border-teal-700 text-[11px] font-bold">
                                  <Clock className="w-3 h-3" /> In Transit ({s.daysRemaining}d left)
                                </span>
                              ) : s.status === 'delivered' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> Delivered to Vault
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold">
                                  <AlertTriangle className="w-3 h-3" /> Intercepted / Seized
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INFORMANT WIRE & MARKET FORECASTING TAB */}
        {placesSubTab === 'informant' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Informant Header */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-orange-400 font-bold text-sm uppercase">
                  <Radio className="w-5 h-5 text-orange-400 animate-pulse" /> Underworld Informant Wiretap
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Pay corrupt port inspectors, chemist whistleblowers, and intercepted cartel pagers for advance market forecasts. Intelligence materializes 1-3 days in advance.
                </p>
              </div>

              <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-right">
                <div className="text-[10px] text-slate-400 uppercase">Decrypted Dossiers</div>
                <div className="text-xl font-black text-orange-400">
                  {player.activeIntel?.filter((t) => t.purchased).length ?? 0} / {player.activeIntel?.length ?? 0}
                </div>
              </div>
            </div>

            {/* Intel Feed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!player.activeIntel || player.activeIntel.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-500 italic bg-slate-950/50 rounded-2xl border border-slate-800">
                  No active wire chatter detected. Advance the calendar or travel to intercept new signals.
                </div>
              ) : (
                player.activeIntel.map((tip) => {
                  const drug = DRUG_MAP.get(tip.drugId);
                  const city = CITY_MAP.get(tip.cityId);
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
                            {isToday ? '🎯 Expected TODAY (Day ' + tip.targetDay + ')' : `Hits Day ${tip.targetDay} (In ${daysAway}d)`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-slate-100">{drug?.name ?? tip.drugName}</span>
                            <span className="text-xs text-slate-400 font-bold">in {city?.name ?? tip.cityName}</span>
                          </div>
                          <span className="text-xs font-black text-orange-400 font-mono">
                            ${tip.cost.toLocaleString()}
                          </span>
                        </div>

                        {tip.purchased ? (
                          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-800/50 space-y-2">
                            <div className="text-xs font-bold text-orange-300 leading-relaxed">
                              "{tip.headline}"
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-bold">
                              {tip.eventType === 'surge_spike' ? (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <TrendingUp className="w-3.5 h-3.5" /> Projected Spike: +{Math.round((tip.multiplier - 1) * 100)}% Price Surge
                                </span>
                              ) : tip.eventType === 'market_glut' ? (
                                <span className="text-rose-400 flex items-center gap-1">
                                  <TrendingDown className="w-3.5 h-3.5" /> Projected Crash: -{Math.round((1 - tip.multiplier) * 100)}% Supply Flood
                                </span>
                              ) : (
                                <span className="text-sky-400 flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5" /> Police Task Force Crackdown (+{Math.round((tip.multiplier - 1) * 100)}% Shortage)
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                              {tip.eventType === 'surge_spike'
                                ? `💡 Strategy: Stockpile ${drug?.name} now or courier it to ${city?.name} ahead of Day ${tip.targetDay} to dump at massive profits!`
                                : tip.eventType === 'market_glut'
                                ? `💡 Strategy: Liquidate ${drug?.name} holdings in ${city?.name} before Day ${tip.targetDay}, then buy the bottom when the street crashes!`
                                : `💡 Strategy: High police presence expected in ${city?.name}. Avoid traveling heavily loaded without safehouse protection.`}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                            <div className="text-xs text-slate-400 italic">
                              [CLASSIFIED ENCRYPTED INTERCEPT] Inside intelligence detected regarding an upcoming market shock for {drug?.name} in {city?.name}.
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Security clearance required: ${tip.cost.toLocaleString()} Underworld Wire Fee.
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        {tip.purchased ? (
                          <div className="py-2 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Dossier Decrypted & Verified</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuyIntel(tip.id)}
                            disabled={!canAfford}
                            className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Decrypt Intelligence Dossier (${tip.cost.toLocaleString()})</span>
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

        {/* MONEY LAUNDERING & SHELL BUSINESSES TAB */}
        {placesSubTab === 'laundering' && (
          <div className="space-y-6">
            {/* Overview Conglomerate Dossier */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase mb-1">
                  <Landmark className="w-5 h-5" /> Underworld Corporate Conglomerate & Laundering
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  Acquire cash-intensive shell businesses, retain forensic offshore counsel, and layer illicit street cash into legitimate Swiss bank deposits.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Owned Shells:</span>
                  <strong className="text-emerald-400 text-sm">
                    {player.ownedBusinesses?.length ?? 0} / {SHELL_BUSINESSES.length}
                  </strong>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-500 block text-[10px] uppercase">Passive Clean/Day:</span>
                  <strong className="text-emerald-400 text-sm">
                    +${calculateTotalPassiveIncome(player.ownedBusinesses).toLocaleString()}
                  </strong>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-500 block text-[10px] uppercase">Daily Heat Shield:</span>
                  <strong className="text-sky-400 text-sm">
                    -{calculateTotalHeatShield(player.ownedBusinesses)}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: 8 Shell Businesses */}
              <div className="lg:col-span-7 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between px-1">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    <span>Commercial Shell Entities ({SHELL_BUSINESSES.length})</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Click to select active washing front
                  </span>
                </div>

                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {SHELL_BUSINESSES.map((business) => {
                    const isOwned = player.ownedBusinesses?.includes(business.id);
                    const isSelected = selectedBusinessId === business.id;
                    const effectiveFee = calculateEffectiveFeeRate(business, player.corporateUpgrades);
                    const effectiveCap = calculateEffectiveDailyCapacity(business, player.corporateUpgrades);
                    const canAfford = player.cash >= business.purchaseCost;

                    return (
                      <div
                        key={business.id}
                        onClick={() => setSelectedBusinessId(business.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                            : isOwned
                            ? 'bg-slate-950/60 border-slate-700/80 hover:border-slate-600'
                            : 'bg-slate-950/30 border-slate-800/80 hover:border-slate-700 opacity-90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <ShellImage business={business} size="sm" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200 text-sm">{business.name}</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                                  T{business.tier}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{business.description}</p>
                            </div>
                          </div>

                          {isOwned ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold uppercase shrink-0">
                              Owned 100%
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyBusiness(business.id);
                              }}
                              disabled={!canAfford}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all shadow shrink-0"
                            >
                              Acquire (${business.purchaseCost.toLocaleString()})
                            </button>
                          )}
                        </div>

                        {/* Metrics Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/70 text-[11px] font-mono text-slate-400">
                          <div>
                            <span>Fee: </span>
                            <strong className="text-emerald-400">{Math.round(effectiveFee * 1000) / 10}%</strong>
                          </div>
                          <div>
                            <span>Daily Cap: </span>
                            <strong className="text-slate-200">${effectiveCap.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span>Passive Rev: </span>
                            <strong className="text-emerald-400">+${business.passiveDailyProfit.toLocaleString()}/day</strong>
                          </div>
                          {business.specialPerk && (
                            <div className="text-[10px] text-amber-400 font-sans font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> {business.specialPerk}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Corporate Upgrades & Wire Console */}
              <div className="lg:col-span-5 space-y-4">
                {/* Corporate Upgrades */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Forensic Retainers & Legal Defense</span>
                  </div>

                  <div className="space-y-2">
                    {CORPORATE_UPGRADES.map((upgrade) => {
                      const isRetained = player.corporateUpgrades?.includes(upgrade.id);
                      const canAfford = player.cash >= upgrade.cost;

                      return (
                        <div
                          key={upgrade.id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-200 text-[11px]">{upgrade.name}</div>
                            <p className="text-[10px] text-slate-400 leading-tight">{upgrade.description}</p>
                          </div>

                          {isRetained ? (
                            <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/60 text-sky-300 text-[10px] font-bold uppercase shrink-0">
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => handleBuyUpgrade(upgrade.id)}
                              disabled={!canAfford}
                              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-slate-950 font-bold text-[11px] shrink-0"
                            >
                              Retain (${upgrade.cost.toLocaleString()})
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Wire Execution Console */}
                {(() => {
                  const activeBusiness = SHELL_MAP.get(selectedBusinessId) || SHELL_BUSINESSES[0];
                  const effFee = calculateEffectiveFeeRate(activeBusiness, player.corporateUpgrades);
                  const effCap = calculateEffectiveDailyCapacity(activeBusiness, player.corporateUpgrades);
                  const remainingCap = Math.max(0, effCap - (player.launderedToday || 0));
                  const maxCleanable = Math.min(player.cash, remainingCap);
                  const netClean = Math.round(launderAmount * (1 - effFee));
                  const hasOffshoreLegal = player.corporateUpgrades?.includes('offshore_legal');

                  return (
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Landmark className="w-4 h-4 text-emerald-400" />
                          <span>Active Front: <strong className="text-emerald-300">{activeBusiness.name}</strong></span>
                        </span>
                        <span className="font-mono text-[11px] text-emerald-400">
                          {Math.round(effFee * 1000) / 10}% Fee
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Remaining Capacity Today:</span>
                        <strong className="text-slate-200">${remainingCap.toLocaleString()}</strong>
                      </div>

                      {/* Quick Presets */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setLaunderAmount(Math.round(maxCleanable * 0.25))}
                          className="py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700"
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaunderAmount(Math.round(maxCleanable * 0.5))}
                          className="py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaunderAmount(Math.round(maxCleanable * 0.75))}
                          className="py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700"
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaunderAmount(maxCleanable)}
                          className="py-1 rounded bg-emerald-950/60 border border-emerald-700/60 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/60"
                        >
                          Max Clean
                        </button>
                      </div>

                      {/* Amount Input */}
                      <div className="space-y-1.5">
                        <input
                          type="number"
                          min={0}
                          max={maxCleanable}
                          value={launderAmount || ''}
                          onChange={(e) => setLaunderAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          placeholder={`Max $${maxCleanable.toLocaleString()}...`}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-sm font-mono"
                        />
                      </div>

                      {/* Calculation Breakdown */}
                      {launderAmount > 0 && (
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                          <div className="flex justify-between text-slate-400">
                            <span>Street Cash Deducted:</span>
                            <strong className="text-slate-200">-${launderAmount.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Layering Fee ({Math.round(effFee * 1000) / 10}%):</span>
                            <strong className="text-rose-400">-${Math.round(launderAmount * effFee).toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-300">
                            <span>Net Clean Wire to Bank:</span>
                            <strong className="text-emerald-400 text-sm">+${netClean.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                            <span>FinCEN Audit Threat:</span>
                            <span className={hasOffshoreLegal ? 'text-emerald-400' : 'text-amber-400'}>
                              {hasOffshoreLegal ? '0% (Immune via Retained Counsel)' : `${Math.round(activeBusiness.auditRisk * 100)}% Risk`}
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleLaunder}
                        disabled={launderAmount <= 0 || player.cash < launderAmount || launderAmount > remainingCap}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 font-black text-slate-950 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span>Execute Clean Offshore Wire</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* LOAN SHARK TAB */}
        {placesSubTab === 'loans' && (
          <div className="space-y-6 max-w-xl mx-auto">
            {player.debt > 0 ? (
              <div className="bg-rose-950/40 p-5 rounded-2xl border border-rose-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-rose-300 font-bold uppercase tracking-wider">Active Syndicate Debt</div>
                    <div className="text-3xl font-black text-rose-400 mt-1">
                      ${player.debt.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-medium">Creditor: <span className="text-slate-200 font-bold">{activeShark?.name ?? 'Loan Shark'}</span></div>
                    <div
                      className={`text-sm font-bold mt-1 ${
                        player.loanDaysLeft <= 1 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                      }`}
                    >
                      {player.loanDaysLeft > 0 ? `${player.loanDaysLeft} days remaining` : 'Term expired (Overdue!)'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Interest: {Math.round((activeShark?.interestRate ?? 0.1) * 100)}%/day compounding
                    </div>
                  </div>
                </div>

                {/* Early Payoff Warning Callout */}
                {isEarly && (
                  <div className="mt-4 p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start gap-3 text-xs text-amber-200/90">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                        <span>Early Payoff Surcharge ({Math.round(earlyFeeRate * 100)}% Prepayment Vig)</span>
                      </div>
                      <p className="mt-1 text-amber-200/80 leading-relaxed">
                        {activeShark?.name ?? 'The loan shark'} expected {player.loanDaysLeft} more days of compounding interest. Settling debt early incurs a mandatory <strong className="text-amber-300 font-bold">{Math.round(earlyFeeRate * 100)}% early payment charge</strong> on principal settled!
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-rose-900/60 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-semibold">Repayment Amount:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLoanAmount(maxAffordablePrincipal)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold hover:underline"
                        title="Maximum debt you can repay with current cash including fee"
                      >
                        Max Affordable (${maxAffordablePrincipal.toLocaleString()})
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        onClick={() => setLoanAmount(player.debt)}
                        className="text-amber-400 hover:text-amber-300 text-xs font-semibold hover:underline"
                        title="Set to full outstanding debt"
                      >
                        Full Debt (${player.debt.toLocaleString()})
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    min={0}
                    max={player.debt}
                    value={loanAmount || ''}
                    onChange={(e) => setLoanAmount(Math.max(0, Math.min(player.debt, parseInt(e.target.value, 10) || 0)))}
                    placeholder={`Enter principal to repay (max $${player.debt.toLocaleString()})...`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-rose-500 text-base"
                  />

                  {/* Quick Repayment Presets */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setLoanAmount(Math.max(0, Math.min(player.debt, Math.floor(player.debt * 0.25))))}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-rose-300 font-mono font-bold text-xs transition-colors shadow-sm"
                    >
                      Repay 25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanAmount(Math.max(0, Math.min(player.debt, Math.floor(player.debt * 0.50))))}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-rose-300 font-mono font-bold text-xs transition-colors shadow-sm"
                    >
                      Repay 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanAmount(Math.max(0, Math.min(player.debt, Math.floor(player.debt * 0.75))))}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-rose-300 font-mono font-bold text-xs transition-colors shadow-sm"
                    >
                      Repay 75%
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanAmount(maxAffordablePrincipal)}
                      className="py-1.5 px-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 font-mono font-black text-xs transition-colors shadow-sm"
                    >
                      Max Afford
                    </button>
                  </div>

                  {/* Financial Breakdown if loanAmount > 0 */}
                  {loanAmount > 0 && (
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Debt Principal Cleared:</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ${repayDetails.actualPayment.toLocaleString()}
                        </span>
                      </div>
                      {isEarly && repayDetails.earlyFee > 0 && (
                        <div className="flex justify-between text-amber-400">
                          <span>Early Payment Charge ({Math.round(earlyFeeRate * 100)}%):</span>
                          <span className="font-bold font-mono">
                            +${repayDetails.earlyFee.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-slate-800/80 pt-2 flex justify-between text-sm font-black">
                        <span className="text-slate-300">Total Cash Outflow:</span>
                        <span className={`font-mono ${player.cash >= repayDetails.totalCashRequired ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${repayDetails.totalCashRequired.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Cash in Pocket:</span>
                        <span className="font-mono text-slate-400">${player.cash.toLocaleString()}</span>
                      </div>
                      {!canAffordCurrent && (
                        <div className="text-[11px] text-rose-400 font-bold bg-rose-950/50 p-2 rounded-lg border border-rose-900/60 mt-1">
                          ⚠️ Insufficient cash! Need an additional ${(repayDetails.totalCashRequired - player.cash).toLocaleString()} to cover the debt and early payment charge.
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleRepay}
                    disabled={loanAmount <= 0 || !canAffordCurrent}
                    className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 text-sm transition-all shadow-md active:scale-95"
                  >
                    {loanAmount <= 0
                      ? 'Enter Amount to Repay'
                      : !canAffordCurrent
                      ? `Insufficient Cash ($${repayDetails.totalCashRequired.toLocaleString()} Needed)`
                      : isEarly && repayDetails.earlyFee > 0
                      ? `Pay $${repayDetails.totalCashRequired.toLocaleString()} ($${repayDetails.actualPayment.toLocaleString()} Debt + $${repayDetails.earlyFee.toLocaleString()} Fee)`
                      : `Pay $${repayDetails.actualPayment.toLocaleString()} Debt`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-slate-400">
                  Select a loan shark syndicate to negotiate fresh working capital:
                </div>
                <div className="space-y-2.5">
                  {LOAN_SHARKS.map((shark) => {
                    const maxLoan = Math.min(shark.maxLoan, Math.max(1000, player.cash * shark.multiplier));
                    const earlyFee = Math.round((shark.earlyFeeRate ?? shark.interestRate) * 100);
                    return (
                      <div
                        key={shark.id}
                        onClick={() => setSelectedSharkId(shark.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                          selectedSharkId === shark.id
                            ? 'bg-rose-950/40 border-rose-500 text-slate-100'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <SharkImage shark={shark} size="md" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center font-bold text-sm">
                              <span className="text-slate-200">{shark.name}</span>
                              <span className="text-rose-400">
                                {Math.round(shark.interestRate * 100)}% daily interest
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{shark.description}</p>
                            <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-mono">
                              <span>Grace: {shark.repayDays} days</span>
                              <span>Max Credit: ${Math.round(maxLoan).toLocaleString()}</span>
                              <span className="text-amber-400">Early Fee: {earlyFee}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 space-y-2.5">
                  <input
                    type="number"
                    min={0}
                    value={loanAmount || ''}
                    onChange={(e) => setLoanAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="Borrow amount..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-bold text-base"
                  />
                  <button
                    onClick={handleBorrow}
                    disabled={loanAmount <= 0}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 font-black text-slate-950 text-sm transition-all active:scale-95"
                  >
                    Accept Syndicate Loan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLINIC / HOSPITAL TAB */}
        {placesSubTab === 'hospital' && (
          <div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="bg-slate-950/80 p-8 rounded-2xl border border-slate-800">
              <HeartPulse className="w-12 h-12 text-pink-500 mx-auto mb-3 animate-pulse" />
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Physical Condition</div>
              <div className="text-4xl font-black text-slate-100 mt-1">{player.health}% HP</div>

              <div className="mt-4 text-sm text-slate-400">
                {player.health === 100 ? (
                  <span className="text-emerald-400 font-semibold">
                    You are in peak physical shape. No medical intervention needed.
                  </span>
                ) : (
                  <span>
                    Medical bill to treat bullet wounds and fractures:{' '}
                    <strong className="text-rose-400 font-bold">${hospitalCost.toLocaleString()}</strong>
                  </span>
                )}
              </div>

              {player.health < 100 && (
                <button
                  onClick={handleHeal}
                  disabled={player.cash < hospitalCost}
                  className="mt-6 px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-sm transition-all shadow-lg active:scale-95"
                >
                  Pay Clinic & Restore 100% HP
                </button>
              )}
            </div>
          </div>
        )}

        {/* ARMORY / GUN STORE TAB */}
        {placesSubTab === 'armory' && (
          <div className="space-y-5 max-w-4xl mx-auto">
            {/* Loadout Status Bar */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div>
                  <span className="text-slate-500 uppercase block text-[10px]">Equipped Armor</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {player.armor?.id ? WEAPONS.find((w) => w.id === player.armor?.id)?.name : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block text-[10px]">No-Scent Cans</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {player.noScentCans || 0} / 10
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block text-[10px]">M84 Stun</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {player.combatConsumables?.flashbangs || 0} / 10
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block text-[10px]">Smoke Screens</span>
                  <span className="font-bold text-sky-400 text-sm">
                    {player.combatConsumables?.smokeGrenades || 0} / 10
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block text-[10px]">Medkits</span>
                  <span className="font-bold text-rose-400 text-sm">
                    {player.combatConsumables?.medkits || 0} / 10
                  </span>
                </div>
              </div>
              <div className="text-slate-400 text-xs hidden sm:block">
                Hover any item to inspect tactical stats & zoom card.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {WEAPONS.map((item) => {
                let count = 0;
                let isOwned = false;

                if (item.type === 'weapon') {
                  count = player.weapons[item.id] || 0;
                  isOwned = count > 0;
                } else if (item.type === 'armor') {
                  isOwned = player.armor?.id === item.id;
                  count = isOwned ? 1 : 0;
                } else if (item.type === 'utility') {
                  if (item.id === 'no_scent') count = player.noScentCans || 0;
                  else if (item.id === 'flashbang') count = player.combatConsumables?.flashbangs || 0;
                  else if (item.id === 'smoke_grenade') count = player.combatConsumables?.smokeGrenades || 0;
                  else if (item.id === 'combat_medkit') count = player.combatConsumables?.medkits || 0;
                  isOwned = count > 0;
                }

                const canAfford = player.cash >= item.price;

                return (
                  <ArmoryPreviewCard
                    key={item.id}
                    item={item}
                    onPurchase={handleBuyWeapon}
                    canAfford={canAfford}
                    isOwned={isOwned}
                    ownedCount={count}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* PRIVATE AVIATION FLEET & JETS TAB */}
        {placesSubTab === 'aviation' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Top Status Banner */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm uppercase">
                  <Plane className="w-5 h-5" /> Private Executive Fleet & Smuggling Aviation
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Acquire high-altitude turboprops and long-range business jets to expand your personal carrying capacity and evade international customs interdiction. Commercial airports and flip-boards remain permanently accessible.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Hangar Fleet</div>
                  <div className="text-xl font-black text-sky-400">
                    {player.ownedAircraft?.length ?? 0} / {AIRCRAFT_FLEET.length}
                  </div>
                </div>

                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Active Flagship</div>
                  <div className="text-sm font-black text-emerald-400 truncate max-w-[150px]">
                    {player.selectedAircraftId
                      ? AIRCRAFT_FLEET.find((a) => a.id === player.selectedAircraftId)?.name.split(' ')[0] ?? 'Active'
                      : 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Hangar Facility & Fuel Status */}
            {(() => {
              const hasHangar =
                (player.ownedProperties || []).includes('private_hangar') ||
                (player.ownedProperties || []).includes('sovereign_airstrip_compound');

              return (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    hasHangar
                      ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                      : 'bg-amber-950/30 border-amber-700/50 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {hasHangar ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-black text-sm">
                        {hasHangar
                          ? 'Private Hangar Refueling Depot Active'
                          : 'Commercial FBO Refueling Protocol'}
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {hasHangar
                          ? 'Complimentary high-octane kerosene unlocked from your owned aviation property. All private flights cost $0 fuel!'
                          : 'Flights consume standard aviation fuel costs. Acquire a Private Hangar or Sovereign Airfield in Safehouses & Real Estate for $0 free fuel.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPlacesSubTab('properties')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs shrink-0 transition-colors"
                  >
                    View Safehouses
                  </button>
                </div>
              );
            })()}

            {/* Commercial Airport Accessibility Guarantee Notice */}
            <div className="bg-sky-950/30 border border-sky-800/40 p-3.5 rounded-xl flex items-center gap-3 text-xs text-sky-200">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong>Airport Mobility Guarantee:</strong> Owning private aircraft gives you the option to dispatch your personal jet for zero customs risk, but you can <em>always continue using commercial airports</em>, coach flights, and the departures flip-board at will from the Travel menu.
              </span>
            </div>

            {/* Aircraft Fleet Showroom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AIRCRAFT_FLEET.map((craft) => {
                const isOwned = (player.ownedAircraft || []).includes(craft.id);
                const isActive = player.selectedAircraftId === craft.id;
                const canAfford = player.cash >= craft.price;
                const fuelCost = calculateAircraftFlightCost(craft, player.ownedProperties || []);

                return (
                  <div
                    key={craft.id}
                    className={`bg-slate-950/70 border rounded-2xl p-4 flex flex-col justify-between transition-all group ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/30'
                        : isOwned
                        ? 'border-sky-500/60 bg-sky-950/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Aircraft Image */}
                      <AircraftImage aircraft={craft} className="w-full h-40 mb-3" />

                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{craft.icon}</span>
                            <h4 className="font-bold text-slate-100 text-base group-hover:text-sky-300 transition-colors">
                              {craft.name}
                            </h4>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{craft.model}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sky-400 font-black text-base">
                            ${craft.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            {isOwned ? 'Acquired' : 'Purchase Price'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-sans">
                        {craft.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase block">Bonus Stash</span>
                          <strong className="text-emerald-400 text-sm">+{craft.cargoBonus.toLocaleString()}</strong>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase block">Customs Evade</span>
                          <strong className="text-cyan-400 text-sm">-{Math.round(craft.customsReduction * 100)}%</strong>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase block">Flight Fuel</span>
                          <strong className={fuelCost === 0 ? 'text-emerald-400 text-sm' : 'text-amber-400 text-sm'}>
                            {fuelCost === 0 ? 'FREE' : `$${fuelCost.toLocaleString()}`}
                          </strong>
                        </div>
                      </div>

                      {isOwned ? (
                        <div className="flex gap-2">
                          {isActive ? (
                            <>
                              <button
                                disabled
                                className="flex-1 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 cursor-default shadow-sm"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Active Flagship</span>
                              </button>
                              <button
                                onClick={() => handleSelectActiveAircraft(null)}
                                className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
                                title="Stand down flagship"
                              >
                                Stand Down
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleSelectActiveAircraft(craft.id)}
                              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <Plane className="w-4 h-4" />
                              <span>Set as Active Flagship</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuyAircraft(craft.id)}
                          disabled={!canAfford}
                          className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
                        >
                          {canAfford ? `Acquire Aircraft ($${craft.price.toLocaleString()})` : 'Insufficient Cash'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
