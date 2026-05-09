'use client';

import {
  useState, useEffect, useRef, useCallback,
  forwardRef, useImperativeHandle,
} from 'react';
import gsap from 'gsap';

export interface VoiceButtonHandle {
  startListening: () => void;
  stopListening:  () => void;
}

interface VoiceButtonProps {
  onResult:  (transcript: string, confidence: number) => void;
  onStart?:  () => void;
  disabled?: boolean;
  size?:     'md' | 'lg';
}

const BAR_COUNT = 7;

export const VoiceButton = forwardRef<VoiceButtonHandle, VoiceButtonProps>(
  function VoiceButton({ onResult, onStart, disabled, size = 'lg' }, ref) {
    const [listening,  setListening]  = useState(false);
    const [supported,  setSupported]  = useState(false);
    const [processing, setProcessing] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const btnRef       = useRef<HTMLButtonElement>(null);
    const ringsRef     = useRef<HTMLDivElement[]>([]);
    const barsRef      = useRef<HTMLDivElement[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recRef       = useRef<any>(null);
    const glowRef      = useRef<HTMLDivElement>(null);
    // Timelines activos — para matarlos sin errores
    const tweensRef    = useRef<gsap.core.Tween[]>([]);

    const dim = size === 'lg' ? 96 : 72;

    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
    }, []);

    // ── Helpers de animación ──────────────────────────────────────────────────
    const killAll = useCallback(() => {
      tweensRef.current.forEach((t) => t?.kill());
      tweensRef.current = [];
    }, []);

    // ── Idle: anillos pulsantes ───────────────────────────────────────────────
    const startIdleAnimation = useCallback(() => {
      killAll();
      const valid = ringsRef.current.filter(Boolean);
      valid.forEach((ring, i) => {
        const t = gsap.fromTo(ring,
          { scale: 1, opacity: 0.5 },
          { scale: 1 + (i + 1) * 0.4, opacity: 0, duration: 2.2, delay: i * 0.55,
            ease: 'power2.out', repeat: -1, repeatDelay: 0.3 },
        );
        tweensRef.current.push(t);
      });
      if (glowRef.current) {
        const t = gsap.to(glowRef.current, {
          opacity: 0.55, scale: 1.06, duration: 2,
          yoyo: true, repeat: -1, ease: 'sine.inOut',
        });
        tweensRef.current.push(t);
      }
    }, [killAll]);

    // ── Escuchando: barras de waveform ────────────────────────────────────────
    const startListeningAnimation = useCallback(() => {
      killAll();
      // Ocultar rings
      ringsRef.current.filter(Boolean).forEach((r) => gsap.set(r, { opacity: 0 }));

      const validBars = barsRef.current.filter(Boolean);
      validBars.forEach((bar, i) => {
        const t = gsap.fromTo(bar,
          { scaleY: 0.2 },
          {
            scaleY: () => 0.25 + Math.random() * 0.75,
            duration: () => 0.18 + Math.random() * 0.28,
            ease: 'none', repeat: -1, yoyo: true, delay: i * 0.05,
          },
        );
        tweensRef.current.push(t);
      });
      if (btnRef.current) {
        const t = gsap.to(btnRef.current, { scale: 1.05, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        tweensRef.current.push(t);
      }
    }, [killAll]);

    // ── Activar la animación correcta según estado ────────────────────────────
    useEffect(() => {
      if (!supported) return;
      if (listening)   { startListeningAnimation(); }
      else if (!processing) { startIdleAnimation(); }
    }, [listening, processing, supported, startIdleAnimation, startListeningAnimation]);

    // ── Cleanup al desmontar ──────────────────────────────────────────────────
    useEffect(() => () => killAll(), [killAll]);

    // ── Feedback visual al presionar ──────────────────────────────────────────
    const animatePress = useCallback(() => {
      if (!btnRef.current) return;
      gsap.fromTo(btnRef.current,
        { scale: 0.9 },
        { scale: 1, duration: 0.4, ease: 'back.out(3)' },
      );
    }, []);

    // ── Iniciar reconocimiento de voz ─────────────────────────────────────────
    const startRecognition = useCallback(() => {
      if (disabled || processing) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w  = window as any;
      const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (!SR) return;

      const rec = new SR();
      rec.lang            = 'es-MX';
      rec.interimResults  = false;
      rec.maxAlternatives = 1;
      rec.continuous      = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        const alt = e.results[0][0];
        killAll();
        if (btnRef.current) gsap.to(btnRef.current, { scale: 1, rotation: 0, duration: 0.3 });
        setListening(false);
        setProcessing(false);
        onResult(alt.transcript, alt.confidence ?? 0.9);
      };
      rec.onerror  = () => { killAll(); setListening(false); setProcessing(false); };
      rec.onend    = () => { killAll(); setListening(false); setProcessing(false); };

      recRef.current = rec;
      rec.start();
      setListening(true);
      onStart?.();
    }, [disabled, processing, onResult, onStart, killAll]);

    // ── Exponer API imperativa (para auto-escuchar tras TTS) ──────────────────
    useImperativeHandle(ref, () => ({
      startListening: startRecognition,
      stopListening: () => {
        recRef.current?.stop();
        setListening(false);
      },
    }), [startRecognition]);

    // ── Toggle manual ─────────────────────────────────────────────────────────
    function toggle() {
      if (disabled || processing) return;
      animatePress();
      if (listening) {
        recRef.current?.stop();
        setListening(false);
        setProcessing(true);
      } else {
        startRecognition();
      }
    }

    if (!supported) {
      return <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
        ASR no disponible — usa el campo de texto
      </p>;
    }

    const btnBg   = listening ? '#dc2626' : 'var(--accent)';
    const btnGlow = listening
      ? '0 0 40px rgba(220,38,38,0.6), 0 0 80px rgba(220,38,38,0.2)'
      : '0 0 40px var(--accent-glow), 0 0 80px rgba(124,58,237,0.18)';

    return (
      <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* Anillos idle */}
        {[0, 1, 2].map((i) => (
          <div key={i} ref={(el) => { if (el) ringsRef.current[i] = el; }}
            style={{
              position: 'absolute', width: dim, height: dim,
              borderRadius: '50%', border: '1px solid var(--accent)',
              opacity: 0, pointerEvents: 'none',
            }}
          />
        ))}

        {/* Halo glow */}
        <div ref={glowRef} style={{
          position: 'absolute', width: dim + 36, height: dim + 36,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          opacity: 0.35, pointerEvents: 'none',
        }} />

        {/* Botón principal */}
        <button
          ref={btnRef}
          onClick={toggle}
          disabled={disabled}
          aria-label={listening ? 'Detener grabación' : 'Iniciar grabación de voz'}
          aria-pressed={listening}
          style={{
            width: dim, height: dim, borderRadius: '50%',
            background: btnBg, boxShadow: btnGlow,
            border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 2,
            transition: 'background 300ms, box-shadow 300ms',
            willChange: 'transform',
          }}
        >
          {listening ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 34 }}>
              {Array.from({ length: BAR_COUNT }).map((_, i) => (
                <div key={i} ref={(el) => { if (el) barsRef.current[i] = el; }}
                  style={{
                    width: 4, height: '100%',
                    background: 'white', borderRadius: 2,
                    transformOrigin: 'bottom center',
                  }}
                />
              ))}
            </div>
          ) : processing ? (
            <svg width={dim * 0.35} height={dim * 0.35} viewBox="0 0 24 24" fill="none"
              style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width={dim * 0.36} height={dim * 0.36} viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="13" rx="3" fill="white"/>
              <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M12 18v4M9 22h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.05em' }}>
          {processing ? 'Procesando...' : listening ? 'Escuchando...' : 'Toca para hablar'}
        </span>
      </div>
    );
  },
);
