import { stockDataService } from "./stockDataService.ts";

/**
 * Portfolio Service
 * Handles deterministic logic for portfolio management.
 */
export interface PortfolioItem {
  ticker: string;
  weight: number;
}

export interface SectorAllocation {
  sector: string;
  weight: number;
}

export interface MarketCapAllocation {
  category: "large" | "mid" | "small" | "unknown";
  weight: number;
}

export interface AnalysisResult {
  overweight: string[];
  underweight: string[];
  diversificationScore: "Poor" | "Moderate" | "Good";
  concentrationRisk: boolean;
  totalWeight: number;
  sectorAllocation: SectorAllocation[];
  marketCapAllocation: MarketCapAllocation[];
}

export class PortfolioService {
  async analyzePortfolio(items: PortfolioItem[], signals: Record<string, any> = {}): Promise<AnalysisResult> {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    
    const overweight = items
      .filter(item => item.weight > 8)
      .map(item => item.ticker);
      
    const underweight = items
      .filter(item => item.weight < 8)
      .map(item => item.ticker);
      
    let diversificationScore: "Poor" | "Moderate" | "Good" = "Poor";
    if (items.length > 5) {
      diversificationScore = "Good";
    } else if (items.length >= 3) {
      diversificationScore = "Moderate";
    }
    
    // Concentration risk: top 2 stocks > 50%
    const sortedWeights = [...items].sort((a, b) => b.weight - a.weight);
    const top2Sum = (sortedWeights[0]?.weight || 0) + (sortedWeights[1]?.weight || 0);
    const concentrationRisk = top2Sum > 50;

    // Sector Allocation
    const sectorMap: Record<string, number> = {};
    const marketCapMap: Record<string, number> = {
      "large": 0,
      "mid": 0,
      "small": 0,
      "unknown": 0
    };

    for (const item of items) {
      const signal = signals[item.ticker];
      
      // 1. Sector Allocation
      const sector = signal?.sector || 'Other';
      sectorMap[sector] = (sectorMap[sector] || 0) + item.weight;

      // 2. Market Cap Allocation
      const mc = signal?.marketCap?.toLowerCase();
      if (mc === 'large' || mc === 'mid' || mc === 'small') {
        marketCapMap[mc as keyof typeof marketCapMap] += item.weight;
      } else {
        marketCapMap["unknown"] += item.weight;
      }
    }

    const sectorAllocation: SectorAllocation[] = Object.entries(sectorMap).map(([sector, weight]) => ({
      sector,
      weight: Number(weight.toFixed(2))
    })).sort((a, b) => b.weight - a.weight);

    const marketCapAllocation: MarketCapAllocation[] = Object.entries(marketCapMap).map(([category, weight]) => ({
      category: category as any,
      weight: Number(weight.toFixed(2))
    })).filter(a => a.weight > 0);

    return {
      overweight,
      underweight,
      diversificationScore,
      concentrationRisk,
      totalWeight,
      sectorAllocation,
      marketCapAllocation
    };
  }

  getMockStocks() {
    return [
      { ticker: "RELIANCE", name: "Reliance Industries" },
      { ticker: "TCS", name: "Tata Consultancy Services" },
      { ticker: "HDFCBANK", name: "HDFC Bank" },
      { ticker: "INFY", name: "Infosys" },
      { ticker: "ICICIBANK", name: "ICICI Bank" },
      { ticker: "BHARTIARTL", name: "Bharti Airtel" },
      { ticker: "SBIN", name: "State Bank of India" },
      { ticker: "ITC", name: "ITC Limited" },
      { ticker: "ASIANPAINT", name: "Asian Paints" },
      { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank" },
      { ticker: "LT", name: "Larsen & Toubro" },
      { ticker: "AXISBANK", name: "Axis Bank" },
      { ticker: "HINDUNILVR", name: "Hindustan Unilever" },
      { ticker: "ADANIENT", name: "Adani Enterprises" },
      { ticker: "BAJFINANCE", name: "Bajaj Finance" },
    ];
  }
}

export const portfolioService = new PortfolioService();
