'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatedBackground } from '@frontend/components/AnimatedBackground';
import { PageTransition }     from '@frontend/components/PageTransition';
import type { OrderRow }       from '@/types';

gsap.registerPlugin(ScrollTrigger);

const USER_ID = 'demo';
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  submitted: { label:'Enviado',    color:'#818cf8', bg:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.25)'  },
  confirmed: { label:'Confirmado', color:'#4ade80', bg:'rgba(34,197,94,0.12)',   border:'rgba(34,197,94,0.25)'   },
  failed:    { label:'Fallido',    color:'#fca5a5', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)'   },
  cancelled: { label:'Cancelado',  color:'#94a3b8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.15)' },
  pending:   { label:'Pendiente',  color:'#fbbf24', bg:'rgba(251,191,36,0.1)',   border:'rgba(251,191,36,0.2)'   },
};

export default function HistoryPage() {
  const [orders,  setOrders]  = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const listRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/orders?userId=${USER_ID}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setError('No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, []);

  // Animar cards cuando cargan
  useEffect(() => {
    if (loading || !listRef.current) return;
    const cards = Array.from(listRef.current.querySelectorAll<HTMLElement>('.order-card'));
    if (!cards.length) return;

    cards.forEach((card, i) => {
      const t = gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        x: i % 2 === 0 ? -20 : 20,
        opacity: 0, duration: 0.5,
        delay: Math.min(i * 0.05, 0.3),
        ease: 'power2.out',
      });
      return () => { t.kill(); };
    });

    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, [loading, orders]);

  return (
    <PageTransition style={{ position: 'relative', zIndex: 1 }}>
      <AnimatedBackground />
      <div style={{ padding: '24px 20px 40px' }}>

        {/* Header animado */}
        <PageHeader title="📋 Historial" sub="Últimas operaciones en Devnet" />

        {loading && <LoadingSpinner />}

        {error && (
          <div className="animate-fade-up" style={{
            padding: '12px 16px', borderRadius: 12,
            background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 13, color: '#fca5a5',
          }}>⚠️ {error}</div>
        )}

        {!loading && !error && orders.length === 0 && <EmptyState />}

        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map((o) => {
            const s = STATUS_MAP[o.status] ?? STATUS_MAP.pending;
            const date = new Date(o.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
            return <OrderCard key={o.id} order={o} s={s} date={date} />;
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 28 }}>
          Prototipo educativo · No es asesoría financiera
        </p>
      </div>
    </PageTransition>
  );
}

// ── Componentes internos ──────────────────────────────────────────────────────

function PageHeader({ title, sub }: { title: string; sub: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.from(ref.current, { y: -16, opacity: 0, duration: 0.55, ease: 'power2.out' });
    return () => { t.kill(); };
  }, []);
  return (
    <header ref={ref} style={{ marginBottom: 22 }}>
      <h1 style={{
        fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em',
        background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{title}</h1>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{sub}</p>
    </header>
  );
}

function EmptyState() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.fromTo(ref.current,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.4)' },
    );
    return () => { t.kill(); };
  }, []);
  return (
    <div ref={ref} className="glass" style={{ borderRadius: 20, padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 14, filter: 'grayscale(0.4)', animation: 'breathe 3s ease-in-out infinite' }}>🌱</div>
      <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>Aún no hay operaciones</p>
      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Realiza tu primer swap en la pantalla de Inicio.</p>
    </div>
  );
}

function OrderCard({ order: o, s, date }: {
  order: OrderRow;
  s: { label: string; color: string; bg: string; border: string };
  date: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="order-card glass" style={{ borderRadius: 18, padding: '18px 20px', position: 'relative', overflow: 'hidden', willChange: 'transform' }}
      onMouseEnter={() => { if (ref.current) gsap.to(ref.current, { y: -3, scale: 1.01, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', duration: 0.22, ease: 'power2.out' }); }}
      onMouseLeave={() => { if (ref.current) gsap.to(ref.current, { y: 0, scale: 1, boxShadow: 'none', duration: 0.3, ease: 'power2.out' }); }}
    >
      {/* Accent line */}
      <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: '0 3px 3px 0', background: s.color, opacity: 0.7 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingLeft: 14 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 3 }}>{o.token_from} → {o.token_to}</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{date}</p>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
          {s.label}
        </span>
      </div>

      <div style={{ paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row label="Monto" value={`${Number(o.amount).toFixed(6)} ${o.token_from}`} mono />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Confirmación</span>
          <span style={{
            padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
            background: o.confirmation_type === 'voice' ? 'var(--accent-soft)' : 'rgba(239,68,68,0.1)',
            color: o.confirmation_type === 'voice' ? '#a78bfa' : '#fca5a5',
          }}>
            {o.confirmation_type === 'voice' ? '🎙️ Voz' : '🔐 Doble'}
          </span>
        </div>
        {o.tx_hash && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>TX Hash</p>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#818cf8', wordBreak: 'break-all' }}>{o.tx_hash}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
