'use client';

import { useState, useCallback } from 'react';
import type { SimulateResponse, ExecuteResponse } from '@/types';

export function useExecute(userId = 'demo') {
  const [result,    setResult]    = useState<ExecuteResponse | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const execute = useCallback(async (
    simulation: SimulateResponse,
    pin?: string,
  ): Promise<ExecuteResponse | null> => {
    setExecuting(true);
    setError(null);

    try {
      // En producción: firma local via Wallet Adapter.
      // En Devnet/demo: firma placeholder
      const demoSig = Buffer.from('demo-signature-devnet').toString('base64');

      const res  = await fetch('/api/orders/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulation.simulationId,
          userId,
          confirmation: {
            type:      simulation.requiresDoubleConfirmation ? 'double' : 'voice',
            pin,
            signature: demoSig,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al ejecutar');
      setResult(data);
      return data as ExecuteResponse;
    } catch (e: unknown) {
      setError((e as Error).message);
      return null;
    } finally {
      setExecuting(false);
    }
  }, [userId]);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  return { result, executing, error, execute, reset };
}
