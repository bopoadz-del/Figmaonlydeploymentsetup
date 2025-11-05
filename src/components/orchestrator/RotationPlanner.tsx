import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Alert, AlertDescription } from "../ui/alert";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

interface Action {
  type: string;
  ticker?: string;
  cat?: string;
  trimShares?: number;
  trimValue?: number;
  excessPct?: number;
  suggestTrimValue?: number;
  action?: string;
  note?: string;
}

interface BuyOrder {
  ticker: string;
  shares: number;
  estCostUSD: number;
  bid: number;
  ask: number;
  rationale: string;
}

interface RotationPlannerProps {
  actions: Action[];
  buyOrders: BuyOrder[];
  onExecute: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function RotationPlanner({ actions, buyOrders, onExecute, onRefresh, loading }: RotationPlannerProps) {
  const totalSells = actions
    .filter(a => a.type === 'POSITION_TRIM' && a.trimValue)
    .reduce((sum, a) => sum + (a.trimValue || 0), 0);
  
  const totalBuys = buyOrders.reduce((sum, o) => sum + o.estCostUSD, 0);

  const hasActions = actions.length > 0 || buyOrders.length > 0;

  return (
    <div className="space-y-4">
      {!hasActions && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Portfolio is balanced. No actions recommended at this time.
          </AlertDescription>
        </Alert>
      )}

      {actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Trims</CardTitle>
            <CardDescription>
              Positions exceeding target allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {action.type === 'POSITION_TRIM' ? (
                        <Badge variant="default">{action.ticker}</Badge>
                      ) : action.type === 'CATEGORY_TRIM' ? (
                        <Badge variant="secondary">{action.cat?.replace(/_/g, ' ')}</Badge>
                      ) : (
                        <Badge>{action.ticker || 'Event'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {action.excessPct && (
                        <span className="text-destructive">
                          +{action.excessPct}% over cap
                        </span>
                      )}
                      {action.note && (
                        <span className="text-muted-foreground text-sm">{action.note}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        {action.trimShares && <span>Trim {action.trimShares} shares</span>}
                        {action.action && <span>{action.action}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {action.trimValue && (
                        <span className="text-destructive">
                          -${action.trimValue.toLocaleString()}
                        </span>
                      )}
                      {action.suggestTrimValue && (
                        <span className="text-destructive">
                          -${action.suggestTrimValue.toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {buyOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Buys</CardTitle>
            <CardDescription>
              Allocate proceeds to underweight categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                  <TableHead>Rationale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyOrders.map((order, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="default">{order.ticker}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{order.shares}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600">
                        ${order.estCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.rationale}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {hasActions && (
        <Card>
          <CardHeader>
            <CardTitle>Trade Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Total Sells</span>
                <div className="text-2xl text-destructive">
                  ${totalSells.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Total Buys</span>
                <div className="text-2xl text-green-600">
                  ${totalBuys.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onRefresh} variant="outline" disabled={loading}>
                Refresh Plan
              </Button>
              <Button onClick={onExecute} disabled={loading}>
                Review Execution
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
