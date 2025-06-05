// ================================
//  CRYPTOCURRENCY API UTILITIES
// ================================

class CryptoAPI {
  constructor() {
    this.baseURL = 'https://api.coingecko.com/api/v3';
    this.newsURL = 'https://min-api.cryptocompare.com/data/v2/news';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute
  }

  // Generic fetch with error handling and caching
  async fetchWithCache(url, cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      // Return cached data if available, even if expired
      if (cached) return cached.data;
      throw error;
    }
  }

  // Get global market data
  async getGlobalData() {
    const url = `${this.baseURL}/global`;
    return this.fetchWithCache(url, 'global');
  }

  // Get top cryptocurrencies with market data
  async getTopCryptos(limit = 100, currency = 'usd') {
    const url = `${this.baseURL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d`;
    return this.fetchWithCache(url, `top-cryptos-${limit}`);
  }

  // Get specific coin data
  async getCoinData(coinId, currency = 'usd') {
    const url = `${this.baseURL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    return this.fetchWithCache(url, `coin-${coinId}`);
  }

  // Get historical market data for charts
  async getMarketChart(coinId, days = 7, currency = 'usd') {
    const url = `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;
    return this.fetchWithCache(url, `chart-${coinId}-${days}`);
  }

  // Get OHLC data for candlestick charts
  async getOHLCData(coinId, days = 7, currency = 'usd') {
    const url = `${this.baseURL}/coins/${coinId}/ohlc?vs_currency=${currency}&days=${days}`;
    return this.fetchWithCache(url, `ohlc-${coinId}-${days}`);
  }

  // Get trending coins
  async getTrendingCoins() {
    const url = `${this.baseURL}/search/trending`;
    return this.fetchWithCache(url, 'trending');
  }

  // Get Fear and Greed Index
  async getFearGreedIndex() {
    try {
      const url = 'https://api.alternative.me/fng/?limit=1';
      return this.fetchWithCache(url, 'fear-greed');
    } catch (error) {
      console.error('Fear & Greed API error:', error);
      return { data: [{ value: '50', value_classification: 'Neutral' }] };
    }
  }

  // Get cryptocurrency news
  async getCryptoNews(limit = 6) {
    try {
      const url = `${this.newsURL}/?lang=EN&limit=${limit}`;
      const data = await this.fetchWithCache(url, 'crypto-news');
      return data.Data || [];
    } catch (error) {
      console.error('News API error:', error);
      return [];
    }
  }

  // Search cryptocurrencies
  async searchCoins(query) {
    const url = `${this.baseURL}/search?query=${encodeURIComponent(query)}`;
    const data = await this.fetchWithCache(url, `search-${query}`);
    return data.coins || [];
  }

  // Get price data for multiple coins (for live ticker)
  async getMultipleCoinPrices(coinIds, currency = 'usd') {
    const ids = coinIds.join(',');
    const url = `${this.baseURL}/simple/price?ids=${ids}&vs_currencies=${currency}&include_24hr_change=true&include_24hr_vol=true`;
    return this.fetchWithCache(url, `prices-${ids}`);
  }

  // Get supported currencies
  async getSupportedCurrencies() {
    const url = `${this.baseURL}/simple/supported_vs_currencies`;
    return this.fetchWithCache(url, 'currencies');
  }

  // Format price with appropriate decimal places
  formatPrice(price, currency = 'USD') {
    if (price === null || price === undefined) return 'N/A';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: price < 1 ? 6 : 2,
      maximumFractionDigits: price < 1 ? 6 : 2
    });
    
    return formatter.format(price);
  }

  // Format large numbers (market cap, volume)
  formatLargeNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    
    const absNum = Math.abs(num);
    if (absNum >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (absNum >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (absNum >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (absNum >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  // Format percentage change
  formatPercentage(change) {
    if (change === null || change === undefined) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

// Create and export singleton instance
const cryptoAPI = new CryptoAPI();

// Auto-clear cache every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cryptoAPI.cache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      cryptoAPI.cache.delete(key);
    }
  }
}, 60000); // Check every minute

export default cryptoAPI; 