// Oracle de precios — CoinGecko (sin API key) + caché 60s
const CACHE: Map<string, { price: number; ts: number }> = new Map();
const TTL = 60_000;

const CG_IDS: Record<string, string> = {
  SOL: 'solana', ETH: 'ethereum', BTC: 'bitcoin',
  USDC: 'usd-coin', USDT: 'tether', BNB: 'binancecoin',
  MATIC: 'matic-network', AVAX: 'avalanche-2', ARB: 'arbitrum',
  BASE: 'ethereum', OP: 'optimism', FTM: 'fantom',
};

export async function getTokenPrice(symbol: string): Promise<number | null> {
  const id = CG_IDS[symbol.toUpperCase()];
  if (!id) return null;

  const cached = CACHE.get(symbol);
  if (cached && Date.now() - cached.ts < TTL) return cached.price;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
    const r = await fetch(url, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    const data = await r.json();
    const price = data[id]?.usd ?? null;
    if (price) CACHE.set(symbol, { price, ts: Date.now() });
    return price;
  } catch {
    return null;
  }
}

export async function getPrices(symbols: string[]): Promise<Record<string, number>> {
  const entries = await Promise.all(
    symbols.map(async (s) => [s, await getTokenPrice(s)] as const)
  );
  return Object.fromEntries(entries.filter(([, v]) => v !== null)) as Record<string, number>;
}
