import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { KPITiles } from './KPITiles';
import { Separator } from './ui/separator';
import { EvidenceBadge } from './EvidenceBadge';
import { FinancialScores } from './FinancialScores';

interface StockDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: any;
}

export function StockDetailModal({ open, onOpenChange, stock }: StockDetailModalProps) {
  if (!stock) return null;
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'bg-green-500';
      case 'HOLD':
        return 'bg-yellow-500';
      case 'SELL':
        return 'bg-red-500';
      case 'EXCLUDE':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };
  
  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toFixed(0)}`;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{stock.symbol}</DialogTitle>
              <DialogDescription className="mt-1">
                {stock.companyName}
              </DialogDescription>
            </div>
            <Badge className={`${getActionColor(stock.action)} text-white border-0`}>
              {stock.action}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="text-xl mt-1">
                {stock.currency === 'USD' ? '$' : stock.currency}{stock.price.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Change</p>
              <p className={`text-xl mt-1 ${stock.changes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.changes >= 0 ? '+' : ''}{stock.changes.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Market Cap</p>
              <p className="text-xl mt-1">{formatMarketCap(stock.marketCap)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">OpenBox Score</p>
              <p className="text-xl mt-1">{stock.score}/100</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="mb-2">Industry & Sector</h3>
            <div className="flex gap-2">
              <Badge variant="outline">{stock.industry}</Badge>
              <Badge variant="outline">{stock.sector}</Badge>
            </div>
          </div>
          
          {stock.neutralScores && (
            <>
              <Separator />
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h3 className="text-orange-900 mb-1">Limited Data Mode</h3>
                    <p className="text-sm text-orange-800">
                      This stock is showing price data from Yahoo Finance, but fundamental analysis is not available. 
                      All scores are neutral (50/100) and metrics are unavailable. This typically happens when the 
                      Edge Function API is rate limited (25 calls/day on free tier).
                    </p>
                    <p className="text-sm text-orange-800 mt-2">
                      <strong>Tip:</strong> Wait for rate limits to reset or check cached stocks for full analysis.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <Separator />
          
          <div>
            <h3 className="mb-4">Score Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">Growth Score</p>
                <p className="text-3xl mt-2 text-blue-900">{stock.breakdown.growth}</p>
                <p className="text-xs text-blue-600 mt-1">30% weight</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">Value Score</p>
                <p className="text-3xl mt-2 text-purple-900">{stock.breakdown.value}</p>
                <p className="text-xs text-purple-600 mt-1">25% weight</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">Health Score</p>
                <p className="text-3xl mt-2 text-green-900">{stock.breakdown.health}</p>
                <p className="text-xs text-green-600 mt-1">25% weight</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-700">Momentum Score</p>
                <p className="text-3xl mt-2 text-orange-900">{stock.breakdown.momentum}</p>
                <p className="text-xs text-orange-600 mt-1">20% weight</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="mb-4">Key Performance Indicators</h3>
            <KPITiles metrics={stock.metrics} />
          </div>
          
          {stock.financialScores && (
            <>
              <Separator />
              <div>
                <h3 className="mb-4">Financial Health Scores</h3>
                <FinancialScores {...stock.financialScores} />
              </div>
            </>
          )}
          
          {stock.evidence && stock.evidence.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3">Evidence-Based Modifiers</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Industry analyst rankings and certifications that provide transparent boosts to scoring pillars (capped at +10 points total).
                </p>
                <div className="flex flex-wrap gap-2">
                  {stock.evidence.map((item: any, idx: number) => (
                    <EvidenceBadge
                      key={idx}
                      source={item.source}
                      tier={item.tier}
                      score={item.score}
                      asOf={item.as_of}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
          
          {stock.ethicsViolation && (
            <>
              <Separator />
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 mb-2">Ethics Firewall</h3>
                <p className="text-sm text-red-700">
                  This stock has been excluded from analysis due to involvement in controversial sectors
                  (tobacco, weapons, gambling, etc.).
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
