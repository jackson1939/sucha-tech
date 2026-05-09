'use client';

interface Props { used: number; cap: number }

export function DailyUsageBar({ used, cap }: Props) {
  const pct  = cap > 0 ? Math.min((used / cap) * 100, 100) : 0;
  const near = pct >= 90;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Uso diario voice-only</span>
        <span className={near ? 'font-semibold text-yellow-400' : ''}>{used.toFixed(3)} / {cap} SOL</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${near ? 'bg-yellow-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
