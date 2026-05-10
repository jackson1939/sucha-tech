'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { VoiceButton, VoiceButtonHandle } from '@frontend/components/VoiceButton';
import { SimulationCard }    from '@frontend/components/SimulationCard';
import { ConfirmationModal } from '@frontend/components/ConfirmationModal';
import { TransactionSuccess } from '@frontend/components/TransactionSuccess';
import { AnimatedBackground } from '@frontend/components/AnimatedBackground';
import { PageTransition }    from '@frontend/components/PageTransition';
import { AutoModeSwitch }    from '@frontend/components/AutoModeSwitch';
import { useSimulate }       from '@frontend/hooks/useSimulate';
import { useExecute }        from '@frontend/hooks/useExecute';
import { useSpeech, BotPhrases } from '@frontend/hooks/useSpeech';
import { useVoiceSettings }  from '@frontend/hooks/useVoiceSettings';
import { useWallet }         from '@frontend/hooks/useWallet';
import { useOrderHistory }   from '@frontend/hooks/useOrderHistory';
import { usePortfolio }      from '@frontend/hooks/usePortfolio';
import { PortfolioWidget }   from '@frontend/components/PortfolioWidget';
import type { ExecuteResponse, SimulateResponse } from '@/types';

const USER_ID = 'demo';

const EXAMPLES = [
  { text: 'compra 0.05 SOL',        emoji: '◎',  chain: 'SOL',   col: '#9945FF' },
  { text: 'swap 10 USDC por ETH',   emoji: 'Ξ',  chain: 'ETH',   col: '#627EEA' },
  { text: 'bridge SOL a MATIC',     emoji: '⛓',  chain: 'CROSS', col: '#8B5CF6' },
  { text: 'vende 0.1 ETH por USDC', emoji: '💸', chain: 'EVM',   col: '#F59E0B' },
];

export default function DashboardPage() {
  const [inputText,   setInputText]   = useState('');
  const [transcript,  setTranscript]  = useState('');
  const [interimText, setInterimText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [txResult,    setTxResult]    = useState<ExecuteResponse | null>(null);
  const [autoMode,    setAutoMode]    = useState(false);

  const { simulation, loading, error: simError, simulate, reset: resetSim } = useSimulate();
  const { executing, error: execError, execute, reset: resetExec }          = useExecute();
  const { config }                                                           = useVoiceSettings();
  const { speak, speakThenListen, stop }                                    = useSpeech(config);
  const { connected, walletName }                                            = useWallet();
  const { addOrder }                                                         = useOrderHistory();
  const { applyOrder }                                                       = usePortfolio();
  const [prices, setPrices]                                                  = useState<Record<string, number>>({});

  const voiceBtnRef  = useRef<VoiceButtonHandle>(null);
  const headerRef    = useRef<HTMLDivElement>(null);
  const voiceAreaRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const examplesRef  = useRef<HTMLDivElement>(null);

  // ── Entrada de página — fromTo evita bug Strict Mode ─────────────────────
  useEffect(() => {
    const els = {
      h: headerRef.current,
      v: voiceAreaRef.current,
      i: inputAreaRef.current,
      e: examplesRef.current,
    };
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (els.h) tl.fromTo(els.h, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, clearProps: 'transform,opacity' });
    if (els.v) tl.fromTo(els.v, { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.65, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }, '-=0.3');
    if (els.i) tl.fromTo(els.i, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, clearProps: 'transform,opacity' }, '-=0.35');
    if (els.e) tl.fromTo(els.e, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, clearProps: 'transform,opacity' }, '-=0.3');
    return () => {
      gsap.set(Object.values(els).filter(Boolean) as HTMLElement[], { clearProps: 'all' });
      tl.kill();
    };
  }, []);

  // ── Fetch prices on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/prices').then(r => r.json()).then(d => setPrices(d.prices ?? {})).catch(() => {});
  }, []);

  // ── Refs para evitar closures desactualizados ─────────────────────────────
  const autoModeRef    = useRef(autoMode);
  const simulationRef  = useRef(simulation);
  const showConfirmRef = useRef(showConfirm);
  useEffect(() => { autoModeRef.current    = autoMode;    }, [autoMode]);
  useEffect(() => { simulationRef.current  = simulation;  }, [simulation]);
  useEffect(() => { showConfirmRef.current = showConfirm; }, [showConfirm]);

  // ── Ejecutar en modo autónomo — siempre sin modal ─────────────────────────
  const autoExecute = useCallback(async (sim: SimulateResponse) => {
    // En modo autónomo el bot anuncia y ejecuta directamente.
    // Pasa type:'double' cuando la política lo requiere para que el
    // backend lo acepte; el PIN es opcional en devnet (demo signature).
    const phrase = BotPhrases.onSimulated(sim.quote.from, sim.quote.to, sim.quote.amount, false);
    speak(phrase, false);
    const res = await execute(sim, undefined);   // useExecute ya fija type correcto
    if (res) {
      const orderPayload = {
        id: res.receiptId,
        simulationId: sim.simulationId,
        userId: USER_ID,
        tokenFrom: sim.intent.tokenFrom ?? 'USDC',
        tokenTo:   sim.intent.tokenTo   ?? 'SOL',
        amount:    sim.intent.amount    ?? 0,
        estimatedReceive: sim.quote.estimatedReceive,
        txHash:    res.txHash,
        receiptId: res.receiptId,
        confirmationType: sim.requiresDoubleConfirmation ? 'double' : 'voice' as 'voice' | 'double',
        status: 'submitted' as const,
        createdAt: new Date().toISOString(),
      };
      addOrder(orderPayload);
      applyOrder(orderPayload);
      setTxResult(res);
      speak(BotPhrases.onSuccess());
    } else {
      speak(BotPhrases.onError(execError ?? 'intenta de nuevo'));
    }
  }, [speak, execute, execError, addOrder, applyOrder]);

  // ── Simular ───────────────────────────────────────────────────────────────
  const handleSimulate = useCallback(async (text: string, confidence = 1.0) => {
    if (!text.trim() || loading) return;
    stop();
    setTranscript('');
    setInterimText('');
    setShowConfirm(false);   // cierra cualquier modal previo
    resetExec();
    setTxResult(null);

    const sim = await simulate(text.trim(), confidence);
    if (!sim) return;

    // Modo autónomo: ejecuta siempre sin modal, sin importar el nivel de confirmación
    if (autoModeRef.current) {
      await autoExecute(sim as SimulateResponse);
      return;
    }

    // Modo normal
    setShowConfirm(true);
    const phrase = BotPhrases.onSimulated(
      sim.quote.from, sim.quote.to, sim.quote.amount, sim.requiresDoubleConfirmation,
    );
    if (!sim.requiresDoubleConfirmation) {
      await speakThenListen(phrase, () => voiceBtnRef.current?.startListening());
    } else {
      await speak(phrase);
    }
  }, [loading, stop, resetExec, simulate, autoExecute, speak, speakThenListen]);

  const handleVoiceStart   = useCallback(() => { stop(); setInterimText(''); }, [stop]);
  const handleVoiceInterim = useCallback((t: string) => setInterimText(t), []);

  // Usa refs para no recrear el callback en cada render y evitar closures viejos
  const handleConfirmRef  = useRef<(pin?: string) => Promise<void>>(async () => {});
  const handleSimulateRef = useRef(handleSimulate);
  useEffect(() => { handleSimulateRef.current = handleSimulate; }, [handleSimulate]);

  const handleVoiceResult = useCallback((t: string, c: number) => {
    if (!t.trim()) return;
    setTranscript(t);
    setInterimText('');

    // Si hay simulación pendiente Y modal abierto Y el usuario confirma con voz
    const sim = simulationRef.current;
    const showC = showConfirmRef.current;
    if (sim && showC && !sim.requiresDoubleConfirmation) {
      const n = t.toLowerCase();
      if (n.includes('confirm') || n.includes('sí') || n.includes('si') ||
          n.includes('yes')     || n.includes('dale') || n.includes('ok')) {
        handleConfirmRef.current(undefined);
        return;
      }
    }
    handleSimulateRef.current(t, c);
  }, []); // sin deps — usa siempre los refs actualizados

  const handleConfirm = useCallback(async (pin?: string) => {
    const sim = simulationRef.current;
    if (!sim) return;
    stop();
    speak(BotPhrases.onConfirming(), false);
    const res = await execute(sim as SimulateResponse, pin);
    if (res) {
      const orderPayload = {
        id: res.receiptId,
        simulationId: sim.simulationId,
        userId: USER_ID,
        tokenFrom: sim.intent.tokenFrom ?? 'USDC',
        tokenTo:   sim.intent.tokenTo   ?? 'SOL',
        amount:    sim.intent.amount    ?? 0,
        estimatedReceive: sim.quote.estimatedReceive,
        txHash:    res.txHash,
        receiptId: res.receiptId,
        confirmationType: sim.requiresDoubleConfirmation ? 'double' : 'voice' as 'voice' | 'double',
        status: 'submitted' as const,
        createdAt: new Date().toISOString(),
      };
      addOrder(orderPayload);
      applyOrder(orderPayload);
      setTxResult(res);
      setShowConfirm(false);
      resetSim();
      setInputText('');
      setTranscript('');
      await speak(BotPhrases.onSuccess());
    } else {
      await speak(BotPhrases.onError(execError ?? 'intenta de nuevo'));
    }
  }, [stop, speak, execute, resetSim, execError, addOrder, applyOrder]);

  // Mantiene el ref de handleConfirm siempre actualizado
  useEffect(() => { handleConfirmRef.current = handleConfirm; }, [handleConfirm]);

  const handleDismiss = useCallback(() => {
    setTxResult(null); resetSim(); resetExec();
  }, [resetSim, resetExec]);

  const error = simError ?? execError;

  return (
    <PageTransition style={{ position: 'relative', zIndex: 1 }}>
      <AnimatedBackground />

      <div style={{ padding: '12px 16px 24px' }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 20, paddingTop: 4 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 28, filter: 'drop-shadow(0 0 16px rgba(124,58,237,0.8))', animation: 'breathe 3s ease-in-out infinite' }}>🎙️</span>
            <h1 style={{
              fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em',
              background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Vibe Broker</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>
            {connected ? `✓ ${walletName} · ` : ''}El "Alexa" de las transacciones Web3
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 600, color: '#4ade80',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
              padding: '4px 12px', borderRadius: 99,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block', animation: 'breathe 2s infinite' }} />
              Multi-chain · Devnet
            </span>
            <AutoModeSwitch onModeChange={setAutoMode} speak={(t) => speak(t, false)} />
          </div>
        </div>

        {/* ── Botón de voz ─────────────────────────────────────────────── */}
        <div ref={voiceAreaRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 24px', gap: 14, position: 'relative' }}>
          {/* Ambient rings */}
          <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
            {[110, 165, 220].map((r, i) => (
              <div key={i} style={{
                position: 'absolute', width: r, height: r, borderRadius: '50%',
                border: `1px solid rgba(124,58,237,${0.14 - i * 0.04})`,
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              }} />
            ))}
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <VoiceButton ref={voiceBtnRef} onResult={handleVoiceResult} onInterim={handleVoiceInterim}
              onStart={handleVoiceStart} disabled={loading || executing} size="lg" />
          </div>
          {interimText && (
            <div style={{
              width: '100%', padding: '10px 16px', borderRadius: 12,
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
              backdropFilter: 'blur(12px)', textAlign: 'center',
              fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic',
              animation: 'fade-up 0.2s ease both',
            }}>{interimText}</div>
          )}
          {transcript && !interimText && <TranscriptBubble text={transcript} />}
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>o escribe</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* ── Input ────────────────────────────────────────────────────── */}
        <div ref={inputAreaRef} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', gap: 8,
            background: 'var(--bg-glass)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)', borderRadius: 16,
            padding: '6px 6px 6px 16px', boxShadow: 'var(--shadow-card)',
            transition: 'border-color 200ms, box-shadow 200ms',
          }}
          onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-glow)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
          onBlurCapture={e =>  { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'; }}
          >
            <input type="text" value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleSimulate(inputText)}
              placeholder='"compra 0.1 SOL" o "swap 10 USDC por ETH"'
              disabled={loading || executing}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 14, padding: '8px 0' }}
            />
            <SendButton loading={loading} disabled={!inputText.trim() || loading || executing} onClick={() => handleSimulate(inputText)} />
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {simulation && !txResult && <SimulationCard simulation={simulation} />}
        {txResult && <TransactionSuccess txHash={txResult.txHash} receiptId={txResult.receiptId} onDismiss={handleDismiss} />}

        {/* ── Portfolio ────────────────────────────────────────────────── */}
        {!simulation && !txResult && <PortfolioWidget prices={prices} />}

        {/* ── Ejemplos ─────────────────────────────────────────────────── */}
        {!simulation && !txResult && (
          <div ref={examplesRef}>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Prueba decir o escribir</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EXAMPLES.map(({ text, emoji, chain, col }) => (
                <ExampleChip key={text} text={text} emoji={emoji} chain={chain} col={col}
                  disabled={loading || executing}
                  onClick={() => { setInputText(text); handleSimulate(text); }}
                />
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 28 }}>
          Prototipo educativo · No es asesoría financiera
        </p>
      </div>

      {/* Modal solo en modo manual — en auto mode nunca se muestra */}
      {!autoMode && (
        <ConfirmationModal open={showConfirm}
          requiresDouble={simulation?.requiresDoubleConfirmation ?? false}
          onConfirm={handleConfirm}
          onCancel={() => { setShowConfirm(false); stop(); }}
          loading={executing}
        />
      )}
    </PageTransition>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function TranscriptBubble({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.fromTo(ref.current, { opacity: 0, y: 8, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });
    return () => { t.kill(); };
  }, [text]);
  return (
    <div ref={ref} style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
      <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Escuché:</p>
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
      width: 44, height: 44, borderRadius: 12, border: 'none', flexShrink: 0,
      background: disabled ? 'var(--bg-elevated)' : 'var(--grad-accent)',
      color: '#fff', fontSize: 18, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: disabled ? 'none' : '0 4px 16px var(--accent-glow)',
      transition: 'background 200ms, opacity 200ms', willChange: 'transform',
    }}>
      {loading ? <MiniSpinner /> : '↑'}
    </button>
  );
}

function MiniSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function ErrorBanner({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.fromTo(ref.current, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
    return () => { t.kill(); };
  }, [message]);
  return (
    <div ref={ref} style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#fca5a5' }}>
      ⚠️ {message}
    </div>
  );
}

function ExampleChip({ text, emoji, chain, col, onClick, disabled }: {
  text: string; emoji: string; chain: string; col: string; onClick: () => void; disabled: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref} onClick={onClick} disabled={disabled}
      onMouseEnter={() => { if (ref.current && !disabled) gsap.to(ref.current, { y: -3, scale: 1.03, duration: 0.18, ease: 'power2.out' }); }}
      onMouseLeave={() => { if (ref.current) gsap.to(ref.current, { y: 0, scale: 1, duration: 0.22 }); }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5,
        padding: '12px 14px', borderRadius: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'var(--bg-glass)', border: '1px solid var(--border)',
        opacity: disabled ? 0.4 : 1, backdropFilter: 'blur(8px)',
        textAlign: 'left', transition: 'border-color 150ms', willChange: 'transform',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
      onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, color: col, fontWeight: 800, fontFamily: 'monospace' }}>{emoji}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, color: col,
          background: `${col}18`, border: `1px solid ${col}30`,
          padding: '2px 6px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>{chain}</span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, lineHeight: 1.35 }}>{text}</span>
    </button>
  );
}
