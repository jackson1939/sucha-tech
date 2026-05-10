'use client';
import { useState, useRef, useCallback } from 'react';
import gsap from 'gsap';

interface Props {
  onModeChange: (auto: boolean) => void;
  speak?: (text: string) => Promise<void>;
}

export function AutoModeSwitch({ onModeChange, speak }: Props) {
  const [auto, setAuto] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);

  function openDisclaimer() {
    setShowDisclaimer(true);
    requestAnimationFrame(() => {
      if (modalRef.current) {
        gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
      }
    });
    speak?.('Modo autónomo detectado. Este modo permite que el bot ejecute operaciones automáticamente. ¿Confirmas que entiendes los riesgos y autorizas el control total?');
  }

  const accept = useCallback(() => {
    setShowDisclaimer(false);
    setAuto(true);
    onModeChange(true);
    if (switchRef.current) {
      gsap.fromTo(switchRef.current, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.5)' });
    }
    speak?.('Modo autónomo activado. Operaré con control total. Puedes desactivarlo en cualquier momento.');
  }, [onModeChange, speak]);

  function reject() {
    setShowDisclaimer(false);
  }

  function toggle() {
    if (auto) {
      setAuto(false);
      onModeChange(false);
      speak?.('Modo autónomo desactivado. Volveremos al flujo normal de confirmación.');
    } else {
      openDisclaimer();
    }
  }

  return (
    <>
      <button ref={switchRef} onClick={toggle} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
        background: auto ? 'linear-gradient(135deg, #dc2626, #9333ea)' : 'var(--bg-elevated)',
        color: auto ? '#fff' : 'var(--text-2)',
        fontSize: 12, fontWeight: 700,
        boxShadow: auto ? '0 0 20px rgba(220,38,38,0.4)' : 'none',
        transition: 'all 300ms',
      }}>
        <span style={{ fontSize: 14 }}>{auto ? '🤖' : '🧠'}</span>
        {auto ? 'AUTO' : 'Manual'}
        <div style={{
          width: 28, height: 16, borderRadius: 99,
          background: auto ? 'rgba(255,255,255,0.3)' : 'var(--border)',
          position: 'relative', transition: 'background 300ms',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: auto ? 14 : 2, width: 12, height: 12,
            borderRadius: '50%', background: auto ? '#fff' : 'var(--text-3)',
            transition: 'left 250ms ease',
          }} />
        </div>
      </button>

      {showDisclaimer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div ref={modalRef} style={{
            background: 'var(--bg-card)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: 20, padding: 28, maxWidth: 380, width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚡</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
                Modo Autónomo
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                En este modo el bot ejecutará operaciones <strong style={{ color: '#f87171' }}>sin pedir confirmación individual</strong> para cada transacción dentro de los límites de tu política.
              </p>
            </div>

            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.6 }}>
                ⚠️ <strong>Advertencia:</strong> Operaciones en Devnet únicamente. Nunca compartas tu clave privada. Este prototipo educativo no es asesoría financiera.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Al activar confirmo que:</p>
              {[
                'Entiendo que el bot opera de forma autónoma',
                'Solo opera en Solana Devnet (fondos de prueba)',
                'Puedo desactivar el modo en cualquier momento',
                'No excederá los límites de mi política de voz',
              ].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--success)', fontSize: 14 }}>✓</span> {r}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={reject} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--text-2)', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              }}>Cancelar</button>
              <button onClick={accept} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #dc2626, #9333ea)', color: '#fff',
                cursor: 'pointer', fontWeight: 700, fontSize: 14,
              }}>✓ Activar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
