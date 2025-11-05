import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Order {
  ticker: string;
  shares: number;
  estCostUSD?: number;
  trimValue?: number;
  bid?: number;
  ask?: number;
}

interface ExecutionPanelProps {
  sellOrders: Order[];
  buyOrders: Order[];
  onExecute: (dryRun: boolean, safety: 'limit' | 'market') => void;
  executing?: boolean;
  executionResults?: any;
}

export function ExecutionPanel({ 
  sellOrders, 
  buyOrders, 
  onExecute, 
  executing,
  executionResults 
}: ExecutionPanelProps) {
  const [dryRun, setDryRun] = useState(true);
  const [safety, setSafety] = useState<'limit' | 'market'>('limit');

  const isMarketOpen = () => {
    const now = new Date();
    const nyTime = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const nyDate = new Date(nyTime);
    const day = nyDate.getDay();
    const hour = nyDate.getHours();
    const minute = nyDate.getMinutes();
    
    if (day === 0 || day === 6) return false;
    const totalMinutes = hour * 60 + minute;
    return totalMinutes >= 9 * 60 + 30 && totalMinutes <= 16 * 60;
  };

  const marketOpen = isMarketOpen();

  return (
    <div className="space-y-4">
      <Alert variant={marketOpen ? "default" : "destructive"}>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          {marketOpen ? (
            "Market is OPEN (9:30 AM - 4:00 PM ET)"
          ) : (
            "Market is CLOSED. Orders will be queued for next trading session."
          )}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Execution Settings</CardTitle>
          <CardDescription>
            Configure how trades will be executed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dry-run">Dry Run Mode</Label>
              <div className="text-sm text-muted-foreground">
                Preview trades without executing (send to Slack for approval)
              </div>
            </div>
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
          </div>

          <div className="space-y-2">
            <Label>Order Type</Label>
            <div className="flex gap-2">
              <Button
                variant={safety === 'limit' ? 'default' : 'outline'}
                onClick={() => setSafety('limit')}
                className="flex-1"
              >
                Limit Orders
              </Button>
              <Button
                variant={safety === 'market' ? 'default' : 'outline'}
                onClick={() => setSafety('market')}
                className="flex-1"
              >
                Market Orders
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {safety === 'limit' 
                ? 'Safer: Uses bid/ask with cushion to prevent slippage'
                : 'Faster: Executes immediately at market price'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders to Execute</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sellOrders.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-destructive">Sell Orders ({sellOrders.length})</h4>
              <div className="space-y-2">
                {sellOrders.map((order, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{order.ticker}</Badge>
                      <span>{Math.abs(order.shares)} shares</span>
                    </div>
                    <span className="text-destructive">
                      ${(order.trimValue || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {buyOrders.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-green-600">Buy Orders ({buyOrders.length})</h4>
              <div className="space-y-2">
                {buyOrders.map((order, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">{order.ticker}</Badge>
                      <span>{order.shares} shares</span>
                    </div>
                    <span className="text-green-600">
                      ${(order.estCostUSD || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => onExecute(dryRun, safety)} 
            disabled={executing || (sellOrders.length === 0 && buyOrders.length === 0)}
            className="w-full"
            size="lg"
          >
            {executing ? 'Executing...' : dryRun ? 'Send Preview to Slack' : 'Execute Trades'}
          </Button>

          {!dryRun && !marketOpen && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Market is closed. Enable "force" mode to queue orders or wait until market opens.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {executionResults && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {executionResults.status === 'preview-sent-to-slack' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Preview sent to Slack. Check your configured webhook for approval link.
                </AlertDescription>
              </Alert>
            )}
            {executionResults.sells?.map((result: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                {result.error ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>Sell failed: {result.error}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Sell order placed: {result.symbol || 'Unknown'}</span>
                  </>
                )}
              </div>
            ))}
            {executionResults.buys?.map((result: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                {result.error ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>Buy failed: {result.error}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Buy order placed: {result.symbol || 'Unknown'}</span>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
