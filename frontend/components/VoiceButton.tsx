'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface VoiceButtonProps {
  onResult: (transcript: string, confidence: number) => void;
  onStart?: () => void;
  disabled?: boolean;
  size?: 'md' | 'lg';
}

gsap.registerPlugin();

const BAR_COUNT = 7;

export function VoiceButton({ onResult, onStart, disabled, size = 'lg' }: VoiceButtonProps) {
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

  const dim = size === 'lg' ? 96 : 72;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
  }, []);

  // ── Animaciones idle: anillos de respiración ──────────────────────────────
  useGSAP(() => {
    if (listening || processing) return;

    // Anillos pulsantes concéntricos
    ringsRef.current.forEach((ring, i) => {
      gsap.to(ring, {
        scale:   1 + (i + 1) * 0.35,
        opacity: 0,
        duration: 2.4,
        delay:    i * 0.6,
        ease:    'power2.out',
        repeat:  -1,
        repeatDelay: 0.2,
      });
    });

    // Glow respira
    gsap.to(glowRef.current, {
      opacity:  0.6,
      scale:    1.05,
      duration: 2,
      yoyo:     true,
      repeat:   -1,
      ease:    'sine.inOut',
    });
  }, { scope: containerRef, dependencies: [listening, processing] });

  // ── Animaciones escuchando: barras de waveform ────────────────────────────
  useGSAP(() => {
    if (!listening) return;

    // Matar rings
    ringsRef.current.forEach((ring) => gsap.killTweensOf(ring));
    gsap.to(ringsRef.current, { opacity: 0, scale: 1, duration: 0.2 });

    // Animar barras de audio (estilo ecualizador)
    barsRef.current.forEach((bar, i) => {
      gsap.fromTo(bar,
        { scaleY: 0.2 },
        {
          scaleY:      () => 0.3 + Math.random() * 0.7,
          duration:    () => 0.2 + Math.random() * 0.3,
          ease:       'none',
          repeat:     -1,
          yoyo:        true,
          delay:       i * 0.06,
        },
      );
    });

    // Botón pulsa suavemente
    gsap.to(btnRef.current, { scale: 1.06, duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }, { scope: containerRef, dependencies: [listening] });

  // ── Processing spinner ────────────────────────────────────────────────────
  useGSAP(() => {
    if (!processing) return;
    barsRef.current.forEach((b) => gsap.killTweensOf(b));
    gsap.to(barsRef.current, { scaleY: 0.15, opacity: 0.3, duration: 0.2 });
    gsap.to(btnRef.current, { rotation: 360, duration: 1.2, ease: 'none', repeat: -1 });
  }, { scope: containerRef, dependencies: [processing] });

  // ── Click: limpiar animaciones de procesamiento ───────────────────────────
  const cleanup = useCallback(() => {
    gsap.killTweensOf(btnRef.current);
    gsap.to(btnRef.current, { rotation: 0, scale: 1, duration: 0.3 });
    barsRef.current.forEach((b) => gsap.killTweensOf(b));
    ringsRef.current.forEach((r) => gsap.killTweensOf(r));
  }, []);

  // ── Feedback táctil al presionar ──────────────────────────────────────────
  const animatePress = useCallback(() => {
    gsap.fromTo(btnRef.current,
      { scale: 0.92 },
      { scale: 1, duration: 0.4, ease: 'back.out(3)' },
    );
  }, []);

  function toggle() {
    if (disabled || processing) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    animatePress();

    if (listening) {
      recRef.current?.stop();
      setListening(false);
      setProcessing(true);
      return;
    }

    const rec = new SR();
    rec.lang            = 'es-MX';
    rec.interimResults  = false;
    rec.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const alt = e.results[0][0];
      cleanup();
      setListening(false);
      setProcessing(false);
      onResult(alt.transcript, alt.confidence ?? 0.9);
    };
    rec.onerror  = () => { cleanup(); setListening(false); setProcessing(false); };
    rec.onend    = () => { cleanup(); setListening(false); setProcessing(false); };

    recRef.current = rec;
    rec.start();
    setListening(true);
    onStart?.();
  }

  if (!supported) {
    return (
      <p className="text-center text-xs" style={{ color: 'var(--text-3)' }}>
        Tu navegador no soporta ASR nativo — usa el campo de texto
      </p>
    );
  }

  const btnBg    = listening ? '#dc2626' : 'var(--accent)';
  const btnGlow  = listening
    ? '0 0 40px rgba(220,38,38,0.6), 0 0 80px rgba(220,38,38,0.25)'
    : '0 0 40px var(--accent-glow), 0 0 80px rgba(124,58,237,0.2)';

  return (
    <div ref={containerRef} className="relative flex flex-col items-center gap-4">
      {/* Anillos pulsantes (idle) */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={(el) => { if (el) ringsRef.current[i] = el; }}
          className="absolute rounded-full"
          style={{
            width:  dim,
            height: dim,
            border: `1px solid var(--accent)`,
            opacity: 0,
          }}
        />
      ))}

      {/* Glow halo */}
      <div
        ref={glowRef}
        className="absolute rounded-full"
        style={{
          width:  dim + 32,
          height: dim + 32,
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          opacity: 0.4,
        }}
      />

      {/* Botón principal */}
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={disabled}
        aria-label={listening ? 'Detener grabación' : 'Iniciar grabación de voz'}
        style={{
          width:      dim,
          height:     dim,
          background: btnBg,
          boxShadow:  btnGlow,
          borderRadius: '50%',
          border:     'none',
          cursor:     disabled ? 'not-allowed' : 'pointer',
          opacity:    disabled ? 0.4 : 1,
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position:   'relative',
          zIndex:     2,
          transition: 'background 300ms, box-shadow 300ms',
        }}
      >
        {/* Barras ecualizador (visible al escuchar) / ícono (idle) */}
        {listening ? (
          <div className="flex items-center gap-[3px]" style={{ height: 32 }}>
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <div
                key={i}
                ref={(el) => { if (el) barsRef.current[i] = el; }}
                style={{
                  width:           4,
                  height:          '100%',
                  background:      'white',
                  borderRadius:    2,
                  transformOrigin: 'bottom center',
                }}
              />
            ))}
          </div>
        ) : processing ? (
          <span style={{ fontSize: 28 }}>⟳</span>
        ) : (
          <svg width={dim * 0.38} height={dim * 0.38} viewBox="0 0 24 24" fill="white">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Label */}
      <span style={{ color: 'var(--text-2)', fontSize: 12, fontWeight: 500, letterSpacing: '0.05em' }}>
        {processing ? 'Procesando...' : listening ? 'Escuchando...' : 'Toca para hablar'}
      </span>
    </div>
  );
}
