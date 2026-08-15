"""
CLI Runner for Keyless Price & Market Sentiment Tracking
- CoinGecko Public API (No API key)
- CryptoPanic & Google News RSS feeds (No API key)
- VADER Sentiment Engine (No API key)
"""

import os
import sys

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure src path is added
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))


from services.public_market_tracker import PublicMarketTracker

def main():
    print("=" * 65)
    print("🌐 CRONOS SENTINEL - 100% KEYLESS MARKET DATA & SENTINEL TRACKER")
    print("=" * 65)
    print("🔹 Public Sources Enabled:")
    print("   • CoinGecko Public API (Live Price, 24h Change, Volume)")
    print("   • CryptoPanic RSS Feed (Real-Time Crypto Headlines)")
    print("   • Google News RSS Feed (Cronos & Crypto News)")
    print("   • VADER Sentiment Analyzer (Rule-Based NLP)")
    print("=" * 65)
    
    tracker = PublicMarketTracker()
    report = tracker.get_complete_market_analysis()
    
    print("\n📊 INTELLIGENCE SUMMARY:")
    print(f"   • Token: {report['token'].upper()}")
    print(f"   • Live Price: ${report['price_data']['price']:.6f} USD")
    print(f"   • 24h Price Change: {report['price_data']['change_24h']:+.2f}%")
    print(f"   • 24h Volume: ${report['price_data']['volume_24h']:,.0f} USD")
    print(f"   • Price Data Source: {report['price_data']['source']}")
    print()
    print("📰 SENTIMENT BREAKDOWN:")
    print(f"   • CoinGecko Community Score: {report['sentiment_scores']['coingecko_community']:.2f}")
    print(f"   • RSS News Score (VADER): {report['sentiment_scores']['rss_news_vader']:.2f}")
    print(f"   • Articles Processed: {report['news_rss_metrics']['articles_count']} ({report['news_rss_metrics']['cryptopanic_count']} CryptoPanic + {report['news_rss_metrics']['google_news_count']} Google News)")
    print(f"   • Composite Sentiment Index: {report['sentiment_scores']['composite_score']} (-1.0 Bearish to +1.0 Bullish)")
    print()
    print(f"🎯 RECOMMENDED SIGNAL: {report['recommendation']}")
    print(f"🛡️  STATUS: {report['keyless_status']}")
    print("=" * 65)

if __name__ == "__main__":
    main()
