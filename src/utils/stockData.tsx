/**
 * Shared stock data utilities for OpenBox and Trade Orchestrator
 * Provides unified stock fetching, validation, and ticker correction
 */

import { SERVER_URL } from './api';
import { publicAnonKey } from './supabase/info';

// Stock data interface - shared between OpenBox and Orchestrator
export interface Stock {
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
  evidence?: Array<{
    source: string;
    tier?: string;
    score?: number;
    as_of: string;
  }>;
  financialScores?: {
    altmanZ: number;
    altmanNormalized: number;
    altmanInterpretation: string;
    piotroskiF: number;
    piotroskiNormalized: number;
    piotroskiInterpretation: string;
    altmanComponents?: any;
    piotroskiBreakdown?: any;
  };
  ethicsViolation?: boolean;
  fromCache?: boolean;
  cachedAt?: string;
  rateLimited?: boolean;
}

// Invalid/delisted companies with helpful explanations
export const INVALID_TICKERS: Record<string, { reason: string; suggestions: string[] }> = {
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
};

// Common ticker typos and corrections
export const TICKER_TYPO_CORRECTIONS: Record<string, string> = {
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

// Category mapping - used by both apps
export const CATEGORY_MAP: Record<string, string> = {
  'SGOL': 'GOLD', 
  'GLD': 'GOLD',
  'SIVR': 'GOLD', 
  'FNV': 'GOLD', 
  'AEM': 'GOLD', 
  'GDX': 'GOLD',
  'TLK': 'TELECOM', 
  'AMX': 'TELECOM', 
  'STC': 'TELECOM', 
  'NOK': 'TELECOM',
  'KSA': 'GCC_ETF',
  'QAT': 'GCC_ETF',
  'CCRH': 'INFRA_UTILITY', 
  'NEE': 'INFRA_UTILITY', 
  'ENOB': 'INFRA_UTILITY', 
  'PSA': 'INFRA_UTILITY',
  'PDD': 'TECH_GROWTH', 
  'TSM': 'TECH_GROWTH', 
  'TTD': 'TECH_GROWTH', 
  'IREN': 'TECH_GROWTH',
  'AAPL': 'TECH_GROWTH',
  'MSFT': 'TECH_GROWTH',
  'GOOGL': 'TECH_GROWTH',
  'SPSK': 'SUKUK_CASH',
  'SHY': 'SUKUK_CASH',
};

/**
 * Validate a ticker symbol
 * Returns validation result with correction suggestions if needed
 */
export function validateTicker(symbol: string): {
  valid: boolean;
  corrected?: string;
  reason?: string;
  suggestions?: string[];
} {
  const upperSymbol = symbol.toUpperCase();
  
  // Check for invalid/delisted tickers
  const invalidInfo = INVALID_TICKERS[upperSymbol];
  if (invalidInfo) {
    return {
      valid: false,
      reason: invalidInfo.reason,
      suggestions: invalidInfo.suggestions
    };
  }
  
  // Check for common typos
  const corrected = TICKER_TYPO_CORRECTIONS[upperSymbol];
  if (corrected && corrected !== upperSymbol) {
    return {
      valid: false,
      corrected,
      reason: `Did you mean "${corrected}"?`
    };
  }
  
  return { valid: true };
}

/**
 * Fetch stock data from Edge Function with Yahoo Finance fallback
 * Shared by OpenBox and Trade Orchestrator
 */
export async function fetchStockData(
  symbol: string,
  forceRefresh: boolean = false
): Promise<Stock | null> {
  const upperSymbol = symbol.toUpperCase();
  
  try {
    const url = forceRefresh
      ? `${SERVER_URL}/stock/${upperSymbol}?refresh=true`
      : `${SERVER_URL}/stock/${upperSymbol}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (errorData.rateLimitError) {
        console.log(`ℹ️  ${upperSymbol}: Rate limit reached`);
        return null;
      }

      if (response.status === 404) {
        console.warn(`⚠️ Symbol not found: ${upperSymbol}`);
        return null;
      }

      throw new Error(errorData.error || 'Failed to fetch stock');
    }

    const data = await response.json();
    return data as Stock;
    
  } catch (edgeError) {
    // Try Yahoo Finance fallback
    try {
      const yahooRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${upperSymbol}?interval=1d&range=1mo`
      );
      
      if (!yahooRes.ok) {
        throw new Error('Yahoo Finance request failed');
      }
      
      const yahooData = await yahooRes.json();
      const quote = yahooData.chart?.result?.[0];
      
      if (!quote) {
        throw new Error('No Yahoo data available');
      }
      
      const meta = quote.meta;
      const price = meta.regularMarketPrice || 0;
      const previousClose = meta.previousClose || price;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
      
      // Return data in OpenBox format with neutral scores
      return {
        symbol: upperSymbol,
        companyName: meta.longName || meta.shortName || upperSymbol,
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
      };
      
    } catch (yahooError) {
      console.error(`❌ Unable to fetch data for ${upperSymbol}`);
      return null;
    }
  }
}

/**
 * Fetch multiple stocks in parallel
 * Used by both apps for bulk loading
 */
export async function fetchMultipleStocks(
  symbols: string[],
  forceRefresh: boolean = false
): Promise<Stock[]> {
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchStockData(symbol, forceRefresh))
  );
  
  return results
    .filter((result): result is PromiseFulfilledResult<Stock> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);
}

/**
 * Get stock category
 * Returns category string or 'OTHER' if not mapped
 */
export function getStockCategory(ticker: string): string {
  return CATEGORY_MAP[ticker.toUpperCase()] || 'OTHER';
}
