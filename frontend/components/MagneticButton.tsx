'use client';

import { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

interface MagneticButtonProps {
  children: React.ReactNode;
  href?:    string;
  onClick?: () => void;
  style?:   React.CSSProperties;
  strength?: number;   // 0.0 – 0.5 (default 0.28)
  className?: string;
}

/**
 * MagneticButton — el cursor atrae el botón hacia él.
 * Efecto "premium" usado en landing CTAs y login.
 * Solo activo en desktop (pointer: fine).
 */
export function MagneticButton({ children, href, onClick, style, strength = 0.28, className }: MagneticButtonProps) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch
    const wrap = wrapRef.current;
    const inn  = innerRef.current;
    if (!wrap || !inn) return;

    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width  / 2;
    const y = e.clientY - rect.top  - rect.height / 2;

    gsap.to(wrap, { x: x * strength,        y: y * strength,        duration: 0.35, ease: 'power2.out' });
    gsap.to(inn,  { x: x * strength * 0.4,  y: y * strength * 0.4,  duration: 0.30, ease: 'power2.out' });
  }

  function onLeave() {
    gsap.to([wrapRef.current, innerRef.current], {
      x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)',
    });
  }

  const inner = (
    <div
      ref={wrapRef}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: 'inline-block', willChange: 'transform' }}
    >
      <div ref={innerRef} style={{ display: 'inline-block', willChange: 'transform' }}>
        {href ? (
          <Link href={href} style={style}>{children}</Link>
        ) : (
          <button onClick={onClick} style={{ border: 'none', cursor: 'pointer', background: 'none', padding: 0, ...style }}>
            {children}
          </button>
        )}
      </div>
    </div>
  );

  return inner;
}
