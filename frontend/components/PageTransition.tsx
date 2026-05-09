'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface PageTransitionProps {
  children:  React.ReactNode;
  className?: string;
  style?:    React.CSSProperties;
}

/**
 * PageTransition — envuelve el contenido de cada página con
 * una animación de entrada suave (fade + slide up).
 * Úsalo en el nivel de la página, no en componentes internos.
 */
export function PageTransition({ children, className, style }: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = gsap.fromTo(el,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'all' },
    );
    return () => { t.kill(); };
  }, []);

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform, opacity', ...style }}>
      {children}
    </div>
  );
}
