import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function PaperTradeManager({
  positions,
  closedTrades,
  onClosePosition
}) {
  const [activeTab, setActiveTab] = useState('positions');

  const totalClosedPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
  const winCount = closedTrades.filter(t => t.pnl > 0).length;
  const winRate = closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-md p-2.5 sm:p-3 shadow-2xs flex flex-col h-[180px] shrink-0 w-full font-sans">
      
      {/* Kite Style Header: Underline Tabs & Live P&L */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 shrink-0">
        
        {/* Left Underline Tabs */}
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => setActiveTab('positions')}
            className={`pb-1 font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'positions'
                ? 'border-[#387ed1] text-[#387ed1] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-1 font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'history'
                ? 'border-[#387ed1] text-[#387ed1] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Orders / History ({closedTrades.length})
          </button>
        </div>

        {/* Right: Total P&L & Win Rate */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="hidden sm:block text-slate-500">
            Win Rate: <strong className="text-slate-800">{winRate}%</strong>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] text-slate-400 uppercase font-sans">Total P&L:</span>
            <strong className={`font-bold ${totalClosedPnl >= 0 ? 'text-[#00a86b]' : 'text-[#df514c]'}`}>
              {totalClosedPnl >= 0 ? '+' : ''}₹{totalClosedPnl.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-2">
        {activeTab === 'positions' ? (
          <div>
            {positions.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No open positions. Click "BUY" on the trade card above to execute.
              </div>
            ) : (
              <div className="space-y-1.5">
                {positions.map((pos) => {
                  const isProfit = pos.pnl >= 0;
                  return (
                    <div
                      key={pos.id}
                      className="bg-slate-50 border border-slate-200 rounded p-2 flex items-center justify-between gap-2 hover:bg-slate-100/70 transition"
                    >
                      {/* Left: Instrument & Metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${
                            pos.type === 'BUY_CE' ? 'bg-[#e6f4ea] text-[#00a86b]' : 'bg-[#fbe9e7] text-[#ff5722]'
                          }`}>
                            {pos.type === 'BUY_CE' ? 'BUY CE' : 'BUY PE'}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{pos.strike}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({pos.qty} Qty)</span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-2">
                          <span>Avg: <strong className="text-slate-800">₹{pos.entryPrice}</strong></span>
                          <span>LTP: <strong className="text-[#387ed1]">₹{pos.currentPrice}</strong></span>
                          <span className="hidden md:inline">SL: ₹{pos.sl}</span>
                          <span className="hidden md:inline">Tgt: ₹{pos.target1}</span>
                        </div>
                      </div>

                      {/* Right: P&L & Kite Exit Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <span className={`text-xs font-bold block ${isProfit ? 'text-[#00a86b]' : 'text-[#df514c]'}`}>
                            {isProfit ? '+' : ''}₹{pos.pnl.toFixed(2)}
                          </span>
                          <span className={`text-[10px] ${isProfit ? 'text-[#00a86b]' : 'text-[#df514c]'}`}>
                            {isProfit ? '+' : ''}{pos.pnlPercent}%
                          </span>
                        </div>

                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-[#df514c] hover:text-white border border-slate-300 hover:border-[#df514c] text-slate-700 text-xs font-medium transition cursor-pointer"
                        >
                          Exit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {closedTrades.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No executed trades today yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold sticky top-0 bg-white">
                    <tr>
                      <th className="py-1 px-2">TIME</th>
                      <th className="py-1 px-2">INSTRUMENT</th>
                      <th className="py-1 px-2">QTY</th>
                      <th className="py-1 px-2">AVG PRICE</th>
                      <th className="py-1 px-2">EXIT PRICE</th>
                      <th className="py-1 px-2">P&L</th>
                      <th className="py-1 px-2">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {closedTrades.map((t) => {
                      const isProfit = t.pnl >= 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2 text-slate-400">{t.time}</td>
                          <td className="py-1.5 px-2 font-bold text-slate-800 font-sans">{t.strike}</td>
                          <td className="py-1.5 px-2 text-slate-500">{t.qty || 65}</td>
                          <td className="py-1.5 px-2 text-slate-600">₹{t.entryPrice}</td>
                          <td className="py-1.5 px-2 text-slate-900 font-semibold">₹{t.exitPrice}</td>
                          <td className={`py-1.5 px-2 font-bold ${isProfit ? 'text-[#00a86b]' : 'text-[#df514c]'}`}>
                            {isProfit ? '+' : ''}₹{t.pnl.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-slate-500 font-sans text-[11px]">
                            {t.reason}
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
