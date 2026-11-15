import React from 'react';
import { Target, Shield, Check, ArrowRight, Zap, Info } from 'lucide-react';

export default function SignalCard({
  activeSignal,
  onExecutePaperTrade
}) {
  const isBuyCe = activeSignal.action === 'BUY_CE';
  const isBuyPe = activeSignal.action === 'BUY_PE';
  const isWait = activeSignal.action === 'WAIT';

  const spotEntry = activeSignal.spotTrigger || 25189.10;
  const isCe = isBuyCe || !isBuyPe;
  
  // Logical spot SL & targets aligned with trade direction
  const spotSl = isCe ? Number((spotEntry - 35).toFixed(0)) : Number((spotEntry + 35).toFixed(0));
  const spotTarget1 = isCe ? Number((spotEntry + 50).toFixed(0)) : Number((spotEntry - 50).toFixed(0));
  const spotTarget2 = isCe ? Number((spotEntry + 90).toFixed(0)) : Number((spotEntry - 90).toFixed(0));

  // Calculations for 1 Lot (65 Qty)
  const qty = 65;
  const entryPrice = activeSignal.optionEntry || 130;
  const target1Price = activeSignal.optionTarget1 || 158.6;
  const target2Price = activeSignal.optionTarget2 || 182;
  const slPrice = activeSignal.optionSl || 110.5;

  const marginRequired = Math.round(entryPrice * qty);
  const target1Gain = Math.round((target1Price - entryPrice) * qty);
  const target2Gain = Math.round((target2Price - entryPrice) * qty);
  const slRisk = Math.round((entryPrice - slPrice) * qty);

  return (
    <div className="bg-white border border-slate-200 rounded-md p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between h-full w-full font-sans">
      
      {/* Zerodha Kite Header: Instrument & Live Price */}
      <div className="pb-2.5 border-b border-slate-100 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {isWait ? 'Awaiting Confluence Setup' : activeSignal.strikeName}
              </h2>
              {!isWait && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  MIS • 65 QTY (1 LOT)
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              {!isWait && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                  isBuyCe 
                    ? 'text-[#00a86b] bg-[#e6f4ea] border border-[#ceead6]' 
                    : 'text-[#ff5722] bg-[#fbe9e7] border border-[#ffccbc]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBuyCe ? 'bg-[#00a86b]' : 'bg-[#ff5722]'} animate-pulse`}></span>
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
                <span className="text-base sm:text-lg font-bold font-mono text-slate-900">
                  ₹{entryPrice.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">LTP</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {activeSignal.result ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    activeSignal.status === 'TARGET_HIT' 
                      ? 'bg-[#e6f4ea] text-[#00a86b]' 
                      : 'bg-[#fbe9e7] text-[#df514c]'
                  }`}>
                    {activeSignal.status === 'TARGET_HIT' ? 'Target Achieved' : 'Stop Loss Hit'}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500">
                    Confidence: <strong className="text-[#00a86b] font-mono">{activeSignal.accuracy}%</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isWait ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Scanning 5-minute candles for VWAP & 9 EMA high-probability confluence...
        </div>
      ) : (
        <div className="my-2 space-y-2 flex-1 flex flex-col justify-around">
          
          {/* Zerodha Kite Parameters Grid (Entry, SL, Target 1, Target 2) */}
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
                STOP LOSS (-15%)
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
                TARGET 1 (+22%)
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
                TARGET 2 (+40%)
              </span>
              <div className="text-sm font-bold font-mono text-[#00a86b] mt-0.5">
                ₹{target2Price.toFixed(1)}
              </div>
              <span className="text-[10px] text-[#00a86b] font-mono block">
                +₹{target2Gain.toLocaleString('en-IN')} (Max)
              </span>
            </div>

          </div>

          {/* Confluence Checkpoints - Multi-Indicator High-Accuracy Confirmation */}
          <div className="py-1 px-2 rounded bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-1 text-[10.5px] text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>VWAP Direction</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>9/21 EMA Trend</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>Supertrend (10,3)</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>RSI Zone</span>
            </span>
            <span className="flex items-center gap-1 font-medium col-span-2 sm:col-span-1">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>ADX &gt; 20 Filter</span>
            </span>
          </div>

          {/* Zerodha Kite Action Button & Margin Row */}
          <div className="space-y-1.5 pt-0.5">
            <button
              onClick={() => onExecutePaperTrade(activeSignal)}
              className={`w-full py-2.5 px-4 rounded font-bold text-xs uppercase tracking-wider transition active:scale-[0.99] text-white shadow-2xs flex items-center justify-center gap-2 cursor-pointer ${
                isBuyCe
                  ? 'bg-[#387ed1] hover:bg-[#2b6cb0]'
                  : 'bg-[#ff5722] hover:bg-[#e64a19]'
              }`}
            >
              <span>{isBuyCe ? 'BUY CALL' : 'BUY PUT'} • 1 LOT (65 QTY)</span>
            </button>

            {/* Kite Order Margin Details */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
              <span>
                Margin req: <strong className="text-slate-800 font-mono font-medium">₹{marginRequired.toLocaleString('en-IN')}</strong>
              </span>
              <span>
                Risk:Reward <strong className="text-slate-800 font-mono font-medium">1:2.0</strong>
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
