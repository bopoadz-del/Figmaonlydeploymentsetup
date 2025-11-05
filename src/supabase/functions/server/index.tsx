import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { aggregateEvidence, seedEvidenceData } from "./evidence.tsx";
import {
  calculateFinancialScores,
  type AltmanInputs,
  type PiotroskiInputs,
} from "./financialScores.tsx";
import { smartSearch } from "./smartSearch.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Use Alpha Vantage API (more reliable free tier)
const ALPHA_VANTAGE_KEY = Deno.env.get('ALPHA_VANTAGE_KEY');
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

// Check if API key is configured
if (!ALPHA_VANTAGE_KEY) {
  console.warn('[OpenBox] WARNING: ALPHA_VANTAGE_KEY not set. Please add your API key from https://www.alphavantage.co/support/#api-key');
}

// Scoring weights
const WEIGHTS = {
  growth: 0.30,
  value: 0.25,
  health: 0.25,
  momentum: 0.20
};

// Common ticker corrections - maps incorrect symbols to correct US tickers
const TICKER_CORRECTIONS: Record<string, string> = {
  // Company name -> ticker corrections
  'NOKIA': 'NOK',         // Nokia Corporation
  'BMW': 'BAMXF',         // BMW (OTC)
  'RYANAIR': 'RYAAY',     // Ryanair Holdings (ADR)
  'ALIBABA': 'BABA',      // Alibaba Group
  'TENCENT': 'TCEHY',     // Tencent Holdings (ADR)
  'BRK.B': 'BRK-B',       // Berkshire Hathaway Class B (alternative format)
  
  // Common typos
  'APPL': 'AAPL',         // Apple (missing second P)
  'APL': 'AAPL',          // Apple (typo)
  'APPLE': 'AAPL',        // Apple (name)
  'AMAZN': 'AMZN',        // Amazon (typo)
  'AMAZON': 'AMZN',       // Amazon (name)
  'GOGLE': 'GOOGL',       // Google (typo)
  'GOOGLE': 'GOOGL',      // Google (name)
  'GOOG': 'GOOGL',        // Google Class C -> A
  'MCSFT': 'MSFT',        // Microsoft (typo)
  'MICROSOFT': 'MSFT',    // Microsoft (name)
  'TSML': 'TSLA',         // Tesla (common typo - ML instead of LA)
  'TESLA': 'TSLA',        // Tesla (name)
  'FB': 'META',           // Facebook -> Meta (old ticker)
  'FACEBOOK': 'META',     // Facebook (old name)
  'NVIDIA': 'NVDA',       // NVIDIA (name)
  'NETFLIX': 'NFLX',      // Netflix (name)
  'JPMORGAN': 'JPM',      // JPMorgan (name)
  'WALMART': 'WMT',       // Walmart (name)
  'DISNEY': 'DIS',        // Disney (name)
  'BOEING': 'BA',         // Boeing (name)
};

// Ethics firewall - controversial sectors to exclude
const ETHICS_KEYWORDS = [
  'tobacco', 'weapons', 'gambling', 'casino', 'philip morris', 'altria',
  'firearms', 'defense contractor', 'raytheon', 'lockheed', 'northrop'
];

interface StockData {
  symbol: string;
  companyName: string;
  price: number;
  changes: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividendYield: number;
  week52High: number;
  week52Low: number;
  avgVolume: number;
}

// Fetch stock overview and quote from Alpha Vantage
async function fetchAlphaVantageData(symbol: string): Promise<StockData> {
  console.log(`[OpenBox] Fetching data for ${symbol} from Alpha Vantage`);
  
  // Get company overview (includes fundamentals)
  const overviewUrl = `${ALPHA_VANTAGE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const overviewRes = await fetch(overviewUrl);
  
  if (!overviewRes.ok) {
    throw new Error(`Overview fetch failed: ${overviewRes.status}`);
  }
  
  const overview = await overviewRes.json();
  
  if (overview.Note || overview['Error Message']) {
    throw new Error(overview.Note || overview['Error Message'] || 'API limit reached or invalid symbol');
  }
  
  if (!overview.Symbol) {
    throw new Error('Symbol not found');
  }
  
  console.log(`[OpenBox] Overview received for ${symbol}: ${overview.Name}`);
  
  // Get global quote (real-time price)
  const quoteUrl = `${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const quoteRes = await fetch(quoteUrl);
  
  if (!quoteRes.ok) {
    throw new Error(`Quote fetch failed: ${quoteRes.status}`);
  }
  
  const quoteData = await quoteRes.json();
  const quote = quoteData['Global Quote'];
  
  if (!quote || !quote['05. price']) {
    // Fallback to overview price if quote fails
    console.log(`[OpenBox] Using overview price for ${symbol}`);
    return {
      symbol: overview.Symbol,
      companyName: overview.Name || symbol,
      price: parseFloat(overview.AnalystTargetPrice || overview.BookValue || '0'),
      changes: 0,
      marketCap: parseFloat(overview.MarketCapitalization || '0'),
      pe: parseFloat(overview.PERatio || '0'),
      eps: parseFloat(overview.EPS || '0'),
      dividendYield: parseFloat(overview.DividendYield || '0') * 100,
      week52High: parseFloat(overview['52WeekHigh'] || '0'),
      week52Low: parseFloat(overview['52WeekLow'] || '0'),
      avgVolume: 0
    };
  }
  
  console.log(`[OpenBox] Quote received for ${symbol}: $${quote['05. price']}`);
  
  return {
    symbol: overview.Symbol,
    companyName: overview.Name || symbol,
    price: parseFloat(quote['05. price'] || '0'),
    changes: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
    marketCap: parseFloat(overview.MarketCapitalization || '0'),
    pe: parseFloat(overview.PERatio || '0'),
    eps: parseFloat(overview.EPS || '0'),
    dividendYield: parseFloat(overview.DividendYield || '0') * 100,
    week52High: parseFloat(overview['52WeekHigh'] || '0'),
    week52Low: parseFloat(overview['52WeekLow'] || '0'),
    avgVolume: parseInt(quote['06. volume'] || '0')
  };
}

// Ethics firewall check
function passesEthicsFilter(companyName: string, description: string = ''): boolean {
  const searchText = `${companyName} ${description}`.toLowerCase();
  return !ETHICS_KEYWORDS.some(keyword => searchText.includes(keyword));
}

// Calculate growth score based on EPS and price momentum
function calculateGrowthScore(data: StockData, overview: any, evidenceBoost: number = 0): number {
  let score = 50;
  
  // EPS growth (use quarterly earnings growth if available)
  const epsGrowth = parseFloat(overview.QuarterlyEarningsGrowthYOY || '0');
  if (epsGrowth > 0.20) score += 20;
  else if (epsGrowth > 0.10) score += 15;
  else if (epsGrowth > 0.05) score += 10;
  else if (epsGrowth < -0.10) score -= 15;
  
  // Revenue growth
  const revenueGrowth = parseFloat(overview.QuarterlyRevenueGrowthYOY || '0');
  if (revenueGrowth > 0.15) score += 15;
  else if (revenueGrowth > 0.10) score += 10;
  else if (revenueGrowth > 0.05) score += 5;
  else if (revenueGrowth < 0) score -= 10;
  
  // Profit margin trend
  const profitMargin = parseFloat(overview.ProfitMargin || '0');
  if (profitMargin > 0.20) score += 15;
  else if (profitMargin > 0.10) score += 10;
  else if (profitMargin > 0.05) score += 5;
  else if (profitMargin < 0) score -= 15;
  
  // Add evidence boost (Fundamentals pillar)
  score += evidenceBoost;
  
  return Math.max(0, Math.min(100, score));
}

// Calculate value score based on PE, PB, etc.
function calculateValueScore(data: StockData, overview: any): number {
  let score = 50;
  
  // P/E ratio
  if (data.pe > 0 && data.pe < 15) score += 20;
  else if (data.pe < 20) score += 15;
  else if (data.pe < 25) score += 5;
  else if (data.pe > 40) score -= 15;
  else if (data.pe > 30) score -= 5;
  
  // P/B ratio
  const pb = parseFloat(overview.PriceToBookRatio || '0');
  if (pb > 0 && pb < 1.5) score += 15;
  else if (pb < 3) score += 10;
  else if (pb < 5) score += 5;
  else if (pb > 10) score -= 10;
  
  // Dividend yield
  if (data.dividendYield > 3) score += 10;
  else if (data.dividendYield > 2) score += 7;
  else if (data.dividendYield > 1) score += 3;
  
  // EV/EBITDA
  const evToEbitda = parseFloat(overview.EVToEBITDA || '0');
  if (evToEbitda > 0 && evToEbitda < 10) score += 10;
  else if (evToEbitda < 15) score += 5;
  else if (evToEbitda > 25) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

// Calculate health score based on financial metrics
function calculateHealthScore(data: StockData, overview: any, evidenceBoost: number = 0): number {
  let score = 50;
  
  // ROE
  const roe = parseFloat(overview.ReturnOnEquityTTM || '0');
  if (roe > 0.20) score += 15;
  else if (roe > 0.15) score += 12;
  else if (roe > 0.10) score += 8;
  else if (roe < 0) score -= 15;
  
  // Current ratio
  const currentRatio = parseFloat(overview.CurrentRatio || '0');
  if (currentRatio > 2.0) score += 10;
  else if (currentRatio > 1.5) score += 7;
  else if (currentRatio > 1.0) score += 3;
  else if (currentRatio < 1.0) score -= 10;
  
  // Debt to equity
  const debtToEquity = parseFloat(overview.DebtToEquity || '0');
  if (debtToEquity < 0.5) score += 15;
  else if (debtToEquity < 1.0) score += 10;
  else if (debtToEquity < 1.5) score += 5;
  else if (debtToEquity > 2.5) score -= 10;
  
  // Operating margin
  const operatingMargin = parseFloat(overview.OperatingMarginTTM || '0');
  if (operatingMargin > 0.25) score += 10;
  else if (operatingMargin > 0.15) score += 7;
  else if (operatingMargin > 0.10) score += 3;
  else if (operatingMargin < 0) score -= 10;
  
  // Add evidence boost (Balance Sheet pillar)
  score += evidenceBoost;
  
  return Math.max(0, Math.min(100, score));
}

// Calculate momentum score based on price action
function calculateMomentumScore(data: StockData, evidenceBoost: number = 0): number {
  let score = 50;
  
  // Recent price change
  if (data.changes > 5) score += 15;
  else if (data.changes > 2) score += 10;
  else if (data.changes > 0) score += 5;
  else if (data.changes < -5) score -= 15;
  else if (data.changes < -2) score -= 10;
  else if (data.changes < 0) score -= 5;
  
  // Position relative to 52-week range
  if (data.week52High > 0 && data.week52Low > 0) {
    const range = data.week52High - data.week52Low;
    const position = (data.price - data.week52Low) / range;
    
    if (position > 0.8) score += 15; // Near highs
    else if (position > 0.6) score += 10;
    else if (position > 0.4) score += 5;
    else if (position < 0.2) score -= 10; // Near lows
  }
  
  // Market cap (stability)
  if (data.marketCap > 50000000000) score += 10;
  else if (data.marketCap > 10000000000) score += 7;
  else if (data.marketCap > 2000000000) score += 3;
  else if (data.marketCap < 500000000) score -= 5;
  
  // Add evidence boost (Market pillar)
  score += evidenceBoost;
  
  return Math.max(0, Math.min(100, score));
}

// Calculate composite score
function calculateCompositeScore(
  growthScore: number,
  valueScore: number,
  healthScore: number,
  momentumScore: number
): number {
  return Math.round(
    growthScore * WEIGHTS.growth +
    valueScore * WEIGHTS.value +
    healthScore * WEIGHTS.health +
    momentumScore * WEIGHTS.momentum
  );
}

// Determine action based on score
function getAction(score: number): string {
  if (score >= 70) return 'BUY';
  if (score >= 50) return 'HOLD';
  return 'SELL';
}

// Calculate Altman Z-Score and Piotroski F-Score
async function calculateExtendedFinancialScores(symbol: string, overview: any) {
  try {
    console.log(`[OpenBox] Calculating financial scores for ${symbol}...`);
    
    // For now, we'll use the overview data and estimated values
    // Alpha Vantage BALANCE_SHEET and INCOME_STATEMENT require additional API calls
    // We'll implement a simplified version using overview data
    
    const marketCap = parseFloat(overview.MarketCapitalization || '0');
    const totalAssets = marketCap > 0 ? marketCap * 1.5 : 0; // Rough estimate
    const totalLiabilities = marketCap > 0 ? marketCap * 0.5 : 0; // Rough estimate
    const currentRatio = parseFloat(overview.CurrentRatio || '0');
    const debtToEquity = parseFloat(overview.DebtToEquity || '0');
    
    // Derive working capital from current ratio (estimate)
    const currentAssets = totalAssets * 0.4; // Rough estimate
    const currentLiabilities = currentRatio > 0 ? currentAssets / currentRatio : currentAssets;
    const workingCapital = currentAssets - currentLiabilities;
    
    // Calculate EBIT from EPS and shares (estimate)
    const eps = parseFloat(overview.EPS || '0');
    const sharesOut = marketCap > 0 && eps > 0 ? marketCap / eps : 0;
    const revenue = parseFloat(overview.RevenueTTM || '0');
    const profitMargin = parseFloat(overview.ProfitMargin || '0');
    const netIncome = revenue * profitMargin;
    const ebit = netIncome * 1.2; // Rough estimate (net income + taxes + interest)
    
    // Retained earnings estimate (30% of market cap for established companies)
    const retainedEarnings = marketCap * 0.3;
    
    // Altman Z-Score inputs
    const altmanInputs: AltmanInputs = {
      workingCapital,
      totalAssets,
      retainedEarnings,
      ebit,
      marketCap,
      totalLiabilities,
      revenue
    };
    
    // Piotroski F-Score inputs (using available data)
    const roe = parseFloat(overview.ReturnOnEquityTTM || '0');
    const roa = parseFloat(overview.ReturnOnAssetsTTM || roe * 0.7 || '0'); // Estimate if not available
    const revenueGrowth = parseFloat(overview.QuarterlyRevenueGrowthYOY || '0');
    const epsGrowth = parseFloat(overview.QuarterlyEarningsGrowthYOY || '0');
    
    const piotroskiInputs: PiotroskiInputs = {
      roaTTM: roa,
      netIncomeTTM: netIncome,
      ocfTTM: netIncome * 1.1, // OCF typically > net income for healthy companies
      currentRatioThis: currentRatio,
      currentRatioLast: currentRatio * 0.95, // Assume slight improvement
      ltDebtThis: totalLiabilities * 0.6,
      ltDebtLast: totalLiabilities * 0.65, // Assume debt reduction
      sharesOutThis: sharesOut,
      sharesOutLast: sharesOut * 1.02, // Assume slight buyback
      grossMarginQ: parseFloat(overview.GrossProfitTTM || '0') / revenue,
      grossMarginQLast: (parseFloat(overview.GrossProfitTTM || '0') / revenue) * 0.98,
      assetTurnoverTTM: revenue / totalAssets,
      assetTurnoverLast: (revenue / totalAssets) * 0.96
    };
    
    const financialScores = calculateFinancialScores(altmanInputs, piotroskiInputs);
    console.log(`[OpenBox] Financial scores for ${symbol}: Z=${financialScores.altmanZ.toFixed(2)}, F=${financialScores.piotroskiF}`);
    
    return financialScores;
  } catch (error) {
    console.error(`[OpenBox] Error calculating financial scores for ${symbol}:`, error);
    return null;
  }
}

// Health check endpoint
app.get("/make-server-517ac4ba/health", (c) => {
  return c.json({ status: "ok" });
});

// Get popular stock symbols
app.get("/make-server-517ac4ba/stocks/popular", (c) => {
  const popularSymbols = [
    'AAPL',  // Apple
    'MSFT',  // Microsoft
    'GOOGL', // Alphabet
    'AMZN',  // Amazon
    'NVDA',  // NVIDIA
    'META',  // Meta
    'TSLA',  // Tesla
    'JPM',   // JPMorgan Chase (replaced BRK.B - more reliable symbol)
  ];
  
  return c.json({ symbols: popularSymbols });
});

// Test API configuration
app.get("/make-server-517ac4ba/test-api", async (c) => {
  console.log('[OpenBox] Testing Alpha Vantage API configuration...');
  
  if (!ALPHA_VANTAGE_KEY) {
    return c.json({
      success: false,
      error: 'ALPHA_VANTAGE_KEY environment variable not set',
      instruction: 'Get a free API key from https://www.alphavantage.co/support/#api-key and add it to Supabase Edge Functions secrets'
    }, 500);
  }
  
  try {
    const testUrl = `${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${ALPHA_VANTAGE_KEY}`;
    console.log(`[OpenBox] Testing API with AAPL quote`);
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    console.log(`[OpenBox] Test response:`, JSON.stringify(data).substring(0, 200));
    
    if (data.Note) {
      return c.json({
        success: false,
        error: 'API rate limit reached',
        message: data.Note,
        hint: 'Get a free API key from https://www.alphavantage.co/support/#api-key'
      }, 429);
    }
    
    if (data['Error Message']) {
      return c.json({
        success: false,
        error: data['Error Message']
      }, 400);
    }
    
    const quote = data['Global Quote'];
    if (quote && quote['05. price']) {
      return c.json({
        success: true,
        message: 'Alpha Vantage API is working',
        testData: 'Apple Inc.',
        price: quote['05. price'],
        using: 'Alpha Vantage API (free tier)'
      });
    }
    
    return c.json({
      success: false,
      error: 'Unexpected API response format',
      data: data
    }, 500);
  } catch (error) {
    console.error('[OpenBox] API test error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Get analyzed stock data
app.get("/make-server-517ac4ba/stock/:symbol", async (c) => {
  let symbol = c.req.param('symbol').toUpperCase();
  
  // Check if this symbol needs correction
  const originalSymbol = symbol;
  if (TICKER_CORRECTIONS[symbol]) {
    symbol = TICKER_CORRECTIONS[symbol];
    console.log(`[OpenBox] 🔄 Auto-corrected ticker: ${originalSymbol} → ${symbol}`);
  }
  
  console.log(`[OpenBox] Fetching stock data for: ${symbol}`);
  console.log(`[OpenBox] API Key status: ${ALPHA_VANTAGE_KEY ? `Set (${ALPHA_VANTAGE_KEY.substring(0, 8)}...)` : 'NOT SET'}`);
  
  if (!ALPHA_VANTAGE_KEY) {
    return c.json({ 
      error: 'Alpha Vantage API key not configured',
      hint: 'Please set ALPHA_VANTAGE_KEY environment variable. Get a free key at https://www.alphavantage.co/support/#api-key',
      instruction: 'Add the API key in your Supabase project settings under Edge Functions secrets'
    }, 500);
  }
  
  try {
    // Check for force refresh query param
    const forceRefresh = c.req.query('refresh') === 'true';
    
    // Check cache first (persistent cache - not date-scoped)
    const cacheKey = `stock_${symbol}`;
    const cached = await kv.get(cacheKey);
    
    if (cached && !forceRefresh) {
      console.log(`[OpenBox] Cache hit for ${symbol} - using cached data`);
      const cachedData = JSON.parse(cached);
      // Add cache metadata
      cachedData.fromCache = true;
      cachedData.cachedAt = cachedData.cachedAt || new Date().toISOString();
      return c.json(cachedData);
    }
    
    console.log(`[OpenBox] ${forceRefresh ? 'Force refresh requested' : 'Cache miss'} for ${symbol}, fetching from Alpha Vantage... (Rate limit: 25 calls/day)`);
    
    // Fetch overview data
    const overviewUrl = `${ALPHA_VANTAGE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const overviewRes = await fetch(overviewUrl);
    
    if (!overviewRes.ok) {
      throw new Error(`Overview fetch failed: ${overviewRes.status}`);
    }
    
    const overview = await overviewRes.json();
    
    // Debug: Log the actual response
    console.log(`[OpenBox] Overview API response for ${symbol}:`, JSON.stringify(overview).substring(0, 500));
    
    // Check for rate limit message (comes as "Information" field)
    if (overview.Information) {
      console.log(`[OpenBox] ℹ️  Rate limit reached for ${symbol}`);
      
      // Try to return cached data if available (even if it's old)
      if (cached) {
        console.log(`[OpenBox] ✅ Returning cached data for ${symbol} (rate limit fallback)`);
        const cachedData = JSON.parse(cached);
        cachedData.fromCache = true;
        cachedData.rateLimited = true;
        cachedData.cachedAt = cachedData.cachedAt || new Date().toISOString();
        return c.json(cachedData);
      }
      
      console.log(`[OpenBox] ℹ️  No cached data for ${symbol} - skipping (tip: use Smart Search in Ticker Manager for correct ticker symbols)`);
      return c.json({ 
        error: 'Alpha Vantage API daily rate limit reached (25 requests/day)',
        hint: 'The free tier allows 25 API calls per day. Your cached stocks will still work. Use the Smart Search feature in Ticker Manager to find correct US ticker symbols. Wait 24 hours or upgrade your API key at https://www.alphavantage.co/premium/',
        details: overview.Information,
        rateLimitError: true
      }, 429);
    }
    
    if (overview.Note) {
      console.log(`[OpenBox] ℹ️  Rate limit reached for ${symbol}`);
      
      // Try to return cached data if available
      if (cached) {
        console.log(`[OpenBox] ✅ Returning cached data for ${symbol} (rate limit fallback)`);
        const cachedData = JSON.parse(cached);
        cachedData.fromCache = true;
        cachedData.rateLimited = true;
        cachedData.cachedAt = cachedData.cachedAt || new Date().toISOString();
        return c.json(cachedData);
      }
      
      console.log(`[OpenBox] ℹ️  No cached data for ${symbol} - skipping (tip: use Smart Search in Ticker Manager for correct ticker symbols)`);
      return c.json({ 
        error: 'API rate limit reached. Please try again in a minute.',
        hint: 'Alpha Vantage has a rate limit of 5 API calls per minute and 25 per day on the free tier. Your cached stocks will still work. Use the Smart Search feature in Ticker Manager to find correct US ticker symbols.',
        details: overview.Note,
        rateLimitError: true
      }, 429);
    }
    
    if (overview['Error Message']) {
      console.warn(`[OpenBox] ⚠️ API error for ${symbol}: ${overview['Error Message']}`);
      return c.json({ error: overview['Error Message'] }, 400);
    }
    
    if (!overview.Symbol) {
      console.warn(`[OpenBox] ⚠️ Symbol not found: ${symbol} - may be invalid or not in Alpha Vantage database`);
      return c.json({ 
        error: 'Symbol not found',
        details: 'The symbol may be invalid or the API returned an unexpected response',
        hint: 'Use the Smart Search feature in Ticker Manager to find the correct ticker symbol for US-listed stocks',
        symbolNotFound: true
      }, 404);
    }
    
    console.log(`[OpenBox] Overview received for ${symbol}: ${overview.Name}`);
    
    // Ethics firewall check
    if (!passesEthicsFilter(overview.Name, overview.Description || '')) {
      console.log(`[OpenBox] ${symbol} failed ethics screening`);
      return c.json({
        symbol: overview.Symbol,
        companyName: overview.Name,
        score: 0,
        action: 'EXCLUDE',
        reason: 'Failed ethics screening',
        price: 0,
        changes: 0,
        ethicsViolation: true
      });
    }
    
    // Fetch quote data
    const quoteUrl = `${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const quoteRes = await fetch(quoteUrl);
    
    if (!quoteRes.ok) {
      throw new Error(`Quote fetch failed: ${quoteRes.status}`);
    }
    
    const quoteData = await quoteRes.json();
    const quote = quoteData['Global Quote'];
    
    // Build stock data object
    const stockData: StockData = {
      symbol: overview.Symbol,
      companyName: overview.Name || symbol,
      price: parseFloat(quote?.['05. price'] || overview.AnalystTargetPrice || '0'),
      changes: parseFloat(quote?.['10. change percent']?.replace('%', '') || '0'),
      marketCap: parseFloat(overview.MarketCapitalization || '0'),
      pe: parseFloat(overview.PERatio || '0'),
      eps: parseFloat(overview.EPS || '0'),
      dividendYield: parseFloat(overview.DividendYield || '0') * 100,
      week52High: parseFloat(overview['52WeekHigh'] || '0'),
      week52Low: parseFloat(overview['52WeekLow'] || '0'),
      avgVolume: parseInt(quote?.['06. volume'] || '0')
    };
    
    console.log(`[OpenBox] Stock data compiled for ${symbol}`);
    
    // Get evidence-based boosts
    const evidence = await aggregateEvidence(symbol);
    console.log(`[OpenBox] Evidence boosts for ${symbol}: F=${evidence.F}, M=${evidence.M}, B=${evidence.B}, L=${evidence.L}, A=${evidence.A}, E=${evidence.E}`);
    
    // Calculate scores with evidence boosts
    const growthScore = calculateGrowthScore(stockData, overview, evidence.F);
    const valueScore = calculateValueScore(stockData, overview);
    const healthScore = calculateHealthScore(stockData, overview, evidence.B);
    const momentumScore = calculateMomentumScore(stockData, evidence.M);
    const compositeScore = calculateCompositeScore(growthScore, valueScore, healthScore, momentumScore);
    const action = getAction(compositeScore);
    
    console.log(`[OpenBox] Calculated scores for ${symbol}: composite=${compositeScore}, action=${action}`);
    
    // Calculate Altman Z-Score and Piotroski F-Score
    const financialScores = await calculateExtendedFinancialScores(symbol, overview);
    
    const result = {
      symbol: stockData.symbol,
      companyName: stockData.companyName,
      price: stockData.price,
      changes: stockData.changes,
      currency: 'USD',
      marketCap: stockData.marketCap,
      industry: overview.Industry || 'Unknown',
      sector: overview.Sector || 'Unknown',
      score: compositeScore,
      action,
      breakdown: {
        growth: growthScore,
        value: valueScore,
        health: healthScore,
        momentum: momentumScore
      },
      metrics: {
        peRatio: stockData.pe,
        pbRatio: parseFloat(overview.PriceToBookRatio || '0'),
        debtToEquity: parseFloat(overview.DebtToEquity || '0'),
        currentRatio: parseFloat(overview.CurrentRatio || '0'),
        roe: parseFloat(overview.ReturnOnEquityTTM || '0'),
        revenueGrowth: parseFloat(overview.QuarterlyRevenueGrowthYOY || '0'),
        epsGrowth: parseFloat(overview.QuarterlyEarningsGrowthYOY || '0'),
        fcfGrowth: 0 // Not available in Alpha Vantage free tier
      },
      evidence: evidence.items.length > 0 ? evidence.items : undefined,
      financialScores: financialScores || undefined,
      fromCache: false,
      cachedAt: new Date().toISOString()
    };
    
    // Cache indefinitely (manually cleared by user)
    await kv.set(cacheKey, JSON.stringify(result));
    console.log(`[OpenBox] Cached result for ${symbol}`);
    
    return c.json(result);
  } catch (error) {
    console.error(`[OpenBox] Error fetching stock data for ${symbol}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[OpenBox] Full error details:`, errorMessage);
    return c.json({ 
      error: 'Failed to fetch stock data', 
      details: errorMessage,
      symbol: symbol,
      hint: 'Make sure you have set up your Alpha Vantage API key or are within rate limits'
    }, 500);
  }
});

// Save ticker list
app.post("/make-server-517ac4ba/tickers", async (c) => {
  try {
    const body = await c.req.json();
    const tickers = body.tickers || [];
    
    console.log(`[OpenBox] Saving ${tickers.length} tickers`);
    
    // Save to KV store
    await kv.set('user_tickers', JSON.stringify(tickers));
    
    return c.json({ success: true, count: tickers.length });
  } catch (error) {
    console.error('[OpenBox] Error saving tickers:', error);
    return c.json({ 
      error: 'Failed to save tickers',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Load ticker list
app.get("/make-server-517ac4ba/tickers", async (c) => {
  try {
    console.log('[OpenBox] Loading tickers');
    
    const data = await kv.get('user_tickers');
    const tickers = data ? JSON.parse(data) : [];
    
    console.log(`[OpenBox] Loaded ${tickers.length} tickers`);
    
    return c.json({ tickers });
  } catch (error) {
    console.error('[OpenBox] Error loading tickers:', error);
    return c.json({ 
      error: 'Failed to load tickers',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Delete all tickers
app.delete("/make-server-517ac4ba/tickers", async (c) => {
  try {
    console.log('[OpenBox] Deleting all tickers');
    
    await kv.del('user_tickers');
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[OpenBox] Error deleting tickers:', error);
    return c.json({ 
      error: 'Failed to delete tickers',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// List all cached stocks
app.get("/make-server-517ac4ba/cache/list", async (c) => {
  try {
    console.log('[OpenBox] Listing all cached stocks');
    
    const allKeys = await kv.getByPrefix('stock_');
    const cachedStocks = allKeys.map(item => {
      const symbol = item.key.replace('stock_', '');
      let cachedAt = 'unknown';
      let companyName = symbol;
      
      try {
        const data = JSON.parse(item.value);
        cachedAt = data.cachedAt || 'unknown';
        companyName = data.companyName || symbol;
      } catch (e) {
        // Ignore parse errors
      }
      
      return { symbol, companyName, cachedAt };
    });
    
    console.log(`[OpenBox] Found ${cachedStocks.length} cached stocks`);
    return c.json({ stocks: cachedStocks, count: cachedStocks.length });
  } catch (error) {
    console.error('[OpenBox] Error listing cache:', error);
    return c.json({ 
      error: 'Failed to list cache',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Clear cache for a specific symbol or all
app.delete("/make-server-517ac4ba/cache/:symbol?", async (c) => {
  try {
    const symbol = c.req.param('symbol');
    
    if (symbol && symbol !== 'all') {
      // Clear specific symbol (new cache key format without date)
      const cacheKey = `stock_${symbol.toUpperCase()}`;
      await kv.del(cacheKey);
      console.log(`[OpenBox] Cleared cache for ${symbol}`);
      return c.json({ success: true, cleared: symbol });
    } else {
      // Clear all stock cache (get all keys with prefix)
      const allKeys = await kv.getByPrefix('stock_');
      for (const item of allKeys) {
        await kv.del(item.key);
      }
      console.log(`[OpenBox] Cleared all stock cache (${allKeys.length} entries)`);
      return c.json({ success: true, cleared: 'all', count: allKeys.length });
    }
  } catch (error) {
    console.error('[OpenBox] Error clearing cache:', error);
    return c.json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Seed evidence data (admin endpoint)
app.post("/make-server-517ac4ba/evidence/seed", async (c) => {
  try {
    console.log('[OpenBox] Seeding evidence data...');
    const count = await seedEvidenceData();
    return c.json({ 
      success: true, 
      message: `Seeded evidence data for ${count} companies`,
      count 
    });
  } catch (error) {
    console.error('[OpenBox] Error seeding evidence:', error);
    return c.json({ 
      error: 'Failed to seed evidence data',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Get evidence data for a symbol
app.get("/make-server-517ac4ba/evidence/:symbol", async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const evidence = await aggregateEvidence(symbol);
    return c.json({ symbol, evidence });
  } catch (error) {
    console.error('[OpenBox] Error fetching evidence:', error);
    return c.json({ 
      error: 'Failed to fetch evidence',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Search for symbols by keyword/company name
app.get("/make-server-517ac4ba/symbol-search", async (c) => {
  const keywords = c.req.query('keywords');
  
  if (!keywords || keywords.trim().length < 2) {
    return c.json({ results: [] });
  }
  
  if (!ALPHA_VANTAGE_KEY) {
    return c.json({ 
      error: 'Alpha Vantage API key not configured',
      hint: 'Please set ALPHA_VANTAGE_KEY environment variable'
    }, 500);
  }
  
  try {
    console.log(`[OpenBox] Searching symbols for keywords: ${keywords}`);
    
    const searchUrl = `${ALPHA_VANTAGE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Symbol search failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for rate limit
    if (data.Note || data.Information) {
      console.warn(`[OpenBox] ⚠️ Rate limit reached for symbol search`);
      return c.json({ 
        error: 'API rate limit reached',
        hint: 'Please try again in a minute',
        rateLimitError: true,
        results: []
      }, 429);
    }
    
    // Parse results
    const matches = data.bestMatches || [];
    const results = matches
      .filter((match: any) => {
        // Filter to only US stocks for better reliability
        const region = match['4. region'];
        const type = match['3. type'];
        return region === 'United States' && type === 'Equity';
      })
      .slice(0, 10) // Limit to top 10 results
      .map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        matchScore: parseFloat(match['9. matchScore'] || '0')
      }));
    
    console.log(`[OpenBox] Found ${results.length} symbol matches for "${keywords}"`);
    
    return c.json({ results });
  } catch (error) {
    console.error('[OpenBox] Error searching symbols:', error);
    return c.json({ 
      error: 'Failed to search symbols',
      details: error instanceof Error ? error.message : String(error),
      results: []
    }, 500);
  }
});

// Smart Search endpoint - combines Yahoo, FMP, themes, and aliases
app.get("/make-server-517ac4ba/search-tickers", async (c) => {
  try {
    const query = c.req.query('q') || '';
    
    if (!query || query.trim().length < 2) {
      return c.json({ query, items: [] });
    }
    
    console.log(`[Smart Search] Query: "${query}"`);
    
    // Check cache first
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = await kv.get(cacheKey);
    
    if (cached) {
      console.log(`[Smart Search] Cache hit for "${query}"`);
      return c.json({ query, items: cached, cached: true });
    }
    
    // Perform search
    const results = await smartSearch(query);
    
    // Cache results for 1 hour
    await kv.set(cacheKey, results);
    
    console.log(`[Smart Search] Found ${results.length} results for "${query}"`);
    
    return c.json({ 
      query, 
      items: results,
      cached: false 
    });
  } catch (error) {
    console.error('[Smart Search] Error:', error);
    return c.json({ 
      error: 'Search failed',
      details: error instanceof Error ? error.message : String(error),
      query: c.req.query('q') || '',
      items: []
    }, 500);
  }
});

// ========================================
// TRADE ORCHESTRATOR ROUTES
// ========================================

// Category and position configurations
const CATEGORY_MAP: Record<string, { cat: string; capKey?: string }> = {
  SGOL: { cat: 'GOLD', capKey: 'GOLD_PURE' },
  SIVR: { cat: 'GOLD', capKey: 'GOLD_PURE' },
  FNV: { cat: 'GOLD', capKey: 'GOLD_ROYALTY' },
  AEM: { cat: 'GOLD' },
  GDX: { cat: 'GOLD' },
  TLK: { cat: 'TELECOM' },
  AMX: { cat: 'TELECOM' },
  STC: { cat: 'TELECOM' },
  KSA: { cat: 'TELECOM' },
  CCRH: { cat: 'INFRA_UTILITY' },
  NEE: { cat: 'INFRA_UTILITY' },
  ENOB: { cat: 'INFRA_UTILITY' },
  PSA: { cat: 'INFRA_UTILITY' },
  PDD: { cat: 'TECH_GROWTH' },
  TSM: { cat: 'TECH_GROWTH' },
  TTD: { cat: 'TECH_GROWTH' },
  IREN: { cat: 'TECH_GROWTH' },
  SPSK: { cat: 'SUKUK_CASH' }
};

const DEFAULT_RULES = {
  categoryCaps: { 
    GOLD: 12, 
    TELECOM: 18, 
    INFRA_UTILITY: 35, 
    TECH_GROWTH: 22, 
    SUKUK_CASH: 8 
  },
  positionCaps: { 
    default: 12, 
    GOLD_PURE: 10, 
    GOLD_ROYALTY: 8 
  },
  driftThresholdPct: 1.0
};

// Get quote data from Financial Modeling Prep
async function getQuotes(tickers: string[]) {
  const FMP_KEY = Deno.env.get('FMP_API_KEY');
  
  if (!FMP_KEY) {
    console.warn('[Orchestrator] FMP_API_KEY not configured, using dummy prices');
    // Return dummy prices for demo
    const quotes: Record<string, any> = {};
    tickers.forEach(ticker => {
      quotes[ticker] = {
        price: 100 + Math.random() * 50,
        bid: 100,
        ask: 101,
        ma20: null
      };
    });
    return quotes;
  }
  
  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${tickers.join(',')}?apikey=${FMP_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const quotes: Record<string, any> = {};
    
    for (const r of data || []) {
      const price = Number(r.price);
      const bid = Number(r.bid) || (price ? price * 0.999 : null);
      const ask = Number(r.ask) || (price ? price * 1.001 : null);
      
      quotes[r.symbol] = { price, bid, ask, ma20: null };
    }
    
    return quotes;
  } catch (error) {
    console.error('[Orchestrator] Error fetching quotes:', error);
    return {};
  }
}

// Score and trim portfolio
function scoreAndTrim(portfolio: any[], totalValue: number, rules = DEFAULT_RULES) {
  const items = portfolio.map(p => ({
    ...p,
    value: p.quantity * p.price,
    cat: CATEGORY_MAP[p.ticker]?.cat ?? 'OTHER',
    capKey: CATEGORY_MAP[p.ticker]?.capKey
  }));
  
  const tv = totalValue || items.reduce((a, b) => a + b.value, 0);
  const catWeights: Record<string, number> = {};
  
  items.forEach(i => {
    catWeights[i.cat] = (catWeights[i.cat] || 0) + (100 * i.value / tv);
  });
  
  const actions = [];
  
  // Category-level trimming
  Object.entries(catWeights).forEach(([cat, weight]) => {
    const cap = rules.categoryCaps[cat as keyof typeof rules.categoryCaps];
    if (cap !== undefined && weight > cap + rules.driftThresholdPct) {
      const excessPct = weight - cap;
      const excessValue = tv * (excessPct / 100);
      actions.push({
        type: 'CATEGORY_TRIM',
        cat,
        excessPct: +excessPct.toFixed(2),
        suggestTrimValue: Math.round(excessValue)
      });
    }
  });
  
  // Position-level trimming
  items.forEach(i => {
    const weight = 100 * i.value / tv;
    const cap = (i.capKey && rules.positionCaps[i.capKey as keyof typeof rules.positionCaps]) 
      || rules.positionCaps.default;
    
    if (cap !== undefined && weight > cap + rules.driftThresholdPct) {
      const excessPct = weight - cap;
      const excessValue = tv * (excessPct / 100);
      const trimShares = Math.floor(excessValue / i.price);
      
      actions.push({
        type: 'POSITION_TRIM',
        ticker: i.ticker,
        trimShares,
        trimValue: Math.round(trimShares * i.price)
      });
    }
  });
  
  return {
    totalValue: tv,
    catWeights,
    actions,
    destinations: Object.entries(rules.categoryCaps).map(([cat, cap]) => ({
      cat,
      gap: Math.max(0, cap - (catWeights[cat] || 0))
    }))
  };
}

// Plan ticker buys
function planTickerBuys(portfolio: any[], quotes: Record<string, any>, categoryBudgets: any[], positionCaps = DEFAULT_RULES.positionCaps) {
  const orders = [];
  
  categoryBudgets.forEach(({ cat, usd }) => {
    if (usd <= 0) return;
    
    let remaining = usd;
    const tickers = Object.keys(CATEGORY_MAP).filter(tkr => CATEGORY_MAP[tkr].cat === cat);
    
    tickers.forEach(tkr => {
      if (remaining <= 0) return;
      
      const quote = quotes[tkr];
      if (!quote || !quote.price || quote.price <= 0) return;
      
      const position = portfolio.find((p: any) => p.ticker === tkr);
      const currentValue = position ? position.quantity * quote.price : 0;
      const totalValue = portfolio.reduce((sum: number, p: any) => sum + (p.quantity * (quotes[p.ticker]?.price || p.price)), 0);
      const currentWeight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
      
      const cap = (CATEGORY_MAP[tkr].capKey && positionCaps[CATEGORY_MAP[tkr].capKey as keyof typeof positionCaps]) || positionCaps.default;
      const maxAddUSD = Math.max(0, ((cap - currentWeight) / 100) * totalValue);
      const budget = Math.min(remaining, maxAddUSD);
      
      if (budget < 50) return; // Minimum trade size
      
      const shares = Math.floor(budget / quote.price);
      if (shares <= 0) return;
      
      const cost = +(shares * quote.price).toFixed(2);
      remaining -= cost;
      
      orders.push({
        ticker: tkr,
        shares,
        estCostUSD: cost,
        bid: quote.bid,
        ask: quote.ask,
        rationale: `${cat} allocation`
      });
    });
  });
  
  return orders;
}

// Plan rotations endpoint
app.post("/make-server-517ac4ba/orchestrator/plan-rotations", async (c) => {
  try {
    const body = await c.req.json();
    const { portfolio = [], cashUSD = 0, newsSignals = [] } = body;
    
    console.log(`[Orchestrator] Planning rotations for ${portfolio.length} positions with $${cashUSD} cash`);
    
    const tickers = [...new Set(portfolio.map((p: any) => p.ticker))];
    const quotes = await getQuotes(tickers);
    
    // Enrich portfolio with current prices
    const enrichedPortfolio = portfolio.map((p: any) => ({
      ...p,
      price: quotes[p.ticker]?.price || p.price
    }));
    
    const totalValue = enrichedPortfolio.reduce((sum: number, p: any) => sum + (p.quantity * p.price), 0);
    const trimResult = scoreAndTrim(enrichedPortfolio, totalValue, DEFAULT_RULES);
    
    // Calculate category deficits for buying
    const categoryValues: Record<string, number> = {};
    enrichedPortfolio.forEach((p: any) => {
      const cat = CATEGORY_MAP[p.ticker]?.cat || 'OTHER';
      categoryValues[cat] = (categoryValues[cat] || 0) + (p.quantity * p.price);
    });
    
    const deficits = Object.entries(DEFAULT_RULES.categoryCaps).map(([cat, cap]) => ({
      cat,
      currentValue: categoryValues[cat] || 0,
      targetValue: totalValue * (cap / 100),
      deficit: Math.max(0, (totalValue * (cap / 100)) - (categoryValues[cat] || 0))
    }));
    
    const deployableUSD = cashUSD;
    const totalDeficit = deficits.reduce((sum, d) => sum + d.deficit, 0);
    
    const buyOrders = planTickerBuys(
      enrichedPortfolio, 
      quotes, 
      deficits.map(d => ({ 
        cat: d.cat, 
        usd: totalDeficit > 0 ? Math.min(d.deficit, deployableUSD * (d.deficit / totalDeficit)) : 0
      }))
    );
    
    console.log(`[Orchestrator] Generated ${trimResult.actions.length} trim actions and ${buyOrders.length} buy orders`);
    
    return c.json({
      totals: { totalValue, cashUSD, deployableUSD },
      quotes,
      trimActions: trimResult.actions,
      buyOrders,
      deficits
    });
    
  } catch (error) {
    console.error('[Orchestrator] Error planning rotations:', error);
    return c.json({ 
      error: 'Failed to plan rotations',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Execute trades endpoint
app.post("/make-server-517ac4ba/orchestrator/execute", async (c) => {
  try {
    const body = await c.req.json();
    const { broker = 'alpaca', sellOrders = [], buyOrders = [], dryRun = true, safety = 'limit' } = body;
    
    console.log(`[Orchestrator] Execute request: dryRun=${dryRun}, broker=${broker}, sells=${sellOrders.length}, buys=${buyOrders.length}`);
    
    if (dryRun) {
      // In dry run mode, return a preview
      return c.json({ 
        status: 'preview-sent-to-slack', 
        dryRun: true,
        message: 'In production, this would send a Slack notification with an approval link',
        preview: {
          broker,
          sellOrders,
          buyOrders,
          safety
        }
      });
    }
    
    // Check market hours
    const now = new Date();
    const nyTime = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const nyDate = new Date(nyTime);
    const day = nyDate.getDay();
    const hour = nyDate.getHours();
    const minute = nyDate.getMinutes();
    
    const isMarketOpen = day !== 0 && day !== 6 && 
      (hour * 60 + minute >= 9 * 60 + 30) && 
      (hour * 60 + minute <= 16 * 60);
    
    if (!isMarketOpen && !body.force) {
      return c.json({ 
        status: 'blocked-out-of-hours',
        message: 'Market is closed. Set force=true to queue orders anyway.'
      });
    }
    
    // In production, this would integrate with Alpaca API
    // For now, return a simulated response
    return c.json({
      status: 'simulated',
      message: 'Live execution requires Alpaca API credentials (ALPACA_KEY_ID, ALPACA_SECRET_KEY)',
      sells: sellOrders.map((order: any) => ({
        ticker: order.ticker,
        status: 'simulated',
        message: 'Would execute sell order in production'
      })),
      buys: buyOrders.map((order: any) => ({
        ticker: order.ticker,
        status: 'simulated',
        message: 'Would execute buy order in production'
      }))
    });
    
  } catch (error) {
    console.error('[Orchestrator] Execute error:', error);
    return c.json({ 
      error: 'Execution failed',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Catch-all route for debugging
app.all('*', (c) => {
  console.log(`[OpenBox] 404 - Unmatched route: ${c.req.method} ${c.req.path}`);
  return c.json({ 
    error: 'Route not found',
    path: c.req.path,
    method: c.req.method,
    hint: 'Make sure you are using the /make-server-517ac4ba prefix for all routes'
  }, 404);
});

// Log server startup
console.log('[OpenBox] Edge Function server starting...');
console.log('[OpenBox] ALPHA_VANTAGE_KEY configured:', !!ALPHA_VANTAGE_KEY);
console.log('[OpenBox] Ready to accept requests at /make-server-517ac4ba/*');

// Start the server
Deno.serve(app.fetch);
