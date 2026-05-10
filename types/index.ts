// ─── Intención parseada ───────────────────────────────────────────────────────
export interface ParsedIntent {
  action: 'buy' | 'sell' | 'swap' | 'bridge' | 'balance' | 'unknown';
  tokenFrom?: string;
  tokenTo?: string;
  amount?: number;
  chain?: string;
  rawText: string;
  confidence: number;
}

// ─── LI.FI ───────────────────────────────────────────────────────────────────
export interface SimulationResult {
  routeId: string;
  provider: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  estimatedReceive: string;
  networkFee: string;
  protocolFee: string;
  executionDuration: number;
}

// ─── Política de confirmación ─────────────────────────────────────────────────
export interface UserPolicy {
  voiceOnlyEnabled: boolean;
  voiceOnlyMaxPerOp: number;
  voiceOnlyDailyCap: number;
  voiceDailyUsed: number;
}

export interface PolicyResult {
  voiceOnlyAllowed: boolean;
  requiresDoubleConfirmation: boolean;
  reason?: string;
}

// ─── API: simulate ────────────────────────────────────────────────────────────
export interface SimulateRequest {
  text: string;
  userId?: string;
  asrConfidence?: number;
}

export interface SimulateResponse {
  simulationId: string;
  intent: { action: string; tokenFrom: string; tokenTo: string; amount: number };
  quote: { from: string; to: string; amount: string; estimatedReceive: string };
  fees: { network: string; protocol: string };
  requiresDoubleConfirmation: boolean;
  policyReason?: string;
  asrConfidence: number;
  route: { provider: string; routeId: string };
  latencyMs: number;
  prices?: Record<string, number>;
}

// ─── API: execute ─────────────────────────────────────────────────────────────
export interface Confirmation {
  type: 'voice' | 'double';
  pin?: string;
  signature: string;
}

export interface ExecuteRequest {
  simulationId: string;
  userId: string;
  confirmation: Confirmation;
}

export interface ExecuteResponse {
  txHash: string;
  status: string;
  receiptId: string;
}

// ─── API: users/settings ──────────────────────────────────────────────────────
export interface UserSettings {
  userId: string;
  email?: string;
  voiceOnlyEnabled: boolean;
  voiceOnlyMaxPerOp: number;
  voiceOnlyDailyCap: number;
  voiceDailyUsed: number;
  lastVoiceReset?: string;
}

// ─── DB rows ──────────────────────────────────────────────────────────────────
export interface UserRow {
  id: string;
  email: string;
  voice_only_enabled: boolean;
  voice_only_max_per_op: string;
  voice_only_daily_cap: string;
  voice_daily_used: string;
  last_voice_reset: string;
}

export interface OrderRow {
  id: string;
  user_id: string;
  simulation_id: string;
  amount: string;
  token_from: string;
  token_to: string;
  confirmation_type: string;
  status: string;
  tx_hash: string | null;
  receipt_id: string | null;
  created_at: string;
}
