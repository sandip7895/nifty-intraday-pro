import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TradingChart from './components/TradingChart';
import SignalCard from './components/SignalCard';
import BacktestModal from './components/BacktestModal';
import { useTradingSimulation } from './hooks/useTradingSimulation';
import {
  RotateCcw,
  Calendar,
  LayoutGrid,
  TrendingUp,
  Zap,
  Database
} from 'lucide-react';

export default function App() {
  const {
    instrument,
    selectInstrument,
    candles: liveCandles,
    currentPrice: livePrice,
    priceChange: livePriceChange,
    priceChangePercent: livePriceChangePercent,
    cpr: liveCpr,
    currentVWAP: liveVwap,
    activeSignal: liveActiveSignal,
    paperBalance,
    positions,
    closedTrades,
    executePaperTrade,
    closePositionManually,
    resetPaperAccount,
    isMarketOpen,
    isFeedDelayed,
    sessionDisplayDate,
    isLoading,
    error: apiError
  } = useTradingSimulation();

  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [replayedDay, setReplayedDay] = useState(null);
  const [mobileTab, setMobileTab] = useState('all'); // 'all', 'chart', 'signal'
  const [chartMode, setChartMode] = useState('SPOT'); // 'SPOT' | 'OPTION'
  const [customPremiumMap, setCustomPremiumMap] = useState(() => {
    try {
      const saved = localStorage.getItem('nifty_pro_custom_premiums');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active display data (live session or historical replay session)
  const isReplaying = Boolean(replayedDay);
  const activeCandles = isReplaying ? replayedDay.candles : liveCandles;
  const currentPrice = isReplaying
    ? (activeCandles.length > 0 ? activeCandles[activeCandles.length - 1].close : 0)
    : livePrice;
  const priceChange = isReplaying && activeCandles.length > 0
    ? Number((currentPrice - activeCandles[0].open).toFixed(2))
    : livePriceChange;
  const priceChangePercent = isReplaying && activeCandles.length > 0 && activeCandles[0].open > 0
    ? Number(((priceChange / activeCandles[0].open) * 100).toFixed(2))
    : livePriceChangePercent;
  const currentVWAP = isReplaying && activeCandles.length > 0
    ? Number((activeCandles.reduce((a, c) => a + c.close, 0) / activeCandles.length).toFixed(2))
    : liveVwap;

  const activeSignal = isReplaying ? {
    action: replayedDay.trade.type,
    actionText: replayedDay.trade.actionText,
    strikeName: replayedDay.trade.strike,
    instrument: replayedDay.trade.instrument || (replayedDay.trade.strike?.includes('SENSEX') ? 'SENSEX' : 'NIFTY'),
    lotSize: replayedDay.trade.lotSize || (replayedDay.trade.strike?.includes('SENSEX') ? 20 : 65),
    spotTrigger: replayedDay.trade.spotEntry,
    optionEntry: replayedDay.trade.entryPrice,
    optionSl: replayedDay.trade.sl,
    optionTarget1: replayedDay.trade.target1,
    optionTarget2: replayedDay.trade.target2,
    accuracy: replayedDay.trade.accuracy || 85,
    timestamp: replayedDay.trade.time,
    result: replayedDay.trade.result,
    status: replayedDay.trade.status,
    entryCandleIndex: replayedDay.trade.entryCandleIndex,
    exitCandleIndex: replayedDay.trade.exitCandleIndex,
    exitPrice: replayedDay.trade.exitPrice,
    pnl: replayedDay.trade.pnl
  } : liveActiveSignal;

  // Instant Live Premium Sync: allow user to enter real broker LTP (e.g. ₹190) so Entry, Target 1/2, SL & Option Chart all sync 100%
  const signalKey = activeSignal && activeSignal.action !== 'WAIT'
    ? `${activeSignal.instrument || instrument}_${activeSignal.strikeName}_${activeSignal.timestamp}_${isReplaying ? replayedDay?.trade?.date : 'live'}`
    : null;
  const customEntryVal = signalKey ? Number(customPremiumMap[signalKey]) : 0;

  let effectiveSignal = activeSignal;
  if (activeSignal && activeSignal.action !== 'WAIT' && customEntryVal > 0) {
    const isSensexSig = activeSignal.instrument === 'SENSEX' || activeSignal.strikeName?.includes('SENSEX');
    const isCeSig = activeSignal.action === 'BUY_CE';
    const sigDelta = isSensexSig ? 0.50 : 0.52;
    const lotQty = activeSignal.lotSize || (isSensexSig ? 20 : 65);

    const newT1 = Number((customEntryVal * 1.18).toFixed(1));
    const newT2 = Number((customEntryVal * 1.45).toFixed(1));
    const newSl = Number((customEntryVal * 0.86).toFixed(1));

    const spotDiff = (currentPrice && activeSignal.spotTrigger)
      ? (isCeSig ? (currentPrice - activeSignal.spotTrigger) : (activeSignal.spotTrigger - currentPrice))
      : 0;
    const liveSyncedLtp = Number(Math.max(1, customEntryVal + spotDiff * sigDelta).toFixed(1));

    let syncedExit = liveSyncedLtp;
    if (activeSignal.status === 'TARGET_HIT') syncedExit = newT1;
    else if (activeSignal.status === 'SL_HIT') syncedExit = newSl;

    effectiveSignal = {
      ...activeSignal,
      optionEntry: customEntryVal,
      optionTarget1: newT1,
      optionTarget2: newT2,
      optionSl: newSl,
      currentOptPrice: activeSignal.status === 'OPEN' ? liveSyncedLtp : syncedExit,
      exitPrice: syncedExit,
      pnl: Number(((syncedExit - customEntryVal) * lotQty).toFixed(2)),
      isCustomPremium: true
    };
  }

  const handleSetCustomPremium = (priceNum) => {
    if (!signalKey || !priceNum || priceNum <= 0) return;
    setCustomPremiumMap(prev => {
      const next = { ...prev, [signalKey]: Number(priceNum.toFixed(1)) };
      try { localStorage.setItem('nifty_pro_custom_premiums', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const handleClearCustomPremium = () => {
    if (!signalKey) return;
    setCustomPremiumMap(prev => {
      const next = { ...prev };
      delete next[signalKey];
      try { localStorage.setItem('nifty_pro_custom_premiums', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const handleLoadDayToChart = (candles, trade) => {
    setReplayedDay({ candles, trade });
  };

  const handleResetToLive = () => {
    setReplayedDay(null);
  };

  return (
    <div className="min-h-screen lg:h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#f8fafc] text-slate-800 overflow-y-auto lg:overflow-hidden font-sans">

      {/* Top Sleek Sahi / Kite Style Navbar */}
      <Navbar
        selectedInstrument={instrument}
        onSelectInstrument={selectInstrument}
        currentPrice={currentPrice}
        priceChange={priceChange}
        priceChangePercent={priceChangePercent}
        paperBalance={paperBalance}
        onResetFund={resetPaperAccount}
        onOpenBacktest={() => setIsBacktestModalOpen(true)}
        isMarketOpen={isMarketOpen}
        isFeedDelayed={isFeedDelayed && !isReplaying}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 min-h-0 w-full p-2 sm:p-3 flex flex-col gap-2.5 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-2.5">

        {/* Mobile View Switcher - Modern Segmented Control */}
        <div className="lg:hidden flex items-center bg-slate-200/70 p-1 rounded-xl shrink-0 shadow-2xs">
          <button
            onClick={() => setMobileTab('all')}
            className={`flex-1 py-1.5 text-xs text-center rounded-lg transition-all cursor-pointer ${mobileTab === 'all'
              ? 'bg-white text-blue-600 font-extrabold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setMobileTab('chart')}
            className={`flex-1 py-1.5 text-xs text-center rounded-lg transition-all cursor-pointer ${mobileTab === 'chart'
              ? 'bg-white text-blue-600 font-extrabold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
          >
            Chart
          </button>
          <button
            onClick={() => setMobileTab('signal')}
            className={`flex-1 py-1.5 text-xs text-center rounded-lg transition-all cursor-pointer ${mobileTab === 'signal'
              ? 'bg-white text-blue-600 font-extrabold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
          >
            Trade Signal
          </button>
        </div>

        {/* Replay Banner if in Historical Replay Mode */}
        {isReplaying && (
          <div className="bg-slate-900 border border-slate-800 text-white px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>
                REPLAYING REAL SESSION: <strong>{replayedDay.trade.date}</strong> — {replayedDay.trade.type === 'BUY_CE' ? 'CALL' : 'PUT'} Trade Triggered at {replayedDay.trade.time} (Outcome: {replayedDay.trade.result})
              </span>
            </div>
            <button
              onClick={handleResetToLive}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Return to Real Session</span>
            </button>
          </div>
        )}

        {/* Delayed Exchange Feed Banner (e.g. BSE SENSEX has 15-min opening delay on free Yahoo feed) */}
        {!isReplaying && isFeedDelayed && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl shadow-2xs flex items-center justify-between gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>
                <strong>{instrument === 'SENSEX' ? 'BSE SENSEX' : 'NIFTY 50'} Feed 15-Min Delayed:</strong> Showing previous session (<strong>{sessionDisplayDate || 'Yesterday'}</strong>) until today&apos;s candles begin streaming (~09:30 AM).
              </span>
            </div>
            {instrument === 'SENSEX' && (
              <button
                onClick={() => selectInstrument('NIFTY')}
                className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold transition shrink-0 cursor-pointer"
              >
                Switch to Live NIFTY 50
              </button>
            )}
          </div>
        )}

        {/* Upper Core Area (Chart + Trade Signal) */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-2 sm:gap-2.5">

          {/* Main Real-Market Chart */}
          <div className={`col-span-12 lg:col-span-8 ${mobileTab === 'all' || mobileTab === 'chart' ? 'block' : 'hidden'
            } lg:block ${mobileTab === 'chart'
              ? 'h-[calc(100dvh-170px)] min-h-[500px]'
              : 'h-[460px] sm:h-[540px] lg:h-full'
            } min-h-0`}>
            <TradingChart
              instrument={isReplaying ? (replayedDay.trade.strike?.includes('SENSEX') ? 'SENSEX' : 'NIFTY') : instrument}
              candles={activeCandles}
              cpr={liveCpr}
              currentVWAP={currentVWAP}
              currentPrice={currentPrice}
              activeSignal={effectiveSignal}
              onOpenBacktest={() => setIsBacktestModalOpen(true)}
              chartMode={chartMode}
              onToggleChartMode={setChartMode}
            />
          </div>

          {/* Real-Market Trade Signal Card */}
          <div className={`col-span-12 lg:col-span-4 ${mobileTab === 'all' || mobileTab === 'signal' ? 'block' : 'hidden'
            } lg:block min-h-[380px] lg:h-full min-h-0`}>
            <SignalCard
              activeSignal={effectiveSignal}
              currentSpotPrice={currentPrice}
              onExecutePaperTrade={executePaperTrade}
              onSetCustomPremium={handleSetCustomPremium}
              onClearCustomPremium={handleClearCustomPremium}
              chartMode={chartMode}
              onToggleChartMode={(mode) => {
                setChartMode(mode);
                if (mobileTab === 'signal') setMobileTab('chart');
              }}
            />
          </div>

        </div>

      </main>

      {/* Sahi / Dhan Style Native Mobile Bottom App Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around pb-[calc(env(safe-area-inset-bottom,4px)+6px)]">

        {/* Tab 1: Overview */}
        <button
          onClick={() => setMobileTab('all')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${mobileTab === 'all' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Overview</span>
        </button>

        {/* Tab 2: Chart */}
        <button
          onClick={() => setMobileTab('chart')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${mobileTab === 'chart' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Chart</span>
        </button>

        {/* Tab 3: Signal */}
        <button
          onClick={() => setMobileTab('signal')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer relative ${mobileTab === 'signal' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Signal</span>
          {activeSignal && activeSignal.action !== 'WAIT' && (
            <span className="absolute top-0.5 right-1/4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        {/* Tab 4: Backtest Report */}
        <button
          onClick={() => setIsBacktestModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-600 font-medium transition cursor-pointer"
        >
          <Database className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Report</span>
        </button>

      </nav>

      {/* Backtest Modal */}
      <BacktestModal
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
        onLoadDayToChart={handleLoadDayToChart}
        currentInstrument={instrument}
      />

    </div>
  );
}
