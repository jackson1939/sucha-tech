'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const NAV = [
  { href: '/',         label: 'Inicio',    icon: '🏠' },
  { href: '/submit',   label: 'Enviar',    icon: '🚀' },
  { href: '/history',  label: 'Historial', icon: '📋' },
  { href: '/settings', label: 'Ajustes',   icon: '⚙️' },
];

export function Navbar() {
  const pathname   = usePathname();
  const navRef     = useRef<HTMLElement>(null);

  // Entrada suave de la navbar
  useGSAP(() => {
    gsap.from(navRef.current, {
      y: 20, opacity: 0, duration: 0.6, delay: 0.4, ease: 'power2.out',
    });
  }, { scope: navRef });

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        borderTop: '1px solid var(--border)',
        background: 'rgba(5,5,15,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{
        maxWidth: 480, margin: '0 auto',
        display: 'flex', justifyContent: 'space-around',
        padding: '8px 16px',
      }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <NavItem key={href} href={href} label={label} icon={icon} active={active} />
          );
        })}
      </div>
    </nav>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  const itemRef = useRef<HTMLAnchorElement>(null);

  function handleMouseEnter() {
    if (active) return;
    gsap.to(itemRef.current, { y: -2, duration: 0.2, ease: 'power2.out' });
  }
  function handleMouseLeave() {
    gsap.to(itemRef.current, { y: 0, duration: 0.2, ease: 'power2.out' });
  }

  return (
    <Link
      ref={itemRef}
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 3,
        padding: '8px 20px',
        borderRadius: 'var(--r-md)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: active ? '1px solid var(--border-glow)' : '1px solid transparent',
        textDecoration: 'none',
        color: active ? '#a78bfa' : 'var(--text-3)',
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        transition: 'color 200ms, background 200ms, border-color 200ms',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 20, filter: active ? 'none' : 'grayscale(0.6)' }}>{icon}</span>
      <span>{label}</span>
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: '30%', right: '30%', height: 2,
          background: 'var(--accent)',
          borderRadius: '0 0 99px 99px',
        }} />
      )}
    </Link>
  );
}
