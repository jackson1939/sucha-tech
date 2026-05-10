'use client';

import { useState } from 'react';
import { useVoiceSettings } from '@frontend/hooks/useVoiceSettings';
import { useSpeech, BotPhrases } from '@frontend/hooks/useSpeech';

const LANGS = [
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'pt', label: '🇧🇷 Português' },
];

export function VoiceSettings() {
  const { config, update, filteredVoices, selectedVoice, mounted } = useVoiceSettings();
  const { speak } = useSpeech(config);
  const [testing, setTesting] = useState(false);

  async function testVoice() {
    if (testing) return;
    setTesting(true);
    await speak('Hola, soy tu asistente de Vibe Broker. ¿En qué puedo ayudarte hoy?', false);
    setTesting(false);
  }

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Idioma */}
      <div>
        <label style={labelStyle}>Idioma de voz</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => update({ lang: l.code, voiceName: '' })}
              style={{
                padding: '8px 14px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
                background: config.lang === l.code ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                border: `1px solid ${config.lang === l.code ? 'var(--border-glow)' : 'var(--border)'}`,
                color: config.lang === l.code ? '#a78bfa' : 'var(--text-2)',
                transition: 'all 150ms',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de voz */}
      <div>
        <label style={labelStyle}>
          Voz ({filteredVoices.length} disponibles)
        </label>
        {filteredVoices.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
            No hay voces disponibles para este idioma en tu navegador.
          </p>
        ) : (
          <div style={{
            marginTop: 8, maxHeight: 180, overflowY: 'auto',
            border: '1px solid var(--border)', borderRadius: 12,
          }}>
            {filteredVoices.map((voice) => {
              const active = config.voiceName === voice.name || (!config.voiceName && voice.name === selectedVoice?.name);
              return (
                <button
                  key={voice.name}
                  onClick={() => update({ voiceName: voice.name })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '10px 14px', cursor: 'pointer',
                    background: active ? 'var(--accent-soft)' : 'transparent',
                    border: 'none', borderBottom: '1px solid var(--border)',
                    textAlign: 'left', color: active ? '#a78bfa' : 'var(--text-2)',
                    fontSize: 13, transition: 'background 150ms',
                  }}
                >
                  <span>{voice.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{voice.lang}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Velocidad */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={labelStyle}>Velocidad</label>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {config.rate.toFixed(2)}×
          </span>
        </div>
        <input
          type="range" min={0.5} max={2.0} step={0.05}
          value={config.rate}
          onChange={(e) => update({ rate: parseFloat(e.target.value) })}
          style={sliderStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
          <span>🐢 Lento</span><span>Normal</span><span>⚡ Rápido</span>
        </div>
      </div>

      {/* Tono */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={labelStyle}>Tono (pitch)</label>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {config.pitch.toFixed(2)}
          </span>
        </div>
        <input
          type="range" min={0.5} max={2.0} step={0.05}
          value={config.pitch}
          onChange={(e) => update({ pitch: parseFloat(e.target.value) })}
          style={sliderStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
          <span>Grave</span><span>Normal</span><span>Agudo</span>
        </div>
      </div>

      {/* Botón de prueba */}
      <button
        onClick={testVoice}
        disabled={testing}
        style={{
          padding: '12px 20px', borderRadius: 12, cursor: testing ? 'not-allowed' : 'pointer',
          background: testing ? 'rgba(124,58,237,0.3)' : 'var(--accent-soft)',
          border: '1px solid var(--border-glow)',
          color: '#a78bfa', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 150ms',
        }}
      >
        {testing ? '🔊 Reproduciendo...' : '▶ Probar voz'}
      </button>

      <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
        La disponibilidad de voces depende del sistema operativo y el navegador.
        Chrome y Edge tienen las mejores voces en español.
      </p>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--text-2)',
};

const sliderStyle: React.CSSProperties = {
  width: '100%', height: 6, appearance: 'none',
  background: 'var(--bg-secondary)',
  borderRadius: 99, outline: 'none', cursor: 'pointer',
  accentColor: 'var(--accent)',
};
