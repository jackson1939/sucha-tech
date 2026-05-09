'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface VoiceButtonProps {
  onResult:    (transcript: string, confidence: number) => void;
  onInterim?:  (text: string) => void;
  onStart?:    () => void;
  disabled?:   boolean;
  size?:       'md' | 'lg';
}

gsap.registerPlugin();

const BAR_COUNT      = 7;
const MAX_LISTEN_SEC = 10;   // timeout máximo de escucha
const CIRCUMFERENCE  = 2 * Math.PI * 42; // radio 42 del SVG ring

export function VoiceButton({ onResult, onInterim, onStart, disabled, size = 'lg' }: VoiceButtonProps) {
  const [listening,    setListening]    = useState(false);
  const [supported,    setSupported]    = useState(false);
  const [processing,   setProcessing]   = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(MAX_LISTEN_SEC);
  const [interimText,  setInterimText]  = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef       = useRef<HTMLButtonElement>(null);
  const ringsRef     = useRef<HTMLDivElement[]>([]);
  const barsRef      = useRef<HTMLDivElement[]>([]);
  const ringArcRef   = useRef<SVGCircleElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef       = useRef<any>(null);
  const glowRef      = useRef<HTMLDivElement>(null);
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const dim = size === 'lg' ? 96 : 72;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
  }, []);

  // Anillo de cuenta regresiva SVG
  useEffect(() => {
    if (!ringArcRef.current) return;
    const progress = timeLeft / MAX_LISTEN_SEC;
    ringArcRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
    // Cambia de morado → naranja → rojo según tiempo restante
    const hue = progress > 0.5 ? 262 : progress > 0.25 ? 30 : 0;
    ringArcRef.current.style.stroke = `hsl(${hue}, 90%, 65%)`;
  }, [timeLeft]);

  // ── Animaciones idle: anillos de respiración ──────────────────────────────
  useGSAP(() => {
    if (listening || processing) return;
    const rings = ringsRef.current.filter(Boolean);
    if (!rings.length || !glowRef.current) return;

    rings.forEach((ring, i) => {
      gsap.to(ring, {
        scale:       1 + (i + 1) * 0.35,
        opacity:     0,
        duration:    2.4,
        delay:       i * 0.6,
        ease:        'power2.out',
        repeat:      -1,
        repeatDelay: 0.2,
      });
    });

    gsap.to(glowRef.current, {
      opacity:  0.6,
      scale:    1.05,
      duration: 2,
      yoyo:     true,
      repeat:   -1,
      ease:     'sine.inOut',
    });
  }, { scope: containerRef, dependencies: [listening, processing] });

  // ── Animaciones escuchando: barras de waveform ────────────────────────────
  useGSAP(() => {
    if (!listening) return;
    const rings = ringsRef.current.filter(Boolean);
    const bars  = barsRef.current.filter(Boolean);

    rings.forEach((ring) => gsap.killTweensOf(ring));
    if (rings.length) gsap.to(rings, { opacity: 0, scale: 1, duration: 0.2 });

    bars.forEach((bar, i) => {
      gsap.fromTo(bar,
        { scaleY: 0.2 },
        {
          scaleY:      () => 0.3 + Math.random() * 0.7,
          duration:    () => 0.2 + Math.random() * 0.3,
          ease:        'none',
          repeat:      -1,
          yoyo:        true,
          delay:       i * 0.06,
        },
      );
    });

    if (btnRef.current) gsap.to(btnRef.current, { scale: 1.06, duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }, { scope: containerRef, dependencies: [listening] });

  // ── Processing spinner ────────────────────────────────────────────────────
  useGSAP(() => {
    if (!processing) return;
    const bars = barsRef.current.filter(Boolean);
    bars.forEach((b) => gsap.killTweensOf(b));
    if (bars.length) gsap.to(bars, { scaleY: 0.15, opacity: 0.3, duration: 0.2 });
    if (btnRef.current) gsap.to(btnRef.current, { rotation: 360, duration: 1.2, ease: 'none', repeat: -1 });
  }, { scope: containerRef, dependencies: [processing] });

  // ── Limpiar timers y animaciones ──────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (timeoutRef.current)  clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current  = null;
    intervalRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    clearTimers();
    setInterimText('');
    setTimeLeft(MAX_LISTEN_SEC);
    if (btnRef.current) {
      gsap.killTweensOf(btnRef.current);
      gsap.to(btnRef.current, { rotation: 0, scale: 1, duration: 0.3 });
    }
    barsRef.current.forEach((b) => gsap.killTweensOf(b));
    ringsRef.current.forEach((r) => gsap.killTweensOf(r));
  }, [clearTimers]);

  const animatePress = useCallback(() => {
    if (!btnRef.current) return;
    gsap.fromTo(btnRef.current,
      { scale: 0.92 },
      { scale: 1, duration: 0.4, ease: 'back.out(3)' },
    );
  }, []);

  function stopListening() {
    recRef.current?.stop();
    clearTimers();
    setListening(false);
    setProcessing(true);
    setInterimText('');
    setTimeLeft(MAX_LISTEN_SEC);
  }

  function toggle() {
    if (disabled || processing) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    animatePress();

    if (listening) {
      stopListening();
      return;
    }

    const rec = new SR();
    const lang = navigator.language;
    rec.lang            = lang.startsWith('es') ? lang : 'es';
    rec.interimResults  = true;   // resultados intermedios en tiempo real
    rec.continuous      = false;
    rec.maxAlternatives = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];

      if (!result.isFinal) {
        // Mostrar transcripción en tiempo real mientras habla
        const interim = result[0].transcript;
        setInterimText(interim);
        onInterim?.(interim);
        return;
      }

      // Resultado final: tomar la alternativa de mayor confianza
      let best = result[0];
      for (let i = 1; i < result.length; i++) {
        if ((result[i].confidence ?? 0) > (best.confidence ?? 0)) best = result[i];
      }
      cleanup();
      setListening(false);
      setProcessing(false);
      onResult(best.transcript, best.confidence ?? 0.9);
    };

    // Auto-stop cuando el motor detecta silencio (más rápido que onend)
    rec.onspeechend = () => { recRef.current?.stop(); };

    rec.onerror = () => { cleanup(); setListening(false); setProcessing(false); };
    rec.onend   = () => {
      // onend sin resultado final = sin habla detectada
      if (listening) { cleanup(); setListening(false); setProcessing(false); }
    };

    recRef.current = rec;
    rec.start();
    setListening(true);
    setTimeLeft(MAX_LISTEN_SEC);
    onStart?.();

    // Cuenta regresiva visible
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);

    // Timeout máximo: para el ASR si el usuario no habla o el motor no detiene solo
    timeoutRef.current = setTimeout(() => {
      recRef.current?.stop();
      clearTimers();
      setListening(false);
      setProcessing(false);
      setInterimText('');
      setTimeLeft(MAX_LISTEN_SEC);
    }, MAX_LISTEN_SEC * 1000);
  }

  if (!supported) {
    return (
      <p className="text-center text-xs" style={{ color: 'var(--text-3)' }}>
        Tu navegador no soporta ASR nativo — usa el campo de texto
      </p>
    );
  }

  const btnBg   = listening ? '#dc2626' : 'var(--accent)';
  const btnGlow = listening
    ? '0 0 40px rgba(220,38,38,0.6), 0 0 80px rgba(220,38,38,0.25)'
    : '0 0 40px var(--accent-glow), 0 0 80px rgba(124,58,237,0.2)';

  // Etiqueta dinámica
  const label = processing
    ? 'Procesando...'
    : listening
      ? `Escuchando… ${MAX_LISTEN_SEC - timeLeft > 0 ? `${timeLeft}s` : ''}`
      : 'Toca para hablar';

  return (
    <div ref={containerRef} className="relative flex flex-col items-center gap-4">
      {/* Anillos pulsantes (idle) */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={(el) => { if (el) ringsRef.current[i] = el; }}
          className="absolute rounded-full"
          style={{ width: dim, height: dim, border: '1px solid var(--accent)', opacity: 0 }}
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

      {/* Contenedor botón + ring SVG */}
      <div style={{ position: 'relative', width: dim + 16, height: dim + 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Anillo de cuenta regresiva (solo visible al escuchar) */}
        {listening && (
          <svg
            width={dim + 16}
            height={dim + 16}
            viewBox="0 0 100 100"
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}
          >
            {/* Track gris */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            {/* Arco de progreso */}
            <circle
              ref={ringArcRef}
              cx="50" cy="50" r="42"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                strokeDasharray:  CIRCUMFERENCE,
                strokeDashoffset: 0,
                transition:       'stroke-dashoffset 1s linear, stroke 0.5s ease',
              }}
            />
          </svg>
        )}

        {/* Botón principal */}
        <button
          ref={btnRef}
          onClick={toggle}
          disabled={disabled}
          aria-label={listening ? 'Detener grabación' : 'Iniciar grabación de voz'}
          style={{
            width:          dim,
            height:         dim,
            background:     btnBg,
            boxShadow:      btnGlow,
            borderRadius:   '50%',
            border:         'none',
            cursor:         disabled ? 'not-allowed' : 'pointer',
            opacity:        disabled ? 0.4 : 1,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            position:       'relative',
            zIndex:         2,
            transition:     'background 300ms, box-shadow 300ms',
          }}
        >
          {listening ? (
            <div className="flex items-center gap-[3px]" style={{ height: 32 }}>
              {Array.from({ length: BAR_COUNT }).map((_, i) => (
                <div
                  key={i}
                  ref={(el) => { if (el) barsRef.current[i] = el; }}
                  style={{ width: 4, height: '100%', background: 'white', borderRadius: 2, transformOrigin: 'bottom center' }}
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
      </div>

      {/* Transcripción en tiempo real */}
      {interimText && listening && (
        <div style={{
          maxWidth:     260,
          padding:      '6px 12px',
          borderRadius: 8,
          background:   'rgba(255,255,255,0.06)',
          border:       '1px solid rgba(255,255,255,0.1)',
          fontSize:     13,
          color:        'var(--text-2)',
          fontStyle:    'italic',
          textAlign:    'center',
          backdropFilter: 'blur(8px)',
        }}>
          {interimText}
        </div>
      )}

      {/* Label */}
      <span style={{ color: 'var(--text-2)', fontSize: 12, fontWeight: 500, letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  );
}
