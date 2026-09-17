import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { LOAN_SHARKS, SHARK_MAP, WEAPONS } from '../engine/constants';
import { Building2, Skull, HeartPulse, Crosshair, Landmark, ArrowRight } from 'lucide-react';

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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl font-mono">
      {/* Subtab navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/80 overflow-x-auto text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setPlacesSubTab('bank')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'bank'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Offshore Bank
        </button>

        <button
          onClick={() => setPlacesSubTab('laundering')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'laundering'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-4 h-4" /> Shells & Laundering
        </button>

        <button
          onClick={() => setPlacesSubTab('loans')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'loans'
              ? 'border-rose-400 text-rose-400 bg-rose-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Skull className="w-4 h-4" /> Loan Sharks
        </button>

        <button
          onClick={() => setPlacesSubTab('hospital')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'hospital'
              ? 'border-amber-400 text-amber-400 bg-amber-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4" /> Clinic
        </button>

        <button
          onClick={() => setPlacesSubTab('armory')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            placesSubTab === 'armory'
              ? 'border-indigo-400 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crosshair className="w-4 h-4" /> Armory
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs font-bold border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* BANK TAB */}
        {placesSubTab === 'bank' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400 uppercase">Offshore Private Account</div>
              <div className="text-3xl font-black text-cyan-400 mt-1">
                ${player.bank.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Offshore bank funds earn 0.1% daily interest and are completely immune to muggings and police confiscation.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Amount:</span>
                <span className="text-slate-300">
                  Cash in hand: <strong className="text-emerald-400">${player.cash.toLocaleString()}</strong>
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={bankAmount || ''}
                onChange={(e) => setBankAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="Enter dollar amount..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-500 text-sm"
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDeposit}
                  disabled={bankAmount <= 0 || player.cash < bankAmount}
                  className="py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-colors"
                >
                  Deposit Cash
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={bankAmount <= 0 || player.bank < bankAmount}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
                >
                  Withdraw to Pocket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MONEY LAUNDERING & SHELL BUSINESSES TAB */}
        {placesSubTab === 'laundering' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
                <Landmark className="w-4 h-4" /> Narco-Fintech Laundering Engine
              </div>
              <p className="text-[11px] text-slate-400">
                Transform dirty street cash into clean offshore bank deposits through layered corporate structures.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Suburban Laundromat & Car Wash', fee: 0.10, limit: 25000, desc: 'Small cash-intensive local business. Easy to hide small batches.' },
                { name: 'Neon VIP Nightclub & Lounge', fee: 0.07, limit: 150000, desc: 'High-volume weekend ticket and bottle service cash flow.' },
                { name: 'Panama Shell LLC & Real Estate', fee: 0.04, limit: 1000000, desc: 'Offshore nominee director trust structure with encrypted banking.' },
                { name: 'Decentralized Crypto Mixer Protocol', fee: 0.02, limit: 10000000, desc: 'Institutional zero-knowledge privacy pool for unlimited liquidation.' },
              ].map((front) => (
                <div
                  key={front.name}
                  onClick={() => setSelectedFront(front)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFront.name === front.name
                      ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-200">{front.name}</span>
                    <span className="text-emerald-400">{Math.round(front.fee * 100)}% Fee</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{front.desc}</p>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between font-mono">
                    <span>Batch Limit: ${front.limit.toLocaleString()}</span>
                    <span>Net Rate: {Math.round((1 - front.fee) * 100)}% to Bank</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Street Cash to Clean:</span>
                <button
                  onClick={() => setLaunderAmount(Math.min(player.cash, selectedFront.limit))}
                  className="text-emerald-400 hover:underline text-[11px]"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-sm"
              />

              {launderAmount > 0 && (
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs flex justify-between">
                  <span className="text-slate-400">Net Clean Wire to Bank:</span>
                  <strong className="text-emerald-400">
                    ${Math.round(launderAmount * (1 - selectedFront.fee)).toLocaleString()}
                  </strong>
                </div>
              )}

              <button
                onClick={handleLaunder}
                disabled={launderAmount <= 0 || player.cash < launderAmount}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-bold text-slate-950 text-xs transition-colors shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5"
              >
                <span>Execute Corporate Wire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* LOAN SHARK TAB */}
        {placesSubTab === 'loans' && (
          <div className="space-y-6 max-w-xl mx-auto">
            {player.debt > 0 ? (
              <div className="bg-rose-950/40 p-4 rounded-xl border border-rose-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-rose-300 font-bold uppercase">Active Debt</div>
                    <div className="text-2xl font-black text-rose-400 mt-1">
                      ${player.debt.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Creditor: {activeShark?.name}</div>
                    <div
                      className={`text-xs font-bold mt-1 ${
                        player.loanDaysLeft <= 1 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                      }`}
                    >
                      {player.loanDaysLeft} days remaining
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-rose-900/60 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Repayment Amount:</span>
                    <button
                      onClick={() => setLoanAmount(Math.min(player.cash, player.debt))}
                      className="text-cyan-400 hover:underline text-[11px]"
                    >
                      Max (${Math.min(player.cash, player.debt).toLocaleString()})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={player.debt}
                    value={loanAmount || ''}
                    onChange={(e) => setLoanAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 font-bold focus:outline-none focus:border-rose-500 text-sm"
                  />
                  <button
                    onClick={handleRepay}
                    disabled={loanAmount <= 0 || player.cash < loanAmount}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 font-bold text-slate-950 text-xs transition-colors"
                  >
                    Pay Loan Shark
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  Select a loan shark to negotiate fresh capital:
                </div>
                <div className="space-y-2">
                  {LOAN_SHARKS.map((shark) => {
                    const maxLoan = Math.min(shark.maxLoan, Math.max(1000, player.cash * shark.multiplier));
                    return (
                      <div
                        key={shark.id}
                        onClick={() => setSelectedSharkId(shark.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedSharkId === shark.id
                            ? 'bg-rose-950/40 border-rose-500 text-slate-100'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold text-xs">
                          <span className="text-slate-200">{shark.name}</span>
                          <span className="text-rose-400">
                            {Math.round(shark.interestRate * 100)}% daily interest
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{shark.description}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                          <span>Grace: {shark.repayDays} days</span>
                          <span>Max: ${Math.round(maxLoan).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 space-y-2">
                  <input
                    type="number"
                    min={0}
                    value={loanAmount || ''}
                    onChange={(e) => setLoanAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="Borrow amount..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 font-bold text-sm"
                  />
                  <button
                    onClick={handleBorrow}
                    disabled={loanAmount <= 0}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 font-bold text-slate-950 text-xs transition-colors"
                  >
                    Accept Loan Terms
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLINIC / HOSPITAL TAB */}
        {placesSubTab === 'hospital' && (
          <div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800">
              <HeartPulse className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <div className="text-xs text-slate-400 uppercase">Health Status</div>
              <div className="text-3xl font-black text-slate-100 mt-1">{player.health}%</div>

              <div className="mt-4 text-xs text-slate-400">
                {player.health === 100 ? (
                  <span className="text-emerald-400">
                    You are currently in peak physical condition. No treatment required.
                  </span>
                ) : (
                  <span>
                    Medical bill to treat all gunshot wounds and fractures: <strong className="text-rose-400">${hospitalCost.toLocaleString()}</strong>
                  </span>
                )}
              </div>

              {player.health < 100 && (
                <button
                  onClick={handleHeal}
                  disabled={player.cash < hospitalCost}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-950/50"
                >
                  Pay Doctor & Restore Full Health
                </button>
              )}
            </div>
          </div>
        )}

        {/* ARMORY / GUN STORE TAB */}
        {placesSubTab === 'armory' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="text-xs text-slate-400 mb-2">
              Black market armory. Protect yourself from police raids, cartel hit squads, and loan shark enforcers.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WEAPONS.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-200 text-xs">{item.name}</span>
                      <span className="text-amber-400 font-bold text-xs">
                        ${item.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{item.description}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 capitalize">
                      {item.type === 'weapon'
                        ? `Damage: ${item.damage}`
                        : item.type === 'armor'
                        ? `Defense: +${Math.round((item.defense ?? 0) * 100)}%`
                        : `Masks: ${item.maskUnits} units`}
                    </span>
                    <button
                      disabled={player.cash < item.price}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-[10px] border border-slate-700 transition-colors"
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
