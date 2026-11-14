import React from 'react';
import { Target, Compass, Gauge, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MarketPulse({
  cpr,
  currentPrice,
  dayHigh,
  dayLow,
  dayOpen,
  currentRSI,
  currentVWAP
}) {
  const range = dayHigh - dayLow || 1;
  const currentPosPercent = Math.min(100, Math.max(0, ((currentPrice - dayLow) / range) * 100));

  return (
    <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col gap-3">
      
      {/* CPR Classification Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-500/20 text-purple-300">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">CPR Day Type</span>
            <span className="text-xs font-bold text-slate-200">{cpr.cprType}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">CPR Width</span>
          <span className="text-xs font-mono font-bold text-purple-300">{cpr.cprWidth} pts</span>
        </div>
      </div>

      {/* Intraday Day High-Low Meter */}
      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <div className="flex justify-between text-[11px] mb-1.5 font-mono">
          <span className="text-rose-400 font-semibold">Low: ₹{dayLow}</span>
          <span className="text-cyan-300 font-bold">LTP: ₹{currentPrice}</span>
          <span className="text-emerald-400 font-semibold">High: ₹{dayHigh}</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${currentPosPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>Day Range: {(dayHigh - dayLow).toFixed(1)} pts</span>
          <span>Open: ₹{dayOpen}</span>
        </div>
      </div>

      {/* Key Levels Quick Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        
        {/* Support Levels */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Key Support Levels</span>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Pivot:</span>
              <span className="text-amber-300 font-bold">{cpr.pivot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">S1 Support:</span>
              <span className="text-emerald-400">{cpr.s1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CPR BC:</span>
              <span className="text-purple-300">{cpr.bc}</span>
            </div>
          </div>
        </div>

        {/* Resistance Levels */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Key Resistance Levels</span>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">R1 Resistance:</span>
              <span className="text-rose-400">{cpr.r1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">R2 Resistance:</span>
              <span className="text-rose-400">{cpr.r2}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CPR TC:</span>
              <span className="text-purple-300">{cpr.tc}</span>
            </div>
          </div>
        </div>

      </div>

      {/* RSI & VWAP Status */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">RSI (14)</span>
            <span className={`font-mono font-bold text-sm ${
              currentRSI > 60 ? 'text-emerald-400' : currentRSI < 40 ? 'text-rose-400' : 'text-slate-200'
            }`}>
              {currentRSI}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
            {currentRSI >= 55 ? 'Bullish' : currentRSI <= 45 ? 'Bearish' : 'Chop'}
          </span>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">VWAP Deviation</span>
            <span className={`font-mono font-bold text-sm ${
              currentPrice > currentVWAP ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {currentPrice > currentVWAP ? '+' : ''}{(currentPrice - currentVWAP).toFixed(1)} pts
            </span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
            currentPrice > currentVWAP ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
          }`}>
            {currentPrice > currentVWAP ? 'Above' : 'Below'}
          </span>
        </div>
      </div>

    </div>
  );
}
