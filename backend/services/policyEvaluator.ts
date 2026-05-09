import type { UserPolicy, PolicyResult } from '@/types';
import globalPolicy from '@backend/config/policies.json';

export function evaluatePolicy(amount: number, asrConfidence: number, u: UserPolicy): PolicyResult {
  const minConf  = parseFloat(process.env.VOICE_CONFIDENCE_MIN   ?? String(globalPolicy.voiceConfidenceMin));
  const maxPerOp = u.voiceOnlyMaxPerOp ?? globalPolicy.voiceOnlyMaxPerOp;
  const dailyCap = u.voiceOnlyDailyCap ?? globalPolicy.voiceOnlyDailyCap;

  if (!u.voiceOnlyEnabled)
    return { voiceOnlyAllowed: false, requiresDoubleConfirmation: true, reason: 'voice_only_disabled_by_user' };
  if (amount > maxPerOp)
    return { voiceOnlyAllowed: false, requiresDoubleConfirmation: true, reason: `amount_exceeds_per_op_limit:${maxPerOp}` };
  if ((u.voiceDailyUsed ?? 0) + amount > dailyCap)
    return { voiceOnlyAllowed: false, requiresDoubleConfirmation: true, reason: `daily_cap_exceeded:${dailyCap}` };
  if (asrConfidence < minConf)
    return { voiceOnlyAllowed: false, requiresDoubleConfirmation: true, reason: `asr_confidence_low:${asrConfidence}` };

  return { voiceOnlyAllowed: true, requiresDoubleConfirmation: false };
}
