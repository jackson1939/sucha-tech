'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ThemeToggle } from './ThemeToggle';
import { WalletBar }   from './WalletBar';

interface Prices { [k: string]: number }

export function TopBar() {
  const [prices, setPrices] = useState<Prices>({});
  const barRef  = useRef<HTMLElement>(null);

  // Fetch prices on mount and every 60s
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/prices').then(r => r.json()).then(d => { if (alive) setPrices(d.prices ?? {}); }).catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const t = gsap.fromTo(el, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', clearProps: 'transform,opacity' });
    return () => { gsap.set(el, { clearProps: 'all' }); t.kill(); };
  }, []);

  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(2)}`;

  const TICKS = [
    { sym: 'SOL', icon: '◎', col: '#9945FF' },
    { sym: 'ETH', icon: 'Ξ', col: '#627EEA' },
    { sym: 'BTC', icon: '₿', col: '#F7931A' },
  ];

  return (
    <header ref={barRef} style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: 'rgba(5,5,15,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        maxWidth: 480, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px', gap: 8,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 8px #7c3aed)' }}>🎙️</span>
          <span style={{
            fontSize: 14, fontWeight: 900, letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>VB</span>
        </div>

        {/* Price ticker */}
        <div style={{ display: 'flex', gap: 10, flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
          {TICKS.map(({ sym, icon, col }) => prices[sym] ? (
            <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: col, fontWeight: 700 }}>{icon}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>
                {fmt(prices[sym])}
              </span>
            </div>
          ) : null)}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ThemeToggle size="sm" />
          <WalletBar />
        </div>
      </div>
    </header>
  );
}
