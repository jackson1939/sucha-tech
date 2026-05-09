import { NextRequest, NextResponse } from 'next/server';
import { synthesize, getScript, TTS_SCRIPTS } from '@backend/services/elevenlabs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text, scriptKey } = await req.json() as { text?: string; scriptKey?: string };
    const speak = scriptKey ? getScript(scriptKey) : text;
    if (!speak)
      return NextResponse.json({ error: true, code: 'MISSING_TEXT' }, { status: 400 });

    const audio = await synthesize(speak);
    if (!audio)
      return NextResponse.json({ audio: null, note: 'TTS en modo mock' });

    return new NextResponse(audio as unknown as BodyInit, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(audio.length), 'Cache-Control': 'public,max-age=86400' },
    });
  } catch (e) {
    console.error('[api/tts]', e);
    return NextResponse.json({ error: true, code: 'TTS_ERROR' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ scripts: Object.keys(TTS_SCRIPTS) });
}
