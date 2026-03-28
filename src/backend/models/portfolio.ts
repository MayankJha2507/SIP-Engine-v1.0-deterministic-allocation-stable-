export interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  allocationPercentage: number;
  targetPercentage: number;
}

export interface Portfolio {
  userId: string;
  stocks: Stock[];
  lastUpdated: Date;
}
