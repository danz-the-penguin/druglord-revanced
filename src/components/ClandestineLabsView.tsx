import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  LAB_ROOMS,
  PRECURSORS,
  COOK_RECIPES,
  isSeaportCity,
  getPrecursorPrice,
  getLabMaxSlots,
  getLabAvailableSlots,
  canBuildLab,
  canStartCookBatch,
} from '../engine/production';
import { LabType } from '../engine/productionTypes';
import { DRUG_MAP, PROPERTY_MAP, CITY_MAP } from '../engine/constants';
import {
  FlaskConical,
  Palmtree,
  Disc,
  Dna,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ship,
  Plus,
  Trash2,
  Building2,
  Package,
} from 'lucide-react';

export const ClandestineLabsView: React.FC = () => {
  const {
    player,
    market,
    buildLabAction,
    buyPrecursorAction,
    startCookBatchAction,
    collectCookBatchAction,
    cancelCookBatchAction,
  } = useGameStore();

  const [activeSubView, setActiveSubView] = useState<'batches' | 'cook' | 'precursors' | 'build'>('batches');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    player.ownedProperties[0] || 'suburban_safehouse'
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('recipe_pot');
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);
  const [precursorBuyQty, setPrecursorBuyQty] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSeaport = isSeaportCity(player.currentCityId);
  const currentCityName = CITY_MAP.get(player.currentCityId)?.name ?? 'Current City';
  const activeBatches = player.activeCookBatches || [];
  const readyBatchesCount = activeBatches.filter((b) => b.status === 'ready').length;

  const handleBuildLab = (labType: LabType) => {
    setFeedback(null);
    const res = buildLabAction(selectedPropertyId, labType);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleBuyPrecursor = (precursorId: string, payFrom: 'cash' | 'bank') => {
    setFeedback(null);
    const qty = precursorBuyQty[precursorId] || 1;
    const res = buyPrecursorAction(precursorId, qty, payFrom);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) {
      setPrecursorBuyQty((prev) => ({ ...prev, [precursorId]: 1 }));
    }
  };

  const handleStartCook = () => {
    setFeedback(null);
    const res = startCookBatchAction(selectedPropertyId, selectedRecipeId, batchMultiplier);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) {
      setActiveSubView('batches');
    }
  };

  const handleCollect = (batchId: string, destination: 'pocket' | 'vault') => {
    setFeedback(null);
    const res = collectCookBatchAction(batchId, destination);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleCancel = (batchId: string) => {
    setFeedback(null);
    const res = cancelCookBatchAction(batchId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const getLabIcon = (type: LabType) => {
    switch (type) {
      case 'hydro_greenhouse':
        return <Palmtree className="w-5 h-5 text-emerald-400" />;
      case 'chemical_reflux':
        return <FlaskConical className="w-5 h-5 text-amber-400" />;
      case 'pill_press':
        return <Disc className="w-5 h-5 text-sky-400" />;
      case 'bio_reactor':
        return <Dna className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 shadow-md shadow-emerald-950/50">
              <FlaskConical className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Clandestine Production & Precursor Logistics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Construct modular manufacturing labs, acquire chemical precursors, and synthesize wholesale contraband for 70–80% profit margins.
              </p>
            </div>
          </div>

          {/* Seaport Status Badge */}
          <div className="flex items-center gap-2 text-xs">
            {isSeaport ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/90 border border-sky-600/80 text-sky-300 font-bold shadow-md shadow-sky-950">
                <Ship className="w-4 h-4 text-sky-400 shrink-0 animate-bounce" />
                <span>SEAPORT LOGISTICS HUB (30% PRECURSOR DISCOUNT)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Standard Chemical Broker ({currentCityName})</span>
              </span>
            )}
          </div>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveSubView('batches')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubView === 'batches'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950 font-black'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Cook Batches ({activeBatches.length})</span>
            {readyBatchesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-300 text-slate-950 text-[10px] font-black animate-pulse">
                {readyBatchesCount} READY
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubView('cook')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubView === 'cook'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950 font-black'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Cook & Synthesis Console</span>
          </button>

          <button
            onClick={() => setActiveSubView('precursors')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubView === 'precursors'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950 font-black'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Precursor Supply Market</span>
          </button>

          <button
            onClick={() => setActiveSubView('build')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubView === 'build'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950 font-black'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Construct Modular Labs</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
              : 'bg-rose-950/70 border-rose-700 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* VIEW 1: ACTIVE COOK BATCHES */}
      {activeSubView === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Live Synthesis & Fermentation Vats ({activeBatches.length} In Progress)
            </span>
            <span>Batches advance 1 day on calendar rollover</span>
          </div>

          {activeBatches.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
              <FlaskConical className="w-10 h-10 text-slate-600 mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-slate-300">All Laboratory Vats Are Idle</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You have no active synthesis or cultivation batches running. Stock chemical precursors and launch a batch from the Cook Console!
              </p>
              <button
                onClick={() => setActiveSubView('cook')}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black transition-all cursor-pointer"
              >
                Open Cook Console →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBatches.map((batch) => {
                const drug = DRUG_MAP.get(batch.outputDrugId);
                const prop = PROPERTY_MAP.get(batch.propertyId);
                const isReady = batch.status === 'ready';
                const progressPct = Math.round(
                  ((batch.totalDays - batch.daysRemaining) / batch.totalDays) * 100
                );
                const spotPrice = market[batch.outputDrugId]?.price ?? drug?.basePrice ?? 100;
                const estimatedValue = batch.outputUnits * spotPrice;

                return (
                  <div
                    key={batch.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isReady
                        ? 'bg-emerald-950/30 border-emerald-500/80 shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                          {getLabIcon(batch.labType)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-100">{batch.recipeName}</h4>
                          <span className="text-[11px] text-slate-400">
                            {prop?.name ?? 'Safehouse Lab'} • {batch.batchCount}x Batch
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isReady
                            ? 'bg-emerald-400 text-slate-950 animate-pulse'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                        }`}
                      >
                        {isReady ? 'READY TO HARVEST' : `${batch.daysRemaining}d Remaining`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Synthesis Progress</span>
                        <span className="text-emerald-400 font-bold">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isReady ? 'bg-emerald-400' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Yield & Value */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase block">Expected Yield</span>
                        <strong className="text-slate-200">
                          {batch.outputUnits}x {drug?.name ?? batch.outputDrugId}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[10px] uppercase block">Est. Market Value</span>
                        <strong className="text-emerald-400">${estimatedValue.toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      {isReady ? (
                        <>
                          <button
                            onClick={() => handleCollect(batch.id, 'pocket')}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-950 cursor-pointer"
                          >
                            Collect to Stash
                          </button>
                          <button
                            onClick={() => handleCollect(batch.id, 'vault')}
                            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                            title="Deposit directly into current safehouse vault"
                          >
                            Store in Vault
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleCancel(batch.id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Scrap batch (destroys precursors)"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Scrap Batch</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: COOK & SYNTHESIS CONSOLE */}
      {activeSubView === 'cook' && (
        <div className="space-y-5">
          {/* Facility Selector */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-300">Select Production Facility:</span>
            </div>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {player.ownedProperties.map((propId) => {
                const prop = PROPERTY_MAP.get(propId);
                const installed = player.installedLabs?.[propId] || [];
                return (
                  <option key={propId} value={propId}>
                    {prop?.name ?? propId} ({installed.length} Labs Installed)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Recipes Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COOK_RECIPES.map((recipe) => {
              const lab = LAB_ROOMS[recipe.labType];
              const drug = DRUG_MAP.get(recipe.outputDrugId);
              const installed = player.installedLabs?.[selectedPropertyId] || [];
              const hasLab = installed.includes(recipe.labType);

              const isSelected = selectedRecipeId === recipe.id;

              // Precursor requirement check
              const precursorInv = player.precursorInventory || {};
              const spotPrice = market[recipe.outputDrugId]?.price ?? drug?.basePrice ?? 100;
              const totalOutputUnits = recipe.outputUnits * batchMultiplier;
              const totalGrossValue = totalOutputUnits * spotPrice;

              let totalCostBasis = 0;
              for (const ing of recipe.ingredients) {
                const prec = PRECURSORS[ing.precursorId];
                if (prec) {
                  totalCostBasis += prec.basePrice * ing.amount * batchMultiplier;
                }
              }
              const profitMargin = Math.round(
                ((totalGrossValue - totalCostBasis) / Math.max(1, totalCostBasis)) * 100
              );

              return (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        {getLabIcon(recipe.labType)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-100">{recipe.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          Requires: {lab.name}
                        </span>
                      </div>
                    </div>

                    {!hasLab && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 uppercase font-black shrink-0">
                        Lab Not Installed
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed font-sans">
                    {recipe.description}
                  </p>

                  {/* Required Precursors */}
                  <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">
                      Chemical Precursor Inputs (Per Batch):
                    </span>
                    {recipe.ingredients.map((ing) => {
                      const prec = PRECURSORS[ing.precursorId];
                      const available = precursorInv[ing.precursorId] || 0;
                      const needed = ing.amount * batchMultiplier;
                      const hasEnough = available >= needed;

                      return (
                        <div key={ing.precursorId} className="flex items-center justify-between">
                          <span className="text-slate-300 flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                hasEnough ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                            />
                            {prec?.name ?? ing.precursorId}
                          </span>
                          <span
                            className={`font-bold ${
                              hasEnough ? 'text-slate-300' : 'text-rose-400'
                            }`}
                          >
                            {available} / {needed} units
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Economics preview */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Yield (Units)</span>
                      <strong className="text-slate-200">
                        +{recipe.outputUnits * batchMultiplier}x {drug?.name ?? recipe.outputDrugId}
                      </strong>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-500 text-[10px] block">Cook Duration</span>
                      <strong className="text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.cookDays} {recipe.cookDays === 1 ? 'Day' : 'Days'}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] block">Profit Margin</span>
                      <strong className="text-emerald-400 font-black">
                        +{profitMargin}%
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Launch Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold uppercase">Batch Multiplier:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[1, 2, 3, 5, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setBatchMultiplier(count)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      batchMultiplier === count
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {count}x
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartCook}
              disabled={!canStartCookBatch(player, selectedPropertyId, selectedRecipeId, batchMultiplier).allowed}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                canStartCookBatch(player, selectedPropertyId, selectedRecipeId, batchMultiplier).allowed
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Commence Production Cook ({batchMultiplier}x)</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: SEAPORT PRECURSOR CHEMICAL SUPPLY */}
      {activeSubView === 'precursors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Commercial Industrial Chemicals & Precursors
            </span>
            <span>
              {isSeaport ? '🚢 Maritime Seaport Discount Active (-30%)' : 'Standard Landlocked Rate'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(PRECURSORS).map((prec) => {
              const currentPrice = getPrecursorPrice(prec.id, player.currentCityId);
              const qty = precursorBuyQty[prec.id] || 1;
              const totalCost = currentPrice * qty;
              const playerHeld = player.precursorInventory?.[prec.id] || 0;

              return (
                <div
                  key={prec.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-100">{prec.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {prec.chemicalFormula} • CAS {prec.casNumber}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          prec.hazardRating === 'Severe'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : prec.hazardRating === 'High'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {prec.hazardRating} Hazard
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 font-sans leading-relaxed">
                      {prec.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Spot Unit Cost</span>
                      <div className="text-right">
                        <strong className="text-emerald-400">${currentPrice.toLocaleString()}</strong>
                        {isSeaport && (
                          <span className="text-[10px] text-sky-400 block font-bold">
                            -30% Seaport Deal
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Current Inventory</span>
                      <strong className="text-slate-200">{playerHeld} units held</strong>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 pt-1">
                      <span className="text-[11px] text-slate-500 font-bold">Qty:</span>
                      {[1, 5, 20, 50].map((q) => (
                        <button
                          key={q}
                          onClick={() => setPrecursorBuyQty((prev) => ({ ...prev, [prec.id]: q }))}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            qty === q
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          +{q}
                        </button>
                      ))}
                    </div>

                    {/* Purchase Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handleBuyPrecursor(prec.id, 'cash')}
                        disabled={player.cash < totalCost}
                        className={`py-1.5 rounded-xl font-bold text-xs transition-all ${
                          player.cash >= totalCost
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 cursor-pointer shadow-md shadow-emerald-950'
                            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                        }`}
                      >
                        Cash (${totalCost.toLocaleString()})
                      </button>

                      <button
                        onClick={() => handleBuyPrecursor(prec.id, 'bank')}
                        disabled={player.bank < totalCost}
                        className={`py-1.5 rounded-xl font-bold text-xs transition-all ${
                          player.bank >= totalCost
                            ? 'bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 cursor-pointer'
                            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                        }`}
                      >
                        Bank Wire
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: CONSTRUCT MODULAR LAB ROOMS */}
      {activeSubView === 'build' && (
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-300">Target Safehouse / Property:</span>
            </div>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {player.ownedProperties.map((propId) => {
                const prop = PROPERTY_MAP.get(propId);
                const max = getLabMaxSlots(propId);
                const avail = getLabAvailableSlots(player, propId);
                return (
                  <option key={propId} value={propId}>
                    {prop?.name ?? propId} ({avail} / {max} Slots Open)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(LAB_ROOMS).map((lab) => {
              const installed = player.installedLabs?.[selectedPropertyId] || [];
              const isInstalled = installed.includes(lab.id);
              const check = canBuildLab(player, selectedPropertyId, lab.id);

              return (
                <div
                  key={lab.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                    isInstalled
                      ? 'bg-emerald-950/20 border-emerald-600/70'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                          {getLabIcon(lab.id)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-100">{lab.name}</h4>
                          <span className="text-xs text-emerald-400 font-bold">
                            {lab.codename}
                          </span>
                        </div>
                      </div>

                      {isInstalled ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-black uppercase">
                          Operational
                        </span>
                      ) : (
                        <span className="text-sm font-black text-slate-100 font-mono">
                          ${lab.cost.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
                      {lab.description}
                    </p>

                    <div className="mt-3 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                      <strong className="text-amber-400 block mb-0.5">Synthesis Role:</strong>
                      {lab.outputSummary}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleBuildLab(lab.id)}
                      disabled={isInstalled || !check.allowed}
                      className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                        isInstalled
                          ? 'bg-slate-900 text-slate-500 cursor-default border border-slate-800'
                          : check.allowed
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 cursor-pointer active:scale-95'
                          : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                      }`}
                    >
                      {isInstalled
                        ? 'Already Operational'
                        : check.allowed
                        ? `Construct Lab Module ($${lab.cost.toLocaleString()})`
                        : check.reason || 'Cannot Build'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
