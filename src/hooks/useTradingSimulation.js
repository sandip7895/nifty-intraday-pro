import { useState, useEffect, useCallback } from 'react';
import {
  calculateCPR,
  calculateEMA,
  calculateVWAP,
  calculateRSI
} from '../data/tradingLogic';
import { fetchNiftyLatestSession } from '../services/marketDataService';

// Check if Indian Stock Market (NSE) is open in IST
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
  const [candles, setCandles] = useState([]);
  const [prevDay, setPrevDay] = useState(null);
  const [confirmedTrade, setConfirmedTrade] = useState(null);
  const [isMarketOpen, setIsMarketOpen] = useState(checkIsMarketOpen());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paperBalance, setPaperBalance] = useState(100000);
  const [positions, setPositions] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);

  // Fetch real market session
  const loadRealMarketData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchNiftyLatestSession();
      if (data && data.candles && data.candles.length > 0) {
        setCandles(data.candles);
        setPrevDay(data.prevDay);
        setConfirmedTrade(data.confirmedTrade);
      }
    } catch (err) {
      console.error('Error fetching real market data:', err);
      setError(err.message || 'Error loading live market data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadRealMarketData();

    const interval = setInterval(() => {
      const open = checkIsMarketOpen();
      setIsMarketOpen(open);
      if (open) {
        loadRealMarketData();
      }
    }, 20000); // 20s refresh

    return () => clearInterval(interval);
  }, [loadRealMarketData]);

  // Derived metrics from 100% real candles
  const hasCandles = candles.length > 0;
  const lastCandle = hasCandles ? candles[candles.length - 1] : null;
  const firstCandle = hasCandles ? candles[0] : null;

  const currentPrice = lastCandle ? lastCandle.close : 25144.30;
  const dayOpen = firstCandle ? firstCandle.open : currentPrice;
  const dayHigh = hasCandles ? Math.max(...candles.map(c => c.high)) : currentPrice;
  const dayLow = hasCandles ? Math.min(...candles.map(c => c.low)) : currentPrice;
  const priceChange = hasCandles ? Number((currentPrice - dayOpen).toFixed(2)) : 0;
  const priceChangePercent = (hasCandles && dayOpen > 0) ? Number(((priceChange / dayOpen) * 100).toFixed(2)) : 0;

  // Real CPR calculation
  const cpr = prevDay
    ? calculateCPR(prevDay.high, prevDay.low, prevDay.close)
    : (hasCandles ? calculateCPR(dayHigh, dayLow, currentPrice) : {
      pivot: currentPrice, tc: currentPrice + 15, bc: currentPrice - 15,
      r1: currentPrice + 35, s1: currentPrice - 35, r2: currentPrice + 70, s2: currentPrice - 70,
      cprWidth: 30, cprType: 'Narrow CPR (Trending)'
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
    spotTrigger: confirmedTrade.spotEntry,
    optionEntry: confirmedTrade.entryPrice,
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
  } : {
    action: 'WAIT',
    actionText: 'Awaiting Setup',
    strikeName: `NIFTY ${Math.round(currentPrice / 50) * 50} CE`,
    spotTrigger: currentPrice,
    optionEntry: 135,
    optionSl: 115,
    optionTarget1: 165,
    optionTarget2: 190,
    accuracy: 0,
    timestamp: '--'
  };

  // Paper Trade Execution
  const executePaperTrade = (signal) => {
    if (!signal || signal.action === 'WAIT') return false;

    const qty = 65; // 1 lot NIFTY (Current 2026 NSE Lot Size)
    const requiredMargin = Math.round(signal.optionEntry * qty);

    if (paperBalance < requiredMargin) {
      alert('Insufficient virtual balance! Please reset funds.');
      return false;
    }

    const newPosition = {
      id: 'pos-' + Date.now(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      type: signal.action,
      strike: signal.strikeName,
      qty,
      entryPrice: signal.optionEntry,
      currentPrice: signal.optionEntry,
      spotAtEntry: currentPrice,
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

  const resetPaperAccount = () => {
    setPaperBalance(100000);
    setPositions([]);
    setClosedTrades([]);
  };

  return {
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
    isLoading,
    error,
    refreshData: loadRealMarketData
  };
}
