import type { ParsedIntent } from '@/types';

const TOKENS: Record<string, string> = {
  sol:'SOL', soles:'SOL', solana:'SOL', solanas:'SOL',
  usdc:'USDC', usdcs:'USDC',
  usdt:'USDT', usdts:'USDT', tether:'USDT',
  eth:'ETH', eths:'ETH', ether:'ETH', ethereum:'ETH', ethers:'ETH',
  btc:'BTC', btcs:'BTC', bitcoin:'BTC', bitcoins:'BTC',
  bnb:'BNB', bnbs:'BNB',
};

const norm = (t: string) => TOKENS[t.toLowerCase()] ?? t.toUpperCase();

// Normaliza el texto del ASR: coma→punto, espacios, tildes en números
function normalizeText(text: string): string {
  return text
    .replace(/,/g, '.')           // "0,1 SOL" → "0.1 SOL"
    .replace(/\s+/g, ' ')
    .trim();
}

const parseAmt = (s: string) => parseFloat(s.replace(',', '.'));

// Patrón de monto: dígitos con decimal opcional
const A = '([\\d]+(?:[.][\\d]+)?)';
// "de" opcional entre monto y token (ASR a veces lo inserta)
const DE = '(?:de\\s+)?';

const BUY = [
  new RegExp(`comprar?\\s+${A}\\s*${DE}(\\w+)`, 'i'),
  new RegExp(`buy\\s+${A}\\s*${DE}(\\w+)`, 'i'),
  new RegExp(`quiero\\s+(?:comprar?|obtener|adquirir)\\s+${A}\\s*${DE}(\\w+)`, 'i'),
  new RegExp(`(?:necesito|dame|pon|consigue)\\s+${A}\\s*${DE}(\\w+)`, 'i'),
];

const SELL = [
  new RegExp(`vender?\\s+${A}\\s*${DE}(\\w+)`, 'i'),
  new RegExp(`sell\\s+${A}\\s*${DE}(\\w+)`, 'i'),
  new RegExp(`quiero\\s+vender?\\s+${A}\\s*${DE}(\\w+)`, 'i'),
];

const SWAP = [
  new RegExp(`swap\\s+${A}\\s*${DE}(\\w+)\\s+(?:por|a|to|for|en)\\s+(\\w+)`, 'i'),
  new RegExp(`cambiar?\\s+${A}\\s*${DE}(\\w+)\\s+(?:por|a|en)\\s+(\\w+)`, 'i'),
  new RegExp(`(?:quiero\\s+)?(?:cambiar?|intercambiar?)\\s+${A}\\s*${DE}(\\w+)\\s+(?:por|a|en)\\s+(\\w+)`, 'i'),
];

const BRIDGE = [
  new RegExp(`bridge\\s+${A}\\s*${DE}(\\w+)\\s+(?:to|a|hacia)\\s+(\\w+)`, 'i'),
  new RegExp(`(?:env[ií]ar?|transferir?)\\s+${A}\\s*${DE}(\\w+)\\s+(?:a|hacia|to)\\s+(\\w+)`, 'i'),
];

const BAL = [
  /(?:mi\s+)?balance/i, /saldo/i, /cu[aá]nto\s+tengo/i,
  /how\s+much/i, /mis\s+fondos/i, /mi\s+cartera/i, /mis\s+tokens/i,
];

export function parseIntent(text: string, asrConfidence = 1.0): ParsedIntent {
  const t = normalizeText(text);
  const b: ParsedIntent = { action: 'unknown', rawText: text, confidence: asrConfidence };
  for (const p of BRIDGE) { const m = t.match(p); if (m) return { ...b, action:'bridge', amount:parseAmt(m[1]), tokenFrom:norm(m[2]), tokenTo:norm(m[3]) }; }
  for (const p of SWAP)   { const m = t.match(p); if (m) return { ...b, action:'swap',   amount:parseAmt(m[1]), tokenFrom:norm(m[2]), tokenTo:norm(m[3]) }; }
  for (const p of BUY)    { const m = t.match(p); if (m) return { ...b, action:'buy',    amount:parseAmt(m[1]), tokenFrom:'USDC',     tokenTo:norm(m[2]) }; }
  for (const p of SELL)   { const m = t.match(p); if (m) return { ...b, action:'sell',   amount:parseAmt(m[1]), tokenFrom:norm(m[2]), tokenTo:'USDC'     }; }
  for (const p of BAL)    { if (p.test(t)) return { ...b, action:'balance' }; }
  return b;
}
