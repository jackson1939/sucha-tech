'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

/** Orbes flotantes animadas con GSAP — fondo motion graphic del sitio */
export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const orbs = containerRef.current?.querySelectorAll('.orb');
    if (!orbs) return;

    orbs.forEach((orb, i) => {
      const duration = 8 + i * 3;
      const delay    = i * 1.2;

      gsap.to(orb, {
        y:        () => gsap.utils.random(-60, 60),
        x:        () => gsap.utils.random(-40, 40),
        duration,
        delay,
        ease:    'sine.inOut',
        repeat:  -1,
        yoyo:    true,
      });

      gsap.to(orb, {
        opacity:  () => gsap.utils.random(0.04, 0.14),
        duration: duration * 0.7,
        delay:    delay + 1,
        ease:    'sine.inOut',
        repeat:  -1,
        yoyo:    true,
      });
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Gradiente de fondo base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(37,99,235,0.12) 0%, transparent 50%)',
      }} />

      {/* Orbe 1 — violeta grande, arriba-izquierda */}
      <div className="orb" style={{
        position: 'absolute', top: '-10%', left: '-5%',
        width: '55vw', height: '55vw',
        background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        opacity: 0.08,
      }} />

      {/* Orbe 2 — azul, abajo-derecha */}
      <div className="orb" style={{
        position: 'absolute', bottom: '5%', right: '-10%',
        width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        opacity: 0.07,
      }} />

      {/* Orbe 3 — violeta pequeño, centro-derecha */}
      <div className="orb" style={{
        position: 'absolute', top: '40%', right: '15%',
        width: '30vw', height: '30vw',
        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        opacity: 0.06,
      }} />

      {/* Orbe 4 — teal accent, centro-izquierda */}
      <div className="orb" style={{
        position: 'absolute', top: '55%', left: '5%',
        width: '25vw', height: '25vw',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        opacity: 0.05,
      }} />

      {/* Grid sutil */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }} />
    </div>
  );
}
