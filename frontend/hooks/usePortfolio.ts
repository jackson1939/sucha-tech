'use client';
import { useState, useEffect, useCallback } from 'react';
import type { LocalOrder } from './useOrderHistory';

export interface TokenBalance {
  symbol:   string;
  amount:   number;
  usdValue: number;
  change24h?: number;
}

const KEY = 'vb_portfolio';

// Starting demo balances (devnet)
const DEMO_START: Record<string, number> = {
  USDC: 1000, SOL: 2, ETH: 0.05, BTC: 0, MATIC: 50, AVAX: 0,
};

function loadBalances(): Record<string, number> {
  if (typeof window === 'undefined') return { ...DEMO_START };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { ...DEMO_START };
  } catch { return { ...DEMO_START }; }
}

function saveBalances(b: Record<string, number>): void {
  try { localStorage.setItem(KEY, JSON.stringify(b)); } catch {}
}

export function usePortfolio() {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBalances(loadBalances());
    setMounted(true);
  }, []);

  // Apply an executed order to portfolio balances
  const applyOrder = useCallback((order: LocalOrder) => {
    setBalances(prev => {
      const next = { ...prev };
      const from = order.tokenFrom;
      const to   = order.tokenTo;
      const amt  = order.amount;

      // Subtract what was sold
      next[from] = Math.max(0, (next[from] ?? 0) - amt);

      // Add what was received (parse estimatedReceive)
      const received = parseFloat(order.estimatedReceive) || amt * 0.99;
      next[to] = (next[to] ?? 0) + received;

      saveBalances(next);
      return next;
    });
  }, []);

  const resetPortfolio = useCallback(() => {
    setBalances({ ...DEMO_START });
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  // Get non-zero balances sorted by symbol
  const tokenList = Object.entries(balances)
    .filter(([, amt]) => amt > 0.000001)
    .sort(([a], [b]) => a.localeCompare(b));

  return { balances, tokenList, mounted, applyOrder, resetPortfolio };
}
