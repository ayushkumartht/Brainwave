'use client'

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { 
  Shield, 
  Zap, 
  Terminal, 
  Activity, 
  ArrowRight, 
  Github, 
  ExternalLink,
  Bot,
  TrendingUp,
  Cpu,
  Lock,
  Globe,
  Sliders,
  CheckCircle2,
  DollarSign
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Sentiment Simulator State
  const [simulationText, setSimulationText] = useState("CRO is looking incredibly bullish today, expecting a massive breakout!");
  const [simulatedScore, setSimulatedScore] = useState(0.85);
  const [simulatedSignal, setSimulatedSignal] = useState("BUY");

  const runSimulation = (text: string) => {
    let score = 0.5;
    const lower = text.toLowerCase();
    
    // Simple sentiment analyzer
    const positiveWords = ["bullish", "breakout", "buy", "up", "green", "moon", "good", "great", "pump", "undervalued"];
    const negativeWords = ["bearish", "dump", "sell", "down", "red", "bad", "crash", "risk", "liquidate", "overvalued"];
    
    positiveWords.forEach(w => {
      if (lower.includes(w)) score += 0.15;
    });
    negativeWords.forEach(w => {
      if (lower.includes(w)) score -= 0.15;
    });
    
    score = Math.max(0.05, Math.min(0.95, score));
    setSimulatedScore(score);
    
    if (score > 0.65) setSimulatedSignal("BUY");
    else if (score < 0.35) setSimulatedSignal("SELL");
    else setSimulatedSignal("HOLD");
  };

  useEffect(() => {
    runSimulation(simulationText);
  }, [simulationText]);

  const handleConnect = async () => {
    try {
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
        toast.loading("Connecting wallet...", { duration: 1500 });
      } else {
        toast.error("No wallet connector found. Please install MetaMask.", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
  };

  const handleLaunchTerminal = () => {
    if (isConnected) {
      toast.success("Loading dashboard...");
      router.push("/dashboard");
    } else {
      toast.error("Please connect your wallet first to access dashboard", {
        duration: 3000,
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#030303] text-white overflow-x-hidden relative selection:bg-white selection:text-black font-sans">
      {/* Dynamic light glows in background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.02)_0%,transparent_60%)]" />
      </div>

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-2xl bg-black/40 border-b border-white/[0.04]">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-white text-black rounded-lg flex items-center justify-center font-bold text-base shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-all">
              S
            </div>
            <div>
              <span className="text-white font-semibold text-lg tracking-tight block">Sentinel AI</span>
              <span className="text-white/45 text-[9px] uppercase tracking-widest font-mono">Cronos Autonomous Trading Network</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-5">
            <Link 
              href="/how-it-works"
              className="text-xs font-semibold text-white/50 hover:text-white uppercase tracking-wider transition-colors hidden sm:block"
            >
              Docs
            </Link>

            {isConnected && address ? (
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-full flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-white/70 text-xs font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <button 
                  onClick={handleDisconnect}
                  className="px-4 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white text-xs font-semibold rounded-full transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={handleConnect}
                className="px-5 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="relative w-full min-h-screen flex flex-col justify-center pt-32 pb-16 px-6 z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-left space-y-6">
            {/* Live Indicator Pill */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] tracking-widest uppercase text-white/60 font-mono">Cronos EVM Live Simulator</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] font-sans">
              Autonomous Trade.<br />
              <span className="text-white/40 font-light">Safe on-chain guard.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/50 text-base md:text-lg max-w-xl leading-relaxed">
              Experience the first fully autonomous multi-agent portfolio optimizer. 
              Driven by a 3-agent consensus council, NLP news metrics, and guarded by 
              on-chain smart limits.
            </p>

            {/* CTA Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={handleLaunchTerminal}
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-white/90 text-black font-bold rounded-full transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                <span>Launch Terminal</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <Link 
                href="/how-it-works"
                className="w-full sm:w-auto px-7 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] text-white/80 hover:text-white font-semibold rounded-full border border-white/[0.08] transition-all flex items-center justify-center gap-2"
              >
                <span>Docs & Architecture</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/40" />
              </Link>
            </div>
          </div>

          {/* Interactive Live Ticker Panel on the Right */}
          <div className="lg:col-span-5 relative">
            <div className="glass-panel rounded-2xl p-6 relative border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
                <span className="text-[10px] tracking-wider uppercase text-white/40 font-mono">Live Simulation</span>
                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-mono font-bold animate-pulse">
                  ONLINE
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                  <span className="text-xs text-white/60">Simulated Price</span>
                  <span className="text-sm font-bold text-white font-mono">$0.0482 CRO</span>
                </div>

                <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                  <span className="text-xs text-white/60">Sentiment Oracles</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">VADER NLP + RSS</span>
                </div>

                <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                  <span className="text-xs text-white/60">Risk Guard Status</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> CLAMP_OK
                  </span>
                </div>

                {/* Looping ticker values mock */}
                <div className="h-24 bg-black/40 rounded-lg p-3 border border-white/[0.04] font-mono text-[10px] space-y-1 overflow-hidden">
                  <div className="text-emerald-400">[01:24:02] VADER: CRO positive sentiment +0.72</div>
                  <div className="text-white/60">[01:24:15] Council voting: 2 BUY, 1 HOLD</div>
                  <div className="text-emerald-400">[01:24:20] EXEC: Wrap 0.5 CRO to WCRO - SUCCESS</div>
                  <div className="text-white/30">[01:24:35] Sentinel clamp daily usage: 1.2/10.0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: DYNAMIC SENTIMENT SIMULATOR (Scrollable interactivity) ═══ */}
      <section className="relative w-full py-24 border-y border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-sans">Interactive Market Analysis</h2>
            <p className="text-white/40 text-sm max-w-lg mx-auto">
              Test how the Sentinel AI sweeps sentiment feeds in real-time. Type anything to trigger mock council decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
            {/* Input Side */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-white/[0.06]">
              <span className="text-[10px] uppercase font-mono text-white/40 tracking-wider block mb-2">Simulated RSS / News Text</span>
              <textarea
                value={simulationText}
                onChange={(e) => setSimulationText(e.target.value)}
                className="w-full h-32 p-4 bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-xl focus:outline-none text-white text-sm leading-relaxed resize-none transition-colors"
                placeholder="Type market rumor or tweet..."
              />
              
              <div className="flex gap-2 flex-wrap mt-3">
                <button 
                  onClick={() => setSimulationText("Massive rumors of Cronos network partnership, sentiment is through the roof! Buy buy buy!")}
                  className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white text-[10px] rounded font-mono border border-white/[0.04] transition-all"
                >
                  Example Bullish
                </button>
                <button 
                  onClick={() => setSimulationText("Warning: High volatility and sudden sell-off risk on Cronos token, proceed with extreme caution.")}
                  className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white text-[10px] rounded font-mono border border-white/[0.04] transition-all"
                >
                  Example Bearish
                </button>
              </div>
            </div>

            {/* Simulated Output Side */}
            <div className="lg:col-span-5 flex flex-col justify-between glass-panel rounded-2xl p-6 border border-white/[0.06] bg-black/40">
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-mono text-white/40 tracking-wider block">Decision Result</span>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60">Sentiment Weight</span>
                  <span className="text-base font-bold font-mono text-white">{(simulatedScore * 100).toFixed(0)}%</span>
                </div>

                <div className="w-full bg-white/[0.04] rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      simulatedSignal === "BUY" ? "bg-emerald-400" : simulatedSignal === "SELL" ? "bg-rose-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${simulatedScore * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center border-t border-white/[0.04] pt-4">
                  <span className="text-xs text-white/60">Simulated Action</span>
                  <span className={`px-3 py-1 rounded font-mono text-xs font-bold ${
                    simulatedSignal === "BUY" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" :
                    simulatedSignal === "SELL" ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" :
                    "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  }`}>
                    {simulatedSignal}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.04] text-[10px] text-white/30 leading-relaxed font-mono">
                💡 Real-time VADER parses inputs keylessly without expensive API calls, triggering immediate execution pre-flight feasibility tests.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: THREE-AGENT COUNCIL BENTO SHOWCASE ═══ */}
      <section className="relative w-full py-24 max-w-7xl mx-auto px-6">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs uppercase font-mono tracking-widest text-white/30">Three-Agent Consensus</span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">The Trading Council</h2>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Decisions are never unilateral. The Sentinel Council requires a majority vote from specialized autonomous systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Risk Manager */}
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] hover:translate-y-[-2px] transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-white/80" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">🛡️ Risk Manager</h3>
            <p className="text-xs text-white/50 leading-relaxed mb-4">
              Enforces stop-loss parameters, verifies account size vs execution limits, and overrides trade targets if market volatility rises above historic safety baselines.
            </p>
            <span className="text-[10px] font-mono text-white/30 tracking-wider">CONSERVATIVE PIPELINE</span>
          </div>

          {/* Card 2: Market Analyst */}
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] hover:translate-y-[-2px] transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Activity className="w-5 h-5 text-white/80" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">📊 Market Analyst</h3>
            <p className="text-xs text-white/50 leading-relaxed mb-4">
              Listens to real-time price feeds, compares CoinGecko and Crypto.com oracle outputs, and scans global news streams via VADER lexicon weights.
            </p>
            <span className="text-[10px] font-mono text-white/30 tracking-wider">DATA-DRIVEN PIPELINE</span>
          </div>

          {/* Card 3: Execution Specialist */}
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] hover:translate-y-[-2px] transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-white/80" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">⚡ Execution Specialist</h3>
            <p className="text-xs text-white/50 leading-relaxed mb-4">
              Generates wrap/unwrap contract calls, audits pool spreads, checks Gas limit options, and fires execution packets immediately to the EVM network.
            </p>
            <span className="text-[10px] font-mono text-white/30 tracking-wider">HIGH-FREQUENCY ROUTING</span>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: SENTINELCLAMP SAFETY GUARD ═══ */}
      <section className="relative w-full py-24 border-t border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Side: Detail */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase font-mono tracking-wider text-white/40 block">Smart Contract Safety</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">On-Chain Safe clamping.</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Autonomous trading can be volatile. That&apos;s why Sentinel uses SentinelClamp™: 
                a hardcoded safe threshold limit directly inside the transaction router contract.
              </p>
              
              <ul className="space-y-3.5 text-xs text-white/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Max daily trade volume clamp
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Gas reserve safety limit checking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Multi-Sig / Council authorization proof on-chain
                </li>
              </ul>
            </div>

            {/* Right Side: Visual Mock Panel */}
            <div className="lg:col-span-6">
              <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                  <span className="text-xs font-semibold text-white font-mono">SentinelClamp.sol</span>
                  <span className="text-[10px] text-white/30 font-mono">Testnet V1.4</span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-white/40">DAILY LIMIT</span>
                      <span className="text-white">10.0 CRO</span>
                    </div>
                    <div className="w-full bg-white/[0.04] rounded-full h-1">
                      <div className="bg-white h-1 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-white/40">SPENT TODAY</span>
                      <span className="text-white font-bold text-emerald-400">1.2 CRO</span>
                    </div>
                    <div className="w-full bg-white/[0.04] rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: "12%" }} />
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg text-[10px] font-mono text-white/40 leading-relaxed">
                    🔐 Any attempt by the AI agent to exceed the daily limit will trigger a contract revert: 
                    <span className="text-rose-400 block mt-1">Error: SentinelClamp: Limit Exceeded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5: FINAL CTA ═══ */}
      <section className="relative w-full py-28 text-center max-w-4xl mx-auto px-6">
        <div className="space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Ready to activate?</h2>
          <p className="text-white/45 text-sm max-w-md mx-auto leading-relaxed">
            Connect your MetaMask wallet, switch to Cronos Testnet, and start deploying multi-agent capital strategies in seconds.
          </p>
          <div className="pt-4">
            <button 
              onClick={handleLaunchTerminal}
              className="mx-auto px-8 py-3.5 bg-white hover:bg-white/90 text-black font-bold rounded-full transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              <span>Access Terminal Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6 bg-black text-center relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-white/30 gap-4">
          <p>© 2026 Sentinel AI. Built for the Cronos EVM Hackathon.</p>
          <div className="flex items-center gap-6">
            <Link href="/how-it-works" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Terminal</Link>
            <a 
              href="https://github.com/ayushkumartht/Brainwave" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
