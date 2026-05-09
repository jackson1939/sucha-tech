'use client';

import { useState, useCallback, useRef } from 'react';
import type { SimulateResponse } from '@/types';

export function useSimulate(userId = 'demo') {
  const [simulation,  setSimulation]  = useState<SimulateResponse | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Lock para evitar múltiples requests simultáneos (causa 422 en cadena)
  const inFlightRef = useRef(false);

  const simulate = useCallback(async (text: string, asrConfidence = 1.0) => {
    const trimmed = text.trim();
    if (!trimmed)        return null;   // nunca enviar texto vacío
    if (inFlightRef.current) return null; // ya hay un request en vuelo

    inFlightRef.current = true;
    setError(null);
    setSimulation(null);
    setLoading(true);

    try {
      const res  = await fetch('/api/orders/simulate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: trimmed, userId, asrConfidence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
      setSimulation(data);
      return data as SimulateResponse;
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [userId]);

  const reset = useCallback(() => {
    setSimulation(null);
    setError(null);
    inFlightRef.current = false;
  }, []);

  return { simulation, loading, error, simulate, reset };
}
