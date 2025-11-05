import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  TrendingUp,
  AlertCircle,
  Loader2,
  Filter,
  List,
  Info,
  BarChart3,
  Users,
  Repeat,
} from "lucide-react";
import { StockCard } from "./components/StockCard";
import { StockDetailModal } from "./components/StockDetailModal";
import { TickerManager } from "./components/TickerManager";
import { EvidenceLegend } from "./components/EvidenceLegend";
import { AutoRefreshControl } from "./components/AutoRefreshControl";
import { PortfolioCloning } from "./components/PortfolioCloning";
import { CacheViewer } from "./components/CacheViewer";
import { TradeOrchestrator } from "./components/TradeOrchestrator";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Alert, AlertDescription } from "./components/ui/alert";
import {
  projectId,
  publicAnonKey,
} from "./utils/supabase/info";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";
import { SERVER_URL } from "./utils/api";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import { getDemoStock, getPopularDemoStocks } from "./utils/demoData";

// Note: SERVER_URL is now imported from utils/api.tsx for consistency

// 🔧 DEVELOPMENT MODE - Set to true to use demo data (no Edge Function needed)
// Set to false when Edge Function is deployed
const DEV_MODE = true;

interface EvidenceItem {
  source: string;
  tier?: string;
  score?: number;
  as_of: string;
}

interface Stock {
  symbol: string;
  companyName: string;
  price: number;
  changes: number;
  score: number;
  action: string;
  currency: string;
  marketCap: number;
  industry: string;
  sector: string;
  breakdown: {
    growth: number;
    value: number;
    health: number;
    momentum: number;
  };
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
  evidence?: EvidenceItem[];
  financialScores?: {
    altmanZ: number;
    altmanNormalized: number;
    altmanInterpretation: string;
    piotroskiF: number;
    piotroskiNormalized: number;
    piotroskiInterpretation: string;
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
  };
  ethicsViolation?: boolean;
  fromCache?: boolean;
  cachedAt?: string;
  rateLimited?: boolean;
}

export default function App() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [selectedStock, setSelectedStock] =
    useState<Stock | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "BUY" | "HOLD" | "SELL"
  >("ALL");
  const [activeTab, setActiveTab] = useState<
    "analysis" | "cloning"
  >("analysis");
  const [apiTestResult, setApiTestResult] = useState<
    string | null
  >(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managedTickers, setManagedTickers] = useState<
    string[]
  >([]);
  const [clearingCache, setClearingCache] = useState(false);
  const [seedingEvidence, setSeedingEvidence] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] =
    useState(false);
  const [refreshInterval, setRefreshInterval] =
    useState(300000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    null,
  );
  const [backgroundRefreshing, setBackgroundRefreshing] =
    useState(false);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [edgeFunctionDown, setEdgeFunctionDown] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stocksRef = useRef<Stock[]>(stocks);
  const failedSymbolsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  useEffect(() => {
    // Check Edge Function health on startup
    const checkEdgeFunctionHealth = async () => {
      // 🔧 DEVELOPMENT MODE - Skip health check
      if (DEV_MODE) {
        console.log('[DEV MODE] 🎮 Development mode enabled - using demo data (no Edge Function needed)');
        setEdgeFunctionDown(false);
        return;
      }

      try {
        console.log('[OpenBox] 🔍 Checking Edge Function health...');
        console.log(`[OpenBox] Edge Function URL: ${SERVER_URL}`);
        
        const healthRes = await fetch(`${SERVER_URL}/health`, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });
        
        if (healthRes.ok) {
          const data = await healthRes.json();
          console.log('[OpenBox] ✅ Edge Function is healthy:', data);
          setEdgeFunctionDown(false);
        } else {
          console.warn(`[OpenBox] ⚠️ Edge Function health check failed: ${healthRes.status}`);
          console.warn('[OpenBox] The Edge Function may not be deployed or accessible');
          console.warn('[OpenBox] You will need to deploy the Edge Function for live data to work');
          setEdgeFunctionDown(true);
        }
      } catch (error) {
        console.error('[OpenBox] ❌ Edge Function is not accessible:', error);
        console.error('[OpenBox] ');
        console.error('[OpenBox] 🚨 ACTION REQUIRED: Deploy the Edge Function');
        console.error('[OpenBox] ════════════════════════════════════════════');
        console.error('[OpenBox] ');
        console.error('[OpenBox] The backend server needs to be deployed to Supabase.');
        console.error('[OpenBox] ');
        console.error('[OpenBox] Quick Deploy (2 minutes):');
        console.error('[OpenBox]   1. npm install -g supabase');
        console.error('[OpenBox]   2. supabase login');
        console.error('[OpenBox]   3. supabase functions deploy server --project-ref ' + projectId);
        console.error('[OpenBox] ');
        console.error('[OpenBox] 📖 See DEPLOY_EDGE_FUNCTION.md or SETUP_COMPLETE.md for help');
        console.error('[OpenBox] 📖 Or check /supabase/functions/server/README.md');
        console.error('[OpenBox] ');
        console.error('[OpenBox] Once deployed, refresh this page to start analyzing stocks!');
        console.error('[OpenBox] ════════════════════════════════════════════');
        setEdgeFunctionDown(true);
      }
    };
    
    checkEdgeFunctionHealth();
    loadPopularStocks();
  }, []);

  const loadPopularStocks = async () => {
    setLoading(true);
    setError(null);
    // Clear failed symbols cache when loading popular stocks
    failedSymbolsRef.current.clear();

    try {
      let symbols: string[] = [];
      
      // 🔧 DEVELOPMENT MODE - Use demo data symbols
      if (DEV_MODE) {
        symbols = getPopularDemoStocks();
        console.log('[DEV MODE] ✅ Using demo data symbols:', symbols);
      } else {
        // Try to fetch from Edge Function first
        try {
          const popularRes = await fetch(
            `${SERVER_URL}/stocks/popular`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            },
          );

          if (popularRes.ok) {
            const data = await popularRes.json();
            symbols = data.symbols || [];
            console.log('[OpenBox] ✅ Loaded popular stocks from Edge Function');
          } else {
            throw new Error(`Edge Function returned ${popularRes.status}`);
          }
        } catch (edgeError) {
          // DEMO DATA FALLBACK DISABLED - Use hardcoded popular stocks instead
          console.warn('⚠️ Could not fetch popular stocks from Edge Function, using hardcoded list');
          symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM'];
          // Mark Edge Function as down so we don't spam errors
          setEdgeFunctionDown(true);
        }
      }

      const stocksToLoad = symbols.slice(0, 8);
      const loadedStocks: Stock[] = [];

      for (const symbol of stocksToLoad) {
        try {
          const stockData = await fetchStock(symbol);
          if (
            stockData &&
            "symbol" in stockData &&
            !stockData.ethicsViolation
          ) {
            loadedStocks.push(stockData);
          }
        } catch (err) {
          console.error(`Failed to load ${symbol}:`, err);
        }
      }

      setStocks(loadedStocks);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error loading popular stocks:", err);
      setError(
        "Failed to load stock data. Please check your API configuration.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Invalid/delisted companies with helpful explanations
  const INVALID_TICKERS: Record<string, { reason: string; suggestions: string[] }> = {
    'YAHOO': {
      reason: 'Yahoo is no longer publicly traded (acquired by Verizon in 2017, then sold to Apollo Global in 2021)',
      suggestions: ['GOOGL', 'MSFT', 'META']
    },
    'YHOO': {
      reason: 'Yahoo (YHOO) is no longer publicly traded (acquired by Verizon in 2017)',
      suggestions: ['GOOGL', 'MSFT', 'META']
    },
    'TWTR': {
      reason: 'Twitter (TWTR) was delisted after acquisition by Elon Musk in 2022 (now private as X)',
      suggestions: ['META', 'SNAP', 'PINS']
    },
    'TWITTER': {
      reason: 'Twitter is no longer publicly traded (acquired by Elon Musk in 2022, now private as X)',
      suggestions: ['META', 'SNAP', 'PINS']
    },
    'VINE': {
      reason: 'Vine was shut down in 2017 (was owned by Twitter, never a standalone public company)',
      suggestions: ['META', 'SNAP', 'GOOGL']
    },
    'MYSPACE': {
      reason: 'MySpace was never a standalone public company (acquired by News Corp in 2005)',
      suggestions: ['META', 'SNAP', 'PINS']
    },
    'BLOCKBUSTER': {
      reason: 'Blockbuster filed for bankruptcy in 2010 and is no longer publicly traded',
      suggestions: ['NFLX', 'DIS', 'PARA']
    },
    'TOYS': {
      reason: 'Toys "R" Us filed for bankruptcy in 2017 and was delisted',
      suggestions: ['WMT', 'TGT', 'AMZN']
    },
    'RADIOSHACK': {
      reason: 'RadioShack filed for bankruptcy in 2015 and is no longer publicly traded',
      suggestions: ['BBY', 'AMZN', 'WMT']
    },
    'ENRON': {
      reason: 'Enron filed for bankruptcy in 2001 following an accounting scandal',
      suggestions: ['XOM', 'CVX', 'COP']
    },
    'LEHMAN': {
      reason: 'Lehman Brothers filed for bankruptcy in 2008 during the financial crisis',
      suggestions: ['JPM', 'BAC', 'GS']
    },
    'BEARS': {
      reason: 'Bear Stearns was acquired by JPMorgan Chase in 2008 during the financial crisis',
      suggestions: ['JPM', 'BAC', 'GS']
    },
    'CHAD': {
      reason: 'CHAD is not a valid US stock ticker symbol. Use Smart Search to find valid tickers.',
      suggestions: ['Use Smart Search in Ticker Manager']
    },
  };

  // Common ticker typos and corrections
  const TICKER_TYPO_CORRECTIONS: Record<string, string> = {
    'APPL': 'AAPL',    // Apple (common typo - missing second P)
    'APL': 'AAPL',     // Apple (typo)
    'AAPLE': 'AAPL',   // Apple (typo)
    'APPLE': 'AAPL',   // Apple (name)
    'AMZN': 'AMZN',    // Amazon (correct)
    'AMAZN': 'AMZN',   // Amazon (typo)
    'AMAZON': 'AMZN',  // Amazon (name)
    'GOOGL': 'GOOGL',  // Google (correct)
    'GOGLE': 'GOOGL',  // Google (typo)
    'GOOGLE': 'GOOGL', // Google (name)
    'GOOG': 'GOOGL',   // Google Class C -> Class A (prefer GOOGL)
    'MSFT': 'MSFT',    // Microsoft (correct)
    'MCSFT': 'MSFT',   // Microsoft (typo)
    'MICROSOFT': 'MSFT', // Microsoft (name)
    'TSLA': 'TSLA',    // Tesla (correct)
    'TSML': 'TSLA',    // Tesla (common typo - ML instead of LA)
    'TESLA': 'TSLA',   // Tesla (name)
    'META': 'META',    // Meta (correct)
    'FB': 'META',      // Facebook -> Meta (old ticker)
    'FACEBOOK': 'META', // Facebook (old name)
    'NVDA': 'NVDA',    // NVIDIA (correct)
    'NVIDIA': 'NVDA',  // NVIDIA (name)
    'NFLX': 'NFLX',    // Netflix (correct)
    'NETFLIX': 'NFLX', // Netflix (name)
    'JPM': 'JPM',      // JPMorgan (correct)
    'JPMORGAN': 'JPM', // JPMorgan (name)
    'WMT': 'WMT',      // Walmart (correct)
    'WALMART': 'WMT',  // Walmart (name)
    'DIS': 'DIS',      // Disney (correct)
    'DISNEY': 'DIS',   // Disney (name)
    'BA': 'BA',        // Boeing (correct)
    'BOEING': 'BA',    // Boeing (name)
  };

  const fetchStock = async (
    symbol: string,
    forceRefresh: boolean = false,
  ): Promise<
    | Stock
    | null
    | { rateLimitError: true }
    | { notFoundError: true }
    | { typoCorrection: string }
    | { invalidTicker: true; reason: string; suggestions: string[] }
  > => {
    // 🔧 DEVELOPMENT MODE - Use demo data
    if (DEV_MODE) {
      const demoData = getDemoStock(symbol);
      if (demoData) {
        console.log(`[DEV MODE] ✅ Loaded ${symbol} from demo data`);
        return demoData as Stock;
      } else {
        console.log(`[DEV MODE] ❌ No demo data for ${symbol}`);
        return { notFoundError: true } as any;
      }
    }

    // Check for invalid/delisted tickers first
    const invalidInfo = INVALID_TICKERS[symbol];
    if (invalidInfo) {
      console.log(`❌ \"${symbol}\" is not a valid ticker: ${invalidInfo.reason}`);
      console.log(`💡 Try these instead: ${invalidInfo.suggestions.join(', ')}`);
      return { 
        invalidTicker: true, 
        reason: invalidInfo.reason, 
        suggestions: invalidInfo.suggestions 
      } as any;
    }
    
    // Check for common typos and suggest correction
    const correctedSymbol = TICKER_TYPO_CORRECTIONS[symbol];
    if (correctedSymbol && correctedSymbol !== symbol) {
      console.log(`💡 Did you mean "${correctedSymbol}" instead of "${symbol}"?`);
      return { typoCorrection: correctedSymbol } as any;
    }
    
    // Skip symbols that previously failed (unless force refresh)
    if (!forceRefresh && failedSymbolsRef.current.has(symbol)) {
      console.log(
        `⏭️  Skipping ${symbol} - previously failed (not in cache)`,
      );
      return null;
    }

    // Silent mode in demo environments - only log important info
    const isLikelyDemo = typeof window !== 'undefined' && window.location.protocol === 'plugin:';
    
    if (!isLikelyDemo) {
      console.log(
        `📊 Fetching stock: ${symbol}${forceRefresh ? " (force refresh - will use API call)" : " (will use cache if available)"}`,
      );
    }
    
    // Try Edge Function first
    try {
      const url = forceRefresh
        ? `${SERVER_URL}/stock/${symbol}?refresh=true`
        : `${SERVER_URL}/stock/${symbol}`;

      if (!isLikelyDemo) {
        console.log(`[OpenBox] Fetching from Edge Function: ${url}`);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (!isLikelyDemo) {
        console.log(
          `Response status for ${symbol}:`,
          response.status,
        );
      }

      if (!response.ok) {
        const errorData = await response.json();

      if (errorData.rateLimitError) {
        // Rate limit hit - don't throw error, just log it quietly
        console.log(
          `ℹ️  ${symbol}: Rate limit reached, no cached data available - skipping (use Smart Search to find correct ticker symbols to avoid issues)`,
        );
        setRateLimitHit(true);
        // Track as failed to prevent retry
        failedSymbolsRef.current.add(symbol);
        // Return a marker object so handleSearch knows this was rate limited
        return { rateLimitError: true } as any;
      }

      // Handle 404 (symbol not found) gracefully
      if (
        response.status === 404 ||
        errorData.error === "Symbol not found"
      ) {
        console.warn(
          `⚠️ Symbol not found: ${symbol} - skipping (Tip: Use the smart search in Ticker Manager to find correct ticker symbols)`,
        );
        // Track as failed to prevent retry
        failedSymbolsRef.current.add(symbol);
        // Return a marker object so handleSearch knows this was not found
        return { notFoundError: true } as any;
      }

        // For other errors, log and throw
        console.error(
          `Error fetching ${symbol}:`,
          errorData.error || errorData.details,
        );
        throw new Error(
          errorData.hint ||
            errorData.details ||
            errorData.error ||
            "Failed to fetch stock",
        );
      }

      const data = await response.json();
      
      // Check if ticker was auto-corrected by server
      if (data.symbol && data.symbol !== symbol.toUpperCase()) {
        console.log(`🔄 Ticker auto-corrected: ${symbol} → ${data.symbol}`);
        console.log(`   The server automatically corrected your ticker to the proper US symbol`);
      }
      
      if (!isLikelyDemo) {
        console.log(`✅ Successfully fetched ${symbol} from Edge Function`);
        console.log(`[fetchStock] Data keys:`, Object.keys(data).join(', '));
        console.log(`[fetchStock] Has symbol property:`, 'symbol' in data);

        // Log cache status
        if (data.fromCache) {
          const cacheAge = data.cachedAt
            ? Math.round(
                (Date.now() - new Date(data.cachedAt).getTime()) /
                  (1000 * 60 * 60),
              )
            : "unknown";
          console.log(
            `💾 ${symbol} loaded from cache (${cacheAge}h old)${data.rateLimited ? " - rate limited fallback" : ""}`,
          );
        }
      }

      console.log(`[fetchStock] 🎯 Returning data for ${symbol}, type: ${typeof data}, has symbol: ${'symbol' in data}`);
      return data;
      
    } catch (edgeError) {
      // Edge Function failed - try Yahoo Finance fallback (silently in plugin mode)
      // Only log detailed errors for the first failure to avoid console spam
      if (!isLikelyDemo && !edgeFunctionDown) {
        console.error(`[OpenBox] ❌ Edge Function failed for ${symbol}:`, edgeError);
        console.error(`[OpenBox] Error type: ${edgeError instanceof Error ? edgeError.constructor.name : typeof edgeError}`);
        console.error(`[OpenBox] Error message: ${edgeError instanceof Error ? edgeError.message : String(edgeError)}`);
      }
      
      if (!isLikelyDemo && !edgeFunctionDown) {
        console.log(`[OpenBox] Trying Yahoo Finance fallback for ${symbol}...`);
      }
      
      try {
        const yahooRes = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`
        );
        
        if (!yahooRes.ok) {
          if (!isLikelyDemo) {
            console.log(`[OpenBox] Yahoo Finance returned ${yahooRes.status} for ${symbol}`);
          }
          throw new Error('Yahoo Finance request failed');
        }
        
        const yahooData = await yahooRes.json();
        
        // Better error logging for debugging
        if (!yahooData.chart?.result?.[0]) {
          if (!isLikelyDemo) {
            console.log(`[OpenBox] Yahoo Finance response structure for ${symbol}:`, {
              hasChart: !!yahooData.chart,
              hasResult: !!yahooData.chart?.result,
              resultLength: yahooData.chart?.result?.length,
              error: yahooData.chart?.error
            });
          }
        }
        
        const quote = yahooData.chart?.result?.[0];
        
        if (!quote) {
          if (!isLikelyDemo) {
            console.log(`[OpenBox] Yahoo Finance returned no quote data for ${symbol}`);
            if (yahooData.chart?.error) {
              console.log(`[OpenBox] Yahoo Finance error:`, yahooData.chart.error);
            }
          }
          throw new Error('No Yahoo data available');
        }
        
        const meta = quote.meta;
        const price = meta.regularMarketPrice || 0;
        const previousClose = meta.previousClose || price;
        const change = price - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
        
        if (!isLikelyDemo) {
          console.warn(`⚠️ Using Yahoo Finance fallback for ${symbol}`);
          console.warn(`   Price data: $${price} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
          console.warn(`   ⚠️ SCORES ARE NEUTRAL (50/50/50/50) - No fundamental analysis available`);
          console.warn(`   This happens when Edge Function API is rate limited or unavailable`);
        }
        
        // Return data in OpenBox format with neutral scores
        return {
          symbol: symbol.toUpperCase(),
          companyName: meta.longName || meta.shortName || symbol,
          price,
          changes: changePercent,
          currency: meta.currency || 'USD',
          marketCap: meta.marketCap || 0,
          industry: 'Unknown',
          sector: 'Unknown',
          score: 50,
          action: 'HOLD',
          breakdown: {
            growth: 50,
            value: 50,
            health: 50,
            momentum: 50
          },
          metrics: {
            peRatio: 0,
            pbRatio: 0,
            debtToEquity: 0,
            currentRatio: 0,
            roe: 0,
            revenueGrowth: 0,
            epsGrowth: 0,
            fcfGrowth: 0
          },
          fromCache: false,
          source: 'Yahoo Finance (Fallback - Limited Data)',
          fallback: true,
          neutralScores: true  // Flag to indicate scores are not calculated
        };
        
      } catch (yahooError) {
        // DEMO DATA FALLBACK DISABLED - User wants live data only!
        // Both Edge Function and Yahoo Finance failed - return error
        if (!isLikelyDemo && !edgeFunctionDown) {
          // Only show detailed error if Edge Function isn't known to be down
          console.error(`❌ Unable to fetch live data for ${symbol}:`);
          console.error(`   ❌ Edge Function (Alpha Vantage): ${edgeError instanceof Error ? edgeError.message : 'Failed'}`);
          console.error(`   ❌ Yahoo Finance: ${yahooError instanceof Error ? yahooError.message : 'Failed'}`);
          console.error(`   💡 Possible causes:`);
          console.error(`      - Edge Function not deployed (check warning banner)`);
          console.error(`      - Invalid ticker symbol (use Smart Search in Ticker Manager)`);
          console.error(`      - API rate limits reached (cached stocks will still work)`);
          console.error(`      - Network connectivity issues`);
          console.error(`   ✅ LIVE DATA ONLY MODE - No demo data fallback`);
          console.error(`   📋 Debug: Edge Function URL = ${SERVER_URL}`);
        } else if (!isLikelyDemo && edgeFunctionDown) {
          // Simplified one-line message when we know Edge Function is down
          if (!failedSymbolsRef.current.has(symbol)) {
            console.warn(`⚠️ ${symbol}: Skipped (Edge Function not deployed - see banner for setup)`);
          }
        }
        
        // Mark as failed and return error
        failedSymbolsRef.current.add(symbol);
        return { notFoundError: true } as any;
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=".repeat(60));
    console.log("[handleSearch] 🚀 ANALYZE BUTTON CLICKED - Form submitted");
    console.log("=".repeat(60));

    if (!searchSymbol.trim()) {
      console.log(
        "[handleSearch] Empty search symbol, aborting",
      );
      return;
    }

    const symbolToSearch = searchSymbol.toUpperCase().trim();
    console.log(
      `[handleSearch] 🎯 Target symbol: ${symbolToSearch}`,
    );

    setLoading(true);
    setError(null);
    // Don't clear rateLimitHit here - keep it visible if it was already set

    try {
      console.log(`[handleSearch] 🔍 Calling fetchStock for ${symbolToSearch}...`);
      const stockData = await fetchStock(symbolToSearch);
      console.log(
        `[handleSearch] Received stock data:`,
        stockData ? `Success (type: ${typeof stockData}, keys: ${stockData ? Object.keys(stockData).join(', ') : 'N/A'})` : "Null",
      );

      if (
        stockData &&
        typeof stockData === "object" &&
        "symbol" in stockData
      ) {
        console.log(`[handleSearch] ✅ Valid stock object detected for ${symbolToSearch}`);
        setStocks((prevStocks) => {
          const filtered = prevStocks.filter(
            (s) => s.symbol !== stockData.symbol,
          );
          const newStocks = [stockData, ...filtered];
          console.log(
            `[handleSearch] Updated stocks array, total count: ${newStocks.length}`,
          );
          return newStocks;
        });
        setSearchSymbol("");
        setLastUpdated(new Date());
        console.log(
          `[handleSearch] ✅ Successfully loaded ${symbolToSearch}`,
        );
      } else {
        // Check what type of result we got
        console.log(
          `[handleSearch] Checking result type for ${symbolToSearch}`,
          stockData,
        );
        if (stockData && "invalidTicker" in stockData) {
          // Invalid/delisted ticker - explain why and suggest alternatives
          const invalidData = stockData as any;
          const errorMsg = `\"${symbolToSearch}\" is not available: ${invalidData.reason}`;
          setError(errorMsg);
          toast.error("Invalid Ticker", {
            description: invalidData.reason,
            action: {
              label: `Try ${invalidData.suggestions[0]}`,
              onClick: () => {
                setSearchSymbol(invalidData.suggestions[0]);
                setError(null);
                // Automatically search for the first suggestion
                setTimeout(() => {
                  fetchStock(invalidData.suggestions[0]).then((data) => {
                    if (data && typeof data === "object" && "symbol" in data) {
                      setStocks((prevStocks) => {
                        const filtered = prevStocks.filter((s) => s.symbol !== data.symbol);
                        return [data, ...filtered];
                      });
                      setSearchSymbol("");
                      setLastUpdated(new Date());
                      toast.success(`Loaded ${invalidData.suggestions[0]}`, {
                        description: `Successfully loaded ${data.companyName}`
                      });
                    }
                  });
                }, 100);
              }
            }
          });
          // Show additional suggestions in the error message
          if (invalidData.suggestions.length > 1) {
            console.log(`💡 Suggested alternatives: ${invalidData.suggestions.join(', ')}`);
          }
        } else if (stockData && "typoCorrection" in stockData) {
          // Typo detected - suggest correction
          const corrected = (stockData as any).typoCorrection;
          const errorMsg = `Did you mean "${corrected}"? "${symbolToSearch}" is not a valid ticker. Common typo detected.`;
          setError(errorMsg);
          toast.error("Possible Typo Detected", {
            description: `Did you mean "${corrected}" instead of "${symbolToSearch}"?`,
            action: {
              label: `Load ${corrected}`,
              onClick: () => {
                setSearchSymbol(corrected);
                setError(null);
                // Automatically search for the corrected symbol
                setTimeout(() => {
                  fetchStock(corrected).then((data) => {
                    if (data && typeof data === "object" && "symbol" in data) {
                      setStocks((prevStocks) => {
                        const filtered = prevStocks.filter((s) => s.symbol !== data.symbol);
                        return [data, ...filtered];
                      });
                      setSearchSymbol("");
                      setLastUpdated(new Date());
                      toast.success(`Loaded ${corrected}`, {
                        description: `Successfully loaded ${data.companyName}`
                      });
                    }
                  });
                }, 100);
              }
            }
          });
        } else if (stockData && "rateLimitError" in stockData) {
          const errorMsg = `Cannot load "${symbolToSearch}" - you've reached your daily API limit (25 calls/day). Check "View Cache" to see which stocks are available, or wait 24 hours for your quota to reset.`;
          setError(errorMsg);
          toast.error("API Rate Limit Reached", {
            description: `Daily limit exceeded for ${symbolToSearch}. Check cached stocks or wait 24 hours.`
          });
        } else if (stockData && "notFoundError" in stockData) {
          // Special handling for known problematic tickers
          const knownIssues: Record<string, string> = {
            'NOK': 'Nokia (NOK) live data is currently unavailable from APIs. Check cached data if you loaded it previously, or try again later.',
            'BB': 'BlackBerry (BB) live data may be temporarily unavailable. Try again later or check cached data.',
            'AMC': 'AMC Entertainment (AMC) live data may be temporarily unavailable. Try again later or check cached data.',
          };
          
          const specificMsg = knownIssues[symbolToSearch];
          const errorMsg = specificMsg || `Symbol "${symbolToSearch}" not found. It may not be a valid US stock ticker. Use Smart Search in Ticker Manager to find the correct symbol.`;
          
          setError(errorMsg);
          toast.error(specificMsg ? "Data Temporarily Unavailable" : "Symbol Not Found", {
            description: specificMsg || `"${symbolToSearch}" is not available. Try Smart Search to find valid US stock tickers.`
          });
        } else if (
          failedSymbolsRef.current.has(symbolToSearch)
        ) {
          // Check if it's a rate limit issue by checking the rateLimitHit flag
          if (rateLimitHit) {
            setError(
              `Cannot load "${symbolToSearch}" - you've reached your daily API limit (25 calls/day). Check "View Cache" to see which stocks are available, or wait 24 hours for your quota to reset.`,
            );
          } else {
            setError(
              `Symbol "${symbolToSearch}" not found. It may not be a valid US stock ticker. Use Smart Search in Ticker Manager to find the correct symbol.`,
            );
          }
          console.log(`[handleSearch] Symbol failed to load`);
        } else if (!stockData) {
          // Handle null/undefined case
          console.log(`[handleSearch] ⚠️ Received null/undefined stock data for ${symbolToSearch}`);
          setError(
            `Unable to load "${symbolToSearch}". This may be due to API limits, invalid symbol, or network issues. Try using Smart Search in Ticker Manager.`,
          );
        } else {
          // Unexpected response type
          console.warn(`[handleSearch] ⚠️ Unexpected response type for ${symbolToSearch}:`, stockData);
          setError(
            `Unexpected response when loading "${symbolToSearch}". Please try again or use a different symbol.`,
          );
        }
      }
    } catch (err) {
      console.error(
        "[handleSearch] Error fetching stock:",
        err,
      );
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch stock data",
      );
    } finally {
      setLoading(false);
      console.log("[handleSearch] Loading complete");
    }
  };

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock);
    setModalOpen(true);
  };

  const handleTickersChange = (symbols: string[]) => {
    setManagedTickers(symbols);
  };

  const handleRunAnalysis = async () => {
    if (managedTickers.length === 0) {
      setError(
        "No tickers to analyze. Add some tickers first.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setStocks([]);
    // Clear failed symbols cache when starting new analysis
    failedSymbolsRef.current.clear();

    const loadedStocks: Stock[] = [];

    for (const symbol of managedTickers) {
      try {
        const stockData = await fetchStock(symbol);
        // Check if it's a valid Stock object (not a marker object like { rateLimitError: true })
        if (
          stockData &&
          typeof stockData === "object" &&
          "symbol" in stockData &&
          !stockData.ethicsViolation
        ) {
          loadedStocks.push(stockData);
        }
      } catch (err) {
        console.error(`Failed to load ${symbol}:`, err);
      }
    }

    setStocks(loadedStocks);
    setLastUpdated(new Date());
    setLoading(false);
    setManagerOpen(false);

    if (loadedStocks.length === 0) {
      setError(
        "No valid stocks loaded. Check symbols or API configuration.",
      );
    }
  };

  const handleClonePortfolio = async (symbols: string[]) => {
    if (symbols.length === 0) {
      setError("No symbols in portfolio to clone.");
      return;
    }

    // Clear failed symbols cache when cloning portfolio
    failedSymbolsRef.current.clear();

    setLoading(true);
    setError(null);
    setStocks([]);
    setActiveTab("analysis");

    const loadedStocks: Stock[] = [];

    for (const symbol of symbols) {
      try {
        const stockData = await fetchStock(symbol);
        // Check if it's a valid Stock object (not a marker object like { rateLimitError: true })
        if (
          stockData &&
          typeof stockData === "object" &&
          "symbol" in stockData &&
          !stockData.ethicsViolation
        ) {
          loadedStocks.push(stockData);
        }
      } catch (err) {
        console.error(`Failed to load ${symbol}:`, err);
      }
    }

    setStocks(loadedStocks);
    setLastUpdated(new Date());
    setLoading(false);

    if (loadedStocks.length === 0) {
      setError(
        "No valid stocks loaded. Check symbols or API configuration.",
      );
    }
  };

  const testApiConfiguration = async () => {
    setApiTestResult("Testing API configuration...");
    setError(null);
    
    console.log('[OpenBox] Testing Edge Function...');
    console.log('[OpenBox] Target URL:', `${SERVER_URL}/test-api`);
    console.log('[OpenBox] Project ID:', projectId);
    
    try {
      const response = await fetch(`${SERVER_URL}/test-api`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      console.log('[OpenBox] Response status:', response.status);
      console.log('[OpenBox] Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenBox] Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("API Test Result:", data);

      if (data.success) {
        setApiTestResult(
          `✅ API Working! ${data.message} - Price: $${data.price}`,
        );
      } else {
        setApiTestResult(`❌ ${data.error || "API Error"}`);
        if (data.hint || data.instruction) {
          setError(data.hint || data.instruction || data.error);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setApiTestResult(`❌ Test Failed: ${errorMsg}`);
      console.error("[OpenBox] API test error:", error);
      console.error("[OpenBox] This likely means the Edge Function is not deployed or reachable");
      setError("Edge Function connection failed. The function may not be deployed yet. Check the console for details.");
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    console.log("[handleClearCache] Clearing all cache...");
    try {
      const response = await fetch(`${SERVER_URL}/cache`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      console.log("[handleClearCache] Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[handleClearCache] Error response:", errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("[handleClearCache] Response data:", data);
      
      if (data.success) {
        setApiTestResult(
          `✅ Cleared ${data.count || 0} cached entries. Fresh data will be fetched on next request.`,
        );
        console.log(`[handleClearCache] ✅ Successfully cleared ${data.count || 0} cache entries`);
      } else {
        setApiTestResult(`❌ Failed to clear cache`);
        console.error("[handleClearCache] Clear cache failed - success=false");
      }
    } catch (error) {
      console.error("[handleClearCache] Cache clear error:", error);
      
      // Check if it's a network/fetch error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setApiTestResult(
          `❌ Cache clear failed: Unable to connect to server. This is normal in demo mode or if the Edge Function is not deployed.`,
        );
        console.log("[handleClearCache] Network error - this is expected in restricted environments");
      } else {
        setApiTestResult(
          `❌ Cache clear failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } finally {
      setClearingCache(false);
    }
  };

  const handleSeedEvidence = async () => {
    setSeedingEvidence(true);
    try {
      const response = await fetch(
        `${SERVER_URL}/evidence/seed`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setApiTestResult(
          `✅ ${data.message}. Clear cache and reload stocks to see evidence badges.`,
        );
      } else {
        setApiTestResult(`❌ Failed to seed evidence data`);
      }
    } catch (error) {
      console.error("Evidence seed error:", error);
      setApiTestResult(
        `❌ Evidence seed failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setSeedingEvidence(false);
    }
  };

  const refreshCurrentStocks = useCallback(
    async (forceRefresh: boolean = false) => {
      const currentStocks = stocksRef.current;
      if (currentStocks.length === 0) {
        console.log("[AutoRefresh] No stocks to refresh");
        return;
      }

      // Clear failed symbols cache on force refresh
      if (forceRefresh) {
        console.log(
          "[AutoRefresh] Force refresh - clearing failed symbols cache",
        );
        failedSymbolsRef.current.clear();
      }

      setBackgroundRefreshing(true);
      console.log(
        `[AutoRefresh] Refreshing current stocks in background${forceRefresh ? " (forced)" : ""}...`,
      );

      try {
        const refreshedStocks: Stock[] = [];
        let rateLimitHit = false;

        for (const stock of currentStocks) {
          try {
            const stockData = await fetchStock(
              stock.symbol,
              forceRefresh,
            );
            if (stockData && !stockData.ethicsViolation) {
              refreshedStocks.push(stockData);
              if (stockData.rateLimited) {
                rateLimitHit = true;
              }
            }
          } catch (err) {
            console.error(
              `[AutoRefresh] Failed to refresh ${stock.symbol}:`,
              err,
            );
            // If error is rate limit, show message and keep old data
            if (
              err instanceof Error &&
              err.message.includes("Rate Limit")
            ) {
              rateLimitHit = true;
              refreshedStocks.push(stock);
            } else {
              refreshedStocks.push(stock);
            }
          }
        }

        setStocks(refreshedStocks);
        setLastUpdated(new Date());

        if (rateLimitHit && forceRefresh) {
          setError(
            "API rate limit reached. Showing cached data where available.",
          );
        }

        console.log(
          "[AutoRefresh] Background refresh complete",
        );
      } catch (err) {
        console.error(
          "[AutoRefresh] Error during background refresh:",
          err,
        );
      } finally {
        setBackgroundRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (autoRefreshEnabled && stocksRef.current.length > 0) {
      console.log(
        `[AutoRefresh] Setting up auto-refresh every ${refreshInterval}ms`,
      );
      refreshTimerRef.current = setInterval(() => {
        refreshCurrentStocks();
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [
    autoRefreshEnabled,
    refreshInterval,
    refreshCurrentStocks,
  ]);

  const handleManualRefresh = () => {
    refreshCurrentStocks(false);
  };

  const handleForceRefresh = () => {
    if (
      confirm(
        "⚠️ Force refresh will use API calls. You have a limit of 25 calls per day. Continue?",
      )
    ) {
      refreshCurrentStocks(true);
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    if (activeFilter === "ALL") return true;
    return stock.action === activeFilter;
  });

  const getStockCounts = () => {
    return {
      buy: stocks.filter((s) => s.action === "BUY").length,
      hold: stocks.filter((s) => s.action === "HOLD").length,
      sell: stocks.filter((s) => s.action === "SELL").length,
    };
  };

  const counts = getStockCounts();

  // App switcher state
  const [currentApp, setCurrentApp] = useState<'openbox' | 'orchestrator'>('openbox');

  // Function to import OpenBox stocks into Trade Orchestrator
  const importToOrchestrator = (selectedStocks: Stock[]) => {
    if (selectedStocks.length === 0) {
      toast.error("No stocks selected to import");
      return;
    }

    // Store selected stocks in localStorage for Orchestrator to read
    const positions = selectedStocks.map(stock => ({
      ticker: stock.symbol,
      quantity: 0, // User will need to set quantity in Orchestrator
      price: stock.price,
      currentPrice: stock.price,
      openboxScore: stock.score,
      openboxAction: stock.action,
      category: stock.sector || 'OTHER'
    }));

    localStorage.setItem('openbox_import', JSON.stringify(positions));
    
    // Switch to Orchestrator
    setCurrentApp('orchestrator');
    
    toast.success(`Imported ${selectedStocks.length} stocks to Trade Orchestrator`, {
      description: "Set quantities in the Manage tab"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 🔧 DEVELOPMENT MODE BANNER */}
      {DEV_MODE && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 text-center shadow-lg">
          <div className="container mx-auto flex items-center justify-center gap-3">
            <span className="text-2xl">🎮</span>
            <div className="text-left">
              <div className="font-bold">DEVELOPMENT MODE</div>
              <div className="text-sm text-purple-100">
                Using demo data • No Edge Function needed • 
                <span className="font-semibold ml-1">Set DEV_MODE = false in App.tsx when deployed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl">
                  {currentApp === 'openbox' ? 'OpenBox' : 'Trade Orchestrator'}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentApp === 'openbox' 
                    ? 'AI-Powered Stock Analysis with Ethics Firewall'
                    : 'Automated Portfolio Rotation & Execution'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={currentApp === 'openbox' ? 'default' : 'outline'}
                onClick={() => setCurrentApp('openbox')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                OpenBox
              </Button>
              <Button
                variant={currentApp === 'orchestrator' ? 'default' : 'outline'}
                onClick={() => setCurrentApp('orchestrator')}
              >
                <Repeat className="w-4 h-4 mr-2" />
                Orchestrator
              </Button>
            </div>
          </div>

          {currentApp === 'openbox' && (
            <>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search stock symbol (e.g., AAPL, MSFT, GOOGL)"
                    value={searchSymbol}
                    onChange={(e) =>
                      setSearchSymbol(e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !searchSymbol.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Analyze"
                  )}
                </Button>

                <Sheet
                  open={managerOpen}
                  onOpenChange={setManagerOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="outline">
                      <List className="w-4 h-4 mr-2" />
                      Manage Tickers
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-[600px] sm:max-w-[600px] overflow-y-auto"
                  >
                    <SheetHeader>
                      <SheetTitle>Ticker Management</SheetTitle>
                      <SheetDescription>
                        Add, edit, import/export your watchlist.
                        Click "Run Analysis" to score all tickers.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <TickerManager
                        onTickersChange={handleTickersChange}
                      />
                      <Button
                        onClick={handleRunAnalysis}
                        className="w-full"
                        disabled={
                          managedTickers.length === 0 || loading
                        }
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Run Analysis ({
                              managedTickers.length
                            }{" "}
                            tickers)
                          </>
                        )}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  type="button"
                  variant="outline"
                  onClick={testApiConfiguration}
                >
                  Test API
                </Button>
                <CacheViewer
                  serverUrl={SERVER_URL}
                  authToken={publicAnonKey}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearCache}
                  disabled={clearingCache}
                >
                  {clearingCache ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Clear Cache"
                  )}
                </Button>
              </form>

              {apiTestResult && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  {apiTestResult}
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSeedEvidence}
                  disabled={seedingEvidence}
                >
                  {seedingEvidence ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Seeding Evidence...
                    </>
                  ) : (
                    "Seed Evidence Data (Gartner/G2/ENR/etc.)"
                  )}
                </Button>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>
                    Loads sample evidence for PANW, ZS, SNOW, NEE,
                    CRH, KO
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {currentApp === 'openbox' && (
        <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md mx-auto mb-8 grid-cols-2">
            <TabsTrigger
              value="analysis"
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Stock Analysis
            </TabsTrigger>
            <TabsTrigger
              value="cloning"
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Portfolio Cloning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {stocks.length > 0 && (
              <div>
                <AutoRefreshControl
                  enabled={autoRefreshEnabled}
                  onToggle={setAutoRefreshEnabled}
                  interval={refreshInterval}
                  onIntervalChange={setRefreshInterval}
                  lastUpdated={lastUpdated}
                  isRefreshing={backgroundRefreshing}
                  onManualRefresh={handleManualRefresh}
                  onForceRefresh={handleForceRefresh}
                />
              </div>
            )}

            <div>
              <EvidenceLegend />
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>⚡ Smart Data System:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>
                    <strong>Multi-Tier Fallback:</strong> Edge Functions → Yahoo Finance → Demo Data. App always works!
                  </li>
                  <li>
                    <strong>Demo Mode:</strong> When APIs are restricted (e.g., Figma plugin), realistic demo data is shown
                  </li>
                  <li>
                    <strong>Intelligent Caching:</strong> Stock
                    data is cached indefinitely - click{" "}
                    <strong>"View Cache"</strong> button above
                    to see all cached stocks
                  </li>
                  <li>
                    <strong>Refresh Options:</strong>
                    <ul className="list-circle ml-5 mt-1">
                      <li>
                        <strong>"Refresh (Cache)"</strong> -
                        Uses cached data, no API calls
                      </li>
                      <li>
                        <strong>"Force Refresh (API)"</strong> -
                        Fetches fresh data (uses API quota)
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Auto-Refresh:</strong> Enable
                    automatic updates using cached data (no API
                    calls unless you force refresh)
                  </li>
                  <li>
                    <strong>Rate Limit Protection:</strong> If
                    you hit the 25/day limit, only cached stocks
                    can load. Check "View Cache" to see what's
                    available.
                  </li>
                  <li>
                    <strong>Smart Search:</strong> Use the Smart
                    Search in Ticker Manager to find correct US
                    ticker symbols (e.g., NOK for Nokia) -
                    prevents wasted API calls
                  </li>
                  <li>
                    Need more calls? Upgrade at{" "}
                    <a
                      href="https://www.alphavantage.co/premium/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900 font-semibold"
                    >
                      alphavantage.co/premium
                    </a>
                  </li>
                  <li>
                    Don't have an API key yet? Get one free at{" "}
                    <a
                      href="https://www.alphavantage.co/support/#api-key"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900 font-semibold"
                    >
                      alphavantage.co/support/#api-key
                    </a>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            {edgeFunctionDown && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="space-y-3">
                    <div>
                      <strong className="text-lg">🚨 SETUP REQUIRED: Edge Function Not Deployed</strong>
                    </div>
                    
                    <div className="p-3 bg-white border border-orange-300 rounded">
                      <div className="font-semibold mb-2">❌ Current Status:</div>
                      <div className="text-sm">
                        The Edge Function at <code className="bg-gray-100 px-1 text-xs">{SERVER_URL}</code> is not responding.
                        This means the backend server is not deployed to Supabase.
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-orange-300 rounded">
                      <div className="font-semibold mb-2">✅ How to Fix (3 steps):</div>
                      <ol className="list-decimal ml-5 text-sm space-y-2">
                        <li>
                          <strong>Install Supabase CLI</strong> (if not already installed):
                          <div className="mt-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-xs">
                            npm install -g supabase
                          </div>
                        </li>
                        <li>
                          <strong>Login to Supabase:</strong>
                          <div className="mt-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-xs">
                            supabase login
                          </div>
                        </li>
                        <li>
                          <strong>Deploy the Edge Function:</strong>
                          <div className="mt-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-xs">
                            supabase functions deploy server --project-ref {projectId}
                          </div>
                        </li>
                      </ol>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-300 rounded">
                      <div className="font-semibold mb-1 text-blue-900">📚 Documentation:</div>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>
                          → <strong>Complete setup guide:</strong> See <code className="bg-blue-100 px-1 rounded">SETUP_COMPLETE.md</code> in project root
                        </div>
                        <div>
                          → <strong>Quick deploy guide:</strong> See <code className="bg-blue-100 px-1 rounded">DEPLOY_EDGE_FUNCTION.md</code>
                        </div>
                        <div>
                          → <strong>Official docs:</strong>{" "}
                          <a 
                            href="https://supabase.com/docs/guides/functions/deploy" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="underline font-semibold hover:text-blue-900"
                          >
                            Supabase deployment guide
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-orange-700 italic">
                      Note: Once deployed, refresh this page to start fetching live stock data.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {rateLimitHit && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>
                    ⚠️ Rate Limit Reached (25 calls/day used):
                  </strong>{" "}
                  Some stocks couldn't load because they're not
                  in your cache yet.
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-white rounded border border-amber-200">
                      <strong className="block mb-2">
                        ✅ What works now:
                      </strong>
                      <ul className="list-disc ml-5 text-sm space-y-1">
                        <li>
                          Click <strong>"View Cache"</strong>{" "}
                          button above to see which stocks are
                          cached
                        </li>
                        <li>
                          Cached stocks will load and refresh
                          without using API calls
                        </li>
                        <li>
                          You can still analyze any cached
                          stocks
                        </li>
                      </ul>
                    </div>
                    <div className="p-3 bg-white rounded border border-amber-200">
                      <strong className="block mb-2">
                        🔄 To load new stocks:
                      </strong>
                      <ul className="list-disc ml-5 text-sm space-y-1">
                        <li>
                          Use <strong>Smart Search</strong> in
                          Ticker Manager to find correct ticker
                          symbols (e.g., NOK for Nokia)
                        </li>
                        <li>
                          Wait 24 hours for your daily quota to
                          reset (free tier = 25 calls/day)
                        </li>
                        <li>
                          Or{" "}
                          <a
                            href="https://www.alphavantage.co/premium/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-semibold hover:text-amber-900"
                          >
                            upgrade your API key
                          </a>{" "}
                          for unlimited calls
                        </li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => setRateLimitHit(false)}
                    className="mt-3 underline hover:text-amber-900 text-sm"
                  >
                    Dismiss this message
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Tabs
                value={activeFilter}
                onValueChange={(v) => setActiveFilter(v as any)}
              >
                <TabsList>
                  <TabsTrigger value="ALL">
                    All Stocks
                    <Badge variant="secondary" className="ml-2">
                      {stocks.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="BUY">
                    Buy
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-green-100 text-green-800"
                    >
                      {counts.buy}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="HOLD">
                    Hold
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-yellow-100 text-yellow-800"
                    >
                      {counts.hold}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="SELL">
                    Sell
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-red-100 text-red-800"
                    >
                      {counts.sell}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {loading && stocks.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">
                    Loading stock analysis...
                  </p>
                </div>
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="text-center py-20">
                {edgeFunctionDown ? (
                  <>
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                    <h3 className="text-gray-700 mb-2 font-semibold">
                      Setup Required
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      The Edge Function needs to be deployed before you can analyze stocks.
                    </p>
                    <p className="text-xs text-gray-500">
                      See the orange banner above for deployment instructions.
                    </p>
                  </>
                ) : (
                  <>
                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-gray-600 mb-2">
                      No stocks found
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activeFilter === "ALL"
                        ? "Search for a stock symbol to begin analysis"
                        : `No stocks with ${activeFilter} recommendation`}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStocks.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    symbol={stock.symbol}
                    companyName={stock.companyName}
                    price={stock.price}
                    changes={stock.changes}
                    score={stock.score}
                    action={stock.action}
                    currency={stock.currency}
                    breakdown={stock.breakdown}
                    evidence={stock.evidence}
                    fromCache={stock.fromCache}
                    cachedAt={stock.cachedAt}
                    onClick={() => handleStockClick(stock)}
                  />
                ))}
              </div>
            )}

            <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
              <h3 className="mb-2">About OpenBox Scoring</h3>
              <p className="text-sm text-gray-600 mb-4">
                OpenBox uses a proprietary algorithm that
                analyzes stocks across four key dimensions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">
                    Growth (30%)
                  </span>
                  <p className="text-gray-500 mt-1">
                    Revenue, earnings, and cash flow growth
                    rates
                  </p>
                </div>
                <div>
                  <span className="text-purple-600">
                    Value (25%)
                  </span>
                  <p className="text-gray-500 mt-1">
                    P/E ratio, P/B ratio, and cash flow yield
                  </p>
                </div>
                <div>
                  <span className="text-green-600">
                    Health (25%)
                  </span>
                  <p className="text-gray-500 mt-1">
                    Debt ratios, current ratio, ROE, and ROIC
                  </p>
                </div>
                <div>
                  <span className="text-orange-600">
                    Momentum (20%)
                  </span>
                  <p className="text-gray-500 mt-1">
                    Price trends and market cap stability
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Ethics Firewall:</strong>{" "}
                  Automatically excludes companies in
                  controversial sectors (tobacco, weapons,
                  gambling, etc.)
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Evidence Layer:</strong> Transparent
                  scoring modifiers from industry analysts
                  (Gartner, Forrester, G2) and sector-specific
                  sources (ENR, BloombergNEF, Interbrand, etc.)
                  provide up to +10 points across scoring
                  pillars with time-based decay.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cloning">
            <PortfolioCloning
              onClonePortfolio={handleClonePortfolio}
              loading={loading}
            />
          </TabsContent>
        </Tabs>

        {/* Stock Detail Modal */}
        <StockDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          stock={selectedStock}
        />
      </div>
      )}
      
      {/* Toast Notifications */}
      <Toaster />

      {/* Trade Orchestrator App */}
      {currentApp === 'orchestrator' && (
        <TradeOrchestrator />
      )}
    </div>
  );
}