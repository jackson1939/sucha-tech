'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface Props {
  txHash: string;
  receiptId: string;
  onDismiss: () => void;
}

export function TransactionSuccess({ txHash, receiptId, onDismiss }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const checkRef     = useRef<SVGSVGElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Contenedor entra
    tl.fromTo(containerRef.current,
      { y: 20, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' },
    );

    // 2. Checkmark se dibuja
    tl.fromTo('.check-path',
      { strokeDashoffset: 100 },
      { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.2',
    );

    // 3. Partículas explotan desde el centro
    particlesRef.current.forEach((p, i) => {
      const angle    = (i / particlesRef.current.length) * Math.PI * 2;
      const distance = 60 + Math.random() * 50;
      tl.fromTo(p,
        { x: 0, y: 0, scale: 0, opacity: 1 },
        {
          x:        Math.cos(angle) * distance,
          y:        Math.sin(angle) * distance,
          scale:    () => 0.5 + Math.random(),
          opacity:  0,
          duration: 0.8 + Math.random() * 0.4,
          ease:    'power2.out',
        },
        0.3,
      );
    });

    // 4. Filas de texto con stagger
    tl.from('.success-row', {
      y: 8, opacity: 0,
      stagger: 0.08,
      duration: 0.35,
      ease: 'power2.out',
    }, '-=0.3');

    // 5. Pulso final del glow
    tl.to('.success-glow', {
      opacity: 0.8,
      scale:   1.3,
      duration: 0.4,
      yoyo:    true,
      repeat:  1,
      ease:   'sine.inOut',
    }, '-=0.2');

  }, { scope: containerRef });

  const COLORS = ['#7c3aed', '#2563eb', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];
  const PARTICLE_COUNT = 16;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        borderRadius: 'var(--r-lg)',
        border: '1px solid rgba(34,197,94,0.3)',
        background: 'rgba(34,197,94,0.06)',
        backdropFilter: 'blur(16px)',
        padding: '28px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Línea glow top */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
        background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
      }} />

      {/* Partículas de celebración */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { if (el) particlesRef.current[i] = el; }}
            style={{
              position: 'absolute',
              width:  6,
              height: 6,
              borderRadius: '50%',
              background: COLORS[i % COLORS.length],
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Glow central */}
      <div
        className="success-glow"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 120, height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />

      {/* Ícono de check */}
      <div className="success-row" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          border: '2px solid rgba(34,197,94,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(34,197,94,0.3)',
        }}>
          <svg
            ref={checkRef}
            width="28" height="28" viewBox="0 0 24 24" fill="none"
          >
            <path
              className="check-path"
              d="M5 13l4 4L19 7"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="100"
              strokeDashoffset="100"
            />
          </svg>
        </div>
      </div>

      <div className="success-row" style={{ textAlign: 'center', marginBottom: 4 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>
          ✅ Operación enviada
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
          Confirmada en Solana Devnet
        </p>
      </div>

      {/* TX Hash */}
      <div className="success-row" style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 'var(--r-sm)',
        padding: '10px 14px',
        marginTop: 16, marginBottom: 8,
      }}>
        <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          TX Hash
        </p>
        <p style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#818cf8',
          wordBreak: 'break-all',
        }}>
          {txHash}
        </p>
      </div>

      <div className="success-row" style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <button
          onClick={onDismiss}
          style={{
            padding: '10px 24px',
            borderRadius: 99,
            background: 'transparent',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#4ade80',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Nueva operación
        </button>
      </div>
    </div>
  );
}
