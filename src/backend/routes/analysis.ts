import { Router } from "express";
import { portfolioService } from "../services/portfolioService.ts";
import { sipService, RiskProfile } from "../services/sipService.ts";
import { explanationService } from "../services/explanationService.ts";

const router = Router();

/**
 * Unified Analysis Endpoint
 * Combines portfolio analysis and SIP allocation logic.
 */
router.post("/", async (req, res) => {
  const { portfolio, sip_amount, risk_profile, horizon, aiAdjustments, aiReasons, aiStrategy } = req.body;

  if (!portfolio || !Array.isArray(portfolio) || sip_amount === undefined || !risk_profile || !horizon) {
    return res.status(400).json({ error: "Invalid input parameters" });
  }

  try {
    // 1. Portfolio Analysis
    const analysis = await portfolioService.analyzePortfolio(portfolio);

    // 2. SIP Allocation
    const horizonYears = typeof horizon === 'string' ? parseInt(horizon) : horizon;
    const mappedRiskProfile = risk_profile as RiskProfile;

    const allocationResult = await sipService.calculateAllocation({
      portfolio,
      sipAmount: sip_amount,
      riskProfile: mappedRiskProfile,
      horizon: horizonYears,
      aiSignals: req.body.aiSignals || {}
    });

    // 3. Construct Unified Response
    res.json({
      analysis: {
        ...analysis,
        aiStrategy
      },
      allocation: allocationResult.allocations,
      excluded: allocationResult.excluded,
      explanation: allocationResult.explanation,
      meta: allocationResult.meta
    });
  } catch (error) {
    console.error("Unified analysis failed:", error);
    res.status(500).json({ error: "Unified analysis failed" });
  }
});

export default router;
