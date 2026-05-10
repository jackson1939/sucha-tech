'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThemeToggle }      from '@frontend/components/ThemeToggle';
import { ParticleCanvas }   from '@frontend/components/ParticleCanvas';
import { MagneticButton }   from '@frontend/components/MagneticButton';
import { CounterStat }      from '@frontend/components/CounterStat';
import { useTheme }         from '@frontend/components/ThemeProvider';

gsap.registerPlugin(ScrollTrigger);

// ── Datos ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🎙️', title: 'Solo habla',      desc: 'Di "compra 0.1 SOL" o "swap USDC por ETH" y el asistente lo entiende, simula y ejecuta.',  color: '#7c3aed' },
  { icon: '⚡',  title: 'Rutas óptimas',   desc: 'LI.FI encuentra automáticamente la mejor ruta cross-chain con el menor fee y slippage.',    color: '#2563eb' },
  { icon: '🔐', title: 'Non-custodial',    desc: 'Tus claves nunca salen del dispositivo. Firmas localmente. Nosotros solo orquestamos.',     color: '#059669' },
];
const STEPS = [
  { n: '01', title: 'Di tu orden',          desc: 'Habla o escribe en lenguaje natural. El bot entiende español e inglés con alta precisión.' },
  { n: '02', title: 'Revisa la simulación', desc: 'El bot te narra la ruta, fees y slippage antes de confirmar. Tú decides.' },
  { n: '03', title: 'Confirma y firma',     desc: 'Di "confirmar" o ingresa tu PIN. La tx se firma localmente, nunca sale del dispositivo.' },
];
const STATS = [
  { value: '20+',    label: 'Redes soportadas' },
  { value: '500+',   label: 'Tokens disponibles' },
  { value: '30',     label: 'Segundos máx. de ejecución' },
  { value: '0',      label: '% Fondos en custodia' },
];
const PROBLEMS = [
  { prob: 'No entiendo cómo funciona DeFi', sol: 'Solo di qué quieres hacer. El bot traduce a lenguaje blockchain.', icon: '😕' },
  { prob: 'Las UIs de DeFi son aterradoras', sol: 'Cero botones confusos. Cero formularios. Solo tu voz.', icon: '😰' },
  { prob: 'Miedo a perder fondos por error', sol: 'El bot narra cada paso antes de ejecutar. Tú siempre confirmas.', icon: '😨' },
  { prob: 'No sé qué exchange o bridge usar', sol: 'LI.FI encuentra automáticamente la mejor ruta con menor fee.', icon: '🤔' },
];

const PARTNERS = [
  { name: 'Solana', sym: '◎' }, { name: 'LI.FI', sym: '⬡' },
  { name: 'ElevenLabs', sym: '🔊' }, { name: 'Anchor', sym: '⚓' },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const heroRef  = useRef<HTMLElement>(null);
  const featRef  = useRef<HTMLElement>(null);
  const probRef  = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const lineRef  = useRef<HTMLDivElement>(null);
  const partRef  = useRef<HTMLElement>(null);
  const ctaRef   = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── 1. Hero — animación directa sobre las dos líneas del título ──────
      // NOTE: NO tocamos innerHTML — los spans tienen gradiente con
      // -webkit-text-fill-color:transparent; corromper el HTML los vuelve
      // invisibles en light mode. Animamos los spans directamente.
      const titleSpans = heroRef.current?.querySelectorAll('.hero-title > span');
      if (titleSpans?.length) {
        gsap.from(titleSpans, {
          y: 48, opacity: 0, rotateX: 12,
          transformOrigin: 'top center',
          stagger: 0.18, duration: 0.8,
          ease: 'power3.out', delay: 0.2,
          clearProps: 'transform,opacity',
        });
      }

      // ── 2. Subheadline — fade + slide (sin blur: no hace clearProps limpio) ─
      gsap.fromTo('.hero-sub',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.75, delay: 0.62, ease: 'power2.out', clearProps: 'transform,opacity' },
      );

      // ── 3. Pills + CTAs — stagger slide ───────────────────────────────────
      gsap.from('.hero-pill',   { y: 18, opacity: 0, stagger: 0.08, duration: 0.5,  delay: 0.95, ease: 'back.out(1.5)', clearProps: 'transform,opacity' });
      gsap.from('.hero-cta',    { scale: 0.88, opacity: 0, stagger: 0.1, duration: 0.55, delay: 1.2,  ease: 'back.out(1.7)', clearProps: 'transform,opacity' });
      gsap.from('.hero-viz',    { y: 32, opacity: 0, duration: 0.9, delay: 1.35, ease: 'back.out(1.2)', clearProps: 'transform,opacity' });
      gsap.from('.hero-badge',  { y: -20, opacity: 0, duration: 0.6, delay: 0.05, ease: 'power2.out',  clearProps: 'transform,opacity' });

      // ── 4. Features — scroll reveal con hover 3D ──────────────────────────
      if (featRef.current) {
        gsap.from(featRef.current.querySelectorAll('.feat-card'), {
          scrollTrigger: { trigger: featRef.current, start: 'top 76%' },
          y: 40, opacity: 0, stagger: 0.13, duration: 0.65, ease: 'power2.out',
        });
      }

      // ── 5. Problems — scroll reveal ───────────────────────────────────
      if (probRef.current) {
        gsap.from(probRef.current.querySelectorAll('.prob-card'), {
          scrollTrigger: { trigger: probRef.current, start: 'top 78%' },
          y: 36, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out',
        });
      }

      // ── 6. Steps — línea se dibuja + pulsación ────────────────────────────
      if (lineRef.current) {
        gsap.fromTo(lineRef.current,
          { scaleY: 0, transformOrigin: 'top center' },
          {
            scrollTrigger: { trigger: stepsRef.current, start: 'top 72%', end: 'bottom 60%', scrub: 1 },
            scaleY: 1,
          },
        );
      }
      if (stepsRef.current) {
        stepsRef.current.querySelectorAll('.step-item').forEach((el, i) => {
          gsap.from(el, {
            scrollTrigger: { trigger: el, start: 'top 82%', once: true },
            x: -30, opacity: 0, duration: 0.6, delay: i * 0.05, ease: 'power2.out',
          });
          gsap.from(el.querySelector('.step-num'), {
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
            scale: 0, opacity: 0, duration: 0.5, delay: i * 0.05 + 0.1, ease: 'back.out(2)',
          });
        });
      }

      // ── 6. Partners ───────────────────────────────────────────────────────
      if (partRef.current) {
        gsap.from(partRef.current.querySelectorAll('.partner-chip'), {
          scrollTrigger: { trigger: partRef.current, start: 'top 85%' },
          y: 16, opacity: 0, stagger: 0.07, duration: 0.45, ease: 'back.out(1.4)',
        });
      }

      // ── 7. CTA final — glow pulse continuo ───────────────────────────────
      if (ctaRef.current) {
        gsap.from(ctaRef.current.querySelector('.cta-inner'), {
          scrollTrigger: { trigger: ctaRef.current, start: 'top 82%' },
          y: 32, opacity: 0, scale: 0.96, duration: 0.7, ease: 'power2.out',
        });
        const glowEl = ctaRef.current.querySelector('.cta-glow');
        if (glowEl) {
          gsap.to(glowEl, { opacity: 0.6, scale: 1.08, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        }
      }

    });

    return () => { ctx.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', minHeight: '100vh' }}>
      <LandingBg />
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '110px 24px 60px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Partículas sólo en el hero */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <ParticleCanvas count={50} interactive connectDist={120} />
        </div>

        {/* Badge */}
        <div className="hero-badge" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 99, marginBottom: 32, position: 'relative',
          background: 'var(--accent-soft)', border: '1px solid var(--border-glow)',
          fontSize: 12, fontWeight: 700, color: 'var(--accent)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
            boxShadow: '0 0 8px #22c55e', display: 'inline-block', animation: 'breathe 2s infinite' }} />
          Hackathon Project · Solana Devnet · LI.FI
        </div>

        {/* Headline — GSAP split por palabras */}
        <h1 className="hero-title" style={{
          fontSize: 'clamp(38px, 8vw, 78px)', fontWeight: 900,
          lineHeight: 1.06, letterSpacing: '-0.04em', marginBottom: 28,
          maxWidth: 800, position: 'relative',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, var(--text-1) 0%, #a78bfa 55%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            El Alexa de las
          </span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            transacciones Web3
          </span>
        </h1>

        {/* Subheadline */}
        <p className="hero-sub" style={{
          fontSize: 'clamp(16px, 2.4vw, 20px)', color: 'var(--text-1)',
          opacity: 0.8, lineHeight: 1.7, maxWidth: 580, marginBottom: 36, fontWeight: 400,
        }}>
          Habla, confirma y ejecuta swaps cross-chain en Solana.
          Seguridad <strong style={{ opacity: 1, fontWeight: 700 }}>non-custodial</strong>,
          rutas óptimas con <strong style={{ opacity: 1, fontWeight: 700 }}>LI.FI</strong> y
          voz con <strong style={{ opacity: 1, fontWeight: 700 }}>ElevenLabs</strong>.
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
          {[['🎙️','Voice-First'],['⛓️','Cross-Chain'],['🔐','Non-Custodial'],['◎','Solana']].map(([icon, text]) => (
            <span key={text} className="hero-pill" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 99,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 600, color: 'var(--text-2)',
            }}>
              {icon} {text}
            </span>
          ))}
        </div>

        {/* CTAs con efecto magnético */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className="hero-cta">
            <MagneticButton href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '15px 32px', borderRadius: 14, textDecoration: 'none',
              background: 'var(--grad-accent)', color: '#fff',
              fontSize: 16, fontWeight: 700,
              boxShadow: '0 6px 28px var(--accent-glow)',
            }}>
              Entrar a la app →
            </MagneticButton>
          </div>
          <div className="hero-cta">
            <MagneticButton href="#how" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 32px', borderRadius: 14, textDecoration: 'none',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-1)', fontSize: 16, fontWeight: 600,
            }}>
              Cómo funciona ↓
            </MagneticButton>
          </div>
        </div>

        {/* Network viz */}
        <div className="hero-viz" style={{ marginTop: 64, width: '100%', maxWidth: 520 }}>
          <NetworkViz />
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section ref={featRef} style={{
        padding: '80px 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1,
      }}>
        <SectionLabel>¿Por qué Vibe Broker?</SectionLabel>
        <h2 style={h2Style}>La DeFi al alcance de tu voz</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20, marginTop: 48,
        }}>
          {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ────────────────────────────────────────────── */}
      <section ref={probRef} style={{
        padding: '80px 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1,
      }}>
        <SectionLabel>¿Por qué Vibe Broker?</SectionLabel>
        <h2 style={h2Style}>Resolvemos los mayores miedos de DeFi</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20, marginTop: 48,
        }}>
          {PROBLEMS.map((p) => (
            <div key={p.prob} className="prob-card" style={{
              padding: '24px 22px', borderRadius: 18,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', lineHeight: 1.5 }}>{p.prob}</p>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 16, color: 'var(--success)', flexShrink: 0 }}>✓</span>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{p.sol}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" ref={stepsRef} style={{
        padding: '80px 24px', maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1,
      }}>
        <SectionLabel>Flujo de operación</SectionLabel>
        <h2 style={h2Style}>Tres pasos, una transacción</h2>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 48, position: 'relative' }}>
          {/* Línea animada por scroll */}
          <div ref={lineRef} style={{
            position: 'absolute', left: 27, top: 44, bottom: 44, width: 2,
            background: 'linear-gradient(180deg, var(--accent), var(--accent-2), transparent)',
            opacity: 0.7, transformOrigin: 'top center',
          }} />

          {STEPS.map((s, i) => (
            <div key={s.n} className="step-item" style={{
              display: 'flex', gap: 24, alignItems: 'flex-start',
              paddingBottom: i < STEPS.length - 1 ? 44 : 0,
            }}>
              <div className="step-num" style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-soft)', border: '2px solid var(--border-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: 'var(--accent)', zIndex: 1,
                boxShadow: 'var(--shadow-glow)',
              }}>
                {s.n}
              </div>
              <div style={{ paddingTop: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS — CounterStat ────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
          {STATS.map((s, i) => (
            <CounterStat key={s.label} value={s.value} label={s.label} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ── BUILT WITH ────────────────────────────────────────────────────── */}
      <section ref={partRef} style={{ padding: '40px 24px', maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
          Construido con
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          {PARTNERS.map((p) => (
            <div key={p.name} className="partner-chip" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 99,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              fontSize: 14, fontWeight: 600, color: 'var(--text-2)',
            }}>
              <span style={{ fontSize: 18 }}>{p.sym}</span> {p.name}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section ref={ctaRef} style={{ padding: '80px 24px 120px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="cta-inner" style={{
          maxWidth: 560, margin: '0 auto',
          padding: '60px 32px', borderRadius: 32,
          background: 'var(--bg-glass)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-glow)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow pulsante */}
          <div className="cta-glow" style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, var(--accent-soft) 0%, transparent 70%)',
            opacity: 0.4, pointerEvents: 'none',
          }} />
          {/* Partículas en el CTA */}
          <ParticleCanvas count={20} interactive={false} connectDist={80} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <img src="/sucha-logo.jpg" alt="Sucha-Tech" style={{
              width: 80, height: 80, borderRadius: 20, objectFit: 'cover',
              marginBottom: 20, boxShadow: '0 0 40px rgba(124,58,237,0.5)',
              border: '2px solid rgba(124,58,237,0.4)',
            }} />
            <h2 style={{ ...h2Style, marginBottom: 16 }}>¿Listo para operar con tu voz?</h2>
            <p style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 36, lineHeight: 1.7 }}>
              Únete al futuro de las finanzas descentralizadas. Sin curva de aprendizaje.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <MagneticButton href="/dashboard" style={{
                display: 'inline-block', padding: '15px 32px', borderRadius: 14,
                textDecoration: 'none', background: 'var(--grad-accent)',
                color: '#fff', fontSize: 16, fontWeight: 700,
                boxShadow: '0 8px 32px var(--accent-glow)',
              }}>
                Empezar ahora →
              </MagneticButton>
              <MagneticButton href="/login" style={{
                display: 'inline-block', padding: '15px 32px', borderRadius: 14,
                textDecoration: 'none', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', color: 'var(--text-2)',
                fontSize: 16, fontWeight: 600,
              }}>
                Crear cuenta
              </MagneticButton>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 40 }}>
          Prototipo educativo · Solana Devnet · No es asesoría financiera
        </p>
      </section>
    </div>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────────────────────

function PublicNav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,5,15,0.88)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(124,58,237,0.2)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo Sucha-Tech */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/sucha-logo.jpg" alt="Sucha-Tech" style={{
            width: 38, height: 38, borderRadius: 10,
            objectFit: 'cover',
            boxShadow: '0 0 14px rgba(124,58,237,0.5)',
            border: '1px solid rgba(124,58,237,0.4)',
          }} />
          <div>
            <p style={{
              fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1,
              background: 'linear-gradient(135deg,#60a5fa,#a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>SUCHA-TECH</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>DeFi AI Project</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle size="sm" />
          <Link href="/login" style={{
            padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
          }}>Entrar</Link>
          <Link href="/dashboard" style={{
            padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
            background: 'var(--grad-accent)', color: '#fff',
            fontSize: 13, fontWeight: 700, boxShadow: '0 2px 12px var(--accent-glow)',
          }}>App →</Link>
        </div>
      </div>
    </nav>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.14em',
      color: 'var(--accent)', background: 'var(--accent-soft)',
      border: '1px solid var(--border-glow)', borderRadius: 99,
      padding: '4px 14px', marginBottom: 16,
    }}>{children}</p>
  );
}

const h2Style: React.CSSProperties = {
  fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800,
  letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.18,
};

function FeatureCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  function enter() {
    if (!ref.current || !iconRef.current) return;
    ref.current.style.borderColor = `${color}55`;
    gsap.to(ref.current,  { y: -5, boxShadow: `0 12px 40px ${color}20`, duration: 0.25, ease: 'power2.out' });
    gsap.to(iconRef.current, { scale: 1.15, rotate: 5, duration: 0.25, ease: 'back.out(2)' });
  }
  function leave() {
    if (!ref.current || !iconRef.current) return;
    ref.current.style.borderColor = '';
    gsap.to(ref.current,  { y: 0, boxShadow: 'none', duration: 0.35, ease: 'power2.out' });
    gsap.to(iconRef.current, { scale: 1, rotate: 0, duration: 0.35, ease: 'power2.out' });
  }

  return (
    <div ref={ref} className="feat-card glass" style={{
      padding: '28px 24px', borderRadius: 20, cursor: 'default',
      transition: 'border-color 200ms', willChange: 'transform',
    }}
      onMouseEnter={enter} onMouseLeave={leave}
    >
      <div ref={iconRef} style={{
        width: 52, height: 52, borderRadius: 14,
        background: `${color}18`, border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, marginBottom: 18, boxShadow: `0 0 16px ${color}15`,
        willChange: 'transform',
      }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

function NetworkViz() {
  const { theme }  = useTheme();
  const svgRef     = useRef<SVGSVGElement>(null);

  const nodes = [
    { id:'sol',  x:200, y:130, label:'◎ SOL', r:22, color:'#9945FF' },
    { id:'usdc', x:80,  y:220, label:'USDC',  r:16, color:'#2775CA' },
    { id:'eth',  x:320, y:80,  label:'ETH',   r:16, color:'#627EEA' },
    { id:'lifi', x:200, y:285, label:'LI.FI', r:18, color:'#00D2FF' },
    { id:'btc',  x:340, y:215, label:'BTC',   r:14, color:'#F7931A' },
    { id:'bnb',  x:70,  y:100, label:'BNB',   r:13, color:'#F3BA2F' },
  ];
  const edges = [[0,1],[0,2],[0,3],[3,1],[3,4],[2,4],[5,0],[5,1]];

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const tweens: gsap.core.Tween[] = [];

    nodes.forEach((n, i) => {
      const el = svg.querySelector(`#nviz-${n.id}`) as SVGGElement | null;
      if (!el) return;
      tweens.push(gsap.to(el, {
        y: gsap.utils.random(-7, 7), x: gsap.utils.random(-5, 5),
        duration: 3 + i * 0.4, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }));
    });

    // Pulsos a lo largo de los bordes
    svg.querySelectorAll<SVGCircleElement>('.nviz-pulse').forEach((p, i) => {
      const line = svg.querySelectorAll<SVGLineElement>('.nviz-line')[i];
      if (!line) return;
      const x1 = parseFloat(line.getAttribute('x1') ?? '0');
      const y1 = parseFloat(line.getAttribute('y1') ?? '0');
      const x2 = parseFloat(line.getAttribute('x2') ?? '0');
      const y2 = parseFloat(line.getAttribute('y2') ?? '0');
      gsap.set(p, { attr: { cx: x1, cy: y1 }, opacity: 0 });
      tweens.push(gsap.timeline({ repeat: -1, delay: i * 0.5 })
        .to(p, { opacity: 1, duration: 0.15 })
        .to(p, { attr: { cx: x2, cy: y2 }, duration: 1.8 + Math.random(), ease: 'none' }, '<')
        .to(p, { opacity: 0, duration: 0.15 })
        .set(p, { attr: { cx: x1, cy: y1 } }) as unknown as gsap.core.Tween,
      );
    });

    return () => { tweens.forEach((t) => t.kill()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDark   = theme === 'dark';
  const lineCol  = isDark ? 'rgba(124,58,237,0.22)' : 'rgba(109,40,217,0.18)';
  const bgFill   = isDark ? 'rgba(124,58,237,0.06)' : 'rgba(109,40,217,0.05)';

  return (
    <div style={{ borderRadius: 24, padding: '14px 0', background: bgFill, border: '1px solid var(--border-glow)', position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas count={18} interactive={false} connectDist={70} />
      <svg ref={svgRef} viewBox="0 0 420 340" style={{ width: '100%', height: 'auto', position: 'relative', zIndex: 1 }}>
        {edges.map(([a, b], i) => {
          const na = nodes[a], nb = nodes[b];
          return (
            <g key={i}>
              <line className="nviz-line" x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={lineCol} strokeWidth="1.2" />
              <circle className="nviz-pulse" r="3.5" fill="#a78bfa" cx={na.x} cy={na.y} />
            </g>
          );
        })}
        {nodes.map((n) => (
          <g key={n.id} id={`nviz-${n.id}`}>
            <circle cx={n.x} cy={n.y} r={n.r + 10} fill={n.color} opacity="0.07" />
            <circle cx={n.x} cy={n.y} r={n.r} fill={`${n.color}22`} stroke={n.color} strokeWidth="1.5" />
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fontWeight="700" fill={n.color} fontFamily="monospace">{n.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace', zIndex: 2 }}>
        Rutas en tiempo real · Devnet
      </div>
    </div>
  );
}

function LandingBg() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>

      {/* ── Banner Sucha-Tech como fondo base ──────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/sucha-banner.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        opacity: isDark ? 0.28 : 0.15,
        transition: 'opacity 400ms ease',
      }} />

      {/* ── Overlay oscuro para mantener legibilidad ───────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isDark
          ? 'linear-gradient(180deg, rgba(5,5,15,0.72) 0%, rgba(5,5,15,0.45) 40%, rgba(5,5,15,0.72) 100%)'
          : 'linear-gradient(180deg, rgba(240,242,255,0.82) 0%, rgba(240,242,255,0.65) 40%, rgba(240,242,255,0.82) 100%)',
        transition: 'background 400ms ease',
      }} />

      {/* ── Radiales de acento sobre el banner ─────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isDark
          ? 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124,58,237,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 90%, rgba(37,99,235,0.16) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 100% 65% at 50% -5%, rgba(109,40,217,0.14) 0%, transparent 52%), radial-gradient(ellipse 70% 50% at 90% 95%, rgba(29,78,216,0.10) 0%, transparent 50%)',
        transition: 'background 400ms ease',
      }} />

      {/* ── Grid sutil ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(109,40,217,0.04)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(109,40,217,0.04)'} 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />
    </div>
  );
}
