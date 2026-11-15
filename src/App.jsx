import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TradingChart from './components/TradingChart';
import SignalCard from './components/SignalCard';
import PaperTradeManager from './components/PaperTradeManager';
import BacktestModal from './components/BacktestModal';
import { useTradingSimulation } from './hooks/useTradingSimulation';
import {
  RotateCcw,
  Calendar,
  LayoutGrid,
  TrendingUp,
  Zap,
  Briefcase,
  Database
} from 'lucide-react';

export default function App() {
  const {
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
    isLoading,
    error: apiError
  } = useTradingSimulation();

  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [replayedDay, setReplayedDay] = useState(null);
  const [mobileTab, setMobileTab] = useState('all'); // 'all', 'chart', 'signal', 'positions'

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

  const handleLoadDayToChart = (candles, trade) => {
    setReplayedDay({ candles, trade });
  };

  const handleResetToLive = () => {
    setReplayedDay(null);
  };

  return (
    <div className="min-h-screen lg:h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#f8fafc] text-slate-800 overflow-y-auto lg:overflow-hidden font-sans select-none">
      
      {/* Top Sleek Sahi / Kite Style Navbar */}
      <Navbar
        currentPrice={currentPrice}
        priceChange={priceChange}
        priceChangePercent={priceChangePercent}
        paperBalance={paperBalance}
        onResetFund={resetPaperAccount}
        onOpenBacktest={() => setIsBacktestModalOpen(true)}
        isMarketOpen={isMarketOpen}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 min-h-0 w-full p-2 sm:p-3 flex flex-col gap-2.5 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-2.5">
        
        {/* Mobile View Switcher - Modern Segmented Control */}
        <div className="lg:hidden flex items-center bg-slate-200/70 p-1 rounded-xl shrink-0 shadow-2xs">
          <button
            onClick={() => setMobileTab('all')}
            className={`flex-1 py-1.5 text-xs text-center rounded-lg transition-all cursor-pointer ${
              mobileTab === 'all'
                ? 'bg-white text-blue-600 font-extrabold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setMobileTab('chart')}
            className={`flex-1 py-1.5 text-xs text-center rounded-lg transition-all cursor-pointer ${
              mobileTab === 'chart'
                ? 'bg-white text-blue-600 font-extrabold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setMobileTab('signal')}
            className={`flex-1 py-1.5 text-xs text-center rounded-lg transition-all cursor-pointer ${
              mobileTab === 'signal'
                ? 'bg-white text-blue-600 font-extrabold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Trade Signal
          </button>
          <button
            onClick={() => setMobileTab('positions')}
            className={`flex-1 py-1.5 text-xs text-center rounded-lg transition-all cursor-pointer ${
              mobileTab === 'positions'
                ? 'bg-white text-blue-600 font-extrabold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Positions ({positions.length})
          </button>
        </div>

        {/* Replay Banner if in Historical Replay Mode */}
        {isReplaying && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                REPLAYING REAL SESSION: <strong>{replayedDay.trade.date}</strong> — {replayedDay.trade.type === 'BUY_CE' ? 'CALL' : 'PUT'} Trade Triggered at {replayedDay.trade.time} (Outcome: {replayedDay.trade.result})
              </span>
            </div>
            <button
              onClick={handleResetToLive}
              className="px-2.5 py-0.5 rounded-lg bg-white text-blue-600 hover:bg-slate-50 text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Return to Real Session</span>
            </button>
          </div>
        )}

        {/* Upper Core Area (Chart + Trade Signal) */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-2 sm:gap-2.5">
          
          {/* Main Real-Market Chart */}
          <div className={`col-span-12 lg:col-span-8 ${
            mobileTab === 'all' || mobileTab === 'chart' ? 'block' : 'hidden'
          } lg:block ${
            mobileTab === 'chart' 
              ? 'h-[calc(100dvh-170px)] min-h-[500px]' 
              : 'h-[460px] sm:h-[540px] lg:h-full'
          } min-h-0`}>
            <TradingChart
              candles={activeCandles}
              cpr={liveCpr}
              currentVWAP={currentVWAP}
              currentPrice={currentPrice}
              activeSignal={activeSignal}
              onOpenBacktest={() => setIsBacktestModalOpen(true)}
            />
          </div>

          {/* Real-Market Trade Signal Card */}
          <div className={`col-span-12 lg:col-span-4 ${
            mobileTab === 'all' || mobileTab === 'signal' ? 'block' : 'hidden'
          } lg:block min-h-[380px] lg:h-full min-h-0`}>
            <SignalCard
              activeSignal={activeSignal}
              onExecutePaperTrade={executePaperTrade}
            />
          </div>

        </div>

        {/* Lower Core Area (Active Position & Today's Completed Trades) */}
        <div className={`${
          mobileTab === 'all' || mobileTab === 'positions' ? 'block' : 'hidden'
        } lg:block shrink-0`}>
          <PaperTradeManager
            positions={positions}
            closedTrades={closedTrades}
            onClosePosition={closePositionManually}
          />
        </div>

      </main>

      {/* Sahi / Dhan Style Native Mobile Bottom App Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around pb-[calc(env(safe-area-inset-bottom,4px)+6px)]">
        
        {/* Tab 1: Overview */}
        <button
          onClick={() => setMobileTab('all')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            mobileTab === 'all' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Overview</span>
        </button>

        {/* Tab 2: Chart */}
        <button
          onClick={() => setMobileTab('chart')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            mobileTab === 'chart' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Chart</span>
        </button>

        {/* Tab 3: Signal */}
        <button
          onClick={() => setMobileTab('signal')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer relative ${
            mobileTab === 'signal' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Signal</span>
          {activeSignal && activeSignal.action !== 'WAIT' && (
            <span className="absolute top-0.5 right-1/4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        {/* Tab 4: Positions */}
        <button
          onClick={() => setMobileTab('positions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer relative ${
            mobileTab === 'positions' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Briefcase className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Positions</span>
          {positions.length > 0 && (
            <span className="absolute top-0 right-1/4 px-1 min-w-[14px] h-[14px] text-[8px] font-black rounded-full bg-blue-600 text-white flex items-center justify-center">
              {positions.length}
            </span>
          )}
        </button>

        {/* Tab 5: Backtest Report */}
        <button
          onClick={() => setIsBacktestModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-600 font-medium transition cursor-pointer"
        >
          <Database className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Report</span>
        </button>

      </nav>

      {/* 30-Day Backtest Modal */}
      <BacktestModal
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
        onLoadDayToChart={handleLoadDayToChart}
      />

    </div>
  );
}
