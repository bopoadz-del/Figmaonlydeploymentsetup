/**
 * Financial Health Scoring Utilities
 * Altman Z-Score and Piotroski F-Score calculations
 */

export interface AltmanInputs {
  workingCapital: number;      // Current Assets - Current Liabilities
  totalAssets: number;
  retainedEarnings: number;
  ebit: number;                // Earnings Before Interest & Tax
  marketCap: number;
  totalLiabilities: number;
  revenue: number;             // Sales
}

export interface PiotroskiInputs {
  roaTTM: number;              // Return on Assets (TTM)
  netIncomeTTM: number;        // Net Income (TTM)
  ocfTTM: number;              // Operating Cash Flow (TTM)
  currentRatioThis: number;    // Current Ratio (This Year)
  currentRatioLast: number;    // Current Ratio (Last Year)
  ltDebtThis: number;          // Long-term Debt (This Year)
  ltDebtLast: number;          // Long-term Debt (Last Year)
  sharesOutThis: number;       // Shares Outstanding (This Year)
  sharesOutLast: number;       // Shares Outstanding (Last Year)
  grossMarginQ: number;        // Gross Margin (Recent Quarter)
  grossMarginQLast: number;    // Gross Margin (Same Quarter Last Year)
  assetTurnoverTTM: number;    // Asset Turnover (TTM)
  assetTurnoverLast: number;   // Asset Turnover (Last FY)
}

export interface FinancialScores {
  altmanZ: number;
  altmanNormalized: number;    // 0-100 scale
  altmanInterpretation: string;
  piotroskiF: number;          // 0-9 scale
  piotroskiNormalized: number; // 0-100 scale
  piotroskiInterpretation: string;
  altmanComponents?: {
    workingCapitalRatio: number;  // A: WC/TA
    retainedEarningsRatio: number; // B: RE/TA
    ebitRatio: number;             // C: EBIT/TA
    marketCapToLiabRatio: number;  // D: MktCap/TL
    assetTurnover: number;         // E: Sales/TA
  };
  piotroskiBreakdown?: {
    profitability: number;  // 0-4 points
    leverage: number;       // 0-3 points
    operating: number;      // 0-2 points
  };
}

/**
 * Calculate Altman Z-Score for non-financial firms
 * Formula: Z = 1.2*A + 1.4*B + 3.3*C + 0.6*D + 1.0*E
 * 
 * Interpretation:
 * - Z > 2.99: Safe Zone (low bankruptcy risk)
 * - 1.81 < Z < 2.99: Grey Zone (some risk)
 * - Z < 1.81: Distress Zone (high bankruptcy risk)
 */
export function calculateAltmanZ(inputs: AltmanInputs): number {
  const { workingCapital, totalAssets, retainedEarnings, ebit, marketCap, totalLiabilities, revenue } = inputs;
  
  // Avoid division by zero
  if (totalAssets === 0) return 0;
  
  const A = workingCapital / totalAssets;
  const B = retainedEarnings / totalAssets;
  const C = ebit / totalAssets;
  const D = totalLiabilities > 0 ? marketCap / totalLiabilities : 0;
  const E = revenue / totalAssets;
  
  const zScore = 1.2 * A + 1.4 * B + 3.3 * C + 0.6 * D + 1.0 * E;
  
  return zScore;
}

/**
 * Normalize Altman Z-Score to 0-100 scale
 * Uses soft cap at Z=3.5 for normalization
 */
export function normalizeAltmanZ(zScore: number): number {
  // Soft cap at 3.5 (excellent score)
  const normalized = Math.max(0, Math.min(100, (zScore / 3.5) * 100));
  return Math.round(normalized);
}

/**
 * Get interpretation of Altman Z-Score
 */
export function interpretAltmanZ(zScore: number): string {
  if (zScore > 2.99) return 'Safe Zone - Low bankruptcy risk';
  if (zScore > 1.81) return 'Grey Zone - Moderate risk';
  return 'Distress Zone - High bankruptcy risk';
}

/**
 * Get detailed components of Altman Z-Score
 */
export function getAltmanComponents(inputs: AltmanInputs) {
  const { workingCapital, totalAssets, retainedEarnings, ebit, marketCap, totalLiabilities, revenue } = inputs;
  
  if (totalAssets === 0) {
    return {
      workingCapitalRatio: 0,
      retainedEarningsRatio: 0,
      ebitRatio: 0,
      marketCapToLiabRatio: 0,
      assetTurnover: 0
    };
  }
  
  return {
    workingCapitalRatio: workingCapital / totalAssets,
    retainedEarningsRatio: retainedEarnings / totalAssets,
    ebitRatio: ebit / totalAssets,
    marketCapToLiabRatio: totalLiabilities > 0 ? marketCap / totalLiabilities : 0,
    assetTurnover: revenue / totalAssets
  };
}

/**
 * Calculate Piotroski F-Score
 * Score ranges from 0 (weak) to 9 (strong)
 * 
 * Breakdown:
 * - Profitability (0-4 points): ROA, Net Income, OCF, Accruals
 * - Leverage/Liquidity (0-3 points): Debt, Current Ratio, Shares
 * - Operating Efficiency (0-2 points): Margin, Turnover
 * 
 * Interpretation:
 * - F 8-9: Strong financials
 * - F 5-7: Average financials  
 * - F 0-4: Weak financials
 */
export function calculatePiotroskiF(inputs: PiotroskiInputs): number {
  let score = 0;
  
  // Profitability signals (4 points)
  if (inputs.roaTTM > 0) score++;              // 1. Positive ROA
  if (inputs.netIncomeTTM > 0) score++;        // 2. Positive Net Income
  if (inputs.ocfTTM > 0) score++;              // 3. Positive Operating Cash Flow
  if (inputs.ocfTTM > inputs.netIncomeTTM) score++; // 4. Quality of earnings (OCF > Net Income)
  
  // Leverage, Liquidity, Source of Funds (3 points)
  if (inputs.currentRatioThis > inputs.currentRatioLast) score++; // 5. Improving liquidity
  if (inputs.ltDebtThis < inputs.ltDebtLast) score++;             // 6. Decreasing leverage
  if (inputs.sharesOutThis <= inputs.sharesOutLast) score++;      // 7. No dilution
  
  // Operating Efficiency (2 points)
  if (inputs.grossMarginQ > inputs.grossMarginQLast) score++;     // 8. Improving margin
  if (inputs.assetTurnoverTTM > inputs.assetTurnoverLast) score++; // 9. Improving asset turnover
  
  return score;
}

/**
 * Get breakdown of Piotroski F-Score by category
 */
export function getPiotroskiBreakdown(inputs: PiotroskiInputs) {
  let profitability = 0;
  let leverage = 0;
  let operating = 0;
  
  // Profitability (0-4)
  if (inputs.roaTTM > 0) profitability++;
  if (inputs.netIncomeTTM > 0) profitability++;
  if (inputs.ocfTTM > 0) profitability++;
  if (inputs.ocfTTM > inputs.netIncomeTTM) profitability++;
  
  // Leverage (0-3)
  if (inputs.currentRatioThis > inputs.currentRatioLast) leverage++;
  if (inputs.ltDebtThis < inputs.ltDebtLast) leverage++;
  if (inputs.sharesOutThis <= inputs.sharesOutLast) leverage++;
  
  // Operating (0-2)
  if (inputs.grossMarginQ > inputs.grossMarginQLast) operating++;
  if (inputs.assetTurnoverTTM > inputs.assetTurnoverLast) operating++;
  
  return { profitability, leverage, operating };
}

/**
 * Normalize Piotroski F-Score to 0-100 scale
 */
export function normalizePiotroskiF(fScore: number): number {
  return Math.round((fScore / 9) * 100);
}

/**
 * Get interpretation of Piotroski F-Score
 */
export function interpretPiotroskiF(fScore: number): string {
  if (fScore >= 8) return 'Strong - Excellent financial health';
  if (fScore >= 5) return 'Average - Moderate financial health';
  return 'Weak - Poor financial health';
}

/**
 * Calculate both scores and return comprehensive results
 */
export function calculateFinancialScores(
  altmanInputs: AltmanInputs,
  piotroskiInputs: PiotroskiInputs
): FinancialScores {
  const altmanZ = calculateAltmanZ(altmanInputs);
  const piotroskiF = calculatePiotroskiF(piotroskiInputs);
  
  return {
    altmanZ,
    altmanNormalized: normalizeAltmanZ(altmanZ),
    altmanInterpretation: interpretAltmanZ(altmanZ),
    piotroskiF,
    piotroskiNormalized: normalizePiotroskiF(piotroskiF),
    piotroskiInterpretation: interpretPiotroskiF(piotroskiF),
    altmanComponents: getAltmanComponents(altmanInputs),
    piotroskiBreakdown: getPiotroskiBreakdown(piotroskiInputs)
  };
}
