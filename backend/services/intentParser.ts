import type { ParsedIntent } from '@/types';

// ── Token aliases ─────────────────────────────────────────────────────────────
const TOKENS: Record<string, string> = {
  // SOL
  sol:'SOL', solana:'SOL',
  // ETH
  eth:'ETH', ether:'ETH', ethereum:'ETH', 'éter':'ETH',
  // BTC
  btc:'BTC', bitcoin:'BTC', 'bitcóin':'BTC',
  // Stables
  usdc:'USDC', usdt:'USDT', dai:'DAI', busd:'BUSD',
  // BNB Chain
  bnb:'BNB', binance:'BNB',
  // Polygon
  matic:'MATIC', polygon:'MATIC', pol:'MATIC',
  // Avalanche
  avax:'AVAX', avalanche:'AVAX',
  // Others
  ftm:'FTM', fantom:'FTM',
  arb:'ARB', arbitrum:'ARB',
  op:'OP', optimism:'OP',
  base:'BASE',
  ada:'ADA', cardano:'ADA',
  dot:'DOT', polkadot:'DOT',
  link:'LINK', chainlink:'LINK',
  uni:'UNI', uniswap:'UNI',
  aave:'AAVE',
};

const CHAINS: Record<string, string> = {
  solana:'Solana', sol:'Solana',
  ethereum:'Ethereum', eth:'Ethereum',
  binance:'BNBChain', bnb:'BNBChain', bsc:'BNBChain',
  polygon:'Polygon', matic:'Polygon',
  avalanche:'Avalanche', avax:'Avalanche',
  fantom:'Fantom', ftm:'Fantom',
  arbitrum:'Arbitrum', arb:'Arbitrum',
  optimism:'Optimism', op:'Optimism',
  base:'Base',
};

const norm = (t: string): string => TOKENS[t.toLowerCase()] ?? t.toUpperCase();
const normChain = (t: string): string => CHAINS[t.toLowerCase()] ?? t;

function normalizeText(text: string): string {
  return text
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    // normalize accented chars in numbers: "cero punto uno" etc
    .replace(/\bcero\b/gi, '0')
    .replace(/\buno\b/gi, '1')
    .replace(/\bdos\b/gi, '2')
    .replace(/\btres\b/gi, '3')
    .replace(/\bcuatro\b/gi, '4')
    .replace(/\bcinco\b/gi, '5')
    .trim();
}

const parseAmt = (s: string) => parseFloat(s.replace(',', '.'));

// Amount: digits with optional decimal
const A  = '([\\d]+(?:[.,][\\d]+)?)';
// Optional "de" / "of" / "de" between amount and token
const DE = '(?:(?:de|of|do|da)\\s+)?';
// Optional "en" / "on" / "na" / "in" chain suffix
const ON = '(?:\\s+(?:en|on|na|in|para|to|para la red|on the network|na rede)\\s+(\\w+))?';

// ── BUY patterns — ES + EN + PT ───────────────────────────────────────────────
const BUY = [
  // ES
  new RegExp(`(?:quiero\\s+)?comprar?\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:quiero\\s+)?adquirir\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:quiero\\s+)?obtener\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:necesito|dame|pon|consigue|ponme|hazme|deme)\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`cómpr(?:a|ame)\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  // EN
  new RegExp(`(?:i\\s+want\\s+to\\s+)?buy\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:i\\s+want\\s+to\\s+)?purchase\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:get|acquire|give\\s+me)\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`i\\s+need\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  // PT
  new RegExp(`(?:quero\\s+)?comprar\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:quero\\s+)?adquirir\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:me\\s+d[áa]|preciso\\s+de|dá-me)\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
];

// ── SELL patterns ─────────────────────────────────────────────────────────────
const SELL = [
  // ES
  new RegExp(`(?:quiero\\s+)?vender?\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:quiero\\s+)?deshacerme\\s+de\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`cambia\\s+${A}\\s*${DE}(\\w+)\\s+(?:a|por)\\s+(?:usdc|usdt|dai|dólares?)${ON}`, 'i'),
  // EN
  new RegExp(`(?:i\\s+want\\s+to\\s+)?sell\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:i\\s+want\\s+to\\s+)?liquidate\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`convert\\s+${A}\\s*${DE}(\\w+)\\s+(?:to|into)\\s+(?:usdc|usdt|dollars?)${ON}`, 'i'),
  // PT
  new RegExp(`(?:quero\\s+)?vender\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
  new RegExp(`(?:quero\\s+)?liquidar\\s+${A}\\s*${DE}(\\w+)${ON}`, 'i'),
];

// ── SWAP patterns ─────────────────────────────────────────────────────────────
const SWAP = [
  // ES
  new RegExp(`swap\\s+${A}\\s*${DE}(\\w+)\\s+(?:por|a|to|for|en)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`cambia[r]?\\s+${A}\\s*${DE}(\\w+)\\s+(?:por|a|en)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:quiero\\s+)?(?:intercambia[r]?|cambia[r]?)\\s+${A}\\s*${DE}(\\w+)\\s+(?:por|a|en)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:convierte?|transforma[r]?)\\s+${A}\\s*${DE}(\\w+)\\s+(?:a|en|por)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:de|from)\\s+${A}\\s*${DE}(\\w+)\\s+(?:a|to)\\s+(\\w+)${ON}`, 'i'),
  // EN
  new RegExp(`(?:i\\s+want\\s+to\\s+)?swap\\s+${A}\\s*${DE}(\\w+)\\s+(?:for|to|into)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:i\\s+want\\s+to\\s+)?exchange\\s+${A}\\s*${DE}(\\w+)\\s+(?:for|to)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:i\\s+want\\s+to\\s+)?trade\\s+${A}\\s*${DE}(\\w+)\\s+(?:for|to)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`convert\\s+${A}\\s*${DE}(\\w+)\\s+(?:to|into)\\s+(\\w+)${ON}`, 'i'),
  // PT
  new RegExp(`(?:quero\\s+)?trocar\\s+${A}\\s*${DE}(\\w+)\\s+(?:por|para)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:quero\\s+)?converter\\s+${A}\\s*${DE}(\\w+)\\s+(?:para|em)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:quero\\s+)?cambiar\\s+${A}\\s*${DE}(\\w+)\\s+(?:por|para)\\s+(\\w+)${ON}`, 'i'),
];

// ── BRIDGE patterns ───────────────────────────────────────────────────────────
const BRIDGE = [
  // ES/EN/PT
  new RegExp(`bridge\\s+${A}\\s*${DE}(\\w+)\\s+(?:to|a|hacia|para)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:env[ií]ar?|transferir?|mandar)\\s+${A}\\s*${DE}(\\w+)\\s+(?:a|hacia|to)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:move|send|transfer)\\s+${A}\\s*${DE}(\\w+)\\s+(?:to|from.*?to)\\s+(\\w+)${ON}`, 'i'),
  new RegExp(`(?:mover?|enviar?)\\s+${A}\\s*${DE}(\\w+)\\s+(?:de|from)\\s+\\w+\\s+(?:a|to)\\s+(\\w+)${ON}`, 'i'),
  // PT
  new RegExp(`(?:enviar?|transferir?)\\s+${A}\\s*${DE}(\\w+)\\s+(?:para|a)\\s+(\\w+)${ON}`, 'i'),
];

// ── BALANCE patterns ──────────────────────────────────────────────────────────
const BAL = [
  /(?:mi\s+)?(?:balance|saldo|cartera|portafolio|portfolio)/i,
  /cu[aá]nto\s+tengo/i, /mis\s+(?:fondos|tokens|monedas)/i,
  /how\s+much\s+(?:do\s+i\s+have|have\s+i)/i,
  /(?:show|check|ver|mostrar?)\s+(?:my\s+)?(?:balance|portfolio|wallet)/i,
  /what(?:'s|is)\s+my\s+balance/i,
  /(?:meu\s+)?(?:saldo|carteira|portfólio)/i,
  /quanto\s+tenho/i, /ver\s+meus\s+(?:fundos|tokens)/i,
];

// ── PRICE CHECK patterns ──────────────────────────────────────────────────────
const PRICE = [
  new RegExp(`(?:cu[aá]nto\\s+(?:vale|cuesta|está)|precio\\s+de|price\\s+of|what(?:'s|\\s+is)\\s+the\\s+price\\s+of)\\s+(\\w+)`, 'i'),
  new RegExp(`(?:quanto\\s+(?:vale|custa)|preço\\s+do?)\\s+(\\w+)`, 'i'),
];

export function parseIntent(text: string, asrConfidence = 1.0): ParsedIntent {
  const t = normalizeText(text);
  const b: ParsedIntent = { action: 'unknown', rawText: text, confidence: asrConfidence };

  // Check BRIDGE first (most specific)
  for (const p of BRIDGE) {
    const m = t.match(p);
    if (m) return { ...b, action: 'bridge', amount: parseAmt(m[1]), tokenFrom: norm(m[2]), tokenTo: norm(m[3]), chain: m[4] ? normChain(m[4]) : undefined };
  }

  // SWAP (two tokens)
  for (const p of SWAP) {
    const m = t.match(p);
    if (m) return { ...b, action: 'swap', amount: parseAmt(m[1]), tokenFrom: norm(m[2]), tokenTo: norm(m[3]), chain: m[4] ? normChain(m[4]) : undefined };
  }

  // BUY (one token, buy with USDC)
  for (const p of BUY) {
    const m = t.match(p);
    if (m) return { ...b, action: 'buy', amount: parseAmt(m[1]), tokenFrom: 'USDC', tokenTo: norm(m[2]), chain: m[3] ? normChain(m[3]) : undefined };
  }

  // SELL (one token, sell for USDC)
  for (const p of SELL) {
    const m = t.match(p);
    if (m) return { ...b, action: 'sell', amount: parseAmt(m[1]), tokenFrom: norm(m[2]), tokenTo: 'USDC', chain: m[3] ? normChain(m[3]) : undefined };
  }

  // BALANCE
  for (const p of BAL) {
    if (p.test(t)) return { ...b, action: 'balance' };
  }

  // PRICE CHECK
  for (const p of PRICE) {
    const m = t.match(p);
    if (m) return { ...b, action: 'balance', tokenFrom: norm(m[1]) };
  }

  return b;
}
