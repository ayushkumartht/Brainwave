"""
Keyless Public Market Tracker Service
Requires ZERO API Keys:
- Live Price & Market Metrics: CoinGecko Public API
- News & Sentiment: CryptoPanic RSS + Google News RSS + VADER Sentiment
"""

import sys
import os
from typing import Dict
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Handle directory imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from monitoring.sentiment_aggregator import SentimentAggregator
from services.cdc_price_service import get_cdc_service


class PublicMarketTracker:
    """Zero API key public market and sentiment tracking engine"""
    
    def __init__(self):
        self.sentiment_aggregator = SentimentAggregator()
        self.price_service = get_cdc_service()

    def get_complete_market_analysis(self, coin_id: str = "crypto-com-chain", query: str = "CRO Cronos crypto") -> Dict:
        """
        Fetch full keyless market intelligence report
        """
        print(f"🔄 Gathering Keyless Market Data for {coin_id}...")
        
        # 1. Fetch live price (CoinGecko Public API fallback if CDC is keyless)
        price_info = self.price_service.get_cro_price()
        
        # 2. Fetch multi-source sentiment (CoinGecko sentiment + RSS feeds + Reddit if available)
        cg_sentiment = self.sentiment_aggregator.get_coingecko_sentiment(coin_id)
        trending_info = self.sentiment_aggregator.get_trending_status(coin_id)
        rss_sentiment = self.sentiment_aggregator.real_sentiment.get_aggregated_sentiment()
        
        # 3. Calculate weighted keyless sentiment score
        cg_score = cg_sentiment.get("sentiment_score", 0.0) if cg_sentiment else 0.0
        rss_score = rss_sentiment.get("sentiment_score", 0.0) if rss_sentiment else 0.0
        
        # Composite score (-1.0 to +1.0)
        composite_score = round((0.4 * cg_score) + (0.6 * rss_score), 2)
        
        # Signal recommendation
        if composite_score >= 0.35:
            recommendation = "BULLISH 🚀"
        elif composite_score <= -0.35:
            recommendation = "BEARISH 📉"
        else:
            recommendation = "NEUTRAL ⚖️"

        return {
            "token": coin_id,
            "timestamp": datetime.now().isoformat(),
            "price_data": price_info,
            "coingecko_metrics": {
                "votes_up_pct": cg_sentiment.get("sentiment_votes_up", 50) if cg_sentiment else 50,
                "is_trending": trending_info.get("is_trending", False) if trending_info else False
            },
            "news_rss_metrics": {
                "source": rss_sentiment.get("source"),
                "articles_count": rss_sentiment.get("articles_count", 0),
                "cryptopanic_count": rss_sentiment.get("cryptopanic_count", 0),
                "google_news_count": rss_sentiment.get("google_news_count", 0),
                "sample_headlines": rss_sentiment.get("sample_headlines", [])
            },
            "sentiment_scores": {
                "coingecko_community": cg_score,
                "rss_news_vader": rss_score,
                "composite_score": composite_score
            },
            "recommendation": recommendation,
            "keyless_status": "✅ 100% Keyless Active (CoinGecko Public + RSS feeds)"
        }


if __name__ == "__main__":
    tracker = PublicMarketTracker()
    report = tracker.get_complete_market_analysis()
    print("\n" + "=" * 60)
    print("📊 KEYLESS MARKET INTELLIGENCE REPORT")
    print("=" * 60)
    print(f"💰 Price: ${report['price_data']['price']} (24h Change: {report['price_data']['change_24h']:+.2f}%)")
    print(f"📡 Price Source: {report['price_data']['source']}")
    print(f"📰 News Articles Analyzed: {report['news_rss_metrics']['articles_count']}")
    print(f"   - CryptoPanic: {report['news_rss_metrics']['cryptopanic_count']}")
    print(f"   - Google News: {report['news_rss_metrics']['google_news_count']}")
    print(f"🧠 Composite Sentiment Score: {report['sentiment_scores']['composite_score']} / 1.0")
    print(f"🎯 Market Signal: {report['recommendation']}")
    print("=" * 60)
