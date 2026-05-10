'use client';
import { useState, useEffect, useCallback } from 'react';

export interface LocalOrder {
  id:               string;
  simulationId:     string;
  userId:           string;
  tokenFrom:        string;
  tokenTo:          string;
  amount:           number;
  estimatedReceive: string;
  txHash:           string;
  receiptId:        string;
  confirmationType: 'voice' | 'double';
  status:           'submitted' | 'confirmed' | 'failed';
  chain?:           string;
  priceFrom?:       number;
  priceTo?:         number;
  createdAt:        string;
}

const KEY = 'vb_order_history';
const MAX = 100;

function loadOrders(): LocalOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOrders(orders: LocalOrder[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(orders.slice(0, MAX))); } catch {}
}

export function useOrderHistory() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrders(loadOrders());
    setLoaded(true);
  }, []);

  const addOrder = useCallback((order: LocalOrder) => {
    setOrders(prev => {
      // Avoid duplicates
      if (prev.some(o => o.txHash === order.txHash)) return prev;
      const next = [order, ...prev].slice(0, MAX);
      saveOrders(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setOrders([]);
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  const totalVolume = orders.reduce((acc, o) => acc + o.amount, 0);
  const successCount = orders.filter(o => o.status !== 'failed').length;

  return { orders, loaded, addOrder, clearHistory, totalVolume, successCount };
}
