'use client'

import React, { useEffect, useState } from "react";
import { Vortex } from "@/components/ui/vortex";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import Link from "next/link";
import { Shield, Zap, Terminal, Activity, ArrowRight, Github, ExternalLink } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Track if we've already shown the connect toast this session
  const [hasShownConnectToast, setHasShownConnectToast] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('walletConnectToastShown') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isConnected && address && !hasShownConnectToast) {
      toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`, {
        duration: 3000,
      });
      setHasShownConnectToast(true);
      sessionStorage.setItem('walletConnectToastShown', 'true');
    }
    
    if (!isConnected && hasShownConnectToast) {
      setHasShownConnectToast(false);
      sessionStorage.removeItem('walletConnectToastShown');
    }
  }, [isConnected, address, hasShownConnectToast]);

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
    <div className="w-full min-h-screen bg-black text-white overflow-x-hidden relative selection:bg-white selection:text-black">
      {/* Minimal Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-black/60 border-b border-white/5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 bg-white text-black rounded-lg flex items-center justify-center font-bold text-base shadow-sm">
              S
            </div>
            <div>
              <span className="text-white font-semibold text-lg tracking-tight block">Sentinel AI</span>
              <span className="text-neutral-400 text-xs tracking-wider uppercase">Cronos Autonomous Trader</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link 
              href="/how-it-works"
              className="text-sm text-neutral-400 hover:text-white transition-colors hidden sm:block"
            >
              Documentation
            </Link>

            {isConnected && address ? (
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-full flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span className="text-neutral-200 text-xs font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <button 
                  onClick={handleDisconnect}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium rounded-full transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={handleConnect}
                className="px-5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-full transition-all duration-200 shadow-md transform hover:scale-105"
              >
                Connect Wallet
              </button>
            )}
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative w-full min-h-screen flex items-center justify-center pt-20 pb-16">
        <Vortex
          backgroundColor="black"
          rangeY={800}
          particleCount={350}
          baseHue={0}
          className="flex items-center flex-col justify-center px-4 md:px-10 py-12 w-full min-h-screen"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Minimal Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              <span className="text-xs tracking-wide uppercase text-neutral-300 font-medium">Cronos EVM Testnet Live</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-white"
            >
              Autonomous DeFi.
              <br />
              <span className="text-neutral-400 font-light">Guarded on-chain.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-neutral-400 text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
            >
              A 24/7 multi-agent trading council with real-time NLP sentiment analysis,
              strict SentinelClamp spending safety, and autonomous testnet execution.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <button 
                onClick={handleLaunchTerminal}
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-full transition-all duration-200 shadow-xl flex items-center justify-center gap-2 group"
              >
                <span>Launch Terminal</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <Link 
                href="/how-it-works"
                className="w-full sm:w-auto px-7 py-3.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-200 hover:text-white font-medium rounded-full border border-neutral-800 hover:border-neutral-600 transition-all flex items-center justify-center gap-2"
              >
                <span>System Architecture</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </Link>
            </motion.div>

            {/* Feature Cards Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto"
            >
              <div className="p-5 rounded-2xl border border-white/10 bg-neutral-950/60 backdrop-blur-md">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">SentinelClamp Guard</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Smart contract limits daily spending autonomously so AI never over-trades your funds.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-neutral-950/60 backdrop-blur-md">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">VADER NLP & RSS Feed</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Keyless real-time market sentiment parsing across CoinGecko and live CryptoPanic feeds.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-neutral-950/60 backdrop-blur-md">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
                  <Terminal className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">Multi-Agent Voting</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  3 AI agents (Risk Manager, Market Analyst, Executioner) form consensus on every swap.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </Vortex>
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-900 py-6 px-6 bg-black text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© 2026 Sentinel AI Trader. Built on Cronos EVM.</p>
          <div className="flex items-center gap-6">
            <Link href="/how-it-works" className="hover:text-neutral-300 transition-colors">How It Works</Link>
            <Link href="/dashboard" className="hover:text-neutral-300 transition-colors">Dashboard</Link>
            <a 
              href="https://github.com/ayushkumartht/Brainwave" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition-colors flex items-center gap-1"
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
