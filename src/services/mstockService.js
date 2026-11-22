// m.Stock (Mirae Asset) Direct Broker Feed Service
// Powers zero-lag live market quotes, option premium syncing, and real-time execution

const STORAGE_KEY = 'nifty_pro_mstock_config';

const DEFAULT_CONFIG = {
  clientCode: 'CPKPP0455F',
  apiKey: 'rx6NxHZxguxAfplD3yFGYvdiCJtCtjTXeIgjEm+4DtU=',
  isEnabled: true,
  brokerName: 'm.Stock (Mirae Asset)',
  apiType: 'Type B',
  validTill: '22 Nov 2027',
  status: 'ACTIVE',
  lastConnected: Date.now()
};

// Instrument token mapping for m.Stock Type B
export const MSTOCK_TOKENS = {
  NIFTY: {
    symbol: 'NIFTY 50',
    exchange: 'NSE',
    token: '26000',
    lotSize: 65,
    strikeStep: 50
  },
  SENSEX: {
    symbol: 'SENSEX',
    exchange: 'BSE',
    token: '1',
    lotSize: 20,
    strikeStep: 100
  }
};

/**
 * Get m.Stock broker configuration from persistent storage or default
 */
export function getMstockConfig() {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save updated m.Stock broker configuration
 */
export function saveMstockConfig(newConfig) {
  if (typeof window === 'undefined') return;
  try {
    const current = getMstockConfig();
    const merged = { ...current, ...newConfig, lastUpdated: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('Failed to save m.Stock config:', err);
    return null;
  }
}

/**
 * Check if m.Stock direct broker feed is active and enabled
 */
export function isMstockActive() {
  const config = getMstockConfig();
  return Boolean(config.isEnabled && config.apiKey && config.clientCode);
}

/**
 * Fetch live quote from m.Stock Type B API with automatic fallback
 */
export async function fetchMstockQuote(instrumentKey = 'NIFTY') {
  const config = getMstockConfig();
  if (!config.isEnabled || !config.apiKey) {
    return null;
  }

  const mapping = MSTOCK_TOKENS[instrumentKey] || MSTOCK_TOKENS.NIFTY;

  try {
    const response = await fetch('https://api.mstock.trade/openapi/typeb/instruments/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PrivateKey': config.apiKey,
        'X-Mirae-Version': '1'
      },
      body: JSON.stringify({
        mode: 'LTP',
        exchangeTokens: {
          [mapping.exchange]: [mapping.token]
        }
      })
    });

    if (!response.ok) {
      // 401 or token refresh needed — gracefully fallback to exchange feed
      return null;
    }

    const data = await response.json();
    const quote = data?.data?.[mapping.exchange]?.[mapping.token];
    if (quote && quote.ltp) {
      return {
        ltp: Number(quote.ltp),
        high: quote.high ? Number(quote.high) : null,
        low: quote.low ? Number(quote.low) : null,
        open: quote.open ? Number(quote.open) : null,
        close: quote.close ? Number(quote.close) : null,
        timestamp: Date.now(),
        source: 'm.Stock Direct'
      };
    }
    return null;
  } catch {
    // Network / CORS / Off-market timeout: fallback cleanly
    return null;
  }
}
