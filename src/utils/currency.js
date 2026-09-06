/**
 * Currency metadata, default benchmark exchange rates, and live exchange rate fetcher.
 * Base currency for ledger calculations is USD (standard).
 */

export const CURRENCY_METADATA = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimals: 2, defaultRate: 1 },
  KHR: { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', flag: '🇰🇭', decimals: 0, defaultRate: 4100 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimals: 2, defaultRate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', decimals: 2, defaultRate: 0.79 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', decimals: 0, defaultRate: 155 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', decimals: 2, defaultRate: 1.36 },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', decimals: 2, defaultRate: 1.52 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', decimals: 2, defaultRate: 36.5 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', decimals: 2, defaultRate: 1.34 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', decimals: 2, defaultRate: 7.23 }
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_METADATA);

export const DEFAULT_EXCHANGE_RATES = Object.fromEntries(
  Object.entries(CURRENCY_METADATA).map(([k, v]) => [k, v.defaultRate])
);

const RATES_STORAGE_KEY = 'sf_exchange_rates';
const RATES_TIMESTAMP_KEY = 'sf_exchange_rates_timestamp';

/**
 * Fetch live exchange rates from public open exchange rate API with offline caching & fallback.
 */
export async function fetchLiveExchangeRates() {
  const cachedRates = localStorage.getItem(RATES_STORAGE_KEY);
  const cachedTimestamp = localStorage.getItem(RATES_TIMESTAMP_KEY);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && data.rates && typeof data.rates === 'object') {
      const mergedRates = { ...DEFAULT_EXCHANGE_RATES };
      SUPPORTED_CURRENCIES.forEach((cur) => {
        if (typeof data.rates[cur] === 'number' && data.rates[cur] > 0) {
          mergedRates[cur] = data.rates[cur];
        }
      });

      const nowIso = new Date().toISOString();
      localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(mergedRates));
      localStorage.setItem(RATES_TIMESTAMP_KEY, nowIso);

      return {
        rates: mergedRates,
        lastUpdated: nowIso,
        source: 'online'
      };
    }
  } catch (err) {
    console.warn('[currency] Live exchange rate fetch failed, falling back to cache:', err.message);
  }

  // Fallback to cache if available
  if (cachedRates) {
    try {
      return {
        rates: { ...DEFAULT_EXCHANGE_RATES, ...JSON.parse(cachedRates) },
        lastUpdated: cachedTimestamp || new Date().toISOString(),
        source: 'cache'
      };
    } catch {}
  }

  // Fallback to built-in benchmarks
  return {
    rates: { ...DEFAULT_EXCHANGE_RATES },
    lastUpdated: new Date().toISOString(),
    source: 'fallback'
  };
}

/**
 * Convert an amount between any two supported currencies.
 */
export function convertCurrency(
  amount,
  fromCode = 'USD',
  toCode = 'USD',
  rates = DEFAULT_EXCHANGE_RATES,
  customKhrRate = null
) {
  const num = parseFloat(amount || 0);
  if (isNaN(num) || num === 0) return 0;
  if (fromCode === toCode) return num;

  const effectiveRates = { ...DEFAULT_EXCHANGE_RATES, ...rates };
  if (customKhrRate && Number(customKhrRate) > 0) {
    effectiveRates.KHR = Number(customKhrRate);
  }

  const fromRate = effectiveRates[fromCode] || 1;
  const toRate = effectiveRates[toCode] || 1;

  // Convert to base USD first, then to target currency
  const inUsd = num / fromRate;
  return inUsd * toRate;
}

/**
 * Format an amount with currency symbol, decimals, and thousands separators.
 */
export function formatCurrencyAmount(
  amount,
  targetCurrency = 'USD',
  rates = DEFAULT_EXCHANGE_RATES,
  options = {}
) {
  const { fromCurrency = 'USD', customKhrRate = null, showCode = false } = options;
  const converted = convertCurrency(amount, fromCurrency, targetCurrency, rates, customKhrRate);
  const meta = CURRENCY_METADATA[targetCurrency] || CURRENCY_METADATA.USD;
  const decimals = meta.decimals;

  const formattedNum = converted.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${meta.symbol}${formattedNum}${showCode ? ` ${meta.code}` : ''}`;
}

export function getCurrencyMeta(code) {
  return CURRENCY_METADATA[code] || CURRENCY_METADATA.USD;
}
