export interface Stock {
  ticker: string;
  name: string;
  sector?: string;
  marketCap?: string;
}

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
  aiStrategy?: string;
}

export interface StockAllocation {
  ticker: string;
  amount: number;
  percentage: number;
  signals: any;
  score: number;
  reason?: string;
}

export interface ExcludedStock {
  ticker: string;
  reason: string;
  score?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  portfolio: PortfolioItem[];
  sipAmount: number;
  riskProfile: string;
  horizon: number;
  result: AnalysisResult;
  allocations: any[];
  explanation: string;
}

export interface TopPick {
  ticker: string;
  name: string;
  rationale: string;
  sector: string;
  potential: string;
}
