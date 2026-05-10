'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useWallet } from '@frontend/hooks/useWallet';

const WALLETS = [
  { id: 'phantom',       label: 'Phantom',       icon: '👻', sub: 'Solana' },
  { id: 'metamask',      label: 'MetaMask',       icon: '🦊', sub: 'EVM' },
  { id: 'core',          label: 'Core Wallet',    icon: '🔷', sub: 'AVAX / EVM' },
  { id: 'walletconnect', label: 'WalletConnect',  icon: '🔗', sub: 'Multi-chain' },
];

export function WalletBar() {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);
  const {
    connected, address, chainName, walletName, connecting,
    connectPhantom, connectMetaMask, connectCore, disconnect,
  } = useWallet();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openModal() {
    setOpen(true);
    requestAnimationFrame(() => {
      if (modalRef.current)
        gsap.fromTo(modalRef.current,
          { opacity: 0, scale: 0.92, y: -10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.7)' });
    });
  }

  function closeModal() {
    if (!modalRef.current) { setOpen(false); return; }
    gsap.to(modalRef.current, { opacity: 0, scale: 0.94, y: -8, duration: 0.18, ease: 'power2.in', onComplete: () => setOpen(false) });
  }

  async function handleConnect(id: string) {
    closeModal();
    await new Promise(r => setTimeout(r, 200));
    if      (id === 'phantom')       await connectPhantom();
    else if (id === 'metamask')      await connectMetaMask();
    else if (id === 'core')          await connectCore();
    else if (id === 'walletconnect') await connectMetaMask('WalletConnect');
  }

  const short = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : '';

  if (connected) {
    return (
      <button onClick={disconnect} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 10,
        border: '1px solid rgba(34,197,94,0.4)',
        background: 'rgba(34,197,94,0.12)',
        cursor: 'pointer', fontSize: 11, fontWeight: 700,
        color: '#4ade80', whiteSpace: 'nowrap',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', flexShrink: 0 }} />
        {short} <span style={{ opacity: 0.6, fontWeight: 400 }}>· {chainName}</span>
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={open ? closeModal : openModal} disabled={connecting}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 10,
          border: '1px solid rgba(124,58,237,0.7)',
          background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.25))',
          cursor: connecting ? 'wait' : 'pointer',
          fontSize: 12, fontWeight: 700, color: '#c4b5fd',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 18px rgba(124,58,237,0.25)',
        }}
      >
        <span style={{ fontSize: 14 }}>{connecting ? '⏳' : '🔌'}</span>
        {connecting ? 'Conectando…' : 'Conectar'}
      </button>

      {open && (
        <div ref={modalRef} style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 500,
          background: 'rgba(14,14,30,0.98)',
          border: '1px solid rgba(124,58,237,0.35)',
          borderRadius: 18, padding: 8, minWidth: 240,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          backdropFilter: 'blur(28px)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '6px 10px 8px' }}>
            Selecciona tu wallet
          </p>
          {WALLETS.map(w => <WalletOption key={w.id} {...w} onClick={() => handleConnect(w.id)} />)}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />
          <button onClick={closeModal} style={{
            width: '100%', padding: '8px 12px', border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', fontSize: 12, borderRadius: 8,
          }}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

function WalletOption({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref} onClick={onClick}
      onMouseEnter={() => { if (ref.current) gsap.to(ref.current, { x: 3, duration: 0.15, ease: 'power2.out' }); }}
      onMouseLeave={() => { if (ref.current) gsap.to(ref.current, { x: 0, duration: 0.2 }); }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: 'transparent', textAlign: 'left', willChange: 'transform',
        transition: 'background 150ms',
      }}
      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.12)'; }}
      onMouseOut={e =>  { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span style={{
        fontSize: 20, width: 36, height: 36, borderRadius: 10,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)', marginBottom: 1 }}>{label}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)' }}>{sub}</p>
      </div>
      <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
    </button>
  );
}
