/**
 * API client — apunta al backend Next.js de Vibe Broker.
 * En desarrollo local usa la IP de tu máquina (no localhost).
 * En producción usa la URL de Vercel.
 */
import Constants from 'expo-constants';

export const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  'https://sucha-tech.vercel.app';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface SimulatePayload {
  text:          string;
  userId:        string;
  asrConfidence: number;
}

export interface SimulateResult {
  simulationId:              string;
  intent:                    { action: string; tokenFrom: string; tokenTo: string; amount: number };
  quote:                     { from: string; to: string; amount: string; estimatedReceive: string };
  fees:                      { network: string; protocol: string };
  requiresDoubleConfirmation: boolean;
  policyReason:              string;
  asrConfidence:             number;
  route:                     { provider: string; routeId: string };
  latencyMs:                 number;
}

export interface ExecutePayload {
  simulationId: string;
  userId:       string;
  confirmation: { type: 'voice' | 'pin'; signature: string };
}

export interface ExecuteResult {
  orderId:   string;
  txHash:    string;
  status:    'submitted' | 'failed';
  receiptId: string;
}

export interface Order {
  id:         string;
  action:     string;
  token_from: string;
  token_to:   string;
  amount:     string;
  status:     string;
  created_at: string;
  tx_hash:    string;
}

// ── Funciones ─────────────────────────────────────────────────────────────────

export async function simulate(payload: SimulatePayload): Promise<SimulateResult> {
  const res = await fetch(`${API_BASE}/api/orders/simulate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
  return data as SimulateResult;
}

export async function execute(payload: ExecutePayload): Promise<ExecuteResult> {
  const res = await fetch(`${API_BASE}/api/orders/execute`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
  return data as ExecuteResult;
}

export async function fetchOrders(userId: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/orders?userId=${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
  return data.orders ?? [];
}

export async function fetchTTSAudio(text: string): Promise<string> {
  // Devuelve una URL firmada / base64 de audio MP3 desde ElevenLabs
  const res = await fetch(`${API_BASE}/api/voice/tts`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`TTS error ${res.status}`);
  // El endpoint devuelve JSON con { audioUrl } o stream
  const data = await res.json();
  return data.audioUrl ?? '';
}

export async function fetchUserSettings(userId: string) {
  const res = await fetch(`${API_BASE}/api/users/${userId}/settings`);
  return res.json();
}

export async function saveUserSettings(userId: string, settings: object) {
  const res = await fetch(`${API_BASE}/api/users/${userId}/settings`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(settings),
  });
  return res.json();
}
