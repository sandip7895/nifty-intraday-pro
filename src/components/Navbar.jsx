import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  BarChart2,
  Maximize2,
  Minimize2,
  Wallet
} from 'lucide-react';

export default function Navbar({
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
    <header className="bg-white border-b border-slate-200 px-2 sm:px-4 py-1.5 sm:py-2 shrink-0 z-30 shadow-2xs w-full max-w-full overflow-hidden">
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
        
        {/* Left: Zerodha Kite-style Brand & NIFTY 50 Spot Header */}
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 shrink">
          
          {/* Minimal Kite Brand Icon */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded bg-[#ff5722] flex items-center justify-center text-white shadow-2xs font-black text-xs">
              K
            </div>
            <span className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight hidden xs:inline">
              NIFTY 50
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 shrink-0"></div>

          {/* Clean Zerodha Ticker */}
          <div className="flex items-baseline gap-1 sm:gap-1.5 font-mono min-w-0">
            <span className="text-xs sm:text-base font-bold text-slate-900 tracking-tight">
              {currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className={`text-[10px] sm:text-xs font-semibold shrink-0 ${isUp ? 'text-[#00a86b]' : 'text-[#df514c]'}`}>
              {isUp ? '+' : ''}{priceChangePercent}%
            </span>
            <span className={`text-[10px] hidden sm:inline ${isUp ? 'text-[#00a86b]' : 'text-[#df514c]'}`}>
              ({isUp ? '+' : ''}{priceChange})
            </span>
          </div>

          {/* Market Status Dot */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 pl-1 border-l border-slate-200 hidden sm:flex shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-[#00a86b] animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="text-[10px] uppercase font-medium">
              {isMarketOpen ? 'NSE Live' : 'Market Closed'}
            </span>
          </div>

        </div>

        {/* Right: Zerodha Kite Actions (Backtest, Funds, Fullscreen) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Backtest Button - Clean Zerodha Button Style */}
          <button
            onClick={onOpenBacktest}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded border border-slate-300 hover:border-[#387ed1] hover:text-[#387ed1] bg-white text-slate-700 text-[11px] sm:text-xs font-medium transition cursor-pointer shadow-2xs shrink-0"
          >
            <BarChart2 className="w-3.5 h-3.5 text-[#387ed1]" />
            <span className="hidden sm:inline">Backtest Report</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* Zerodha Funds Display */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-200 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded shrink-0">
            <Wallet className="w-3 h-3 text-slate-400 hidden xs:inline" />
            <div className="text-right">
              <span className="text-[9px] text-slate-400 uppercase font-semibold leading-none hidden sm:block">Funds</span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-800">
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

          {/* Native Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="hidden sm:block p-1 sm:p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

        </div>

      </div>
    </header>
  );
}
