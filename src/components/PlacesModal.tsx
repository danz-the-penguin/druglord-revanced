import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { LOAN_SHARKS, SHARK_MAP, WEAPONS, PROPERTIES } from '../engine/constants';
import { getEarlyRepayDetails } from '../engine/game';
import { PropertyImage } from './PropertyImage';
import { WeaponImage } from './WeaponImage';
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
} from 'lucide-react';

export const PlacesModal: React.FC = () => {
  const {
    player,
    placesSubTab,
    setPlacesSubTab,
    deposit,
    withdraw,
    repay,
    borrow,
    heal,
    buyPropertyAction,
    buyWeaponAction,
  } = useGameStore();

  const [bankAmount, setBankAmount] = useState<number>(0);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [selectedSharkId, setSelectedSharkId] = useState<string>('buddles');
  const [launderAmount, setLaunderAmount] = useState<number>(0);
  const [selectedFront, setSelectedFront] = useState<{ name: string; fee: number; limit: number }>({
    name: 'Suburban Laundromat',
    fee: 0.08,
    limit: 50000,
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleLaunder = () => {
    setFeedback(null);
    if (launderAmount <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid amount to wash' });
      return;
    }
    if (player.cash < launderAmount) {
      setFeedback({ type: 'error', message: 'Not enough liquid cash on hand' });
      return;
    }
    if (launderAmount > selectedFront.limit) {
      setFeedback({
        type: 'error',
        message: `${selectedFront.name} can only clean up to $${selectedFront.limit.toLocaleString()} at a time.`,
      });
      return;
    }

    const feeCost = Math.round(launderAmount * selectedFront.fee);
    const cleanAmount = launderAmount - feeCost;

    player.cash -= launderAmount;
    player.bank += cleanAmount;

    setFeedback({
      type: 'success',
      message: `Cleaned $${cleanAmount.toLocaleString()} into offshore bank via ${selectedFront.name} (Fee: $${feeCost.toLocaleString()}).`,
    });
    setLaunderAmount(0);
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
          </div>
        )}

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

        {/* MONEY LAUNDERING & SHELL BUSINESSES TAB */}
        {placesSubTab === 'laundering' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase mb-1">
                <Landmark className="w-5 h-5" /> Narco-Fintech Laundering Engine
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transform dirty street cash into clean offshore bank deposits through layered corporate structures and privacy mixer pools.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Suburban Laundromat & Car Wash', fee: 0.10, limit: 25000, desc: 'Small cash-intensive local business. Easy to hide small batches.' },
                { name: 'Neon VIP Nightclub & Lounge', fee: 0.07, limit: 150000, desc: 'High-volume weekend ticket and bottle service cash flow.' },
                { name: 'Panama Shell LLC & Real Estate', fee: 0.04, limit: 1000000, desc: 'Offshore nominee director trust structure with encrypted banking.' },
                { name: 'Decentralized Crypto Mixer Protocol', fee: 0.02, limit: 10000000, desc: 'Institutional zero-knowledge privacy pool for unlimited liquidation.' },
              ].map((front) => (
                <div
                  key={front.name}
                  onClick={() => setSelectedFront(front)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedFront.name === front.name
                      ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-200">{front.name}</span>
                    <span className="text-emerald-400">{Math.round(front.fee * 100)}% Fee</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{front.desc}</p>
                  <div className="text-xs text-slate-400 mt-2 flex justify-between font-mono">
                    <span>Batch Limit: ${front.limit.toLocaleString()}</span>
                    <span>Net Rate: {Math.round((1 - front.fee) * 100)}% to Bank</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-semibold">Street Cash to Clean:</span>
                <button
                  onClick={() => setLaunderAmount(Math.min(player.cash, selectedFront.limit))}
                  className="text-emerald-400 hover:underline text-xs"
                >
                  Max (${Math.min(player.cash, selectedFront.limit).toLocaleString()})
                </button>
              </div>
              <input
                type="number"
                min={0}
                max={selectedFront.limit}
                value={launderAmount || ''}
                onChange={(e) => setLaunderAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder={`Max $${selectedFront.limit.toLocaleString()}...`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-base"
              />

              {launderAmount > 0 && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-sm flex justify-between">
                  <span className="text-slate-400">Net Clean Wire to Bank:</span>
                  <strong className="text-emerald-400 font-black">
                    ${Math.round(launderAmount * (1 - selectedFront.fee)).toLocaleString()}
                  </strong>
                </div>
              )}

              <button
                onClick={handleLaunder}
                disabled={launderAmount <= 0 || player.cash < launderAmount}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 font-black text-slate-950 text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Execute Corporate Wire</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
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
              </div>
              <div className="text-slate-400 text-xs">
                Firearms protect you against cartel hit squads and DEA raids.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {WEAPONS.map((item) => {
                const isOwned =
                  item.type === 'weapon'
                    ? (player.weapons[item.id] || 0) > 0
                    : item.type === 'armor'
                    ? player.armor?.id === item.id
                    : false;

                const count = player.weapons[item.id] || 0;
                const canAfford = player.cash >= item.price;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <WeaponImage item={item} size="md" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-100 text-sm">{item.name}</span>
                          <span className="text-amber-400 font-black text-sm">
                            ${item.price.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold capitalize">
                        {item.type === 'weapon'
                          ? `Damage: ${item.damage} ${count > 0 ? `(Owned: ${count})` : ''}`
                          : item.type === 'armor'
                          ? `Defense: +${Math.round((item.defense ?? 0) * 100)}%`
                          : `Masks: ${item.maskUnits} units`}
                      </span>
                      <button
                        onClick={() => handleBuyWeapon(item.id)}
                        disabled={!canAfford}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 font-bold text-xs transition-colors shadow-sm"
                      >
                        {isOwned && item.type === 'armor' ? 'Equipped' : 'Purchase'}
                      </button>
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
