'use client';

interface BadgeProps {
  variant?: 'voice' | 'double' | 'success' | 'error' | 'neutral';
  children: React.ReactNode;
}

const variants = {
  voice:   'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  double:  'bg-red-500/15 text-red-300 border border-red-500/30',
  success: 'bg-green-500/20 text-green-300 border border-green-500/30',
  error:   'bg-red-500/20 text-red-300 border border-red-500/30',
  neutral: 'bg-slate-700/50 text-slate-300 border border-slate-600/30',
};

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}
