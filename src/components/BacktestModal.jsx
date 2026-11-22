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
  RotateCcw,
  Info
} from 'lucide-react';
import {
  fetchHistoricalCandles,
  runBacktest,
  INSTRUMENTS
} from '../services/marketDataService';

export default function BacktestModal({
  isOpen,
  onClose,
  onLoadDayToChart,
  currentInstrument = 'NIFTY'
}) {
  const [selectedInstrument, setSelectedInstrument] = useState(currentInstrument);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backtestResult, setBacktestResult] = useState(null);
  const [sessionsData, setSessionsData] = useState([]);
  const [allSessionsData, setAllSessionsData] = useState([]);
  const [datePreset, setDatePreset] = useState('30d'); // Default to 30 Days
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showFeedInfo, setShowFeedInfo] = useState(false);

  // Sync selected instrument with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedInstrument(currentInstrument);
      loadRealBacktestData(currentInstrument);
    }
  }, [isOpen, currentInstrument]);

  const applyFilter = (preset, customStart, customEnd, sessionsList, inst = selectedInstrument) => {
    const list = sessionsList || allSessionsData;
    if (!list || list.length === 0) return;

    let filteredSessions = [];
    const latestDate = list[list.length - 1]?.date;
    const latestYearMonth = latestDate ? latestDate.slice(0, 7) : '';

    if (preset === 'this_month') {
      // Current Calendar Month (e.g. Nov 2026)
      filteredSessions = list.filter(item => item.date.startsWith(latestYearMonth));
    } else if (preset === 'last_month') {
      // Previous Complete Calendar Month (e.g. Oct 2026)
      const yearMonths = Array.from(new Set(list.map(item => item.date.slice(0, 7)))).sort();
      const prevYearMonth = yearMonths.length >= 2 ? yearMonths[yearMonths.length - 2] : latestYearMonth;
      filteredSessions = list.filter(item => item.date.startsWith(prevYearMonth));
    } else if (preset === '7d') {
      filteredSessions = list.slice(Math.max(0, list.length - 7));
    } else if (preset === '15d') {
      filteredSessions = list.slice(Math.max(0, list.length - 15));
    } else if (preset === '30d') {
      filteredSessions = list.slice(Math.max(0, list.length - 30));
    } else if (preset === '60d') {
      filteredSessions = list;
    } else if (preset === 'custom') {
      const s = customStart || startDate;
      const e = customEnd || endDate;
      filteredSessions = list.filter(item => item.date >= s && item.date <= e);
    }

    if (!filteredSessions || filteredSessions.length === 0) {
      filteredSessions = list;
    }

    setSessionsData(filteredSessions);
    const results = runBacktest(filteredSessions, inst);
    setBacktestResult(results);
  };

  const loadRealBacktestData = async (inst = selectedInstrument) => {
    setIsLoading(true);
    setError(null);

    try {
      const daySessions = await fetchHistoricalCandles('60d', inst);
      if (!daySessions || daySessions.length === 0) {
        throw new Error(`No historical candles returned from ${inst} market feed`);
      }

      setAllSessionsData(daySessions);
      const defaultStart = daySessions[0]?.date;
      const defaultEnd = daySessions[daySessions.length - 1]?.date;
      setStartDate(defaultStart);
      setEndDate(defaultEnd);

      applyFilter(datePreset, defaultStart, defaultEnd, daySessions, inst);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch historical data from real market feed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstrumentSwitch = (newInst) => {
    if (newInst === selectedInstrument) return;
    setSelectedInstrument(newInst);
    loadRealBacktestData(newInst);
  };

  if (!isOpen) return null;

  const lotQty = selectedInstrument === 'SENSEX' ? 20 : 65;

  const getTitle = () => {
    if (datePreset === 'this_month') {
      const monthName = sessionsData[0]?.date
        ? new Date(sessionsData[0].date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : 'This Month';
      return `This Month (${monthName})`;
    }
    if (datePreset === 'last_month') {
      const monthName = sessionsData[0]?.date
        ? new Date(sessionsData[0].date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : 'Last Month';
      return `Last Month (${monthName})`;
    }
    if (datePreset === '60d') return '2-3 Months (60 Days Max)';
    if (datePreset === '30d') return '30 Days';
    if (datePreset === '15d') return '15 Days';
    if (datePreset === '7d') return '7 Days';
    return 'Custom Date';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-5 overflow-hidden">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 sm:p-4.5 max-h-[88dvh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto">

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pr-9 sm:pr-10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Obsidian Squircle Logo Mark */}
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-blue-400 shadow-sm shrink-0">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {getTitle()} {selectedInstrument === 'SENSEX' ? 'BSE SENSEX' : 'NIFTY 50'} Backtest
                </h2>
                <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wide">
                  v3 • 3-Min Fast Execution
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 truncate mt-0.5">
                Real 5-Min Candles (Up to 60 Sessions / 4,500+ Candles) • 15-Min ORB + 3-Min Fast Breakout • 1 Lot ({lotQty} Qty)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Instrument Switcher inside Backtest Modal */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleInstrumentSwitch('NIFTY')}
                className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition cursor-pointer ${
                  selectedInstrument === 'NIFTY'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                NIFTY 50
              </button>
              <button
                type="button"
                onClick={() => handleInstrumentSwitch('SENSEX')}
                className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition cursor-pointer ${
                  selectedInstrument === 'SENSEX'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SENSEX
              </button>
            </div>

            <button
              onClick={() => loadRealBacktestData(selectedInstrument)}
              disabled={isLoading}
              title="Recalculate Backtest"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 bg-white text-xs font-semibold transition cursor-pointer shrink-0 shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Recalculate</span>
            </button>
          </div>
        </div>

        {/* Quick Date Range & Custom Filter Bar */}
        {!isLoading && allSessionsData.length > 0 && (
          <div className="mb-2 shrink-0 bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 sm:p-2 shadow-2xs">
            <div className="flex items-center justify-between gap-1 flex-wrap">

              {/* Presets (This Month, Last Month, 30D, 60D / 2M, 15D, 7D, Custom) */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5 hidden xs:inline">
                  Range:
                </span>
                {[
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_month', label: 'Last Month' },
                  { id: '30d', label: '30 Days' },
                  { id: '60d', label: '2-3 Months (Max)' },
                  { id: '15d', label: '15D' },
                  { id: '7d', label: '7D' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setDatePreset(p.id);
                      setShowCustomPicker(false);
                      applyFilter(p.id, startDate, endDate, allSessionsData, selectedInstrument);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      datePreset === p.id && !showCustomPicker
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}

                <button
                  onClick={() => {
                    const next = !showCustomPicker;
                    setShowCustomPicker(next);
                    if (next) setDatePreset('custom');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    showCustomPicker || datePreset === 'custom'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Custom Date</span>
                </button>
              </div>

              {/* Exchange Feed Limit Info Pill */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowFeedInfo(!showFeedInfo)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded transition cursor-pointer"
                  title="Why up to 60 days? Click to see exchange data retention rules"
                >
                  <Info className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="hidden sm:inline">Feed Limit: Max 60 Sessions (~3 Months)</span>
                  <span className="sm:hidden">Feed Info</span>
                </button>
              </div>

            </div>

            {/* Feed Explanation Dropdown (Explains 60D max intraday limit vs 6M/1Y) */}
            {showFeedInfo && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[11px] text-slate-600 bg-blue-50/50 p-2 rounded-lg flex items-start justify-between gap-2">
                <div>
                  <strong className="text-slate-800">Why up to 60 trading days (~3 calendar months)?</strong>
                  <p className="mt-0.5 text-slate-600">
                    Free live market feeds (Yahoo Finance / NSE) strictly store granular <strong>5-minute intraday candles</strong> for a maximum of 60 trading days (over 4,500 candles). For periods beyond 60 days (e.g. 6 Months or 1 Year), exchanges only provide 1-Day EOD candles where 5-min ORB breakout and EMA strategies cannot execute.
                  </p>
                </div>
                <button
                  onClick={() => setShowFeedInfo(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Custom Date Pickers */}
            {showCustomPicker && (
              <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-slate-200 text-xs flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    min={allSessionsData[0]?.date}
                    max={allSessionsData[allSessionsData.length - 1]?.date}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      applyFilter('custom', e.target.value, endDate, allSessionsData, selectedInstrument);
                    }}
                    className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    min={allSessionsData[0]?.date}
                    max={allSessionsData[allSessionsData.length - 1]?.date}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      applyFilter('custom', startDate, e.target.value, allSessionsData, selectedInstrument);
                    }}
                    className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 text-xs font-mono"
                  />
                </div>

                <span className="text-[10px] text-slate-400">
                  (Showing {sessionsData.length} sessions)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <h3 className="text-sm font-bold text-slate-800">
              Fetching 4,500+ Real 5-Minute Candles for {selectedInstrument}...
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Calculating 7-Layer Confluence across all historical trading sessions
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadRealBacktestData(selectedInstrument)}
              className="px-3 py-1 rounded bg-rose-600 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Backtest Statistics - 4 Executive Metric Cards */}
        {!isLoading && backtestResult && (
          <div className="space-y-2 sm:space-y-2.5 flex-1 min-h-0 flex flex-col overflow-hidden">

            {/* 4 Executive Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 shrink-0">

              {/* Stat 1: Total Trades */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Total Sessions
                </span>
                <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 mt-0.5">
                  <span className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-800 whitespace-nowrap">
                    {backtestResult.totalTrades}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    (1 trade/day)
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] text-slate-400 truncate block mt-0.5">
                  High-probability setups
                </span>
              </div>

              {/* Stat 2: Win Rate */}
              <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs">
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-wider block truncate">
                  Win Rate (Accuracy)
                </span>
                <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 mt-0.5">
                  <span className="text-sm sm:text-base md:text-lg font-bold font-mono text-emerald-600 whitespace-nowrap">
                    {backtestResult.winRate}%
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-emerald-700 font-bold bg-emerald-100/70 border border-emerald-200/80 px-1.5 py-0.2 rounded whitespace-nowrap">
                    {backtestResult.winningTrades}W / {backtestResult.losingTrades}L
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] text-emerald-600/80 truncate block mt-0.5">
                  7-Layer Confluence
                </span>
              </div>

              {/* Stat 3: Net Profit */}
              <div className={`border rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs ${
                backtestResult.netPnl >= 0 ? 'bg-emerald-50/40 border-emerald-200/70' : 'bg-rose-50/40 border-rose-200/70'
              }`}>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                  Net P&L (1 Lot • {lotQty} Qty)
                </span>
                <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 mt-0.5">
                  <span className={`text-sm sm:text-base md:text-lg font-bold font-mono whitespace-nowrap ${
                    backtestResult.netPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {backtestResult.netPnl >= 0 ? '+' : ''}₹{backtestResult.netPnl.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold bg-white/80 border border-slate-200 px-1 py-0.2 rounded whitespace-nowrap">
                    PF: {backtestResult.profitFactor}
                  </span>
                </div>
                {backtestResult.totalCharges > 0 && (
                  <span className="text-[8px] sm:text-[9px] text-slate-500 truncate block mt-0.5">
                    In-Hand: <strong className="text-emerald-600 font-bold">₹{backtestResult.netTakeHomePnl?.toLocaleString('en-IN')}</strong> (post ~₹{backtestResult.totalCharges} tax)
                  </span>
                )}
              </div>

              {/* Stat 4: Max Drawdown */}
              <div className="bg-rose-50/30 border border-rose-200/60 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs">
                <span className="text-[9px] sm:text-[10px] font-bold text-rose-700 uppercase tracking-wider block truncate">
                  Max Drawdown (Risk)
                </span>
                <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 mt-0.5">
                  <span className="text-sm sm:text-base md:text-lg font-bold font-mono text-rose-600 whitespace-nowrap">
                    -₹{backtestResult.maxDrawdown.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-rose-700 font-bold bg-rose-100/70 border border-rose-200/80 px-1.5 py-0.2 rounded whitespace-nowrap">
                    14% SL
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] text-slate-400 truncate block mt-0.5">
                  Institutional R:R: <strong className="text-slate-600">1:1.3</strong>
                </span>
              </div>

            </div>

            {/* Day-by-Day Historical Trades Table with "Replay on Chart" button */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5 shrink-0">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Historical Day Trades ({getTitle()}) • {selectedInstrument}
                </h3>
                <span className="text-[10px] sm:text-[11px] text-slate-400">
                  Click <strong>"Replay Day"</strong> for chart
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto flex-1 min-h-0 overflow-y-auto shadow-2xs">
                <table className="w-full text-xs text-left min-w-[620px]">
                  <thead className="bg-slate-50/95 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold sticky top-0 backdrop-blur-xs">
                    <tr>
                      <th className="py-2 px-2.5 sm:py-2.5 sm:px-3">DATE & TIME</th>
                      <th className="py-2 px-2.5 sm:py-2.5 sm:px-3">CONTRACT</th>
                      <th className="py-2 px-2.5 sm:py-2.5 sm:px-3">SPOT</th>
                      <th className="py-2 px-2.5 sm:py-2.5 sm:px-3">ENTRY</th>
                      <th className="py-2 px-2.5 sm:py-2.5 sm:px-3">EXIT</th>
                      <th className="py-2 px-2.5 sm:py-2.5 sm:px-3">P&L ({lotQty} QTY)</th>
                      <th className="py-2 px-2.5 sm:py-2.5 sm:px-3">OUTCOME</th>
                      <th className="py-2 px-2.5 sm:py-2.5 sm:px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {backtestResult.trades.map((trade, idx) => {
                      const isProfit = trade.pnl > 0;
                      return (
                        <tr key={trade.id || `${trade.date}-${trade.time}-${idx}`} className="hover:bg-blue-50/40 transition">
                          <td className="py-2 px-3 text-slate-600 font-sans">
                            <span className="font-semibold block">{trade.date}</span>
                            <span className="text-[10px] text-slate-400">{trade.time}</span>
                          </td>

                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
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
                            <span className={`inline-flex items-center gap-1 ${isProfit ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}`}>
                              {isProfit ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : null}
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
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-sans text-[11px] font-semibold transition cursor-pointer shadow-xs active:scale-95"
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
