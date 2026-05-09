import type { SimulationResult } from '@/types';

const BASE = 'https://li.quest/v1';

function mock(from: string, to: string, amount: string): SimulationResult {
  const n = parseFloat(amount);
  return { routeId:`mock-${Date.now()}`, provider:'LI.FI-mock', fromToken:from, toToken:to,
    fromAmount:amount, estimatedReceive:(n*0.98).toFixed(6), networkFee:'0.0005', protocolFee:'0.0002', executionDuration:30 };
}

export async function getQuote(fromToken: string, toToken: string, fromAmount: string, fromChain='SOL', toChain='SOL'): Promise<SimulationResult> {
  const key = process.env.LIFI_API_KEY;
  if (!key || key === 'mock' || key === 'YOUR_LIFI_KEY') { console.warn('[lifi] mock'); return mock(fromToken, toToken, fromAmount); }

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const params = new URLSearchParams({ fromChain, toChain, fromToken, toToken,
      fromAmount: String(Math.round(parseFloat(fromAmount)*1e6)), slippage:'0.005' });
    const res  = await fetch(`${BASE}/quote?${params}`, { headers:{'x-lifi-api-key':key}, signal:ctrl.signal });
    if (!res.ok) throw new Error(`LI.FI ${res.status}`);
    const d = await res.json();
    return { routeId:d.routeId, provider:'LI.FI', fromToken:d.fromToken, toToken:d.toToken,
      fromAmount:d.fromAmount, estimatedReceive:d.estimatedReceive??d.toAmountMin,
      networkFee:d.gasCosts?.[0]?.amountUSD??'0', protocolFee:d.feeCosts?.[0]?.amountUSD??'0', executionDuration:d.executionDuration??30 };
  } catch (e) {
    console.error('[lifi] fallback mock:', (e as Error).message);
    return mock(fromToken, toToken, fromAmount);
  } finally { clearTimeout(timer); }
}
