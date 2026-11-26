import React, { useState } from 'react';
import { Target, Shield, Check, ArrowRight, Zap, Info, Plus, Minus, BarChart2 } from 'lucide-react';

export default function SignalCard({
  activeSignal,
  currentSpotPrice,
  onExecutePaperTrade,
  chartMode = 'SPOT',
  onToggleChartMode
}) {
  const [lotCount, setLotCount] = useState(1);
  const [justOrdered, setJustOrdered] = useState(false);

  const handleOrder = () => {
    if (!onExecutePaperTrade) return;
    const ok = onExecutePaperTrade({ ...activeSignal, lotSize: totalQty, lotCount });
    if (ok !== false) {
      setJustOrdered(true);
      setTimeout(() => setJustOrdered(false), 1500);
    }
  };

  const isBuyCe = activeSignal.action === 'BUY_CE';
  const isBuyPe = activeSignal.action === 'BUY_PE';
  const isWait = activeSignal.action === 'WAIT';

  const isSensex = activeSignal.instrument === 'SENSEX' || (activeSignal.strikeName && activeSignal.strikeName.includes('SENSEX'));
  const baseLotQty = activeSignal.lotSize || (isSensex ? 20 : 65);
  const totalQty = baseLotQty * lotCount;
  const spotEntry = activeSignal.spotTrigger || (isSensex ? 81592.45 : 25189.10);
  const isCe = isBuyCe || !isBuyPe;

  // Option Calculations (Target 1: +18%, Target 2: +45%, SL: -14%)
  const entryPrice = activeSignal.optionEntry || (isSensex ? 340 : 195);
  const target1Price = activeSignal.optionTarget1 || (entryPrice * 1.18);
  const target2Price = activeSignal.optionTarget2 || (entryPrice * 1.45);
  const slPrice = activeSignal.optionSl || (entryPrice * 0.86);

  const delta = isSensex ? 0.50 : 0.52;

  // Real-time live option LTP (shows actual current price while OPEN, or exit price when finalized)
  const isOpenTrade = activeSignal.status === 'OPEN' || !activeSignal.result;
  let liveLtp = entryPrice;
  if (!isWait) {
    if (!isOpenTrade && activeSignal.exitPrice) {
      liveLtp = activeSignal.exitPrice;
    } else if (activeSignal.currentOptPrice) {
      liveLtp = activeSignal.currentOptPrice;
    } else if (currentSpotPrice && spotEntry) {
      const spotDiff = isCe ? (currentSpotPrice - spotEntry) : (spotEntry - currentSpotPrice);
      liveLtp = Number(Math.max(1, entryPrice + spotDiff * delta).toFixed(1));
    }
  }
  const livePct = entryPrice > 0 ? Number((((liveLtp - entryPrice) / entryPrice) * 100).toFixed(1)) : 0;
  const t1Pts = Math.round((target1Price - entryPrice) / delta);
  const t2Pts = Math.round((target2Price - entryPrice) / delta);
  const slPts = Math.round((entryPrice - slPrice) / delta);

  const spotSl = isCe ? Number((spotEntry - slPts).toFixed(0)) : Number((spotEntry + slPts).toFixed(0));
  const spotTarget1 = isCe ? Number((spotEntry + t1Pts).toFixed(0)) : Number((spotEntry - t1Pts).toFixed(0));
  const spotTarget2 = isCe ? Number((spotEntry + t2Pts).toFixed(0)) : Number((spotEntry - t2Pts).toFixed(0));

  const marginRequired = Math.round(entryPrice * totalQty);
  const target1Gain = Math.round((target1Price - entryPrice) * totalQty);
  const target2Gain = Math.round((target2Price - entryPrice) * totalQty);
  const slRisk = Math.round((entryPrice - slPrice) * totalQty);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col w-full max-w-full shrink-0 font-sans">

      {/* Sahi / Kite Header: Instrument & Live Price */}
      <div className="pb-2.5 border-b border-slate-100 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2
                onClick={() => !isWait && onToggleChartMode && onToggleChartMode('OPTION')}
                className={`text-sm sm:text-base font-extrabold text-slate-900 tracking-tight transition ${!isWait && onToggleChartMode ? 'cursor-pointer hover:text-blue-600' : ''}`}
                title="Click to view Option Chart"
              >
                {isWait ? 'Awaiting Confluence Setup' : activeSignal.strikeName}
              </h2>
              {!isWait && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                    MIS
                  </span>
                  {/* Interactive Lot Multiplier */}
                  <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setLotCount(l => Math.max(1, l - 1))}
                      disabled={lotCount <= 1}
                      title="Decrease Lot"
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition disabled:opacity-40 cursor-pointer text-xs shadow-2xs"
                    >
                      <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                    <span className="px-1.5 text-[10px] sm:text-[11px] font-black font-mono text-slate-800">
                      {lotCount} {lotCount === 1 ? 'LOT' : 'LOTS'} ({totalQty})
                    </span>
                    <button
                      type="button"
                      onClick={() => setLotCount(l => Math.min(20, l + 1))}
                      title="Increase Lot"
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer text-xs shadow-2xs"
                    >
                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                </div>
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
                  ₹{Number(liveLtp).toFixed(1)}
                </span>
                <span className={`text-[10px] font-bold font-mono ${livePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {livePct >= 0 ? '+' : ''}{livePct}%
                </span>
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {activeSignal.status === 'TARGET_HIT' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Target Achieved
                  </span>
                ) : activeSignal.status === 'SL_HIT' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono bg-rose-50 text-rose-700 border border-rose-200">
                    SL Hit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    LIVE ACTIVE
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {!isWait && onToggleChartMode && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              Interactive Chart:
            </span>
            <button
              type="button"
              onClick={() => onToggleChartMode(chartMode === 'OPTION' ? 'SPOT' : 'OPTION')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer shadow-2xs border ${
                chartMode === 'OPTION'
                  ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
              title={chartMode === 'OPTION' ? 'Switch back to Spot Index Chart' : `View Zerodha-style ${activeSignal.strikeName} Option Chart`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{chartMode === 'OPTION' ? `✓ Viewing ${activeSignal.strikeName} Chart` : `📈 View ${activeSignal.strikeName} Chart`}</span>
            </button>
          </div>
        )}
      </div>

      {isWait ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Scanning {isSensex ? 'BSE SENSEX' : 'NIFTY 50'} 5-minute candles for ORB & EMA Ribbon confluence...
        </div>
      ) : (
        <div className="mt-2 space-y-2">

          {/* Parameters Grid (Entry, SL, Target 1, Target 2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">

            {/* 1. ENTRY (Dynamic ATM Real Premium) */}
            <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                ENTRY (EST.)
              </span>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-900 mt-0.5">
                ₹{entryPrice.toFixed(1)}
              </div>
              <span className="text-[10px] text-slate-500 font-mono block truncate">
                Spot ₹{spotEntry}
              </span>
            </div>

            {/* 2. STOP LOSS */}
            <div className="p-1.5 sm:p-2 rounded-lg bg-rose-50/70 border border-rose-200/80">
              <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider block">
                STOP LOSS (-14%)
              </span>
              <div className="text-xs sm:text-sm font-bold font-mono text-rose-700 mt-0.5">
                ₹{slPrice.toFixed(1)}
              </div>
              <span className="text-[10px] text-rose-600 font-mono block truncate">
                -₹{slRisk.toLocaleString('en-IN')} Risk
              </span>
            </div>

            {/* 3. TARGET 1 */}
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">
                TARGET 1 (+18%)
              </span>
              <div className="text-xs sm:text-sm font-bold font-mono text-emerald-700 mt-0.5">
                ₹{target1Price.toFixed(1)}
              </div>
              <span className="text-[10px] text-emerald-600 font-mono block truncate">
                +₹{target1Gain.toLocaleString('en-IN')} (50%)
              </span>
            </div>

            {/* 4. TARGET 2 */}
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">
                TARGET 2 (+45%)
              </span>
              <div className="text-xs sm:text-sm font-bold font-mono text-emerald-700 mt-0.5">
                ₹{target2Price.toFixed(1)}
              </div>
              <span className="text-[10px] text-emerald-600 font-mono block truncate">
                +₹{target2Gain.toLocaleString('en-IN')} (Max)
              </span>
            </div>

          </div>

          {/* V3 Pro Confluence Checkpoints - Compact 3x2 Grid */}
          <div className="py-1 px-2 rounded-lg bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-0.5 text-[10px] text-slate-600">
            <span className="flex items-center gap-1 font-medium truncate">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
              <span>3-Min Fast Trigger</span>
            </span>
            <span className="flex items-center gap-1 font-medium truncate">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
              <span>15-Min ORB Filter</span>
            </span>
            <span className="flex items-center gap-1 font-medium truncate">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
              <span>Day Open Rule</span>
            </span>
            <span className="flex items-center gap-1 font-medium truncate">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
              <span>9/21 EMA Ribbon</span>
            </span>
            <span className="flex items-center gap-1 font-medium truncate">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
              <span>Supertrend (10,3)</span>
            </span>
            <span className="flex items-center gap-1 font-medium truncate">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
              <span>ADX &gt; 18 Trend</span>
            </span>
          </div>

          {/* Action Button & Margin Row */}
          <div className="space-y-1.5 pt-0.5">
            <button
              onClick={handleOrder}
              disabled={isWait}
              className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition active:scale-[0.98] text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                justOrdered
                  ? 'bg-emerald-700 ring-2 ring-emerald-400'
                  : isBuyCe
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {justOrdered ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ORDER EXECUTED • RECORDED BELOW</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{isBuyCe ? 'BUY CALL (CE)' : 'BUY PUT (PE)'} • {lotCount} {lotCount === 1 ? 'LOT' : 'LOTS'} ({totalQty} QTY)</span>
                </>
              )}
            </button>

            {/* Order Margin & Upgraded R:R Details */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>
                Margin Req: <strong className="text-slate-800 font-mono font-bold">₹{marginRequired.toLocaleString('en-IN')}</strong>
              </span>
              <span>
                Risk : Reward <strong className="text-emerald-700 font-mono font-bold">1:1.3</strong> (Institutional R:R)
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
