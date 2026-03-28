import { TopPick, PortfolioItem } from "../types";

// Gemini API is now handled by the backend for security.
// This frontend service is kept for backward compatibility but returns mock data or empty results.

export const geminiService = {
  async getTopPicks(): Promise<TopPick[]> {
    console.warn("geminiService.getTopPicks is deprecated on frontend. Use backend API.");
    return [];
  },

  async getStockSignals(
    portfolio: PortfolioItem[],
    sipAmount: number,
    riskProfile: string,
    horizon: number
  ): Promise<{ 
    signals: Record<string, { 
      trend: "positive" | "flat" | "negative";
      volatility: "high" | "medium" | "low";
      marketCap: "large" | "mid" | "small";
      sector: string;
      reason: string;
    }>; 
    strategy: string;
  }> {
    console.warn("geminiService.getStockSignals is deprecated on frontend. Backend will handle AI logic.");
    return { signals: {}, strategy: "" };
  }
};
