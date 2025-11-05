import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Position {
  ticker: string;
  quantity: number;
  price: number;
  category: string;
  weight: number;
  currentPrice?: number;
  openboxScore?: number;
  openboxAction?: string;
}

interface PortfolioViewProps {
  portfolio: Position[];
  totalValue: number;
  categoryWeights: Record<string, number>;
  categoryCaps: Record<string, number>;
}

export function PortfolioView({ portfolio, totalValue, categoryWeights, categoryCaps }: PortfolioViewProps) {
  const getCategoryColor = (category: string, weight: number) => {
    const cap = categoryCaps[category];
    if (!cap) return "default";
    if (weight > cap + 1) return "destructive";
    if (weight > cap) return "warning";
    return "default";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>
            Total Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(categoryWeights).map(([cat, weight]) => {
              const cap = categoryCaps[cat];
              const isOver = cap && weight > cap;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{cat.replace(/_/g, ' ')}</span>
                    {isOver ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{weight.toFixed(1)}%</span>
                    {cap && (
                      <span className="text-sm text-muted-foreground">
                        / {cap}%
                      </span>
                    )}
                  </div>
                  {isOver && (
                    <Badge variant="destructive" className="text-xs">
                      +{(weight - cap).toFixed(1)}% over
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Book Price</TableHead>
                <TableHead className="text-right">Live Price</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">OpenBox</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.map((position) => {
                const hasLiveData = position.currentPrice !== undefined;
                const priceChange = hasLiveData 
                  ? ((position.currentPrice! - position.price) / position.price) * 100 
                  : 0;
                
                return (
                  <TableRow key={position.ticker}>
                    <TableCell className="font-medium">{position.ticker}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryColor(position.category, position.weight)}>
                        {position.category.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{position.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${position.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasLiveData ? (
                        <div className="flex items-center justify-end gap-1">
                          <span>${position.currentPrice!.toFixed(2)}</span>
                          <span className={`text-xs ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not synced</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      ${(position.quantity * position.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{position.weight.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      {position.openboxScore !== undefined ? (
                        <div className="flex flex-col items-end">
                          <Badge 
                            variant={
                              position.openboxAction === 'BUY' ? 'default' :
                              position.openboxAction === 'SELL' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {position.openboxAction}
                          </Badge>
                          <span className="text-xs text-muted-foreground mt-1">
                            Score: {position.openboxScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
