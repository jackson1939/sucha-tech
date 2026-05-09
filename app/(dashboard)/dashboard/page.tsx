'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { VoiceButton, VoiceButtonHandle } from '@frontend/components/VoiceButton';
import { SimulationCard }    from '@frontend/components/SimulationCard';
import { ConfirmationModal } from '@frontend/components/ConfirmationModal';
import { TransactionSuccess } from '@frontend/components/TransactionSuccess';
import { AnimatedBackground } from '@frontend/components/AnimatedBackground';
import { PageTransition }    from '@frontend/components/PageTransition';
import { MagneticButton }    from '@frontend/components/MagneticButton';
import { useSimulate }       from '@frontend/hooks/useSimulate';
import { useExecute }        from '@frontend/hooks/useExecute';
import { useSpeech, BotPhrases } from '@frontend/hooks/useSpeech';
import { useVoiceSettings }  from '@frontend/hooks/useVoiceSettings';
import type { ExecuteResponse } from '@/types';

const USER_ID = 'demo';
const EXAMPLES = [
  { text: 'compra 0.05 SOL',     emoji: '🟣' },
  { text: 'swap 10 USDC por SOL', emoji: '🔄' },
  { text: 'vende 0.1 SOL',        emoji: '💸' },
  { text: 'mi balance',           emoji: '💰' },
];

export default function DashboardPage() {
  const [inputText,   setInputText]   = useState('');
  const [transcript,  setTranscript]  = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [txResult,    setTxResult]    = useState<ExecuteResponse | null>(null);

  const { simulation, loading, error: simError, simulate, reset: resetSim } = useSimulate();
  const { executing, error: execError, execute, reset: resetExec }          = useExecute();
  const { config }                                                           = useVoiceSettings();
  const { speak, speakThenListen, stop }                                    = useSpeech(config);

  const voiceBtnRef  = useRef<VoiceButtonHandle>(null);
  const headerRef    = useRef<HTMLElement>(null);
  const voiceAreaRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const examplesRef  = useRef<HTMLDivElement>(null);
  const inputElRef   = useRef<HTMLInputElement>(null);

  // ── Entrada de página ─────────────────────────────────────────────────────
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (headerRef.current)   tl.from(headerRef.current,   { y: -20, opacity: 0, duration: 0.6 });
    if (voiceAreaRef.current) tl.from(voiceAreaRef.current, { scale: 0.85, opacity: 0, duration: 0.65, ease: 'back.out(1.4)' }, '-=0.3');
    if (inputAreaRef.current) tl.from(inputAreaRef.current, { y: 16, opacity: 0, duration: 0.5 }, '-=0.3');
    if (examplesRef.current)  tl.from(examplesRef.current,  { y: 12, opacity: 0, duration: 0.45 }, '-=0.25');
    return () => { tl.kill(); };
  }, []);

  // ── Simular ───────────────────────────────────────────────────────────────
  const handleSimulate = useCallback(async (text: string, confidence = 1.0) => {
    if (!text.trim() || loading) return;
    stop();
    setTranscript('');
    resetExec();
    setTxResult(null);

    const sim = await simulate(text.trim(), confidence);
    if (!sim) return;
    setShowConfirm(true);

    const phrase = BotPhrases.onSimulated(sim.quote.from, sim.quote.to, sim.quote.amount, sim.requiresDoubleConfirmation);
    if (!sim.requiresDoubleConfirmation) {
      await speakThenListen(phrase, () => voiceBtnRef.current?.startListening());
    } else {
      await speak(phrase);
    }
  }, [loading, stop, resetExec, simulate, speak, speakThenListen]);

  const handleVoiceStart = useCallback(() => { stop(); }, [stop]);

  const handleVoiceResult = useCallback((t: string, c: number) => {
    if (!t.trim()) return;
    setTranscript(t);
    if (simulation && showConfirm && !simulation.requiresDoubleConfirmation) {
      const n = t.toLowerCase();
      if (n.includes('confirm') || n.includes('sí') || n.includes('si') || n.includes('yes')) {
        handleConfirm(undefined); return;
      }
    }
    handleSimulate(t, c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulation, showConfirm]);

  const handleConfirm = useCallback(async (pin?: string) => {
    if (!simulation) return;
    stop();
    speak(BotPhrases.onConfirming(), false);
    const res = await execute(simulation, pin);
    if (res) {
      setTxResult(res);
      setShowConfirm(false);
      resetSim();
      setInputText('');
      setTranscript('');
      await speak(BotPhrases.onSuccess());
    } else {
      await speak(BotPhrases.onError(execError ?? 'intenta de nuevo'));
    }
  }, [simulation, stop, speak, execute, resetSim, execError]);

  const handleDismiss = useCallback(() => {
    setTxResult(null); resetSim(); resetExec();
    inputElRef.current?.focus();
  }, [resetSim, resetExec]);

  const error = simError ?? execError;

  return (
    <PageTransition style={{ position: 'relative', zIndex: 1 }}>
      <AnimatedBackground />

      <div style={{ padding: '22px 20px 20px' }}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header ref={headerRef} style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 26, filter: 'drop-shadow(0 0 14px var(--accent-glow))', animation: 'breathe 3s ease-in-out infinite' }}>🎙️</span>
            <h1 style={{
              fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em',
              background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Vibe Broker</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>
            El "Alexa" de las transacciones Web3
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 600, color: '#4ade80',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)',
            padding: '4px 12px', borderRadius: 99,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
              boxShadow: '0 0 6px #22c55e', display: 'inline-block', animation: 'breathe 2s infinite' }} />
            Solana Devnet
          </span>
        </header>

        {/* ── Botón de voz ──────────────────────────────────────────────── */}
        <section ref={voiceAreaRef} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 8, paddingBottom: 24, gap: 16,
        }}>
          <VoiceButton ref={voiceBtnRef} onResult={handleVoiceResult} onStart={handleVoiceStart}
            disabled={loading || executing} size="lg" />

          {transcript && (
            <TranscriptBubble text={transcript} />
          )}
        </section>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>o escribe</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* ── Input ─────────────────────────────────────────────────────── */}
        <div ref={inputAreaRef} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <input ref={inputElRef} type="text" value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSimulate(inputText)}
            placeholder='"compra 0.1 SOL"'
            disabled={loading || executing}
            className="input-base" style={{ flex: 1 }}
          />
          <SendButton loading={loading} disabled={!inputText.trim() || loading || executing}
            onClick={() => handleSimulate(inputText)} />
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && <ErrorBanner message={error} />}

        {/* ── Simulación ────────────────────────────────────────────────── */}
        {simulation && !txResult && <SimulationCard simulation={simulation} />}

        {/* ── TX exitosa ────────────────────────────────────────────────── */}
        {txResult && (
          <TransactionSuccess txHash={txResult.txHash} receiptId={txResult.receiptId} onDismiss={handleDismiss} />
        )}

        {/* ── Ejemplos ──────────────────────────────────────────────────── */}
        {!simulation && !txResult && (
          <section ref={examplesRef} style={{ marginTop: 6 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Prueba decir o escribir
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EXAMPLES.map(({ text, emoji }) => (
                <ExampleChip key={text} text={text} emoji={emoji}
                  disabled={loading || executing}
                  onClick={() => { setInputText(text); handleSimulate(text); }}
                />
              ))}
            </div>
          </section>
        )}

        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 24 }}>
          Prototipo educativo · No es asesoría financiera
        </p>
      </div>

      <ConfirmationModal
        open={showConfirm}
        requiresDouble={simulation?.requiresDoubleConfirmation ?? false}
        onConfirm={handleConfirm}
        onCancel={() => { setShowConfirm(false); stop(); }}
        loading={executing}
      />
    </PageTransition>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function TranscriptBubble({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.fromTo(ref.current,
      { opacity: 0, y: 10, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.5)' },
    );
    return () => { t.kill(); };
  }, [text]);

  return (
    <div ref={ref} style={{
      width: '100%', padding: '12px 16px', borderRadius: 14,
      background: 'var(--bg-glass)', border: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Escuché:</p>
      <p style={{ fontSize: 15, color: 'var(--text-1)', fontStyle: 'italic' }}>"{text}"</p>
    </div>
  );
}

function SendButton({ loading, disabled, onClick }: { loading: boolean; disabled: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  function press() {
    if (disabled) return;
    gsap.fromTo(ref.current, { scale: 0.88 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' });
    onClick();
  }
  return (
    <button ref={ref} onClick={press} disabled={disabled} style={{
      width: 50, height: 50, borderRadius: 14, border: 'none', flexShrink: 0,
      background: disabled ? 'var(--bg-elevated)' : 'var(--grad-accent)',
      color: '#fff', fontSize: 20, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: disabled ? 'none' : '0 4px 16px var(--accent-glow)',
      transition: 'background 200ms, box-shadow 200ms, opacity 200ms', willChange: 'transform',
    }}>
      {loading ? <MiniSpinner /> : '→'}
    </button>
  );
}

function MiniSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function ErrorBanner({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
  }, [message]);
  return (
    <div ref={ref} style={{
      marginBottom: 16, padding: '12px 16px', borderRadius: 12,
      background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.25)',
      fontSize: 13, color: '#fca5a5',
    }}>
      ⚠️ {message}
    </div>
  );
}

function ExampleChip({ text, emoji, onClick, disabled }: { text: string; emoji: string; onClick: () => void; disabled: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref} onClick={onClick} disabled={disabled}
      onMouseEnter={() => { if (ref.current && !disabled) gsap.to(ref.current, { y: -3, scale: 1.04, duration: 0.2, ease: 'power2.out' }); }}
      onMouseLeave={() => { if (ref.current) gsap.to(ref.current, { y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }); }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 99, fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'var(--bg-glass)', border: '1px solid var(--border)',
        color: 'var(--text-2)', opacity: disabled ? 0.4 : 1,
        backdropFilter: 'blur(8px)', transition: 'border-color 150ms, color 150ms',
        willChange: 'transform',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {emoji} {text}
    </button>
  );
}
