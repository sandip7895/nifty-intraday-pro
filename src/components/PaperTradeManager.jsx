import React, { useState } from 'react';
import { RotateCcw, Trash2, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export default function PaperTradeManager({
  positions = [],
  closedTrades = [],
  onClosePosition,
  onResetAccount
}) {
  const [activeTab, setActiveTab] = useState('positions');

  const totalClosedPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const totalOpenPnl = positions.reduce((acc, p) => acc + (p.pnl || 0), 0);
  const netCombinedPnl = totalClosedPnl + totalOpenPnl;

  const winCount = closedTrades.filter(t => t.pnl > 0).length;
  const winRate = closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-col flex-1 min-h-[220px] max-h-[380px] lg:max-h-none overflow-hidden font-sans">
      
      {/* Sahi / Kite Style Underline Tabs & Live Summary */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 shrink-0">
        
        {/* Left Underline Tabs */}
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`pb-1 font-semibold transition cursor-pointer border-b-2 flex items-center gap-1 ${
              activeTab === 'positions'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Positions</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              positions.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {positions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-1 font-semibold transition cursor-pointer border-b-2 flex items-center gap-1 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Orders / History</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              closedTrades.length > 0 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {closedTrades.length}
            </span>
          </button>
        </div>

        {/* Right: Net P&L & Clear History */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {closedTrades.length > 0 && (
            <span className="hidden sm:inline text-[10px] text-slate-400 font-sans">
              Win Rate: <strong className="text-slate-700 font-mono">{winRate}%</strong>
            </span>
          )}

          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-sans">P&L:</span>
            <strong className={`font-black text-xs sm:text-sm ${netCombinedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netCombinedPnl >= 0 ? '+' : ''}₹{netCombinedPnl.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </strong>
          </div>

          {(positions.length > 0 || closedTrades.length > 0) && onResetAccount && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all paper trade history and reset funds to ₹1,00,000?')) {
                  onResetAccount();
                }
              }}
              title="Clear paper trades & reset funds"
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Container (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-2 pr-0.5">
        
        {/* TAB 1: POSITIONS (Active Open Trades) */}
        {activeTab === 'positions' && (
          <div>
            {positions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                <Layers className="w-7 h-7 text-slate-300 mb-1.5" />
                <span className="font-semibold text-slate-600">No active positions</span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Click &ldquo;BUY CALL&rdquo; or &ldquo;BUY PUT&rdquo; above to execute a simulated trade.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {positions.map((pos) => {
                  const isProfit = (pos.pnl || 0) >= 0;
                  return (
                    <div
                      key={pos.id}
                      className="bg-slate-50 border border-slate-200/90 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 hover:bg-slate-100/70 transition"
                    >
                      {/* Left: Instrument & Metadata */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase border ${
                            pos.type === 'BUY_CE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {pos.type === 'BUY_CE' ? 'CALL' : 'PUT'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">{pos.strike}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({pos.qty} Qty)</span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-1 flex-wrap">
                          <span>Avg: <strong className="text-slate-800">₹{pos.entryPrice}</strong></span>
                          <span>LTP: <strong className="text-blue-600">₹{pos.currentPrice}</strong></span>
                          <span className="hidden xs:inline text-slate-400">SL: ₹{pos.sl}</span>
                          <span className="hidden xs:inline text-slate-400">Tgt: ₹{pos.target1}</span>
                        </div>
                      </div>

                      {/* Right: Live P&L & Kite-Style Exit Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right font-mono">
                          <span className={`text-xs sm:text-sm font-black block ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isProfit ? '+' : ''}₹{Number(pos.pnl || 0).toFixed(2)}
                          </span>
                          <span className={`text-[10px] font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isProfit ? '+' : ''}{pos.pnlPercent || 0}%
                          </span>
                        </div>

                        {onClosePosition && (
                          <button
                            type="button"
                            onClick={() => onClosePosition(pos.id)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-600 hover:text-white border border-slate-300 hover:border-rose-600 text-slate-700 text-xs font-bold transition cursor-pointer shadow-2xs"
                          >
                            Exit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS / HISTORY (Executed Trades Saved in LocalStorage) */}
        {activeTab === 'history' && (
          <div>
            {closedTrades.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                <RotateCcw className="w-6 h-6 text-slate-300 mb-1.5" />
                <span className="font-semibold text-slate-600">No executed orders yet</span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Executed and closed trades will automatically be saved here.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[380px]">
                  <thead className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold sticky top-0 bg-white">
                    <tr>
                      <th className="py-1 px-1.5">TIME</th>
                      <th className="py-1 px-1.5">CONTRACT</th>
                      <th className="py-1 px-1.5">QTY</th>
                      <th className="py-1 px-1.5">ENTRY</th>
                      <th className="py-1 px-1.5">EXIT</th>
                      <th className="py-1 px-1.5">P&L</th>
                      <th className="py-1 px-1.5 text-right">REASON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {closedTrades.map((t) => {
                      const isProfit = (t.pnl || 0) >= 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                          <td className="py-1.5 px-1.5 text-slate-400 text-[10px] whitespace-nowrap">{t.time}</td>
                          <td className="py-1.5 px-1.5 font-bold text-slate-800 font-sans whitespace-nowrap">
                            <span className={`inline-block mr-1 text-[9px] font-black px-1 py-0.2 rounded uppercase ${
                              t.type === 'BUY_CE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {t.type === 'BUY_CE' ? 'CE' : 'PE'}
                            </span>
                            {t.strike}
                          </td>
                          <td className="py-1.5 px-1.5 text-slate-500">{t.qty || 65}</td>
                          <td className="py-1.5 px-1.5 text-slate-600">₹{t.entryPrice}</td>
                          <td className="py-1.5 px-1.5 text-slate-900 font-bold">₹{t.exitPrice}</td>
                          <td className={`py-1.5 px-1.5 font-black whitespace-nowrap ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isProfit ? '+' : ''}₹{Number(t.pnl || 0).toFixed(2)}
                          </td>
                          <td className="py-1.5 px-1.5 text-right font-sans text-[10px] text-slate-500 truncate max-w-[120px]">
                            {t.reason || (isProfit ? 'Target Hit' : 'SL Hit')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
