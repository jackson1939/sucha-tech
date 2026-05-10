'use client';

import { useTheme } from './ThemeProvider';
import { useRef } from 'react';
import gsap from 'gsap';

interface ThemeToggleProps {
  size?: 'sm' | 'md';
}

export function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const btnRef = useRef<HTMLButtonElement>(null);
  const isDark = theme === 'dark';
  const dim    = size === 'sm' ? 34 : 40;

  function handleClick() {
    if (!btnRef.current) { toggle(); return; }
    // Micro-animación al cambiar tema
    gsap.timeline()
      .to(btnRef.current, { scale: 0.85, duration: 0.1, ease: 'power2.in' })
      .to(btnRef.current, { scale: 1,    duration: 0.3, ease: 'back.out(2)' });
    toggle();
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      style={{
        width: dim, height: dim,
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size === 'sm' ? 15 : 18,
        flexShrink: 0,
        boxShadow: isDark ? '0 0 12px rgba(124,58,237,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'background 220ms, border-color 220ms, box-shadow 220ms',
        willChange: 'transform',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-glow)';
        e.currentTarget.style.background  = 'var(--bg-glass-hov)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background  = 'var(--bg-elevated)';
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
