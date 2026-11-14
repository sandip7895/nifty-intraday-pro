import React from 'react';
import { Layers, TrendingUp, TrendingDown, ShieldCheck } from 'lucide-react';

export default function HeavyweightsTracker({ heavyweights }) {
  const totalPositivePoints = heavyweights
    .filter(s => s.points > 0)
    .reduce((acc, s) => acc + s.points, 0);

  const totalNegativePoints = heavyweights
    .filter(s => s.points < 0)
    .reduce((acc, s) => acc + s.points, 0);

  const netPoints = Number((totalPositivePoints + totalNegativePoints).toFixed(1));

  return (
    <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3 shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            NIFTY Heavyweights (Top Movers)
          </h4>
        </div>
        <div className="text-[11px] font-mono">
          <span className="text-slate-400">Net Impact: </span>
          <span className={`font-bold ${netPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netPoints >= 0 ? '+' : ''}{netPoints} pts
          </span>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {heavyweights.map((stock) => {
          const isUp = stock.change >= 0;
          return (
            <div
              key={stock.symbol}
              className={`p-2 rounded-lg border flex flex-col justify-between ${
                isUp
                  ? 'bg-slate-900/60 border-emerald-950/80 hover:border-emerald-800'
                  : 'bg-slate-900/60 border-rose-950/80 hover:border-rose-800'
              } transition`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-200">{stock.symbol}</span>
                <span className="text-[10px] text-slate-500 font-mono">{stock.weight}% wt</span>
              </div>

              <div className="my-1">
                <span className="text-xs font-mono font-bold text-slate-300">₹{stock.ltp}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className={`font-semibold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '+' : ''}{stock.change}%
                </span>
                <span className={`text-[10px] ${stock.points >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                  {stock.points >= 0 ? '+' : ''}{stock.points}p
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
