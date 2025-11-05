import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { PortfolioView } from "./orchestrator/PortfolioView";
import { RotationPlanner } from "./orchestrator/RotationPlanner";
import { ExecutionPanel } from "./orchestrator/ExecutionPanel";
import { AlertCircle, Loader2, PlusCircle, Upload, Download, BarChart3 } from "lucide-react";
import { SERVER_URL } from "../utils/api";
import { publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { 
  fetchStockData, 
  validateTicker, 
  getStockCategory,
  type Stock 
} from "../utils/stockData";

interface Position {
  ticker: string;
  quantity: number;
  price: number;
  category?: string;
  weight?: number;
  currentPrice?: number;  // Live price from OpenBox
  openboxScore?: number;   // OpenBox score
  openboxAction?: string;  // OpenBox recommendation
}

export function TradeOrchestrator() {
  const [portfolio, setPortfolio] = useState<Position[]>([]);
  const [cashUSD, setCashUSD] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [planResult, setPlanResult] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Load portfolio from localStorage or use default
  useEffect(() => {
    // Check for OpenBox import
    const importedData = localStorage.getItem('openbox_import');
    if (importedData) {
      try {
        const positions = JSON.parse(importedData);
        setPortfolio(positions);
        localStorage.removeItem('openbox_import'); // Clear after import
        toast.success("Imported positions from OpenBox", {
          description: "Set quantities for each position in the Manage tab"
        });
      } catch (error) {
        console.error('Failed to parse imported data:', error);
      }
    } else {
      // Default portfolio (example)
      const defaultPortfolio = [
        { ticker: 'FNV', quantity: 100, price: 180 },
        { ticker: 'NEE', quantity: 200, price: 75 },
        { ticker: 'SGOL', quantity: 500, price: 18 },
        { ticker: 'TLK', quantity: 300, price: 25 }
      ];
      setPortfolio(defaultPortfolio);
    }
  }, []);

  const addPosition = async () => {
    if (!newTicker || !newQuantity || !newPrice) {
      toast.error("Please fill all fields");
      return;
    }

    // Validate ticker using shared utilities
    const validation = validateTicker(newTicker);
    if (!validation.valid) {
      if (validation.corrected) {
        toast.error("Invalid Ticker", {
          description: validation.reason,
          action: {
            label: `Use ${validation.corrected}`,
            onClick: () => setNewTicker(validation.corrected!)
          }
        });
        return;
      } else if (validation.suggestions) {
        toast.error("Invalid Ticker", {
          description: validation.reason,
          action: {
            label: `Try ${validation.suggestions[0]}`,
            onClick: () => setNewTicker(validation.suggestions![0])
          }
        });
        return;
      }
    }

    const position: Position = {
      ticker: newTicker.toUpperCase(),
      quantity: parseFloat(newQuantity),
      price: parseFloat(newPrice),
      category: getStockCategory(newTicker)
    };

    setPortfolio([...portfolio, position]);
    setNewTicker("");
    setNewQuantity("");
    setNewPrice("");
    toast.success(`Added ${position.ticker} to portfolio`);
  };

  const removePosition = (ticker: string) => {
    setPortfolio(portfolio.filter(p => p.ticker !== ticker));
    toast.success(`Removed ${ticker} from portfolio`);
  };

  // Sync portfolio with live OpenBox data
  const syncWithOpenBox = async () => {
    if (portfolio.length === 0) {
      toast.error("No positions to sync");
      return;
    }

    setLoading(true);
    toast.info("Syncing with OpenBox...", { duration: 2000 });

    try {
      const tickers = portfolio.map(p => p.ticker);
      const stockDataPromises = tickers.map(ticker => fetchStockData(ticker, false));
      const results = await Promise.allSettled(stockDataPromises);

      const updatedPortfolio = portfolio.map((position, index) => {
        const result = results[index];
        if (result.status === 'fulfilled' && result.value) {
          const stockData = result.value;
          return {
            ...position,
            currentPrice: stockData.price,
            openboxScore: stockData.score,
            openboxAction: stockData.action,
            category: getStockCategory(position.ticker)
          };
        }
        return position;
      });

      setPortfolio(updatedPortfolio);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      toast.success(`Synced ${successCount}/${portfolio.length} positions with OpenBox`);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error("Failed to sync with OpenBox");
    } finally {
      setLoading(false);
    }
  };

  const planRotations = async () => {
    setLoading(true);
    setPlanResult(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/orchestrator/plan-rotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          portfolio,
          cashUSD,
          newsSignals: []
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to plan rotations: ${response.status}`);
      }

      const result = await response.json();
      setPlanResult(result);
      toast.success("Rotation plan generated");
    } catch (error) {
      console.error('Error planning rotations:', error);
      toast.error(error instanceof Error ? error.message : "Failed to plan rotations");
    } finally {
      setLoading(false);
    }
  };

  const executeOrders = async (dryRun: boolean, safety: 'limit' | 'market') => {
    if (!planResult) return;

    setExecuting(true);
    setExecutionResult(null);

    try {
      const sellOrders = planResult.trimActions
        ?.filter((a: any) => a.type === 'POSITION_TRIM')
        .map((a: any) => ({
          ticker: a.ticker,
          shares: -a.trimShares,
          trimValue: a.trimValue,
          bid: planResult.quotes?.[a.ticker]?.bid,
          ask: planResult.quotes?.[a.ticker]?.ask
        })) || [];

      const response = await fetch(`${SERVER_URL}/orchestrator/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          broker: 'alpaca',
          sellOrders,
          buyOrders: planResult.buyOrders || [],
          dryRun,
          safety
        })
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.status}`);
      }

      const result = await response.json();
      setExecutionResult(result);
      
      if (dryRun) {
        toast.success("Preview sent to Slack for approval");
      } else {
        toast.success("Orders executed successfully");
      }
    } catch (error) {
      console.error('Execution error:', error);
      toast.error(error instanceof Error ? error.message : "Execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const exportPortfolio = () => {
    const data = JSON.stringify({ portfolio, cashUSD }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Portfolio exported");
  };

  const importPortfolio = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.portfolio) setPortfolio(data.portfolio);
        if (data.cashUSD) setCashUSD(data.cashUSD);
        toast.success("Portfolio imported");
      } catch (error) {
        toast.error("Invalid portfolio file");
      }
    };
    reader.readAsText(file);
  };

  // Calculate enriched portfolio with categories and weights
  const enrichedPortfolio = portfolio.map(p => {
    const totalValue = portfolio.reduce((sum, pos) => sum + (pos.quantity * pos.price), 0);
    const value = p.quantity * p.price;
    const weight = (value / totalValue) * 100;

    return {
      ...p,
      category: p.category || getStockCategory(p.ticker),
      weight
    };
  });

  const totalValue = enrichedPortfolio.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  
  const categoryWeights = enrichedPortfolio.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.weight;
    return acc;
  }, {} as Record<string, number>);

  const categoryCaps = {
    GOLD: 12,
    TELECOM: 18,
    INFRA_UTILITY: 35,
    TECH_GROWTH: 22,
    SUKUK_CASH: 8
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trade Orchestrator</h1>
            <p className="text-muted-foreground">
              Automated portfolio rotation and execution engine
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={syncWithOpenBox}
              disabled={loading || portfolio.length === 0}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Sync with OpenBox
            </Button>
            <Button variant="outline" onClick={exportPortfolio}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" asChild>
              <label>
                <Upload className="h-4 w-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importPortfolio}
                />
              </label>
            </Button>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Trade Orchestrator</strong> manages portfolio rotations based on category caps and position limits.
            <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
              <li><strong>Shared with OpenBox:</strong> Uses the same stock data, ticker validation, and category mapping</li>
              <li><strong>Sync with OpenBox:</strong> Click "Sync with OpenBox" to get live prices and scores for your positions</li>
              <li><strong>Smart Validation:</strong> Automatically validates tickers and suggests corrections for typos</li>
              <li><strong>Live Trading:</strong> Configure Alpaca API keys in environment variables to enable real trades</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="execute">Execute</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4">
            <PortfolioView
              portfolio={enrichedPortfolio}
              totalValue={totalValue}
              categoryWeights={categoryWeights}
              categoryCaps={categoryCaps}
            />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Position</CardTitle>
                <CardDescription>
                  Add a new position to your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticker">Ticker</Label>
                    <Input
                      id="ticker"
                      placeholder="AAPL"
                      value={newTicker}
                      onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="100"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={addPosition}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Position
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Positions</CardTitle>
                <CardDescription>
                  {portfolio.length} position{portfolio.length !== 1 ? 's' : ''} • 
                  Total value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {portfolio.map((p) => (
                    <div key={p.ticker} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{p.ticker}</span>
                          {p.category && (
                            <Badge variant="outline" className="text-xs">
                              {p.category.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {p.quantity} shares @ ${p.price.toFixed(2)}
                          {p.currentPrice && p.currentPrice !== p.price && (
                            <span className="ml-2 text-xs">
                              (Live: ${p.currentPrice.toFixed(2)})
                            </span>
                          )}
                        </div>
                        {p.openboxScore !== undefined && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={
                                p.openboxAction === 'BUY' ? 'default' :
                                p.openboxAction === 'SELL' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {p.openboxAction}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Score: {p.openboxScore}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removePosition(p.ticker)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="cash">Cash (USD)</Label>
                  <Input
                    id="cash"
                    type="number"
                    value={cashUSD}
                    onChange={(e) => setCashUSD(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Rotation Plan</CardTitle>
                <CardDescription>
                  Analyze portfolio and generate recommended trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={planRotations} disabled={loading || portfolio.length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Planning...
                    </>
                  ) : (
                    'Generate Plan'
                  )}
                </Button>
              </CardContent>
            </Card>

            {planResult && (
              <RotationPlanner
                actions={planResult.trimActions || []}
                buyOrders={planResult.buyOrders || []}
                onExecute={() => {
                  // Switch to execute tab
                  const executeTab = document.querySelector('[value="execute"]') as HTMLElement;
                  executeTab?.click();
                }}
                onRefresh={planRotations}
                loading={loading}
              />
            )}
          </TabsContent>

          <TabsContent value="execute" className="space-y-4">
            {!planResult ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Generate a rotation plan first before executing trades.
                </AlertDescription>
              </Alert>
            ) : (
              <ExecutionPanel
                sellOrders={
                  planResult.trimActions
                    ?.filter((a: any) => a.type === 'POSITION_TRIM')
                    .map((a: any) => ({
                      ticker: a.ticker,
                      shares: -a.trimShares,
                      trimValue: a.trimValue,
                      bid: planResult.quotes?.[a.ticker]?.bid,
                      ask: planResult.quotes?.[a.ticker]?.ask
                    })) || []
                }
                buyOrders={planResult.buyOrders || []}
                onExecute={executeOrders}
                executing={executing}
                executionResults={executionResult}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
