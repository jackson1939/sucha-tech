'use client';

import { useState, useCallback } from 'react';
import type { SimulateResponse } from '@/types';

export function useSimulate(userId = 'demo') {
  const [simulation,  setSimulation]  = useState<SimulateResponse | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const simulate = useCallback(async (text: string, asrConfidence = 1.0) => {
    if (!text.trim()) return null;
    setError(null);
    setSimulation(null);
    setLoading(true);

    try {
      const res  = await fetch('/api/orders/simulate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: text.trim(), userId, asrConfidence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al simular');
      setSimulation(data);
      return data as SimulateResponse;
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const reset = useCallback(() => { setSimulation(null); setError(null); }, []);

  return { simulation, loading, error, simulate, reset };
}
