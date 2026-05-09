'use client';

interface CardProps { children: React.ReactNode; className?: string }

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-slate-700/50 bg-slate-800/80 p-5 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}
