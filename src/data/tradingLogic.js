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

// Full 14-period Rolling RSI series for each candle
export function calculateRSISeries(closes, period = 14) {
  const rsi = [];
  if (closes.length <= period) return closes.map(() => 50);

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      rsi.push(50);
      continue;
    }
    if (i > period) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
      }
    }
    if (avgLoss === 0) rsi.push(100);
    else {
      const rs = avgGain / avgLoss;
      rsi.push(Number((100 - (100 / (1 + rs))).toFixed(2)));
    }
  }
  return rsi;
}

// Supertrend Indicator (Period 10, Multiplier 3)
export function calculateSupertrend(candles, period = 10, multiplier = 3) {
  const st = [];
  if (!candles || candles.length === 0) return st;

  const tr = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hpc = Math.abs(candles[i].high - candles[i - 1].close);
    const lpc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hpc, lpc));
  }

  let atr = 0;
  for (let i = 0; i < Math.min(period, tr.length); i++) atr += tr[i];
  atr /= Math.min(period, tr.length);

  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend = 1; // 1 = Bullish (Green), -1 = Bearish (Red)

  for (let i = 0; i < candles.length; i++) {
    if (i >= period) {
      atr = (atr * (period - 1) + tr[i]) / period;
    }
    const c = candles[i];
    const hl2 = (c.high + c.low) / 2;
    const basicUpper = hl2 + multiplier * atr;
    const basicLower = hl2 - multiplier * atr;

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (i > 0) {
      const prevClose = candles[i - 1].close;
      finalUpper = (basicUpper < prevUpper || prevClose > prevUpper) ? basicUpper : prevUpper;
      finalLower = (basicLower > prevLower || prevClose < prevLower) ? basicLower : prevLower;
    }

    let trend = prevTrend;
    if (i > 0) {
      if (prevTrend === -1 && c.close > prevUpper) {
        trend = 1;
      } else if (prevTrend === 1 && c.close < prevLower) {
        trend = -1;
      }
    } else {
      trend = c.close >= hl2 ? 1 : -1;
    }

    st.push({
      time: c.time,
      trend, // 1: Bullish Green, -1: Bearish Red
      value: Number((trend === 1 ? finalLower : finalUpper).toFixed(2))
    });

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevTrend = trend;
  }
  return st;
}

// ADX Indicator (14 period) with +DI, -DI and DX
export function calculateADXSeries(candles, period = 14) {
  const adxArr = [];
  if (!candles || candles.length < period) return (candles || []).map(c => ({ time: c.time, adx: 20 }));

  const tr = [];
  const plusDM = [];
  const minusDM = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[0].high - candles[0].low);
      plusDM.push(0);
      minusDM.push(0);
      continue;
    }
    const cur = candles[i];
    const prev = candles[i - 1];

    const hl = cur.high - cur.low;
    const hpc = Math.abs(cur.high - prev.close);
    const lpc = Math.abs(cur.low - prev.close);
    tr.push(Math.max(hl, hpc, lpc));

    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  let smoothTR = 0, smoothPlusDM = 0, smoothMinusDM = 0;
  for (let i = 0; i < period; i++) {
    smoothTR += tr[i];
    smoothPlusDM += plusDM[i];
    smoothMinusDM += minusDM[i];
  }

  const dxList = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      adxArr.push({ time: candles[i].time, adx: 20 });
      continue;
    }
    smoothTR = smoothTR - (smoothTR / period) + tr[i];
    smoothPlusDM = smoothPlusDM - (smoothPlusDM / period) + plusDM[i];
    smoothMinusDM = smoothMinusDM - (smoothMinusDM / period) + minusDM[i];

    const plusDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const minusDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    dxList.push(dx);

    if (dxList.length < period) {
      adxArr.push({ time: candles[i].time, adx: Number(dx.toFixed(2)) });
    } else if (dxList.length === period) {
      let sum = 0;
      for (let k = 0; k < period; k++) sum += dxList[k];
      adxArr.push({ time: candles[i].time, adx: Number((sum / period).toFixed(2)) });
    } else {
      const prevADX = adxArr[adxArr.length - 1].adx;
      const curADX = (prevADX * (period - 1) + dx) / period;
      adxArr.push({ time: candles[i].time, adx: Number(curADX.toFixed(2)) });
    }
  }
  return adxArr;
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
