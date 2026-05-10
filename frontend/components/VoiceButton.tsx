'use client';

import {
  useState, useEffect, useRef, useCallback,
  forwardRef, useImperativeHandle,
} from 'react';
import gsap from 'gsap';

// ── Tipos públicos ────────────────────────────────────────────────────────────
export interface VoiceButtonHandle {
  startListening: () => void;
  stopListening:  () => void;
}

interface VoiceButtonProps {
  onResult:   (transcript: string, confidence: number) => void;
  /** Transcripción en tiempo real mientras el usuario habla */
  onInterim?: (text: string) => void;
  onStart?:   () => void;
  disabled?:  boolean;
  size?:      'md' | 'lg';
}

const BAR_COUNT      = 7;
const MAX_LISTEN_SEC = 10;
const CIRCUMFERENCE  = 2 * Math.PI * 42; // radio 42 del SVG ring

// ══════════════════════════════════════════════════════════════════════════════
export const VoiceButton = forwardRef<VoiceButtonHandle, VoiceButtonProps>(
  function VoiceButton({ onResult, onInterim, onStart, disabled, size = 'lg' }, ref) {

    const [listening,   setListening]   = useState(false);
    const [supported,   setSupported]   = useState(false);
    const [processing,  setProcessing]  = useState(false);
    const [timeLeft,    setTimeLeft]    = useState(MAX_LISTEN_SEC);
    const [interimText, setInterimText] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);
    const btnRef       = useRef<HTMLButtonElement>(null);
    const ringsRef     = useRef<HTMLDivElement[]>([]);
    const barsRef      = useRef<HTMLDivElement[]>([]);
    const ringArcRef   = useRef<SVGCircleElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recRef       = useRef<any>(null);
    const glowRef      = useRef<HTMLDivElement>(null);
    const tweensRef    = useRef<gsap.core.Tween[]>([]);
    const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

    const dim = size === 'lg' ? 96 : 72;

    // ── Detección de soporte ASR ──────────────────────────────────────────────
    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
    }, []);

    // ── Anillo SVG de cuenta regresiva ────────────────────────────────────────
    useEffect(() => {
      if (!ringArcRef.current) return;
      const progress = timeLeft / MAX_LISTEN_SEC;
      ringArcRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
      // Morado → naranja → rojo según tiempo restante
      const hue = progress > 0.5 ? 262 : progress > 0.25 ? 30 : 0;
      ringArcRef.current.style.stroke = `hsl(${hue},90%,65%)`;
    }, [timeLeft]);

    // ── Helpers de animación GSAP ─────────────────────────────────────────────
    const killAll = useCallback(() => {
      tweensRef.current.forEach((t) => t?.kill());
      tweensRef.current = [];
    }, []);

    const startIdleAnimation = useCallback(() => {
      killAll();
      const rings = ringsRef.current.filter(Boolean);
      rings.forEach((ring, i) => {
        const t = gsap.fromTo(ring,
          { scale: 1, opacity: 0.5 },
          { scale: 1 + (i + 1) * 0.4, opacity: 0, duration: 2.2,
            delay: i * 0.55, ease: 'power2.out', repeat: -1, repeatDelay: 0.3 },
        );
        tweensRef.current.push(t);
      });
      if (glowRef.current) {
        const t = gsap.to(glowRef.current, { opacity: 0.55, scale: 1.06, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        tweensRef.current.push(t);
      }
    }, [killAll]);

    const startListeningAnimation = useCallback(() => {
      killAll();
      ringsRef.current.filter(Boolean).forEach((r) => gsap.set(r, { opacity: 0 }));
      barsRef.current.filter(Boolean).forEach((bar, i) => {
        const t = gsap.fromTo(bar,
          { scaleY: 0.2 },
          { scaleY: () => 0.25 + Math.random() * 0.75, duration: () => 0.18 + Math.random() * 0.28,
            ease: 'none', repeat: -1, yoyo: true, delay: i * 0.05 },
        );
        tweensRef.current.push(t);
      });
      if (btnRef.current) {
        const t = gsap.to(btnRef.current, { scale: 1.05, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        tweensRef.current.push(t);
      }
    }, [killAll]);

    useEffect(() => {
      if (!supported) return;
      if (listening)        startListeningAnimation();
      else if (!processing) startIdleAnimation();
    }, [listening, processing, supported, startIdleAnimation, startListeningAnimation]);

    useEffect(() => () => killAll(), [killAll]);

    const animatePress = useCallback(() => {
      if (!btnRef.current) return;
      gsap.fromTo(btnRef.current, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
    }, []);

    // ── Timers de escucha ─────────────────────────────────────────────────────
    const clearTimers = useCallback(() => {
      if (timeoutRef.current)  clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutRef.current = null; intervalRef.current = null;
    }, []);

    const resetState = useCallback(() => {
      clearTimers();
      setInterimText('');
      setTimeLeft(MAX_LISTEN_SEC);
      if (btnRef.current) { gsap.killTweensOf(btnRef.current); gsap.to(btnRef.current, { rotation: 0, scale: 1, duration: 0.3 }); }
      barsRef.current.forEach((b) => gsap.killTweensOf(b));
      ringsRef.current.forEach((r) => gsap.killTweensOf(r));
    }, [clearTimers]);

    // ── Iniciar reconocimiento de voz ─────────────────────────────────────────
    const startRecognition = useCallback(() => {
      if (disabled || processing) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w  = window as any;
      const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (!SR) return;

      const rec = new SR();
      rec.lang            = navigator.language.startsWith('es') ? navigator.language : 'es-MX';
      rec.interimResults  = true;   // transcripción en tiempo real
      rec.continuous      = false;
      rec.maxAlternatives = 3;      // toma la alternativa de mayor confianza

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        const result = e.results[e.results.length - 1];
        if (!result.isFinal) {
          const interim = result[0].transcript;
          setInterimText(interim);
          onInterim?.(interim);
          return;
        }
        // Resultado final: elegir la alternativa de mayor confianza
        let best = result[0];
        for (let i = 1; i < result.length; i++) {
          if ((result[i].confidence ?? 0) > (best.confidence ?? 0)) best = result[i];
        }
        resetState();
        setListening(false);
        setProcessing(false);
        onResult(best.transcript, best.confidence ?? 0.9);
      };

      rec.onspeechend = () => { recRef.current?.stop(); };
      rec.onerror     = () => { resetState(); setListening(false); setProcessing(false); };
      rec.onend       = () => { resetState(); setListening(false); setProcessing(false); };

      recRef.current = rec;
      rec.start();
      setListening(true);
      setTimeLeft(MAX_LISTEN_SEC);
      onStart?.();

      // Cuenta regresiva visual
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);

      // Timeout de seguridad: para el ASR si el usuario no habla
      timeoutRef.current = setTimeout(() => {
        recRef.current?.stop();
        resetState();
        setListening(false);
        setProcessing(false);
      }, MAX_LISTEN_SEC * 1000);

    }, [disabled, processing, onResult, onInterim, onStart, resetState]);

    // ── Exponer API imperativa para TTS→ASR secuencial ───────────────────────
    useImperativeHandle(ref, () => ({
      startListening: startRecognition,
      stopListening:  () => {
        recRef.current?.stop();
        clearTimers();
        setListening(false);
      },
    }), [startRecognition, clearTimers]);

    // ── Toggle manual ─────────────────────────────────────────────────────────
    function toggle() {
      if (disabled || processing) return;
      animatePress();
      if (listening) {
        recRef.current?.stop();
        clearTimers();
        setListening(false);
        setProcessing(true);
        setInterimText('');
        setTimeLeft(MAX_LISTEN_SEC);
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
    const label = processing
      ? 'Procesando...'
      : listening
        ? `Escuchando… ${timeLeft < MAX_LISTEN_SEC ? `${timeLeft}s` : ''}`
        : 'Toca para hablar';

    return (
      <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

        {/* Anillos pulsantes (idle) */}
        {[0, 1, 2].map((i) => (
          <div key={i} ref={(el) => { if (el) ringsRef.current[i] = el; }}
            style={{ position: 'absolute', width: dim, height: dim, borderRadius: '50%', border: '1px solid var(--accent)', opacity: 0, pointerEvents: 'none' }}
          />
        ))}

        {/* Halo glow */}
        <div ref={glowRef} style={{
          position: 'absolute', width: dim + 36, height: dim + 36, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          opacity: 0.35, pointerEvents: 'none',
        }} />

        {/* Botón + anillo SVG de countdown */}
        <div style={{ position: 'relative', width: dim + 16, height: dim + 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {listening && (
            <svg width={dim + 16} height={dim + 16} viewBox="0 0 100 100"
              style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle ref={ringArcRef} cx="50" cy="50" r="42" fill="none" strokeWidth="3" strokeLinecap="round"
                style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: 0, transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
              />
            </svg>
          )}

          <button ref={btnRef} onClick={toggle} disabled={disabled}
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
                    style={{ width: 4, height: '100%', background: 'white', borderRadius: 2, transformOrigin: 'bottom center' }}
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
        </div>

        {/* Transcripción en tiempo real */}
        {interimText && listening && (
          <div style={{
            maxWidth: 260, padding: '6px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic', textAlign: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            {interimText}
          </div>
        )}

        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
    );
  },
);
