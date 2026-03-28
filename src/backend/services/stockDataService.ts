import YahooFinance from 'yahoo-finance2';

const yahooFinance = new (YahooFinance as any)();

export interface StockInfo {
  ticker: string;
  fullTicker?: string;
  name: string;
  sector: string;
  industry: string;
  marketCap?: number;
  currency?: string;
}

export class StockDataService {
  async getStockInfo(ticker: string): Promise<StockInfo | null> {
    try {
      // Handle Indian stocks if not already suffixed
      let searchTicker = ticker.toUpperCase();
      if (!searchTicker.includes('.') && !['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'].includes(searchTicker)) {
        searchTicker += '.NS'; // Default to NSE
      }

      const result: any = await yahooFinance.quoteSummary(searchTicker, {
        modules: ['assetProfile', 'price', 'summaryDetail']
      });

      if (!result) return null;

      return {
        ticker: ticker.toUpperCase(),
        name: result.price?.longName || result.price?.shortName || ticker,
        sector: result.assetProfile?.sector || 'Unknown',
        industry: result.assetProfile?.industry || 'Unknown',
        marketCap: result.price?.marketCap || result.summaryDetail?.marketCap,
        currency: result.price?.currency || result.summaryDetail?.currency
      };
    } catch (error) {
      console.error(`Error fetching stock info for ${ticker}:`, error);
      return null;
    }
  }

  async searchStocks(query: string): Promise<StockInfo[]> {
    try {
      console.log(`Searching for: ${query}`);
      const results: any = await yahooFinance.search(query, {
        quotesCount: 20,
        newsCount: 0,
      });

      console.log(`Found ${results?.quotes?.length || 0} quotes`);

      // Return all quotes, but prioritize Indian ones if they exist
      return (results?.quotes || [])
        .filter((q: any) => q.symbol)
        .map((q: any) => ({
          ticker: q.symbol.includes('.') ? q.symbol.split('.')[0] : q.symbol,
          fullTicker: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          sector: 'Unknown',
          industry: 'Unknown'
        }));
    } catch (error) {
      console.error(`Error searching stocks for ${query}:`, error);
      return [];
    }
  }
}

export const stockDataService = new StockDataService();
