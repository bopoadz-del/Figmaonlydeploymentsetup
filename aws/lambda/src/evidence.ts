// Evidence Layer Framework - Section 20
// Normalized evidence scoring from Gartner, Forrester, G2, and sector-specific sources

import * as kv from './kv_store';

export interface EvidenceItem {
  source: string;        // e.g., "Gartner MQ", "Forrester Wave", "ENR Top 250"
  domain: string;        // e.g., "IT Security", "Energy", "Construction"
  symbol: string;
  tier?: string;         // e.g., "Leader", "Tier 1", "Top 10"
  score?: number;        // Optional 0-100 score (e.g., G2 satisfaction)
  reviews?: number;      // Optional review count (for G2)
  as_of: string;         // ISO date
  weight_vector: {       // Routing weights (must sum ≤ 1)
    F?: number;          // Fundamentals
    M?: number;          // Market
    B?: number;          // Balance
    L?: number;          // Leadership
    A?: number;          // Innovation/AI
    E?: number;          // Ethics
  };
  decay_months: number;  // Half-life for decay calculation
  notes?: string;
}

export interface EvidenceBoost {
  F: number;  // Fundamentals boost
  M: number;  // Market boost
  B: number;  // Balance boost
  L: number;  // Leadership boost
  A: number;  // Innovation/AI boost
  E: number;  // Ethics boost
  items: Array<{
    source: string;
    tier?: string;
    score?: number;
    as_of: string;
  }>;
}

// Calculate months since a date
function monthsSince(dateISO: string): number {
  const d = new Date(dateISO);
  const n = new Date();
  return (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth());
}

// Convert tier/score to base points (0-8)
function basePoints(tier?: string, score?: number): number {
  // If numeric score provided, convert to 0-8 scale
  if (typeof score === 'number' && score > 0) {
    return Math.round(score / 12.5); // 100 -> 8, 50 -> 4, etc.
  }
  
  // Map tier strings to points
  const t = (tier || '').toLowerCase();
  if (/leader|tier 1|top 10|platinum/i.test(t)) return 8;
  if (/strong performer|challenger|tier 2|top 50|gold/i.test(t)) return 6;
  if (/visionary|contender|high performer|tier 3|silver/i.test(t)) return 4;
  if (/niche|top 100|bronze/i.test(t)) return 2;
  return 0;
}

// Aggregate evidence items into pillar boosts
export async function aggregateEvidence(symbol: string): Promise<EvidenceBoost> {
  const raw = await kv.get(`evidence:${symbol}`);
  const items: EvidenceItem[] = raw ? JSON.parse(raw) : [];
  
  const routed = { F: 0, M: 0, B: 0, L: 0, A: 0, E: 0 };
  const displayItems: EvidenceBoost['items'] = [];
  
  for (const item of items) {
    const months = monthsSince(item.as_of);
    const decay = Math.exp(-months / Math.max(6, item.decay_months));
    let pts = basePoints(item.tier, item.score);
    
    // Review count factor (for G2-style sources)
    const countFactor = item.reviews 
      ? Math.min(1, Math.log10(1 + item.reviews) / 2) 
      : 1;
    
    const boost = Math.round(pts * decay * countFactor);
    
    // Route to pillars according to weight vector
    for (const k of ['F', 'M', 'B', 'L', 'A', 'E'] as const) {
      const weight = item.weight_vector[k] || 0;
      routed[k] += boost * weight;
    }
    
    // Track for display
    if (boost > 0) {
      displayItems.push({
        source: item.source,
        tier: item.tier,
        score: item.score,
        as_of: item.as_of,
      });
    }
  }
  
  // Cap total external influence to 10 points
  const total = Object.values(routed).reduce((a, b) => a + b, 0);
  const CAP = 10;
  if (total > CAP) {
    const scale = CAP / total;
    for (const k in routed) {
      routed[k as keyof typeof routed] = Math.round(routed[k as keyof typeof routed] * scale);
    }
  }
  
  return {
    F: Math.round(routed.F),
    M: Math.round(routed.M),
    B: Math.round(routed.B),
    L: Math.round(routed.L),
    A: Math.round(routed.A),
    E: Math.round(routed.E),
    items: displayItems.slice(0, 3), // Top 3 for display
  };
}

// Seed example evidence data (call this on first run or via admin endpoint)
export async function seedEvidenceData() {
  const examples: Record<string, EvidenceItem[]> = {
    // ========== SECTOR 1: INFORMATION TECHNOLOGY ==========
    'PANW': [
      {
        source: 'Gartner MQ',
        domain: 'Cybersecurity',
        symbol: 'PANW',
        tier: 'Leader',
        as_of: '2025-06-15',
        weight_vector: { L: 0.6, A: 0.4 },
        decay_months: 18,
      },
    ],
    'ZS': [
      {
        source: 'Gartner MQ',
        domain: 'Cloud Security',
        symbol: 'ZS',
        tier: 'Leader',
        as_of: '2025-06-15',
        weight_vector: { L: 0.6, A: 0.4 },
        decay_months: 18,
      },
      {
        source: 'G2',
        domain: 'Zero Trust',
        symbol: 'ZS',
        tier: 'Leader',
        score: 92,
        reviews: 640,
        as_of: '2025-09-01',
        weight_vector: { M: 0.6, L: 0.4 },
        decay_months: 12,
      },
    ],
    'SNOW': [
      {
        source: 'Gartner MQ',
        domain: 'Data Warehousing',
        symbol: 'SNOW',
        tier: 'Challenger',
        as_of: '2025-03-10',
        weight_vector: { L: 0.5, A: 0.5 },
        decay_months: 18,
      },
      {
        source: 'Forrester Wave',
        domain: 'Cloud Data',
        symbol: 'SNOW',
        tier: 'Strong Performer',
        as_of: '2025-04-15',
        weight_vector: { L: 0.7, A: 0.3 },
        decay_months: 9,
      },
    ],
    
    // ========== SECTOR 2: HEALTHCARE ==========
    'UNH': [
      {
        source: 'NCQA',
        domain: 'Healthcare',
        symbol: 'UNH',
        tier: 'Top 10',
        score: 88,
        as_of: '2025-07-20',
        weight_vector: { M: 0.5, L: 0.5 },
        decay_months: 12,
        notes: 'Health Insurance Plan Ratings',
      },
    ],
    'JNJ': [
      {
        source: 'Clarivate',
        domain: 'Pharma R&D',
        symbol: 'JNJ',
        tier: 'Top 10',
        as_of: '2025-08-01',
        weight_vector: { A: 1.0 },
        decay_months: 12,
        notes: 'R&D Pipeline Innovation',
      },
      {
        source: 'FDA Breakthrough',
        domain: 'Pharma',
        symbol: 'JNJ',
        tier: 'Tier 1',
        as_of: '2025-05-15',
        weight_vector: { A: 0.7, E: 0.3 },
        decay_months: 24,
        notes: 'Breakthrough Therapy Designations',
      },
    ],
    'TMO': [
      {
        source: 'Frost & Sullivan',
        domain: 'Life Sciences',
        symbol: 'TMO',
        tier: 'Leader',
        as_of: '2025-06-10',
        weight_vector: { L: 0.6, A: 0.4 },
        decay_months: 18,
      },
    ],
    
    // ========== SECTOR 3: FINANCIALS ==========
    'JPM': [
      {
        source: 'Celent Model Bank',
        domain: 'Banking Innovation',
        symbol: 'JPM',
        tier: 'Top 10',
        as_of: '2025-08-15',
        weight_vector: { A: 0.5, L: 0.5 },
        decay_months: 12,
      },
      {
        source: 'Moody\'s',
        domain: 'Credit Rating',
        symbol: 'JPM',
        tier: 'Tier 1',
        as_of: '2025-09-01',
        weight_vector: { B: 0.7, L: 0.3 },
        decay_months: 18,
        notes: 'Credit Rating Upgrade',
      },
    ],
    'V': [
      {
        source: 'Fintech 100',
        domain: 'Payments',
        symbol: 'V',
        tier: 'Top 10',
        as_of: '2025-07-01',
        weight_vector: { A: 0.5, M: 0.5 },
        decay_months: 12,
      },
    ],
    'BLK': [
      {
        source: 'WealthTech 100',
        domain: 'Asset Management',
        symbol: 'BLK',
        tier: 'Leader',
        as_of: '2025-06-20',
        weight_vector: { L: 0.6, A: 0.4 },
        decay_months: 12,
      },
    ],
    
    // ========== SECTOR 4: CONSUMER DISCRETIONARY ==========
    'TSLA': [
      {
        source: 'J.D. Power',
        domain: 'Automotive',
        symbol: 'TSLA',
        tier: 'High Performer',
        score: 82,
        reviews: 15000,
        as_of: '2025-09-15',
        weight_vector: { M: 0.6, L: 0.4 },
        decay_months: 12,
      },
      {
        source: 'IIHS Top Safety',
        domain: 'Automotive Safety',
        symbol: 'TSLA',
        tier: 'Top Safety Pick+',
        as_of: '2025-08-01',
        weight_vector: { E: 0.7, F: 0.3 },
        decay_months: 24,
      },
    ],
    'AMZN': [
      {
        source: 'Interbrand',
        domain: 'E-commerce',
        symbol: 'AMZN',
        tier: 'Top 10',
        score: 98,
        as_of: '2025-10-01',
        weight_vector: { L: 0.7, M: 0.3 },
        decay_months: 12,
      },
    ],
    'NKE': [
      {
        source: 'Brand Finance',
        domain: 'Apparel',
        symbol: 'NKE',
        tier: 'Top 10',
        score: 91,
        as_of: '2025-09-10',
        weight_vector: { L: 0.6, M: 0.4 },
        decay_months: 12,
      },
      {
        source: 'Fair Labor Assoc',
        domain: 'Apparel Ethics',
        symbol: 'NKE',
        tier: 'Gold',
        as_of: '2025-07-15',
        weight_vector: { E: 1.0 },
        decay_months: 36,
      },
    ],
    
    // ========== SECTOR 5: CONSUMER STAPLES ==========
    'KO': [
      {
        source: 'Interbrand',
        domain: 'Consumer',
        symbol: 'KO',
        tier: 'Top 10',
        score: 95,
        as_of: '2025-10-01',
        weight_vector: { L: 0.7, M: 0.3 },
        decay_months: 12,
      },
    ],
    'PG': [
      {
        source: 'Sustainalytics',
        domain: 'CPG Sustainability',
        symbol: 'PG',
        tier: 'Leader',
        score: 89,
        as_of: '2025-08-20',
        weight_vector: { E: 0.7, L: 0.3 },
        decay_months: 24,
      },
      {
        source: 'Brand Finance',
        domain: 'CPG',
        symbol: 'PG',
        tier: 'Top 50',
        as_of: '2025-09-05',
        weight_vector: { L: 0.6, M: 0.4 },
        decay_months: 12,
      },
    ],
    'WMT': [
      {
        source: 'Kantar Retail',
        domain: 'Retail Excellence',
        symbol: 'WMT',
        tier: 'Leader',
        as_of: '2025-07-30',
        weight_vector: { M: 0.5, L: 0.5 },
        decay_months: 12,
      },
    ],
    
    // ========== SECTOR 6: ENERGY ==========
    'NEE': [
      {
        source: 'BloombergNEF',
        domain: 'Renewable Energy',
        symbol: 'NEE',
        tier: 'Tier 1',
        as_of: '2025-04-01',
        weight_vector: { F: 0.6, A: 0.4 },
        decay_months: 18,
      },
      {
        source: 'DNV Certification',
        domain: 'Energy Sustainability',
        symbol: 'NEE',
        tier: 'Platinum',
        as_of: '2025-06-10',
        weight_vector: { E: 1.0 },
        decay_months: 36,
      },
    ],
    'XOM': [
      {
        source: 'WoodMac',
        domain: 'Oil & Gas',
        symbol: 'XOM',
        tier: 'Top 10',
        as_of: '2025-05-15',
        weight_vector: { F: 0.7, L: 0.3 },
        decay_months: 18,
      },
    ],
    'ENPH': [
      {
        source: 'BloombergNEF',
        domain: 'Solar Tech',
        symbol: 'ENPH',
        tier: 'Tier 1',
        as_of: '2025-07-01',
        weight_vector: { A: 0.6, F: 0.4 },
        decay_months: 18,
      },
    ],
    
    // ========== SECTOR 7: INDUSTRIALS ==========
    'CRH': [
      {
        source: 'ENR Top 250',
        domain: 'Construction',
        symbol: 'CRH',
        tier: 'Top 10',
        as_of: '2025-07-01',
        weight_vector: { F: 0.2, L: 0.8 },
        decay_months: 18,
      },
      {
        source: 'LEED',
        domain: 'Green Building',
        symbol: 'CRH',
        tier: 'Platinum',
        as_of: '2025-05-10',
        weight_vector: { E: 1.0 },
        decay_months: 36,
      },
    ],
    'BA': [
      {
        source: 'Flight Global',
        domain: 'Aerospace',
        symbol: 'BA',
        tier: 'Top 10',
        as_of: '2025-06-15',
        weight_vector: { L: 0.7, F: 0.3 },
        decay_months: 18,
      },
    ],
    'CAT': [
      {
        source: 'EquipmentWatch',
        domain: 'Heavy Equipment',
        symbol: 'CAT',
        tier: 'Leader',
        as_of: '2025-08-10',
        weight_vector: { M: 0.5, L: 0.5 },
        decay_months: 18,
      },
    ],
    
    // ========== SECTOR 8: MATERIALS ==========
    'LIN': [
      {
        source: 'ICIS Top 100',
        domain: 'Chemicals',
        symbol: 'LIN',
        tier: 'Top 10',
        as_of: '2025-07-20',
        weight_vector: { F: 0.6, L: 0.4 },
        decay_months: 18,
      },
    ],
    'NEM': [
      {
        source: 'S&P Global Platts',
        domain: 'Mining',
        symbol: 'NEM',
        tier: 'Top 50',
        as_of: '2025-06-05',
        weight_vector: { F: 0.7, M: 0.3 },
        decay_months: 18,
      },
      {
        source: 'RMI Certification',
        domain: 'Responsible Mining',
        symbol: 'NEM',
        tier: 'Gold',
        as_of: '2025-04-15',
        weight_vector: { E: 1.0 },
        decay_months: 36,
      },
    ],
    'SHW': [
      {
        source: 'Industry Week',
        domain: 'Specialty Chemicals',
        symbol: 'SHW',
        tier: 'Top 50',
        as_of: '2025-08-25',
        weight_vector: { M: 0.5, F: 0.5 },
        decay_months: 12,
      },
    ],
    
    // ========== SECTOR 9: REAL ESTATE ==========
    'PLD': [
      {
        source: 'GRESB',
        domain: 'Real Estate ESG',
        symbol: 'PLD',
        tier: 'Leader',
        score: 93,
        as_of: '2025-09-01',
        weight_vector: { E: 0.6, L: 0.4 },
        decay_months: 24,
      },
    ],
    'AMT': [
      {
        source: 'NAREIT',
        domain: 'REIT Performance',
        symbol: 'AMT',
        tier: 'Leader',
        as_of: '2025-07-15',
        weight_vector: { F: 0.6, M: 0.4 },
        decay_months: 12,
      },
    ],
    'WELL': [
      {
        source: 'WELL Certification',
        domain: 'Health-Focused RE',
        symbol: 'WELL',
        tier: 'Platinum',
        as_of: '2025-08-01',
        weight_vector: { E: 0.7, L: 0.3 },
        decay_months: 36,
      },
    ],
    
    // ========== SECTOR 10: UTILITIES ==========
    'DUK': [
      {
        source: 'J.D. Power',
        domain: 'Utility Satisfaction',
        symbol: 'DUK',
        tier: 'High Performer',
        score: 85,
        as_of: '2025-08-15',
        weight_vector: { M: 0.6, L: 0.4 },
        decay_months: 12,
      },
    ],
    'SO': [
      {
        source: 'EPA Energy Star',
        domain: 'Utility Efficiency',
        symbol: 'SO',
        tier: 'Top 10',
        as_of: '2025-07-20',
        weight_vector: { E: 0.8, F: 0.2 },
        decay_months: 24,
      },
    ],
    'AEP': [
      {
        source: 'EEI',
        domain: 'Grid Modernization',
        symbol: 'AEP',
        tier: 'Leader',
        as_of: '2025-06-30',
        weight_vector: { A: 0.5, F: 0.5 },
        decay_months: 18,
      },
    ],
    
    // ========== SECTOR 11: COMMUNICATION SERVICES ==========
    'GOOGL': [
      {
        source: 'Gartner MQ',
        domain: 'Cloud Infrastructure',
        symbol: 'GOOGL',
        tier: 'Leader',
        as_of: '2025-08-10',
        weight_vector: { L: 0.6, A: 0.4 },
        decay_months: 18,
      },
    ],
    'META': [
      {
        source: 'App Annie',
        domain: 'Social Media',
        symbol: 'META',
        tier: 'Leader',
        score: 90,
        reviews: 25000,
        as_of: '2025-09-20',
        weight_vector: { M: 0.7, L: 0.3 },
        decay_months: 12,
      },
    ],
    'DIS': [
      {
        source: 'Hollywood Reporter',
        domain: 'Entertainment',
        symbol: 'DIS',
        tier: 'Top 10',
        as_of: '2025-07-25',
        weight_vector: { L: 0.7, M: 0.3 },
        decay_months: 12,
      },
    ],
    
    // ========== SECTOR 12: TRANSPORTATION (Sub-Industrials) ==========
    'UPS': [
      {
        source: 'IATA Certification',
        domain: 'Logistics Safety',
        symbol: 'UPS',
        tier: 'Platinum',
        as_of: '2025-06-20',
        weight_vector: { E: 1.0 },
        decay_months: 36,
      },
    ],
    'DAL': [
      {
        source: 'Skytrax',
        domain: 'Airline Quality',
        symbol: 'DAL',
        tier: 'Top 50',
        score: 78,
        reviews: 8500,
        as_of: '2025-08-30',
        weight_vector: { M: 0.5, L: 0.5 },
        decay_months: 12,
      },
    ],
  };
  
  for (const [symbol, items] of Object.entries(examples)) {
    await kv.set(`evidence:${symbol}`, JSON.stringify(items));
    console.log(`[Evidence] Seeded ${items.length} evidence items for ${symbol}`);
  }
  
  return Object.keys(examples).length;
}
