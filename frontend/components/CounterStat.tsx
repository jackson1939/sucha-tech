'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface CounterStatProps {
  value:   string;   // ej: "20+", "< 30s", "500+", "0 %"
  label:   string;
  delay?:  number;
  style?:  React.CSSProperties;
}

/**
 * CounterStat — anima el número desde 0 hasta el valor
 * cuando el elemento entra en el viewport.
 */
export function CounterStat({ value, label, delay = 0, style }: CounterStatProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const numRef  = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const num  = numRef.current;
    if (!wrap || !num) return;

    // Parsear: extraer número, prefijo y sufijo
    const match  = value.match(/[\d.]+/);
    const parsed = match ? parseFloat(match[0]) : null;
    const prefix = match ? value.slice(0, value.indexOf(match[0])) : '';
    const suffix = match ? value.slice(value.indexOf(match[0]) + match[0].length) : '';
    const isInt  = parsed !== null && Number.isInteger(parsed);

    // Animación de entrada de la card
    const cardAnim = gsap.from(wrap, {
      y: 24, opacity: 0, duration: 0.55, ease: 'back.out(1.4)', delay,
      scrollTrigger: { trigger: wrap, start: 'top 85%', once: true },
    });

    // Counter animation
    let counterAnim: gsap.core.Tween | null = null;
    if (parsed !== null) {
      const obj = { val: 0 };
      counterAnim = gsap.to(obj, {
        val: parsed,
        duration: 1.8,
        ease: 'power2.out',
        delay,
        scrollTrigger: { trigger: wrap, start: 'top 85%', once: true },
        onUpdate() {
          if (!num) return;
          const v = obj.val;
          num.textContent = prefix + (isInt ? Math.round(v) : v.toFixed(1)) + suffix;
        },
        onStart() {
          if (num) num.textContent = `${prefix}0${suffix}`;
        },
      });
    }

    return () => {
      cardAnim.kill();
      counterAnim?.kill();
    };
  }, [value, delay]);

  return (
    <div ref={wrapRef} className="stat-card glass" style={{ borderRadius: 20, padding: '28px 20px', textAlign: 'center', ...style }}>
      <p ref={numRef} style={{
        fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 900,
        background: 'var(--grad-text)', WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent', marginBottom: 8,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</p>
    </div>
  );
}
