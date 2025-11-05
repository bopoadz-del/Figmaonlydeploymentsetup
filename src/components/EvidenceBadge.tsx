import { CheckCircle2, Award, Star } from 'lucide-react';

interface EvidenceBadgeProps {
  source: string;
  tier?: string;
  score?: number;
  asOf?: string;
  size?: 'sm' | 'md';
}

export function EvidenceBadge({ source, tier, score, asOf, size = 'sm' }: EvidenceBadgeProps) {
  const getTierColor = (tier?: string) => {
    const t = (tier || '').toLowerCase();
    if (/leader|tier 1|top 10|platinum/i.test(t)) return 'text-green-600 bg-green-50 border-green-200';
    if (/strong performer|challenger|tier 2|top 50|gold/i.test(t)) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (/visionary|contender|high performer|tier 3|silver/i.test(t)) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getIcon = () => {
    if (source.toLowerCase().includes('gartner')) return <Award className="w-3 h-3" />;
    if (source.toLowerCase().includes('g2')) return <Star className="w-3 h-3" />;
    return <CheckCircle2 className="w-3 h-3" />;
  };

  const displayValue = tier || (score !== undefined ? `${score}/100` : '—');
  const colorClass = getTierColor(tier);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${colorClass} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      {getIcon()}
      <div className="flex flex-col leading-tight">
        <span className="opacity-70 text-[10px]">{source}</span>
        <span className="font-semibold">{displayValue}</span>
      </div>
      {asOf && size === 'md' && (
        <span className="text-[10px] opacity-60 ml-1">
          {new Date(asOf).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      )}
    </div>
  );
}
