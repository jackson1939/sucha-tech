'use client';

import { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface Props {
  open: boolean;
  requiresDouble: boolean;
  onConfirm: (pin?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmationModal({ open, requiresDouble, onConfirm, onCancel, loading }: Props) {
  const [pin, setPin]     = useState('');
  const overlayRef        = useRef<HTMLDivElement>(null);
  const cardRef           = useRef<HTMLDivElement>(null);
  const pinInputRef       = useRef<HTMLInputElement>(null);

  // Entrada con GSAP
  useGSAP(() => {
    if (!open) return;
    const tl = gsap.timeline();

    // Overlay fade in
    tl.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' },
    );

    // Card sube con spring
    tl.fromTo(cardRef.current,
      { y: 60, opacity: 0, scale: 0.94 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' },
      '-=0.15',
    );

    // Filas internas con stagger
    tl.from('.modal-row', {
      y: 10, opacity: 0,
      stagger: 0.07,
      duration: 0.35,
      ease: 'power2.out',
    }, '-=0.2');

    // Focus en PIN si aplica
    if (requiresDouble) {
      setTimeout(() => pinInputRef.current?.focus(), 500);
    }
  }, { dependencies: [open] });

  // Salida rápida
  function handleCancel() {
    const tl = gsap.timeline({ onComplete: onCancel });
    tl.to(cardRef.current,  { y: 40, opacity: 0, scale: 0.95, duration: 0.25, ease: 'power2.in' });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.1');
    setPin('');
  }

  // PIN display — puntos o dígitos
  const pinDisplay = pin.length > 0
    ? '•'.repeat(pin.length).split('').join(' ')
    : '';

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={(e) => { if (e.target === overlayRef.current) handleCancel(); }}
    >
      <div
        ref={cardRef}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--bg-card)',
          borderTopLeftRadius: 'var(--r-xl)',
          borderTopRightRadius: 'var(--r-xl)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          padding: '32px 28px 40px',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Línea glow superior */}
        <div style={{
          position: 'absolute', top: 0, left: '25%', right: '25%', height: 2,
          background: requiresDouble
            ? 'linear-gradient(90deg, transparent, #ef4444, transparent)'
            : 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          borderRadius: 99,
        }} />

        {/* Handle */}
        <div style={{
          width: 36, height: 4,
          background: 'var(--border)',
          borderRadius: 99,
          margin: '0 auto 24px',
        }} />

        {/* Ícono */}
        <div className="modal-row" style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: requiresDouble ? 'rgba(239,68,68,0.12)' : 'var(--accent-soft)',
            border: `1px solid ${requiresDouble ? 'rgba(239,68,68,0.3)' : 'var(--border-glow)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px',
          }}>
            {requiresDouble ? '🔐' : '🎙️'}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
            {requiresDouble ? 'Confirmación doble' : 'Confirmar operación'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {requiresDouble
              ? 'Por seguridad, ingresa tu PIN de 6 dígitos y presiona Firmar.'
              : 'La operación está lista. Confirma para enviarla a Solana Devnet.'}
          </p>
        </div>

        {/* PIN Input */}
        {requiresDouble && (
          <div className="modal-row" style={{ marginTop: 24, marginBottom: 8 }}>
            {/* Display visual del PIN */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: `1px solid ${pin.length >= 4 ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--r-md)',
              padding: '16px',
              textAlign: 'center',
              fontSize: 28,
              fontFamily: 'monospace',
              letterSpacing: '0.3em',
              color: 'var(--text-1)',
              marginBottom: 12,
              minHeight: 64,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: pin.length >= 4 ? '0 0 0 3px var(--accent-soft)' : 'none',
              transition: 'border-color 200ms, box-shadow 200ms',
            }}>
              {pinDisplay || <span style={{ color: 'var(--text-3)', fontSize: 16 }}>Ingresa tu PIN</span>}
            </div>

            {/* Input real (oculto visualmente pero funcional) */}
            <input
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pin.length >= 4) onConfirm(pin);
                if (e.key === 'Escape') handleCancel();
              }}
              style={{
                position: 'absolute', left: -9999, opacity: 0, pointerEvents: 'none',
              }}
            />

            {/* Teclado numérico visual */}
            <NumPad value={pin} onChange={setPin} onClear={() => setPin('')} />
          </div>
        )}

        {/* Botones */}
        <div className="modal-row" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 'var(--r-md)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
          >
            Cancelar
          </button>

          <button
            onClick={() => onConfirm(requiresDouble ? pin : undefined)}
            disabled={loading || (requiresDouble && pin.length < 4)}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: 'var(--r-md)',
              background: loading ? 'rgba(124,58,237,0.5)' : 'var(--grad-accent)',
              border: 'none',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: (loading || (requiresDouble && pin.length < 4)) ? 'not-allowed' : 'pointer',
              opacity: (loading || (requiresDouble && pin.length < 4)) ? 0.6 : 1,
              boxShadow: '0 4px 20px var(--accent-glow)',
              transition: 'all 150ms',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <Spinner /> Enviando...
              </>
            ) : (
              requiresDouble ? '🔑 Firmar' : '✓ Confirmar'
            )}
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 10,
          color: 'var(--text-3)',
          marginTop: 20,
        }}>
          Prototipo educativo · No es asesoría financiera · Solo Devnet
        </p>
      </div>
    </div>
  );
}

// ── Teclado numérico visual ───────────────────────────────────────────────────
function NumPad({ value, onChange, onClear }: { value: string; onChange: (v: string) => void; onClear: () => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];

  function press(k: string) {
    if (k === '⌫') { onChange(value.slice(0, -1)); return; }
    if (k === '✓') return;
    if (value.length >= 6) return;
    onChange(value + k);
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    }}>
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => press(k)}
          style={{
            padding: '14px 8px',
            borderRadius: 'var(--r-sm)',
            background: k === '✓' ? 'var(--accent-soft)' : k === '⌫' ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: k === '✓' ? 'var(--accent)' : k === '⌫' ? '#fca5a5' : 'var(--text-1)',
            fontSize: k === '⌫' || k === '✓' ? 18 : 20,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 100ms',
          }}
          onMouseDown={(e) => {
            gsap.fromTo(e.currentTarget, { scale: 0.9 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' });
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin-slow 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
