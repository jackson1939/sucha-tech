import { useState, useCallback } from 'react';
import { simulate, SimulateResult } from '@/services/api';

export function useSimulate(userId: string) {
  const [result,  setResult]  = useState<SimulateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const run = useCallback(async (text: string, asrConfidence = 0.9) => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulate({ text, userId, asrConfidence });
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
