'use client';

import { useState, useCallback, useRef } from 'react';
import { useGSAP }            from '@gsap/react';
import gsap                    from 'gsap';
import { VoiceButton }         from '@frontend/components/VoiceButton';
import { SimulationCard }      from '@frontend/components/SimulationCard';
import { ConfirmationModal }   from '@frontend/components/ConfirmationModal';
import { TransactionSuccess }  from '@frontend/components/TransactionSuccess';
import { AnimatedBackground }  from '@frontend/components/AnimatedBackground';
import { useSimulate }         from '@frontend/hooks/useSimulate';
import { useExecute }          from '@frontend/hooks/useExecute';
import { useSpeech }           from '@frontend/hooks/useSpeech';
import type { ExecuteResponse } from '@/types';

const USER_ID = 'demo';
const EXAMPLES = [
  { text: 'compra 0.05 SOL',     emoji: '🟣' },
  { text: 'swap 10 USDC por SOL', emoji: '🔄' },
  { text: 'vende 0.1 SOL',        emoji: '💸' },
  { text: 'mi balance',           emoji: '💰' },
];

export default function HomePage() {
  const [inputText,   setInputText]   = useState('');
  const [transcript,  setTranscript]  = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [txResult,    setTxResult]    = useState<ExecuteResponse | null>(null);

  const { simulation, loading, error: simError, simulate, reset: resetSim } = useSimulate();
  const { executing, error: execError, execute, reset: resetExec }          = useExecute();
  const { speak, phrases }                                                   = useSpeech();

  const pageRef     = useRef<HTMLDivElement>(null);
  const headerRef   = useRef<HTMLDivElement>(null);
  const voiceRef    = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  const inputElRef  = useRef<HTMLInputElement>(null);

  // ── Animación de entrada de la página ─────────────────────────────────────
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(headerRef.current,   { y: -24, opacity: 0, duration: 0.7 })
      .from(voiceRef.current,    { y: 20,  opacity: 0, duration: 0.6 }, '-=0.4')
      .from(inputRef.current,    { y: 16,  opacity: 0, duration: 0.5 }, '-=0.3')
      .from(examplesRef.current, { y: 12,  opacity: 0, duration: 0.5 }, '-=0.3');
  }, { scope: pageRef });

  // ── Simular ───────────────────────────────────────────────────────────────
  const handleSimulate = useCallback(async (text: string, confidence = 1.0) => {
    setTranscript('');
    resetExec();
    setTxResult(null);

    const sim = await simulate(text, confidence);
    if (sim) {
      setShowConfirm(true);
      // La app habla la simulación
      await speak(phrases.onSimulated(
        sim.quote.from,
        sim.quote.to,
        sim.quote.amount,
        sim.requiresDoubleConfirmation,
      ));
    }
  }, [simulate, resetExec, speak, phrases]);

  // ── Voz ───────────────────────────────────────────────────────────────────
  const handleVoiceStart = useCallback(() => {
    speak(phrases.onListening(), false); // Web Speech para respuesta rápida
  }, [speak, phrases]);

  const handleVoiceResult = useCallback((t: string, c: number) => {
    if (t) { setTranscript(t); handleSimulate(t, c); }
  }, [handleSimulate]);

  // ── Ejecutar ──────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async (pin?: string) => {
    if (!simulation) return;

    speak(phrases.onConfirming(), false);

    const res = await execute(simulation, pin);
    if (res) {
      setTxResult(res);
      setShowConfirm(false);
      resetSim();
      setInputText('');
      setTranscript('');
      await speak(phrases.onSuccess());
    } else {
      await speak(phrases.onError(execError ?? 'intenta de nuevo'));
    }
  }, [simulation, execute, resetSim, speak, phrases, execError]);

  // ── Reset completo ────────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    setTxResult(null);
    resetSim();
    resetExec();
    inputElRef.current?.focus();
  }, [resetSim, resetExec]);

  const error = simError ?? execError;

  return (
    <>
      <AnimatedBackground />

      <div
        ref={pageRef}
        style={{ position: 'relative', zIndex: 1, padding: '24px 20px 40px' }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header ref={headerRef} style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* Logo con glow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              fontSize: 32,
              filter: 'drop-shadow(0 0 16px rgba(124,58,237,0.7))',
            }}>
              🎙️
            </div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'var(--grad-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Vibe Broker
            </h1>
          </div>

          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>
            El "Alexa" de las transacciones Web3
          </p>

          {/* Badge de red */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px',
            borderRadius: 99,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            fontSize: 11,
            fontWeight: 600,
            color: '#4ade80',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px #22c55e',
              animation: 'breathe 2s ease-in-out infinite',
            }} />
            Solana Devnet
          </div>
        </header>

        {/* ── Botón de voz ────────────────────────────────────────────────── */}
        <section ref={voiceRef} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 16, paddingBottom: 32, gap: 20,
        }}>
          <VoiceButton
            onResult={handleVoiceResult}
            onStart={handleVoiceStart}
            disabled={loading || executing}
            size="lg"
          />

          {/* Transcripción */}
          {transcript && (
            <TranscriptBubble text={transcript} />
          )}
        </section>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>o escribe</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* ── Input de texto ──────────────────────────────────────────────── */}
        <div ref={inputRef} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            ref={inputElRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSimulate(inputText)}
            placeholder='"compra 0.1 SOL"'
            disabled={loading || executing}
            className="input-base"
            style={{ flex: 1 }}
          />
          <button
            onClick={() => handleSimulate(inputText)}
            disabled={!inputText.trim() || loading}
            style={{
              width: 52, height: 52,
              borderRadius: 'var(--r-md)',
              background: (!inputText.trim() || loading) ? 'var(--bg-elevated)' : 'var(--grad-accent)',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: (!inputText.trim() || loading) ? 'not-allowed' : 'pointer',
              opacity: (!inputText.trim() || loading) ? 0.5 : 1,
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: (!inputText.trim() || loading) ? 'none' : '0 4px 16px var(--accent-glow)',
              transition: 'all 200ms',
            }}
          >
            {loading ? <LoadingDots /> : '→'}
          </button>
        </div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && <ErrorBanner message={error} />}

        {/* ── Simulación ──────────────────────────────────────────────────── */}
        {simulation && !txResult && <SimulationCard simulation={simulation} />}

        {/* ── TX Éxito ────────────────────────────────────────────────────── */}
        {txResult && (
          <TransactionSuccess
            txHash={txResult.txHash}
            receiptId={txResult.receiptId}
            onDismiss={handleDismiss}
          />
        )}

        {/* ── Ejemplos rápidos ────────────────────────────────────────────── */}
        {!simulation && !txResult && (
          <section ref={examplesRef} style={{ marginTop: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Prueba decir o escribir
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EXAMPLES.map(({ text, emoji }) => (
                <ExampleChip
                  key={text}
                  text={text}
                  emoji={emoji}
                  disabled={loading || executing}
                  onClick={() => { setInputText(text); handleSimulate(text); }}
                />
              ))}
            </div>
          </section>
        )}

        <p style={{
          textAlign: 'center', fontSize: 10,
          color: 'var(--text-3)', marginTop: 32,
        }}>
          Prototipo educativo · No es asesoría financiera
        </p>
      </div>

      {/* ── Modal de confirmación ─────────────────────────────────────────── */}
      <ConfirmationModal
        open={showConfirm}
        requiresDouble={simulation?.requiresDoubleConfirmation ?? false}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={executing}
      />
    </>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function TranscriptBubble({ text }: { text: string }) {
  return (
    <div
      className="animate-fade-up glass"
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: 'var(--r-md)',
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Escuché:
      </p>
      <p style={{ fontSize: 15, color: 'var(--text-1)', fontStyle: 'italic' }}>
        "{text}"
      </p>
    </div>
  );
}

function ExampleChip({ text, emoji, onClick, disabled }: {
  text: string; emoji: string; onClick: () => void; disabled: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => gsap.to(ref.current, { y: -2, scale: 1.03, duration: 0.2, ease: 'power2.out' })}
      onMouseLeave={() => gsap.to(ref.current, { y:  0, scale: 1,    duration: 0.2, ease: 'power2.out' })}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px',
        borderRadius: 99,
        background: 'var(--bg-glass)',
        border: '1px solid var(--border)',
        color: 'var(--text-2)',
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        backdropFilter: 'blur(8px)',
        transition: 'border-color 150ms, color 150ms',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.color = 'var(--text-1)'; }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';      e.currentTarget.style.color = 'var(--text-2)'; }}
    >
      {emoji} {text}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="animate-fade-up"
      style={{
        marginBottom: 16,
        padding: '12px 16px',
        borderRadius: 'var(--r-md)',
        background: 'var(--danger-soft)',
        border: '1px solid rgba(239,68,68,0.25)',
        fontSize: 14,
        color: '#fca5a5',
      }}
    >
      ⚠️ {message}
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'white',
          animation: `breathe 1s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}
