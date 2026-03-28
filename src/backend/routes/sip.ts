import { Router } from "express";
import { sipService } from "../services/sipService.ts";

const router = Router();

// Calculate SIP allocation
router.post("/calculate", async (req, res) => {
  const { portfolio, sipAmount, riskProfile, horizon } = req.body;
  
  if (!portfolio || !Array.isArray(portfolio) || sipAmount === undefined || !riskProfile || horizon === undefined) {
    return res.status(400).json({ error: "Invalid input parameters" });
  }

  const result = await sipService.calculateAllocation({
    portfolio,
    sipAmount,
    riskProfile,
    horizon,
    aiSignals: req.body.aiSignals || {}
  });
  
  res.json(result);
});

export default router;
