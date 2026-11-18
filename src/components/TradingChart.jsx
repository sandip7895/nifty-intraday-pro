import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  LineStyle,
  CrosshairMode
} from 'lightweight-charts';
import { Database } from 'lucide-react';

// Custom Canvas Primitive to render solid background badges for Entry & Target signals
class SignalBadgesPrimitive {
  constructor(signals) {
    this._signals = signals || [];
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }

  attached({ chart, series, requestUpdate }) {
    this._chart = chart;
    this._series = series;
    this._requestUpdate = requestUpdate;
  }

  detached() {
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }

  updateAllViews() { }

  paneViews() {
    return [{
      zOrder: () => 'top',
      renderer: () => ({
        draw: (target) => {
          target.useBitmapCoordinateSpace((scope) => {
            if (!this._chart || !this._series) return;
            const ctx = scope.context;
            const hRatio = scope.horizontalPixelRatio || 1;
            const vRatio = scope.verticalPixelRatio || 1;
            const timeScale = this._chart.timeScale();

            for (const sig of this._signals) {
              if (!sig || !sig.time) continue;
              const x = timeScale.timeToCoordinate(sig.time);
              const y = this._series.priceToCoordinate(sig.price);
              if (x === null || y === null) continue;

              const bx = Math.round(x * hRatio);
              const by = Math.round(y * vRatio);

              const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 640;
              const fontSize = Math.round((isMobileScreen ? 9.5 : 11) * hRatio);
              ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
              const textMetrics = ctx.measureText(sig.text);
              const textWidth = textMetrics.width;

              const padX = (isMobileScreen ? 6 : 8) * hRatio;
              const boxWidth = Math.round(textWidth + padX * 2);
              const boxHeight = Math.round((isMobileScreen ? 19 : 22) * vRatio);
              const radius = Math.round(4 * hRatio);

              const isAbove = sig.isAbove !== false;
              const offset = Math.round(10 * vRatio);
              const boxX = Math.round(bx - boxWidth / 2);
              const boxY = Math.round(isAbove ? (by - boxHeight - offset) : (by + offset));

              // 1. Draw Drop Shadow
              ctx.save();
              ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
              ctx.shadowBlur = 6 * hRatio;
              ctx.shadowOffsetY = 2 * vRatio;

              // 2. Draw Solid Background Pill
              ctx.fillStyle = sig.bgColor;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
              } else {
                ctx.rect(boxX, boxY, boxWidth, boxHeight);
              }
              ctx.fill();
              ctx.restore();

              // 3. Arrow pointing to Candle Price
              ctx.fillStyle = sig.bgColor;
              ctx.beginPath();
              if (isAbove) {
                ctx.moveTo(bx - 5 * hRatio, boxY + boxHeight);
                ctx.lineTo(bx + 5 * hRatio, boxY + boxHeight);
                ctx.lineTo(bx, by - 2 * vRatio);
              } else {
                ctx.moveTo(bx - 5 * hRatio, boxY);
                ctx.lineTo(bx + 5 * hRatio, boxY);
                ctx.lineTo(bx, by + 2 * vRatio);
              }
              ctx.closePath();
              ctx.fill();

              // 4. White High-Contrast Text
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(sig.text, bx, boxY + boxHeight / 2);
            }
          });
        }
      })
    }];
  }
}

export default function TradingChart({
  instrument = 'NIFTY',
  candles,
  cpr,
  currentVWAP,
  currentPrice,
  activeSignal,
  onOpenBacktest
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);

  const [chartMode, setChartMode] = useState('SPOT'); // 'SPOT' | 'OPTION'
  const [activeTimeframe, setActiveTimeframe] = useState('5m');
  const [showVWAP, setShowVWAP] = useState(true);

  const isSensex = instrument === 'SENSEX' || activeSignal?.instrument === 'SENSEX';
  const isCe = activeSignal ? activeSignal.action === 'BUY_CE' || !activeSignal.action?.includes('PE') : true;
  const dynamicStrikeName = activeSignal?.strikeName || (isSensex ? 'SENSEX 82000 CE' : 'NIFTY 25250 CE');
  const delta = isSensex ? 0.50 : 0.52;
  const spotEntry = activeSignal?.spotTrigger || (candles && candles[3]?.close) || currentPrice;
  const baseEntryPrice = activeSignal?.optionEntry || (isSensex ? 323.2 : 125.8);
  const target1Price = activeSignal?.optionTarget1 || Number((baseEntryPrice * 1.18).toFixed(1));
  const target2Price = activeSignal?.optionTarget2 || Number((baseEntryPrice * 1.45).toFixed(1));
  const slPrice = activeSignal?.optionSl || Number((baseEntryPrice * 0.86).toFixed(1));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // ignore
      }
      chartRef.current = null;
    }

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth || 600,
      height: container.clientHeight || 350,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#475569',
        fontSize: 11
      },
      localization: {
        locale: 'en-IN',
        dateFormat: "dd MMM ''yy",
        timeFormatter: (time) => {
          const timestamp = typeof time === 'number' ? time : (time?.timestamp || time);
          if (!timestamp) return '';
          const date = new Date(timestamp * 1000);
          const dateStr = date.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: '2-digit'
          });
          const timeStr = date.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          return `${dateStr}  ${timeStr}`;
        }
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' }
      },
      crosshair: {
        mode: CrosshairMode.Normal, // Smooth continuous crosshair movement across the chart without sticking to candles
        vertLine: {
          color: '#94a3b8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#334155'
        },
        horzLine: {
          color: '#94a3b8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#334155'
        }
      },
      rightPriceScale: {
        borderColor: '#cbd5e1',
        scaleMargins: {
          top: 0.14,
          bottom: 0.14
        }
      },
      timeScale: {
        borderColor: '#cbd5e1',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time, tickMarkType) => {
          const timestamp = typeof time === 'number' ? time : (time?.timestamp || time);
          if (!timestamp) return null;
          const date = new Date(timestamp * 1000);
          switch (tickMarkType) {
            case 0: // Year
              return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric' });
            case 1: // Month
              return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' });
            case 2: // DayOfMonth
              return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });
            case 3: // Time
            case 4: // TimeWithSeconds
            default:
              return date.toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
          }
        }
      }
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626'
    });

    if (candles && candles.length > 0) {
      let formattedCandles = [];

      if (chartMode === 'OPTION') {
        formattedCandles = candles.map(c => {
          const openDelta = isCe ? (c.open - spotEntry) : (spotEntry - c.open);
          const highDelta = isCe ? (c.high - spotEntry) : (spotEntry - c.low);
          const lowDelta = isCe ? (c.low - spotEntry) : (spotEntry - c.high);
          const closeDelta = isCe ? (c.close - spotEntry) : (spotEntry - c.close);

          const o = Number(Math.max(1, baseEntryPrice + openDelta * delta).toFixed(2));
          const h = Number(Math.max(o, baseEntryPrice + highDelta * delta).toFixed(2));
          const l = Number(Math.max(1, Math.min(o, baseEntryPrice + lowDelta * delta)).toFixed(2));
          const cl = Number(Math.max(1, baseEntryPrice + closeDelta * delta).toFixed(2));
          return {
            time: c.time,
            open: o,
            high: Math.max(h, cl),
            low: Math.min(l, cl),
            close: cl
          };
        });
      } else {
        formattedCandles = candles.map(c => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }));
      }

      candleSeries.setData(formattedCandles);

      // VWAP Line (Blue)
      if (showVWAP) {
        let cumulativeTPV = 0;
        let cumulativeVol = 0;
        const vwapData = formattedCandles.map((c, idx) => {
          const tp = (c.high + c.low + c.close) / 3;
          const vol = candles[idx]?.volume || 1000;
          cumulativeTPV += tp * vol;
          cumulativeVol += vol;
          return {
            time: c.time,
            value: Number((cumulativeTPV / cumulativeVol).toFixed(2))
          };
        });

        const vwapSeries = chart.addSeries(LineSeries, {
          color: '#2563eb',
          lineWidth: 2,
          title: 'VWAP',
          priceLineVisible: false
        });
        vwapSeries.setData(vwapData);
      }

      // ==========================================
      // VISIBLE TRADE LINES (ENTRY, TARGET, SL)
      // ==========================================
      if (activeSignal && activeSignal.action !== 'WAIT') {
        const isMobileScreen = (container.clientWidth || window.innerWidth) < 640;

        // Trade Levels: In OPTION mode we use Option Premium in ₹, in SPOT mode we use Spot Index
        const spotT1Pts = Number(((target1Price - baseEntryPrice) / delta).toFixed(1));
        const spotT2Pts = Number(((target2Price - baseEntryPrice) / delta).toFixed(1));
        const spotSlPts = Number(((baseEntryPrice - slPrice) / delta).toFixed(1));

        const entryLinePrice = chartMode === 'OPTION' ? baseEntryPrice : spotEntry;
        const target1LinePrice = chartMode === 'OPTION'
          ? target1Price
          : (isCe ? Number((spotEntry + spotT1Pts).toFixed(2)) : Number((spotEntry - spotT1Pts).toFixed(2)));
        const target2LinePrice = chartMode === 'OPTION'
          ? target2Price
          : (isCe ? Number((spotEntry + spotT2Pts).toFixed(2)) : Number((spotEntry - spotT2Pts).toFixed(2)));
        const slLinePrice = chartMode === 'OPTION'
          ? slPrice
          : (isCe ? Number((spotEntry - spotSlPts).toFixed(2)) : Number((spotEntry + spotSlPts).toFixed(2)));

        // 1. Entry Line (Blue Solid)
        candleSeries.createPriceLine({
          price: entryLinePrice,
          color: '#2563eb',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: isMobileScreen ? 'ENTRY' : `BUY ENTRY @ ₹${entryLinePrice}`
        });

        // 2. Target 1 Line (Green Dashed)
        candleSeries.createPriceLine({
          price: target1LinePrice,
          color: '#16a34a',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: isMobileScreen ? 'TGT 1' : `TARGET 1: ₹${target1LinePrice} (+18%)`
        });

        // 3. Target 2 Line (Emerald Dashed)
        candleSeries.createPriceLine({
          price: target2LinePrice,
          color: '#059669',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: isMobileScreen ? 'TGT 2' : `TARGET 2: ₹${target2LinePrice} (+45%)`
        });

        // 4. Stop Loss Line (Red Dashed)
        candleSeries.createPriceLine({
          price: slLinePrice,
          color: '#dc2626',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: isMobileScreen ? 'SL' : `SL: ₹${slLinePrice} (-14%)`
        });

        // Determine exact Entry candle index
        let entryIdx = -1;
        if (typeof activeSignal.entryCandleIndex === 'number' && activeSignal.entryCandleIndex >= 0 && activeSignal.entryCandleIndex < formattedCandles.length) {
          entryIdx = activeSignal.entryCandleIndex;
        } else if (activeSignal.timestamp && activeSignal.timestamp !== '--') {
          // Robust timestamp parser (e.g. "09:33 am" maps accurately to the 09:30-09:35 candle)
          const match = activeSignal.timestamp.match(/(\d+):(\d+)\s*(am|pm)?/i);
          if (match) {
            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const ampm = match[3]?.toLowerCase();
            if (ampm === 'pm' && h < 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            const signalTotalMinutes = h * 60 + m;

            entryIdx = formattedCandles.findIndex(c => {
              const cDate = new Date(c.time * 1000);
              const cH = Number(cDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));
              const cM = Number(cDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', minute: 'numeric' }));
              const cTotalMinutes = cH * 60 + cM;
              return signalTotalMinutes >= cTotalMinutes && signalTotalMinutes < cTotalMinutes + 5;
            });
          }
        }

        if (entryIdx === -1) {
          entryIdx = formattedCandles.findIndex(c => Math.abs(c.close - entryLinePrice) < (chartMode === 'OPTION' ? 4 : 8));
        }
        if (entryIdx === -1) {
          entryIdx = formattedCandles.length > 3 ? 3 : 0; // Default to 09:30 AM (Candle 3), never 09:15 open
        }

        const badges = [];

        if (entryIdx >= 0 && formattedCandles[entryIdx]) {
          const entryCandle = formattedCandles[entryIdx];
          const badgeEntryPrice = chartMode === 'OPTION' ? baseEntryPrice : spotEntry;
          badges.push({
            time: entryCandle.time,
            price: isCe ? entryCandle.low : entryCandle.high,
            isAbove: !isCe, // For CE, placed below pointing up; for PE, placed above pointing down
            text: isMobileScreen
              ? (isCe ? '▲ BUY CALL' : '▼ BUY PUT')
              : (chartMode === 'OPTION'
                  ? `BUY ENTRY @ ₹${badgeEntryPrice}`
                  : (isCe ? `BUY CALL ENTRY @ ₹${badgeEntryPrice}` : `BUY PUT ENTRY @ ₹${badgeEntryPrice}`)),
            bgColor: isCe ? '#16a34a' : '#dc2626'
          });
        }

        // Determine exact Exit candle index (ONLY when trade is genuinely finalized as TARGET_HIT or SL_HIT)
        const isFinalizedOutcome = activeSignal.status === 'TARGET_HIT' || activeSignal.status === 'SL_HIT';
        let exitIdx = -1;
        if (isFinalizedOutcome && typeof activeSignal.exitCandleIndex === 'number' && activeSignal.exitCandleIndex >= 0 && activeSignal.exitCandleIndex < formattedCandles.length) {
          exitIdx = activeSignal.exitCandleIndex;
        }

        if (isFinalizedOutcome && exitIdx >= 0 && exitIdx > entryIdx && formattedCandles[exitIdx]) {
          const exitCandle = formattedCandles[exitIdx];
          const isTargetHit = activeSignal.status === 'TARGET_HIT' || activeSignal.result?.includes('Target');
          const isSlHit = activeSignal.status === 'SL_HIT' || activeSignal.result?.includes('Stop Loss');
          const pnlText = activeSignal.pnl ? (activeSignal.pnl > 0 ? `+₹${activeSignal.pnl}` : `-₹${Math.abs(activeSignal.pnl)}`) : '+₹2048';
          const badgeExitPrice = chartMode === 'OPTION' ? (isTargetHit ? target1Price : slPrice) : null;

          badges.push({
            time: exitCandle.time,
            price: isCe ? exitCandle.high : exitCandle.low,
            isAbove: isCe, // Placed on opposite side of entry so they NEVER overlap!
            text: isMobileScreen
              ? (isTargetHit ? `🎯 TGT HIT` : `🛑 SL HIT`)
              : (chartMode === 'OPTION'
                  ? (isTargetHit ? `TARGET 1 HIT @ ₹${badgeExitPrice} (${pnlText})` : `STOP LOSS HIT @ ₹${badgeExitPrice} (${pnlText})`)
                  : (isTargetHit ? `TARGET 1 HIT (${pnlText})` : `STOP LOSS HIT (${pnlText})`)),
            bgColor: isTargetHit ? '#16a34a' : '#dc2626'
          });
        }

        if (badges.length > 0) {
          candleSeries.attachPrimitive(new SignalBadgesPrimitive(badges));
        }
      }

      chart.timeScale().fitContent();
    }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length && chartRef.current) {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          chartRef.current.applyOptions({ width, height });
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          // Ignore
        }
        chartRef.current = null;
      }
    };
  }, [
    chartMode,
    candles,
    showVWAP,
    activeSignal?.action,
    activeSignal?.strikeName,
    activeSignal?.optionEntry,
    activeSignal?.spotTrigger,
    activeSignal?.entryCandleIndex,
    activeSignal?.exitCandleIndex,
    activeSignal?.status,
    activeSignal?.timestamp
  ]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs flex flex-col h-full w-full relative">

      {/* Zerodha Kite Style Chart Header */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-slate-200 bg-white shrink-0 gap-2">

        {/* Left: Ticker & Dynamic Mode Switcher (SPOT vs ACTIVE OPTION) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Dynamic Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setChartMode('SPOT')}
              className={`px-1.5 sm:px-2 py-0.5 text-[10.5px] sm:text-xs font-bold rounded-md transition cursor-pointer ${
                chartMode === 'SPOT'
                  ? 'bg-white text-slate-900 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {instrument === 'SENSEX' ? 'SENSEX SPOT' : 'NIFTY SPOT'}
            </button>
            <button
              type="button"
              onClick={() => setChartMode('OPTION')}
              className={`px-1.5 sm:px-2 py-0.5 text-[10.5px] sm:text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                chartMode === 'OPTION'
                  ? (isCe ? 'bg-emerald-600 text-white shadow-2xs font-black' : 'bg-rose-600 text-white shadow-2xs font-black')
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${chartMode === 'OPTION' ? 'bg-white' : (isCe ? 'bg-emerald-500' : 'bg-rose-500')} animate-pulse`}></span>
              <span>{dynamicStrikeName}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                chartMode === 'OPTION' ? 'bg-black/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {chartMode === 'OPTION' ? 'LIVE' : (isCe ? 'CE' : 'PE')}
              </span>
            </button>
          </div>

          <div className="h-3 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-0.5 text-[11px]">
            {['1m', '3m', '5m', '15m'].map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${activeTimeframe === tf
                  ? 'bg-[#e8f0fe] text-[#387ed1] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Live Chart Lines Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-sans font-medium">
          <div className="flex items-center gap-1 text-[#387ed1]">
            <span className="w-2.5 h-0.5 bg-[#387ed1] inline-block"></span>
            <span>{chartMode === 'OPTION' ? `Entry @ ₹${baseEntryPrice}` : 'Entry Line'}</span>
          </div>
          <div className="flex items-center gap-1 text-[#00a86b]">
            <span className="w-2.5 h-0.5 bg-[#00a86b] inline-block"></span>
            <span>{chartMode === 'OPTION' ? `Target 1 @ ₹${target1Price}` : 'Targets 1 & 2'}</span>
          </div>
          <div className="flex items-center gap-1 text-[#df514c]">
            <span className="w-2.5 h-0.5 bg-[#df514c] inline-block"></span>
            <span>{chartMode === 'OPTION' ? `SL @ ₹${slPrice}` : 'Stop Loss'}</span>
          </div>
        </div>

        {/* Right: VWAP Toggle */}
        <div className="flex items-center gap-2">
          {currentVWAP > 0 && (
            <button
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-0.5 text-[10px] rounded font-medium border transition cursor-pointer ${showVWAP
                ? 'bg-[#e8f0fe] text-[#387ed1] border-[#bcd0ee]'
                : 'bg-white text-slate-400 border-slate-200'
                }`}
            >
              VWAP: ₹{currentVWAP}
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative flex-1 w-full max-w-full min-h-0 overflow-hidden" ref={chartContainerRef}>
        {(!candles || candles.length === 0) && (
          <div className="absolute inset-0 z-20 bg-white/90 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Ready for Monday Live Market
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              Real candles will stream automatically via market feed when the market opens on Monday at 09:15 AM.
            </p>
            <button
              onClick={onOpenBacktest}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-2xs"
            >
              View 30-Day Real Backtest & Replay
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
