import { PortfolioItem, AnalysisResult, StockAllocation, ExcludedStock } from "../types";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

console.log("API MODE:", USE_MOCK ? "MOCK" : "REAL");

export interface AnalyzeRequest {
  portfolio: PortfolioItem[];
  sip_amount: number;
  risk_profile: string;
  horizon: string;
  aiSignals?: any;
  aiStrategy?: string;
}

export interface AnalyzeResponse {
  analysis: AnalysisResult;
  allocations: StockAllocation[];
  excluded: ExcludedStock[];
  explanation: string;
  totalAmount?: number;
}

async function mockAnalyze(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create realistic mock data based on input
      const allocations: StockAllocation[] = req.portfolio.slice(0, 3).map((item, index) => {
        const signals = (req.aiSignals && req.aiSignals[item.ticker]) || {
          trend: "positive",
          volatility: "low",
          marketCap: "large",
          sector: "Technology"
        };
        const amount = Math.floor((req.sip_amount / 3) / 100) * 100;
        return {
          ticker: item.ticker,
          amount,
          percentage: Number(((amount / req.sip_amount) * 100).toFixed(2)),
          signals,
          score: 8.5 - index
        };
      });

      const excluded: ExcludedStock[] = req.portfolio.slice(3).map(item => ({
        ticker: item.ticker,
        reason: "Lower priority this cycle",
        score: 4.2
      }));

      const response: AnalyzeResponse = {
        analysis: {
          overweight: [],
          underweight: [],
          diversificationScore: "Good",
          concentrationRisk: false,
          totalWeight: 100,
          sectorAllocation: [],
          marketCapAllocation: [],
          aiStrategy: req.aiStrategy || "Focus on high-momentum blue-chip stocks with strong cash flows."
        },
        allocations,
        excluded,
        explanation: `Based on your ${req.risk_profile.toLowerCase()} risk profile and ${req.horizon} horizon, we've optimized your SIP across ${allocations.length} key positions. We've prioritized stocks with positive momentum while maintaining sector diversification.`,
        totalAmount: req.sip_amount
      };
      resolve(response);
    }, 800);
  });
}

export const apiService = {
  analyze: async (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
    if (USE_MOCK) {
      console.log("Using mock API for analysis");
      return mockAnalyze(data);
    }

    // Safety check for API_BASE_URL
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL is missing. Please set VITE_API_URL in your environment variables or enable VITE_USE_MOCK.");
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Failed to analyze portfolio: ${res.statusText}`);
      }

      const result = await res.json();
      
      // Standardize response: ensure 'allocations' is used
      return {
        ...result,
        allocations: result.allocations || result.allocation
      };
    } catch (error) {
      console.warn("Backend analysis failed, falling back to mock mode:", error);
      return mockAnalyze(data);
    }
  }
};
