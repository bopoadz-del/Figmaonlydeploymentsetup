import { TrendingUp, TrendingDown, Minus, Database, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { EvidenceBadge } from './EvidenceBadge';

interface EvidenceItem {
  source: string;
  tier?: string;
  score?: number;
  as_of: string;
}

interface StockCardProps {
  symbol: string;
  companyName: string;
  price: number;
  changes: number;
  score: number;
  action: string;
  currency?: string;
  breakdown?: {
    growth: number;
    value: number;
    health: number;
    momentum: number;
  };
  evidence?: EvidenceItem[];
  fromCache?: boolean;
  cachedAt?: string;
  demo?: boolean;
  fallback?: boolean;
  neutralScores?: boolean;
  onClick?: () => void;
}

export function StockCard({
  symbol,
  companyName,
  price,
  changes,
  score,
  action,
  currency = 'USD',
  breakdown,
  evidence,
  fromCache,
  cachedAt,
  demo,
  fallback,
  neutralScores,
  onClick
}: StockCardProps) {
  // Guard against invalid data (error markers accidentally added to stocks array)
  if (!symbol || price === undefined || price === null || score === undefined) {
    console.error('StockCard received invalid data:', { symbol, price, score });
    return null;
  }

  const isPositive = changes >= 0;
  const isNeutral = Math.abs(changes) < 0.01;
  
  // Calculate cache age
  const getCacheAge = () => {
    if (!cachedAt) return null;
    const ageMs = Date.now() - new Date(cachedAt).getTime();
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (ageHours > 24) {
      const ageDays = Math.floor(ageHours / 24);
      return `${ageDays}d ago`;
    } else if (ageHours > 0) {
      return `${ageHours}h ago`;
    } else if (ageMinutes > 0) {
      return `${ageMinutes}m ago`;
    } else {
      return 'just now';
    }
  };
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'bg-green-500 hover:bg-green-600';
      case 'HOLD':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'SELL':
        return 'bg-red-500 hover:bg-red-600';
      case 'EXCLUDE':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <Card 
      className={`transition-all hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{symbol}</CardTitle>
              {demo && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  🎭 Demo
                </Badge>
              )}
              {fromCache && !demo && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Database className="w-3 h-3 mr-1" />
                  Cached
                </Badge>
              )}
              {neutralScores && !demo && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  ⚠️ Limited Data
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{companyName}</p>
            {cachedAt && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getCacheAge()}
              </p>
            )}
          </div>
          <Badge className={`${getActionColor(action)} text-white border-0 ml-2`}>
            {action}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">{currency === 'USD' ? '$' : currency}</span>
              <span className="text-3xl">{price.toFixed(2)}</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isNeutral ? (
              <Minus className="w-4 h-4" />
            ) : isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">
              {isPositive ? '+' : ''}{changes.toFixed(2)}%
            </span>
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">OpenBox Score</span>
            <span className={`text-xl ${getScoreColor(score)}`}>
              {score}/100
            </span>
          </div>
          
          {breakdown && (
            <>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Growth:</span>
                  <span className={getScoreColor(breakdown.growth)}>{breakdown.growth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Value:</span>
                  <span className={getScoreColor(breakdown.value)}>{breakdown.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Health:</span>
                  <span className={getScoreColor(breakdown.health)}>{breakdown.health}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Momentum:</span>
                  <span className={getScoreColor(breakdown.momentum)}>{breakdown.momentum}</span>
                </div>
              </div>
              
              {neutralScores && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                  <span className="font-semibold">⚠️ Neutral scores:</span> Price data only, no fundamental analysis available
                </div>
              )}
            </>
          )}
        </div>
        
        {evidence && evidence.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-1.5">
              {evidence.map((item, idx) => (
                <EvidenceBadge
                  key={idx}
                  source={item.source}
                  tier={item.tier}
                  score={item.score}
                  asOf={item.as_of}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
