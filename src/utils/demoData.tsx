/**
 * Demo/Mock Data for OpenBox
 * Used as final fallback when both Edge Functions and Yahoo Finance are unavailable
 * (e.g., in restricted environments like Figma plugin sandbox)
 */

export interface DemoStock {
  symbol: string;
  companyName: string;
  price: number;
  changes: number;
  currency: string;
  marketCap: number;
  industry: string;
  sector: string;
  score: number;
  action: 'BUY' | 'HOLD' | 'SELL';
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
  fromCache: boolean;
  source: string;
  demo: boolean;
}

// Demo data based on approximate real values (for demonstration purposes)
const DEMO_STOCKS: Record<string, DemoStock> = {
  'AAPL': {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    price: 178.45,
    changes: 2.34,
    currency: 'USD',
    marketCap: 2800000000000,
    industry: 'Consumer Electronics',
    sector: 'Technology',
    score: 82,
    action: 'BUY',
    breakdown: {
      growth: 78,
      value: 72,
      health: 92,
      momentum: 85
    },
    metrics: {
      peRatio: 28.5,
      pbRatio: 45.2,
      debtToEquity: 1.73,
      currentRatio: 0.98,
      roe: 147.3,
      revenueGrowth: 8.2,
      epsGrowth: 12.5,
      fcfGrowth: 10.8
    },
    financialScores: {
      altmanZ: 3.45,
      altmanNormalized: 99,
      altmanInterpretation: 'Safe Zone - Low bankruptcy risk',
      piotroskiF: 8,
      piotroskiNormalized: 89,
      piotroskiInterpretation: 'Strong - Excellent financial health',
      altmanComponents: {
        workingCapitalRatio: 0.18,
        retainedEarningsRatio: 0.42,
        ebitRatio: 0.35,
        marketCapToLiabRatio: 9.65,
        assetTurnover: 1.08
      },
      piotroskiBreakdown: {
        profitability: 4,
        leverage: 2,
        operating: 2
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'MSFT': {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    price: 385.20,
    changes: 1.87,
    currency: 'USD',
    marketCap: 2860000000000,
    industry: 'Software',
    sector: 'Technology',
    score: 85,
    action: 'BUY',
    breakdown: {
      growth: 82,
      value: 75,
      health: 95,
      momentum: 88
    },
    metrics: {
      peRatio: 32.8,
      pbRatio: 11.2,
      debtToEquity: 0.43,
      currentRatio: 1.77,
      roe: 38.4,
      revenueGrowth: 12.7,
      epsGrowth: 18.3,
      fcfGrowth: 15.2
    },
    financialScores: {
      altmanZ: 4.12,
      altmanNormalized: 100,
      altmanInterpretation: 'Safe Zone - Low bankruptcy risk',
      piotroskiF: 9,
      piotroskiNormalized: 100,
      piotroskiInterpretation: 'Strong - Excellent financial health',
      altmanComponents: {
        workingCapitalRatio: 0.22,
        retainedEarningsRatio: 0.48,
        ebitRatio: 0.38,
        marketCapToLiabRatio: 12.85,
        assetTurnover: 0.92
      },
      piotroskiBreakdown: {
        profitability: 4,
        leverage: 3,
        operating: 2
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'GOOGL': {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    price: 142.65,
    changes: -0.45,
    currency: 'USD',
    marketCap: 1780000000000,
    industry: 'Internet Content & Information',
    sector: 'Communication Services',
    score: 78,
    action: 'BUY',
    breakdown: {
      growth: 75,
      value: 68,
      health: 88,
      momentum: 80
    },
    metrics: {
      peRatio: 24.3,
      pbRatio: 5.8,
      debtToEquity: 0.11,
      currentRatio: 2.93,
      roe: 28.5,
      revenueGrowth: 11.3,
      epsGrowth: 15.7,
      fcfGrowth: 14.2
    },
    financialScores: {
      altmanZ: 3.82,
      altmanNormalized: 100,
      altmanInterpretation: 'Safe Zone - Low bankruptcy risk',
      piotroskiF: 8,
      piotroskiNormalized: 89,
      piotroskiInterpretation: 'Strong - Excellent financial health',
      altmanComponents: {
        workingCapitalRatio: 0.28,
        retainedEarningsRatio: 0.52,
        ebitRatio: 0.31,
        marketCapToLiabRatio: 15.42,
        assetTurnover: 0.75
      },
      piotroskiBreakdown: {
        profitability: 4,
        leverage: 3,
        operating: 1
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'AMZN': {
    symbol: 'AMZN',
    companyName: 'Amazon.com Inc.',
    price: 178.30,
    changes: 3.12,
    currency: 'USD',
    marketCap: 1840000000000,
    industry: 'Internet Retail',
    sector: 'Consumer Discretionary',
    score: 75,
    action: 'BUY',
    breakdown: {
      growth: 85,
      value: 58,
      health: 78,
      momentum: 82
    },
    metrics: {
      peRatio: 52.7,
      pbRatio: 8.4,
      debtToEquity: 0.54,
      currentRatio: 1.09,
      roe: 18.2,
      revenueGrowth: 13.5,
      epsGrowth: 25.8,
      fcfGrowth: 22.3
    },
    financialScores: {
      altmanZ: 2.85,
      altmanNormalized: 81,
      altmanInterpretation: 'Grey Zone - Moderate risk',
      piotroskiF: 7,
      piotroskiNormalized: 78,
      piotroskiInterpretation: 'Average - Moderate financial health',
      altmanComponents: {
        workingCapitalRatio: 0.12,
        retainedEarningsRatio: 0.38,
        ebitRatio: 0.25,
        marketCapToLiabRatio: 4.28,
        assetTurnover: 1.15
      },
      piotroskiBreakdown: {
        profitability: 3,
        leverage: 2,
        operating: 2
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'NVDA': {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    price: 495.22,
    changes: 4.56,
    currency: 'USD',
    marketCap: 1220000000000,
    industry: 'Semiconductors',
    sector: 'Technology',
    score: 88,
    action: 'BUY',
    breakdown: {
      growth: 95,
      value: 72,
      health: 92,
      momentum: 94
    },
    metrics: {
      peRatio: 65.3,
      pbRatio: 45.8,
      debtToEquity: 0.42,
      currentRatio: 3.52,
      roe: 78.5,
      revenueGrowth: 126.5,
      epsGrowth: 288.4,
      fcfGrowth: 145.2
    },
    financialScores: {
      altmanZ: 4.58,
      altmanNormalized: 100,
      altmanInterpretation: 'Safe Zone - Low bankruptcy risk',
      piotroskiF: 9,
      piotroskiNormalized: 100,
      piotroskiInterpretation: 'Strong - Excellent financial health',
      altmanComponents: {
        workingCapitalRatio: 0.35,
        retainedEarningsRatio: 0.62,
        ebitRatio: 0.52,
        marketCapToLiabRatio: 18.75,
        assetTurnover: 1.35
      },
      piotroskiBreakdown: {
        profitability: 4,
        leverage: 3,
        operating: 2
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'META': {
    symbol: 'META',
    companyName: 'Meta Platforms Inc.',
    price: 485.33,
    changes: 2.78,
    currency: 'USD',
    marketCap: 1240000000000,
    industry: 'Internet Content & Information',
    sector: 'Communication Services',
    score: 76,
    action: 'BUY',
    breakdown: {
      growth: 78,
      value: 70,
      health: 82,
      momentum: 75
    },
    metrics: {
      peRatio: 28.4,
      pbRatio: 7.2,
      debtToEquity: 0.08,
      currentRatio: 3.15,
      roe: 32.8,
      revenueGrowth: 23.2,
      epsGrowth: 73.4,
      fcfGrowth: 42.8
    },
    financialScores: {
      altmanZ: 3.52,
      altmanNormalized: 100,
      altmanInterpretation: 'Safe Zone - Low bankruptcy risk',
      piotroskiF: 8,
      piotroskiNormalized: 89,
      piotroskiInterpretation: 'Strong - Excellent financial health',
      altmanComponents: {
        workingCapitalRatio: 0.32,
        retainedEarningsRatio: 0.45,
        ebitRatio: 0.42,
        marketCapToLiabRatio: 16.25,
        assetTurnover: 0.68
      },
      piotroskiBreakdown: {
        profitability: 4,
        leverage: 3,
        operating: 1
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'TSLA': {
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    price: 242.84,
    changes: -1.23,
    currency: 'USD',
    marketCap: 770000000000,
    industry: 'Auto Manufacturers',
    sector: 'Consumer Discretionary',
    score: 65,
    action: 'HOLD',
    breakdown: {
      growth: 72,
      value: 48,
      health: 68,
      momentum: 70
    },
    metrics: {
      peRatio: 75.8,
      pbRatio: 12.5,
      debtToEquity: 0.17,
      currentRatio: 1.73,
      roe: 23.4,
      revenueGrowth: 18.8,
      epsGrowth: 19.2,
      fcfGrowth: 12.5
    },
    financialScores: {
      altmanZ: 2.35,
      altmanNormalized: 67,
      altmanInterpretation: 'Grey Zone - Moderate risk',
      piotroskiF: 6,
      piotroskiNormalized: 67,
      piotroskiInterpretation: 'Average - Moderate financial health',
      altmanComponents: {
        workingCapitalRatio: 0.15,
        retainedEarningsRatio: 0.22,
        ebitRatio: 0.18,
        marketCapToLiabRatio: 3.85,
        assetTurnover: 0.95
      },
      piotroskiBreakdown: {
        profitability: 3,
        leverage: 2,
        operating: 1
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'JPM': {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    price: 198.75,
    changes: 0.85,
    currency: 'USD',
    marketCap: 575000000000,
    industry: 'Banks - Diversified',
    sector: 'Financial Services',
    score: 72,
    action: 'BUY',
    breakdown: {
      growth: 68,
      value: 78,
      health: 75,
      momentum: 68
    },
    metrics: {
      peRatio: 11.2,
      pbRatio: 1.65,
      debtToEquity: 1.35,
      currentRatio: 0.85,
      roe: 15.8,
      revenueGrowth: 7.5,
      epsGrowth: 32.4,
      fcfGrowth: 8.7
    },
    financialScores: {
      altmanZ: 1.92,
      altmanNormalized: 55,
      altmanInterpretation: 'Grey Zone - Moderate risk',
      piotroskiF: 7,
      piotroskiNormalized: 78,
      piotroskiInterpretation: 'Average - Moderate financial health',
      altmanComponents: {
        workingCapitalRatio: 0.08,
        retainedEarningsRatio: 0.28,
        ebitRatio: 0.22,
        marketCapToLiabRatio: 0.42,
        assetTurnover: 0.18
      },
      piotroskiBreakdown: {
        profitability: 3,
        leverage: 2,
        operating: 2
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'NOK': {
    symbol: 'NOK',
    companyName: 'Nokia Corporation',
    price: 4.25,
    changes: -0.08,
    currency: 'USD',
    marketCap: 24000000000,
    industry: 'Telecommunications Equipment',
    sector: 'Technology',
    score: 58,
    action: 'HOLD',
    breakdown: {
      growth: 52,
      value: 68,
      health: 55,
      momentum: 58
    },
    metrics: {
      peRatio: 18.5,
      pbRatio: 1.15,
      debtToEquity: 0.42,
      currentRatio: 1.52,
      roe: 8.5,
      revenueGrowth: 3.2,
      epsGrowth: -2.5,
      fcfGrowth: 5.8
    },
    financialScores: {
      altmanZ: 2.15,
      altmanNormalized: 61,
      altmanInterpretation: 'Grey Zone - Moderate risk',
      piotroskiF: 5,
      piotroskiNormalized: 56,
      piotroskiInterpretation: 'Average - Moderate financial health',
      altmanComponents: {
        workingCapitalRatio: 0.18,
        retainedEarningsRatio: 0.25,
        ebitRatio: 0.12,
        marketCapToLiabRatio: 1.85,
        assetTurnover: 0.62
      },
      piotroskiBreakdown: {
        profitability: 2,
        leverage: 2,
        operating: 1
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'TSM': {
    symbol: 'TSM',
    companyName: 'Taiwan Semiconductor Manufacturing Company',
    price: 102.35,
    changes: 1.45,
    currency: 'USD',
    marketCap: 530000000000,
    industry: 'Semiconductors',
    sector: 'Technology',
    score: 79,
    action: 'BUY',
    breakdown: {
      growth: 82,
      value: 71,
      health: 85,
      momentum: 78
    },
    metrics: {
      peRatio: 24.5,
      pbRatio: 5.8,
      debtToEquity: 0.28,
      currentRatio: 2.15,
      roe: 27.5,
      revenueGrowth: 16.5,
      epsGrowth: 22.8,
      fcfGrowth: 18.2
    },
    financialScores: {
      altmanZ: 3.85,
      altmanNormalized: 88,
      altmanInterpretation: 'Safe Zone - Low bankruptcy risk',
      piotroskiF: 8,
      piotroskiNormalized: 89,
      piotroskiInterpretation: 'Strong - Excellent financial health',
      altmanComponents: {
        workingCapitalRatio: 0.35,
        retainedEarningsRatio: 0.48,
        ebitRatio: 0.38,
        marketCapToLiabRatio: 8.25,
        assetTurnover: 0.68
      },
      piotroskiBreakdown: {
        profitability: 4,
        leverage: 2,
        operating: 2
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'PSA': {
    symbol: 'PSA',
    companyName: 'Public Storage',
    price: 298.75,
    changes: -0.65,
    currency: 'USD',
    marketCap: 52000000000,
    industry: 'REIT - Industrial',
    sector: 'Real Estate',
    score: 68,
    action: 'HOLD',
    breakdown: {
      growth: 58,
      value: 72,
      health: 78,
      momentum: 65
    },
    metrics: {
      peRatio: 28.2,
      pbRatio: 2.85,
      debtToEquity: 0.55,
      currentRatio: 1.35,
      roe: 11.8,
      revenueGrowth: 8.5,
      epsGrowth: 6.2,
      fcfGrowth: 9.8
    },
    financialScores: {
      altmanZ: 2.58,
      altmanNormalized: 73,
      altmanInterpretation: 'Grey Zone - Moderate risk',
      piotroskiF: 6,
      piotroskiNormalized: 67,
      piotroskiInterpretation: 'Average - Moderate financial health',
      altmanComponents: {
        workingCapitalRatio: 0.12,
        retainedEarningsRatio: 0.32,
        ebitRatio: 0.28,
        marketCapToLiabRatio: 2.85,
        assetTurnover: 0.35
      },
      piotroskiBreakdown: {
        profitability: 3,
        leverage: 2,
        operating: 1
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  },
  'SMC': {
    symbol: 'SMC',
    companyName: 'SMC Corporation',
    price: 68.50,
    changes: 0.25,
    currency: 'USD',
    marketCap: 42000000000,
    industry: 'Industrial Automation',
    sector: 'Industrials',
    score: 71,
    action: 'BUY',
    breakdown: {
      growth: 68,
      value: 75,
      health: 72,
      momentum: 70
    },
    metrics: {
      peRatio: 22.8,
      pbRatio: 3.45,
      debtToEquity: 0.15,
      currentRatio: 3.25,
      roe: 16.5,
      revenueGrowth: 9.8,
      epsGrowth: 12.5,
      fcfGrowth: 11.2
    },
    financialScores: {
      altmanZ: 3.45,
      altmanNormalized: 82,
      altmanInterpretation: 'Safe Zone - Low bankruptcy risk',
      piotroskiF: 7,
      piotroskiNormalized: 78,
      piotroskiInterpretation: 'Average - Moderate financial health',
      altmanComponents: {
        workingCapitalRatio: 0.42,
        retainedEarningsRatio: 0.38,
        ebitRatio: 0.32,
        marketCapToLiabRatio: 5.85,
        assetTurnover: 0.58
      },
      piotroskiBreakdown: {
        profitability: 3,
        leverage: 2,
        operating: 2
      }
    },
    fromCache: false,
    source: 'Demo Data',
    demo: true
  }
};

/**
 * Get demo data for a stock symbol
 * Returns demo data if available, otherwise returns null for invalid symbols
 */
export function getDemoStock(symbol: string): DemoStock | null {
  const upperSymbol = symbol.toUpperCase();
  
  // If we have demo data for this symbol, return it
  if (DEMO_STOCKS[upperSymbol]) {
    return DEMO_STOCKS[upperSymbol];
  }
  
  // Don't generate fake data for unknown symbols - return null instead
  // This prevents showing data for invalid tickers like "CHADI" or "FOOBAR"
  // Note: No console warning here - this is expected for most stocks when used as fallback
  return null;
}

/**
 * Get list of popular demo stocks
 */
export function getPopularDemoStocks(): string[] {
  return Object.keys(DEMO_STOCKS);
}

/**
 * Check if demo mode is needed
 * Returns true if we detect we're in a restricted environment
 */
export function shouldUseDemoMode(): boolean {
  // Check if we're in Figma plugin environment
  if (typeof window !== 'undefined') {
    const isPlugin = window.location.protocol === 'plugin:';
    return isPlugin;
  }
  return false;
}

/**
 * Search demo stocks for Smart Search feature
 */
export function getDemoSearchResults(query: string): Array<{ ticker: string; name: string; exch: string; source: string }> {
  const normalized = query.toLowerCase().trim();
  
  if (!normalized) {
    return [];
  }
  
  // Search through all demo stocks
  const results = [];
  
  for (const [symbol, stock] of Object.entries(DEMO_STOCKS)) {
    const matchesSymbol = symbol.toLowerCase().includes(normalized);
    const matchesName = stock.companyName.toLowerCase().includes(normalized);
    const matchesSector = stock.sector.toLowerCase().includes(normalized);
    const matchesIndustry = stock.industry.toLowerCase().includes(normalized);
    
    if (matchesSymbol || matchesName || matchesSector || matchesIndustry) {
      results.push({
        ticker: symbol,
        name: stock.companyName,
        exch: 'DEMO',
        source: 'demo'
      });
    }
  }
  
  return results.slice(0, 10);
}
