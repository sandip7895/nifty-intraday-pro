// Technical indicators, CPR, Pivot points & Confluence algorithms for NIFTY 50

export function calculateCPR(high, low, close) {
  const pivot = (high + low + close) / 3;
  const bc = (high + low) / 2;
  const tc = (pivot - bc) + pivot;
  
  const r1 = (2 * pivot) - low;
  const s1 = (2 * pivot) - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  
  const cprWidth = Math.abs(tc - bc);
  const cprType = cprWidth < 25 ? 'Narrow CPR (Trending Day High Probability)' : 
                   cprWidth > 55 ? 'Wide CPR (Sideways/Rangebound Expected)' : 
                   'Average CPR (Standard Day)';

  return {
    pivot: Number(pivot.toFixed(2)),
    bc: Number(bc.toFixed(2)),
    tc: Number(tc.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    cprWidth: Number(cprWidth.toFixed(2)),
    cprType
  };
}

export function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const emaArray = [];
  let ema = data[0].close;
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      emaArray.push({ time: data[i].time, value: ema });
    } else {
      ema = (data[i].close * k) + (ema * (1 - k));
      emaArray.push({ time: data[i].time, value: Number(ema.toFixed(2)) });
    }
  }
  return emaArray;
}

export function calculateVWAP(data) {
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;
  const vwapArray = [];

  for (let i = 0; i < data.length; i++) {
    const candle = data[i];
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const vol = candle.volume || 1000;
    
    cumulativeTypicalPriceVolume += typicalPrice * vol;
    cumulativeVolume += vol;
    
    const vwap = cumulativeTypicalPriceVolume / cumulativeVolume;
    vwapArray.push({ time: candle.time, value: Number(vwap.toFixed(2)) });
  }
  return vwapArray;
}

export function calculateRSI(closes, period = 14) {
  if (closes.length <= period) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(2));
}

// 7-Layer Confluence Evaluator for High Accuracy Nifty 50 Trades
export function evaluateConfluence({
  currentPrice,
  cpr,
  vwap,
  ema9,
  ema21,
  rsi,
  pcr,
  vix,
  heavyweightScore // +5 to -5 based on HDFC, Reliance, etc.
}) {
  const criteria = [];
  let score = 0;
  let maxScore = 7;
  let signalType = 'WAIT'; // 'BUY_CE', 'BUY_PE', 'WAIT'

  // Criterion 1: VWAP Position & Slope
  const isAboveVWAP = currentPrice > vwap;
  if (isAboveVWAP) {
    criteria.push({ name: 'Price above VWAP', status: true, bias: 'BULLISH', detail: `₹${currentPrice} > VWAP ₹${vwap}` });
  } else {
    criteria.push({ name: 'Price below VWAP', status: true, bias: 'BEARISH', detail: `₹${currentPrice} < VWAP ₹${vwap}` });
  }

  // Criterion 2: CPR Position
  const highestCPR = Math.max(cpr.tc, cpr.bc);
  const lowestCPR = Math.min(cpr.tc, cpr.bc);
  if (currentPrice > highestCPR) {
    criteria.push({ name: 'Trading Above CPR', status: true, bias: 'BULLISH', detail: `Above TC (₹${highestCPR})` });
  } else if (currentPrice < lowestCPR) {
    criteria.push({ name: 'Trading Below CPR', status: true, bias: 'BEARISH', detail: `Below BC (₹${lowestCPR})` });
  } else {
    criteria.push({ name: 'Inside CPR (Chop Zone)', status: false, bias: 'NEUTRAL', detail: `Consolidating inside CPR Range` });
  }

  // Criterion 3: EMA 9 & 21 Alignment
  const isEmaBullish = ema9 > ema21;
  if (isEmaBullish) {
    criteria.push({ name: '9 EMA > 21 EMA (Golden Bullish)', status: true, bias: 'BULLISH', detail: `EMA9: ${ema9} > EMA21: ${ema21}` });
  } else {
    criteria.push({ name: '9 EMA < 21 EMA (Death Cross)', status: true, bias: 'BEARISH', detail: `EMA9: ${ema9} < EMA21: ${ema21}` });
  }

  // Criterion 4: RSI Momentum
  if (rsi >= 55 && rsi <= 72) {
    criteria.push({ name: 'RSI Bullish Momentum Zone', status: true, bias: 'BULLISH', detail: `RSI is ${rsi} (Healthy upward momentum)` });
  } else if (rsi <= 45 && rsi >= 28) {
    criteria.push({ name: 'RSI Bearish Breakdown Zone', status: true, bias: 'BEARISH', detail: `RSI is ${rsi} (Aggressive selling pressure)` });
  } else {
    criteria.push({ name: 'RSI Neutral / Extreme', status: false, bias: 'NEUTRAL', detail: `RSI is ${rsi} (Potential reversal risk)` });
  }

  // Criterion 5: PCR Sentiment
  if (pcr >= 1.15) {
    criteria.push({ name: 'Option Chain PCR Bullish', status: true, bias: 'BULLISH', detail: `PCR ${pcr} indicates heavy Put writing (Support)` });
  } else if (pcr <= 0.85) {
    criteria.push({ name: 'Option Chain PCR Bearish', status: true, bias: 'BEARISH', detail: `PCR ${pcr} indicates heavy Call writing (Resistance)` });
  } else {
    criteria.push({ name: 'PCR Neutral Range', status: false, bias: 'NEUTRAL', detail: `PCR ${pcr} indicates balanced market` });
  }

  // Criterion 6: Heavyweights Sync (HDFC Bank, Reliance, etc.)
  if (heavyweightScore >= 2) {
    criteria.push({ name: 'Key Heavyweights in Rally Mode', status: true, bias: 'BULLISH', detail: `HDFC Bank & Reliance pulling NIFTY up` });
  } else if (heavyweightScore <= -2) {
    criteria.push({ name: 'Key Heavyweights Dragging Down', status: true, bias: 'BEARISH', detail: `Top constituents experiencing selloff` });
  } else {
    criteria.push({ name: 'Heavyweights Divergent', status: false, bias: 'NEUTRAL', detail: `Mixed sector performance` });
  }

  // Criterion 7: Volatility (VIX) Environment
  if (vix >= 11.5 && vix <= 17.5) {
    criteria.push({ name: 'Ideal India VIX Intraday Range', status: true, bias: 'FAVORABLE', detail: `VIX ${vix} is optimal for option buying moves` });
  } else {
    criteria.push({ name: 'VIX Out of Sweet Spot', status: false, bias: 'NEUTRAL', detail: `VIX ${vix} (Premium decay or abnormal spike risk)` });
  }

  // Calculate Overall Confluence
  const bullishCount = criteria.filter(c => c.bias === 'BULLISH').length;
  const bearishCount = criteria.filter(c => c.bias === 'BEARISH').length;
  const favorableVix = criteria.find(c => c.name.includes('India VIX'))?.status;

  let accuracyPercentage = 0;
  if (bullishCount >= 5 && favorableVix) {
    signalType = 'BUY_CE';
    accuracyPercentage = Math.round((bullishCount / 6) * 92);
  } else if (bearishCount >= 5 && favorableVix) {
    signalType = 'BUY_PE';
    accuracyPercentage = Math.round((bearishCount / 6) * 92);
  } else {
    signalType = 'WAIT';
    accuracyPercentage = Math.max(bullishCount, bearishCount) * 12 + 25;
  }

  return {
    signalType,
    accuracyPercentage,
    bullishCount,
    bearishCount,
    criteria
  };
}
