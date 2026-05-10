'use client';

import { useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import gsap from 'gsap';

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const orbs = Array.from(c.querySelectorAll<HTMLElement>('.vb-orb'));
    if (!orbs.length) return;

    const tweens = orbs.flatMap((orb, i) => {
      const dur = 8 + i * 2.5;
      return [
        gsap.to(orb, { y: () => gsap.utils.random(-50, 50), x: () => gsap.utils.random(-30, 30), duration: dur, ease: 'sine.inOut', repeat: -1, yoyo: true }),
        gsap.to(orb, { opacity: () => gsap.utils.random(isDark ? 0.05 : 0.12, isDark ? 0.14 : 0.28), duration: dur * 0.6, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.8 }),
      ];
    });

    return () => { tweens.forEach((t) => t.kill()); };
  }, [isDark]);

  return (
    <div ref={containerRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>

      {/* Banner Sucha-Tech — fondo sutil en el dashboard */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/sucha-banner.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        opacity: isDark ? 0.12 : 0.06,
        transition: 'opacity 400ms ease',
      }} />

      {/* Overlay de oscuridad */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isDark ? 'rgba(5,5,15,0.78)' : 'rgba(240,242,255,0.88)',
        transition: 'background 400ms ease',
      }} />

      {/* Gradiente base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isDark
          ? 'radial-gradient(ellipse 75% 50% at 50% -5%, rgba(124,58,237,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 88% 88%, rgba(37,99,235,0.12) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 75% 50% at 50% -5%, rgba(109,40,217,0.1) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 88% 88%, rgba(29,78,216,0.08) 0%, transparent 50%)',
      }} />

      {/* Grid sutil */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px)`,
        backgroundSize: '72px 72px',
      }} />

      {/* Orbes */}
      {[
        { top: '-8%',  left: '-3%',  w: '52vw', color: isDark ? 'rgba(124,58,237,0.22)' : 'rgba(109,40,217,0.15)', opacity: isDark ? 0.09 : 0.2  },
        { bottom:'3%', right: '-8%', w: '48vw', color: isDark ? 'rgba(37,99,235,0.26)'  : 'rgba(29,78,216,0.15)',  opacity: isDark ? 0.07 : 0.18 },
        { top: '38%',  right: '12%', w: '28vw', color: isDark ? 'rgba(139,92,246,0.2)'  : 'rgba(124,58,237,0.12)', opacity: isDark ? 0.06 : 0.16 },
        { top: '58%',  left: '4%',   w: '24vw', color: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',  opacity: isDark ? 0.05 : 0.14 },
      ].map((o, i) => (
        <div key={i} className="vb-orb" style={{
          position: 'absolute', ...o, height: o.w, borderRadius: '50%',
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          filter: 'blur(55px)', opacity: o.opacity,
        }} />
      ))}
    </div>
  );
}
