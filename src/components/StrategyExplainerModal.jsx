import React from 'react';
import { X, CheckCircle, Shield, Award, Sparkles, AlertTriangle } from 'lucide-react';

export default function StrategyExplainerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">NIFTY 50 High-Accuracy Strategy Formula</h3>
            <p className="text-xs text-slate-400">Institutional Confluence Architecture</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs text-slate-300">
          
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-cyan-200">
            <h4 className="font-bold text-sm text-cyan-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 7-Layer Confluence System
            </h4>
            <p>
              No single indicator produces consistent accuracy. This system validates 7 institutional layers simultaneously before generating any trade setup:
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">1</span>
                CPR (Central Pivot Range) Breakout
              </div>
              <p className="text-slate-400 mt-1 pl-7">
                Validates whether daily CPR is narrow (&lt;25 pts) indicating trending momentum, or wide indicating mean-reversion.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                VWAP (Volume-Weighted Average Price)
              </div>
              <p className="text-slate-400 mt-1 pl-7">
                Institutional benchmark line used by banks and institutions to determine intraday control.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
                9 & 21 EMA Dynamic Trend Crossover
              </div>
              <p className="text-slate-400 mt-1 pl-7">
                9 EMA &gt; 21 EMA for Call (CE) and 9 EMA &lt; 21 EMA for Put (PE) ensures trading in the dominant flow.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px]">4</span>
                Supertrend (10, 3) Trend Confirmation
              </div>
              <p className="text-slate-400 mt-1 pl-7">
                Green Supertrend for Call setups and Red Supertrend for Put setups guarantees institutional trend alignment.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px]">5</span>
                RSI Momentum Window (55 - 70 for CE / 30 - 45 for PE)
              </div>
              <p className="text-slate-400 mt-1 pl-7">
                Prevents buying in overbought traps and selling at exhaustion bottoms, ensuring momentum velocity.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">6</span>
                ADX (14) &gt; 20 Sideways Filter
              </div>
              <p className="text-slate-400 mt-1 pl-7">
                Blocks false signals during rangebound sideways chop zones, filtering out over 40% of fakeouts.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">7</span>
                Intraday Timing Filter & Futures Volume
              </div>
              <p className="text-slate-400 mt-1 pl-7">
                Avoids 09:15-09:45 morning whipsaws, skips 11:30-01:15 lunch chop, and stops new trades after 02:30 PM theta decay.
              </p>
            </div>
          </div>

          {/* Golden Rules Box */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-4 h-4" /> 3 Golden Rules of Execution
            </h4>
            <ul className="space-y-1 list-disc pl-4 text-[11px] text-amber-200/90">
              <li><strong>Max 1 to 2 Setups Per Day:</strong> Never overtrade.</li>
              <li><strong>Strict Stop Loss Execution:</strong> Mandatory exit at 15% risk limit.</li>
              <li><strong>Book 50% at Target 1:</strong> Trail remaining stop loss to cost immediately.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg"
          >
            Got It, Start Trading
          </button>
        </div>

      </div>
    </div>
  );
}
