'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AnimatedBackground } from '@frontend/components/AnimatedBackground';
import { PageTransition }     from '@frontend/components/PageTransition';
import { VoiceSettings }      from '@frontend/components/VoiceSettings';
import { useVoiceSettings }   from '@frontend/hooks/useVoiceSettings';
import { useSpeech }          from '@frontend/hooks/useSpeech';
import type { UserSettings }   from '@/types';

const USER_ID = 'demo';

export default function SettingsPage() {
  const [settings,  setSettings]  = useState<UserSettings | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [maxPerOp,  setMaxPerOp]  = useState('');
  const [dailyCap,  setDailyCap]  = useState('');
  const [voiceOnly, setVoiceOnly] = useState(true);
  const [tab,       setTab]       = useState<'policy' | 'voice'>('policy');

  const { config }     = useVoiceSettings();
  const { speak }      = useSpeech(config);
  const pageRef        = useRef<HTMLDivElement>(null);
  const tabContentRef  = useRef<HTMLDivElement>(null);

  // Animación inicial de la página
  useEffect(() => {
    if (loading || !pageRef.current) return;
    const blocks = Array.from(pageRef.current.querySelectorAll<HTMLElement>('.settings-block'));
    if (!blocks.length) return;
    const t = gsap.from(blocks, { y: 20, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' });
    return () => { t.kill(); };
  }, [loading]);

  // Animación al cambiar de tab
  useEffect(() => {
    if (!tabContentRef.current) return;
    const t = gsap.fromTo(tabContentRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
    );
    return () => { t.kill(); };
  }, [tab]);

  useEffect(() => {
    fetch(`/api/users/${USER_ID}/settings`)
      .then((r) => r.json())
      .then((d: UserSettings) => {
        setSettings(d);
        setVoiceOnly(d.voiceOnlyEnabled);
        setMaxPerOp(String(d.voiceOnlyMaxPerOp));
        setDailyCap(String(d.voiceOnlyDailyCap));
      })
      .catch(() => setError('No se pudieron cargar los ajustes'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setSuccess(false); setError(null);
    try {
      const res = await fetch(`/api/users/${USER_ID}/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceOnlyEnabled: voiceOnly, voiceOnlyMaxPerOp: +maxPerOp, voiceOnlyDailyCap: +dailyCap }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setSuccess(true);
      speak('Ajustes guardados correctamente.', false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally { setSaving(false); }
  }

  const usedPct = settings ? Math.min((settings.voiceDailyUsed / (+dailyCap || 0.5)) * 100, 100) : 0;

  if (loading) return (
    <>
      <AnimatedBackground />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    </>
  );

  return (
    <PageTransition style={{ position: 'relative', zIndex: 1 }}>
      <AnimatedBackground />
      <div ref={pageRef} style={{ padding: '24px 20px 40px' }}>

        {/* Header */}
        <header className="settings-block" style={{ marginBottom: 22 }}>
          <h1 style={{
            fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em',
            background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>⚙️ Ajustes</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Política de confirmación y configuración de voz</p>
        </header>

        {/* Tabs animados */}
        <div className="settings-block" style={{
          display: 'flex', gap: 4, padding: 4,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 14, marginBottom: 20, position: 'relative',
        }}>
          {(['policy', 'voice'] as const).map((t) => (
            <TabBtn key={t} label={t === 'policy' ? '🛡️ Política' : '🎙️ Voz y TTS'}
              active={tab === t} onClick={() => setTab(t)} />
          ))}
        </div>

        {/* Contenido del tab */}
        <div ref={tabContentRef} style={{ willChange: 'transform, opacity' }}>
          {tab === 'policy' && (
            <>
              {/* Voice-only toggle */}
              <div className="settings-block glass" style={{ borderRadius: 18, padding: 20, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
                {voiceOnly && (
                  <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2,
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Voice-only habilitado</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>Aprueba operaciones pequeñas solo con la voz</p>
                  </div>
                  <ToggleSwitch checked={voiceOnly} onChange={setVoiceOnly} />
                </div>
              </div>

              {/* Límites */}
              <div className="settings-block glass" style={{ borderRadius: 18, padding: 20, marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Límites</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <SettingsField label="Máximo por operación (SOL)" hint="Por encima → confirmación doble" value={maxPerOp} onChange={setMaxPerOp} />
                  <SettingsField label="Cap diario voice-only (SOL)" value={dailyCap} onChange={setDailyCap} />
                </div>
              </div>

              {/* Uso diario */}
              {settings && (
                <div className="settings-block glass" style={{ borderRadius: 18, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Uso hoy</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: usedPct >= 90 ? 'var(--warning)' : 'var(--text-2)' }}>
                      {settings.voiceDailyUsed.toFixed(3)} / {dailyCap} SOL
                    </p>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${usedPct}%`,
                      background: usedPct >= 90 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'var(--grad-accent)',
                      borderRadius: 99, transition: 'width 0.8s cubic-bezier(.16,1,.3,1)',
                    }} />
                  </div>
                </div>
              )}

              {error   && <FeedbackBanner type="error"   msg={error} />}
              {success && <FeedbackBanner type="success" msg="Ajustes guardados correctamente" />}

              <SaveButton saving={saving} onClick={save} />
            </>
          )}

          {tab === 'voice' && (
            <div className="settings-block glass" style={{ borderRadius: 18, padding: 24 }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Configuración de voz y TTS
              </p>
              <VoiceSettings />
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 24 }}>
          Prototipo educativo · Solana Devnet · No es asesoría financiera
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageTransition>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  function press() {
    if (!ref.current) { onClick(); return; }
    gsap.fromTo(ref.current, { scale: 0.94 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
    onClick();
  }
  return (
    <button ref={ref} onClick={press} style={{
      flex: 1, padding: '10px', borderRadius: 10, border: 'none',
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--text-3)',
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
      transition: 'background 200ms, color 200ms',
      willChange: 'transform',
    }}>
      {label}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const thumbRef = useRef<HTMLSpanElement>(null);
  function handleClick() {
    if (thumbRef.current) {
      gsap.fromTo(thumbRef.current, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: 'back.out(2.5)' });
    }
    onChange(!checked);
  }
  return (
    <button role="switch" aria-checked={checked} onClick={handleClick} style={{
      width: 48, height: 26, borderRadius: 99, border: 'none',
      background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
      cursor: 'pointer', position: 'relative', flexShrink: 0,
      boxShadow: checked ? '0 0 12px var(--accent-soft)' : 'none',
      transition: 'background 220ms, box-shadow 220ms',
    }}>
      <span ref={thumbRef} style={{
        position: 'absolute', top: 3, left: checked ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 220ms cubic-bezier(.16,1,.3,1)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        willChange: 'transform',
        display: 'block',
      }} />
    </button>
  );
}

function SettingsField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>{label}</label>
      <input ref={ref} type="number" step="0.01" min="0" value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (ref.current) gsap.to(ref.current, { boxShadow: '0 0 0 3px var(--accent-soft)', duration: 0.2 }); }}
        onBlur ={() => { if (ref.current) gsap.to(ref.current, { boxShadow: 'none', duration: 0.2 }); }}
        className="input-base"
      />
      {hint && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

function FeedbackBanner({ type, msg }: { type: 'error' | 'success'; msg: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.fromTo(ref.current, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
    return () => { t.kill(); };
  }, [msg]);
  return (
    <div ref={ref} style={{
      marginBottom: 14, padding: '12px 16px', borderRadius: 12, fontSize: 13,
      background: type === 'error' ? 'var(--danger-soft)' : 'var(--success-soft)',
      border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
      color: type === 'error' ? '#fca5a5' : '#4ade80',
    }}>
      {type === 'error' ? '⚠️' : '✅'} {msg}
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  function press() {
    if (!ref.current || saving) return;
    gsap.fromTo(ref.current, { scale: 0.96 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
    onClick();
  }
  return (
    <button ref={ref} onClick={press} disabled={saving} style={{
      width: '100%', padding: '15px', borderRadius: 14, border: 'none',
      background: saving ? 'rgba(124,58,237,0.4)' : 'var(--grad-accent)',
      color: '#fff', fontSize: 15, fontWeight: 700,
      cursor: saving ? 'not-allowed' : 'pointer',
      boxShadow: saving ? 'none' : '0 4px 20px var(--accent-glow)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'all 200ms', willChange: 'transform',
    }}>
      {saving ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          Guardando...
        </>
      ) : 'Guardar ajustes'}
    </button>
  );
}
