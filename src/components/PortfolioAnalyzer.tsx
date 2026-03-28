import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Trash2, AlertTriangle, CheckCircle, Info, BarChart3, Calculator, TrendingUp, Sparkles, ShieldCheck, RotateCcw } from "lucide-react";
import { Stock, PortfolioItem, AnalysisResult, HistoryItem, StockAllocation, ExcludedStock } from "../types";
import { geminiService } from "../services/geminiService.ts";
import { apiService } from "../services/apiService.ts";

const POPULAR_STOCKS: Stock[] = [
  { ticker: "RELIANCE", name: "Reliance Industries Ltd.", sector: "Energy", marketCap: "Large Cap" },
  { ticker: "TCS", name: "Tata Consultancy Services Ltd.", sector: "IT", marketCap: "Large Cap" },
  { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", sector: "Financial Services", marketCap: "Large Cap" },
  { ticker: "INFY", name: "Infosys Ltd.", sector: "IT", marketCap: "Large Cap" },
  { ticker: "ICICIBANK", name: "ICICI Bank Ltd.", sector: "Financial Services", marketCap: "Large Cap" },
  { ticker: "HINDUNILVR", name: "Hindustan Unilever Ltd.", sector: "FMCG", marketCap: "Large Cap" },
  { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd.", sector: "Telecommunication", marketCap: "Large Cap" },
  { ticker: "SBIN", name: "State Bank of India", sector: "Financial Services", marketCap: "Large Cap" },
  { ticker: "ITC", name: "ITC Ltd.", sector: "FMCG", marketCap: "Large Cap" },
  { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd.", sector: "Financial Services", marketCap: "Large Cap" },
  { ticker: "LT", name: "Larsen & Toubro Ltd.", sector: "Construction", marketCap: "Large Cap" },
  { ticker: "AXISBANK", name: "Axis Bank Ltd.", sector: "Financial Services", marketCap: "Large Cap" },
  { ticker: "ASIANPAINT", name: "Asian Paints Ltd.", sector: "Consumer Durables", marketCap: "Large Cap" },
  { ticker: "MARUTI", name: "Maruti Suzuki India Ltd.", sector: "Automobile", marketCap: "Large Cap" },
  { ticker: "TITAN", name: "Titan Company Ltd.", sector: "Consumer Durables", marketCap: "Large Cap" },
  { ticker: "BAJFINANCE", name: "Bajaj Finance Ltd.", sector: "Financial Services", marketCap: "Large Cap" },
  { ticker: "WIPRO", name: "Wipro Ltd.", sector: "IT", marketCap: "Large Cap" },
  { ticker: "ADANIENT", name: "Adani Enterprises Ltd.", sector: "Metals & Mining", marketCap: "Large Cap" },
  { ticker: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd.", sector: "Healthcare", marketCap: "Large Cap" },
  { ticker: "ULTRACEMCO", name: "UltraTech Cement Ltd.", sector: "Construction Materials", marketCap: "Large Cap" }
];

interface PortfolioAnalyzerProps {
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
}

export default function PortfolioAnalyzer({ history, setHistory }: PortfolioAnalyzerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [allocations, setAllocations] = useState<any[] | null>(null);
  const [excluded, setExcluded] = useState<any[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingFact, setLoadingFact] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // SIP Inputs
  const [sipAmount, setSipAmount] = useState<number>(10000);
  const [riskProfile, setRiskProfile] = useState<string>("Medium");
  const [horizon, setHorizon] = useState<number>(5);

  useEffect(() => {
    localStorage.setItem("currentPortfolio", JSON.stringify(portfolio));
    localStorage.setItem("currentResult", JSON.stringify(result));
    localStorage.setItem("currentAllocation", JSON.stringify(allocations));
    localStorage.setItem("currentExplanation", explanation);
    localStorage.setItem("currentSipAmount", sipAmount.toString());
    localStorage.setItem("currentRiskProfile", riskProfile);
    localStorage.setItem("currentHorizon", horizon.toString());
  }, [portfolio, result, allocations, explanation, sipAmount, riskProfile, horizon]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions(POPULAR_STOCKS);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/portfolio/search?query=${encodeURIComponent(searchTerm)}`)
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(err => console.error("Search failed", err));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const reset = () => {
    setPortfolio([]);
    setResult(null);
    setAllocations(null);
    setExcluded([]);
    setExplanation("");
    setSearchTerm("");
  };

  const toggleStock = (stock: Stock) => {
    const exists = portfolio.find(p => p.ticker === stock.ticker);
    if (exists) {
      setPortfolio(portfolio.filter(p => p.ticker !== stock.ticker));
    } else {
      setPortfolio([...portfolio, { ticker: stock.ticker, weight: 0 }]);
    }
    // Removed setShowSuggestions(false) to allow multi-select
  };

  const removeStock = (ticker: string) => {
    setPortfolio(portfolio.filter(p => p.ticker !== ticker));
  };

  const updateWeight = (ticker: string, weight: number) => {
    setPortfolio(portfolio.map(p => p.ticker === ticker ? { ...p, weight } : p));
  };

  const STOCK_FACTS = [
    "The first stock market was established in Amsterdam in 1602.",
    "Apple was the first company to reach a $1 trillion market cap.",
    "The 'Bull' and 'Bear' terms come from how the animals attack.",
    "Warren Buffett bought his first stock at age 11.",
    "The New York Stock Exchange was founded under a buttonwood tree.",
    "The oldest company in the world is Kongō Gumi, founded in 578 AD.",
    "The Indian stock market (BSE) is the oldest in Asia, founded in 1875.",
    "NIFTY 50 represents the weighted average of 50 Indian company stocks.",
    "The word 'Stock' comes from the Old English word for 'tree trunk'.",
    "The most expensive stock in the world is Berkshire Hathaway (Class A)."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingFact(STOCK_FACTS[Math.floor(Math.random() * STOCK_FACTS.length)]);
      interval = setInterval(() => {
        setLoadingFact(STOCK_FACTS[Math.floor(Math.random() * STOCK_FACTS.length)]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const analyze = async () => {
    setLoading(true);
    try {
      // 1. Call backend for deterministic calculation and analysis
      // AI signals are now handled internally by the backend
      const data = await apiService.analyze({ 
        portfolio,
        sip_amount: sipAmount,
        risk_profile: riskProfile,
        horizon: `${horizon} years`
      });

      setResult(data.analysis);
      setAllocations(data.allocations);
      setExcluded(data.excluded || []);
      setExplanation(data.explanation);

      // Save to history
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        portfolio: [...portfolio],
        sipAmount,
        riskProfile,
        horizon,
        result: data.analysis,
        allocations: data.allocations,
        explanation: data.explanation
      };
      setHistory([newHistoryItem, ...history]);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = portfolio.reduce((sum, p) => sum + p.weight, 0);
  const isOverweighted = totalWeight > 100;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Add Stocks */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111] p-8 rounded-[32px] shadow-sm border border-[#e5e5e5] dark:border-[#222]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-light tracking-tight flex items-center gap-2">
              Add Stocks to Portfolio
            </h2>
            <button 
              onClick={reset}
              className="text-[10px] font-bold text-gray-400 hover:text-[#1a1a1a] dark:hover:text-[#f5f5f5] uppercase tracking-widest flex items-center gap-1 transition-all"
            >
              <RotateCcw className="w-3 h-3" /> New Run
            </button>
          </div>
          
          <div className="relative mb-8" ref={suggestionsRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search Indian stocks (e.g. RELIANCE, TCS...)"
                className="w-full pl-12 pr-4 py-4 bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#eee] dark:border-[#333] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-[#f5f5f5] transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
            </div>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-[#111] border border-[#eee] dark:border-[#333] rounded-2xl shadow-xl overflow-hidden flex flex-col"
                >
                  <div className="p-2 border-b border-[#eee] dark:border-[#333] bg-gray-50 dark:bg-[#1a1a1a] text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 flex justify-between items-center">
                    <span>{searchTerm.trim() === "" ? "Popular Indian Stocks" : "Search Results"}</span>
                    <span className="text-[8px] normal-case font-normal italic">Select multiple stocks</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {suggestions.map((stock) => {
                      const isSelected = portfolio.some(p => p.ticker === stock.ticker);
                      return (
                        <div
                          key={stock.ticker}
                          className="flex items-center justify-between px-4 py-3 hover:bg-[#f9f9f9] dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer border-b border-[#f5f5f5] dark:border-[#222] last:border-0"
                          onClick={() => toggleStock(stock)}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{stock.ticker}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[200px]">{stock.name}</span>
                          </div>
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? "bg-[#1a1a1a] dark:bg-[#f5f5f5] border-[#1a1a1a] dark:border-[#f5f5f5]" : "border-[#eee] dark:border-[#333]"}`}>
                            {isSelected && <CheckCircle className="w-4 h-4 text-white dark:text-[#1a1a1a]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-[#1a1a1a] border-t border-[#eee] dark:border-[#333] flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearchTerm("");
                      }}
                      className="px-4 py-2 text-xs font-bold bg-[#1a1a1a] dark:bg-[#f5f5f5] text-white dark:text-[#1a1a1a] rounded-xl hover:opacity-90 transition-all"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {portfolio.map((item) => {
              const isExcluded = excluded.find(e => e.ticker === item.ticker);
              const alloc = allocations?.find(a => a.ticker === item.ticker);
              const hasRedFlag = isExcluded || (alloc?.score < 4);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={item.ticker}
                  className={`flex items-center gap-4 p-4 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-2xl border transition-colors ${
                    hasRedFlag ? "border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/5" : "border-[#eee] dark:border-[#333]"
                  }`}
                >
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold text-sm">{item.ticker}</span>
                    {hasRedFlag && (
                      <div className="group relative">
                        <AlertTriangle className="w-4 h-4 text-red-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-red-600 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                          {isExcluded?.reason || "Low momentum or high concentration risk detected for this cycle."}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Weight %"
                      className="w-24 px-3 py-2 bg-white dark:bg-[#222] border border-[#eee] dark:border-[#333] rounded-xl text-sm focus:outline-none"
                      value={item.weight || ""}
                      onChange={(e) => updateWeight(item.ticker, parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                  <button
                    onClick={() => removeStock(item.ticker)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
            
            {portfolio.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-[#222] rounded-[32px]">
                <p className="text-gray-400 text-sm">Your portfolio is empty. Add some stocks to begin.</p>
              </div>
            )}
          </div>

          {portfolio.length > 0 && (
            <div className="mt-12 space-y-8 pt-8 border-t border-[#f5f5f5] dark:border-[#222]">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calculator className="w-5 h-5" /> SIP Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* SIP Amount */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly SIP Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-4 py-3 bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#eee] dark:border-[#333] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-[#f5f5f5]"
                      value={sipAmount}
                      onChange={(e) => setSipAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Risk Profile */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Risk Profile</label>
                  <div className="flex bg-[#f9f9f9] dark:bg-[#1a1a1a] p-1 rounded-2xl border border-[#eee] dark:border-[#333]">
                    {["Low", "Medium", "High"].map((profile) => (
                      <button
                        key={profile}
                        onClick={() => setRiskProfile(profile)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                          riskProfile === profile 
                            ? "bg-white dark:bg-[#222] text-[#1a1a1a] dark:text-[#f5f5f5] shadow-sm" 
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {profile}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horizon */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Horizon: {horizon}y</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    className="w-full accent-[#1a1a1a] dark:accent-[#f5f5f5]"
                    value={horizon}
                    onChange={(e) => setHorizon(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Total Weight:</span>
                  <span className={`font-bold ${totalWeight === 100 ? "text-green-600" : isOverweighted ? "text-red-500" : "text-orange-500"}`}>
                    {totalWeight}%
                  </span>
                  {totalWeight !== 100 && (
                    <Info className={`w-4 h-4 ${isOverweighted ? "text-red-400" : "text-orange-400"}`} title={isOverweighted ? "Total weight cannot exceed 100%" : "Total weight should ideally be 100%"} />
                  )}
                </div>
                <button
                  onClick={analyze}
                  disabled={loading || portfolio.length === 0 || isOverweighted}
                  className="w-full sm:w-auto bg-[#1a1a1a] dark:bg-[#f5f5f5] text-white dark:text-[#1a1a1a] px-10 py-4 rounded-full font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  <span>Run Full Analysis</span>
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
              
              <AnimatePresence>
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white dark:bg-[#111] w-full max-w-md p-8 rounded-[40px] shadow-2xl border border-[#eee] dark:border-[#222] text-center space-y-6"
                    >
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-[#eee] dark:border-[#222] rounded-full" />
                        <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold tracking-tight">Analyzing Your Portfolio</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Our AI is crunching the numbers and market trends...</p>
                      </div>

                      <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Info className="w-12 h-12" />
                        </div>
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Did you know?</p>
                        <p className="text-sm text-amber-900 dark:text-amber-100 italic font-medium leading-relaxed">"{loadingFact}"</p>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex justify-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              {isOverweighted && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter text-right">
                  Error: Total weight exceeds 100%. Please adjust weights.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Health & Alerts */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="health-metrics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Portfolio Health */}
                <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] shadow-sm border border-[#e5e5e5] dark:border-[#222]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Portfolio Health</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      result.diversificationScore === "Good" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      result.diversificationScore === "Moderate" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {result.diversificationScore}
                    </span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-2xl group relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-5 h-5 ${result.concentrationRisk ? "text-red-500" : "text-gray-400"}`} />
                          <span className="text-sm font-medium">Concentration Risk</span>
                        </div>
                        <span className={`text-sm font-bold ${result.concentrationRisk ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {result.concentrationRisk ? "High Risk" : "Well Balanced"}
                        </span>
                      </div>
                      
                      {result.concentrationRisk && (
                        <p className="text-[10px] text-red-500/80 leading-tight mt-1">
                          High risk detected because your top 2 holdings exceed 50% of the total portfolio weight.
                        </p>
                      )}
                    </div>

                    {result.marketCapAllocation && result.marketCapAllocation.length > 0 && (
                      <div className="p-4 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-2xl">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Market Cap Breakdown</div>
                        <div className="space-y-3">
                          {result.marketCapAllocation.map((item) => (
                            <div key={item.category}>
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="font-bold">{item.category}</span>
                                <span>{item.weight}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-[#333] rounded-full h-1">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.weight}%` }}
                                  className={`h-1 rounded-full ${
                                    item.category === "Large Cap" ? "bg-green-500" :
                                    item.category === "Mid Cap" ? "bg-blue-500" :
                                    item.category === "Small Cap" ? "bg-orange-500" : "bg-gray-400"
                                  }`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sector Allocation Integrated into Health */}
                    {result.sectorAllocation && result.sectorAllocation.length > 0 && (
                      <div className="p-4 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-2xl">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Sector Exposure</div>
                        <div className="grid grid-cols-2 gap-3">
                          {result.sectorAllocation.slice(0, 4).map((item) => (
                            <div key={item.sector} className="space-y-1">
                              <div className="flex justify-between text-[9px]">
                                <span className="font-bold truncate max-w-[80px]">{item.sector}</span>
                                <span>{item.weight}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-[#333] rounded-full h-1">
                                <div 
                                  style={{ width: `${item.weight}%` }}
                                  className="bg-[#1a1a1a] dark:bg-[#f5f5f5] h-1 rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weight Alerts */}
                <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] shadow-sm border border-[#e5e5e5] dark:border-[#222]">
                  <h3 className="text-lg font-medium mb-6">Weight Alerts</h3>
                  <div className="space-y-4">
                    {result.overweight && result.overweight.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-2 mb-2 text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4" /> Overweight ({">"}8%)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.overweight.map(t => (
                            <span key={t} className="bg-white dark:bg-[#222] px-3 py-1 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900/30">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.underweight && result.underweight.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                          <Info className="w-4 h-4" /> Underweight ({"<"}8%)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.underweight.map(t => (
                            <span key={t} className="bg-white dark:bg-[#222] px-3 py-1 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-900/30">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!result.overweight || result.overweight.length === 0) && (!result.underweight || result.underweight.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                        <p className="text-sm text-gray-500">All positions are within optimal ranges.</p>
                      </div>
                    )}

                    {/* Macro Outlook Section */}
                    {result.aiStrategy && (
                      <div className="p-4 bg-amber-50/30 dark:bg-amber-900/5 rounded-2xl border border-amber-100/50 dark:border-amber-900/20">
                        <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase tracking-widest">
                          <Sparkles className="w-3 h-3" /> Macro Outlook & Strategy
                        </div>
                        <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed italic">
                          "{result.aiStrategy}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-health"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-[#111] p-8 rounded-[32px] shadow-sm border border-[#e5e5e5] dark:border-[#222] flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <BarChart3 className="w-12 h-12 text-gray-100 dark:text-[#222] mb-4" />
                <h3 className="text-lg font-medium mb-2">Portfolio Health</h3>
                <p className="text-xs text-gray-400 max-w-[200px]">Add stocks and run analysis to see diversification and risk metrics here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Recommended SIP Allocation */}
            {allocations && (
              <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] shadow-sm border border-[#e5e5e5] dark:border-[#222]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-lg font-medium mb-1">Recommended SIP Allocation</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₹{sipAmount.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Monthly SIP</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {allocations.map((alloc) => (
                    <div key={alloc.ticker} className="group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-[28px] border border-[#eee] dark:border-[#333] group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white dark:bg-[#222] rounded-2xl flex items-center justify-center border border-[#eee] dark:border-[#333] font-bold text-sm shadow-sm">
                            {alloc.ticker}
                          </div>
                          <div>
                            <div className="text-lg font-bold">₹{alloc.amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-400 font-medium">{alloc.percentage}% of Monthly SIP</div>
                          </div>
                        </div>

                        {alloc.signals && (
                          <div className="flex gap-4">
                            <div className="text-center">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Trend</div>
                              <div className={`text-[10px] font-bold uppercase ${alloc.signals.trend === "positive" ? "text-green-500" : alloc.signals.trend === "flat" ? "text-blue-500" : "text-red-500"}`}>
                                {alloc.signals.trend}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Volatility</div>
                              <div className={`text-[10px] font-bold uppercase ${alloc.signals.volatility === "low" ? "text-green-500" : alloc.signals.volatility === "medium" ? "text-blue-500" : "text-red-500"}`}>
                                {alloc.signals.volatility}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Cap</div>
                              <div className="text-[10px] font-bold uppercase text-gray-600 dark:text-gray-300">
                                {alloc.signals.marketCap}
                              </div>
                            </div>
                            <div className="text-center border-l border-[#eee] dark:border-[#333] pl-4">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Score</div>
                              <div className="text-xs font-bold text-[#1a1a1a] dark:text-[#f5f5f5]">
                                {alloc.score}/10
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start gap-3 p-4 bg-amber-50/30 dark:bg-amber-900/5 rounded-2xl border border-amber-100/50 dark:border-amber-900/20">
                            <div className="mt-0.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Why this stock?</div>
                              <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                                {alloc.reason || "Selected for its strong momentum and stability within your risk profile."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {excluded.length > 0 && (
                  <div className="mt-12">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Stocks Excluded from this SIP Cycle
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {excluded.map((e: any) => (
                        <div key={e.ticker} className="p-4 bg-red-50/30 dark:bg-red-900/5 rounded-2xl border border-red-100 dark:border-red-900/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-red-700 dark:text-red-400">{e.ticker}</span>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-red-600/70 dark:text-red-400/70 italic truncate max-w-[150px]">{e.reason}</span>
                              {e.score !== undefined && (
                                <span className="text-[9px] font-bold text-red-500/60 uppercase tracking-wider">Score: {e.score}/10</span>
                              )}
                            </div>
                          </div>
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {explanation && (
                  <div className="mt-10 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-[28px] border border-blue-100 dark:border-blue-900/30">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-1 uppercase tracking-wider">Allocation Strategy & Risk Mitigation</h4>
                        <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                          {explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
