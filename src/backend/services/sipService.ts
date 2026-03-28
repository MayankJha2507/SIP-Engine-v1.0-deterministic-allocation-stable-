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
  reason?: string; // Restored for backward compatibility
}

export interface ExcludedStock {
  ticker: string;
  reason: string;
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
  };
}

export interface SipInput {
  portfolio: PortfolioItem[];
  sipAmount: number;
  riskProfile: RiskProfile;
  horizon: number;
  aiSignals: Record<string, StockSignals>; // ✅ Restored for backward compatibility
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
      const s = aiSignals[item.ticker];

      if (!s) {
        excluded.push({
          ticker: item.ticker,
          reason: "Insufficient market data"
        });
        return;
      }

      // 1. Trend Score
      let trendScore = s.trend === "positive" ? 9 :
                       s.trend === "negative" ? 2 : 5;

      // 2. Stability Score
      let stabilityScore = s.marketCap === "large" ? 9 :
                           s.marketCap === "small" ? 3 : 6;

      // 3. Underweight Boost (<15% + positive trend)
      if (item.weight < 15 && s.trend === "positive") {
        trendScore += 2.0; // Increased boost for recovery/growth
      }

      // 4. Risk Profile Adjustments
      if (riskProfile === "Low") {
        if (s.marketCap === "large") stabilityScore += 3; // Prefer large cap for Low risk
      } else if (riskProfile === "High") {
        if (s.marketCap === "small") trendScore += 1.5; // Allow more small cap for High risk
      }

      // 5. Horizon Adjustments
      if (horizon >= 5 && s.trend === "negative") {
        trendScore += 2.5; // Long-term recovery play boost
      }
      if (horizon <= 2 && s.volatility === "high") {
        trendScore -= 3.0; // Penalize short-term volatility
      }

      // 6. Volatility Penalty (Scaled by Risk Profile)
      let volatilityPenalty = 0;
      if (s.volatility === "high") {
        volatilityPenalty = riskProfile === "High" ? 1.0 : (riskProfile === "Low" ? 5.0 : 3.0);
      }

      // 7. Proportional Penalties (Scaled with weight)
      const sectorPenalty = Math.min(10, (sectorWeights[s.sector] || 0) / 4); // More aggressive penalty
      const weightPenalty = Math.min(10, item.weight / 3); // More aggressive penalty

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
          reason: "Avoid this cycle: Low score",
          score: Number(finalScore.toFixed(1))
        });
        return;
      }

      // Sector concentration exclusion
      if (overConcentratedSector && s.sector === overConcentratedSector && finalScore < 5) {
        excluded.push({
          ticker: item.ticker,
          reason: "Avoid this cycle: Sector overexposure",
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
        explanation: `All stocks were excluded due to high ${riskType.toLowerCase()}.`,
        meta: { riskType, overConcentratedSector }
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
          reason: "Lower priority this cycle"
        });
      }
    });

    // =========================
    // STEP 4: ALLOCATION (Fixed for Sector Over-concentration)
    // =========================
    const totalScore = selected.reduce((sum, s) => sum + s.finalScore, 0);
    
    // Sector tracking and cap enforcement
    const SECTOR_CAP = 0.6 * sipAmount; // Max 60% per sector
    const sectorAllocated: Record<string, number> = {}; // Track how much SIP is being allocated per sector
    const tempAllocations: any[] = [];
    
    let remainingSip = sipAmount;

    // First pass: Proportional allocation with sector capping
    // BUG 1 FIX: Rounding to nearest 100 at the time of allocation to keep remainingSip consistent
    selected.forEach(s => {
      const targetShare = (s.finalScore / totalScore) * sipAmount;
      const currentSectorTotal = sectorAllocated[s.signals.sector] || 0;
      
      // Cap enforcement: check if proposed allocation exceeds sector limit
      let actualShare = targetShare;
      if (currentSectorTotal + targetShare > SECTOR_CAP) {
        // Reduce allocation to fit within cap
        actualShare = Math.max(0, SECTOR_CAP - currentSectorTotal);
      }

      const amount = Math.floor(actualShare / 100) * 100;
      sectorAllocated[s.signals.sector] = currentSectorTotal + amount;
      remainingSip -= amount;

      tempAllocations.push({
        ticker: s.ticker,
        amount,
        signals: s.signals,
        score: s.finalScore
      });
    });

    // Redistribution: Ensure total SIP is fully allocated by moving remainder to other sectors
    if (remainingSip > 0) {
      const uncappedStocks = tempAllocations.filter(a => (sectorAllocated[a.signals.sector] || 0) < SECTOR_CAP);
      
      if (uncappedStocks.length > 0) {
        const uncappedTotalScore = uncappedStocks.reduce((sum, a) => sum + a.score, 0);
        const sipToDistribute = remainingSip;
        
        uncappedStocks.forEach(a => {
          const extra = (a.score / uncappedTotalScore) * sipToDistribute;
          const currentSectorTotal = sectorAllocated[a.signals.sector] || 0;
          const allowedExtra = Math.max(0, SECTOR_CAP - currentSectorTotal);
          
          // BUG 1 FIX: Use rounded values for redistribution to keep remainingSip consistent
          const actualExtra = Math.floor(Math.min(extra, allowedExtra) / 100) * 100;
          
          a.amount += actualExtra;
          sectorAllocated[a.signals.sector] += actualExtra;
          remainingSip -= actualExtra;
        });
      }
    }

    // BUG 2 FIX: Controlled fallback instead of dumping everything into one stock
    // Respect SECTOR_CAP for each sector during fallback distribution
    if (remainingSip > 0) {
      for (const a of tempAllocations) {
        if (remainingSip <= 0) break;
        const currentSectorTotal = sectorAllocated[a.signals.sector] || 0;
        const allowedExtra = Math.max(0, SECTOR_CAP - currentSectorTotal);
        const actualExtra = Math.min(remainingSip, allowedExtra);
        
        if (actualExtra > 0) {
          a.amount += actualExtra;
          sectorAllocated[a.signals.sector] += actualExtra;
          remainingSip -= actualExtra;
        }
      }
      
      // Final fallback if still remaining (all sectors capped)
      if (remainingSip > 0 && tempAllocations.length > 0) {
        tempAllocations[0].amount += remainingSip;
        remainingSip = 0;
      }
    }

    // BUG 3 FIX: Handle MIN_ALLOCATION removal and return funds to remainingSip
    const allocations: StockAllocation[] = [];
    let finalPassRemainingSip = 0;

    tempAllocations.forEach(a => {
      // Rounding check (redundant but safe)
      const roundedAmount = Math.floor(a.amount / 100) * 100;

      if (roundedAmount < MIN_ALLOCATION) {
        excluded.push({
          ticker: a.ticker,
          reason: `Allocation too small (₹${roundedAmount}) after sector capping`,
          score: Number(a.score.toFixed(1))
        });
        // Return amount to pool and update sector tracking
        finalPassRemainingSip += roundedAmount;
        sectorAllocated[a.signals.sector] -= roundedAmount;
      } else {
        allocations.push({
          ticker: a.ticker,
          amount: roundedAmount,
          percentage: 0,
          signals: a.signals,
          score: Number(a.score.toFixed(1))
        });
      }
    });

    // Redistribute funds from removed stocks safely using sector-cap-aware logic
    if (finalPassRemainingSip > 0 && allocations.length > 0) {
      for (const a of allocations) {
        if (finalPassRemainingSip <= 0) break;
        const currentSectorTotal = sectorAllocated[a.signals.sector] || 0;
        const allowedExtra = Math.max(0, SECTOR_CAP - currentSectorTotal);
        const actualExtra = Math.min(finalPassRemainingSip, allowedExtra);
        
        if (actualExtra > 0) {
          a.amount += actualExtra;
          sectorAllocated[a.signals.sector] += actualExtra;
          finalPassRemainingSip -= actualExtra;
        }
      }
      
      // Absolute last resort fallback to maintain total SIP amount
      if (finalPassRemainingSip > 0) {
        allocations[0].amount += finalPassRemainingSip;
        finalPassRemainingSip = 0;
      }
    }

    // Final rounding fix to ensure totalAmount === sipAmount exactly (Safety check)
    const finalSum = allocations.reduce((sum, a) => sum + a.amount, 0);
    const finalRemainder = sipAmount - finalSum;
    if (finalRemainder !== 0 && allocations.length > 0) {
      allocations[0].amount += finalRemainder;
    }

    // Final percentages
    allocations.forEach(a => {
      a.percentage = Number(((a.amount / sipAmount) * 100).toFixed(2));
    });

    // Generate explanation for backward compatibility
    const topTickers = allocations.map(a => a.ticker).join(", ");
    const explanation = `We've selected ${allocations.length} stocks (${topTickers}) based on their strong momentum and stability scores. ${excluded.length > 0 ? `${excluded.length} stocks were excluded due to low scores or high risk.` : ""} This strategy is optimized for a ${riskProfile.toLowerCase()} risk profile over a ${horizon}-year horizon.`;

    return {
      allocations,
      excluded,
      totalAmount: sipAmount,
      explanation,
      meta: {
        riskType,
        overConcentratedSector
      }
    };
  }
}

export const sipService = new SIPService();