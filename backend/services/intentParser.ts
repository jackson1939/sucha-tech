import type { ParsedIntent } from '@/types';

const BUY    = [/comprar?\s+([\d.]+)\s*(\w+)/i, /buy\s+([\d.]+)\s*(\w+)/i, /quiero\s+comprar\s+([\d.]+)\s*(\w+)/i];
const SELL   = [/vender?\s+([\d.]+)\s*(\w+)/i,  /sell\s+([\d.]+)\s*(\w+)/i];
const SWAP   = [/swap\s+([\d.]+)\s*(\w+)\s+(?:por|a|to|for)\s+(\w+)/i, /cambiar?\s+([\d.]+)\s*(\w+)\s+(?:por|a)\s+(\w+)/i];
const BRIDGE = [/bridge\s+([\d.]+)\s*(\w+)\s+(?:to|a|hacia)\s+(\w+)/i];
const BAL    = [/(?:mi\s+)?balance/i, /saldo/i, /cu[aá]nto\s+tengo/i, /how\s+much/i];

const TOKENS: Record<string, string> = {
  sol:'SOL', solana:'SOL', usdc:'USDC', usdt:'USDT',
  eth:'ETH', ether:'ETH', ethereum:'ETH', btc:'BTC', bitcoin:'BTC', bnb:'BNB',
};

const norm = (t: string) => TOKENS[t.toLowerCase()] ?? t.toUpperCase();

export function parseIntent(text: string, asrConfidence = 1.0): ParsedIntent {
  const b: ParsedIntent = { action: 'unknown', rawText: text, confidence: asrConfidence };
  for (const p of BRIDGE) { const m = text.match(p); if (m) return { ...b, action:'bridge', amount:+m[1], tokenFrom:norm(m[2]), tokenTo:norm(m[3]) }; }
  for (const p of SWAP)   { const m = text.match(p); if (m) return { ...b, action:'swap',   amount:+m[1], tokenFrom:norm(m[2]), tokenTo:norm(m[3]) }; }
  for (const p of BUY)    { const m = text.match(p); if (m) return { ...b, action:'buy',    amount:+m[1], tokenFrom:'USDC',     tokenTo:norm(m[2]) }; }
  for (const p of SELL)   { const m = text.match(p); if (m) return { ...b, action:'sell',   amount:+m[1], tokenFrom:norm(m[2]), tokenTo:'USDC'     }; }
  for (const p of BAL)    { if (p.test(text)) return { ...b, action:'balance' }; }
  return b;
}
