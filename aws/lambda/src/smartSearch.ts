/**
 * Smart Search for Stock Tickers
 * Integrates Yahoo Finance, FMP, curated themes, aliases, and ethics filtering
 */

import axios from 'axios';

// Curated investment themes
const THEMES: Record<string, Array<{ ticker: string; name: string; exch: string }>> = {
  gold: [
    { ticker: 'SGOL', name: 'abrdn Physical Gold Shares', exch: 'NYSE' },
    { ticker: 'GLD', name: 'SPDR Gold Trust', exch: 'NYSE' },
    { ticker: 'GDX', name: 'VanEck Gold Miners ETF', exch: 'NYSE' },
    { ticker: 'AEM', name: 'Agnico Eagle Mines', exch: 'NYSE' },
    { ticker: 'FNV', name: 'Franco-Nevada', exch: 'NYSE' }
  ],
  silver: [
    { ticker: 'SIVR', name: 'abrdn Physical Silver', exch: 'NYSE' },
    { ticker: 'SLV', name: 'iShares Silver Trust', exch: 'NYSE' }
  ],
  oil: [
    { ticker: 'XOM', name: 'Exxon Mobil', exch: 'NYSE' },
    { ticker: 'CVX', name: 'Chevron', exch: 'NYSE' },
    { ticker: 'BP', name: 'BP plc', exch: 'NYSE' },
    { ticker: 'SHEL', name: 'Shell plc', exch: 'NYSE' }
  ],
  tech: [
    { ticker: 'AAPL', name: 'Apple Inc.', exch: 'NASDAQ' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', exch: 'NASDAQ' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', exch: 'NASDAQ' },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', exch: 'NASDAQ' },
    { ticker: 'META', name: 'Meta Platforms Inc.', exch: 'NASDAQ' }
  ],
  semiconductor: [
    { ticker: 'NVDA', name: 'NVIDIA Corporation', exch: 'NASDAQ' },
    { ticker: 'TSM', name: 'Taiwan Semiconductor', exch: 'NYSE' },
    { ticker: 'INTC', name: 'Intel Corporation', exch: 'NASDAQ' },
    { ticker: 'AMD', name: 'Advanced Micro Devices', exch: 'NASDAQ' }
  ],
  electric: [
    { ticker: 'TSLA', name: 'Tesla Inc.', exch: 'NASDAQ' },
    { ticker: 'RIVN', name: 'Rivian Automotive', exch: 'NASDAQ' },
    { ticker: 'LCID', name: 'Lucid Group', exch: 'NASDAQ' }
  ],
  banking: [
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', exch: 'NYSE' },
    { ticker: 'BAC', name: 'Bank of America', exch: 'NYSE' },
    { ticker: 'WFC', name: 'Wells Fargo', exch: 'NYSE' },
    { ticker: 'C', name: 'Citigroup', exch: 'NYSE' }
  ],
  telecom: [
    { ticker: 'VZ', name: 'Verizon Communications', exch: 'NYSE' },
    { ticker: 'T', name: 'AT&T Inc.', exch: 'NYSE' },
    { ticker: 'TMUS', name: 'T-Mobile US', exch: 'NASDAQ' },
    { ticker: 'AMX', name: 'América Móvil', exch: 'NYSE' },
    { ticker: 'TLK', name: 'Telkom Indonesia', exch: 'NYSE' }
  ],
  healthcare: [
    { ticker: 'JNJ', name: 'Johnson & Johnson', exch: 'NYSE' },
    { ticker: 'UNH', name: 'UnitedHealth Group', exch: 'NYSE' },
    { ticker: 'PFE', name: 'Pfizer Inc.', exch: 'NYSE' },
    { ticker: 'ABBV', name: 'AbbVie Inc.', exch: 'NYSE' }
  ],
  retail: [
    { ticker: 'WMT', name: 'Walmart Inc.', exch: 'NYSE' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', exch: 'NASDAQ' },
    { ticker: 'TGT', name: 'Target Corporation', exch: 'NYSE' },
    { ticker: 'COST', name: 'Costco Wholesale', exch: 'NASDAQ' }
  ]
};

// Ticker aliases - common name variations to ticker mappings
const ALIASES = new Map<string, string>([
  // Popular companies
  ['apple', 'AAPL'], ['appl', 'AAPL'], ['iphone', 'AAPL'],
  ['microsoft', 'MSFT'], ['windows', 'MSFT'],
  ['google', 'GOOGL'], ['alphabet', 'GOOGL'],
  ['amazon', 'AMZN'],
  ['tesla', 'TSLA'], ['elon', 'TSLA'],
  ['meta', 'META'], ['facebook', 'META'], ['fb', 'META'],
  ['nvidia', 'NVDA'], ['nvdia', 'NVDA'],
  
  // Common symbols
  ['nokia', 'NOK'], ['nok', 'NOK'], ['non', 'NOK'],
  ['jpmorgan', 'JPM'], ['jp morgan', 'JPM'],
  ['walmart', 'WMT'],
  ['disney', 'DIS'],
  ['boeing', 'BA'],
  ['netflix', 'NFLX'],
  
  // International
  ['alibaba', 'BABA'],
  ['tencent', 'TCEHY'],
  ['tsmc', 'TSM'], ['taiwan semi', 'TSM']
]);

// Ethics filter - banned keywords
const BANNED_KEYWORDS = ['tobacco', 'casino', 'weapons', 'alcohol', 'gambling', 'firearms'];

interface SearchResult {
  ticker: string;
  name: string;
  exch: string;
  source: string;
}

/**
 * Normalize query string for matching
 */
function normalize(query: string): string {
  return query.toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Remove duplicate results
 */
function dedupe(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const unique: SearchResult[] = [];
  
  for (const result of results) {
    const key = result.ticker.toUpperCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(result);
    }
  }
  
  return unique;
}

/**
 * Check if result passes ethics filter
 */
function ethicsPass(result: SearchResult): boolean {
  const name = result.name.toLowerCase();
  return !BANNED_KEYWORDS.some(keyword => name.includes(keyword));
}

/**
 * Search Yahoo Finance
 */
async function yahooSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    const response = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
      params: {
        q: query,
        quotesCount: String(limit),
        newsCount: '0'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenBox/1.0)',
      },
      timeout: 4000
    });

    const data = response.data;
    const quotes = data?.quotes || [];
    
    return quotes
      .filter((q: any) => q.symbol && q.shortname)
      .map((q: any) => ({
        ticker: q.symbol.toUpperCase(),
        name: q.shortname,
        exch: q.exchange || q.exchDisp || '',
        source: 'yahoo'
      }));
  } catch (error) {
    console.warn('[Yahoo Search] Error:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Search Financial Modeling Prep (FMP)
 */
async function fmpSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return [];
  }
  
  try {
    const response = await axios.get('https://financialmodelingprep.com/api/v3/search', {
      params: {
        query,
        limit: String(limit),
        apikey: apiKey
      },
      timeout: 4000
    });

    const data = response.data;
    
    return (data || [])
      .filter((x: any) => x.symbol && x.name)
      .map((x: any) => ({
        ticker: x.symbol.toUpperCase(),
        name: x.name,
        exch: x.exchangeShortName || x.exchange || '',
        source: 'fmp'
      }));
  } catch (error) {
    console.warn('[FMP Search] Error:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Main smart search function
 */
export async function smartSearch(rawQuery: string): Promise<SearchResult[]> {
  // Sanitize and limit query length
  const query = normalize(rawQuery.slice(0, 64));
  
  if (!query) {
    return [];
  }
  
  console.log(`[Smart Search] Query: "${rawQuery}" -> normalized: "${query}"`);
  
  const results: SearchResult[] = [];
  
  // 1. Check for alias match (highest priority)
  const aliasMatch = ALIASES.get(query);
  if (aliasMatch) {
    console.log(`[Smart Search] Alias match: "${query}" -> ${aliasMatch}`);
    results.push({
      ticker: aliasMatch,
      name: aliasMatch,
      exch: '',
      source: 'alias'
    });
  }
  
  // 2. Check for theme match
  if (THEMES[query]) {
    console.log(`[Smart Search] Theme match: "${query}" (${THEMES[query].length} results)`);
    results.push(...THEMES[query].map(t => ({
      ...t,
      source: 'theme'
    })));
  }
  
  // 3. Search external APIs in parallel
  const [yahooResults, fmpResults] = await Promise.all([
    yahooSearch(rawQuery, 10),
    fmpSearch(rawQuery, 10)
  ]);
  
  console.log(`[Smart Search] Yahoo: ${yahooResults.length}, FMP: ${fmpResults.length}`);
  
  // 4. Merge all results
  results.push(...yahooResults, ...fmpResults);
  
  // 5. Fallback: inferred theme match (if nothing found yet)
  if (results.length === 0) {
    for (const [themeName, themeStocks] of Object.entries(THEMES)) {
      if (query.includes(themeName)) {
        console.log(`[Smart Search] Inferred theme match: "${query}" contains "${themeName}"`);
        results.push(...themeStocks.map(t => ({
          ...t,
          source: 'theme-inferred'
        })));
        break;
      }
    }
  }
  
  // 6. Dedupe, filter ethics, and limit
  const finalResults = dedupe(results)
    .filter(ethicsPass)
    .slice(0, 20);
  
  console.log(`[Smart Search] Final results: ${finalResults.length}`);
  
  return finalResults;
}

/**
 * Get demo search results (for DEV_MODE)
 */
export function getDemoSearchResults(query: string): SearchResult[] {
  const normalized = normalize(query);
  
  // Check aliases
  const aliasMatch = ALIASES.get(normalized);
  if (aliasMatch) {
    return [{
      ticker: aliasMatch,
      name: aliasMatch,
      exch: 'DEMO',
      source: 'demo-alias'
    }];
  }
  
  // Check themes
  if (THEMES[normalized]) {
    return THEMES[normalized].map(t => ({
      ...t,
      source: 'demo-theme'
    }));
  }
  
  // Default popular stocks
  return [
    { ticker: 'AAPL', name: 'Apple Inc.', exch: 'NASDAQ', source: 'demo' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', exch: 'NASDAQ', source: 'demo' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', exch: 'NASDAQ', source: 'demo' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', exch: 'NASDAQ', source: 'demo' },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', exch: 'NASDAQ', source: 'demo' },
    { ticker: 'META', name: 'Meta Platforms Inc.', exch: 'NASDAQ', source: 'demo' },
    { ticker: 'TSLA', name: 'Tesla Inc.', exch: 'NASDAQ', source: 'demo' },
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', exch: 'NYSE', source: 'demo' }
  ].filter(r => 
    r.ticker.toLowerCase().includes(normalized) || 
    r.name.toLowerCase().includes(normalized)
  );
}
