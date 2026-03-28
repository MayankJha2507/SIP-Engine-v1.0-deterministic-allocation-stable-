import { Router } from "express";
import { portfolioService } from "../services/portfolioService.ts";
import { sipService, RiskProfile } from "../services/sipService.ts";
import { geminiService } from "../services/geminiService.ts";

const router = Router();

/**
 * Unified Analysis Endpoint
 * Combines portfolio analysis and SIP allocation logic.
 */
router.post("/", async (req, res) => {
  const { portfolio, sip_amount, risk_profile, horizon } = req.body;
  let { aiSignals, aiStrategy } = req.body;

  if (!portfolio || !Array.isArray(portfolio) || sip_amount === undefined || !risk_profile || !horizon) {
    return res.status(400).json({ error: "Invalid input parameters" });
  }

  try {
    // 1. Get AI signals if not provided (moving AI logic to backend)
    if (!aiSignals || Object.keys(aiSignals).length === 0) {
      const horizonYears = typeof horizon === 'string' ? parseInt(horizon) : horizon;
      try {
        const aiResponse = await geminiService.getStockSignals(
          portfolio,
          sip_amount,
          risk_profile,
          horizonYears
        );
        aiSignals = aiResponse.signals;
        aiStrategy = aiResponse.strategy;
      } catch (e) {
        console.error("Gemini signals failed, using fallback", e);
        aiSignals = {};
        aiStrategy = "Market conditions are mixed. Focus on diversification and long-term discipline.";
      }
    }

    if (!aiStrategy) {
      aiStrategy = "Market conditions are mixed. Focus on diversification and long-term discipline.";
    }

    // 2. Portfolio Analysis
    const analysis = await portfolioService.analyzePortfolio(portfolio, aiSignals);

    // 3. SIP Allocation
    const horizonYears = typeof horizon === 'string' ? parseInt(horizon) : horizon;
    const mappedRiskProfile = risk_profile as RiskProfile;

    const allocationResult = await sipService.calculateAllocation({
      portfolio,
      sipAmount: sip_amount,
      riskProfile: mappedRiskProfile,
      horizon: horizonYears,
      aiSignals: aiSignals || {}
    });

    // Handle zero allocation case
    if (allocationResult.allocations.length === 0) {
      return res.json({
        analysis: {
          ...analysis,
          aiStrategy
        },
        allocation: [],
        allocations: [],
        excluded: allocationResult.excluded,
        totalAmount: sip_amount,
        explanation: "No suitable investment opportunities found this cycle.",
        meta: {
          ...allocationResult.meta,
          recommendation: "HOLD_CASH"
        }
      });
    }

    // 4. Construct Unified Response
    res.json({
      analysis: {
        ...analysis,
        aiStrategy
      },
      allocation: allocationResult.allocations, // Singular for current frontend
      allocations: allocationResult.allocations, // Plural for user's request
      excluded: allocationResult.excluded,
      totalAmount: allocationResult.totalAmount,
      explanation: allocationResult.explanation,
      meta: allocationResult.meta
    });
  } catch (error) {
    console.error("Unified analysis failed:", error);
    res.status(500).json({ error: "Unified analysis failed" });
  }
});

export default router;
