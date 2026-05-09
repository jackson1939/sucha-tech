'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP }              from '@gsap/react';
import gsap                      from 'gsap';
import { AnimatedBackground }    from '@frontend/components/AnimatedBackground';
import type { OrderRow }         from '@/types';

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

  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (loading) return;
    gsap.from('.order-card', {
      y: 20, opacity: 0, stagger: 0.08, duration: 0.45, ease: 'power2.out', delay: 0.15,
    });
  }, { scope: pageRef, dependencies: [loading] });

  useEffect(() => {
    fetch(`/api/orders?userId=${USER_ID}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setError('No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AnimatedBackground />
      <div ref={pageRef} style={{ position: 'relative', zIndex: 1, padding: '24px 20px 40px' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              📋 Historial
            </span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Últimas operaciones en Devnet
          </p>
        </header>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spinner />
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#fca5a5' }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="glass animate-fade-up" style={{
            borderRadius: 'var(--r-lg)', padding: '48px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, filter: 'grayscale(0.5)' }}>🌱</div>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>Aún no hay operaciones</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Realiza tu primer swap en la pantalla de Inicio.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map((o) => {
            const s    = STATUS_MAP[o.status] ?? STATUS_MAP.pending;
            const date = new Date(o.created_at).toLocaleString('es', { dateStyle:'short', timeStyle:'short' });
            return (
              <OrderCard key={o.id} order={o} statusConf={s} date={date} />
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 28 }}>
          Prototipo educativo · No es asesoría financiera
        </p>
      </div>
    </>
  );
}

function OrderCard({ order: o, statusConf: s, date }: {
  order: OrderRow;
  statusConf: { label: string; color: string; bg: string; border: string };
  date: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="order-card glass"
      onMouseEnter={() => gsap.to(cardRef.current, { y: -2, duration: 0.2, ease: 'power2.out' })}
      onMouseLeave={() => gsap.to(cardRef.current, { y:  0, duration: 0.2, ease: 'power2.out' })}
      style={{ borderRadius: 'var(--r-lg)', padding: '18px 20px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Accent line */}
      <div style={{ position:'absolute', left:0, top:'15%', bottom:'15%', width:2, borderRadius:99, background: s.color, opacity:0.6 }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, paddingLeft:12 }}>
        <div>
          <p style={{ fontWeight:700, fontSize:15, color:'var(--text-1)', marginBottom:3 }}>
            {o.token_from} → {o.token_to}
          </p>
          <p style={{ fontSize:11, color:'var(--text-3)' }}>{date}</p>
        </div>
        <span style={{
          padding:'4px 10px', borderRadius:99,
          background: s.bg, border:`1px solid ${s.border}`,
          fontSize:11, fontWeight:600, color:s.color,
        }}>
          {s.label}
        </span>
      </div>

      <div style={{ paddingLeft:12, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, color:'var(--text-3)' }}>Monto</span>
          <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--text-2)' }}>
            {Number(o.amount).toFixed(6)} {o.token_from}
          </span>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text-3)' }}>Confirmación</span>
          <span style={{
            padding:'3px 8px', borderRadius:99, fontSize:11, fontWeight:600,
            background: o.confirmation_type==='voice' ? 'var(--accent-soft)' : 'rgba(239,68,68,0.1)',
            color: o.confirmation_type==='voice' ? '#a78bfa' : '#fca5a5',
          }}>
            {o.confirmation_type==='voice' ? '🎙️ Voz' : '🔐 Doble'}
          </span>
        </div>

        {o.tx_hash && (
          <div>
            <p style={{ fontSize:10, color:'var(--text-3)', marginBottom:3 }}>TX Hash</p>
            <p style={{ fontSize:11, fontFamily:'monospace', color:'#818cf8', wordBreak:'break-all' }}>
              {o.tx_hash}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.9s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
