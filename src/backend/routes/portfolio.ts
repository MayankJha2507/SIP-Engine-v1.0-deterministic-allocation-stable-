import { Router } from "express";
import { portfolioService } from "../services/portfolioService.ts";
import { stockDataService } from "../services/stockDataService.ts";

const router = Router();

// Get list of available stocks for autofill
router.get("/stocks", (req, res) => {
  res.json(portfolioService.getMockStocks());
});

// Search Indian stocks
router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: "Query parameter is required" });
  }
  try {
    const results = await stockDataService.searchStocks(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Analyze portfolio
router.post("/analyze", async (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid portfolio items" });
  }

  try {
    const result = await portfolioService.analyzePortfolio(items);
    res.json(result);
  } catch (error) {
    console.error("Analysis failed:", error);
    res.status(500).json({ error: "Portfolio analysis failed" });
  }
});

export default router;
