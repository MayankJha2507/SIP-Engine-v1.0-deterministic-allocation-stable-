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
  category: "Large Cap" | "Mid Cap" | "Small Cap" | "Unknown";
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
  async analyzePortfolio(items: PortfolioItem[]): Promise<AnalysisResult> {
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
      "Large Cap": 0,
      "Mid Cap": 0,
      "Small Cap": 0,
      "Unknown": 0
    };

    for (const item of items) {
      const info = await stockDataService.getStockInfo(item.ticker);
      const sector = info?.sector || 'Unknown';
      sectorMap[sector] = (sectorMap[sector] || 0) + item.weight;

      // Market Cap Categorization
      if (info?.marketCap) {
        const mc = info.marketCap;
        const curr = info.currency || 'INR';
        
        let category: "Large Cap" | "Mid Cap" | "Small Cap" = "Small Cap";
        if (curr === 'INR') {
          if (mc > 500000000000) category = "Large Cap";
          else if (mc > 150000000000) category = "Mid Cap";
        } else { // Assume USD or other
          if (mc > 10000000000) category = "Large Cap";
          else if (mc > 2000000000) category = "Mid Cap";
        }
        marketCapMap[category] += item.weight;
      } else {
        marketCapMap["Unknown"] += item.weight;
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
