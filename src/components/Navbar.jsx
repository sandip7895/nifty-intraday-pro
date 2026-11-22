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
  isMarketOpen,
  isFeedDelayed = false
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
          
          {/* Unified Brand Identity - Identical on Web & Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Premium Obsidian Squircle Logo Icon */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-950 p-1 flex items-center justify-center shadow-[0_2px_8px_rgba(2,132,199,0.25)] border border-slate-700/60 shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none"></div>
              {/* Geometric SVG "N" Breakout Candlestick Mark */}
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full shrink-0">
                <defs>
                  <linearGradient id="navLogoNeon" x1="7" y1="20" x2="25" y2="5" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <filter id="navLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.8" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>
                </defs>
                <line x1="8" y1="9" x2="8" y2="24" stroke="#0ea5e9" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                <rect x="6.3" y="12" width="3.4" height="10" rx="0.8" fill="#0ea5e9" />
                <path d="M8 13L24 6.5" stroke="url(#navLogoNeon)" strokeWidth="2.4" strokeLinecap="round" filter="url(#navLogoGlow)" />
                <line x1="24" y1="4.5" x2="24" y2="22" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                <rect x="22.3" y="6.5" width="3.4" height="12" rx="0.8" fill="#10b981" filter="url(#navLogoGlow)" />
                <circle cx="24" cy="6.5" r="2.1" fill="#ffffff" stroke="#10b981" strokeWidth="1.2" />
              </svg>
            </div>

            {/* Premium Typography Wordmark (Visible identically on both Mobile & Web) */}
            <div className="flex flex-col justify-center leading-none">
              <div className="flex items-center gap-1">
                <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight font-sans">
                  NIFTY
                </span>
                <span className="px-1 py-0.2 rounded text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs font-mono">
                  PRO
                </span>
              </div>
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 font-extrabold tracking-widest uppercase mt-0.5 font-sans">
                INTRADAY
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 shrink-0 hidden sm:block"></div>

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
            <span className={`w-1.5 h-1.5 rounded-full ${
              isFeedDelayed
                ? 'bg-amber-500 animate-pulse'
                : isMarketOpen
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-400'
            }`}></span>
            <span className={`text-[10px] uppercase font-bold ${isFeedDelayed ? 'text-amber-700' : 'text-slate-600'}`}>
              {isFeedDelayed
                ? `${selectedInstrument === 'SENSEX' ? 'BSE' : 'NSE'} 15m Delayed`
                : isMarketOpen
                  ? (selectedInstrument === 'SENSEX' ? 'BSE Live' : 'NSE Live')
                  : 'Closed'}
            </span>
          </div>

        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Backtest Button - Visible on Tablet & Desktop (Mobile has bottom tab) */}
          <button
            onClick={onOpenBacktest}
            className="hidden sm:flex items-center gap-1 px-2.5 h-[30px] sm:h-[32px] rounded-lg border border-slate-200 hover:border-blue-500 hover:text-blue-600 bg-slate-50/80 hover:bg-white text-slate-700 text-[11px] sm:text-xs font-semibold transition cursor-pointer shadow-2xs shrink-0"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Backtest Report</span>
          </button>

          {/* Funds Display - Pixel-Perfect Centered Alignment */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 px-2 rounded-lg shrink-0 h-[30px] sm:h-[32px]">
            <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden xs:inline" />
            <span className="text-[11px] sm:text-xs font-mono font-extrabold text-slate-800 leading-none tracking-tight flex items-center">
              ₹{Math.round(paperBalance).toLocaleString('en-IN')}
            </span>
            <button
              type="button"
              onClick={onResetFund}
              title="Reset Virtual Funds"
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Audio Chime Alert Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Trade Sound Alerts: Enabled (Click to Mute)' : 'Trade Sound Alerts: Muted (Click to Enable)'}
            className={`w-[30px] sm:w-[32px] h-[30px] sm:h-[32px] rounded-lg border transition cursor-pointer flex items-center justify-center shrink-0 ${
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
            className="hidden md:flex w-[30px] sm:w-[32px] h-[30px] sm:h-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer shrink-0"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

        </div>

      </div>
    </header>
  );
}
