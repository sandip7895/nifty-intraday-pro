import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import {
  fetchNifty30DayCandles,
  run30DayBacktest
} from '../services/marketDataService';

export default function BacktestModal({
  isOpen,
  onClose,
  onLoadDayToChart
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backtestResult, setBacktestResult] = useState(null);
  const [sessionsData, setSessionsData] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadRealBacktestData();
    }
  }, [isOpen]);

  const loadRealBacktestData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const daySessions = await fetchNifty30DayCandles();
      if (!daySessions || daySessions.length === 0) {
        throw new Error('No historical candles returned from market feed');
      }

      setSessionsData(daySessions);
      const results = run30DayBacktest(daySessions);
      setBacktestResult(results);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch historical data from real market feed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-2xl p-3.5 sm:p-5 max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center justify-between gap-3 mb-3 pr-8 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#ff5722] flex items-center justify-center text-white shadow-2xs font-bold text-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  30-Day Real NIFTY 50 Backtest Report
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#e6f4ea] text-[#00a86b] uppercase">
                  v2 • Enhanced Confluence
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                100% Real Exchange 5-Min Candles (Oct-Nov) • VWAP + 9 EMA + Body Conviction Filter
              </p>
            </div>
          </div>

          <button
            onClick={loadRealBacktestData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-300 hover:border-[#387ed1] hover:text-[#387ed1] text-slate-700 bg-white text-xs font-medium transition cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <h3 className="text-sm font-bold text-slate-800">
              Fetching 2,200+ Real 5-Minute Candles...
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Calculating 7-Layer Confluence across all 30 trading sessions
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadRealBacktestData}
              className="px-3 py-1 rounded bg-rose-600 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Backtest Statistics - Sleek Compact Integrated Bar */}
        {!isLoading && backtestResult && (
          <div className="space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden">
            
            {/* Integrated Compact Stats Bar (Replaces bulky 4 boxes) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 grid grid-cols-2 sm:grid-cols-4 gap-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 shrink-0 shadow-2xs">
              
              {/* Stat 1: Total Trades */}
              <div className="px-3 py-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Sessions
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-black font-mono text-slate-800">
                    {backtestResult.totalTrades}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    (1 trade/day)
                  </span>
                </div>
              </div>

              {/* Stat 2: Win Rate */}
              <div className="px-3 py-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Accuracy (Win Rate)
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-bold font-mono text-[#00a86b]">
                    {backtestResult.winRate}%
                  </span>
                  <span className="text-[10px] text-[#00a86b] font-bold bg-[#e6f4ea] px-1 py-0.2 rounded">
                    {backtestResult.winningTrades}W / {backtestResult.losingTrades}L
                  </span>
                </div>
              </div>

              {/* Stat 3: Net Profit */}
              <div className="px-3 py-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Net P&L (1 Lot)
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-bold font-mono text-[#387ed1]">
                    +₹{backtestResult.netPnl.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    PF: {backtestResult.profitFactor}
                  </span>
                </div>
              </div>

              {/* Stat 4: Max Drawdown */}
              <div className="px-3 py-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Max Drawdown (Risk)
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-bold font-mono text-[#df514c]">
                    -₹{backtestResult.maxDrawdown.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Strict 15% SL
                  </span>
                </div>
              </div>

            </div>

            {/* Day-by-Day Historical Trades Table with "Replay on Chart" button */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-1.5 shrink-0">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Historical Day-by-Day Real Trades (Last 30 Days)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Click <strong>"Replay Day"</strong> to load session onto chart
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto flex-1 min-h-0 overflow-y-auto shadow-2xs">
                <table className="w-full text-xs text-left min-w-[620px]">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold sticky top-0 backdrop-blur-xs">
                    <tr>
                      <th className="py-2.5 px-3">DATE & TIME</th>
                      <th className="py-2.5 px-3">CONTRACT</th>
                      <th className="py-2.5 px-3">SPOT</th>
                      <th className="py-2.5 px-3">ENTRY</th>
                      <th className="py-2.5 px-3">EXIT</th>
                      <th className="py-2.5 px-3">P&L (1 LOT)</th>
                      <th className="py-2.5 px-3">OUTCOME</th>
                      <th className="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {backtestResult.trades.map((trade) => {
                      const isProfit = trade.pnl > 0;
                      return (
                        <tr key={trade.id} className="hover:bg-blue-50/40 transition">
                          <td className="py-2 px-3 text-slate-600 font-sans">
                            <span className="font-semibold block">{trade.date}</span>
                            <span className="text-[10px] text-slate-400">{trade.time}</span>
                          </td>

                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                              trade.type === 'BUY_CE' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' 
                                : 'bg-rose-50 text-rose-800 border-rose-200/80'
                            }`}>
                              {trade.type === 'BUY_CE' ? 'CALL' : 'PUT'}
                            </span>
                            <span className="ml-1.5 font-bold text-slate-800">{trade.strike}</span>
                          </td>

                          <td className="py-2 px-3 text-slate-600 font-semibold">
                            ₹{trade.spotEntry}
                          </td>

                          <td className="py-2 px-3 text-slate-600">
                            ₹{trade.entryPrice}
                          </td>

                          <td className="py-2 px-3 text-slate-900 font-bold">
                            ₹{trade.exitPrice}
                          </td>

                          <td className={`py-2 px-3 font-extrabold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isProfit ? '+' : ''}₹{trade.pnl.toFixed(2)}
                          </td>

                          <td className="py-2 px-3 font-sans text-xs">
                            <span className={`inline-flex items-center gap-1 ${isProfit ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                              {isProfit ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                              {trade.result}
                            </span>
                          </td>

                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => {
                                const matchingSession = sessionsData.find(s => s.date === trade.rawDate || s.displayDate === trade.date);
                                if (matchingSession) {
                                  onLoadDayToChart(matchingSession.candles, trade);
                                  onClose();
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#387ed1] hover:bg-[#2b6cb0] text-white font-sans text-[11px] font-medium transition cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3 text-white" />
                              <span>Replay Day</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
