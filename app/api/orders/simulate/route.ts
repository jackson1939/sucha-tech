import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 }         from 'uuid';
import { parseIntent }           from '@backend/services/intentParser';
import { evaluatePolicy }        from '@backend/services/policyEvaluator';
import { getQuote }              from '@backend/services/lifi';
import { setSimulation }         from '@backend/services/simulationCache';
import { getPrices }             from '@backend/services/oracle';
import { queryOne }              from '@backend/db';
import type { SimulateRequest, UserRow, UserPolicy } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text, userId = 'demo', asrConfidence = 1.0 } = await req.json() as SimulateRequest;

    if (!text?.trim())
      return NextResponse.json({ error: true, code: 'MISSING_TEXT', message: 'Campo "text" requerido' }, { status: 400 });

    const startMs = Date.now();
    const intent  = parseIntent(text.trim(), asrConfidence);

    if (intent.action === 'unknown')
      return NextResponse.json({ error: true, code: 'UNKNOWN_INTENT', message: 'No pude entender la intención. Ej: "compra 0.1 SOL"' }, { status: 422 });

    const amount    = intent.amount ?? 0;
    const fromToken = intent.tokenFrom ?? 'USDC';
    const toToken   = intent.tokenTo   ?? 'SOL';

    let userPolicy: UserPolicy = {
      voiceOnlyEnabled:  true,
      voiceOnlyMaxPerOp: parseFloat(process.env.VOICE_ONLY_MAX_PER_OP ?? '0.1'),
      voiceOnlyDailyCap: parseFloat(process.env.VOICE_ONLY_DAILY_CAP  ?? '0.5'),
      voiceDailyUsed:    0,
    };

    const row = await queryOne<UserRow>('SELECT * FROM users WHERE id=$1 OR email=$2 LIMIT 1',
      [userId, `${userId}@vibebroker.dev`]).catch(() => null);

    if (row) {
      userPolicy = {
        voiceOnlyEnabled:  row.voice_only_enabled,
        voiceOnlyMaxPerOp: parseFloat(row.voice_only_max_per_op),
        voiceOnlyDailyCap: parseFloat(row.voice_only_daily_cap),
        voiceDailyUsed:    parseFloat(row.voice_daily_used),
      };
    }

    const policy       = evaluatePolicy(amount, asrConfidence, userPolicy);
    const [quote, prices] = await Promise.all([
      getQuote(fromToken, toToken, String(amount)),
      getPrices([fromToken, toToken]).catch(() => ({})),
    ]);
    const simulationId = `sim-${uuidv4()}`;

    setSimulation(simulationId, { intent, quote, requiresDoubleConfirmation: policy.requiresDoubleConfirmation, userId });

    return NextResponse.json({
      simulationId,
      intent: { action: intent.action, tokenFrom: fromToken, tokenTo: toToken, amount },
      quote:  { from: fromToken, to: toToken, amount: String(amount), estimatedReceive: quote.estimatedReceive },
      fees:   { network: quote.networkFee, protocol: quote.protocolFee },
      requiresDoubleConfirmation: policy.requiresDoubleConfirmation,
      policyReason: policy.reason,
      asrConfidence,
      route: { provider: quote.provider, routeId: quote.routeId },
      latencyMs: Date.now() - startMs,
      prices,
    });
  } catch (e) {
    console.error('[api/simulate]', e);
    return NextResponse.json({ error: true, code: 'INTERNAL_ERROR', message: 'Error interno' }, { status: 500 });
  }
}
