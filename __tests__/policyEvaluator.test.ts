import { evaluatePolicy } from '@backend/services/policyEvaluator';
import type { UserPolicy }  from '@/types';

const base: UserPolicy = { voiceOnlyEnabled: true, voiceOnlyMaxPerOp: 0.1, voiceOnlyDailyCap: 0.5, voiceDailyUsed: 0 };

describe('evaluatePolicy', () => {
  test('permite voice-only dentro de límites',      () => { const r = evaluatePolicy(0.05, 0.95, base);                              expect(r.voiceOnlyAllowed).toBe(true); });
  test('doble si voice-only desactivado',           () => { const r = evaluatePolicy(0.05, 0.95, {...base, voiceOnlyEnabled:false}); expect(r.requiresDoubleConfirmation).toBe(true); expect(r.reason).toContain('disabled'); });
  test('doble si monto supera límite',              () => { const r = evaluatePolicy(0.2,  0.95, base);                              expect(r.requiresDoubleConfirmation).toBe(true); expect(r.reason).toContain('amount_exceeds'); });
  test('doble si supera cap diario',                () => { const r = evaluatePolicy(0.05, 0.95, {...base, voiceDailyUsed:0.48});   expect(r.requiresDoubleConfirmation).toBe(true); expect(r.reason).toContain('daily_cap'); });
  test('doble si confidence bajo',                  () => { const r = evaluatePolicy(0.05, 0.75, base);                              expect(r.requiresDoubleConfirmation).toBe(true); expect(r.reason).toContain('asr_confidence'); });
  test('límite exacto es permitido',                () => { expect(evaluatePolicy(0.1, 0.85, base).voiceOnlyAllowed).toBe(true); });
  test('un centésimo sobre límite → doble',         () => { expect(evaluatePolicy(0.101, 0.85, base).requiresDoubleConfirmation).toBe(true); });
});
