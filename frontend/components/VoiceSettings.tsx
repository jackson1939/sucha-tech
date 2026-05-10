'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useVoiceSettings } from '@frontend/hooks/useVoiceSettings';
import { useSpeech }        from '@frontend/hooks/useSpeech';

const LANGS = [
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'pt', label: '🇧🇷 Português' },
];

export function VoiceSettings() {
  const { config, update, filteredVoices, selectedVoice, mounted } = useVoiceSettings();
  const { speak } = useSpeech(config);

  // Estado local (staged) — solo se persiste al presionar Guardar
  const [staged,   setStaged]   = useState(config);
  const [dirty,    setDirty]    = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const btnRef   = useRef<HTMLButtonElement>(null);
  const tickRef  = useRef<HTMLSpanElement>(null);

  // Sincronizar staged cuando se carga config inicial
  useEffect(() => {
    if (mounted) setStaged(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const patch = useCallback((partial: Partial<typeof config>) => {
    setStaged(prev => ({ ...prev, ...partial }));
    setDirty(true);
    setSaved(false);
  }, []);

  // Voces filtradas según idioma staged (no el guardado)
  const { voices } = useVoiceSettings();
  const filteredByStaged = voices.filter(v => v.lang.startsWith(staged.lang));
  const activeVoice = voices.find(v => v.name === staged.voiceName) ?? filteredByStaged[0] ?? voices[0];

  async function testVoice() {
    if (testing) return;
    setTesting(true);
    // Aplica staged temporalmente para que el test use la config actual
    update(staged);
    await new Promise(r => setTimeout(r, 80));
    await speak('Hola, soy tu asistente de Vibe Broker. ¿En qué puedo ayudarte hoy?', false);
    setTesting(false);
  }

  function handleSave() {
    if (saving || !dirty) return;
    setSaving(true);

    // Animación de presión
    if (btnRef.current) {
      gsap.fromTo(btnRef.current, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
    }

    // Guardar en localStorage
    update(staged);

    setTimeout(() => {
      setSaving(false);
      setDirty(false);
      setSaved(true);

      // Animar el tick de confirmación
      if (tickRef.current) {
        gsap.fromTo(tickRef.current,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.5)' },
        );
      }

      // Ocultar el tick después de 2.5s
      setTimeout(() => {
        if (tickRef.current) {
          gsap.to(tickRef.current, { opacity: 0, scale: 0.8, duration: 0.25, ease: 'power2.in',
            onComplete: () => setSaved(false) });
        }
      }, 2500);
    }, 350);
  }

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Idioma ──────────────────────────────────────────────────── */}
      <div>
        <label style={labelStyle}>Idioma de voz</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {LANGS.map(l => (
            <button key={l.code}
              onClick={() => patch({ lang: l.code, voiceName: '' })}
              style={{
                padding: '8px 14px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
                background: staged.lang === l.code ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                border: `1px solid ${staged.lang === l.code ? 'var(--border-glow)' : 'var(--border)'}`,
                color: staged.lang === l.code ? '#a78bfa' : 'var(--text-2)',
                transition: 'all 150ms',
              }}
            >{l.label}</button>
          ))}
        </div>
      </div>

      {/* ── Selector de voz ─────────────────────────────────────────── */}
      <div>
        <label style={labelStyle}>
          Voz ({filteredByStaged.length} disponibles)
        </label>
        {filteredByStaged.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
            No hay voces para este idioma en tu navegador. Prueba con Chrome o Edge.
          </p>
        ) : (
          <div style={{
            marginTop: 8, maxHeight: 180, overflowY: 'auto',
            border: '1px solid var(--border)', borderRadius: 12,
          }}>
            {filteredByStaged.map(voice => {
              const active = staged.voiceName === voice.name ||
                (!staged.voiceName && voice.name === activeVoice?.name);
              return (
                <button key={voice.name}
                  onClick={() => patch({ voiceName: voice.name })}
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

      {/* ── Velocidad ───────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={labelStyle}>Velocidad</label>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
            {staged.rate.toFixed(2)}×
          </span>
        </div>
        <input type="range" min={0.5} max={2.0} step={0.05}
          value={staged.rate}
          onChange={e => patch({ rate: parseFloat(e.target.value) })}
          style={sliderStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
          <span>🐢 Lento</span><span>Normal</span><span>⚡ Rápido</span>
        </div>
      </div>

      {/* ── Tono ────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={labelStyle}>Tono (pitch)</label>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
            {staged.pitch.toFixed(2)}
          </span>
        </div>
        <input type="range" min={0.5} max={2.0} step={0.05}
          value={staged.pitch}
          onChange={e => patch({ pitch: parseFloat(e.target.value) })}
          style={sliderStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
          <span>Grave</span><span>Normal</span><span>Agudo</span>
        </div>
      </div>

      {/* ── Probar voz ──────────────────────────────────────────────── */}
      <button onClick={testVoice} disabled={testing} style={{
        padding: '12px 20px', borderRadius: 12, cursor: testing ? 'not-allowed' : 'pointer',
        background: testing ? 'rgba(124,58,237,0.3)' : 'var(--accent-soft)',
        border: '1px solid var(--border-glow)',
        color: '#a78bfa', fontSize: 14, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 150ms',
      }}>
        {testing ? '🔊 Reproduciendo...' : '▶ Probar voz'}
      </button>

      {/* ── Guardar ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        {/* Indicador de cambios sin guardar */}
        {dirty && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: 'var(--warning)', marginBottom: 10,
            animation: 'fade-up 0.25s ease both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block', animation: 'breathe 1.5s infinite' }} />
            Tienes cambios sin guardar
          </div>
        )}

        <button ref={btnRef} onClick={handleSave}
          disabled={!dirty || saving}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: !dirty
              ? 'var(--bg-elevated)'
              : saving
                ? 'rgba(124,58,237,0.5)'
                : 'var(--grad-accent)',
            color: !dirty ? 'var(--text-3)' : '#fff',
            fontSize: 15, fontWeight: 700,
            cursor: !dirty || saving ? 'not-allowed' : 'pointer',
            boxShadow: dirty && !saving ? '0 4px 20px var(--accent-glow)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 220ms', willChange: 'transform',
            opacity: !dirty ? 0.45 : 1,
          }}
        >
          {saving ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Guardando…
            </>
          ) : (
            <>
              💾 Guardar ajustes de voz
              {saved && (
                <span ref={tickRef} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: '#4ade80',
                  background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                  padding: '2px 8px', borderRadius: 99,
                }}>
                  ✓ Guardado
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ── Nota ─────────────────────────────────────────────────────── */}
      <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
        La disponibilidad de voces depende del sistema operativo y el navegador.{' '}
        <span style={{ color: 'var(--accent)' }}>Chrome y Edge</span> tienen las mejores voces en español.
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
