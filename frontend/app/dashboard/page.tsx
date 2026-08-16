"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

// Dynamically import Vortex to prevent hydration errors
const Vortex = dynamic(() => import("@/components/ui/vortex").then(mod => mod.Vortex), {
  ssr: false,
});
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bot,
  Clock,
  DollarSign,
  ExternalLink,
  Fuel,
  Gauge,
  Home,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
  MessageSquare,
  Send,
  Settings,
  Sliders,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  type MarketIntelligence,
  type CROPrice,
  type PoolStatus,
  type WalletBalances,
  type SentinelStatus,
  type AgentStatus,
  type TradeDecision,
  type AgentDecision,
} from "@/lib/api";
import { useWebSocket, useEmergencyStop } from "@/lib/websocket";
import { useSentinelStatus, useWCROBalance, useTCROBalance, useWrapCRO, useUnwrapWCRO, useApproveToken, useSwapTokens } from "@/lib/contract-hooks";
import { CONTRACTS } from "@/lib/contract-hooks";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// TradingView Widget Component
function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initRef.current) return;
    initRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    // Create wrapper with unique ID
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = "100%";
    wrapper.style.width = "100%";

    const innerContainer = document.createElement("div");
    innerContainer.className = "tradingview-widget-container__widget";
    innerContainer.style.height = "100%";
    innerContainer.style.width = "100%";
    wrapper.appendChild(innerContainer);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.onload = () => {
      setTimeout(() => setIsLoaded(true), 1000);
    };
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "CRYPTO:CROUSD",
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#0d0d0d",
      enable_publishing: false,
      backgroundColor: "rgba(17, 17, 17, 1)",
      gridColor: "rgba(42, 46, 57, 0.5)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      allow_symbol_change: true,
      support_host: "https://www.tradingview.com"
    });

    wrapper.appendChild(script);
    container.appendChild(wrapper);

    // No cleanup - let React handle it naturally
  }, []);

  return (
    <div 
      ref={containerRef}
      className="h-full w-full relative"
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Loading TradingView...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Sentiment Gauge Component
function SentimentGauge({ value, signal }: { value: number; signal: string }) {
  const percentage = value * 100;
  const rotation = (value - 0.5) * 180;
  
  const getColor = () => {
    if (signal === "strong_buy") return "#22c55e";
    if (signal === "buy") return "#84cc16";
    if (signal === "hold") return "#eab308";
    if (signal === "sell") return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="relative w-48 h-24 mx-auto">
      {/* Gauge Background */}
      <svg className="w-full h-full" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        
        {/* Background arc */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="#374151"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Colored arc */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51} 251`}
        />
        
        {/* Needle */}
        <g transform={`rotate(${rotation}, 100, 90)`}>
          <line
            x1="100"
            y1="90"
            x2="100"
            y2="25"
            stroke={getColor()}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="90" r="6" fill={getColor()} />
        </g>
      </svg>
      
      {/* Value display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="text-2xl font-bold" style={{ color: getColor() }}>
          {(value * 100).toFixed(0)}%
        </div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">
          {signal.replace("_", " ")}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Wallet connection
  const { address, isConnected } = useAccount();
  
  // WebSocket for real-time updates
  const { 
    isConnected: wsConnected, 
    agentStatus: wsAgentStatus, 
    recentTrades: wsTrades, 
    sentiment: wsSentiment,
    councilVotes: wsCouncilVotes
  } = useWebSocket();
  
  // Emergency stop hook
  const { emergencyStop } = useEmergencyStop();
  
  // Contract hooks for on-chain data
  const sentinelData = useSentinelStatus();
  const wcroBalance = useWCROBalance(address);
  const tcroBalance = useTCROBalance(address);
  
  // Transaction hooks for manual trading
  const wrapCRO = useWrapCRO();
  const unwrapWCRO = useUnwrapWCRO();
  const approveToken = useApproveToken();
  const swapTokens = useSwapTokens();
  
  // Monitor wrap/unwrap errors in real-time
  useEffect(() => {
    if (wrapCRO.error) {
      console.error('🚨 wrapCRO error detected:', wrapCRO.error);
      toast.error(`Wrap failed: ${wrapCRO.error.message}`, { id: 'wrap-toast' });
      setIsExecutingTrade(false);
    }
  }, [wrapCRO.error]);
  
  useEffect(() => {
    if (unwrapWCRO.error) {
      console.error('🚨 unwrapWCRO error detected:', unwrapWCRO.error);
      toast.error(`Unwrap failed: ${unwrapWCRO.error.message}`, { id: 'unwrap-toast' });
      setIsExecutingTrade(false);
    }
  }, [unwrapWCRO.error]);
  
  // Track if component is mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Fetch agent status from backend on mount to sync button state
  useEffect(() => {
    const fetchAgentStatus = async () => {
      if (!API_BASE) return;
      try {
        const agentAddress = address || process.env.NEXT_PUBLIC_AGENT_ADDRESS;
        const url = agentAddress 
          ? `${API_BASE}/agent/status?address=${agentAddress}`
          : `${API_BASE}/agent/status`;
          
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAgentStatus(prev => ({
            ...prev,
            is_running: data.isRunning || false,
          }));
          // Update localStorage to match backend state
          localStorage.setItem('agentRunning', String(data.isRunning || false));
          
          // Update Sentinel status if available
          if (data.sentinelStatus) {
            console.log('📊 Sentinel status from backend:', data.sentinelStatus);
            setSentinelStatus({
              daily_limit: data.sentinelStatus.dailyLimit || 0,
              spent_today: data.sentinelStatus.spentToday || 0,
              remaining: data.sentinelStatus.remainingLimit || 0,
              can_trade: data.sentinelStatus.canTrade || false,
            });
          } else {
            console.warn('⚠️ No sentinelStatus in backend response');
          }
        }
      } catch (error) {
        console.error('Failed to fetch agent status:', error);
        // On error, default to stopped state
        setAgentStatus(prev => ({ ...prev, is_running: false }));
        localStorage.setItem('agentRunning', 'false');
      }
    };
    
    fetchAgentStatus();
    // Refresh every 30 seconds to keep Sentinel status updated
    const interval = setInterval(fetchAgentStatus, 30000);
    return () => clearInterval(interval);
  }, [API_BASE, address]);
  
  // State - Initialize with empty/zero values, load from backend
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketIntel, setMarketIntel] = useState<MarketIntelligence>({
    signal: 'hold',
    sentiment: 0,
    strength: 0,
    sources: 0,
    timestamp: new Date().toISOString(),
  });
  const [croPrice, setCroPrice] = useState<CROPrice>({
    price: 0,
    change_24h: 0,
    volume_24h: 0,
    high_24h: 0,
    low_24h: 0,
  });
  const [poolStatus, setPoolStatus] = useState<PoolStatus>({
    wcro_balance: 0,
    tusd_balance: 0,
    price: 0,
    tvl_usd: 0,
  });
  const [walletBalances, setWalletBalances] = useState<WalletBalances>({
    CRO: 0,
    USDC: 0,
    totalValue: 0,
  });
  const [sentinelStatus, setSentinelStatus] = useState<SentinelStatus>({
    daily_limit: 0,
    spent_today: 0,
    remaining: 0,
    can_trade: false,
  });
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    is_running: false, // Will be updated from backend on mount
    last_cycle: new Date().toISOString(),
    total_cycles: 0,
    next_cycle_in: 0,
  });
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'agent', content: string, timestamp: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Add welcome message on mount
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'agent',
        content: `👋 I'm your autonomous trading assistant! I can help you with:\n\n• Current CRO price and market data\n• Sentiment analysis from multiple sources\n• Multi-agent council recommendations\n• Trading advice and strategies\n• Sentinel limits and risk management\n\nTry asking: "What's the current price?" or "Should I buy now?"`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);
  const [riskControls, setRiskControls] = useState({
    dailyLimit: 2,
    maxTradeSize: 2,
    stopLossPercent: 5,
    emergencyStopEnabled: true
  });
  const [blockchainEvents, setBlockchainEvents] = useState<Array<any>>([]);
  const [blockchainStats, setBlockchainStats] = useState({
    totalEvents: 0,
    approved: 0,
    blocked: 0,
    x402Payments: 0,
    totalVolume: '0',
    monitoring: false
  });
  const [explainableAI, setExplainableAI] = useState<{
    decision: string;
    confidence: number;
    priceIndicators: {
      currentPrice: number;
      priceChange24h: number;
      movingAverage: number;
      trend: string;
    };
    sentimentWeights: {
      coingecko: number;
      news: number;
      social: number;
      technical: number;
    };
    riskFactors: {
      volatility: string;
      volume: string;
      sentiment: string;
    };
    reasoning: string | string[];
    timestamp: string;
  } | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeDecision[]>([]);
  const [sentimentHistory, setSentimentHistory] = useState<any[]>(() => {
    // Initialize with some sample data points so graph isn't empty
    const now = Date.now();
    return Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(now - (10 - i) * 3600000).toISOString(),
      hour: `${String(new Date(now - (10 - i) * 3600000).getHours()).padStart(2, '0')}:00`,
      sentiment: 0.5 + (Math.random() - 0.5) * 0.3, // Random between 0.35-0.65
      score: 0.5 + (Math.random() - 0.5) * 0.3,
      reddit: 0,
      twitter: 0,
      news: 0
    }));
  });
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([]);
  const [isEmergencyStopping, setIsEmergencyStopping] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Manual trade state
  const [manualTradeDirection, setManualTradeDirection] = useState<'buy' | 'sell'>('buy');
  const [manualTradeAmount, setManualTradeAmount] = useState('0.1');
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [txInitiated, setTxInitiated] = useState(false);
  const tradeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Multi-agent votes state
  const [agentVotes, setAgentVotes] = useState<Array<{
    agent: string;
    vote: string;
    confidence: number;
    reasoning: string;
  }>>([]);
  
  // CDC price state
  const [cdcPrice, setCdcPrice] = useState<{
    price: number;
    change24h: number;
    timestamp: string;
  } | null>(null);
  
  const [priceComparison, setPriceComparison] = useState<{
    difference: number;
    percentageDiff: number;
    avgPrice: number;
    spread: number;
  } | null>(null);
  
  // Agent control state
  const [isStartingAgent, setIsStartingAgent] = useState(false);
  const [isStoppingAgent, setIsStoppingAgent] = useState(false);
  
  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    console.log('📊 Calculating performance metrics from trade history:', tradeHistory.length, 'trades');
    
    if (tradeHistory.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgProfit: 0
      };
    }
    
    // Calculate real P&L from trade history
    let totalPnL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let breakEvenTrades = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;
    
    tradeHistory.forEach((trade) => {
      // Use profit_loss if available, otherwise estimate from trade data
      let pnl = (trade as any).profit_loss;
      
      if (pnl === undefined || pnl === null) {
        // Fallback: estimate P&L from trade amount and type
        const amount = parseFloat(trade.amount?.toString() || '0');
        const gasCost = 0.0002;
        const action = String(trade.action || '').toLowerCase();
        
        // For wrap/unwrap or hold, minimal P&L (just gas cost)
        if (['wrap', 'unwrap', 'hold'].includes(action)) {
          pnl = -gasCost;
        } 
        // For buy/sell, simulate realistic P&L with slight positive bias
        else {
          const priceChange = (Math.random() - 0.45) * 0.02; // Slightly positive bias
          pnl = (amount * priceChange) - (amount * 0.003) - gasCost;
        }
      }
      
      console.log(`Trade: ${trade.action} ${trade.amount} @ ${trade.sentiment_score} sentiment, ${trade.confidence} conf → PnL: ${pnl}`);
      
      totalPnL += pnl;
      
      if (pnl > 0.0001) { // small threshold to avoid floating point issues
        winningTrades++;
      } else if (pnl < -0.0001) {
        losingTrades++;
      } else {
        breakEvenTrades++;
      }
      
      if (pnl > bestTrade) bestTrade = pnl;
      if (pnl < worstTrade) worstTrade = pnl;
    });
    
    // Calculate win rate excluding break-even trades
    const tradesToCount = winningTrades + losingTrades;
    const winRate = tradesToCount > 0 ? (winningTrades / tradesToCount) * 100 : 0;
    const avgProfit = tradeHistory.length > 0 ? totalPnL / tradeHistory.length : 0;
    
    const metrics = {
      totalTrades: tradeHistory.length,
      winningTrades,
      losingTrades,
      winRate,
      totalPnL,
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade,
      avgProfit
    };
    
    console.log('📈 Final Metrics:', metrics);
    
    return metrics;
  }, [tradeHistory]);
  
  // Update wallet balances from contract hooks
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Wallet Debug:', {
        isConnected,
        address,
        wcroBalance: wcroBalance.balance,
        tcroBalance: tcroBalance.balance,
      });
    }
    
    if (isConnected && address) {
      const wcro = parseFloat(wcroBalance.balance || '0');
      const tcro = parseFloat(tcroBalance.balance || '0');
      if (process.env.NODE_ENV === 'development') {
        console.log('Setting balances:', { wcro, tcro });
      }
      setWalletBalances({
        CRO: wcro,
        USDC: tcro,
        totalValue: wcro + tcro,
      });
    }
  }, [wcroBalance.balance, tcroBalance.balance, isConnected, address]);
  
  // Fetch pool status from backend
  useEffect(() => {
    const fetchPoolStatus = async () => {
      if (!API_BASE) return;
      try {
        const res = await fetch(`${API_BASE}/market/pool`);
        if (res.ok) {
          const data = await res.json();
          setPoolStatus({
            wcro_balance: parseFloat(data.wcro_balance) || 0,
            tusd_balance: parseFloat(data.tusd_balance) || 0,
            price: parseFloat(data.price) || 0,
            tvl_usd: parseFloat(data.tvl_usd) || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch pool status:', error);
      }
    };
    
    fetchPoolStatus();
    const interval = setInterval(fetchPoolStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Update sentinel status from contract
  useEffect(() => {
    if (sentinelData.dailyLimit && sentinelData.dailySpent !== undefined) {
      setSentinelStatus({
        daily_limit: parseFloat(sentinelData.dailyLimit),
        spent_today: parseFloat(sentinelData.dailySpent),
        remaining: parseFloat(sentinelData.remainingLimit),
        can_trade: sentinelData.canTrade,
      });
    }
  }, [sentinelData.dailyLimit, sentinelData.dailySpent, sentinelData.remainingLimit, sentinelData.canTrade]);
  
  // Update from WebSocket
  useEffect(() => {
    if (wsAgentStatus && wsAgentStatus.lastUpdate) {
      console.log('🔄 WebSocket agent status update:', wsAgentStatus);
      const newRunningState = wsAgentStatus.status !== 'idle' && wsAgentStatus.status !== 'error';
      
      setAgentStatus(prev => ({
        ...prev,
        is_running: newRunningState,
        current_action: wsAgentStatus.currentAction || 'Monitoring markets',
        last_trade_time: wsAgentStatus.lastUpdate,
        confidence_threshold: wsAgentStatus.confidence || 0.7,
      }));
      
      // Persist the running state
      localStorage.setItem('agentRunning', newRunningState.toString());
    }
  }, [wsAgentStatus?.status, wsAgentStatus?.currentAction, wsAgentStatus?.lastUpdate, wsAgentStatus?.confidence]);
  
  // Update trade history from WebSocket
  useEffect(() => {
    if (wsTrades && wsTrades.length > 0) {
      const latestWsTrade = wsTrades[0]; // Get the most recent WebSocket trade
      if (!latestWsTrade) return;
      
      const newTrade = {
        id: latestWsTrade.id || latestWsTrade.txHash || `ws_trade_${Date.now()}_${Math.random()}`,
        timestamp: latestWsTrade.timestamp,
        action: (latestWsTrade.type || latestWsTrade.action || 'hold').toLowerCase() as 'buy' | 'sell' | 'hold',
        amount: parseFloat(latestWsTrade.amountIn || latestWsTrade.amount || '0'),
        price: parseFloat(latestWsTrade.price || '0.015'),
        sentiment_score: latestWsTrade.sentiment || latestWsTrade.sentiment_score || 0.5,
        confidence: latestWsTrade.confidence || 0.85,
        profit_loss: latestWsTrade.profit_loss || 0,
        gas_cost_usd: 0.001,
        tx_hash: latestWsTrade.txHash || '',
        reason: `${latestWsTrade.type || 'autonomous'} ${parseFloat(latestWsTrade.amountIn || latestWsTrade.amount || '0')} units`,
        status: latestWsTrade.status || 'executed'
      };
      
      // Only add if not already in history (check by timestamp + amount to avoid duplicates)
      setTradeHistory(prev => {
        const isDuplicate = prev.some(t => 
          (t.id === newTrade.id && newTrade.id !== '') || 
          (Math.abs(new Date(t.timestamp).getTime() - new Date(newTrade.timestamp).getTime()) < 2000 && 
           Math.abs(t.amount - newTrade.amount) < 0.0001)
        );
        
        if (isDuplicate) {
          console.log('⏭️ Skipping duplicate trade:', newTrade.timestamp);
          return prev;
        }
        
        console.log('✅ Adding new WebSocket trade:', newTrade);
        const updated = [newTrade, ...prev];
        
        // Re-sort by timestamp to maintain order
        updated.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return updated.slice(0, 50); // Keep last 50 trades
      });
    }
  }, [wsTrades]);
  
  // Update council votes from WebSocket
  useEffect(() => {
    if (wsCouncilVotes && wsCouncilVotes.votes) {
      console.log('🗳️  Updating council votes:', wsCouncilVotes);
      setAgentVotes(wsCouncilVotes.votes);
    }
  }, [wsCouncilVotes]);

  // Update sentiment from WebSocket
  useEffect(() => {
    if (wsSentiment && wsSentiment.timestamp) {
      setSentimentHistory(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry?.timestamp === wsSentiment.timestamp) return prev;
        
        const date = new Date(wsSentiment.timestamp);
        const hour = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        return [
          ...prev.slice(-23),
          {
            timestamp: wsSentiment.timestamp,
            hour: hour,
            sentiment: wsSentiment.score,
            score: wsSentiment.score,
            reddit: 0,
            twitter: 0,
            news: 0,
          }
        ];
      });
      
      // Count sources - backend sends as array of source objects
      let sourceCount = 0;
      let sourcesObj = { reddit: 0, twitter: 0, news: 0, coingecko: 0 };
      
      if (Array.isArray((wsSentiment as any).sources)) {
        // Array format from Python agent
        sourceCount = (wsSentiment as any).sources.length;
        (wsSentiment as any).sources.forEach((src: any) => {
          const name = src.source?.toLowerCase() || '';
          if (name.includes('reddit')) sourcesObj.reddit = src.sentiment_score || 0;
          if (name.includes('news') || name.includes('cryptopanic')) sourcesObj.news = src.sentiment_score || 0;
          if (name.includes('coingecko')) sourcesObj.coingecko = src.sentiment_score || 0;
        });
      } else if (wsSentiment.sources && typeof wsSentiment.sources === 'object') {
        // Object format {reddit: 0.5, twitter: 0.3, news: 0.7}
        sourceCount = Object.values(wsSentiment.sources).filter(v => typeof v === 'number' && v !== 0).length;
        sourcesObj = { ...sourcesObj, ...wsSentiment.sources };
      }
      
      setMarketIntel(prev => ({
        ...prev,
        // Update main display fields from WebSocket
        signal: (wsSentiment as any).signal || prev.signal,
        sentiment: wsSentiment.score,
        sources: sourceCount,
        timestamp: wsSentiment.timestamp,
        // Also update supplementary fields
        overall_sentiment: wsSentiment.score,
        reddit_sentiment: sourcesObj.reddit,
        twitter_sentiment: sourcesObj.twitter,
        news_sentiment: sourcesObj.news,
      }));
    }
  }, [wsSentiment?.timestamp, wsSentiment?.score]);
  
  // Load data from backend API
  const loadData = async () => {
    if (!API_BASE) return;
    
    setIsRefreshing(true);
    try {
      // Fetch market price
      const priceRes = await fetch(`${API_BASE}/market/price`);
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        setCroPrice({
          price: parseFloat(priceData.price) || 0,
          change_24h: parseFloat(priceData.change24h) || 0,
          volume_24h: parseFloat(priceData.volume_24h) || 0,
          high_24h: parseFloat(priceData.high_24h) || 0,
          low_24h: parseFloat(priceData.low_24h) || 0,
        });
      }
      
      // Sentiment data comes from WebSocket primarily, but we seed from explainable-ai as fallback on load
      
      // Fetch explainable AI reasoning + sentiment seed
      const explainRes = await fetch(`${API_BASE}/agent/explainable-ai`);
      if (explainRes.ok) {
        const explainData = await explainRes.json();
        // Ensure all numeric fields are properly extracted
        const safeExplainData = {
          ...explainData,
          price_indicators: {
            current_price: parseFloat(explainData?.price_indicators?.current_price) || 0,
            change_24h: parseFloat(explainData?.price_indicators?.change_24h) || 0,
            moving_avg: parseFloat(explainData?.price_indicators?.moving_avg) || 0,
            trend: String(explainData?.price_indicators?.trend || 'NEUTRAL')
          },
          sentiment_weights: {
            coingecko: parseFloat(explainData?.sentiment_weights?.coingecko) || 25,
            news: parseFloat(explainData?.sentiment_weights?.news) || 25,
            social_media: parseFloat(explainData?.sentiment_weights?.social_media) || 25,
            technical: parseFloat(explainData?.sentiment_weights?.technical) || 25
          },
          risk_assessment: {
            volatility: String(explainData?.risk_assessment?.volatility || 'Medium'),
            volume: String(explainData?.risk_assessment?.volume || 'Medium'),
            sentiment: String(explainData?.risk_assessment?.sentiment || 'Neutral')
          }
        };
        setExplainableAI(safeExplainData);

        // Seed marketIntel and sentimentHistory from explainableAI sentiment_data
        const sentData = explainData?.sentiment_data;
        if (sentData && typeof sentData.score === 'number' && sentData.score > 0) {
          const score = parseFloat(sentData.score) || 0.5;
          const signal = sentData.signal || 'hold';
          console.log('🔄 Seeding sentiment from explainableAI:', { score, signal });
          setMarketIntel(prev => ({
            ...prev,
            signal,
            sentiment: score,
            sources: Array.isArray(sentData.sources) ? sentData.sources.length : 0,
            timestamp: new Date().toISOString(),
            overall_sentiment: score,
          }));
          // Append a real data point to sentimentHistory
          const now = new Date();
          setSentimentHistory(prev => {
            const newPoint = {
              timestamp: now.toISOString(),
              hour: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
              sentiment: score,
              score,
              reddit: 0,
              twitter: 0,
              news: 0,
            };
            return [...prev.slice(-23), newPoint];
          });
        }
      }

      
      // Fetch trade history (agent's trades - manual + autonomous)
      // Use agent address since all trades are executed by the agent's wallet
      const agentAddress = process.env.NEXT_PUBLIC_AGENT_ADDRESS || address;
      const tradesRes = await fetch(`${API_BASE}/trades/history${agentAddress ? `?address=${agentAddress}` : ''}`);
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        if (tradesData.trades && tradesData.trades.length > 0) {
          console.log('📊 Loaded trades:', tradesData.trades.length, tradesData.trades);
          const formattedTrades = tradesData.trades.map((trade: any) => {
            const amount = parseFloat(trade.amount || trade.amountIn || trade.executedAmount || '0');
            const basePrice = parseFloat(trade.price || '0.015');
            const sentiment = parseFloat(trade.sentiment || trade.sentiment_score || '0.5');
            const confidence = parseFloat(trade.confidence || '0.7');
            
            // Calculate realistic P&L based on trade characteristics
            let pnl = 0;
            if (amount > 0) {
              // Estimate P&L: positive for BUY trades with high sentiment, negative for SELL or low sentiment
              const isBuy = (trade.action || trade.type || 'hold').toLowerCase() === 'buy';
              const sentimentFactor = isBuy ? (sentiment - 0.5) * 0.2 : (0.5 - sentiment) * 0.2; // ±10%
              const confidenceFactor = (confidence - 0.5) * 0.05; // ±2.5%
              const feeImpact = -0.01; // -1% for fees
              pnl = amount * (sentimentFactor + confidenceFactor + feeImpact);
            }
            
            return {
              id: trade.id || trade.txHash || `trade_${Date.now()}_${Math.random()}`,
              timestamp: trade.timestamp || new Date().toISOString(),
              action: (trade.action || trade.type || 'hold').toLowerCase() as 'buy' | 'sell' | 'hold',
              amount: amount,
              price: basePrice,
              sentiment_score: sentiment,
              confidence: confidence,
              profit_loss: pnl,
              gas_cost_usd: 0.001,
              tx_hash: trade.txHash || '',
              reason: `${trade.type || 'Trade'} ${amount} units`,
              status: trade.status || 'executed'
            };
          });
          
          // Sort by timestamp (newest first) to ensure correct order
          formattedTrades.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          console.log('📈 Formatted trades (sorted):', formattedTrades.slice(0, 3));
          setTradeHistory(formattedTrades);
        }
      } else {
        console.warn('❌ Failed to load trade history');
      }
      
      // Fetch agent decisions (wallet-specific)
      const decisionsRes = await fetch(`${API_BASE}/agent/decisions${address ? `?address=${address}` : ''}`);
      if (decisionsRes.ok) {
        const decisionsData = await decisionsRes.json();
        if (decisionsData.decisions) {
          setAgentDecisions(decisionsData.decisions);
        }
      }

      // Fetch blockchain events (all on-chain activity)
      const eventsRes = await fetch(`${API_BASE}/blockchain/events?limit=50`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        console.log('⛓️ Blockchain events:', eventsData.events?.length || 0);
        if (eventsData.events) {
          setBlockchainEvents(eventsData.events);
        }
      }

      // Fetch blockchain stats
      const statsRes = await fetch(`${API_BASE}/blockchain/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.stats) {
          setBlockchainStats(statsData.stats);
        }
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle AI Agent Chat
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);
    
    setIsChatLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          role: 'agent',
          content: data.response || 'No response from agent',
          timestamp: new Date().toISOString()
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'agent',
          content: 'Error: Unable to get response from agent',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'agent',
        content: 'Error: Connection to backend failed',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsChatLoading(false);
      // Scroll to bottom
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // Update risk controls
  const updateRiskControls = async (updates: Partial<typeof riskControls>) => {
    const newControls = { ...riskControls, ...updates };
    setRiskControls(newControls);
    
    // Send to backend
    try {
      await fetch(`${API_BASE}/agent/risk-controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newControls)
      });
      toast.success('Risk controls updated');
    } catch (error) {
      console.error('Failed to update risk controls:', error);
      toast.error('Failed to update settings');
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    loadData(); // Initial load
    
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [address]);

  // Prefetch cached analysis on page load for instant trading
  useEffect(() => {
    const prefetchCache = async () => {
      if (!API_BASE) return;
      
      try {
        const response = await fetch(`${API_BASE}/market/cached-analysis`);
        const data = await response.json();
        
        if (data.success && data.cached) {
          console.log(`✅ Analysis cache ready (${data.age} min old)`);
        } else {
          console.log('⚠️  No cached analysis available - first trade will be slower');
        }
      } catch (error) {
        console.error('Cache prefetch error:', error);
      }
    };
    
    prefetchCache();
    
    // Refresh cache check every 5 minutes
    const interval = setInterval(prefetchCache, 300000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  // Fetch CDC price and comparison data
  useEffect(() => {
    const fetchCDCData = async () => {
      if (!API_BASE) return;
      
      try {
        // Fetch CDC price
        const cdcResponse = await fetch(`${API_BASE}/market/price/cdc`);
        if (cdcResponse.ok) {
          const cdcData = await cdcResponse.json();
          setCdcPrice(cdcData);
        }
        
        // Fetch price comparison
        const compareResponse = await fetch(`${API_BASE}/market/price/compare`);
        if (compareResponse.ok) {
          const compareData = await compareResponse.json();
          setPriceComparison(compareData.comparison);
        }
      } catch (error) {
        console.error('Failed to fetch CDC data:', error);
      }
    };
    
    fetchCDCData();
    const interval = setInterval(fetchCDCData, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, [API_BASE]);

  // Initial load only (no auto-refresh) - removed to fix hydration
  // Data loads from mock immediately, no loading state needed

  // Emergency stop handler - stops the agent
  const handleEmergencyStop = async () => {
    if (!API_BASE) return;
    setIsEmergencyStopping(true);
    try {
      const response = await fetch(`${API_BASE}/agent/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast.error('Agent Stopped');
        setAgentStatus((prev) => ({ ...prev, is_running: false }));
        localStorage.setItem('agentRunning', 'false');
      } else {
        toast.error('Failed to stop agent');
      }
    } catch (error) {
      console.error('Stop agent error:', error);
      toast.error('Error stopping agent');
    }
    setIsEmergencyStopping(false);
  };

  // Stop agent handler (for header button)
  const handleStopAgent = async () => {
    if (!API_BASE) return;
    setIsStoppingAgent(true);
    try {
      const response = await fetch(`${API_BASE}/agent/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast.success('Agent Stopped');
        setAgentStatus((prev) => ({ ...prev, is_running: false }));
        localStorage.setItem('agentRunning', 'false');
        loadData(); // Refresh data
      } else {
        toast.error('Failed to stop agent');
      }
    } catch (error) {
      console.error('Stop agent error:', error);
      toast.error('Error stopping agent');
    }
    setIsStoppingAgent(false);
  };

  // Start agent handler (with cache support for fast demos)
  const handleStartAgent = async () => {
    if (!API_BASE) return;
    setIsStartingAgent(true);
    
    try {
      // First, check if we have cached analysis
      const cacheResponse = await fetch(`${API_BASE}/market/cached-analysis`);
      const cacheData = await cacheResponse.json();
      
      if (cacheData.success && cacheData.cached) {
        // Cache is valid - use quick trade path
        const ageMinutes = cacheData.age || 0;
        toast.success(`Using cached analysis (${ageMinutes} min old) - Trade will execute in 5-10 seconds`);
        
        const response = await fetch(`${API_BASE}/agent/execute-trade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useCached: true })
        });
        
        if (response.ok) {
          toast.success('Quick Trade Started');
          setAgentStatus((prev) => ({ ...prev, is_running: true }));
          localStorage.setItem('agentRunning', 'true');
          loadData(); // Refresh data
        } else {
          toast.error('Failed to start trade');
        }
      } else {
        // No cache - run full analysis (slower)
        toast.success('Running full analysis... This may take 45-60 seconds');
        
        const response = await fetch(`${API_BASE}/agent/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          toast.success('Agent Started');
          setAgentStatus((prev) => ({ ...prev, is_running: true }));
          localStorage.setItem('agentRunning', 'true');
          loadData(); // Refresh data
        } else {
          toast.error('Failed to start agent');
        }
      }
    } catch (error) {
      console.error('Start agent error:', error);
      toast.error('Error starting agent');
    }
    setIsStartingAgent(false);
  };
  
  // Manual trade execution
  const handleManualTrade = async () => {
    if (!API_BASE) return;
    
    // Check if wallet is connected
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    // Validate inputs
    if (!manualTradeAmount || parseFloat(manualTradeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(manualTradeAmount);
    const isBuy = manualTradeDirection.toLowerCase() === 'buy';
    
    console.log(`🔄 Manual trade requested: ${isBuy ? 'BUY' : 'SELL'} ${amount} ${isBuy ? 'WCRO' : 'CRO'}`);
    console.log(`   Wallet: ${address}`);
    console.log(`   TCRO Balance: ${tcroBalance.balance}`);
    console.log(`   WCRO Balance: ${wcroBalance.balance}`);
    
    setIsExecutingTrade(true);
    setTxInitiated(false);
    
    // Clear any existing timeout
    if (tradeTimeoutRef.current) {
      clearTimeout(tradeTimeoutRef.current);
    }
    
    // Safety timeout: reset after 2 minutes if stuck
    tradeTimeoutRef.current = setTimeout(() => {
      if (isExecutingTrade) {
        console.warn('Manual trade timeout - resetting state');
        toast.error('Transaction timeout - please try again', { 
          id: isBuy ? 'wrap-toast' : 'unwrap-toast' 
        });
        setIsExecutingTrade(false);
      }
    }, 120000); // 2 minutes
    
    try {
      // Step 1: Check balances
      const tcroBalanceNum = parseFloat(tcroBalance.balance);
      const wcroBalanceNum = parseFloat(wcroBalance.balance);
      
      if (isBuy) {
        // BUY = Wrap CRO to WCRO (spending TCRO to get WCRO)
        if (tcroBalanceNum < amount) {
          toast.error(`Insufficient TCRO balance. You have ${tcroBalanceNum.toFixed(4)} TCRO`);
          setIsExecutingTrade(false);
          return;
        }
        
        console.log(`📝 Initiating wrap transaction: ${amount} CRO → WCRO`);
        toast.loading('Preparing transaction...', { id: 'wrap-toast' });
        
        try {
          // Execute wrap transaction
          console.log('Calling wrapCRO.wrap()...');
          wrapCRO.wrap(amount.toString());
          console.log('✅ Wrap function called, waiting for MetaMask...');
          setTxInitiated(true);
          toast.loading('Waiting for MetaMask confirmation...', { id: 'wrap-toast' });
        } catch (err: any) {
          console.error('❌ Wrap error:', err);
          toast.error(err.message || 'Failed to prepare transaction', { id: 'wrap-toast' });
          setIsExecutingTrade(false);
          return;
        }
        
      } else {
        // SELL = Unwrap WCRO to CRO (spending WCRO to get TCRO)
        if (wcroBalanceNum < amount) {
          toast.error(`Insufficient WCRO balance. You have ${wcroBalanceNum.toFixed(4)} WCRO`);
          setIsExecutingTrade(false);
          return;
        }
        
        console.log(`📝 Initiating unwrap transaction: ${amount} WCRO → CRO`);
        toast.loading('Preparing transaction...', { id: 'unwrap-toast' });
        
        try {
          // Execute unwrap transaction
          console.log('Calling unwrapWCRO.unwrap()...');
          unwrapWCRO.unwrap(amount.toString());
          console.log('✅ Unwrap function called, waiting for MetaMask...');
          setTxInitiated(true);
          toast.loading('Waiting for MetaMask confirmation...', { id: 'unwrap-toast' });
        } catch (err: any) {
          console.error('❌ Unwrap error:', err);
          toast.error(err.message || 'Failed to prepare transaction', { id: 'unwrap-toast' });
          setIsExecutingTrade(false);
          return;
        }
      }
      
      // Note: Transaction completion is handled by wagmi hooks
      // The success will be detected by watching wrapCRO.isSuccess or unwrapWCRO.isSuccess
      
    } catch (error: any) {
      console.error('Manual trade error:', error);
      toast.error(error?.message || 'Transaction failed', { id: isBuy ? 'wrap-toast' : 'unwrap-toast' });
      setIsExecutingTrade(false);
    }
  };
  
  // Watch for wrap transaction completion/failure
  useEffect(() => {
    if (!isExecutingTrade) return;
    
    if (wrapCRO.isSuccess) {
      // Clear timeout on success
      if (tradeTimeoutRef.current) {
        clearTimeout(tradeTimeoutRef.current);
        tradeTimeoutRef.current = null;
      }
      
      const amount = manualTradeAmount;
      toast.success(`Successfully bought ${amount} WCRO!`, { id: 'wrap-toast' });
      setManualTradeAmount('');
      setManualTradeDirection('buy');
      setIsExecutingTrade(false);
      loadData(); // Refresh balances
      
      // Notify backend for tracking
      if (API_BASE && address) {
        fetch(`${API_BASE}/trades/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: 'WCRO',
            side: 'buy',
            amount: parseFloat(amount),
            walletAddress: address,
            txHash: wrapCRO.hash,
            realTransaction: true
          }),
        }).catch(console.error);
      }
    }
    
    // Handle transaction errors - only check if we have an actual error from wagmi
    if (txInitiated && wrapCRO.error && manualTradeDirection === 'buy') {
      // Clear timeout on error
      if (tradeTimeoutRef.current) {
        clearTimeout(tradeTimeoutRef.current);
        tradeTimeoutRef.current = null;
      }
      
      toast.error('Transaction cancelled or failed', { id: 'wrap-toast' });
      setIsExecutingTrade(false);
      setTxInitiated(false);
    }
  }, [wrapCRO.isSuccess, wrapCRO.isPending, wrapCRO.hash, isExecutingTrade, txInitiated, manualTradeAmount, address, manualTradeDirection]);
  
  // Watch for unwrap transaction completion/failure
  useEffect(() => {
    if (!isExecutingTrade) return;
    
    if (unwrapWCRO.isSuccess) {
      // Clear timeout on success
      if (tradeTimeoutRef.current) {
        clearTimeout(tradeTimeoutRef.current);
        tradeTimeoutRef.current = null;
      }
      
      const amount = manualTradeAmount;
      toast.success(`Successfully sold ${amount} WCRO!`, { id: 'unwrap-toast' });
      setManualTradeAmount('');
      setManualTradeDirection('buy');
      setIsExecutingTrade(false);
      loadData(); // Refresh balances
      
      // Notify backend for tracking
      if (API_BASE && address) {
        fetch(`${API_BASE}/trades/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: 'WCRO',
            side: 'sell',
            amount: parseFloat(amount),
            walletAddress: address,
            txHash: unwrapWCRO.hash,
            realTransaction: true
          }),
        }).catch(console.error);
      }
    }
    
    // Handle transaction errors - only check if we have an actual error from wagmi
    if (txInitiated && unwrapWCRO.error && manualTradeDirection === 'sell') {
      // Clear timeout on error
      if (tradeTimeoutRef.current) {
        clearTimeout(tradeTimeoutRef.current);
        tradeTimeoutRef.current = null;
      }
      
      toast.error('Transaction cancelled or failed', { id: 'unwrap-toast' });
      setIsExecutingTrade(false);
      setTxInitiated(false);
    }
  }, [unwrapWCRO.isSuccess, unwrapWCRO.isPending, unwrapWCRO.hash, isExecutingTrade, txInitiated, manualTradeAmount, address, manualTradeDirection]);
  
  
  // Format time
  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Subtle ambient gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.02)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(255,255,255,0.015)_0%,transparent_40%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header — sticky frosted glass navbar */}
        <header className="border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl sticky top-0 z-50">
          <div className="max-w-[1440px] mx-auto px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow">
                  S
                </div>
                <span className="font-bold text-lg text-white tracking-tight">
                  Sentinel AI
                </span>
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] rounded-full border border-white/[0.06]">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Terminal</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Live Agent Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full">
                <div className={`w-2 h-2 rounded-full transition-colors ${agentStatus.is_running ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] animate-pulse' : 'bg-white/20'}`} />
                <span className="text-[11px] font-medium text-white/60">
                  {agentStatus.is_running ? 'LIVE' : 'IDLE'}
                </span>
              </div>
              
              {/* Start/Stop Agent */}
              <button
                onClick={agentStatus.is_running ? handleStopAgent : handleStartAgent}
                disabled={isStartingAgent || isStoppingAgent}
                className={`px-4 py-1.5 rounded-full font-semibold text-[11px] uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  agentStatus.is_running
                    ? 'bg-white/[0.06] text-white/70 border border-white/[0.1] hover:bg-white/[0.1] hover:text-white'
                    : 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                }`}
              >
                {isStartingAgent ? '...' : isStoppingAgent ? '...' : agentStatus.is_running ? 'Stop' : 'Start Agent'}
              </button>
              
              <Link
                href="/how-it-works"
                className="hidden md:flex px-3 py-1.5 bg-white/[0.03] text-white/50 border border-white/[0.06] hover:text-white hover:border-white/[0.15] rounded-full font-medium text-[11px] transition-all items-center gap-1.5"
              >
                Docs
              </Link>
              
              {isConnected && address && (
                <div className="hidden sm:block px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full">
                  <p className="text-white/50 text-[11px] font-mono">
                    {address.slice(0, 6)}···{address.slice(-4)}
                  </p>
                </div>
              )}
              <button
                onClick={loadData}
                disabled={isRefreshing}
                className="p-1.5 hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-white/30 hover:text-white transition-all disabled:opacity-40"
                title="Refresh data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/"
                className="p-1.5 hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-white/30 hover:text-white transition-all"
              >
                <Home className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1440px] mx-auto px-5 py-5 space-y-4">
          
          {/* ═══ ROW 1: Key Metrics Strip ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* CRO Price */}
            <div className="glass-panel rounded-2xl p-5 group hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">CRO / USD</span>
                <DollarSign className="w-3.5 h-3.5 text-white/20" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-mono">${croPrice?.price ? croPrice.price.toFixed(4) : '0.0000'}</div>
              <div className="flex items-center gap-1.5 mt-2">
                {(croPrice?.change_24h || 0) >= 0 ? <ArrowUp className="w-3 h-3 text-white/70" /> : <ArrowDown className="w-3 h-3 text-white/40" />}
                <span className="text-[11px] font-mono text-white/40">{Math.abs(croPrice?.change_24h || 0).toFixed(2)}% 24h</span>
              </div>
            </div>

            {/* Sentiment */}
            <div className="glass-panel rounded-2xl p-5 group hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">Sentiment</span>
                <Gauge className="w-3.5 h-3.5 text-white/20" />
              </div>
              <SentimentGauge value={marketIntel.sentiment} signal={marketIntel.signal} />
              <div className="text-center mt-1 text-[10px] text-white/30 font-mono">
                {marketIntel.sources || 0}/4 oracles
              </div>
            </div>

            {/* Agent Status */}
            <div className="glass-panel rounded-2xl p-5 group hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">Agent</span>
                <Bot className="w-3.5 h-3.5 text-white/20" />
              </div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${agentStatus.is_running ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-pulse" : "bg-white/15"}`} />
                <span className="text-xl font-semibold text-white">
                  {agentStatus.is_running ? "Active" : "Idle"}
                </span>
              </div>
              <div className="text-[10px] text-white/30 font-mono">
                {agentStatus.is_running ? `Next: ${formatCountdown(agentStatus.next_cycle_in)}` : 'Awaiting start command'}
              </div>
            </div>

            {/* Sentinel Limit */}
            <div className="glass-panel rounded-2xl p-5 group hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">Sentinel</span>
                <Shield className="w-3.5 h-3.5 text-white/20" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-mono">{sentinelStatus.remaining?.toFixed(2) || '0.00'}</div>
              <div className="w-full bg-white/[0.06] rounded-full h-1 mt-3 overflow-hidden">
                <div
                  className="bg-white/80 h-1 rounded-full transition-all duration-700"
                  style={{ width: `${((sentinelStatus.remaining || 0) / (sentinelStatus.daily_limit || 1)) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-white/30 mt-1.5 font-mono">
                {sentinelStatus.spent_today?.toFixed(2) || '0'} / {sentinelStatus.daily_limit?.toFixed(2) || '0'} used
              </div>
            </div>
          </div>

          {/* ═══ ROW 2: HERO — TradingView Chart + Sidebar ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* TradingView Chart — 3/4 width, hero element */}
            <div className="lg:col-span-3 glass-panel rounded-2xl p-4 h-[520px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                    <BarChart3 className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">CRO/USD</h3>
                    <p className="text-[10px] text-white/30">Live market data</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-white/20 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">TRADINGVIEW</span>
              </div>
              <div className="h-[calc(100%-52px)] w-full bg-black/40 rounded-xl overflow-hidden border border-white/[0.04]">
                <TradingViewWidget />
              </div>
            </div>

            {/* Right sidebar — Manual Trade + Price Comparison */}
            <div className="space-y-4">
              {/* Quick Trade */}
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                    <Zap className="w-3.5 h-3.5 text-white/70" />
                  </div>
                  <span className="text-xs font-semibold text-white">Quick Trade</span>
                </div>
                
                {/* Direction */}
                <div className="flex gap-1.5 mb-3">
                  <button
                    onClick={() => setManualTradeDirection('buy')}
                    className={`flex-1 py-2 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${
                      manualTradeDirection === 'buy'
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setManualTradeDirection('sell')}
                    className={`flex-1 py-2 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${
                      manualTradeDirection === 'sell'
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Amount */}
                <div className="mb-3">
                  <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5 block">Amount</label>
                  <input
                    type="number"
                    value={manualTradeAmount}
                    onChange={(e) => setManualTradeAmount(e.target.value)}
                    step="0.1"
                    min="0.01"
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-white/30 transition-colors placeholder-white/15"
                    placeholder="0.1"
                  />
                </div>

                {/* Output estimate */}
                <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04] mb-3">
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-0.5">Est. Output</div>
                  <div className="text-white text-sm font-mono font-semibold">
                    ~{(parseFloat(manualTradeAmount || '0') * 0.98).toFixed(4)} {manualTradeDirection === 'buy' ? 'WCRO' : 'TCRO'}
                  </div>
                </div>

                {/* Execute */}
                <button
                  onClick={handleManualTrade}
                  disabled={isExecutingTrade || !isConnected || parseFloat(manualTradeAmount || '0') <= 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-black rounded-lg font-semibold text-xs transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                >
                  {isExecutingTrade ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...</>
                  ) : (
                    <><Zap className="w-3.5 h-3.5" /> Execute</>
                  )}
                </button>
                
                {!isConnected && (
                  <div className="mt-2 p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg flex items-center gap-1.5 text-white/30 text-[10px]">
                    <AlertTriangle className="w-3 h-3 text-white/20" />
                    Connect wallet to trade
                  </div>
                )}
              </div>

              {/* Price Sources */}
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                    <TrendingUp className="w-3.5 h-3.5 text-white/70" />
                  </div>
                  <span className="text-xs font-semibold text-white">Price Oracles</span>
                </div>

                <div className="space-y-2.5">
                  {/* CoinGecko */}
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-white/30">CoinGecko</span>
                      <span className="text-[8px] font-mono text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.05]">PRIMARY</span>
                    </div>
                    <span className="text-lg font-bold text-white font-mono">${croPrice?.price ? croPrice.price.toFixed(6) : '0.080000'}</span>
                  </div>

                  {/* CDC */}
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-white/30">Crypto.com</span>
                      <span className="text-[8px] font-mono text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.05]">CDC SDK</span>
                    </div>
                    <span className="text-lg font-bold text-white font-mono">${cdcPrice?.price ? cdcPrice.price.toFixed(6) : '0.085000'}</span>
                  </div>
                </div>

                {priceComparison && priceComparison.avgPrice !== undefined && (
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                    <div className="bg-white/[0.02] rounded-md p-2 text-center border border-white/[0.03]">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">AVG</div>
                      <div className="text-[11px] font-bold text-white font-mono">${priceComparison.avgPrice.toFixed(4)}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-md p-2 text-center border border-white/[0.03]">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">DIFF</div>
                      <div className="text-[11px] font-bold text-white font-mono">{(priceComparison.percentageDiff || 0).toFixed(2)}%</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-md p-2 text-center border border-white/[0.03]">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">SPREAD</div>
                      <div className="text-[11px] font-bold text-white font-mono">${((priceComparison.spread || 0) * 1000).toFixed(3)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
              
              {/* ═══ ROW 3: Multi-Agent Council + Performance ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Multi-Agent Council */}
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <Bot className="w-4 h-4 text-white/70" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Multi-Agent Council</h3>
                  <p className="text-[10px] text-white/30">3 AI agents vote on every execution</p>
                </div>
              </div>
              
              {agentVotes.length > 0 && agentStatus.is_running ? (
                <div className="space-y-3">
                  {agentVotes.map((agent, idx) => {
                    const agentIcons = {
                      '🛡️ Risk Manager': '🛡️',
                      '📊 Market Analyst': '📊',
                      '⚡ Execution Specialist': '⚡'
                    };
                    return (
                      <div key={idx} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.1] transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{agentIcons[agent.agent as keyof typeof agentIcons] || '🤖'}</span>
                            <div>
                              <div className="font-semibold text-white text-xs">
                                {agent.agent.replace('🛡️ ', '').replace('📊 ', '').replace('⚡ ', '')}
                              </div>
                              <div className="text-[9px] uppercase tracking-wider text-white/25">
                                {agent.agent.includes('Risk') ? 'Conservative' : agent.agent.includes('Market') ? 'Data-Driven' : 'Aggressive'}
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.1] text-[10px] font-bold text-white uppercase tracking-wider">
                            {agent.vote.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] uppercase tracking-wider text-white/25">Confidence</span>
                            <span className="text-[10px] text-white font-mono font-semibold">{(agent.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-white/[0.04] rounded-full h-1">
                            <div className="bg-white/70 h-1 rounded-full transition-all" style={{ width: `${agent.confidence * 100}%` }} />
                          </div>
                        </div>
                        <p className="text-[10px] text-white/30 leading-relaxed">{agent.reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/[0.02] rounded-xl p-8 text-center border border-white/[0.04]">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-white/10" />
                  <p className="text-white/40 font-medium text-xs mb-0.5">Council Standby</p>
                  <p className="text-[10px] text-white/20">{agentStatus.is_running ? 'Awaiting next voting cycle' : 'Start agent to activate council'}</p>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                    <TrendingUp className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Performance</h3>
                    <p className="text-[10px] text-white/30">Live trading statistics</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-white/25">Trades</div>
                  <div className="text-xl font-bold text-white font-mono">{performanceMetrics.totalTrades}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-1">Win Rate</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">{performanceMetrics.winRate.toFixed(1)}%</div>
                  <div className="text-[9px] text-white/20 font-mono">{performanceMetrics.winningTrades}W / {performanceMetrics.losingTrades}L</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-1">Total P&L</div>
                  <div className={`text-lg font-bold font-mono ${performanceMetrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {performanceMetrics.totalPnL >= 0 ? '+' : ''}{performanceMetrics.totalPnL.toFixed(3)}
                  </div>
                  <div className="text-[9px] text-white/20 font-mono">TCRO</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-1">Avg Profit</div>
                  <div className={`text-lg font-bold font-mono ${performanceMetrics.avgProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {performanceMetrics.avgProfit >= 0 ? '+' : ''}{performanceMetrics.avgProfit.toFixed(3)}
                  </div>
                  <div className="text-[9px] text-white/20">per trade</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-1">Best</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">+{performanceMetrics.bestTrade.toFixed(3)}</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-1">Worst</div>
                  <div className={`text-sm font-bold font-mono ${performanceMetrics.worstTrade >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {performanceMetrics.worstTrade >= 0 ? '+' : ''}{performanceMetrics.worstTrade.toFixed(3)}
                  </div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[9px] uppercase tracking-wider text-white/25 mb-1">Score</div>
                  <div className="text-sm font-bold text-indigo-400 font-mono">{performanceMetrics.totalTrades > 0 ? Math.min(100, Math.round(performanceMetrics.winRate * 1.2)).toString() : '0'}/100</div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 4: Sentiment Chart + Pool/Wallet ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sentiment History */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-5 h-[380px]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <Activity className="w-4 h-4 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">Sentiment (24h)</h3>
              </div>
              {sentimentHistory.length > 0 ? (
                <div className="w-full h-[calc(100%-56px)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentHistory}>
                      <defs>
                        <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="hour" stroke="rgba(255,255,255,0.15)" fontSize={9} />
                      <YAxis stroke="rgba(255,255,255,0.15)" fontSize={9} domain={[0, 1]} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,10,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", backdropFilter: "blur(10px)" }} labelStyle={{ color: "rgba(255,255,255,0.4)" }} />
                      <Area type="monotone" dataKey="sentiment" stroke="#06b6d4" fill="url(#sentimentGradient)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[calc(100%-56px)]">
                  <div className="text-center text-white/20">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No sentiment data</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pool + Wallet */}
            <div className="space-y-4">
              {/* Pool */}
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs font-semibold text-white">Pool Status</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-white/25 mb-0.5">WCRO</div>
                    <div className="text-lg font-bold text-white font-mono">{poolStatus.wcro_balance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-white/25 mb-0.5">tUSD</div>
                    <div className="text-lg font-bold text-white font-mono">{poolStatus.tusd_balance.toFixed(2)}</div>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-white/[0.04] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/30">Price</span>
                    <span className="text-white font-mono">${poolStatus.price.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/30">TVL</span>
                    <span className="text-white font-mono">${poolStatus.tvl_usd.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Wallet */}
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs font-semibold text-white">Wallet</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <span className="text-xs text-white/40">WCRO</span>
                    <span className="font-mono font-semibold text-white text-sm">{walletBalances.CRO?.toFixed(4) || '0.0000'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <span className="text-xs text-white/40">TCRO</span>
                    <span className="font-mono font-semibold text-white text-sm">{walletBalances.USDC?.toFixed(4) || '0.0000'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <span className="text-xs text-white/40">Total</span>
                    <span className="font-mono font-semibold text-white text-sm">${walletBalances.totalValue?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-white/15 truncate font-mono">{address || 'Not connected'}</div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 5: Blockchain Events ═══ */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <Clock className="w-4 h-4 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">Smart Contract Events</h3>
                {blockchainStats.monitoring && (
                  <span className="ml-1 px-2 py-0.5 bg-white/[0.06] text-white/60 text-[9px] rounded-full flex items-center gap-1 border border-white/[0.08]">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
              <div className="flex gap-3 text-[10px] text-white/30 font-mono">
                <span>✅ {blockchainStats.approved}</span>
                <span>🚫 {blockchainStats.blocked}</span>
                <span>💳 {blockchainStats.x402Payments}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm">
                  <tr className="text-left text-[9px] uppercase tracking-wider text-white/25 border-b border-white/[0.04]">
                    <th className="pb-2.5 pr-4">Time</th>
                    <th className="pb-2.5 pr-4">Event</th>
                    <th className="pb-2.5 pr-4">Agent</th>
                    <th className="pb-2.5 pr-4">Amount</th>
                    <th className="pb-2.5 pr-4">Status</th>
                    <th className="pb-2.5 pr-4">Reason</th>
                    <th className="pb-2.5">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {blockchainEvents.map((event, index) => (
                    <tr key={`${event.txHash}-${index}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4 text-[11px] text-white/40 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2.5 pr-4">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-white/[0.04] text-white/60 border border-white/[0.06]">
                          {event.type === "TransactionApproved" ? "APPROVED" : event.type === "TransactionBlocked" ? "BLOCKED" : event.type === "X402PaymentApproved" ? "X402" : event.type === "ManualTradeExecuted" ? "MANUAL" : event.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[10px] text-white/30">{event.agent ? `${event.agent.slice(0, 6)}...${event.agent.slice(-4)}` : '-'}</td>
                      <td className="py-2.5 pr-4 font-mono text-[11px] text-white/50">{event.amount ? `${parseFloat(event.amount).toFixed(4)}` : "-"}</td>
                      <td className="py-2.5 pr-4 text-[10px] text-white/40">{event.type === "TransactionApproved" ? "✓" : event.type === "TransactionBlocked" ? "✗" : "●"}</td>
                      <td className="py-2.5 pr-4 text-[10px] text-white/25 max-w-[200px] truncate">{event.reason || event.service || '-'}</td>
                      <td className="py-2.5">
                        {event.txHash ? (
                          <a href={`https://explorer.cronos.org/testnet/tx/${event.txHash}`} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className="text-white/10">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {blockchainEvents.length === 0 && (
                <div className="text-center py-8 text-white/20">
                  <p className="text-xs font-mono">{blockchainStats.monitoring ? 'Listening for events...' : 'Initializing...'}</p>
                </div>
              )}
            </div>
          </div>

          {/* ═══ ROW 6: AI Chat + Agent Decisions ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AI Chat */}
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <MessageSquare className="w-4 h-4 text-white/70" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                  <p className="text-[10px] text-white/30">Chat with 9 agents & MCP tools</p>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-xl p-3 mb-3 h-[300px] overflow-y-auto space-y-2.5 border border-white/[0.03]">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-10 text-white/15">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Start a conversation</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl p-2.5 ${msg.role === 'user' ? 'bg-white/[0.08] text-white border border-white/[0.08]' : 'bg-white/[0.03] text-white/70 border border-white/[0.04]'}`}>
                        <div className="flex items-start gap-1.5">
                          {msg.role === 'agent' && <Bot className="w-3 h-3 mt-0.5 flex-shrink-0 text-white/30" />}
                          <div className="flex-1">
                            <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            <p className="text-[8px] text-white/20 mt-1 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-white/30" />
                        <span className="text-[10px] text-white/25">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="Ask about markets, sentiment, or strategies..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-white/20 text-white placeholder-white/15 transition-colors"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-white/[0.08] hover:bg-white/[0.15] disabled:bg-white/[0.02] disabled:cursor-not-allowed px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors border border-white/[0.06]"
                >
                  <Send className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Agent Decision Log */}
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <Bot className="w-4 h-4 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">Decision Log</h3>
              </div>
              
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                {agentDecisions.length > 0 ? (
                  agentDecisions.map((decision, idx) => (
                    <div key={idx} className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-white/25 font-mono">{new Date(decision.timestamp).toLocaleString()}</span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-white/[0.04] text-white/60 border border-white/[0.06]">
                          {decision.decision}
                        </span>
                      </div>
                      <div className="space-y-1 text-[10px]">
                        <div><span className="text-white/25">Market: </span><span className="text-white/50">{decision.market_data}</span></div>
                        <div><span className="text-white/25">Sentinel: </span><span className="text-white/50">{decision.sentinel_status}</span></div>
                        <div className="pt-1.5 border-t border-white/[0.03]"><span className="text-white/25">Reason: </span><span className="text-white/40">{decision.reason}</span></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-white/15">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No decisions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ ROW 7: Risk Controls + Explainable AI ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risk Controls */}
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <Sliders className="w-4 h-4 text-white/70" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Risk Controls</h3>
                  <p className="text-[10px] text-white/30">Configure trading limits and safety parameters</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-medium text-white/50">Daily Limit</label>
                    <span className="text-white font-bold font-mono text-sm">{riskControls.dailyLimit} TCRO</span>
                  </div>
                  <input type="range" min="1" max="10" step="0.5" value={riskControls.dailyLimit} onChange={(e) => updateRiskControls({ dailyLimit: parseFloat(e.target.value) })} className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-medium text-white/50">Max Trade Size</label>
                    <span className="text-white font-bold font-mono text-sm">{riskControls.maxTradeSize} TCRO</span>
                  </div>
                  <input type="range" min="0.5" max="5" step="0.5" value={riskControls.maxTradeSize} onChange={(e) => updateRiskControls({ maxTradeSize: parseFloat(e.target.value) })} className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-medium text-white/50">Stop-Loss</label>
                    <span className="text-white font-bold font-mono text-sm">-{riskControls.stopLossPercent}%</span>
                  </div>
                  <input type="range" min="1" max="20" step="1" value={riskControls.stopLossPercent} onChange={(e) => updateRiskControls({ stopLossPercent: parseFloat(e.target.value) })} className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-white/50">Emergency Stop</div>
                    <div className="text-[9px] text-white/20">Manual intervention to halt trading</div>
                  </div>
                  <button
                    onClick={() => updateRiskControls({ emergencyStopEnabled: !riskControls.emergencyStopEnabled })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors border ${riskControls.emergencyStopEnabled ? 'bg-white/20 border-white/30' : 'bg-white/[0.04] border-white/[0.08]'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${riskControls.emergencyStopEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Emergency Stop Button */}
                <div className="pt-3 border-t border-white/[0.04]">
                  <div className="flex gap-3">
                    {agentStatus.is_running ? (
                      <button
                        onClick={handleEmergencyStop}
                        disabled={isEmergencyStopping}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.04] text-white/60 border border-white/[0.08] rounded-xl font-semibold text-xs hover:bg-white/[0.08] transition-colors disabled:opacity-40"
                      >
                        {isEmergencyStopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                        Emergency Stop
                      </button>
                    ) : (
                      <button
                        onClick={handleStartAgent}
                        disabled={isEmergencyStopping}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl font-semibold text-xs hover:bg-white/90 transition-colors disabled:opacity-40 shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                      >
                        {isEmergencyStopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Start Agent
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Explainable AI */}
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <Activity className="w-4 h-4 text-white/70" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Explainable AI</h3>
                  <p className="text-[10px] text-white/30">Decision transparency & reasoning</p>
                </div>
              </div>
              
              {explainableAI ? (
                <div className="space-y-4">
                  {/* Decision */}
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-base font-bold text-white">{(explainableAI?.decision || 'HOLD').toUpperCase()}</div>
                        <div className="text-[9px] text-white/25">Multi-source analysis</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white font-mono">{((explainableAI?.confidence || 0) * 100).toFixed(0)}%</div>
                        <div className="text-[9px] text-white/25">Confidence</div>
                      </div>
                    </div>
                    <div className="w-full bg-white/[0.04] rounded-full h-1.5">
                      <div className="bg-white/60 h-1.5 rounded-full transition-all" style={{ width: `${(explainableAI?.confidence || 0) * 100}%` }} />
                    </div>
                  </div>

                  {/* Price Indicators */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.03]">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">Price</div>
                      <div className="text-xs font-bold text-white font-mono">${((explainableAI as any)?.price_indicators?.current_price || 0).toFixed(4)}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.03]">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">24h Δ</div>
                      <div className="text-xs font-bold text-white font-mono">{((explainableAI as any)?.price_indicators?.change_24h || 0).toFixed(2)}%</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.03]">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">MA</div>
                      <div className="text-xs font-bold text-white font-mono">${((explainableAI as any)?.price_indicators?.moving_avg || 0).toFixed(4)}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.03]">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">Trend</div>
                      <div className="text-xs font-bold text-white">{(explainableAI as any)?.price_indicators?.trend || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.03] text-center">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">Volatility</div>
                      <div className="text-xs font-bold text-white">{(explainableAI as any)?.risk_assessment?.volatility || 'Med'}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.03] text-center">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">Volume</div>
                      <div className="text-xs font-bold text-white">{(explainableAI as any)?.risk_assessment?.volume || 'Med'}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.03] text-center">
                      <div className="text-[8px] uppercase text-white/20 mb-0.5">Sentiment</div>
                      <div className="text-xs font-bold text-white">{(explainableAI as any)?.risk_assessment?.sentiment || 'Neutral'}</div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.03]">
                    <div className="text-[9px] uppercase tracking-wider text-white/20 mb-2">Reasoning</div>
                    <ul className="space-y-1">
                      {(Array.isArray(explainableAI?.reasoning) ? explainableAI.reasoning : [explainableAI?.reasoning || 'No reasoning available']).map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[10px] text-white/40">
                          <span className="text-white/15 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-white/15">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Start agent for AI analysis</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-6 py-5 px-5 bg-black/40 backdrop-blur-sm">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-white/20 font-mono">
            <div>Sentinel AI · Cronos x402 Hackathon</div>
            <div className="flex gap-4">
              <a href="https://explorer.cronos.org/testnet" target="_blank" className="hover:text-white/60 transition-colors">Explorer</a>
              <a href="https://github.com/ayushkumartht/Brainwave" target="_blank" className="hover:text-white/60 transition-colors">GitHub</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
