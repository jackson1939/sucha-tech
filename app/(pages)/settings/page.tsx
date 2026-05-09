'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP }         from '@gsap/react';
import gsap                 from 'gsap';
import { AnimatedBackground } from '@frontend/components/AnimatedBackground';
import { useSpeech }        from '@frontend/hooks/useSpeech';
import type { UserSettings } from '@/types';

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

  const pageRef   = useRef<HTMLDivElement>(null);
  const { speak } = useSpeech();

  // Entrada de página
  useGSAP(() => {
    gsap.from('.settings-card', {
      y: 20, opacity: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out', delay: 0.2,
    });
  }, { scope: pageRef, dependencies: [loading] });

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

  const usedPct = settings ? Math.min((settings.voiceDailyUsed / (+dailyCap || 1)) * 100, 100) : 0;

  if (loading) return (
    <>
      <AnimatedBackground />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Spinner />
      </div>
    </>
  );

  return (
    <>
      <AnimatedBackground />
      <div ref={pageRef} style={{ position: 'relative', zIndex: 1, padding: '24px 20px 40px' }}>

        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ⚙️ Ajustes
            </span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Política de confirmación por voz
          </p>
        </header>

        {/* Voice-only toggle */}
        <div className="settings-card glass" style={{ borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: voiceOnly ? 'linear-gradient(90deg, transparent, var(--accent), transparent)' : 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Voice-only habilitado</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                Aprueba operaciones pequeñas solo con la voz
              </p>
            </div>
            <ToggleSwitch checked={voiceOnly} onChange={setVoiceOnly} />
          </div>
        </div>

        {/* Límites */}
        <div className="settings-card glass" style={{ borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Límites</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SettingsField
              label="Máximo por operación (SOL)"
              hint="Por encima de este valor se exige confirmación doble"
              value={maxPerOp}
              onChange={setMaxPerOp}
            />
            <SettingsField
              label="Cap diario voice-only (SOL)"
              value={dailyCap}
              onChange={setDailyCap}
            />
          </div>
        </div>

        {/* Uso diario */}
        {settings && (
          <div className="settings-card glass" style={{ borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Uso hoy</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: usedPct >= 90 ? 'var(--warning)' : 'var(--text-2)' }}>
                {settings.voiceDailyUsed.toFixed(3)} / {dailyCap} SOL
              </p>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${usedPct}%`,
                background: usedPct >= 90 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'var(--grad-accent)',
                borderRadius: 99,
                transition: 'width 0.6s cubic-bezier(.16,1,.3,1)',
              }} />
            </div>
          </div>
        )}

        {/* Feedback */}
        {error   && <div className="animate-fade-up" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#fca5a5' }}>⚠️ {error}</div>}
        {success && <div className="animate-fade-up" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--success-soft)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 13, color: '#4ade80' }}>✅ Ajustes guardados</div>}

        {/* Guardar */}
        <button
          onClick={save}
          disabled={saving}
          style={{
            width: '100%', padding: '16px',
            borderRadius: 'var(--r-md)',
            background: saving ? 'rgba(124,58,237,0.5)' : 'var(--grad-accent)',
            border: 'none', color: '#fff',
            fontSize: 16, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: saving ? 'none' : '0 4px 24px var(--accent-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 200ms',
          }}
        >
          {saving ? <><Spinner small /> Guardando...</> : 'Guardar ajustes'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 20 }}>
          Prototipo educativo · Solana Devnet · No es asesoría financiera
        </p>
      </div>
    </>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 26, borderRadius: 99, border: 'none',
        background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        boxShadow: checked ? '0 0 12px var(--accent-soft)' : 'none',
        transition: 'background 200ms, box-shadow 200ms',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff',
        transition: 'left 200ms cubic-bezier(.16,1,.3,1)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function SettingsField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>{label}</label>
      <input
        type="number" step="0.01" min="0" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base"
      />
      {hint && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{hint}</p>}
    </div>
  );
}

function Spinner({ small }: { small?: boolean }) {
  const s = small ? 16 : 32;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
