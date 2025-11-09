import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import * as kv from './kv_store';
import { aggregateEvidence, seedEvidenceData } from './evidence';
import {
  calculateFinancialScores,
  type AltmanInputs,
  type PiotroskiInputs,
} from './financialScores';
import { smartSearch } from './smartSearch';

// Use Alpha Vantage API (more reliable free tier)
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
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
  'NOKIA': 'NOK',
  'BMW': 'BAMXF',
  'RYANAIR': 'RYAAY',
  'ALIBABA': 'BABA',
  'TENCENT': 'TCEHY',
  'BRK.B': 'BRK-B',
  'APPL': 'AAPL',
  'APL': 'AAPL',
  'APPLE': 'AAPL',
  'AMAZN': 'AMZN',
  'AMAZON': 'AMZN',
  'GOGLE': 'GOOGL',
  'GOOGLE': 'GOOGL',
  'GOOG': 'GOOGL',
  'MCSFT': 'MSFT',
  'MICROSOFT': 'MSFT',
  'TSML': 'TSLA',
  'TESLA': 'TSLA',
  'FB': 'META',
  'FACEBOOK': 'META',
  'NVIDIA': 'NVDA',
  'NETFLIX': 'NFLX',
  'JPMORGAN': 'JPM',
  'WALMART': 'WMT',
  'DISNEY': 'DIS',
  'BOEING': 'BA',
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
  if (!ALPHA_VANTAGE_KEY) {
    throw new Error('ALPHA_VANTAGE_KEY not configured');
  }

  // Fetch company overview
  const overviewResponse = await axios.get(ALPHA_VANTAGE_URL, {
    params: {
      function: 'OVERVIEW',
      symbol: symbol,
      apikey: ALPHA_VANTAGE_KEY
    }
  });

  const overview = overviewResponse.data;

  // Fetch global quote
  const quoteResponse = await axios.get(ALPHA_VANTAGE_URL, {
    params: {
      function: 'GLOBAL_QUOTE',
      symbol: symbol,
      apikey: ALPHA_VANTAGE_KEY
    }
  });

  const quote = quoteResponse.data['Global Quote'] || {};

  return {
    symbol: overview.Symbol || symbol,
    companyName: overview.Name || 'Unknown',
    price: parseFloat(quote['05. price'] || '0'),
    changes: parseFloat(quote['09. change'] || '0'),
    marketCap: parseFloat(overview.MarketCapitalization || '0'),
    pe: parseFloat(overview.PERatio || '0'),
    eps: parseFloat(overview.EPS || '0'),
    dividendYield: parseFloat(overview.DividendYield || '0') * 100,
    week52High: parseFloat(overview['52WeekHigh'] || '0'),
    week52Low: parseFloat(overview['52WeekLow'] || '0'),
    avgVolume: parseInt(quote['06. volume'] || '0')
  };
}

// Calculate comprehensive scores
function calculateScores(stockData: StockData) {
  const { price, pe, eps, dividendYield, week52High, week52Low, changes, marketCap } = stockData;

  // Growth score (0-100)
  const growthScore = Math.min(100, Math.max(0, (eps > 0 ? eps * 10 : 0) + (changes > 0 ? 20 : 0)));

  // Value score (0-100)
  const valueScore = pe > 0 && pe < 25 ? Math.min(100, (25 - pe) * 4) : 0;

  // Health score (0-100)
  const priceToHigh = week52High > 0 ? (price / week52High) * 100 : 50;
  const healthScore = (priceToHigh + (dividendYield > 0 ? 30 : 0)) / 1.3;

  // Momentum score (0-100)
  const momentumScore = Math.min(100, Math.max(0, 50 + changes * 2));

  // Calculate weighted overall score
  const overallScore =
    growthScore * WEIGHTS.growth +
    valueScore * WEIGHTS.value +
    healthScore * WEIGHTS.health +
    momentumScore * WEIGHTS.momentum;

  return {
    overall: Math.round(overallScore),
    growth: Math.round(growthScore),
    value: Math.round(valueScore),
    health: Math.round(healthScore),
    momentum: Math.round(momentumScore)
  };
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Request:', event.httpMethod, event.path);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    const path = event.path;
    const method = event.httpMethod;

    // Health check
    if (method === 'GET' && path === '/health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          apiKeyConfigured: !!ALPHA_VANTAGE_KEY
        }),
      };
    }

    // Get popular stocks
    if (method === 'GET' && path === '/stocks/popular') {
      const popularSymbols = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',
        'NVDA', 'TSLA', 'JPM', 'V', 'WMT'
      ];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ symbols: popularSymbols }),
      };
    }

    // Test API
    if (method === 'GET' && path === '/test-api') {
      if (!ALPHA_VANTAGE_KEY) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'ALPHA_VANTAGE_KEY not configured',
            message: 'Please set the ALPHA_VANTAGE_KEY environment variable'
          }),
        };
      }

      try {
        const response = await axios.get(ALPHA_VANTAGE_URL, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: 'AAPL',
            apikey: ALPHA_VANTAGE_KEY
          }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: response.data
          }),
        };
      } catch (error: any) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'API test failed',
            message: error.message
          }),
        };
      }
    }

    // Analyze stock
    if (method === 'GET' && path.startsWith('/stock/')) {
      const symbol = path.split('/stock/')[1]?.toUpperCase();
      if (!symbol) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Symbol required' }),
        };
      }

      const refresh = event.queryStringParameters?.refresh === 'true';
      const correctedSymbol = TICKER_CORRECTIONS[symbol] || symbol;

      // Check cache unless refresh requested
      if (!refresh) {
        const cached = await kv.get(`stock_${correctedSymbol}`);
        if (cached) {
          console.log(`[Cache HIT] ${correctedSymbol}`);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(cached),
          };
        }
      }

      // Fetch fresh data
      const stockData = await fetchAlphaVantageData(correctedSymbol);
      const scores = calculateScores(stockData);

      // Get evidence boost
      const evidenceBoost = await aggregateEvidence(correctedSymbol);

      const result = {
        ...stockData,
        scores,
        evidenceBoost,
        cached: false,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await kv.set(`stock_${correctedSymbol}`, result);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // Ticker management
    if (method === 'POST' && path === '/tickers') {
      const body = JSON.parse(event.body || '{}');
      const tickers = body.tickers;

      if (!Array.isArray(tickers)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid tickers array' }),
        };
      }

      await kv.set('user_tickers', tickers);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (method === 'GET' && path === '/tickers') {
      const tickers = await kv.get('user_tickers') || [];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tickers }),
      };
    }

    if (method === 'DELETE' && path === '/tickers') {
      await kv.del('user_tickers');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    // Cache management
    if (method === 'GET' && path === '/cache/list') {
      const cacheEntries = await kv.getByPrefix('stock_');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          count: cacheEntries.length,
          stocks: cacheEntries.map((entry: any) => ({
            symbol: entry.symbol,
            companyName: entry.companyName,
            timestamp: entry.timestamp
          }))
        }),
      };
    }

    if (method === 'DELETE' && path.startsWith('/cache/')) {
      const symbol = path.split('/cache/')[1]?.toUpperCase();

      if (!symbol) {
        // Delete all cache
        const cacheEntries = await kv.getByPrefix('stock_');
        const keys = cacheEntries.map((_: any, i: number) => `stock_${i}`);
        if (keys.length > 0) {
          await kv.mdel(keys);
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, deleted: keys.length }),
        };
      } else {
        await kv.del(`stock_${symbol}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true }),
        };
      }
    }

    // Evidence endpoints
    if (method === 'POST' && path === '/evidence/seed') {
      await seedEvidenceData();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (method === 'GET' && path.startsWith('/evidence/')) {
      const symbol = path.split('/evidence/')[1]?.toUpperCase();
      if (!symbol) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Symbol required' }),
        };
      }

      const boost = await aggregateEvidence(symbol);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(boost),
      };
    }

    // Symbol search
    if (method === 'GET' && path === '/symbol-search') {
      const query = event.queryStringParameters?.query;
      if (!query) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Query required' }),
        };
      }

      if (!ALPHA_VANTAGE_KEY) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'ALPHA_VANTAGE_KEY not configured' }),
        };
      }

      const response = await axios.get(ALPHA_VANTAGE_URL, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: query,
          apikey: ALPHA_VANTAGE_KEY
        }
      });

      const matches = response.data.bestMatches || [];
      const results = matches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region']
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ results }),
      };
    }

    // Smart search
    if (method === 'GET' && path === '/search-tickers') {
      const query = event.queryStringParameters?.query;
      if (!query) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Query required' }),
        };
      }

      const results = await smartSearch(query);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ results }),
      };
    }

    // Trade Orchestrator - Plan rotations
    if (method === 'POST' && path === '/orchestrator/plan-rotations') {
      const body = JSON.parse(event.body || '{}');
      const { currentHoldings, candidateTickers, targetCount } = body;

      // Placeholder implementation
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          rotations: [],
          message: 'Trade orchestrator not yet fully implemented'
        }),
      };
    }

    // Trade Orchestrator - Execute
    if (method === 'POST' && path === '/orchestrator/execute') {
      const body = JSON.parse(event.body || '{}');

      // Placeholder implementation
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          executed: [],
          message: 'Trade execution simulation not yet fully implemented'
        }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'dev' ? error.stack : undefined
      }),
    };
  }
};
