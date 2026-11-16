import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  BarChart2,
  Maximize2,
  Minimize2,
  Wallet,
  Bell,
  BellOff
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playSignalChime } from '../services/audioService';

export default function Navbar({
  selectedInstrument = 'NIFTY',
  onSelectInstrument,
  currentPrice,
  priceChange,
  priceChangePercent,
  paperBalance,
  onResetFund,
  onOpenBacktest,
  isMarketOpen
}) {
  const isUp = priceChange >= 0;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playSignalChime();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-2 sm:px-4 py-1.5 sm:py-2 shrink-0 z-30 shadow-2xs w-full max-w-full overflow-hidden sticky top-0 font-sans">
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 min-w-0">
        
        {/* Left: Brand Icon + Switcher + Spot LTP */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
          
          {/* Brand Icon + Name (Name hidden on mobile to avoid crowding) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br ${
              selectedInstrument === 'SENSEX'
                ? 'from-purple-950 via-slate-900 to-indigo-950'
                : 'from-slate-900 via-slate-800 to-blue-950'
            } flex items-center justify-center text-white shadow-xs border border-slate-700/40 p-1`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-full h-full ${
                selectedInstrument === 'SENSEX' ? 'text-purple-400' : 'text-emerald-400'
              }`}>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            
            {/* Full text on tablet / desktop only */}
            <div className="hidden md:flex flex-col">
              <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight leading-none">
                {selectedInstrument === 'SENSEX' ? 'BSE SENSEX' : 'NIFTY 50'}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
                INTRADAY PRO
              </span>
            </div>
          </div>

          {/* Sahi / Kite Style Index Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => onSelectInstrument && onSelectInstrument('NIFTY')}
              className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-black rounded-md transition cursor-pointer ${
                selectedInstrument === 'NIFTY'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NIFTY
            </button>
            <button
              type="button"
              onClick={() => onSelectInstrument && onSelectInstrument('SENSEX')}
              className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-black rounded-md transition cursor-pointer ${
                selectedInstrument === 'SENSEX'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SENSEX
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 shrink-0 hidden md:block"></div>

          {/* Clean High-Contrast Spot Ticker */}
          <div className="flex items-baseline gap-1 sm:gap-1.5 font-mono shrink min-w-0">
            <span className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className={`text-[9.5px] sm:text-xs font-bold px-1 py-0.2 rounded shrink-0 whitespace-nowrap ${
              isUp ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
            }`}>
              {isUp ? '+' : ''}{priceChangePercent}%
            </span>
          </div>

          {/* Market Status Dot */}
          <div className="items-center gap-1 text-[10px] text-slate-500 pl-1 border-l border-slate-200 hidden lg:flex shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="text-[10px] uppercase font-bold text-slate-600">
              {isMarketOpen ? (selectedInstrument === 'SENSEX' ? 'BSE Live' : 'NSE Live') : 'Closed'}
            </span>
          </div>

        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* Backtest Button - Visible on Tablet & Desktop (Mobile has bottom tab) */}
          <button
            onClick={onOpenBacktest}
            className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-500 hover:text-blue-600 bg-slate-50/80 hover:bg-white text-slate-700 text-[11px] sm:text-xs font-semibold transition cursor-pointer shadow-2xs shrink-0"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Backtest Report</span>
          </button>

          {/* Funds Display */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-200/90 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg shrink-0">
            <Wallet className="w-3 h-3 text-slate-500 hidden xs:inline" />
            <div className="text-right">
              <span className="text-[8px] text-slate-400 uppercase font-bold leading-none hidden sm:block">Funds</span>
              <span className="text-[10.5px] sm:text-xs font-mono font-extrabold text-slate-800">
                ₹{Math.round(paperBalance).toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={onResetFund}
              title="Reset Virtual Funds"
              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer ml-0.5"
            >
              <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          </div>

          {/* Audio Chime Alert Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Trade Sound Alerts: Enabled (Click to Mute)' : 'Trade Sound Alerts: Muted (Click to Enable)'}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
              soundOn
                ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {soundOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          </button>

          {/* Native Fullscreen (Desktop only) */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="hidden md:block p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

        </div>

      </div>
    </header>
  );
}
