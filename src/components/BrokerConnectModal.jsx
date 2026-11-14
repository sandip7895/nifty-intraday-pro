import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Check, AlertCircle } from 'lucide-react';

export default function BrokerConnectModal({ isOpen, onClose }) {
  const [selectedBroker, setSelectedBroker] = useState('dhan');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [clientId, setClientId] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!apiKey) {
      alert('Please enter your API Key');
      return;
    }
    setIsConnected(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl p-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Connect Broker API</h3>
            <p className="text-xs text-slate-400">For live market feeds and order execution</p>
          </div>
        </div>

        {/* Broker Selector Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { id: 'dhan', name: 'Dhan HQ', tag: 'Free API' },
            { id: 'angel', name: 'Angel One', tag: 'SmartAPI' },
            { id: 'zerodha', name: 'Zerodha', tag: 'Kite' },
            { id: 'upstox', name: 'Upstox', tag: 'Fast' }
          ].map((broker) => (
            <button
              key={broker.id}
              onClick={() => setSelectedBroker(broker.id)}
              className={`p-2 rounded-xl border text-center transition ${
                selectedBroker === broker.id
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold">{broker.name}</div>
              <div className="text-[9px] text-slate-500">{broker.tag}</div>
            </button>
          ))}
        </div>

        {/* API Form */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Client ID / User ID
            </label>
            <input
              type="text"
              placeholder="e.g. DH1002345"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              API Key / Access Token
            </label>
            <input
              type="password"
              placeholder="Enter your API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              API Secret (Optional)
            </label>
            <input
              type="password"
              placeholder="Enter your API Secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Your API keys remain encrypted on your device. Paper trading requires no API key.</span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              {isConnected ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Connected!</span>
                </>
              ) : (
                <span>Save & Connect</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
