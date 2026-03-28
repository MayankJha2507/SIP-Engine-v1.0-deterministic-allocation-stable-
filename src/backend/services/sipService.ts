/**
 * SIP Service (Refactored v2)
 * Deterministic, explainable SIP allocation engine
 */

import { PortfolioItem } from "./portfolioService.ts";

export type RiskProfile = "Low" | "Medium" | "High";

export interface StockSignals {
  trend: "positive" | "flat" | "negative";
  volatility: "high" | "medium" | "low";
  marketCap: "large" | "mid" | "small";
  sector: string;
}

export interface StockAllocation {
  ticker: string;
  amount: number;
  percentage: number;
  signals: StockSignals;
  score: number;
  reasons?: string[]; // Bullet reasons
}

export interface ExcludedStock {
  ticker: string;
  reasons: string[];
  score?: number;
}

export interface SipAllocationResult {
  allocations: StockAllocation[];
  excluded: ExcludedStock[];
  totalAmount: number;
  explanation: string; // Restored for backward compatibility
  meta: {
    riskType: string;
    overConcentratedSector?: string;
    cashReserve?: number;
    recommendation?: string;
  };
}

export interface SipInput {
  portfolio: PortfolioItem[];
  sipAmount: number;
  riskProfile: RiskProfile;
  horizon: number;
  aiSignals: Record<string, StockSignals>; // ✅ Restored for backward compatibility
}

export function generateReasonsFromSignals(signals: StockSignals, riskProfile: RiskProfile): string[] {
  const reasons: string[] = [];
  
  if (signals.trend === "positive") reasons.push("Strong upward momentum");
  if (signals.trend === "negative") reasons.push("Weak momentum");
  if (signals.trend === "flat") reasons.push("Stable trend");
  
  if (signals.volatility === "high") {
    reasons.push(riskProfile === "Low" ? "High volatility for your selected risk level" : "Elevated volatility");
  } else if (signals.volatility === "low") {
    reasons.push("Low volatility suitable for your risk profile");
  }
  
  if (signals.marketCap === "large") reasons.push("Large-cap stability");
  if (signals.marketCap === "mid") reasons.push("Balanced growth and stability");
  if (signals.marketCap === "small") reasons.push("High growth potential");
  
  return reasons;
}

export class SIPService {
  async calculateAllocation(input: SipInput): Promise<SipAllocationResult> {
    const { portfolio, sipAmount, riskProfile, horizon, aiSignals } = input;

    if (!portfolio.length) {
      return {
        allocations: [],
        excluded: [],
        totalAmount: sipAmount,
        explanation: "No stocks provided in portfolio.",
        meta: { riskType: "Empty Portfolio" }
      };
    }

    const MIN_ALLOCATION = 1000;
    const excluded: ExcludedStock[] = [];
    const candidates: (PortfolioItem & {
      finalScore: number;
      signals: StockSignals;
    })[] = [];

    // =========================
    // STEP 1: SECTOR ANALYSIS
    // =========================
    const sectorWeights: Record<string, number> = {};

    portfolio.forEach(item => {
      const s = aiSignals[item.ticker];
      if (s) {
        sectorWeights[s.sector] = (sectorWeights[s.sector] || 0) + item.weight;
      }
    });

    const sorted = [...portfolio].sort((a, b) => b.weight - a.weight);
    const top2Weight = (sorted[0]?.weight || 0) + (sorted[1]?.weight || 0);

    let riskType = "Balanced";
    let overConcentratedSector: string | undefined;

    for (const [sector, weight] of Object.entries(sectorWeights)) {
      if (weight > 60) {
        riskType = "Sector Concentration Risk";
        overConcentratedSector = sector;
        break;
      }
    }

    if (!overConcentratedSector && top2Weight > 50) {
      riskType = "Stock Concentration Risk";
    }

    // =========================
    // STEP 2: SCORING (Improved)
    // =========================
    portfolio.forEach(item => {
      let s = aiSignals[item.ticker];

      if (!s) {
        excluded.push({
          ticker: item.ticker,
          reasons: ["Insufficient market data"]
        });
        return;
      }

      // Safety Fallbacks
      if (!s.sector) s.sector = "Other";
      if (!s.marketCap) s.marketCap = "large";

      // 1. Trend Score
      let trendScore = s.trend === "positive" ? 9 :
                       s.trend === "negative" ? 2 : 5;

      // 2. Stability Score
      let stabilityScore = s.marketCap === "large" ? 9 :
                           s.marketCap === "small" ? 3 : 6;

      // 3. Underweight Boost (<15% + positive trend)
      if (item.weight < 15 && s.trend === "positive") {
        trendScore += 2.0;
      }

      // 4. Risk Profile Adjustments
      if (riskProfile === "Low") {
        if (s.marketCap === "large") stabilityScore += 3;
      } else if (riskProfile === "High") {
        if (s.marketCap === "small") trendScore += 1.5;
      }

      // 5. Horizon Adjustments
      if (horizon >= 5 && s.trend === "negative") {
        trendScore += 2.5;
      }
      if (horizon <= 2 && s.volatility === "high") {
        trendScore -= 3.0;
      }

      // 6. Volatility Penalty (Scaled by Risk Profile)
      let volatilityPenalty = 0;
      if (s.volatility === "high") {
        volatilityPenalty = riskProfile === "High" ? 1.0 : (riskProfile === "Low" ? 5.0 : 3.0);
      }

      // 7. Proportional Penalties (Scaled with weight)
      const sectorPenalty = Math.min(10, (sectorWeights[s.sector] || 0) / 4);
      const weightPenalty = Math.min(10, item.weight / 3);

      let finalScore =
        (0.4 * trendScore) +
        (0.3 * stabilityScore) -
        (0.2 * sectorPenalty) -
        (0.1 * weightPenalty) -
        volatilityPenalty;

      finalScore = Math.max(0, Math.min(10, finalScore));

      // Exclusion rules
      if (finalScore < 4) {
        excluded.push({
          ticker: item.ticker,
          reasons: generateReasonsFromSignals(s, riskProfile),
          score: Number(finalScore.toFixed(1))
        });
        return;
      }

      // Sector concentration exclusion
      if (overConcentratedSector && s.sector === overConcentratedSector && finalScore < 5) {
        excluded.push({
          ticker: item.ticker,
          reasons: ["Sector overexposure"],
          score: Number(finalScore.toFixed(1))
        });
        return;
      }

      candidates.push({
        ...item,
        finalScore,
        signals: s
      });
    });

    if (!candidates.length) {
      return {
        allocations: [],
        excluded,
        totalAmount: sipAmount,
        explanation: "No suitable opportunities this cycle. Hold cash.",
        meta: { 
          riskType, 
          overConcentratedSector,
          cashReserve: sipAmount,
          recommendation: "HOLD_CASH"
        }
      };
    }

    // =========================
    // STEP 3: SELECTION
    // =========================
    const maxStocks =
      riskProfile === "Low" ? 5 :
      riskProfile === "Medium" ? 4 : 3;

    let selected = candidates
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, maxStocks);

    // Ensure diversification
    if (overConcentratedSector) {
      const hasOutside = selected.some(s => s.signals.sector !== overConcentratedSector);

      if (!hasOutside) {
        const outside = candidates.find(c => c.signals.sector !== overConcentratedSector);
        if (outside) {
          selected[selected.length - 1] = outside;
        }
      }
    }

    // Mark non-selected
    const selectedSet = new Set(selected.map(s => s.ticker));
    candidates.forEach(c => {
      if (!selectedSet.has(c.ticker)) {
        excluded.push({
          ticker: c.ticker,
          reasons: ["Lower priority this cycle"]
        });
      }
    });

    // =========================
    // STEP 4: ALLOCATION
    // =========================
    const MAX_STOCK_CAP = 0.4;
    const totalScore = selected.reduce((sum, s) => sum + s.finalScore, 0);
    
    // Sector tracking and cap enforcement
    const SECTOR_CAP = 0.6 * sipAmount; // Max 60% per sector
    const sectorAllocated: Record<string, number> = {}; 
    const tempAllocations: any[] = [];
    
    let remainingSip = sipAmount;
    let cashReserve = 0;

    // First pass: Proportional allocation with caps
    selected.forEach(s => {
      let targetShare = (s.finalScore / totalScore) * sipAmount;
      
      // Enforce MAX_STOCK_CAP (40%)
      if (targetShare > sipAmount * MAX_STOCK_CAP) {
        const excess = targetShare - (sipAmount * MAX_STOCK_CAP);
        targetShare = sipAmount * MAX_STOCK_CAP;
        cashReserve += excess;
      }

      const currentSectorTotal = sectorAllocated[s.signals.sector] || 0;
      
      // Enforce SECTOR_CAP (60%)
      if (currentSectorTotal + targetShare > SECTOR_CAP) {
        const actualShare = Math.max(0, SECTOR_CAP - currentSectorTotal);
        cashReserve += (targetShare - actualShare);
        targetShare = actualShare;
      }

      const amount = Math.floor(targetShare / 100) * 100;
      sectorAllocated[s.signals.sector] = currentSectorTotal + amount;
      remainingSip -= amount;

      tempAllocations.push({
        ticker: s.ticker,
        amount,
        signals: s.signals,
        score: s.finalScore,
        reasons: generateReasonsFromSignals(s.signals, riskProfile)
      });
    });

    // If selected stocks < 3: DO NOT force full deployment
    if (selected.length < 3) {
      cashReserve += remainingSip;
      remainingSip = 0;
    }

    // Redistribution: Only if we have 3+ stocks and remaining funds
    if (remainingSip > 0 && selected.length >= 3) {
      const uncappedStocks = tempAllocations.filter(a => 
        (sectorAllocated[a.signals.sector] || 0) < SECTOR_CAP &&
        a.amount < sipAmount * MAX_STOCK_CAP
      );
      
      if (uncappedStocks.length > 0) {
        const uncappedTotalScore = uncappedStocks.reduce((sum, a) => sum + a.score, 0);
        const sipToDistribute = remainingSip;
        
        uncappedStocks.forEach(a => {
          const extra = (a.score / uncappedTotalScore) * sipToDistribute;
          const currentSectorTotal = sectorAllocated[a.signals.sector] || 0;
          const allowedBySector = Math.max(0, SECTOR_CAP - currentSectorTotal);
          const allowedByStock = Math.max(0, (sipAmount * MAX_STOCK_CAP) - a.amount);
          
          const actualExtra = Math.floor(Math.min(extra, allowedBySector, allowedByStock) / 100) * 100;
          
          a.amount += actualExtra;
          sectorAllocated[a.signals.sector] += actualExtra;
          remainingSip -= actualExtra;
        });
      }
    }

    // Any remaining SIP goes to cashReserve (NEVER dump into first stock)
    cashReserve += remainingSip;
    remainingSip = 0;

    // Final Pass: Handle MIN_ALLOCATION and move to cashReserve if too small
    const allocations: StockAllocation[] = [];
    tempAllocations.forEach(a => {
      if (a.amount < MIN_ALLOCATION) {
        excluded.push({
          ticker: a.ticker,
          reasons: [`Allocation too small (₹${a.amount})`],
          score: Number(a.score.toFixed(1))
        });
        cashReserve += a.amount;
      } else {
        allocations.push({
          ticker: a.ticker,
          amount: a.amount,
          percentage: Number(((a.amount / sipAmount) * 100).toFixed(2)),
          signals: a.signals,
          score: Number(a.score.toFixed(1)),
          reasons: a.reasons
        });
      }
    });

    // Final cash reserve calculation
    const finalCashReserve = Math.floor(cashReserve);
    const topTickers = allocations.map(a => a.ticker).join(", ");
    let explanation = allocations.length > 0 
      ? `We've selected ${allocations.length} stocks (${topTickers}) based on their momentum and stability.`
      : "No suitable opportunities this cycle. Hold cash.";
    
    if (finalCashReserve > 0) {
      explanation += ` A cash reserve of ₹${finalCashReserve.toLocaleString()} is recommended for better future opportunities.`;
    }

    return {
      allocations,
      excluded,
      totalAmount: sipAmount,
      explanation,
      meta: {
        riskType,
        overConcentratedSector,
        cashReserve: finalCashReserve,
        recommendation: allocations.length === 0 ? "HOLD_CASH" : undefined
      }
    };
  }
}

export const sipService = new SIPService();
