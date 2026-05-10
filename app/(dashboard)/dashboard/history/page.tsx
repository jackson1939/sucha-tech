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
  submitted: { label: 'Enviado',    color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)'  },
  confirmed: { label: 'Confirmado', color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)'   },
  failed:    { label: 'Fallido',    color: '#fca5a5', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
  cancelled: { label: 'Cancelado',  color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.18)' },
  pending:   { label: 'Pendiente',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)' },
};

const CHAIN_COLOR: Record<string, string> = {
  SOL:'#9945FF', ETH:'#627EEA', BTC:'#F7931A',
  USDC:'#2775CA', MATIC:'#8247E5', AVAX:'#E84142', BNB:'#F3BA2F', ARB:'#12AAFF',
};

export default function HistoryPage() {
  const [orders,  setOrders]  = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/orders?userId=${USER_ID}`)
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
      .catch(() => setError('No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, []);

  // Header entrance
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const t = gsap.fromTo(el, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', clearProps: 'transform,opacity' });
    return () => { gsap.set(el, { clearProps: 'all' }); t.kill(); };
  }, []);

  // Cards entrance when data loads
  useEffect(() => {
    if (loading || !listRef.current) return;
    const cards = Array.from(listRef.current.querySelectorAll<HTMLElement>('.order-card'));
    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { x: i % 2 === 0 ? -24 : 24, opacity: 0 },
        {
          scrollTrigger: { trigger: card, start: 'top 90%', once: true },
          x: 0, opacity: 1, duration: 0.5, delay: Math.min(i * 0.06, 0.28),
          ease: 'power2.out', clearProps: 'transform,opacity',
        },
      );
    });
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, [loading, orders]);

  return (
    <PageTransition style={{ position: 'relative', zIndex: 1 }}>
      <AnimatedBackground />
      <div style={{ padding: '16px 16px 40px' }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div ref={headerRef} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--accent-soft)', border: '1px solid var(--border-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>📋</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Historial
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Últimas operaciones en Devnet</p>
            </div>
          </div>

          {/* Stats strip */}
          {!loading && orders.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {[
                { label: 'Total', val: orders.length },
                { label: 'Confirmadas', val: orders.filter(o => o.status === 'confirmed').length },
                { label: 'Pendientes',  val: orders.filter(o => o.status === 'pending' || o.status === 'submitted').length },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 12,
                  background: 'var(--bg-glass)', border: '1px solid var(--border)',
                  backdropFilter: 'blur(12px)', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{s.val}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Cargando historial…</p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#fca5a5', animation: 'fade-up 0.35s ease both' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────────────────── */}
        {!loading && !error && orders.length === 0 && <EmptyState />}

        {/* ── List ────────────────────────────────────────────────────── */}
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map((o, idx) => (
            <OrderCard key={o.id} order={o} idx={idx} />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 32 }}>
          Prototipo educativo · No es asesoría financiera
        </p>
      </div>
    </PageTransition>
  );
}

// ── Componentes ──────────────────────────────────────────────────────────────

function EmptyState() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.fromTo(ref.current, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
    return () => { t.kill(); };
  }, []);
  return (
    <div ref={ref} style={{ borderRadius: 24, padding: '52px 28px', textAlign: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}>
      <div style={{ fontSize: 52, marginBottom: 16, animation: 'breathe 3s ease-in-out infinite' }}>🌱</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Sin operaciones aún</p>
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
        Realiza tu primer swap en la pantalla de Inicio.<br />Aparecerá aquí con todos los detalles.
      </p>
    </div>
  );
}

function OrderCard({ order: o, idx }: { order: OrderRow; idx: number }) {
  const ref  = useRef<HTMLDivElement>(null);
  const s    = STATUS_MAP[o.status] ?? STATUS_MAP.pending;
  const date = new Date(o.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  const colFrom = CHAIN_COLOR[o.token_from] ?? 'var(--accent)';
  const colTo   = CHAIN_COLOR[o.token_to]   ?? 'var(--accent-2)';

  return (
    <div ref={ref} className="order-card" style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'var(--bg-glass)', border: '1px solid var(--border)',
      backdropFilter: 'blur(16px)', position: 'relative',
      willChange: 'transform', transition: 'border-color 200ms, box-shadow 200ms',
    }}
    onMouseEnter={() => { if (ref.current) { ref.current.style.borderColor = 'var(--border-glow)'; gsap.to(ref.current, { y: -3, boxShadow: '0 12px 32px rgba(124,58,237,0.15)', duration: 0.22, ease: 'power2.out' }); } }}
    onMouseLeave={() => { if (ref.current) { ref.current.style.borderColor = 'var(--border)'; gsap.to(ref.current, { y: 0, boxShadow: 'none', duration: 0.28, ease: 'power2.out' }); } }}
    >
      {/* Top gradient accent */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${colFrom}, ${colTo})`,
        opacity: 0.8,
      }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Row 1: tokens + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TokenBadge sym={o.token_from} col={colFrom} />
              <span style={{ fontSize: 16, color: 'var(--text-3)' }}>→</span>
              <TokenBadge sym={o.token_to} col={colTo} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
              {o.token_from} → {o.token_to}
            </span>
          </div>
          <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
            {s.label}
          </span>
        </div>

        {/* Row 2: amount + date + confirmation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: o.tx_hash ? 10 : 0 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-1)' }}>
              {Number(o.amount).toFixed(4)} {o.token_from}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{date}</p>
          </div>
          <span style={{
            padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
            background: o.confirmation_type === 'voice' ? 'var(--accent-soft)' : 'rgba(239,68,68,0.1)',
            color: o.confirmation_type === 'voice' ? '#a78bfa' : '#fca5a5',
            border: `1px solid ${o.confirmation_type === 'voice' ? 'var(--border-glow)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {o.confirmation_type === 'voice' ? '🎙 Voz' : '🔐 Doble'}
          </span>
        </div>

        {/* Row 3: TX hash */}
        {o.tx_hash && (
          <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-soft)', marginTop: 4 }}>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>TX Hash</p>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#818cf8', wordBreak: 'break-all', lineHeight: 1.4 }}>{o.tx_hash}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenBadge({ sym, col }: { sym: string; col: string }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%',
      background: `${col}22`, border: `1px solid ${col}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontWeight: 800, color: col, fontFamily: 'monospace',
    }}>
      {sym.slice(0, 2)}
    </div>
  );
}
