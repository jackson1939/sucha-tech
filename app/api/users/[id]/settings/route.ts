import { NextRequest, NextResponse } from 'next/server';
import { createHash }    from 'crypto';
import { queryOne, query } from '@backend/db';
import type { UserRow }    from '@/types';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = params;
  const row = await queryOne<UserRow>(
    'SELECT id,email,voice_only_enabled,voice_only_max_per_op,voice_only_daily_cap,voice_daily_used,last_voice_reset FROM users WHERE id=$1 OR email=$2',
    [id, `${id}@vibebroker.dev`],
  ).catch(() => null);

  if (!row) return NextResponse.json({
    userId: id, voiceOnlyEnabled: true,
    voiceOnlyMaxPerOp: parseFloat(process.env.VOICE_ONLY_MAX_PER_OP ?? '0.1'),
    voiceOnlyDailyCap: parseFloat(process.env.VOICE_ONLY_DAILY_CAP  ?? '0.5'),
    voiceDailyUsed: 0, note: 'Usuario no registrado — defaults globales',
  });

  return NextResponse.json({
    userId: row.id, email: row.email,
    voiceOnlyEnabled:  row.voice_only_enabled,
    voiceOnlyMaxPerOp: parseFloat(row.voice_only_max_per_op),
    voiceOnlyDailyCap: parseFloat(row.voice_only_daily_cap),
    voiceDailyUsed:    parseFloat(row.voice_daily_used),
    lastVoiceReset:    row.last_voice_reset,
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = params;
  const body   = await req.json() as { voiceOnlyEnabled?:boolean; voiceOnlyMaxPerOp?:number; voiceOnlyDailyCap?:number; passkey?:string; recoveryCode?:string };

  const sets: string[] = []; const vals: unknown[] = []; let i = 1;
  if (body.voiceOnlyEnabled  !== undefined) { sets.push(`voice_only_enabled=$${i++}`);    vals.push(body.voiceOnlyEnabled); }
  if (body.voiceOnlyMaxPerOp !== undefined) { sets.push(`voice_only_max_per_op=$${i++}`); vals.push(body.voiceOnlyMaxPerOp); }
  if (body.voiceOnlyDailyCap !== undefined) { sets.push(`voice_only_daily_cap=$${i++}`);  vals.push(body.voiceOnlyDailyCap); }
  if (body.passkey)      { sets.push(`passkey_hash=$${i++}`);       vals.push(createHash('sha256').update(body.passkey).digest('hex')); }
  if (body.recoveryCode) { sets.push(`recovery_code_hash=$${i++}`); vals.push(createHash('sha256').update(body.recoveryCode).digest('hex')); }

  if (!sets.length)
    return NextResponse.json({ error: true, code: 'NO_UPDATES' }, { status: 400 });

  vals.push(id, `${id}@vibebroker.dev`);
  const updated = await query(`UPDATE users SET ${sets.join(',')} WHERE id=$${i} OR email=$${i+1} RETURNING id`, vals).catch(()=>[]);
  if (!updated.length)
    return NextResponse.json({ error: true, code: 'USER_NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ success: true });
}
