import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface StockSignals {
  trend: "positive" | "flat" | "negative";
  volatility: "high" | "medium" | "low";
  marketCap: "large" | "mid" | "small";
  sector: string;
  reason: string;
}

export interface MacroSignals {
  bullishSectors: string[];
  bearishSectors: string[];
  marketSentiment: "bullish" | "bearish" | "neutral";
  summary: string;
}

export const geminiService = {
  async getMacroSignals(): Promise<MacroSignals> {
    try {
      const prompt = `
        Provide a structured analysis of current Indian market macro trends as of early 2026.
        Identify:
        1. bullishSectors: Sectors expected to outperform (e.g., ["Banking", "Infrastructure"]).
        2. bearishSectors: Sectors expected to underperform (e.g., ["IT"]).
        3. marketSentiment: Overall sentiment ("bullish", "bearish", or "neutral").
        4. summary: A 1-2 sentence explanation of the current macro environment.

        Return ONLY a JSON object with these keys. No markdown, no extra text.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      return {
        bullishSectors: Array.isArray(result.bullishSectors) ? result.bullishSectors : [],
        bearishSectors: Array.isArray(result.bearishSectors) ? result.bearishSectors : [],
        marketSentiment: ["bullish", "bearish", "neutral"].includes(result.marketSentiment) ? result.marketSentiment : "neutral",
        summary: result.summary || "Macro data unavailable, using neutral allocation strategy."
      };
    } catch (error) {
      console.warn("Gemini macro signal analysis failed, using fallback:", error);
      return {
        bullishSectors: [],
        bearishSectors: [],
        marketSentiment: "neutral",
        summary: "Macro data unavailable, using neutral allocation strategy."
      };
    }
  },

  async getTopPicks() {
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
    portfolio: any[],
    sipAmount: number,
    riskProfile: string,
    horizon: number
  ): Promise<{ 
    signals: Record<string, StockSignals>; 
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
      console.warn("Gemini stock signal analysis failed, using fallback signals:", error);
      return this.generateFallbackSignals(portfolio);
    }
  },

  generateFallbackSignals(portfolio: any[]): { 
    signals: Record<string, StockSignals>; 
    strategy: string;
  } {
    const sectorMapping: Record<string, string> = {
      "RELIANCE": "Energy",
      "TCS": "Technology",
      "INFY": "Technology",
      "HDFCBANK": "Banking",
      "ICICIBANK": "Banking",
      "BAJFINANCE": "NBFC",
      "WIPRO": "Technology"
    };

    const signals: Record<string, StockSignals> = {};
    
    portfolio.forEach(item => {
      signals[item.ticker] = {
        trend: "flat",
        volatility: "medium",
        marketCap: "large",
        sector: sectorMapping[item.ticker] || "Other",
        reason: "Market data currently unavailable. Using conservative fallback signals."
      };
    });

    return {
      signals,
      strategy: "Market insights are currently limited due to a temporary service interruption. We recommend a balanced approach focusing on high-quality large-cap stocks and maintaining sector diversification until full analysis is restored."
    };
  }
};
