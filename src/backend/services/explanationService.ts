import { AnalysisResult } from "./portfolioService.ts";
import { SipAllocationResult, RiskProfile } from "./sipService.ts";

/**
 * Explanation Service
 * Generates human-readable summaries of portfolio analysis and SIP allocation.
 */
export class ExplanationService {
  generateExplanation(
    analysis: AnalysisResult,
    allocation: SipAllocationResult,
    riskProfile: RiskProfile,
    horizon: number
  ): string {
    const parts: string[] = [];

    // 1. Portfolio Health Summary
    if (analysis.concentrationRisk) {
      parts.push("Your portfolio shows high concentration in a few stocks, which increases risk.");
    } else if (analysis.diversificationScore === "Good") {
      parts.push("Your portfolio is well-diversified across multiple assets.");
    } else {
      parts.push("Your portfolio has moderate diversification.");
    }

    // 2. Market Cap & Sector Exposure
    if (analysis.marketCapAllocation && analysis.marketCapAllocation.length > 0) {
      const topCap = analysis.marketCapAllocation.sort((a, b) => b.weight - a.weight)[0];
      parts.push(`Your portfolio is primarily weighted towards ${topCap.category} stocks (${topCap.weight}%).`);
    }

    if (analysis.sectorAllocation.length > 0) {
      const topSector = analysis.sectorAllocation[0];
      if (topSector.weight > 40) {
        parts.push(`You have a very high exposure to the ${topSector.sector} sector (${topSector.weight}%).`);
      } else {
        parts.push(`Your top sector exposure is ${topSector.sector} at ${topSector.weight}%.`);
      }
    }

    // 3. Allocation Strategy
    const overweightCount = analysis.overweight.length;
    const underweightCount = analysis.underweight.length;

    if (overweightCount > 0 || underweightCount > 0) {
      parts.push(`To balance your holdings, we've adjusted your SIP to favor underweight positions while reducing new capital flow into overweight ones.`);
    } else {
      parts.push("Your current weights are balanced, so your SIP is distributed evenly.");
    }

    // 4. Risk Profile & Horizon
    parts.push(`This strategy is tailored for a ${riskProfile.toLowerCase()} risk tolerance over a ${horizon}-year period.`);

    // 5. Disclaimer
    parts.push("Note: This is an automated analysis for informational purposes and does not constitute financial advice.");

    return parts.join(" ");
  }
}

export const explanationService = new ExplanationService();
