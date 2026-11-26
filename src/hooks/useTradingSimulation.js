import { useState, useEffect, useCallback, useRef } from 'react';
import {
  calculateCPR,
  calculateEMA,
  calculateVWAP
} from '../data/tradingLogic';
import {
  INSTRUMENTS,
  fetchLatestSession,
  updateLockedTradeStatus,
  calculateDynamicOptionPremium
} from '../services/marketDataService';
import {
  playSignalChime,
  playTargetChime,
  playSlChime
} from '../services/audioService';

// Helper to safely read/write locked live signal per (instrument, date) so live signals NEVER flicker/disappear
function getLockedLiveSignal(instrumentKey, dateKey) {
  if (typeof window === 'undefined' || !dateKey) return null;
  try {
    const raw = localStorage.getItem(`nifty_pro_locked_sig_${instrumentKey}_${dateKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLockedLiveSignal(instrumentKey, dateKey, trade) {
  if (typeof window === 'undefined' || !dateKey || !trade) return;
  try {
    localStorage.setItem(`nifty_pro_locked_sig_${instrumentKey}_${dateKey}`, JSON.stringify(trade));
  } catch {
    // ignore storage errors
  }
}

// Check if Indian Stock Market (NSE / BSE) is open in IST
export function checkIsMarketOpen() {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istString);

  const day = istDate.getDay();
  if (day === 0 || day === 6) return false; // Saturday / Sunday

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMins = hours * 60 + minutes;

  const marketOpenMins = 9 * 60 + 15; // 09:15 AM IST
  const marketCloseMins = 15 * 60 + 30; // 03:30 PM IST

  return totalMins >= marketOpenMins && totalMins <= marketCloseMins;
}

export function useTradingSimulation() {
  const [instrument, setInstrument] = useState('NIFTY'); // 'NIFTY' | 'SENSEX'
  const [candles, setCandles] = useState([]);
  const [prevDay, setPrevDay] = useState(null);
  const [confirmedTrade, setConfirmedTrade] = useState(null);
  const [isMarketOpen, setIsMarketOpen] = useState(checkIsMarketOpen());
  const [isFeedDelayed, setIsFeedDelayed] = useState(false);
  const [sessionDisplayDate, setSessionDisplayDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paper Trading State with LocalStorage Persistence across Page Refresh
  const [paperBalance, setPaperBalance] = useState(() => {
    if (typeof window === 'undefined') return 100000;
    try {
      const saved = localStorage.getItem('nifty_pro_paper_balance');
      return saved !== null && !isNaN(Number(saved)) ? Number(saved) : 100000;
    } catch {
      return 100000;
    }
  });

  const [positions, setPositions] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('nifty_pro_paper_positions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [closedTrades, setClosedTrades] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('nifty_pro_paper_closed_trades');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Automatically sync paper trade changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('nifty_pro_paper_balance', String(paperBalance));
    } catch (e) {
      console.error('Failed to save paper balance:', e);
    }
  }, [paperBalance]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('nifty_pro_paper_positions', JSON.stringify(positions));
    } catch (e) {
      console.error('Failed to save paper positions:', e);
    }
  }, [positions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('nifty_pro_paper_closed_trades', JSON.stringify(closedTrades));
    } catch (e) {
      console.error('Failed to save paper closed trades:', e);
    }
  }, [closedTrades]);

  const currentConfig = INSTRUMENTS[instrument] || INSTRUMENTS.NIFTY;
  const activeInstrumentRef = useRef(instrument);
  const lastOutcomeRef = useRef({}); // Track per-signal status so Target/SL chime fires ONCE live

  // Fetch real market session for the selected instrument
  const loadRealMarketData = useCallback(async (targetInstrument = instrument, silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setError(null);
      const data = await fetchLatestSession(targetInstrument);

      // Guard against stale async responses if user switched instrument mid-request
      if (activeInstrumentRef.current !== targetInstrument) return;

      if (data && data.candles && data.candles.length > 0) {
        setCandles(data.candles);
        setPrevDay(data.prevDay);
        setIsFeedDelayed(Boolean(data.isFeedDelayed));
        setSessionDisplayDate(data.sessionDisplayDate || '');

        let finalTrade = data.confirmedTrade;

        if (data.isLiveSession) {
          // LIVE SESSION LOCKING: Once a signal fires in live market, lock it for the day
          // so it NEVER flickers, disappears, or repaints on subsequent polls!
          const existingLocked = getLockedLiveSignal(targetInstrument, data.latestDate);
          if (existingLocked) {
            const updatedLocked = updateLockedTradeStatus(
              existingLocked,
              data.candles,
              data.regularMarketPrice,
              targetInstrument
            );
            // Fire audio chime if trade just transitioned live from OPEN -> TARGET_HIT or SL_HIT
            const lockKey = `${targetInstrument}_${data.latestDate}`;
            if (existingLocked.status === 'OPEN' && updatedLocked.status === 'TARGET_HIT' && lastOutcomeRef.current[lockKey] !== 'TARGET_HIT') {
              playTargetChime();
              lastOutcomeRef.current[lockKey] = 'TARGET_HIT';
            } else if (existingLocked.status === 'OPEN' && updatedLocked.status === 'SL_HIT' && lastOutcomeRef.current[lockKey] !== 'SL_HIT') {
              playSlChime();
              lastOutcomeRef.current[lockKey] = 'SL_HIT';
            }
            saveLockedLiveSignal(targetInstrument, data.latestDate, updatedLocked);
            finalTrade = updatedLocked;
          } else if (data.confirmedTrade) {
            // First time signal triggers live today -> Lock it immediately & chime!
            saveLockedLiveSignal(targetInstrument, data.latestDate, data.confirmedTrade);
            playSignalChime();
            finalTrade = data.confirmedTrade;
          }
        }

        setConfirmedTrade(finalTrade);
      }
    } catch (err) {
      console.error(`Error fetching real market data for ${targetInstrument}:`, err);
      setError(err.message || 'Error loading live market data');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [instrument]);

  // Switch between NIFTY 50 and BSE SENSEX
  const selectInstrument = useCallback((newInstrument) => {
    if (newInstrument === instrument) return;
    activeInstrumentRef.current = newInstrument;
    setInstrument(newInstrument);
    setCandles([]);
    setConfirmedTrade(null);
  }, [instrument]);

  // Fetch on mount or when instrument changes + 10s live market polling
  useEffect(() => {
    activeInstrumentRef.current = instrument;
    loadRealMarketData(instrument, false);

    const interval = setInterval(() => {
      const open = checkIsMarketOpen();
      setIsMarketOpen(open);
      if (open) {
        loadRealMarketData(instrument, true);
      }
    }, 10000); // 10s fast live refresh

    return () => clearInterval(interval);
  }, [instrument, loadRealMarketData]);

  // Derived metrics from 100% real candles
  const hasCandles = candles.length > 0;
  const lastCandle = hasCandles ? candles[candles.length - 1] : null;
  const firstCandle = hasCandles ? candles[0] : null;

  const currentPrice = lastCandle ? lastCandle.close : currentConfig.defaultPrice;
  const dayOpen = firstCandle ? firstCandle.open : currentPrice;
  const dayHigh = hasCandles ? Math.max(...candles.map(c => c.high)) : currentPrice;
  const dayLow = hasCandles ? Math.min(...candles.map(c => c.low)) : currentPrice;
  const priceChange = hasCandles ? Number((currentPrice - dayOpen).toFixed(2)) : 0;
  const priceChangePercent = (hasCandles && dayOpen > 0) ? Number(((priceChange / dayOpen) * 100).toFixed(2)) : 0;

  // Real CPR calculation
  const cpr = prevDay
    ? calculateCPR(prevDay.high, prevDay.low, prevDay.close)
    : (hasCandles ? calculateCPR(dayHigh, dayLow, currentPrice) : {
      pivot: currentPrice,
      tc: currentPrice + (instrument === 'SENSEX' ? 45 : 15),
      bc: currentPrice - (instrument === 'SENSEX' ? 45 : 15),
      r1: currentPrice + (instrument === 'SENSEX' ? 100 : 35),
      s1: currentPrice - (instrument === 'SENSEX' ? 100 : 35),
      r2: currentPrice + (instrument === 'SENSEX' ? 200 : 70),
      s2: currentPrice - (instrument === 'SENSEX' ? 200 : 70),
      cprWidth: instrument === 'SENSEX' ? 90 : 30,
      cprType: 'Narrow CPR (Trending)'
    });

  // Real Technical Indicators
  const vwapSeries = hasCandles ? calculateVWAP(candles) : [];
  const currentVWAP = vwapSeries.length > 0 ? vwapSeries[vwapSeries.length - 1].value : currentPrice;
  const ema9Series = hasCandles ? calculateEMA(candles, 9) : [];
  const ema21Series = hasCandles ? calculateEMA(candles, 21) : [];
  const currentEma9 = ema9Series.length > 0 ? ema9Series[ema9Series.length - 1].value : currentPrice;
  const currentEma21 = ema21Series.length > 0 ? ema21Series[ema21Series.length - 1].value : currentPrice;

  // Active Signal synchronizes 100% with confirmedTrade
  const activeSignal = confirmedTrade ? {
    action: confirmedTrade.type,
    actionText: confirmedTrade.type === 'BUY_CE' ? 'BUY CALL (BULLISH)' : 'BUY PUT (BEARISH)',
    strikeName: confirmedTrade.strike,
    instrument: confirmedTrade.instrument || currentConfig.id,
    lotSize: confirmedTrade.lotSize || currentConfig.lotSize,
    spotTrigger: confirmedTrade.spotEntry,
    optionEntry: confirmedTrade.entryPrice,
    currentOptPrice: confirmedTrade.currentOptPrice || confirmedTrade.exitPrice || confirmedTrade.entryPrice,
    optionSl: confirmedTrade.sl,
    optionTarget1: confirmedTrade.target1,
    optionTarget2: confirmedTrade.target2,
    accuracy: confirmedTrade.accuracy || 88,
    timestamp: confirmedTrade.time,
    result: confirmedTrade.result,
    status: confirmedTrade.status,
    entryCandleIndex: confirmedTrade.entryCandleIndex,
    exitCandleIndex: confirmedTrade.exitCandleIndex,
    exitPrice: confirmedTrade.exitPrice,
    pnl: confirmedTrade.pnl
  } : (() => {
    const waitAtmStrike = Math.round(currentPrice / currentConfig.strikeStep) * currentConfig.strikeStep;
    const nowSec = Math.floor(Date.now() / 1000);
    const dynamicWaitEntry = calculateDynamicOptionPremium(
      currentPrice,
      waitAtmStrike,
      'BUY_CE',
      nowSec,
      instrument
    );
    return {
      action: 'WAIT',
      actionText: 'Awaiting Setup',
      strikeName: `${currentConfig.shortName} ${waitAtmStrike} CE`,
      instrument: currentConfig.id,
      lotSize: currentConfig.lotSize,
      spotTrigger: currentPrice,
      optionEntry: dynamicWaitEntry,
      currentOptPrice: dynamicWaitEntry,
      optionSl: Number((dynamicWaitEntry * (1 - currentConfig.slPct)).toFixed(1)),
      optionTarget1: Number((dynamicWaitEntry * (1 + currentConfig.target1Pct)).toFixed(1)),
      optionTarget2: Number((dynamicWaitEntry * (1 + currentConfig.target2Pct)).toFixed(1)),
      accuracy: 0,
      timestamp: '--'
    };
  })();

  // Audio alert chime when a new non-locked signal appears
  const lastSignalRef = useRef(null);
  useEffect(() => {
    if (activeSignal && activeSignal.action !== 'WAIT' && activeSignal.strikeName) {
      const sigKey = `${activeSignal.instrument}_${activeSignal.strikeName}_${activeSignal.timestamp}`;
      if (lastSignalRef.current && lastSignalRef.current !== sigKey) {
        playSignalChime();
      }
      lastSignalRef.current = sigKey;
    }
  }, [activeSignal?.instrument, activeSignal?.strikeName, activeSignal?.timestamp, activeSignal?.action]);

  // Paper Trade Execution
  const executePaperTrade = (signal) => {
    if (!signal || signal.action === 'WAIT') return false;

    const qty = signal.lotSize || currentConfig.lotSize;
    const requiredMargin = Math.round(signal.optionEntry * qty);

    if (paperBalance < requiredMargin) {
      alert(`Insufficient virtual balance! Required: ₹${requiredMargin.toLocaleString('en-IN')}. Please reset funds.`);
      return false;
    }

    const newPosition = {
      id: 'pos-' + Date.now(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      type: signal.action,
      strike: signal.strikeName,
      instrument: signal.instrument || currentConfig.id,
      qty,
      entryPrice: signal.optionEntry,
      currentPrice: signal.optionEntry,
      spotAtEntry: (hasCandles && currentPrice) ? currentPrice : (signal.spotTrigger || currentConfig.defaultPrice),
      sl: signal.optionSl,
      target1: signal.optionTarget1,
      target2: signal.optionTarget2,
      pnl: 0,
      pnlPercent: 0
    };

    setPaperBalance(prev => prev - requiredMargin);
    setPositions(prev => [newPosition, ...prev]);
    return true;
  };

  // Live P&L tracking and Auto Target 1 / SL Exit for open paper trade positions
  useEffect(() => {
    // CRITICAL GUARD: Never evaluate live P&L or auto-exits during initial loading or before real candles are fetched.
    // This prevents dummy initial fallback prices from triggering a false premature Stop Loss on page refresh!
    if (positions.length === 0 || !hasCandles || isLoading || !currentPrice) return;

    let hasExits = false;
    const remainingPositions = [];
    const newClosed = [];
    let fundToAdd = 0;

    positions.forEach(pos => {
      const isCe = pos.type === 'BUY_CE';
      const spotDelta = isCe ? (currentPrice - pos.spotAtEntry) : (pos.spotAtEntry - currentPrice);
      const posDelta = pos.instrument === 'SENSEX' ? 0.50 : 0.52;
      const liveOptPrice = Number(Math.max(1, pos.entryPrice + spotDelta * posDelta).toFixed(1));
      const livePnl = Number(((liveOptPrice - pos.entryPrice) * pos.qty).toFixed(2));
      const livePnlPct = Number((((liveOptPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(1));

      // Auto Target 1 Exit
      if (liveOptPrice >= pos.target1) {
        hasExits = true;
        fundToAdd += pos.target1 * pos.qty;
        playTargetChime();
        newClosed.push({
          id: 'closed-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: pos.type,
          strike: pos.strike,
          instrument: pos.instrument,
          qty: pos.qty,
          entryPrice: pos.entryPrice,
          exitPrice: pos.target1,
          pnl: Number(((pos.target1 - pos.entryPrice) * pos.qty).toFixed(2)),
          reason: '🎯 Target 1 Auto-Booked (+18%)',
          status: 'PROFIT'
        });
      }
      // Auto Stop Loss Exit
      else if (liveOptPrice <= pos.sl) {
        hasExits = true;
        fundToAdd += pos.sl * pos.qty;
        playSlChime();
        newClosed.push({
          id: 'closed-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: pos.type,
          strike: pos.strike,
          instrument: pos.instrument,
          qty: pos.qty,
          entryPrice: pos.entryPrice,
          exitPrice: pos.sl,
          pnl: Number(((pos.sl - pos.entryPrice) * pos.qty).toFixed(2)),
          reason: '🛑 Stop Loss Auto-Cut (-14%)',
          status: 'LOSS'
        });
      }
      // Position still active - update live price & PnL
      else {
        remainingPositions.push({
          ...pos,
          currentPrice: liveOptPrice,
          pnl: livePnl,
          pnlPercent: livePnlPct
        });
      }
    });

    if (hasExits) {
      if (fundToAdd > 0) setPaperBalance(b => b + fundToAdd);
      setClosedTrades(closed => [...newClosed, ...closed]);
      setPositions(remainingPositions);
    } else {
      const changed = positions.some((p, idx) => {
        const updated = remainingPositions[idx];
        return updated && (p.currentPrice !== updated.currentPrice || p.pnl !== updated.pnl);
      });
      if (changed) {
        setPositions(remainingPositions);
      }
    }
  }, [currentPrice, currentConfig.delta]);

  const closePositionManually = (positionId) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    const returnFund = pos.currentPrice * pos.qty;
    setPaperBalance(b => b + returnFund);

    setClosedTrades(closed => [
      {
        id: 'closed-' + Date.now(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type: pos.type,
        strike: pos.strike,
        instrument: pos.instrument,
        qty: pos.qty,
        entryPrice: pos.entryPrice,
        exitPrice: pos.currentPrice,
        pnl: pos.pnl,
        reason: 'Manual Exit by Trader',
        status: pos.pnl >= 0 ? 'PROFIT' : 'LOSS'
      },
      ...closed
    ]);

    setPositions(prev => prev.filter(p => p.id !== positionId));
  };

  const resetPaperAccount = useCallback(() => {
    setPaperBalance(100000);
    setPositions([]);
    setClosedTrades([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nifty_pro_paper_balance', '100000');
        localStorage.removeItem('nifty_pro_paper_positions');
        localStorage.removeItem('nifty_pro_paper_closed_trades');
      } catch (e) {
        console.error('Failed to clear paper storage:', e);
      }
    }
  }, []);

  return {
    instrument,
    instrumentConfig: currentConfig,
    selectInstrument,
    candles,
    hasCandles,
    currentPrice,
    dayOpen,
    dayHigh,
    dayLow,
    priceChange,
    priceChangePercent,
    cpr,
    currentVWAP,
    currentEma9,
    currentEma21,
    activeSignal,
    paperBalance,
    positions,
    closedTrades,
    executePaperTrade,
    closePositionManually,
    resetPaperAccount,
    isMarketOpen,
    isFeedDelayed,
    sessionDisplayDate,
    isLoading,
    error,
    refreshData: () => loadRealMarketData(instrument)
  };
}
