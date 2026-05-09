'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { SimulateResponse } from '@/types';

export function SimulationCard({ simulation }: { simulation: SimulateResponse }) {
  const { quote, fees, requiresDoubleConfirmation, asrConfidence, route, latencyMs } = simulation;
  const pct   = Math.round(asrConfidence * 100);
  const isOk  = pct >= 80;
  const cardRef = useRef<HTMLDivElement>(null);

  // Entrada dramática con GSAP
  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { y: 32, opacity: 0, scale: 0.96 },
        { y: 0,  opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.4)' },
      );

      gsap.from('.sim-row', {
        y: 12, opacity: 0,
        stagger: 0.07,
        delay: 0.2,
        duration: 0.4,
        ease: 'power2.out',
      });

      // Animar la barra de confidence
      gsap.fromTo('.conf-fill',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, delay: 0.5, ease: 'power2.out', transformOrigin: 'left center' },
      );

      // Animar número: estimatedReceive
      const amountEl = cardRef.current?.querySelector('.receive-amount');
      if (amountEl) {
        const target = parseFloat(quote.estimatedReceive);
        gsap.fromTo({ val: 0 }, { val: target }, {
          duration: 0.9,
          delay: 0.3,
          ease: 'power2.out',
          onUpdate() { amountEl.textContent = (this as unknown as { targets: () => { val: number }[] }).targets()[0].val.toFixed(6); },
        });
      }
    }, cardRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={cardRef}
      className="glass"
      style={{
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Línea glow superior */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        opacity: 0.6,
      }} />

      {/* Header: par de tokens */}
      <div className="sim-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
        <TokenPill symbol={quote.from} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 40, height: 1, background: 'var(--grad-accent)', opacity: 0.6 }} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-2)' }} />
          </svg>
          <div style={{ width: 40, height: 1, background: 'var(--grad-accent)', opacity: 0.6 }} />
        </div>
        <TokenPill symbol={quote.to} />
      </div>

      {/* Montos */}
      <div className="sim-row" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 16,
      }}>
        <AmountBox label="Envías" value={quote.amount} symbol={quote.from} muted />
        <AmountBox label="Recibes ~" value={quote.estimatedReceive} symbol={quote.to} className="receive-amount" highlight />
      </div>

      {/* Fees */}
      <div className="sim-row" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 'var(--r-sm)',
        marginBottom: 14,
      }}>
        <FeeItem label="Red" value={fees.network} />
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <FeeItem label="Protocolo" value={fees.protocol} />
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <FeeItem label="Vía" value={route.provider} />
      </div>

      {/* Badge de política */}
      <div className="sim-row" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <PolicyBadge double={requiresDoubleConfirmation} />
      </div>

      {/* Confidence meter */}
      <div className="sim-row">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Confianza ASR
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: isOk ? 'var(--success)' : 'var(--warning)' }}>
            {pct}%
          </span>
        </div>
        <div style={{
          height: 4, borderRadius: 99,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div
            className="conf-fill"
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 99,
              background: isOk
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, #f59e0b, #d97706)',
            }}
          />
        </div>
      </div>

      <p style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-3)', marginTop: 10 }}>
        Latencia {latencyMs}ms
      </p>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function TokenPill({ symbol }: { symbol: string }) {
  return (
    <div style={{
      padding: '6px 14px',
      background: 'var(--accent-soft)',
      border: '1px solid var(--border-glow)',
      borderRadius: 99,
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text-1)',
      letterSpacing: '0.03em',
    }}>
      {symbol}
    </div>
  );
}

function AmountBox({ label, value, symbol, highlight, muted, className }: {
  label: string; value: string; symbol: string;
  highlight?: boolean; muted?: boolean; className?: string;
}) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)',
      borderRadius: 'var(--r-sm)',
      padding: '12px 14px',
      textAlign: 'center',
      border: '1px solid var(--border-soft)',
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
      <p
        className={className}
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: highlight ? '#4ade80' : muted ? 'var(--text-2)' : 'var(--text-1)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{symbol}</p>
    </div>
  );
}

function FeeItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{value}</p>
    </div>
  );
}

function PolicyBadge({ double }: { double: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      borderRadius: 99,
      background: double ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.15)',
      border: `1px solid ${double ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.35)'}`,
      fontSize: 13,
      fontWeight: 600,
      color: double ? '#fca5a5' : '#c4b5fd',
    }}>
      {double ? '🔐' : '🎙️'}
      {double ? 'Confirmación doble requerida' : 'Voice-only eligible'}
    </div>
  );
}
