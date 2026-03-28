import { GoogleGenAI } from "@google/genai";
import { TopPick, PortfolioItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async getTopPicks(): Promise<TopPick[]> {
    try {
      const prompt = `
        Identify 5 Indian stocks (NSE/BSE) that are currently worth checking out for building new positions as of early 2026.
        Consider:
        1. Strong quarterly performance.
        2. Positive sector tailwinds (e.g., green energy, infrastructure, IT).
        3. Reasonable valuations or clear growth trajectories.
        4. Macro stability.

        Return a JSON array of objects with:
        - "ticker": The stock ticker (e.g., "RELIANCE", "TCS").
        - "name": Full name of the company.
        - "rationale": A crystal clear explanation of why this stock is a top pick right now.
        - "sector": The industry sector.
        - "potential": Expected growth or outlook (e.g., "Bullish", "Long-term Growth").
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "[]");
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Gemini market analysis failed:", error);
      return [];
    }
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
    try {
      const prompt = `
        Provide current market signals and macro-economic context for this stock portfolio as of early 2026.
        Portfolio: ${JSON.stringify(portfolio)}
        Risk Profile: ${riskProfile}
        Horizon: ${horizon} years

        For each stock, identify:
        1. trend: 3-month price trend ("positive", "flat", or "negative").
        2. volatility: Price swing intensity ("high", "medium", or "low").
        3. marketCap: Company size category ("large", "mid", or "small").
        4. sector: The industry sector.
        5. reason: A brief factual observation about the stock's recent performance.
        
        Return a JSON object with:
        1. "signals": A map of ticker to an object { "trend": string, "volatility": string, "marketCap": string, "sector": string, "reason": string }.
        2. "strategy": A brief factual summary of the current market environment for these sectors, including macro trends (inflation, interest rates, sector-specific tailwinds) that inform where the money should go.
        
        Ensure all tickers in the portfolio are included in signals.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      return {
        signals: result.signals || {},
        strategy: result.strategy || ""
      };
    } catch (error) {
      console.error("Gemini stock signal analysis failed:", error);
      return { signals: {}, strategy: "" };
    }
  }
};
