import { useId } from 'react';
import { Info, Navigation } from 'lucide-react';

interface RouteMapProps {
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  progress: number;
  originLabel: string;
  destinationLabel: string;
  isPlaying?: boolean;
}

export default function RouteMap({ originLng, destinationLng, progress, originLabel, destinationLabel, isPlaying }: RouteMapProps) {
  const gridId = useId().replace(/:/g, '');
  const level = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
  const t = level / 100;
  const eastbound = originLng === null || destinationLng === null || destinationLng >= originLng;
  const start = { x: eastbound ? 100 : 700, y: 240 };
  const end = { x: eastbound ? 700 : 100, y: 240 };
  const point = (p: number) => ({
    x: (1 - p) ** 2 * start.x + 2 * (1 - p) * p * 400 + p ** 2 * end.x,
    y: (1 - p) ** 2 * start.y + 2 * (1 - p) * p * 50 + p ** 2 * end.y,
  });
  const current = point(t);
  const control = { x: start.x + t * (400 - start.x), y: start.y + t * (50 - start.y) };
  const phase = level === 0 ? 'At origin' : level === 100 ? 'At destination' : 'Along the route';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#0c1a33] text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <span className="flex items-center gap-2 text-xs text-amber-300"><Info className="h-4 w-4" /> Simulated progress · Not live GPS</span>
        <span className="text-xs text-slate-300">{isPlaying ? 'Preview playing' : 'Admin-set position'}</span>
      </div>
      <svg viewBox="0 0 800 330" role="img" aria-label={`Simulated route from ${originLabel} to ${destinationLabel}, ${Math.round(level)} percent complete`} className="block min-h-[220px] w-full">
        <defs><pattern id={gridId} width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeOpacity="0.05" /></pattern></defs>
        <rect width="800" height="330" fill={`url(#${gridId})`} />
        <path d={`M ${start.x} ${start.y} Q 400 50 ${end.x} ${end.y}`} fill="none" stroke="#64748b" strokeWidth="4" strokeDasharray="8 8" />
        <path d={`M ${start.x} ${start.y} Q ${control.x} ${control.y} ${current.x} ${current.y}`} fill="none" stroke="#e5bd48" strokeWidth="6" strokeLinecap="round" />
        {[0.25, 0.5, 0.75].map(p => { const pos = point(p); return <g key={p}><circle cx={pos.x} cy={pos.y} r="5" fill={t >= p ? '#e5bd48' : '#475569'} /><text x={pos.x} y={pos.y + 27} textAnchor="middle" fill="#94a3b8" fontSize="12">{p * 100}%</text></g>; })}
        {[{ ...start, label: 'ORIGIN', fill: '#e5bd48' }, { ...end, label: 'DESTINATION', fill: level === 100 ? '#34d399' : '#64748b' }].map(p => <g key={p.label}><circle cx={p.x} cy={p.y} r="10" fill={p.fill} stroke="#fff" strokeWidth="3" /><text x={p.x} y={p.y + 35} textAnchor="middle" fill="#e2e8f0" fontSize="12">{p.label}</text></g>)}
        <g transform={`translate(${current.x} ${current.y})`}>
          <circle r="22" fill="#e5bd48" opacity="0.15" />
          <circle r="12" fill="#e5bd48" stroke="white" strokeWidth="3" />
          <path d="M -4 -4 L 4 -4 L 4 4 L -4 4 Z M -4 -1 L 4 -1" fill="none" stroke="#0c1a33" strokeWidth="1.5" />
          <rect x="-42" y="-58" width="84" height="28" rx="8" fill="#e5bd48" />
          <text y="-39" textAnchor="middle" fill="#0c1a33" fontSize="14" fontWeight="700">{Math.round(level)}%</text>
        </g>
      </svg>
      <div className="space-y-3 border-t border-white/10 px-4 py-4">
        <div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 flex-1 break-words">{originLabel}</span><Navigation className="h-4 w-4 shrink-0 text-amber-300" /><span className="min-w-0 flex-1 break-words text-right">{destinationLabel}</span></div>
        <div role="progressbar" aria-label="Simulated shipment progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level} className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#e5bd48] transition-[width] duration-200" style={{ width: `${level}%` }} /></div>
        <div className="flex justify-between text-xs text-slate-300"><span>{phase} · {Math.round(level)}% complete</span><span>{Math.round(100 - level)}% remaining</span></div>
      </div>
    </div>
  );
}
