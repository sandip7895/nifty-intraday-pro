import React from 'react';
import { Target, Shield, Check, ArrowRight, Zap, Info } from 'lucide-react';

export default function SignalCard({
  activeSignal,
  onExecutePaperTrade
}) {
  const isBuyCe = activeSignal.action === 'BUY_CE';
  const isBuyPe = activeSignal.action === 'BUY_PE';
  const isWait = activeSignal.action === 'WAIT';

  const isSensex = activeSignal.instrument === 'SENSEX' || (activeSignal.strikeName && activeSignal.strikeName.includes('SENSEX'));
  const qty = activeSignal.lotSize || (isSensex ? 20 : 65);
  const spotEntry = activeSignal.spotTrigger || (isSensex ? 81592.45 : 25189.10);
  const isCe = isBuyCe || !isBuyPe;

  // Logical spot SL & targets with upgraded 1:2.0 Risk-to-Reward
  const slPts = isSensex ? 90 : 35;
  const t1Pts = isSensex ? 180 : 70;  // 1:2.0 R:R on Spot
  const t2Pts = isSensex ? 300 : 120;

  const spotSl = isCe ? Number((spotEntry - slPts).toFixed(0)) : Number((spotEntry + slPts).toFixed(0));
  const spotTarget1 = isCe ? Number((spotEntry + t1Pts).toFixed(0)) : Number((spotEntry - t1Pts).toFixed(0));
  const spotTarget2 = isCe ? Number((spotEntry + t2Pts).toFixed(0)) : Number((spotEntry - t2Pts).toFixed(0));

  // Option Calculations (Target 1: +25%, Target 2: +45%, SL: -14%)
  const entryPrice = activeSignal.optionEntry || (isSensex ? 340 : 130);
  const target1Price = activeSignal.optionTarget1 || (isSensex ? 425.0 : 162.5);
  const target2Price = activeSignal.optionTarget2 || (isSensex ? 493.0 : 188.5);
  const slPrice = activeSignal.optionSl || (isSensex ? 292.4 : 111.8);

  const marginRequired = Math.round(entryPrice * qty);
  const target1Gain = Math.round((target1Price - entryPrice) * qty);
  const target2Gain = Math.round((target2Price - entryPrice) * qty);
  const slRisk = Math.round((entryPrice - slPrice) * qty);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between h-full w-full max-w-full overflow-hidden font-sans">

      {/* Sahi / Kite Header: Instrument & Live Price */}
      <div className="pb-2.5 border-b border-slate-100 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {isWait ? 'Awaiting Confluence Setup' : activeSignal.strikeName}
              </h2>
              {!isWait && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
                  MIS • {qty} QTY
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              {!isWait && (
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${isBuyCe
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
                  : 'text-rose-700 bg-rose-50 border border-rose-200/80'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBuyCe ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></span>
                  {isBuyCe ? 'BULLISH CALL (CE)' : 'BEARISH PUT (PE)'}
                </span>
              )}
              <span className="text-[11px] text-slate-500">
                Spot: <strong className="text-slate-800 font-mono">₹{spotEntry}</strong>
              </span>
            </div>
          </div>

          {!isWait && (
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                  ₹{entryPrice.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">LTP</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {activeSignal.result ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${activeSignal.status === 'TARGET_HIT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                    }`}>
                    {activeSignal.status === 'TARGET_HIT' ? 'Target Achieved' : 'SL Hit'}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500">
                    Confidence: <strong className="text-emerald-600 font-mono">{activeSignal.accuracy}%</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isWait ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Scanning {isSensex ? 'BSE SENSEX' : 'NIFTY 50'} 5-minute candles for ORB & EMA Ribbon confluence...
        </div>
      ) : (
        <div className="my-2 space-y-2 flex-1 flex flex-col justify-around">

          {/* Parameters Grid (Entry, SL, Target 1, Target 2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">

            {/* 1. ENTRY */}
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                ENTRY (BLUE LINE)
              </span>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                ₹{entryPrice.toFixed(1)}
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                Spot ₹{spotEntry}
              </span>
            </div>

            {/* 2. STOP LOSS */}
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-bold text-[#df514c] uppercase tracking-wider block">
                STOP LOSS (-14%)
              </span>
              <div className="text-sm font-bold font-mono text-[#df514c] mt-0.5">
                ₹{slPrice.toFixed(1)}
              </div>
              <span className="text-[10px] text-[#df514c] font-mono block">
                -₹{slRisk.toLocaleString('en-IN')} Risk
              </span>
            </div>

            {/* 3. TARGET 1 */}
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-bold text-[#00a86b] uppercase tracking-wider block">
                TARGET 1 (+25%)
              </span>
              <div className="text-sm font-bold font-mono text-[#00a86b] mt-0.5">
                ₹{target1Price.toFixed(1)}
              </div>
              <span className="text-[10px] text-[#00a86b] font-mono block">
                +₹{target1Gain.toLocaleString('en-IN')} (50%)
              </span>
            </div>

            {/* 4. TARGET 2 */}
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-bold text-[#00a86b] uppercase tracking-wider block">
                TARGET 2 (+45%)
              </span>
              <div className="text-sm font-bold font-mono text-[#00a86b] mt-0.5">
                ₹{target2Price.toFixed(1)}
              </div>
              <span className="text-[10px] text-[#00a86b] font-mono block">
                +₹{target2Gain.toLocaleString('en-IN')} (Max)
              </span>
            </div>

          </div>

          {/* V3 Pro Confluence Checkpoints */}
          <div className="py-1 px-2 rounded bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-1 text-[10px] text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>15-Min ORB Filter</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>Day Open Rule</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>9/21 EMA Ribbon</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>Supertrend (10,3)</span>
            </span>
            <span className="flex items-center gap-1 font-medium col-span-2 sm:col-span-1">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>ADX &gt; 18 Trend</span>
            </span>
          </div>

          {/* Action Button & Margin Row */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onExecutePaperTrade(activeSignal)}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition active:scale-[0.98] text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer ${isBuyCe
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                : 'bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700'
                }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isBuyCe ? 'BUY CALL (CE)' : 'BUY PUT (PE)'} • 1 LOT ({qty} QTY)</span>
            </button>

            {/* Order Margin & Upgraded R:R Details */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>
                Margin Req: <strong className="text-slate-800 font-mono font-bold">₹{marginRequired.toLocaleString('en-IN')}</strong>
              </span>
              <span>
                Risk : Reward <strong className="text-emerald-600 font-mono font-bold">1:2.0</strong> (Institutional R:R)
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <span>Signal Time: {activeSignal.timestamp || '09:50 am'}</span>
        <span>Order Type: Intraday MIS • Valid Today</span>
      </div>

    </div>
  );
}
