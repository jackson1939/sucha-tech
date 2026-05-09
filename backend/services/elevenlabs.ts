const BASE = 'https://api.elevenlabs.io/v1';

export const TTS_SCRIPTS: Record<string, string> = {
  voice_only_eligible:          'Vas a ejecutar esta operación. Di "confirmar" para ejecutar ahora.',
  double_confirmation_required: 'Por seguridad, esta operación requiere confirmación adicional. Ingresa tu PIN y presiona Firmar.',
  passkey_lost:                 'Si perdiste tu passkey, puedes recuperar tu cuenta con tu código de recuperación.',
  processing:                   'Procesando orden. La ruta seleccionada tardará aproximadamente 30 segundos.',
  success:                      'Operación completada. El recibo está guardado en la red de Solana.',
  error:                        'Hubo un problema con la ruta. Intentaré una alternativa o puedes cancelar.',
};

export const getScript = (key: string) => TTS_SCRIPTS[key] ?? key;

export async function synthesize(text: string): Promise<Buffer | null> {
  const apiKey  = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL';
  if (!apiKey || apiKey === 'mock' || apiKey === 'YOUR_ELEVENLABS_KEY') return null;

  const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key':apiKey, 'Accept':'audio/mpeg', 'Content-Type':'application/json' },
    body: JSON.stringify({ text, model_id:'eleven_multilingual_v2', voice_settings:{stability:0.5,similarity_boost:0.75} }),
  });
  if (!res.ok) { console.error('[tts] Error ElevenLabs:', res.status); return null; }
  return Buffer.from(await res.arrayBuffer());
}
