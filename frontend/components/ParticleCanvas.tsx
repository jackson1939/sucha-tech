'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTheme } from './ThemeProvider';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  baseOpacity: number;
  colorIdx: number;
}

interface Props {
  count?:       number;
  interactive?: boolean;
  connectDist?: number;
  className?:   string;
  style?:       React.CSSProperties;
}

const COLORS_DARK  = ['124,58,237', '99,102,241', '37,99,235', '139,92,246', '59,130,246'];
const COLORS_LIGHT = ['109,40,217', '79,70,229',  '29,78,216', '109,40,217', '37,99,235'];

export function ParticleCanvas({ count = 55, interactive = true, connectDist = 130, className, style }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const mouseRef   = useRef({ x: -9999, y: -9999 });
  const { theme }  = useTheme();

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const isDark = canvas.dataset.theme === 'dark';
    const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

    const particles: Particle[] = (canvas as HTMLCanvasElement & { _particles?: Particle[] })._particles ?? [];

    ctx.clearRect(0, 0, W, H);

    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mouse repulsion
      const dx = p.x - mx;
      const dy = p.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14400) {  // 120px
        const d  = Math.sqrt(d2);
        const f  = (120 - d) / 120;
        p.vx += (dx / d) * f * 0.6;
        p.vy += (dy / d) * f * 0.6;
      }

      p.x  += p.vx;
      p.y  += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;

      // Wrap edges
      if (p.x < 0)  p.x = W;
      if (p.x > W)  p.x = 0;
      if (p.y < 0)  p.y = H;
      if (p.y > H)  p.y = 0;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLORS[p.colorIdx]},${p.opacity})`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const q  = particles[j];
        const ex = p.x - q.x;
        const ey = p.y - q.y;
        const ed = Math.sqrt(ex * ex + ey * ey);
        if (ed < connectDist) {
          const a = (1 - ed / connectDist) * (isDark ? 0.18 : 0.12);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${COLORS[p.colorIdx]},${a})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [connectDist]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Setup canvas size
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width  = rect.width  || window.innerWidth;
      canvas!.height = rect.height || window.innerHeight;
      initParticles();
    }

    function initParticles() {
      const W = canvas!.width;
      const H = canvas!.height;
      const n = Math.min(count, Math.floor((W * H) / 15000)); // adaptive count
      const isDark = theme === 'dark';
      const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

      (canvas as HTMLCanvasElement & { _particles?: Particle[] })._particles = Array.from({ length: n }, () => ({
        x:           Math.random() * W,
        y:           Math.random() * H,
        vx:          (Math.random() - 0.5) * 0.45,
        vy:          (Math.random() - 0.5) * 0.45,
        size:        1 + Math.random() * 2,
        opacity:     0.18 + Math.random() * 0.45,
        baseOpacity: 0.18 + Math.random() * 0.45,
        colorIdx:    Math.floor(Math.random() * COLORS.length),
      }));
    }

    canvas.dataset.theme = theme;
    resize();

    // Mouse tracking
    function onMouseMove(e: MouseEvent) {
      if (!interactive) return;
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMouseLeave() { mouseRef.current = { x: -9999, y: -9999 }; }

    window.addEventListener('resize', resize, { passive: true });
    if (interactive) {
      canvas.closest('div')?.addEventListener('mousemove', onMouseMove as EventListener);
      canvas.closest('div')?.addEventListener('mouseleave', onMouseLeave);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme, count, interactive, animate]);

  // Update theme tag when theme changes
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.dataset.theme = theme;
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
