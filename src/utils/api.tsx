/**
 * API utility functions with fallback support
 * Provides resilient API calls that fall back to Yahoo Finance when Edge Functions fail
 */

import { projectId, publicAnonKey } from './supabase/info';

// Edge Function folder is named "server" (from /supabase/functions/server/)
// Routes in the function are prefixed with /make-server-517ac4ba
// So the base URL includes both the function name and the route prefix
// NOTE: The function name comes from the FOLDER name, not the deployment slug!
export const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/server/make-server-517ac4ba`;

console.log('[API] Edge Function URL:', SERVER_URL);
console.log('[API] Project ID:', projectId);

/**
 * Analyze a stock symbol with automatic fallback to Yahoo Finance
 * 
 * @param symbol - Stock ticker symbol (e.g., "AAPL", "MSFT")
 * @returns Stock analysis data
 */
export async function analyzeSymbol(symbol: string) {
  try {
    console.log(`[API] Analyzing ${symbol} via Edge Function...`);
    
    const res = await fetch(
      `${SERVER_URL}/stock/${encodeURIComponent(symbol)}`,
      {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      }
    );
    
    if (!res.ok) {
      const error = await res.json();
      console.warn(`[API] Edge function failed for ${symbol}:`, error);
      throw new Error(error.error || 'Edge function failed');
    }
    
    const data = await res.json();
    console.log(`[API] ✅ Got data for ${symbol} from Edge Function`);
    return data;
    
  } catch (err) {
    console.warn(`[API] Supabase failed for ${symbol}, falling back to Yahoo...`);
    
    try {
      // Fallback to Yahoo Finance
      const yahooRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`
      );
      
      if (!yahooRes.ok) {
        throw new Error('Yahoo Finance request failed');
      }
      
      const yahooData = await yahooRes.json();
      const quote = yahooData.chart?.result?.[0];
      
      if (!quote) {
        throw new Error('No data available for symbol');
      }
      
      const meta = quote.meta;
      const price = meta.regularMarketPrice || 0;
      const previousClose = meta.previousClose || price;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
      
      console.log(`[API] ✅ Got fallback data for ${symbol} from Yahoo Finance`);
      
      // Return data in OpenBox format
      return {
        symbol: symbol.toUpperCase(),
        companyName: meta.longName || meta.shortName || symbol,
        price,
        changes: changePercent,
        currency: meta.currency || 'USD',
        marketCap: meta.marketCap || 0,
        industry: 'Unknown',
        sector: 'Unknown',
        score: 50, // Neutral score for fallback data
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
        source: 'Yahoo Finance (Fallback)',
        fallback: true
      };
      
    } catch (fallbackErr) {
      console.error(`[API] ❌ Both Edge Function and Yahoo fallback failed for ${symbol}:`, fallbackErr);
      throw new Error(`Unable to fetch data for ${symbol}. Please try again later.`);
    }
  }
}

/**
 * Get popular stock symbols
 * 
 * @returns Array of popular ticker symbols
 */
export async function getPopularStocks(): Promise<string[]> {
  try {
    const res = await fetch(
      `${SERVER_URL}/stocks/popular`,
      {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      }
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch popular stocks');
    }
    
    const data = await res.json();
    return data.symbols || [];
    
  } catch (err) {
    console.warn('[API] Failed to fetch popular stocks, using defaults:', err);
    // Fallback to hardcoded popular stocks
    return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM'];
  }
}

/**
 * Test Edge Function connectivity
 * 
 * @returns Health check result
 */
export async function testEdgeFunction(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(
      `${SERVER_URL}/health`,
      {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      }
    );
    
    if (!res.ok) {
      return { ok: false, message: 'Edge Function returned error' };
    }
    
    const data = await res.json();
    return { ok: data.status === 'ok', message: 'Edge Function is healthy' };
    
  } catch (err) {
    return { ok: false, message: `Edge Function unreachable: ${err}` };
  }
}
