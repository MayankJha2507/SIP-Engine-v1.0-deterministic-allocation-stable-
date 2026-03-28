export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface StockMetadata {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
}
