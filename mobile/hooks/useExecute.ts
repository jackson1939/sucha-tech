import { useState, useCallback } from 'react';
import { execute, ExecuteResult } from '@/services/api';

export function useExecute(userId: string) {
  const [result,  setResult]  = useState<ExecuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const run = useCallback(async (
    simulationId: string,
    signature:    string,
    type:         'voice' | 'pin' = 'voice',
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await execute({
        simulationId,
        userId,
        confirmation: { type, signature },
      });
      setResult(data);
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  return { result, loading, error, run, reset };
}
