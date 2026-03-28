import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, TrendingUp, Wallet, Settings, ArrowRight, History, ChevronLeft, ChevronRight, ExternalLink, X, BarChart3, AlertTriangle, CheckCircle, Moon, Sun, Trash2, Sparkles, Info } from "lucide-react";
import PortfolioAnalyzer from "./components/PortfolioAnalyzer.tsx";
import { HistoryItem, TopPick } from "./types";
import { geminiService } from "./services/geminiService.ts";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [health, setHealth] = useState<string>("Checking...");
  const [showAnalyzer, setShowAnalyzer] = useState(() => {
    return localStorage.getItem("showAnalyzer") === "true";
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("analysisHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Market Insights State
  const [topPicks, setTopPicks] = useState<TopPick[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);

  useEffect(() => {
    const fetchTopPicks = async () => {
      setLoadingPicks(true);
      try {
        const data = await geminiService.getTopPicks();
        setTopPicks(data);
      } catch (error) {
        console.error("Error fetching top picks:", error);
      } finally {
        setLoadingPicks(false);
      }
    };
    fetchTopPicks();
  }, []);

  useEffect(() => {
    localStorage.setItem("showAnalyzer", showAnalyzer.toString());
  }, [showAnalyzer]);

  useEffect(() => {
    localStorage.setItem("analysisHistory", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth("Error"));
  }, []);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const currentHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearHistory = () => {
    setHistory([]);
    localStorage.setItem("analysisHistory", "[]");
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] font-sans text-[#1a1a1a] dark:text-[#f5f5f5] transition-colors duration-300">
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30 px-6 py-2 text-center">
        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          Not SEBI Registered • Educational Purpose Only • Do Your Due Diligence
        </p>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-[#111] border-b border-[#e5e5e5] dark:border-[#222] px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1a1a1a] dark:bg-[#f5f5f5] rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white dark:text-[#1a1a1a] w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">SIPSense</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-full transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-500" />}
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${health === "ok" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
            {health}
          </span>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-full transition-colors">
            <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Get Started Section at the Top */}
        {!showAnalyzer && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#111] p-12 rounded-[40px] shadow-sm border border-[#e5e5e5] dark:border-[#222] text-center"
          >
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-light tracking-tight mb-6">Welcome to SIPSense</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg leading-relaxed">
                Connect your portfolio or add stocks manually to start receiving deterministic, 
                data-driven SIP allocation advice.
              </p>
              <button 
                onClick={() => setShowAnalyzer(true)}
                className="bg-[#1a1a1a] dark:bg-[#f5f5f5] text-white dark:text-[#1a1a1a] px-12 py-5 rounded-full text-lg font-medium flex items-center gap-3 hover:bg-opacity-90 transition-all group mx-auto"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Main Content */}
          <section className="order-1">
            {showAnalyzer && (
              <PortfolioAnalyzer history={history} setHistory={setHistory} />
            )}
          </section>

          {/* Market Insights Section */}
          {showAnalyzer && (
            <section className="order-2">
              <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] shadow-sm border border-[#e5e5e5] dark:border-[#222]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-light tracking-tight flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-500" /> Market Insights
                  </h2>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Top Picks for 2026
                  </div>
                </div>

                {loadingPicks ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-8 h-8 border-2 border-[#1a1a1a] dark:border-[#f5f5f5] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Analyzing market trends...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topPicks.map((pick) => (
                      <div key={pick.ticker} className="p-6 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-[24px] border border-[#eee] dark:border-[#333] hover:border-amber-200 dark:hover:border-amber-900/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-[#222] rounded-xl flex items-center justify-center border border-[#eee] dark:border-[#333] font-bold text-xs">
                              {pick.ticker}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold">{pick.name}</h4>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{pick.sector}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider ${
                            pick.potential.toLowerCase().includes('bullish') ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            {pick.potential}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
                          {pick.rationale}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <TrendingUp className="w-3 h-3" /> Worth Building Position
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Past Runs Section - Last Screen */}
        {showAnalyzer && (
          <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] shadow-sm border border-[#e5e5e5] dark:border-[#222]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light tracking-tight flex items-center gap-2">
                <History className="w-6 h-6" /> Past Runs
              </h2>
              {history.length > 0 && (
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-12 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-[24px] border border-dashed border-[#eee] dark:border-[#333]">
                <p className="text-gray-400 text-sm">No analysis history yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-6 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-[24px] border border-[#eee] dark:border-[#333] hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer group"
                      onClick={() => setSelectedHistoryItem(item)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">
                            {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-sm font-bold">₹{item.sipAmount.toLocaleString()} SIP</div>
                        </div>
                        <div className="p-2 bg-white dark:bg-[#222] rounded-xl border border-[#eee] dark:border-[#333] group-hover:bg-[#1a1a1a] dark:group-hover:bg-[#f5f5f5] group-hover:text-white dark:group-hover:text-[#1a1a1a] transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-white dark:bg-[#222] rounded-full text-[10px] font-bold border border-[#eee] dark:border-[#333]">{item.riskProfile}</span>
                        <span className="px-3 py-1 bg-white dark:bg-[#222] rounded-full text-[10px] font-bold border border-[#eee] dark:border-[#333]">{item.horizon}Y Horizon</span>
                        <span className="px-3 py-1 bg-white dark:bg-[#222] rounded-full text-[10px] font-bold border border-[#eee] dark:border-[#333]">{item.portfolio.length} Stocks</span>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="p-2 rounded-xl border border-[#eee] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#222] disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold">Page {currentPage} of {totalPages}</span>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-2 rounded-xl border border-[#eee] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#222] disabled:opacity-30 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Side Drawer for History Details */}
      <AnimatePresence>
        {selectedHistoryItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHistoryItem(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-[#111] shadow-2xl z-50 overflow-y-auto p-8 border-l border-[#e5e5e5] dark:border-[#222]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-light tracking-tight">Analysis Details</h2>
                <button 
                  onClick={() => setSelectedHistoryItem(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-[24px] border border-[#eee] dark:border-[#333]">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-4">Run Parameters</div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">SIP Amount</div>
                      <div className="text-sm font-bold">₹{selectedHistoryItem.sipAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Risk Profile</div>
                      <div className="text-sm font-bold">{selectedHistoryItem.riskProfile}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Horizon</div>
                      <div className="text-sm font-bold">{selectedHistoryItem.horizon} Years</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Portfolio Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-[24px] border border-[#eee] dark:border-[#333]">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Diversification</div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        <span className="font-bold">{selectedHistoryItem.result.diversificationScore}</span>
                      </div>
                    </div>
                    <div className="p-6 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-[24px] border border-[#eee] dark:border-[#333]">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Concentration</div>
                      <div className="flex items-center gap-2">
                        {selectedHistoryItem.result.concentrationRisk ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        <span className="font-bold">{selectedHistoryItem.result.concentrationRisk ? "High" : "Optimal"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedHistoryItem.result.marketCapAllocation && (
                    <div className="p-6 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-[24px] border border-[#eee] dark:border-[#333]">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-4">Market Cap Breakdown</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {selectedHistoryItem.result.marketCapAllocation.map(mc => (
                          <div key={mc.category}>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">{mc.category}</div>
                            <div className="text-sm font-bold">{mc.weight}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recommended Allocation</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic">"{selectedHistoryItem.explanation}"</p>
                  <div className="space-y-3">
                    {selectedHistoryItem.allocations && selectedHistoryItem.allocations.map((alloc) => (
                      <div key={alloc.ticker} className="flex items-center justify-between p-4 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-2xl border border-[#eee] dark:border-[#333]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white dark:bg-[#222] rounded-lg flex items-center justify-center border border-[#eee] dark:border-[#333] font-bold text-xs">
                            {alloc.ticker}
                          </div>
                          <div>
                            <div className="text-sm font-bold">₹{alloc.amount.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-400">{alloc.percentage}% of SIP</div>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#222] px-3 py-1 rounded-full border border-[#eee] dark:border-[#333]">
                          {alloc.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Clear History Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#111] w-full max-w-sm p-8 rounded-[40px] shadow-2xl border border-[#eee] dark:border-[#222] text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Clear History?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This will permanently delete all your past analysis runs. This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-2xl border border-[#eee] dark:border-[#333] text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={clearHistory}
                  className="flex-1 px-6 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
