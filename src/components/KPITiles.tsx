import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, DollarSign, Activity, Shield, BarChart3 } from 'lucide-react';

interface KPITilesProps {
  metrics: {
    peRatio: number;
    pbRatio: number;
    debtToEquity: number;
    currentRatio: number;
    roe: number;
    revenueGrowth: number;
    epsGrowth: number;
    fcfGrowth: number;
  };
}

export function KPITiles({ metrics }: KPITilesProps) {
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  const formatRatio = (value: number) => {
    return value.toFixed(2);
  };
  
  const isGoodGrowth = (value: number) => value > 0.10;
  const isGoodPE = (value: number) => value > 0 && value < 25;
  const isGoodDebt = (value: number) => value < 1.0;
  const isGoodCurrent = (value: number) => value > 1.5;
  const isGoodROE = (value: number) => value > 0.15;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700">Revenue Growth</p>
              <p className="text-2xl mt-2 text-blue-900">
                {formatPercent(metrics.revenueGrowth)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isGoodGrowth(metrics.revenueGrowth) ? 'bg-green-500' : 'bg-gray-400'}`}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              EPS: {formatPercent(metrics.epsGrowth)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700">P/E Ratio</p>
              <p className="text-2xl mt-2 text-purple-900">
                {formatRatio(metrics.peRatio)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isGoodPE(metrics.peRatio) ? 'bg-green-500' : 'bg-gray-400'}`}>
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-xs text-purple-600">
              P/B: {formatRatio(metrics.pbRatio)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700">Return on Equity</p>
              <p className="text-2xl mt-2 text-green-900">
                {formatPercent(metrics.roe)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isGoodROE(metrics.roe) ? 'bg-green-500' : 'bg-gray-400'}`}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-600">
              FCF Growth: {formatPercent(metrics.fcfGrowth)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-orange-700">Financial Health</p>
              <p className="text-2xl mt-2 text-orange-900">
                {formatRatio(metrics.currentRatio)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isGoodCurrent(metrics.currentRatio) && isGoodDebt(metrics.debtToEquity) ? 'bg-green-500' : 'bg-gray-400'}`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-orange-200">
            <p className="text-xs text-orange-600">
              D/E: {formatRatio(metrics.debtToEquity)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
