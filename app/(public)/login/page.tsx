'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ThemeToggle }    from '@frontend/components/ThemeToggle';
import { ParticleCanvas } from '@frontend/components/ParticleCanvas';
import { MagneticButton } from '@frontend/components/MagneticButton';
import { PageTransition } from '@frontend/components/PageTransition';

export default function LoginPage() {
  const [mode,     setMode]     = useState<'login' | 'register'>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const router  = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Panel izquierdo
    tl.from(leftRef.current,  { x: -50, opacity: 0, duration: 0.9 })
    // Logo glow
      .from(logoRef.current, { scale: 0.5, opacity: 0, duration: 0.6, ease: 'back.out(2)' }, '-=0.5')
    // Card derecha
      .from(cardRef.current,  { x: 50, opacity: 0, duration: 0.85 }, '-=0.55')
    // Form fields
      .from('.login-field',   { y: 18, opacity: 0, stagger: 0.1, duration: 0.45 }, '-=0.4');

    // Logo pulsing continuo
    if (logoRef.current) {
      gsap.to(logoRef.current, {
        filter: 'drop-shadow(0 0 28px rgba(124,58,237,0.9))',
        scale: 1.05, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1,
      });
    }

    return () => { tl.kill(); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setError(null); setLoading(true);
    // Animación de envío
    gsap.to(cardRef.current, { scale: 0.98, duration: 0.15, yoyo: true, repeat: 1 });
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    router.push('/dashboard');
  }

  function handleDemo() {
    gsap.timeline()
      .to(cardRef.current, { scale: 0.95, opacity: 0.7, duration: 0.2 })
      .to(cardRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)',
          onComplete: () => router.push('/dashboard') });
  }

  return (
    <PageTransition style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <LoginBg />

      {/* ── Panel izquierdo (branding) ─────────────────────────────────── */}
      <div ref={leftRef} className="login-left" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', position: 'relative', zIndex: 1,
        borderRight: '1px solid var(--border)',
      }}>
        {/* Partículas interactivas en el panel izquierdo */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <ParticleCanvas count={40} interactive connectDist={100} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Logo animado */}
          <div ref={logoRef} style={{
            fontSize: 72, marginBottom: 24,
            filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.6))',
            display: 'inline-block',
          }}>
            🎙️
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 900,
            letterSpacing: '-0.04em', marginBottom: 14,
            background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Vibe Broker
          </h1>

          <p style={{
            fontSize: 16, color: 'var(--text-2)', textAlign: 'center',
            maxWidth: 320, lineHeight: 1.7, marginBottom: 48,
          }}>
            El primer asistente de voz para DeFi en Solana. Habla, confirma y opera.
          </p>

          {/* Mini feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 290 }}>
            {[
              ['🎙️', 'Opera con tu voz en español'],
              ['🔐', 'Non-custodial, firmas locales'],
              ['⚡', 'Rutas óptimas con LI.FI'],
              ['◎',  'Construido sobre Solana'],
            ].map(([icon, text]) => (
              <FeatureRow key={text} icon={icon} text={text} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ─────────────────────────────────── */}
      <div style={{
        flex: 1, maxWidth: 520, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 32px', position: 'relative', zIndex: 1,
      }}>
        <div ref={cardRef} style={{
          width: '100%', maxWidth: 400,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          borderRadius: 24, padding: '40px 36px',
          boxShadow: 'var(--shadow-card)',
        }}>
          {/* Header */}
          <div className="login-field" style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 14, filter: 'drop-shadow(0 0 12px var(--accent-glow))' }}>🎙️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 5 }}>
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {mode === 'login' ? 'Inicia sesión para operar' : 'Empieza a operar con tu voz'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="login-field" style={{
            display: 'flex', gap: 4, padding: 4,
            background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 24,
          }}>
            {(['login','register'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(null); }} style={{
                flex: 1, padding: '9px', borderRadius: 9, border: 'none',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-3)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
              }}>
                {m === 'login' ? 'Entrar' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="login-field">
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com" required className="input-base" />
            </div>
            <div className="login-field">
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} className="input-base" />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: 'var(--danger-soft)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="login-field">
              <MagneticButton onClick={() => {}} style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: loading ? 'rgba(124,58,237,0.4)' : 'var(--grad-accent)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px var(--accent-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? (
                  <><SpinIcon /> Entrando...</>
                ) : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'}
              </MagneticButton>
            </div>
          </form>

          {/* Divider */}
          <div className="login-field" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>o continúa con</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Wallet buttons */}
          <div className="login-field" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <WalletBtn icon="👻" name="Phantom" />
            <WalletBtn icon="🔥" name="Solflare" />
          </div>

          {/* Demo */}
          <button className="login-field" onClick={handleDemo} style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: '1px dashed var(--border)',
            background: 'transparent', color: 'var(--text-3)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            🚀 Modo demo (sin registro)
          </button>

          <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 20 }}>
            Prototipo educativo · Solana Devnet · No es asesoría financiera
          </p>
        </div>
      </div>

      {/* Controles flotantes */}
      <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 200, display: 'flex', gap: 10 }}>
        <ThemeToggle size="sm" />
      </div>
      <Link href="/" style={{
        position: 'fixed', top: 20, left: 24, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 99,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        textDecoration: 'none', color: 'var(--text-3)', fontSize: 12, fontWeight: 500,
        transition: 'all 150ms',
      }}>
        ← Inicio
      </Link>

      <style>{`@media (max-width: 768px) { .login-left { display: none !important; } }`}</style>
    </PageTransition>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}
      onMouseEnter={() => { if (ref.current) gsap.to(ref.current, { x: 4, duration: 0.2, ease: 'power2.out' }); }}
      onMouseLeave={() => { if (ref.current) gsap.to(ref.current, { x: 0, duration: 0.3, ease: 'power2.out' }); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', borderRadius: 12,
        background: 'var(--bg-glass)', border: '1px solid var(--border)',
        fontSize: 13, color: 'var(--text-2)', cursor: 'default',
        backdropFilter: 'blur(8px)',
      }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      {text}
    </div>
  );
}

function WalletBtn({ icon, name }: { icon: string; name: string }) {
  return (
    <button style={{
      flex: 1, padding: '11px 8px', borderRadius: 12,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 6, transition: 'all 150ms',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.color = 'var(--text-1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
      onClick={() => alert(`${name} Wallet — integración con Solana Wallet Adapter`)}
    >
      {icon} {name}
    </button>
  );
}

function SpinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function LoginBg() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 55% at 30% 10%, rgba(124,58,237,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 80% 90%, rgba(37,99,235,0.12) 0%, transparent 50%)',
        transition: 'background 400ms',
      }} />
    </div>
  );
}
