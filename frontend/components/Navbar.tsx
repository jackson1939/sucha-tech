'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '/dashboard',          label: 'Inicio',    icon: '🏠' },
  { href: '/dashboard/history',  label: 'Historial', icon: '📋' },
  { href: '/dashboard/settings', label: 'Ajustes',   icon: '⚙️' },
];

export function Navbar() {
  const pathname = usePathname();
  const navRef   = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const t = gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, delay: 0.3, ease: 'power2.out', clearProps: 'transform,opacity' });
    return () => { gsap.set(el, { clearProps: 'all' }); t.kill(); };
  }, []);

  return (
    <nav ref={navRef} style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-base)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{
        maxWidth: 480, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 12px',
        gap: 4,
      }}>
        {/* Tabs de navegación */}
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return <NavItem key={href} href={href} label={label} icon={icon} active={active} />;
        })}

        {/* Separador */}
        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

        {/* Theme toggle */}
        <ThemeToggle size="sm" />
      </div>
    </nav>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <Link ref={ref} href={href}
      onMouseEnter={() => { if (!active && ref.current) gsap.to(ref.current, { y: -2, duration: 0.18, ease: 'power2.out' }); }}
      onMouseLeave={() => { if (ref.current) gsap.to(ref.current, { y: 0, duration: 0.18 }); }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '7px 14px', borderRadius: 12, textDecoration: 'none',
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: active ? '1px solid var(--border-glow)' : '1px solid transparent',
        color: active ? 'var(--accent)' : 'var(--text-3)',
        fontSize: 11, fontWeight: active ? 600 : 500,
        transition: 'color 200ms, background 200ms, border-color 200ms',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 18, filter: active ? 'none' : 'grayscale(0.5)' }}>{icon}</span>
      <span>{label}</span>
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: '30%', right: '30%',
          height: 2, background: 'var(--accent)',
          borderRadius: '0 0 99px 99px',
        }} />
      )}
    </Link>
  );
}
