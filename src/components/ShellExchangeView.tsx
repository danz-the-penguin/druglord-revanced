import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  SHELL_BUSINESSES,
  SHELL_MAP,
  CORPORATE_UPGRADES,
  calculateEffectiveFeeRate,
  calculateEffectiveDailyCapacity,
  calculateTotalShareDividends,
  calculateCorporateDiversification,
  getBusinessSharePrice,
  getBusinessSharesOwned,
  hasControllingStake,
  getControllingSynergies,
  TOTAL_SHARES_PER_BUSINESS,
  CONTROLLING_STAKE_SHARES,
  BROKERAGE_FEE_RATE,
} from '../engine/laundering';
import { ShellImage } from './ShellImage';
import { Sparkline } from './Sparkline';
import { ShellPreviewCard } from './ShellPreviewCard';
import { soundEngine } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import {
  Landmark,
  Briefcase,
  Layers,
  Search,
  X,
  Activity,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  LayoutGrid,
  List,
  Building2,
  Target,
  LineChart,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

export const SHELL_TICKERS: Record<string, string> = {
  laundromat: '$WASH',
  car_wash: '$AUTO',
  underground_sportsbook: '$BETS',
  luxury_watch_boutique: '$TIME',
  nightclub: '$CLUB',
  scrap_metal_foundry: '$IRON',
  construction_contracting: '$BLD',
  art_gallery: '$ARTS',
  freight_shipping: '$PORT',
  private_jet_charter: '$JETS',
  pharmaceutical_packaging: '$PHRM',
  mega_casino_resort: '$VEGAS',
  yacht_brokerage: '$YCHT',
  telecom_voip_network: '$TELC',
  panama_legal_trust: '$PANM',
  chip_foundry: '$CHIP',
  crypto_mining_facility: '$ASIC',
  anesthesia_clinics: '$ANST',
  swiss_depository_bank: '$SWIS',
};

export const SHELL_SECTORS: Record<string, string> = {
  laundromat: 'Consumer Services',
  car_wash: 'Automotive Services',
  underground_sportsbook: 'Gaming & Wagering',
  luxury_watch_boutique: 'Luxury Goods',
  nightclub: 'Hospitality & Nightlife',
  scrap_metal_foundry: 'Industrial Materials',
  construction_contracting: 'Infrastructure',
  art_gallery: 'Fine Arts & Antiquities',
  freight_shipping: 'Maritime Logistics',
  private_jet_charter: 'Aviation Logistics',
  pharmaceutical_packaging: 'Healthcare & Pharma',
  mega_casino_resort: 'Hospitality & Gaming',
  yacht_brokerage: 'Maritime Luxury',
  telecom_voip_network: 'Telecommunications',
  panama_legal_trust: 'Offshore Wealth',
  chip_foundry: 'Semiconductors',
  crypto_mining_facility: 'Digital Assets & FinTech',
  anesthesia_clinics: 'Medical Services',
  swiss_depository_bank: 'Private Banking',
};

type ShellNavTab = 'exchange' | 'portfolio' | 'laundering';
type ShellFilter = 'all' | 'affordable' | 'in_portfolio' | 'controlling' | 'bullish' | 'bearish' | 'high_yield' | 'volatile';
type ShellSortField = 'default' | 'name' | 'price' | 'equity' | 'capacity' | 'pnl';
type ShellSortDir = 'asc' | 'desc';

export const ShellExchangeView: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const buyBusinessSharesAction = useGameStore((s) => s.buyBusinessSharesAction);
  const sellBusinessSharesAction = useGameStore((s) => s.sellBusinessSharesAction);
  const buyCorporateUpgradeAction = useGameStore((s) => s.buyCorporateUpgradeAction);
  const executeBusinessLaunderAction = useGameStore((s) => s.executeBusinessLaunderAction);
  const openShellGraph = useGameStore((s) => s.openShellGraph);
  const toggleBusinessDripAction = useGameStore((s) => s.toggleBusinessDripAction);
  const setAllBusinessDripAction = useGameStore((s) => s.setAllBusinessDripAction);
  const cancelShellLimitOrderAction = useGameStore((s) => s.cancelShellLimitOrderAction);
  const tenderHostileSharesAction = useGameStore((s) => s.tenderHostileSharesAction);
  const defendHostileTakeoverAction = useGameStore((s) => s.defendHostileTakeoverAction);

  // Sub-navigation: Modeled after Market & Stash
  const [activeNav, setActiveNav] = useState<ShellNavTab>('exchange');

  // Exchange & Portfolio state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<ShellFilter>('all');
  const [sortField, setSortField] = useState<ShellSortField>('default');
  const [sortDir, setSortDir] = useState<ShellSortDir>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Selected asset for right-hand Order Terminal
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('laundromat');
  const [orderShares, setOrderShares] = useState<number>(1);
  const [orderMode, setOrderMode] = useState<'buy' | 'sell'>('buy');

  // Laundering Console state
  const [launderAmount, setLaunderAmount] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Conglomerate calculations
  let portfolioValuation = 0;
  let totalCostBasis = 0;
  let controlledCount = 0;
  let inPortfolioCount = 0;
  let totalCleanCap = 0;

  for (const b of SHELL_BUSINESSES) {
    const sh = getBusinessSharesOwned(player, b.id);
    const p = getBusinessSharePrice(b, player.currentDay);
    const basis = player.businessCostBasis?.[b.id] ?? p;
    portfolioValuation += sh * p;
    totalCostBasis += sh * basis;

    if (sh > CONTROLLING_STAKE_SHARES) {
      controlledCount++;
      totalCleanCap += calculateEffectiveDailyCapacity(b, player.corporateUpgrades);
    }
    if (sh > 0) {
      inPortfolioCount++;
    }
  }

  const conglomeratePnl = portfolioValuation - totalCostBasis;
  const conglomeratePnlPct = totalCostBasis > 0 ? (conglomeratePnl / totalCostBasis) * 100 : 0;
  const totalShareDividends = calculateTotalShareDividends(player);

  // Active business calculations for Order Pad & Console
  const activeBusiness = SHELL_MAP.get(selectedBusinessId) || SHELL_BUSINESSES[0];
  const activeShares = getBusinessSharesOwned(player, activeBusiness.id);
  const activeEquityPct = ((activeShares / TOTAL_SHARES_PER_BUSINESS) * 100).toFixed(1);
  const activeIsControlling = hasControllingStake(player, activeBusiness.id);
  const activeSharePrice = getBusinessSharePrice(activeBusiness, player.currentDay);
  const activeSharesNeeded = Math.max(0, CONTROLLING_STAKE_SHARES + 1 - activeShares);
  const activeCostToControl = Math.round(activeSharesNeeded * activeSharePrice * (1 + BROKERAGE_FEE_RATE));
  const activeSynergies = getControllingSynergies(player);

  const effFee = calculateEffectiveFeeRate(activeBusiness, player.corporateUpgrades);
  const effCap = calculateEffectiveDailyCapacity(activeBusiness, player.corporateUpgrades);
  const remainingCap = Math.max(0, effCap - (player.launderedToday || 0));
  const maxCleanable = Math.min(player.cash, remainingCap);
  const netClean = Math.round(launderAmount * (1 - effFee));
  const hasOffshoreLegal = player.corporateUpgrades?.includes('offshore_legal');

  // Share-by-share order calculations
  const clampedOrderShares = Math.max(1, orderShares);
  const orderGrossCost = clampedOrderShares * activeSharePrice;
  const orderBrokerFee = Math.round(orderGrossCost * BROKERAGE_FEE_RATE);
  const orderTotalCost = orderGrossCost + orderBrokerFee;
  const orderNetProceeds = Math.max(0, orderGrossCost - orderBrokerFee);

  const maxAffordableShares = Math.max(0, Math.floor(player.cash / (activeSharePrice * (1 + BROKERAGE_FEE_RATE))));
  const maxBuyableFloat = Math.max(0, TOTAL_SHARES_PER_BUSINESS - activeShares);
  const maxOrderBuy = Math.min(maxAffordableShares, maxBuyableFloat);

  const newEquitySharesOnBuy = Math.min(TOTAL_SHARES_PER_BUSINESS, activeShares + clampedOrderShares);
  const newEquityPctOnBuy = ((newEquitySharesOnBuy / TOTAL_SHARES_PER_BUSINESS) * 100).toFixed(1);

  const newEquitySharesOnSell = Math.max(0, activeShares - clampedOrderShares);
  const newEquityPctOnSell = ((newEquitySharesOnSell / TOTAL_SHARES_PER_BUSINESS) * 100).toFixed(1);

  // Live filter counts (modeled after MarketBoard)
  const affordableCount = useMemo(() => {
    return SHELL_BUSINESSES.filter((b) => {
      const p = getBusinessSharePrice(b, player.currentDay);
      const cost1 = Math.round(p * (1 + BROKERAGE_FEE_RATE));
      return player.cash >= cost1 && getBusinessSharesOwned(player, b.id) < TOTAL_SHARES_PER_BUSINESS;
    }).length;
  }, [player.cash, player.currentDay, player.businessShares]);

  const bullishCount = useMemo(() => {
    return SHELL_BUSINESSES.filter((b) => {
      const p = getBusinessSharePrice(b, player.currentDay);
      const base = Math.max(1, Math.round(b.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
      return p > base;
    }).length;
  }, [player.currentDay]);

  const bearishCount = useMemo(() => {
    return SHELL_BUSINESSES.filter((b) => {
      const p = getBusinessSharePrice(b, player.currentDay);
      const base = Math.max(1, Math.round(b.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
      return p < base;
    }).length;
  }, [player.currentDay]);

  const highYieldCount = useMemo(() => {
    return SHELL_BUSINESSES.filter((b) => b.passiveDailyProfit >= 2500).length;
  }, []);

  const volatileCount = useMemo(() => {
    return SHELL_BUSINESSES.filter((b) => {
      const p = getBusinessSharePrice(b, player.currentDay);
      const base = Math.max(1, Math.round(b.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
      return Math.abs(p - base) / base >= 0.15;
    }).length;
  }, [player.currentDay]);

  // Filtered & Sorted Exchange List
  const displayList = useMemo(() => {
    let list = [...SHELL_BUSINESSES];

    if (activeNav === 'portfolio') {
      // In Stash / Portfolio tab: only show owned positions
      list = list.filter((b) => getBusinessSharesOwned(player, b.id) > 0);
    } else {
      // In Exchange (Market) tab: apply filter pills
      if (filterMode === 'affordable') {
        list = list.filter((b) => {
          const p = getBusinessSharePrice(b, player.currentDay);
          const cost1 = Math.round(p * (1 + BROKERAGE_FEE_RATE));
          return player.cash >= cost1 && getBusinessSharesOwned(player, b.id) < TOTAL_SHARES_PER_BUSINESS;
        });
      } else if (filterMode === 'in_portfolio') {
        list = list.filter((b) => getBusinessSharesOwned(player, b.id) > 0);
      } else if (filterMode === 'controlling') {
        list = list.filter((b) => getBusinessSharesOwned(player, b.id) > CONTROLLING_STAKE_SHARES);
      } else if (filterMode === 'bullish') {
        list = list.filter((b) => {
          const p = getBusinessSharePrice(b, player.currentDay);
          const base = Math.max(1, Math.round(b.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
          return p > base;
        });
      } else if (filterMode === 'bearish') {
        list = list.filter((b) => {
          const p = getBusinessSharePrice(b, player.currentDay);
          const base = Math.max(1, Math.round(b.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
          return p < base;
        });
      } else if (filterMode === 'high_yield') {
        list = list.filter((b) => b.passiveDailyProfit >= 2500);
      } else if (filterMode === 'volatile') {
        list = list.filter((b) => {
          const p = getBusinessSharePrice(b, player.currentDay);
          const base = Math.max(1, Math.round(b.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
          return Math.abs(p - base) / base >= 0.15;
        });
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((b) => {
        const ticker = (SHELL_TICKERS[b.id] || '').toLowerCase();
        const sector = (SHELL_SECTORS[b.id] || '').toLowerCase();
        return b.name.toLowerCase().includes(q) || ticker.includes(q) || sector.includes(q);
      });
    }

    // Sorting
    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'name') {
        valA = a.name;
        valB = b.name;
        return sortDir === 'asc' ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      } else if (sortField === 'price') {
        valA = getBusinessSharePrice(a, player.currentDay);
        valB = getBusinessSharePrice(b, player.currentDay);
      } else if (sortField === 'equity') {
        valA = getBusinessSharesOwned(player, a.id);
        valB = getBusinessSharesOwned(player, b.id);
      } else if (sortField === 'capacity') {
        valA = a.dailyCleanCapacity;
        valB = b.dailyCleanCapacity;
      } else if (sortField === 'pnl') {
        const shA = getBusinessSharesOwned(player, a.id);
        const pA = getBusinessSharePrice(a, player.currentDay);
        const basisA = player.businessCostBasis?.[a.id] ?? pA;
        valA = shA * (pA - basisA);

        const shB = getBusinessSharesOwned(player, b.id);
        const pB = getBusinessSharePrice(b, player.currentDay);
        const basisB = player.businessCostBasis?.[b.id] ?? pB;
        valB = shB * (pB - basisB);
      } else {
        valA = a.tier;
        valB = b.tier;
      }

      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return list;
  }, [activeNav, filterMode, searchQuery, sortField, sortDir, player.currentDay, player.businessShares, player.businessCostBasis, player.cash]);

  // Order Handlers
  const handleBuy = (businessId: string, shares: number) => {
    soundEngine.play('buy');
    const res = buyBusinessSharesAction(businessId, shares);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleSell = (businessId: string, shares: number) => {
    soundEngine.play('bank');
    const res = sellBusinessSharesAction(businessId, shares);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleLaunder = () => {
    if (launderAmount <= 0) {
      showFeedback('error', 'Enter a valid amount to wash');
      return;
    }
    soundEngine.play('bank');
    const res = executeBusinessLaunderAction(selectedBusinessId, launderAmount);
    showFeedback(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setLaunderAmount(0);
    }
  };

  const handleBuyUpgrade = (upgradeId: string) => {
    soundEngine.play('buy');
    const res = buyCorporateUpgradeAction(upgradeId);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleSortToggle = (field: ShellSortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-5 font-mono">
      {/* Top Banner & Modeled Navigation (Market vs Stash vs Wire Console) */}
      <div className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase mb-1">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <span>Underworld Stock Exchange & Corporate Laundering (U-NASDAQ)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-sans">
              Modeled after the commodities exchange and stash portfolio. Trade commercial shell floats, track cost basis and unrealized P&L, and command majority subsidiaries for corporate money laundering.
            </p>
          </div>

          {/* Sub-navigation Tabs: Market (Exchange) vs Stash (Portfolio) vs Wire Console */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveNav('exchange')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'exchange'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Exchange (Market)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('portfolio')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'portfolio'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Corporate Portfolio (Stash)</span>
              {inPortfolioCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-sky-400 text-[10px]">
                  {inPortfolioCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('laundering')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'laundering'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Wire Operations</span>
              {controlledCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-400 text-[10px]">
                  👑 {controlledCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Live Conglomerate Financial Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 bg-slate-900/90 p-3 sm:px-4 sm:py-3 rounded-xl border border-slate-800 text-xs">
          <div className="p-1">
            <span className="text-slate-500 block text-[10px] uppercase">Portfolio Value:</span>
            <strong className="text-emerald-400 text-sm">
              ${portfolioValuation.toLocaleString()}
            </strong>
          </div>
          <div className="p-1">
            <span className="text-slate-500 block text-[10px] uppercase">Cost Basis:</span>
            <strong className="text-slate-300 text-sm">
              ${totalCostBasis.toLocaleString()}
            </strong>
          </div>
          <div className="p-1">
            <span className="text-slate-500 block text-[10px] uppercase">Unrealized P&L:</span>
            <strong className={`text-sm ${conglomeratePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {conglomeratePnl >= 0 ? `+$${conglomeratePnl.toLocaleString()}` : `-$${Math.abs(conglomeratePnl).toLocaleString()}`} ({conglomeratePnlPct >= 0 ? `+${conglomeratePnlPct.toFixed(1)}%` : `${conglomeratePnlPct.toFixed(1)}%`})
            </strong>
          </div>
          <div className="p-1">
            <span className="text-slate-500 block text-[10px] uppercase">Majority Fronts:</span>
            <strong className="text-amber-400 text-sm">
              {controlledCount} / {SHELL_BUSINESSES.length} Listed
            </strong>
          </div>
          <div className="p-1">
            <span className="text-slate-500 block text-[10px] uppercase">Passive Flow:</span>
            <strong className="text-emerald-400 text-sm">
              +${totalShareDividends.toLocaleString()}/d
            </strong>
          </div>
          <div className="p-1 col-span-2 sm:col-span-1">
            <span className="text-slate-500 block text-[10px] uppercase">Daily Clean Cap:</span>
            <strong className="text-sky-400 text-sm">
              ${totalCleanCap.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
              : 'bg-rose-950/80 border-rose-600 text-rose-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EXCHANGE (MARKET)                                                   */}
      {/* ========================================================================= */}
      {activeNav === 'exchange' && (
        <div className="space-y-4">
          {/* Search, Filter Pills & Sort Bar (Matching MarketBoard) */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Bar */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search $TICKER, corporate name, or sector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills with Live Counters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: `All (${SHELL_BUSINESSES.length})` },
                { id: 'affordable', label: `Affordable (${affordableCount})` },
                { id: 'in_portfolio', label: `In Portfolio (${inPortfolioCount})` },
                { id: 'controlling', label: `Majority (${controlledCount})` },
                { id: 'bullish', label: `Bull ▲ (${bullishCount})` },
                { id: 'bearish', label: `Bear ▼ (${bearishCount})` },
                { id: 'high_yield', label: `High Yield 💰 (${highYieldCount})` },
                { id: 'volatile', label: `Volatile ⚡ (${volatileCount})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFilterMode(pill.id as ShellFilter)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    filterMode === pill.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sorting Toggles & View Mode Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleSortToggle('price')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    sortField === 'price' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sort by Spot Price"
                >
                  Price {sortField === 'price' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => handleSortToggle('equity')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    sortField === 'equity' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sort by Equity Stake"
                >
                  Stake {sortField === 'equity' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => handleSortToggle('name')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    sortField === 'name' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sort by Name"
                >
                  Name {sortField === 'name' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                </button>
              </div>

              {/* Mode Switcher: Cards vs Table */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Order Book / Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Stock Cards View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Dual-Column Grid: Exchange Listings (Left 7) & Order Terminal (Right 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Columns: Listings */}
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Exchange Listed Shells ({displayList.length})</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  Hover for dossier estimator • Click to load order pad
                </span>
              </div>

              {/* TABLE VIEW */}
              {viewMode === 'table' ? (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden max-h-[580px] overflow-y-auto">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[620px] text-left text-xs font-mono border-collapse">
                      <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase sticky top-0 z-10 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Ticker</th>
                          <th className="py-2.5 px-3">Entity & Sector</th>
                          <th className="py-2.5 px-3 text-right">Spot Price</th>
                          <th className="py-2.5 px-3 text-center">7D Trend</th>
                          <th className="py-2.5 px-3 text-right">Stake / Sh</th>
                          <th className="py-2.5 px-3 text-right">Clean Cap</th>
                          <th className="py-2.5 px-3 text-center">Governance</th>
                          <th className="py-2.5 px-3 text-center">Chart</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {displayList.map((business) => {
                          const isSelected = selectedBusinessId === business.id;
                          const sharesOwned = getBusinessSharesOwned(player, business.id);
                          const equityPct = ((sharesOwned / TOTAL_SHARES_PER_BUSINESS) * 100).toFixed(1);
                          const isControlling = sharesOwned > CONTROLLING_STAKE_SHARES;
                          const sharePrice = getBusinessSharePrice(business, player.currentDay);
                          const baseSharePrice = Math.max(1, Math.round(business.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
                          const volPct = Math.round(((sharePrice - baseSharePrice) / baseSharePrice) * 100);
                          const ticker = SHELL_TICKERS[business.id] || '$SHLL';
                          const sector = SHELL_SECTORS[business.id] || 'Commercial';
                          const effectiveCap = calculateEffectiveDailyCapacity(business, player.corporateUpgrades);

                          const history7d = [6, 5, 4, 3, 2, 1, 0].map((d) =>
                            getBusinessSharePrice(business, Math.max(1, player.currentDay - d))
                          );

                          return (
                            <tr
                              key={business.id}
                              onClick={() => setSelectedBusinessId(business.id)}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-950/40 ring-1 ring-inset ring-emerald-500/50'
                                  : isControlling
                                  ? 'hover:bg-slate-900/70 bg-slate-950/40'
                                  : 'hover:bg-slate-900/50'
                              }`}
                            >
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <ShellPreviewCard business={business} onSelect={() => setSelectedBusinessId(business.id)}>
                                  <div className="flex items-center gap-1.5 cursor-pointer">
                                    <span className="font-bold text-amber-400 font-mono hover:underline">{ticker}</span>
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                                      T{business.tier}
                                    </span>
                                  </div>
                                </ShellPreviewCard>
                              </td>
                              <td className="py-2.5 px-3 max-w-[160px]">
                                <ShellPreviewCard business={business} onSelect={() => setSelectedBusinessId(business.id)}>
                                  <div className="font-bold text-slate-200 truncate hover:text-emerald-300 transition-colors">
                                    {business.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">{sector}</div>
                                </ShellPreviewCard>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="font-bold text-slate-100">${sharePrice.toLocaleString()}</div>
                                <div className={`text-[10px] ${volPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {volPct >= 0 ? `+${volPct}%` : `${volPct}%`}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundEngine.play('click');
                                    triggerHaptic('light');
                                    openShellGraph(business.id);
                                  }}
                                  className="inline-block p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group"
                                  title="Open Time Graph"
                                >
                                  <Sparkline
                                    data={history7d}
                                    width={70}
                                    height={20}
                                    color={volPct >= 0 ? '#10b981' : '#f43f5e'}
                                  />
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <span className={`font-bold ${isControlling ? 'text-emerald-400' : sharesOwned > 0 ? 'text-sky-300' : 'text-slate-500'}`}>
                                  {equityPct}%
                                </span>
                                <div className="text-[10px] text-slate-500">
                                  {sharesOwned.toLocaleString()} sh
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-300">
                                ${effectiveCap.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {isControlling ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/70 text-emerald-300 text-[10px] font-bold">
                                    👑 Majority
                                  </span>
                                ) : sharesOwned > 0 ? (
                                  <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-700/60 text-sky-300 text-[10px] font-bold">
                                    💼 Minority
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 text-[10px]">
                                    0% Equity
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundEngine.play('click');
                                    triggerHaptic('light');
                                    openShellGraph(business.id);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-600 text-slate-300 hover:text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                                  title="View Interactive Stock Time Graph"
                                >
                                  <LineChart className="w-3 h-3 text-emerald-400" />
                                  <span>Chart</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* CARDS VIEW */
                <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                  {displayList.map((business) => {
                    const isOwned = player.ownedBusinesses?.includes(business.id);
                    const sharesOwned = getBusinessSharesOwned(player, business.id);
                    const equityPct = ((sharesOwned / TOTAL_SHARES_PER_BUSINESS) * 100).toFixed(1);
                    const isControlling = sharesOwned > CONTROLLING_STAKE_SHARES;
                    const isSelected = selectedBusinessId === business.id;
                    const effectiveFee = calculateEffectiveFeeRate(business, player.corporateUpgrades);
                    const effectiveCap = calculateEffectiveDailyCapacity(business, player.corporateUpgrades);
                    const sharePrice = getBusinessSharePrice(business, player.currentDay);
                    const baseSharePrice = Math.max(1, Math.round(business.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
                    const volPct = Math.round(((sharePrice - baseSharePrice) / baseSharePrice) * 100);
                    const ticker = SHELL_TICKERS[business.id] || '$SHLL';
                    const sector = SHELL_SECTORS[business.id] || 'Commercial';

                    const cost1 = Math.round(1 * sharePrice * (1 + BROKERAGE_FEE_RATE));
                    const cost10 = Math.round(10 * sharePrice * (1 + BROKERAGE_FEE_RATE));
                    const cost100 = Math.round(100 * sharePrice * (1 + BROKERAGE_FEE_RATE));
                    const cost500 = Math.round(500 * sharePrice * (1 + BROKERAGE_FEE_RATE));
                    const remainingToControl = Math.max(0, CONTROLLING_STAKE_SHARES + 1 - sharesOwned);
                    const costToControl = Math.round(remainingToControl * sharePrice * (1 + BROKERAGE_FEE_RATE));
                    const costTotal = Math.round((TOTAL_SHARES_PER_BUSINESS - sharesOwned) * sharePrice * (1 + BROKERAGE_FEE_RATE));
                    const proceeds1 = Math.max(0, Math.round(1 * sharePrice * (1 - BROKERAGE_FEE_RATE)));
                    const proceeds10 = Math.max(0, Math.round(Math.min(10, sharesOwned) * sharePrice * (1 - BROKERAGE_FEE_RATE)));
                    const proceeds500 = Math.max(0, Math.round(Math.min(500, sharesOwned) * sharePrice * (1 - BROKERAGE_FEE_RATE)));

                    const history7d = [6, 5, 4, 3, 2, 1, 0].map((d) =>
                      getBusinessSharePrice(business, Math.max(1, player.currentDay - d))
                    );

                    return (
                      <div
                        key={business.id}
                        onClick={() => setSelectedBusinessId(business.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                            : isControlling
                            ? 'bg-slate-950/70 border-emerald-800/60 hover:border-emerald-700'
                            : sharesOwned > 0
                            ? 'bg-slate-950/60 border-slate-700/80 hover:border-slate-600'
                            : 'bg-slate-950/30 border-slate-800/80 hover:border-slate-700 opacity-90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <ShellPreviewCard business={business} onSelect={() => setSelectedBusinessId(business.id)}>
                            <div className="flex items-center gap-2.5 cursor-pointer">
                              <ShellImage business={business} size="sm" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-amber-400 font-mono hover:underline">{ticker}</span>
                                  <span className="font-bold text-slate-200 text-sm hover:text-emerald-300 transition-colors">{business.name}</span>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                                    T{business.tier}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{sector} • {business.description}</div>
                              </div>
                            </div>
                          </ShellPreviewCard>

                          <div className="text-right shrink-0">
                            {isOwned ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold uppercase">
                                100% Subsidiary
                              </span>
                            ) : isControlling ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-bold uppercase">
                                👑 Majority ({equityPct}%)
                              </span>
                            ) : sharesOwned > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-600/60 text-sky-300 text-[10px] font-bold uppercase">
                                💼 Minority ({equityPct}%)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-bold uppercase">
                                0% Equity
                              </span>
                            )}
                            <div className="mt-1 font-mono text-[10px] text-slate-400">
                              <span>${sharePrice.toLocaleString()}/sh </span>
                              <span className={volPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {volPct >= 0 ? `+${volPct}%` : `${volPct}%`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Sparkline & Equity Progress Bar */}
                        <div className="mt-2.5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEngine.play('click');
                              triggerHaptic('light');
                              openShellGraph(business.id);
                            }}
                            className="shrink-0 p-1 rounded-lg bg-slate-900/90 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-600/70 transition-all cursor-pointer group text-left"
                            title="Open Interactive Stock Time Graph"
                          >
                            <Sparkline
                              data={history7d}
                              width={80}
                              height={22}
                              color={volPct >= 0 ? '#10b981' : '#f43f5e'}
                            />
                            <div className="text-[9px] text-center text-slate-500 group-hover:text-emerald-400 font-mono mt-0.5 flex items-center justify-center gap-0.5">
                              <LineChart className="w-2.5 h-2.5" />
                              <span>Chart</span>
                            </div>
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>Equity: <strong className={isControlling ? 'text-emerald-400' : 'text-sky-300'}>{equityPct}%</strong> ({sharesOwned.toLocaleString()} / 10,000 sh)</span>
                              <span>Threshold: 50.0%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800 relative">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isControlling ? 'bg-emerald-400' : 'bg-sky-400'
                                }`}
                                style={{ width: `${Math.min(100, (sharesOwned / TOTAL_SHARES_PER_BUSINESS) * 100)}%` }}
                              />
                              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-500/70" />
                            </div>
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/70 text-[11px] font-mono text-slate-400">
                          <div>
                            <span>Fee: </span>
                            <strong className="text-emerald-400">{Math.round(effectiveFee * 1000) / 10}%</strong>
                          </div>
                          <div>
                            <span>Daily Cap: </span>
                            <strong className="text-slate-200">${effectiveCap.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span>Dividends: </span>
                            <strong className="text-emerald-400">
                              +${Math.round((sharesOwned / TOTAL_SHARES_PER_BUSINESS) * business.passiveDailyProfit).toLocaleString()}/day
                            </strong>
                          </div>
                          {business.specialPerk && (
                            <div className="text-[10px] text-amber-400 font-sans font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> {business.specialPerk}
                            </div>
                          )}
                        </div>

                        {/* Share Trading Action Buttons */}
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {sharesOwned < TOTAL_SHARES_PER_BUSINESS && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuy(business.id, 1);
                                  }}
                                  disabled={player.cash < cost1}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                                  title={`Buy 1 share for $${cost1.toLocaleString()} incl. fee`}
                                >
                                  +1 sh (${cost1.toLocaleString()})
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuy(business.id, 10);
                                  }}
                                  disabled={player.cash < cost10}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                                  title={`Buy 10 shares for $${cost10.toLocaleString()} incl. fee`}
                                >
                                  +10 sh (${cost10.toLocaleString()})
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuy(business.id, 100);
                                  }}
                                  disabled={player.cash < cost100}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                                  title={`Buy 100 shares for $${cost100.toLocaleString()} incl. fee`}
                                >
                                  +100 sh (${cost100.toLocaleString()})
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuy(business.id, 500);
                                  }}
                                  disabled={player.cash < cost500}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                                  title={`Buy 500 shares for $${cost500.toLocaleString()} incl. fee`}
                                >
                                  +500 sh (${cost500.toLocaleString()})
                                </button>

                                {!isControlling && remainingToControl > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBuy(business.id, remainingToControl);
                                    }}
                                    disabled={player.cash < costToControl}
                                    className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-[10px] font-black transition-all shadow cursor-pointer"
                                    title={`Buy ${remainingToControl.toLocaleString()} shares to reach >50% controlling interest for $${costToControl.toLocaleString()}`}
                                  >
                                    Take Control &gt;50% (${costToControl.toLocaleString()})
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuy(business.id, TOTAL_SHARES_PER_BUSINESS - sharesOwned);
                                  }}
                                  disabled={player.cash < costTotal}
                                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 text-[10px] font-bold transition-all shadow cursor-pointer"
                                  title="Buy all remaining shares to acquire 100% equity"
                                >
                                  Buy 100% (${costTotal.toLocaleString()})
                                </button>
                              </>
                            )}
                          </div>

                          {sharesOwned > 0 && (
                            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSell(business.id, 1);
                                }}
                                className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[10px] font-bold transition-all cursor-pointer"
                                title={`Liquidate 1 share for $${proceeds1.toLocaleString()} net`}
                              >
                                -1 sh (+${proceeds1.toLocaleString()})
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSell(business.id, Math.min(10, sharesOwned));
                                }}
                                className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[10px] font-bold transition-all cursor-pointer"
                                title={`Liquidate up to 10 shares for $${proceeds10.toLocaleString()} net`}
                              >
                                -10 sh (+${proceeds10.toLocaleString()})
                              </button>
                              {sharesOwned >= 500 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSell(business.id, 500);
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[10px] font-bold transition-all cursor-pointer"
                                  title={`Liquidate 500 shares for $${proceeds500.toLocaleString()} net`}
                                >
                                  -500 sh (+${proceeds500.toLocaleString()})
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 5 Columns: Interactive Share-by-Share Order Terminal */}
            <div className="lg:col-span-5 space-y-4">
              {/* Selected Asset Header */}
              <div className="bg-slate-950/90 p-3.5 sm:p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-black text-amber-400 text-sm shrink-0">
                      {SHELL_TICKERS[activeBusiness.id] || '$SHLL'}
                    </span>
                    <h4 className="font-bold text-slate-200 text-xs sm:text-sm truncate">
                      {activeBusiness.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] sm:text-xs font-mono text-slate-400">
                      Spot: <strong className="text-emerald-400">${activeSharePrice.toLocaleString()}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.play('click');
                        triggerHaptic('light');
                        openShellGraph(activeBusiness.id);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-600 text-slate-300 hover:text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                      title="Open Interactive Stock Time Graph"
                    >
                      <LineChart className="w-3 h-3 text-emerald-400" />
                      <span>Chart</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400 text-[11px]">Your Equity Position:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono font-bold ${activeIsControlling ? 'text-emerald-400' : activeShares > 0 ? 'text-sky-300' : 'text-slate-500'}`}>
                      {activeEquityPct}% ({activeShares.toLocaleString()} / 10,000 sh)
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Pad Console */}
              <div className="bg-slate-950/90 p-3.5 sm:p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Order Terminal</span>
                  </div>

                  {/* Buy / Sell Mode Tabs */}
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setOrderMode('buy')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        orderMode === 'buy'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Buy Shares
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderMode('sell')}
                      disabled={activeShares <= 0}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer disabled:opacity-30 ${
                        orderMode === 'sell'
                          ? 'bg-rose-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Sell ({activeShares.toLocaleString()})
                    </button>
                  </div>
                </div>

                {/* Volume Selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Order Volume (Shares):</span>
                    <span>
                      {orderMode === 'buy'
                        ? `Max Affordable: ${maxAffordableShares.toLocaleString()} sh`
                        : `Holdings: ${activeShares.toLocaleString()} sh`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderShares((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-black text-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                      title="Decrease by 1 share"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={1}
                        max={orderMode === 'buy' ? maxBuyableFloat : activeShares}
                        value={orderShares || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                          setOrderShares(isNaN(val) ? 1 : Math.max(1, val));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-slate-100 font-bold text-sm sm:text-base focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none hidden sm:inline">
                        shares
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrderShares((prev) => prev + 1)}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-black text-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                      title="Increase by 1 share"
                    >
                      +
                    </button>
                  </div>

                  {/* Micro Presets */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {orderMode === 'buy' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setOrderShares(1)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          +1 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(5)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          +5 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(10)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          +10 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(25)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          +25 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(100)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          +100 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(500)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          +500 sh
                        </button>
                        {!activeIsControlling && activeSharesNeeded > 0 && (
                          <button
                            type="button"
                            onClick={() => setOrderShares(activeSharesNeeded)}
                            className="px-2 py-1 rounded bg-amber-950 border border-amber-600/60 text-[10px] font-bold text-amber-300 hover:bg-amber-900/60 cursor-pointer"
                            title="Set shares needed to seize >50% controlling interest"
                          >
                            Majority ({activeSharesNeeded.toLocaleString()} sh)
                          </button>
                        )}
                        {maxAffordableShares > 0 && (
                          <button
                            type="button"
                            onClick={() => setOrderShares(maxOrderBuy)}
                            className="px-2 py-1 rounded bg-emerald-950 border border-emerald-600/60 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/60 cursor-pointer ml-auto"
                          >
                            Max Affordable
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setOrderShares(1)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          -1 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(Math.min(5, activeShares))}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          -5 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(Math.min(10, activeShares))}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          -10 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(Math.min(50, activeShares))}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          -50 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(Math.min(100, activeShares))}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                        >
                          -100 sh
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderShares(activeShares)}
                          className="px-2 py-1 rounded bg-rose-950 border border-rose-600/60 text-[10px] font-bold text-rose-300 hover:bg-rose-900/60 cursor-pointer ml-auto"
                        >
                          Liquidate All ({activeShares.toLocaleString()} sh)
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Spot Price:</span>
                    <strong className="text-slate-200">${activeSharePrice.toLocaleString()} / sh</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({clampedOrderShares.toLocaleString()} sh):</span>
                    <strong className="text-slate-200">${orderGrossCost.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Brokerage Commission (1.5%):</span>
                    <strong className={orderMode === 'buy' ? 'text-amber-400' : 'text-rose-400'}>
                      ${orderBrokerFee.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-300">
                    <span>{orderMode === 'buy' ? 'Total Cash Required:' : 'Net Wire to Bank:'}</span>
                    <strong className={`text-sm ${orderMode === 'buy' ? 'text-emerald-400' : 'text-emerald-300'}`}>
                      ${orderMode === 'buy' ? orderTotalCost.toLocaleString() : orderNetProceeds.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Post-Trade Equity Stake:</span>
                    <span className="text-sky-300 font-bold">
                      {orderMode === 'buy' ? newEquityPctOnBuy : newEquityPctOnSell}% (
                      {orderMode === 'buy' ? newEquitySharesOnBuy.toLocaleString() : newEquitySharesOnSell.toLocaleString()} sh)
                    </span>
                  </div>
                </div>

                {/* Execution CTA Button */}
                {orderMode === 'buy' ? (
                  <button
                    type="button"
                    onClick={() => handleBuy(activeBusiness.id, clampedOrderShares)}
                    disabled={player.cash < orderTotalCost || clampedOrderShares <= 0 || activeShares >= TOTAL_SHARES_PER_BUSINESS}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 font-black text-slate-950 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      {player.cash < orderTotalCost
                        ? `Insufficient Cash (Need $${orderTotalCost.toLocaleString()})`
                        : `Buy ${clampedOrderShares.toLocaleString()} Share${clampedOrderShares > 1 ? 's' : ''} ($${orderTotalCost.toLocaleString()})`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSell(activeBusiness.id, clampedOrderShares)}
                    disabled={clampedOrderShares <= 0 || clampedOrderShares > activeShares}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 font-black text-slate-950 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>
                      {clampedOrderShares > activeShares
                        ? 'Exceeds Holding'
                        : `Liquidate ${clampedOrderShares.toLocaleString()} Share${clampedOrderShares > 1 ? 's' : ''} (+$${orderNetProceeds.toLocaleString()})`}
                    </span>
                  </button>
                )}
              </div>

              {/* Majority Takeover Status Card */}
              {!activeIsControlling ? (
                <div className="bg-slate-950/90 p-4 rounded-xl border border-amber-800/60 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          Corporate Governance Locked
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300">
                          {activeEquityPct}% / 50.1% Required
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                        Routing dirty street cash requires majority executive voting control (&gt;50% equity). Buy shares incrementally or seize control.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Current Equity:</span>
                      <span className="font-bold text-amber-400">{activeShares.toLocaleString()} sh ({activeEquityPct}%)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Shares to Control:</span>
                      <span className="font-bold text-slate-200">+{activeSharesNeeded.toLocaleString()} sh</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Capital Required:</span>
                      <span className="font-bold text-emerald-400">${activeCostToControl.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-slate-400 font-sans">
                      Accumulate shares to 5,001 sh (50.1%) to unlock the corporate laundering ledger.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderShares(activeSharesNeeded);
                        setOrderMode('buy');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>Fill Block (+{activeSharesNeeded.toLocaleString()} sh)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-600/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Majority Controlled Subsidiary ({activeEquityPct}%)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveNav('laundering')}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                    >
                      <span>Open Wire Console</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Executive management secured. Clean street cash up to <strong>${effCap.toLocaleString()}/day</strong> at a <strong>{Math.round(effFee * 1000) / 10}%</strong> layering fee.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CORPORATE PORTFOLIO (STASH)                                         */}
      {/* ========================================================================= */}
      {activeNav === 'portfolio' && (
        <div className="space-y-4">
          {/* Portfolio Header Bar (Modeled after InventoryBoard) */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="font-bold text-slate-100 uppercase tracking-wider">
                  Corporate Holdings & Subsidiaries Stash
                </h3>
                <span className="text-[11px] text-slate-400">
                  {inPortfolioCount} Active Shell Positions in Conglomerate
                </span>
              </div>
            </div>

            {/* Sort Toggles for Stash */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSortToggle('pnl')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortField === 'pnl' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                P&L {sortField === 'pnl' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
              </button>
              <button
                type="button"
                onClick={() => handleSortToggle('equity')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortField === 'equity' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Stake % {sortField === 'equity' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
              </button>
              <button
                type="button"
                onClick={() => handleSortToggle('price')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortField === 'price' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Value {sortField === 'price' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
              </button>
              <button
                type="button"
                onClick={() => handleSortToggle('name')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortField === 'name' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Name {sortField === 'name' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
              </button>
            </div>
          </div>

          {/* 1. Hostile Corporate Raid Syndicate Alert Banner */}
          {player.activeHostileTakeover && player.activeHostileTakeover.status === 'active' && (
            <div className="bg-rose-950/70 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-rose-950/60 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-900/60 border border-rose-600/80 text-rose-300 shrink-0">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-900 border border-rose-500 text-rose-200 uppercase tracking-widest">
                        🚨 HOSTILE TAKEOVER RAID IN PROGRESS
                      </span>
                      <span className="text-xs text-rose-300 font-bold">
                        {player.activeHostileTakeover.daysLeft} {player.activeHostileTakeover.daysLeft === 1 ? 'day' : 'days'} remaining
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white mt-1">
                      {player.activeHostileTakeover.syndicateName} tender offer on {SHELL_MAP.get(player.activeHostileTakeover.businessId)?.name || 'Enterprise'}
                    </h4>
                    <p className="text-xs text-rose-200/90 mt-1 max-w-xl font-sans">
                      A rival syndicate launched a hostile corporate raid to buyout your {player.activeHostileTakeover.sharesAtRisk.toLocaleString()} shares. They offer a +35% tender buyout premium at <strong>${player.activeHostileTakeover.offerPricePerShare.toLocaleString()}/sh</strong> (Total Proceeds: <strong>${Math.round(player.activeHostileTakeover.sharesAtRisk * player.activeHostileTakeover.offerPricePerShare).toLocaleString()}</strong>).
                    </p>
                  </div>
                </div>

                {/* Takeover Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.play('bank');
                      triggerHaptic('success');
                      tenderHostileSharesAction();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md"
                  >
                    Accept Tender (+${Math.round(player.activeHostileTakeover.sharesAtRisk * player.activeHostileTakeover.offerPricePerShare).toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.play('gunshot');
                      triggerHaptic('heavy');
                      defendHostileTakeoverAction();
                    }}
                    disabled={player.cash < player.activeHostileTakeover.defenseCost}
                    className={`px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md ${
                      player.cash < player.activeHostileTakeover.defenseCost ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Defend Front (${player.activeHostileTakeover.defenseCost.toLocaleString()} Poison Pill)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Corporate Diversification & Master DRIP Controls Banner */}
          {(() => {
            const divRating = calculateCorporateDiversification(player);
            const allDripActive = inPortfolioCount > 0 && displayList.every((b) => {
              const sh = getBusinessSharesOwned(player, b.id);
              return sh <= 0 || !!player.businessDrip?.[b.id];
            });

            return (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/70 text-emerald-400 font-mono font-black text-xl text-center min-w-[58px]">
                    {divRating.rating}
                    <span className="block text-[8px] font-bold text-slate-400">RATING</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">{divRating.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {divRating.sectorCount} Sectors Active
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-1 text-slate-400 font-sans">
                      <span>Laundering Cap Bonus: <strong className="text-emerald-400">+{Math.round((divRating.capacityMultiplier - 1) * 100)}%</strong></span>
                      <span>•</span>
                      <span>Heat Dissipation: <strong className="text-sky-400">-{divRating.heatReductionBonus} Heat/day</strong></span>
                    </div>
                  </div>
                </div>

                {/* Master DRIP Toggle */}
                {inPortfolioCount > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        setAllBusinessDripAction(!allDripActive);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        allDripActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{allDripActive ? 'All DRIP Active' : 'Enable Auto-DRIP on All'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. Active Limit Orders Summary */}
          {player.shellLimitOrders && player.shellLimitOrders.filter((o) => o.active).length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-400" />
                  Active Automated Limit Orders ({player.shellLimitOrders.filter((o) => o.active).length})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {player.shellLimitOrders.filter((o) => o.active).map((order) => {
                  const b = SHELL_MAP.get(order.businessId);
                  const ticker = SHELL_TICKERS[order.businessId] || '$SHLL';
                  const typeBadge =
                    order.type === 'buy_limit'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : order.type === 'sell_limit'
                      ? 'bg-sky-950 border-sky-500 text-sky-300'
                      : 'bg-rose-950 border-rose-500 text-rose-300';
                  const typeText =
                    order.type === 'buy_limit' ? 'BUY LIMIT' : order.type === 'sell_limit' ? 'SELL LIMIT' : 'STOP LOSS';

                  return (
                    <div key={order.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-400 text-xs">{ticker}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{b?.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${typeBadge}`}>
                            {typeText}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {order.shares.toLocaleString()} sh @ <strong>${order.targetPrice.toLocaleString()}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.play('click');
                          triggerHaptic('light');
                          cancelShellLimitOrderAction(order.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stash Holdings Grid or Empty State */}
          {inPortfolioCount === 0 ? (
            <div className="bg-slate-950/80 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400 mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">No Shell Shares in Corporate Stash</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
                You have not acquired shares in any commercial shell enterprises yet. Purchase shares on the Underworld Stock Exchange to build equity, generate daily passive dividends, and seize majority control for corporate money laundering.
              </p>
              <button
                type="button"
                onClick={() => setActiveNav('exchange')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <span>Browse Exchange Listings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayList.map((business) => {
                const sharesOwned = getBusinessSharesOwned(player, business.id);
                if (sharesOwned <= 0) return null;

                const equityPct = ((sharesOwned / TOTAL_SHARES_PER_BUSINESS) * 100).toFixed(1);
                const isControlling = sharesOwned > CONTROLLING_STAKE_SHARES;
                const isSubsidiary = sharesOwned >= TOTAL_SHARES_PER_BUSINESS;
                const sharePrice = getBusinessSharePrice(business, player.currentDay);
                const costBasis = player.businessCostBasis?.[business.id] ?? sharePrice;
                const positionVal = sharesOwned * sharePrice;
                const positionCost = sharesOwned * costBasis;
                const unrealizedPnl = positionVal - positionCost;
                const pnlPct = positionCost > 0 ? (unrealizedPnl / positionCost) * 100 : 0;
                const dailyDividend = Math.round((sharesOwned / TOTAL_SHARES_PER_BUSINESS) * business.passiveDailyProfit);
                const ticker = SHELL_TICKERS[business.id] || '$SHLL';
                const sector = SHELL_SECTORS[business.id] || 'Commercial';

                return (
                  <div
                    key={business.id}
                    className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <ShellPreviewCard business={business} onSelect={() => setSelectedBusinessId(business.id)}>
                        <div className="flex items-center gap-3 cursor-pointer">
                          <ShellImage business={business} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-amber-400 font-mono hover:underline">{ticker}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                T{business.tier}
                              </span>
                              {isSubsidiary ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 uppercase">
                                  100% Subsidiary
                                </span>
                              ) : isControlling ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 uppercase">
                                  👑 Majority ({equityPct}%)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 border border-sky-600 text-sky-300 uppercase">
                                  💼 Minority ({equityPct}%)
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-100 text-sm hover:text-emerald-300 transition-colors truncate max-w-[200px] mt-0.5">
                              {business.name}
                            </h4>
                            <div className="text-[11px] text-slate-500 font-sans">{sector}</div>
                          </div>
                        </div>
                      </ShellPreviewCard>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-100">${positionVal.toLocaleString()}</div>
                        <div className={`text-[11px] font-bold ${unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {unrealizedPnl >= 0 ? `+$${unrealizedPnl.toLocaleString()}` : `-$${Math.abs(unrealizedPnl).toLocaleString()}`} ({pnlPct >= 0 ? `+${pnlPct.toFixed(1)}%` : `${pnlPct.toFixed(1)}%`})
                        </div>
                      </div>
                    </div>

                    {/* Cost Basis & Equity Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Shares Held:</span>
                        <strong className="text-slate-200">{sharesOwned.toLocaleString()} sh</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Avg Cost Basis:</span>
                        <strong className="text-slate-200">${costBasis.toLocaleString()}/sh</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Daily Flow:</span>
                        <strong className="text-emerald-400">+${dailyDividend.toLocaleString()}/d</strong>
                      </div>
                    </div>

                    {/* Operational Synergy Perk */}
                    {business.specialPerk && (
                      <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Synergy:</strong> {business.specialPerk}</span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-800/80 gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBusinessId(business.id);
                            setOrderMode('buy');
                            setActiveNav('exchange');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Trade</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.play('click');
                            triggerHaptic('light');
                            openShellGraph(business.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-600 text-slate-300 hover:text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Open Interactive Stock Time Graph"
                        >
                          <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Graph</span>
                        </button>

                        {/* Per-Shell DRIP Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            toggleBusinessDripAction(business.id);
                          }}
                          className={`px-2 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            player.businessDrip?.[business.id]
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Toggle automatic dividend reinvestment into shares"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>DRIP: {player.businessDrip?.[business.id] ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBusinessId(business.id);
                          setOrderShares(Math.min(10, sharesOwned));
                          setOrderMode('sell');
                          setActiveNav('exchange');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ml-auto"
                      >
                        <span>Cash Out</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WIRE & LAUNDERING OPERATIONS                                        */}
      {/* ========================================================================= */}
      {activeNav === 'laundering' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Clean Wire Console */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-emerald-900/60 space-y-4">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Front Ledger: <strong className="text-emerald-300">{activeBusiness.name}</strong></span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                    activeIsControlling ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400' : 'bg-amber-950/80 border-amber-800/80 text-amber-400'
                  }`}>
                    {activeIsControlling ? '👑 Majority Front' : '🔒 Majority Control Locked'}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400">
                    {Math.round(effFee * 1000) / 10}% Fee
                  </span>
                </div>
              </div>

              {/* Front Selector Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 block font-bold uppercase">
                  Select Controlled Front Enterprise:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {SHELL_BUSINESSES.map((b) => {
                    const isCtrl = hasControllingStake(player, b.id);
                    const isCur = selectedBusinessId === b.id;
                    const ticker = SHELL_TICKERS[b.id] || '$SHLL';

                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBusinessId(b.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isCur
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                            : isCtrl
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                            : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold font-mono">{ticker}</span>
                          <span>{isCtrl ? '👑' : '🔒'}</span>
                        </div>
                        <div className="text-[11px] font-bold truncate mt-0.5">{b.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Synergies indicator */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300/90 flex flex-wrap items-center gap-3">
                <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Front Synergies:
                </span>
                {activeSynergies.shippingDiscount > 0 && (
                  <span className="bg-emerald-900/50 px-2 py-0.5 rounded text-[10px]">
                    -{Math.round(activeSynergies.shippingDiscount * 100)}% Shipping Logistics
                  </span>
                )}
                {activeSynergies.heatShield > 0 && (
                  <span className="bg-emerald-900/50 px-2 py-0.5 rounded text-[10px]">
                    +{activeSynergies.heatShield} Heat Shield/Day
                  </span>
                )}
                {activeSynergies.wireFeeDiscount > 0 && (
                  <span className="bg-emerald-900/50 px-2 py-0.5 rounded text-[10px]">
                    -{Math.round(activeSynergies.wireFeeDiscount * 100)}% Wash Fee Discount
                  </span>
                )}
                {activeSynergies.auditImmunity && (
                  <span className="bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded text-[10px]">
                    100% FinCEN Audit Immunity
                  </span>
                )}
                {!activeSynergies.shippingDiscount && !activeSynergies.heatShield && !activeSynergies.wireFeeDiscount && !activeSynergies.auditImmunity && (
                  <span className="text-slate-400 text-[10px]">Corporate Ledger Authorization Active</span>
                )}
              </div>

              {!activeIsControlling ? (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Lock className="w-4 h-4" />
                    <span>Majority Control Required to Wire Through This Ledger</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    You hold {activeEquityPct}% equity in {activeBusiness.name}. Accumulate +{activeSharesNeeded.toLocaleString()} shares to reach 50.1% and unlock corporate laundering.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderShares(activeSharesNeeded);
                      setOrderMode('buy');
                      setActiveNav('exchange');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Acquire Majority Block (+{activeSharesNeeded.toLocaleString()} sh)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Remaining Daily Clean Capacity:</span>
                    <strong className="text-slate-200">${remainingCap.toLocaleString()}</strong>
                  </div>

                  {/* Quick Wash Presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLaunderAmount(Math.round(maxCleanable * 0.25))}
                      className="py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaunderAmount(Math.round(maxCleanable * 0.5))}
                      className="py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaunderAmount(Math.round(maxCleanable * 0.75))}
                      className="py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-slate-700 cursor-pointer"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaunderAmount(maxCleanable)}
                      className="py-1 rounded bg-emerald-950/60 border border-emerald-700/60 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/60 cursor-pointer"
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-sm sm:text-base font-mono"
                    />
                  </div>

                  {/* Wire Calculation Breakdown */}
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
                        <span className={hasOffshoreLegal || activeSynergies.auditImmunity ? 'text-emerald-400' : 'text-amber-400'}>
                          {hasOffshoreLegal || activeSynergies.auditImmunity ? '0% (Immune via Retained Counsel / Secrecy Trust)' : `${Math.round(activeBusiness.auditRisk * 100)}% Risk`}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLaunder}
                    disabled={launderAmount <= 0 || player.cash < launderAmount || launderAmount > remainingCap}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 font-black text-slate-950 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Execute Clean Offshore Wire</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Forensic Retainers & Legal Defense */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
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
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200 text-xs">{upgrade.name}</div>
                        <p className="text-[10px] text-slate-400 leading-tight font-sans">{upgrade.description}</p>
                      </div>

                      {isRetained ? (
                        <span className="px-2.5 py-1 rounded bg-sky-950 border border-sky-500/60 text-sky-300 text-[10px] font-bold uppercase shrink-0">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBuyUpgrade(upgrade.id)}
                          disabled={!canAfford}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-all"
                        >
                          Retain (${upgrade.cost.toLocaleString()})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
