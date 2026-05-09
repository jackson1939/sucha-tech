#!/usr/bin/env node
/**
 * scripts/test-apis.js — Valida API keys de ElevenLabs y LI.FI
 * Uso: node scripts/test-apis.js
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function testLifi() {
  const key = process.env.LIFI_API_KEY;
  if (!key || key === 'YOUR_LIFI_KEY') { console.log('[LI.FI] ⚠️  API key no configurada'); return; }
  try {
    const res = await fetch('https://li.quest/v1/chains', {
      headers: { 'x-lifi-api-key': key },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    console.log(`[LI.FI] ✅  OK — ${data.chains?.length ?? 0} chains`);
  } catch (e) { console.error('[LI.FI] ❌', e.message); }
}

async function testElevenLabs() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key || key === 'YOUR_ELEVENLABS_KEY') { console.log('[ElevenLabs] ⚠️  API key no configurada'); return; }
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': key },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    console.log(`[ElevenLabs] ✅  OK — tier: ${data.subscription?.tier ?? 'free'}`);
  } catch (e) { console.error('[ElevenLabs] ❌', e.message); }
}

async function testBackend() {
  try {
    const res = await fetch('http://localhost:3000/api/health', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    console.log('[Backend] ✅  OK —', data);
  } catch { console.log('[Backend] ⚠️  No está corriendo en localhost:3000'); }
}

(async () => {
  console.log('=== Vibe Broker — validación de APIs ===\n');
  await testLifi();
  await testElevenLabs();
  await testBackend();
  console.log('\n=== Listo ===');
})();
