import React, { useState } from 'react';
import { Target, Shield, Check, ArrowRight, Zap, Info, Plus, Minus, Pencil, RotateCcw } from 'lucide-react';

export default function SignalCard({
  activeSignal,
  currentSpotPrice,
  onExecutePaperTrade,
  onSetCustomPremium,
  onClearCustomPremium
}) {
  const [lotCount, setLotCount] = useState(1);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [entryInput, setEntryInput] = useState('');

  const isBuyCe = activeSignal.action === 'BUY_CE';
  const isBuyPe = activeSignal.action === 'BUY_PE';
  const isWait = activeSignal.action === 'WAIT';

  const isSensex = activeSignal.instrument === 'SENSEX' || (activeSignal.strikeName && activeSignal.strikeName.includes('SENSEX'));
  const baseLotQty = activeSignal.lotSize || (isSensex ? 20 : 65);
  const totalQty = baseLotQty * lotCount;
  const spotEntry = activeSignal.spotTrigger || (isSensex ? 81592.45 : 25189.10);
  const isCe = isBuyCe || !isBuyPe;

  // Option Calculations (Target 1: +18%, Target 2: +45%, SL: -14%)
  const entryPrice = activeSignal.optionEntry || (isSensex ? 340 : 135);
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
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-emerald-100 text-emerald-800">
                    Target Achieved
                  </span>
                ) : activeSignal.status === 'SL_HIT' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-rose-100 text-rose-800">
                    SL Hit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    LIVE ACTIVE
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

            {/* 1. ENTRY (Editable to sync with Real Broker LTP e.g. ₹190) */}
            <div className={`p-2 rounded border transition ${activeSignal.isCustomPremium ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {activeSignal.isCustomPremium ? 'ENTRY (SYNCED)' : 'ENTRY (EST.)'}
                </span>
                {onSetCustomPremium && !isEditingEntry && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEntryInput(String(entryPrice));
                        setIsEditingEntry(true);
                      }}
                      title="Enter real broker option premium (e.g. 190)"
                      className="p-0.5 rounded bg-white border border-slate-200 hover:border-blue-500 text-blue-600 transition cursor-pointer"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                    {activeSignal.isCustomPremium && onClearCustomPremium && (
                      <button
                        type="button"
                        onClick={onClearCustomPremium}
                        title="Reset to default estimated premium"
                        className="p-0.5 rounded bg-white border border-slate-200 hover:border-slate-400 text-slate-500 transition cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditingEntry ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = parseFloat(entryInput);
                    if (parsed > 0 && onSetCustomPremium) {
                      onSetCustomPremium(parsed);
                    }
                    setIsEditingEntry(false);
                  }}
                  className="flex items-center gap-1 mt-1"
                >
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    autoFocus
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingEntry(false); }}
                    placeholder="190"
                    className="w-full min-w-0 px-1.5 py-0.5 text-xs font-bold font-mono bg-white border border-blue-400 rounded outline-none text-slate-900"
                  />
                  <button
                    type="submit"
                    title="Apply Real Premium"
                    className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onSetCustomPremium) {
                      setEntryInput(String(entryPrice));
                      setIsEditingEntry(true);
                    }
                  }}
                  title="Click to enter your real broker LTP"
                  className="text-sm font-bold font-mono text-slate-900 mt-0.5 hover:text-blue-600 transition cursor-pointer text-left block"
                >
                  ₹{entryPrice.toFixed(1)}
                </button>
              )}

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
                TARGET 1 (+18%)
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
          <div className="py-1 px-2 rounded bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-6 gap-1 text-[10px] text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>3-Min Fast Trigger</span>
            </span>
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
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3 h-3 text-[#00a86b] stroke-[3]" />
              <span>ADX &gt; 18 Trend</span>
            </span>
          </div>

          {/* Action Button & Margin Row */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onExecutePaperTrade({ ...activeSignal, lotSize: totalQty, lotCount })}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition active:scale-[0.98] text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer ${isBuyCe
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                : 'bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700'
                }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isBuyCe ? 'BUY CALL (CE)' : 'BUY PUT (PE)'} • {lotCount} {lotCount === 1 ? 'LOT' : 'LOTS'} ({totalQty} QTY)</span>
            </button>

            {/* Order Margin & Upgraded R:R Details */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>
                Margin Req: <strong className="text-slate-800 font-mono font-bold">₹{marginRequired.toLocaleString('en-IN')}</strong>
              </span>
              <span>
                Risk : Reward <strong className="text-emerald-600 font-mono font-bold">1:1.3</strong> (Institutional R:R)
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
