import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Info, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface FinancialScoresProps {
  altmanZ?: number;
  altmanNormalized?: number;
  altmanInterpretation?: string;
  piotroskiF?: number;
  piotroskiNormalized?: number;
  piotroskiInterpretation?: string;
  altmanComponents?: {
    workingCapitalRatio: number;
    retainedEarningsRatio: number;
    ebitRatio: number;
    marketCapToLiabRatio: number;
    assetTurnover: number;
  };
  piotroskiBreakdown?: {
    profitability: number;
    leverage: number;
    operating: number;
  };
}

export function FinancialScores({
  altmanZ,
  altmanNormalized,
  altmanInterpretation,
  piotroskiF,
  piotroskiNormalized,
  piotroskiInterpretation,
  altmanComponents,
  piotroskiBreakdown
}: FinancialScoresProps) {
  // Don't render if no data
  if (altmanZ === undefined && piotroskiF === undefined) {
    return null;
  }

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-gray-400';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAltmanIcon = (zScore: number | undefined) => {
    if (zScore === undefined) return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    if (zScore > 2.99) return <Shield className="w-5 h-5 text-green-600" />;
    if (zScore > 1.81) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getPiotroskiIcon = (fScore: number | undefined) => {
    if (fScore === undefined) return <TrendingUp className="w-5 h-5 text-gray-400" />;
    if (fScore >= 8) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (fScore >= 5) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <TrendingUp className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Altman Z-Score Card */}
      {altmanZ !== undefined && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getAltmanIcon(altmanZ)}
                <CardTitle className="text-lg">Altman Z-Score</CardTitle>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Predicts bankruptcy risk. Z &gt; 2.99 = Safe, 1.81-2.99 = Grey Zone, &lt; 1.81 = Distress.
                      Formula: 1.2A + 1.4B + 3.3C + 0.6D + 1.0E
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className={`text-4xl ${getScoreColor(altmanNormalized)}`}>
                  {altmanZ.toFixed(2)}
                </span>
                <div className="text-right">
                  <div className={`text-xl ${getScoreColor(altmanNormalized)}`}>
                    {altmanNormalized}/100
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Normalized</p>
                </div>
              </div>

              {altmanInterpretation && (
                <Badge 
                  variant="outline" 
                  className={`w-full justify-center ${
                    altmanZ > 2.99 ? 'bg-green-50 text-green-700 border-green-200' :
                    altmanZ > 1.81 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {altmanInterpretation}
                </Badge>
              )}

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    altmanZ > 2.99 ? 'bg-green-500' :
                    altmanZ > 1.81 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, altmanNormalized || 0)}%` }}
                />
              </div>

              {/* Components Breakdown */}
              {altmanComponents && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600 mb-2">Components:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">WC/TA:</span>
                      <span className="font-medium">{altmanComponents.workingCapitalRatio.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">RE/TA:</span>
                      <span className="font-medium">{altmanComponents.retainedEarningsRatio.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">EBIT/TA:</span>
                      <span className="font-medium">{altmanComponents.ebitRatio.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mkt/Liab:</span>
                      <span className="font-medium">{altmanComponents.marketCapToLiabRatio.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-500">Sales/TA:</span>
                      <span className="font-medium">{altmanComponents.assetTurnover.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Piotroski F-Score Card */}
      {piotroskiF !== undefined && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPiotroskiIcon(piotroskiF)}
                <CardTitle className="text-lg">Piotroski F-Score</CardTitle>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      9-point scale measuring financial strength. F 8-9 = Strong, 5-7 = Average, 0-4 = Weak.
                      Based on profitability, leverage, and operating efficiency.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className={`text-4xl ${getScoreColor(piotroskiNormalized)}`}>
                    {piotroskiF}
                  </span>
                  <span className="text-2xl text-gray-400 ml-1">/9</span>
                </div>
                <div className="text-right">
                  <div className={`text-xl ${getScoreColor(piotroskiNormalized)}`}>
                    {piotroskiNormalized}/100
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Normalized</p>
                </div>
              </div>

              {piotroskiInterpretation && (
                <Badge 
                  variant="outline" 
                  className={`w-full justify-center ${
                    piotroskiF >= 8 ? 'bg-green-50 text-green-700 border-green-200' :
                    piotroskiF >= 5 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {piotroskiInterpretation}
                </Badge>
              )}

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    piotroskiF >= 8 ? 'bg-green-500' :
                    piotroskiF >= 5 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, piotroskiNormalized || 0)}%` }}
                />
              </div>

              {/* Piotroski Breakdown */}
              {piotroskiBreakdown && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-xs text-gray-600 mb-2">Breakdown:</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Profitability</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(4)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-sm ${
                                i < piotroskiBreakdown.profitability ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium w-6 text-right">
                          {piotroskiBreakdown.profitability}/4
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Leverage</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(3)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-sm ${
                                i < piotroskiBreakdown.leverage ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium w-6 text-right">
                          {piotroskiBreakdown.leverage}/3
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Operating</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(2)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-sm ${
                                i < piotroskiBreakdown.operating ? 'bg-purple-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium w-6 text-right">
                          {piotroskiBreakdown.operating}/2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
