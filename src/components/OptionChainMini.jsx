import React from 'react';
import { Table, Shield, Crosshair } from 'lucide-react';

export default function OptionChainMini({ optionChain, atmStrike }) {
  // Find Max Call OI & Max Put OI
  let maxCallOi = 0;
  let maxCallStrike = 0;
  let maxPutOi = 0;
  let maxPutStrike = 0;

  optionChain.forEach(row => {
    if (row.call.oi > maxCallOi) {
      maxCallOi = row.call.oi;
      maxCallStrike = row.strike;
    }
    if (row.put.oi > maxPutOi) {
      maxPutOi = row.put.oi;
      maxPutStrike = row.strike;
    }
  });

  return (
    <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3 shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            NIFTY Option Chain (OI Confluence)
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-emerald-400">
            Major Support: <strong className="text-white">{maxPutStrike}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400">
            Major Resistance: <strong className="text-white">{maxCallStrike}</strong>
          </span>
        </div>
      </div>

      <div className="mt-2.5 overflow-x-auto">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
              <th className="py-1.5 px-2 text-rose-400">Call OI Chg</th>
              <th className="py-1.5 px-2 text-rose-400">Call OI</th>
              <th className="py-1.5 px-2 text-rose-300">Call LTP</th>
              <th className="py-1.5 px-3 bg-slate-800 text-white font-extrabold">STRIKE</th>
              <th className="py-1.5 px-2 text-emerald-300">Put LTP</th>
              <th className="py-1.5 px-2 text-emerald-400">Put OI</th>
              <th className="py-1.5 px-2 text-emerald-400">Put OI Chg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {optionChain.map((row) => {
              const isAtm = row.strike === atmStrike;
              const isMaxCall = row.strike === maxCallStrike;
              const isMaxPut = row.strike === maxPutStrike;

              return (
                <tr
                  key={row.strike}
                  className={`hover:bg-slate-800/40 transition ${
                    isAtm ? 'bg-cyan-950/20 font-bold' : ''
                  }`}
                >
                  {/* Call Chg OI */}
                  <td className={`py-1.5 px-2 ${row.call.changeOi >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {row.call.changeOi >= 0 ? '+' : ''}{row.call.changeOi}
                  </td>

                  {/* Call OI */}
                  <td className={`py-1.5 px-2 ${isMaxCall ? 'text-rose-400 font-bold bg-rose-950/30' : 'text-slate-300'}`}>
                    {(row.call.oi / 1000).toFixed(0)}k
                    {isMaxCall && <span className="ml-1 text-[9px] bg-rose-900/60 text-rose-300 px-1 py-0.2 rounded">RES</span>}
                  </td>

                  {/* Call LTP */}
                  <td className="py-1.5 px-2 text-rose-300 font-semibold">
                    ₹{row.call.ltp}
                  </td>

                  {/* Strike */}
                  <td className={`py-1.5 px-3 ${
                    isAtm
                      ? 'bg-cyan-500 text-slate-950 font-black shadow'
                      : 'bg-slate-900 text-slate-200 font-bold'
                  }`}>
                    {row.strike} {isAtm && '⭐'}
                  </td>

                  {/* Put LTP */}
                  <td className="py-1.5 px-2 text-emerald-300 font-semibold">
                    ₹{row.put.ltp}
                  </td>

                  {/* Put OI */}
                  <td className={`py-1.5 px-2 ${isMaxPut ? 'text-emerald-400 font-bold bg-emerald-950/30' : 'text-slate-300'}`}>
                    {(row.put.oi / 1000).toFixed(0)}k
                    {isMaxPut && <span className="ml-1 text-[9px] bg-emerald-900/60 text-emerald-300 px-1 py-0.2 rounded">SUP</span>}
                  </td>

                  {/* Put Chg OI */}
                  <td className={`py-1.5 px-2 ${row.put.changeOi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.put.changeOi >= 0 ? '+' : ''}{row.put.changeOi}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
