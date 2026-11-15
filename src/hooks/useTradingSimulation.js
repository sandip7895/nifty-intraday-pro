import { useState, useEffect, useCallback } from 'react';
import {
  calculateCPR,
  calculateEMA,
  calculateVWAP
} from '../data/tradingLogic';
import {
  INSTRUMENTS,
  fetchLatestSession
} from '../services/marketDataService';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paperBalance, setPaperBalance] = useState(100000);
  const [positions, setPositions] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);

  const currentConfig = INSTRUMENTS[instrument] || INSTRUMENTS.NIFTY;

  // Fetch real market session for the selected instrument
  const loadRealMarketData = useCallback(async (targetInstrument = instrument) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchLatestSession(targetInstrument);
      if (data && data.candles && data.candles.length > 0) {
        setCandles(data.candles);
        setPrevDay(data.prevDay);
        setConfirmedTrade(data.confirmedTrade);
      }
    } catch (err) {
      console.error(`Error fetching real market data for ${targetInstrument}:`, err);
      setError(err.message || 'Error loading live market data');
    } finally {
      setIsLoading(false);
    }
  }, [instrument]);

  // Switch between NIFTY 50 and BSE SENSEX
  const selectInstrument = useCallback((newInstrument) => {
    if (newInstrument === instrument) return;
    setInstrument(newInstrument);
    setCandles([]);
    setConfirmedTrade(null);
    loadRealMarketData(newInstrument);
  }, [instrument, loadRealMarketData]);

  // Fetch on mount or when instrument changes
  useEffect(() => {
    loadRealMarketData(instrument);

    const interval = setInterval(() => {
      const open = checkIsMarketOpen();
      setIsMarketOpen(open);
      if (open) {
        loadRealMarketData(instrument);
      }
    }, 20000); // 20s refresh

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
    strikeName: `${currentConfig.shortName} ${Math.round(currentPrice / currentConfig.strikeStep) * currentConfig.strikeStep} CE`,
    instrument: currentConfig.id,
    lotSize: currentConfig.lotSize,
    spotTrigger: currentPrice,
    optionEntry: currentConfig.defaultCeEntry,
    optionSl: Number((currentConfig.defaultCeEntry * (1 - currentConfig.slPct)).toFixed(1)),
    optionTarget1: Number((currentConfig.defaultCeEntry * (1 + currentConfig.target1Pct)).toFixed(1)),
    optionTarget2: Number((currentConfig.defaultCeEntry * (1 + currentConfig.target2Pct)).toFixed(1)),
    accuracy: 0,
    timestamp: '--'
  };

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

  const resetPaperAccount = () => {
    setPaperBalance(100000);
    setPositions([]);
    setClosedTrades([]);
  };

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
    isLoading,
    error,
    refreshData: () => loadRealMarketData(instrument)
  };
}
