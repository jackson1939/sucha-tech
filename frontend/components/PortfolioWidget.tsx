'use client';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { usePortfolio } from '@frontend/hooks/usePortfolio';
import { useOrderHistory } from '@frontend/hooks/useOrderHistory';

const TOKEN_COLORS: Record<string, string> = {
  SOL:'#9945FF', ETH:'#627EEA', BTC:'#F7931A', USDC:'#2775CA',
  USDT:'#26A17B', MATIC:'#8247E5', AVAX:'#E84142', BNB:'#F3BA2F',
  ARB:'#12AAFF', OP:'#FF0420', FTM:'#1969FF', BASE:'#0052FF',
};
const TOKEN_ICONS: Record<string, string> = {
  SOL:'◎', ETH:'Ξ', BTC:'₿', USDC:'$', USDT:'₮', MATIC:'⬡',
  AVAX:'A', BNB:'B', ARB:'A', OP:'O', FTM:'F', BASE:'B',
};

interface Props {
  prices?: Record<string, number>;
}

export function PortfolioWidget({ prices = {} }: Props) {
  const { tokenList, mounted, resetPortfolio } = usePortfolio();
  const { totalVolume, successCount }          = useOrderHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !mounted) return;
    const t = gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity' });
    return () => { gsap.set(el, { clearProps: 'all' }); t.kill(); };
  }, [mounted]);

  if (!mounted) return null;

  const totalUSD = tokenList.reduce((acc, [sym, amt]) => {
    const price = prices[sym] ?? 0;
    return acc + amt * price;
  }, 0);

  return (
    <div ref={containerRef} style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'var(--bg-glass)', border: '1px solid var(--border)',
      backdropFilter: 'blur(16px)', marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>Portfolio · Devnet</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'monospace' }}>
            {totalUSD > 0 ? `$${totalUSD.toFixed(2)}` : '—'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Stat label="Operaciones" value={String(successCount)} />
            <Stat label="Volumen" value={`${totalVolume.toFixed(3)}`} />
          </div>
        </div>
      </div>

      {/* Token list */}
      <div style={{ padding: '10px 8px' }}>
        {tokenList.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', padding: '16px 0' }}>
            Sin tokens — realiza tu primer swap
          </p>
        ) : (
          tokenList.map(([sym, amt]) => {
            const col   = TOKEN_COLORS[sym] ?? 'var(--accent)';
            const icon  = TOKEN_ICONS[sym]  ?? sym.slice(0,1);
            const price = prices[sym] ?? 0;
            const usd   = amt * price;
            const pct   = totalUSD > 0 ? (usd / totalUSD) * 100 : 0;

            return (
              <div key={sym} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 10px', borderRadius: 12,
                transition: 'background 150ms',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseOut={e =>  { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `${col}22`, border: `1.5px solid ${col}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: col, fontFamily: 'monospace',
                }}>{icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{sym}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-1)' }}>
                      {amt < 0.001 ? amt.toExponential(2) : amt.toFixed(4)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {price > 0 && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'monospace' }}>${usd.toFixed(2)}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{pct.toFixed(0)}%</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reset button */}
      {tokenList.length > 0 && (
        <div style={{ padding: '0 10px 10px' }}>
          <button onClick={resetPortfolio} style={{
            width: '100%', padding: '8px', border: '1px solid var(--border)',
            borderRadius: 10, background: 'transparent', cursor: 'pointer',
            color: 'var(--text-3)', fontSize: 11, fontWeight: 600,
            transition: 'color 150ms, border-color 150ms',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger)'; }}
          onMouseOut={e =>  { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
          >
            Resetear saldo devnet
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'monospace' }}>{value}</p>
      <p style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    </div>
  );
}
