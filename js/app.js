// ================================
//  CRYPTO DASHBOARD - SINGLE FILE
//  No ES6 modules to avoid CORS issues
// ================================

// ================================
//  CRYPTOCURRENCY API UTILITIES
// ================================

class CryptoAPI {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // CORS proxy options (try multiple proxies for reliability)
    this.corsProxies = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/'
    ];
    this.currentProxyIndex = 0;
    
    this.baseURL = 'https://api.coingecko.com/api/v3';
    this.cryptoCompareURL = 'https://min-api.cryptocompare.com/data/v2';
    this.fearGreedURL = 'https://api.alternative.me/fng';
    
    // Mock data for fallback
    this.mockData = this.initializeMockData();
    
    // Track data source status
    this.dataSourceStatus = 'unknown'; // 'live', 'proxy', 'mock'
    this.updateStatusIndicator();
  }

  initializeMockData() {
    return {
      global: {
        data: {
          total_market_cap: { usd: 2500000000000 },
          total_volume: { usd: 95000000000 },
          market_cap_percentage: { btc: 42.5 }
        }
      },
      cryptos: [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          current_price: 65000,
          market_cap: 1280000000000,
          market_cap_rank: 1,
          total_volume: 25000000000,
          high_24h: 67000,
          low_24h: 63000,
          price_change_24h: 1200,
          price_change_percentage_24h: 1.87,
          price_change_percentage_7d: -2.45,
          sparkline_in_7d: { price: [64000, 65000, 66000, 65500, 64800, 65200, 65000] }
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          current_price: 3200,
          market_cap: 385000000000,
          market_cap_rank: 2,
          total_volume: 15000000000,
          high_24h: 3300,
          low_24h: 3100,
          price_change_24h: 75,
          price_change_percentage_24h: 2.4,
          price_change_percentage_7d: -1.2,
          sparkline_in_7d: { price: [3150, 3200, 3250, 3180, 3220, 3190, 3200] }
        },
        {
          id: 'binancecoin',
          symbol: 'bnb',
          name: 'BNB',
          image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
          current_price: 580,
          market_cap: 89000000000,
          market_cap_rank: 3,
          total_volume: 1500000000,
          high_24h: 595,
          low_24h: 575,
          price_change_24h: 8.5,
          price_change_percentage_24h: 1.49,
          price_change_percentage_7d: 3.2,
          sparkline_in_7d: { price: [570, 575, 580, 585, 578, 582, 580] }
        },
        {
          id: 'cardano',
          symbol: 'ada',
          name: 'Cardano',
          image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
          current_price: 0.48,
          market_cap: 17000000000,
          market_cap_rank: 4,
          total_volume: 800000000,
          high_24h: 0.51,
          low_24h: 0.46,
          price_change_24h: 0.015,
          price_change_percentage_24h: 3.2,
          price_change_percentage_7d: -0.8,
          sparkline_in_7d: { price: [0.47, 0.48, 0.49, 0.47, 0.48, 0.49, 0.48] }
        },
        {
          id: 'solana',
          symbol: 'sol',
          name: 'Solana',
          image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
          current_price: 145,
          market_cap: 65000000000,
          market_cap_rank: 5,
          total_volume: 2200000000,
          high_24h: 150,
          low_24h: 142,
          price_change_24h: 3.2,
          price_change_percentage_24h: 2.26,
          price_change_percentage_7d: 4.1,
          sparkline_in_7d: { price: [140, 142, 145, 148, 144, 146, 145] }
        }
      ],
      prices: {
        bitcoin: { usd: 65000, usd_24h_change: 1.87, usd_24h_vol: 25000000000 },
        ethereum: { usd: 3200, usd_24h_change: 2.4, usd_24h_vol: 15000000000 },
        binancecoin: { usd: 580, usd_24h_change: 1.49, usd_24h_vol: 1500000000 },
        cardano: { usd: 0.48, usd_24h_change: 3.2, usd_24h_vol: 800000000 },
        solana: { usd: 145, usd_24h_change: 2.26, usd_24h_vol: 2200000000 },
        polkadot: { usd: 7.2, usd_24h_change: -0.8, usd_24h_vol: 250000000 },
        chainlink: { usd: 15.5, usd_24h_change: 1.2, usd_24h_vol: 400000000 },
        litecoin: { usd: 85, usd_24h_change: 0.9, usd_24h_vol: 800000000 }
      },
      fearGreed: {
        data: [{
          value: "65",
          value_classification: "Greed",
          timestamp: Date.now()
        }]
      },
      news: [
        {
          id: '1',
          title: 'Bitcoin Reaches New All-Time High Amid Institutional Adoption',
          body: 'Major corporations continue to add Bitcoin to their treasury reserves...',
          url: '#',
          source: 'CryptoNews',
          published_on: Math.floor(Date.now() / 1000) - 3600,
          imageurl: 'https://via.placeholder.com/300x200?text=Bitcoin+News'
        },
        {
          id: '2',
          title: 'Ethereum 2.0 Staking Reaches New Milestone',
          body: 'The amount of ETH staked in Ethereum 2.0 has reached a significant milestone...',
          url: '#',
          source: 'EthereumNews',
          published_on: Math.floor(Date.now() / 1000) - 7200,
          imageurl: 'https://via.placeholder.com/300x200?text=Ethereum+News'
        },
        {
          id: '3',
          title: 'DeFi Total Value Locked Surpasses $100 Billion',
          body: 'Decentralized Finance protocols see unprecedented growth...',
          url: '#',
          source: 'DeFiPulse',
          published_on: Math.floor(Date.now() / 1000) - 10800,
          imageurl: 'https://via.placeholder.com/300x200?text=DeFi+News'
        }
      ]
    };
  }

  async fetchWithCache(url, options = {}) {
    const cacheKey = url;
    const now = Date.now();
    
    // Check cache first
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey) > now) {
      return this.cache.get(cacheKey);
    }

    // Try direct fetch first
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store in cache
      this.cache.set(cacheKey, data);
      this.cacheExpiry.set(cacheKey, now + this.cacheTimeout);
      
      // Update status to live data
      if (this.dataSourceStatus !== 'live') {
        this.dataSourceStatus = 'live';
        this.updateStatusIndicator();
      }
      
      return data;
    } catch (error) {
      console.warn(`Direct fetch failed for ${url}:`, error.message);
      
      // Try CORS proxies
      for (let i = 0; i < this.corsProxies.length; i++) {
        const proxyIndex = (this.currentProxyIndex + i) % this.corsProxies.length;
        const proxy = this.corsProxies[proxyIndex];
        const proxiedUrl = proxy + encodeURIComponent(url);
        
        try {
          console.log(`Trying CORS proxy ${proxyIndex + 1}:`, proxy);
          
          const response = await fetch(proxiedUrl, {
            ...options,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...options.headers
            }
          });

          if (!response.ok) {
            throw new Error(`Proxy HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          // Store in cache and update successful proxy
          this.cache.set(cacheKey, data);
          this.cacheExpiry.set(cacheKey, now + this.cacheTimeout);
          this.currentProxyIndex = proxyIndex;
          
          // Update status to proxy data
          if (this.dataSourceStatus !== 'proxy') {
            this.dataSourceStatus = 'proxy';
            this.updateStatusIndicator();
          }
          
          console.log(`✅ Successfully fetched data via proxy ${proxyIndex + 1}`);
          return data;
        } catch (proxyError) {
          console.warn(`Proxy ${proxyIndex + 1} failed:`, proxyError.message);
          continue;
        }
      }
      
      // All proxies failed, return mock data
      console.warn(`All requests failed for ${url}, using mock data`);
      
      // Update status to mock data
      if (this.dataSourceStatus !== 'mock') {
        this.dataSourceStatus = 'mock';
        this.updateStatusIndicator();
      }
      
      return this.getMockDataForUrl(url);
    }
  }

  getMockDataForUrl(url) {
    if (url.includes('/global')) {
      return this.mockData.global;
    } else if (url.includes('/coins/markets')) {
      return this.mockData.cryptos;
    } else if (url.includes('/simple/price')) {
      return this.mockData.prices;
    } else if (url.includes('alternative.me/fng')) {
      return this.mockData.fearGreed;
    } else if (url.includes('cryptocompare.com') && url.includes('news')) {
      return { Data: this.mockData.news };
    }
    
    return { error: 'No mock data available' };
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

  // Get historical market data for charts
  async getMarketChart(coinId, days = 7, currency = 'usd') {
    const url = `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;
    return this.fetchWithCache(url, `chart-${coinId}-${days}`);
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
      const url = `${this.cryptoCompareURL}/news/?lang=EN&limit=${limit}`;
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

  // Update data source status
  updateStatusIndicator() {
    const indicatorElement = document.getElementById('statusIndicator');
    const textElement = document.getElementById('statusText');
    const demoBanner = document.getElementById('demoBanner');
    
    if (!indicatorElement || !textElement) return;
    
    // Remove existing classes
    indicatorElement.className = 'status-indicator';
    
    switch (this.dataSourceStatus) {
      case 'live':
        indicatorElement.classList.add('live');
        textElement.textContent = 'Live Data';
        if (demoBanner) demoBanner.style.display = 'none';
        break;
      case 'proxy':
        indicatorElement.classList.add('proxy');
        textElement.textContent = 'Proxy Data';
        if (demoBanner) demoBanner.style.display = 'none';
        break;
      case 'mock':
        indicatorElement.classList.add('mock');
        textElement.textContent = 'Demo Data';
        if (demoBanner) demoBanner.style.display = 'block';
        break;
      default:
        indicatorElement.classList.add('mock');
        textElement.textContent = 'Loading...';
        if (demoBanner) demoBanner.style.display = 'none';
    }
  }
}

// ================================
//  CHART UTILITIES & RENDERING
// ================================

class ChartManager {
  constructor() {
    this.charts = new Map();
    this.currentCoin = 'bitcoin';
    this.currentPeriod = '7';
    this.chartColors = {
      bitcoin: '#f7931a',
      ethereum: '#627eea',
      binancecoin: '#f3ba2f',
      cardano: '#0033ad',
      solana: '#9945ff',
      polkadot: '#e6007a',
      chainlink: '#375bd2',
      litecoin: '#bfbbbb'
    };
  }

  // Initialize all charts
  async initializeCharts() {
    await this.renderMainChart();
  }

  // Render the main interactive chart
  async renderMainChart() {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;

    try {
      const data = await cryptoAPI.getMarketChart(this.currentCoin, this.currentPeriod);
      const ctx = canvas.getContext('2d');

      // Destroy existing chart if it exists
      if (this.charts.has('main')) {
        this.charts.get('main').destroy();
      }

      const chart = new Chart(ctx, {
        type: 'line',
        data: this.formatChartData(data, this.currentCoin),
        options: this.getMainChartOptions()
      });

      this.charts.set('main', chart);
      await this.updateChartTitle();
    } catch (error) {
      console.error('Error rendering main chart:', error);
      this.showChartError('mainChart');
    }
  }

  // Format data for main chart
  formatChartData(data, coinId) {
    const prices = data.prices || [];
    const volumes = data.total_volumes || [];

    return {
      labels: prices.map(point => {
        const date = new Date(point[0]);
        return this.formatDateLabel(date, this.currentPeriod);
      }),
      datasets: [
        {
          label: `${coinId.toUpperCase()} Price`,
          data: prices.map(point => point[1]),
          borderColor: this.chartColors[coinId] || '#f7931a',
          backgroundColor: `${this.chartColors[coinId] || '#f7931a'}10`,
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: this.chartColors[coinId] || '#f7931a',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        },
        {
          label: 'Volume',
          data: volumes.map(point => point[1]),
          type: 'bar',
          backgroundColor: `${this.chartColors[coinId] || '#f7931a'}30`,
          borderColor: `${this.chartColors[coinId] || '#f7931a'}60`,
          borderWidth: 1,
          yAxisID: 'volume',
          order: 2
        }
      ]
    };
  }

  // Get main chart options
  getMainChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#8b949e',
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: '#21262d',
          titleColor: '#ffffff',
          bodyColor: '#8b949e',
          borderColor: '#30363d',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (context) => {
              return context[0].label;
            },
            label: (context) => {
              if (context.datasetIndex === 0) {
                return `Price: ${cryptoAPI.formatPrice(context.parsed.y)}`;
              } else {
                return `Volume: ${cryptoAPI.formatLargeNumber(context.parsed.y)}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            color: '#8b949e',
            maxTicksLimit: 10
          }
        },
        y: {
          display: true,
          position: 'left',
          grid: {
            color: '#30363d',
            borderDash: [5, 5]
          },
          ticks: {
            color: '#8b949e',
            callback: function(value) {
              return cryptoAPI.formatPrice(value);
            }
          }
        },
        volume: {
          type: 'linear',
          display: false,
          position: 'right',
          max: function(context) {
            const data = context.chart.data.datasets[1].data;
            return Math.max(...data) * 4; // Scale volume to 25% of chart height
          },
          grid: {
            display: false
          }
        }
      }
    };
  }

  // Update chart for different time periods
  async updateChartPeriod(period) {
    this.currentPeriod = period;
    await this.renderMainChart();
    this.updateActiveButton(period);
  }

  // Update chart for different coins
  async updateChartCoin(coinId) {
    this.currentCoin = coinId;
    await this.renderMainChart();
  }

  // Format date labels based on period
  formatDateLabel(date, period) {
    switch (period) {
      case '1':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '7':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case '30':
      case '90':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case '365':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
      default:
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
    }
  }

  // Update chart title
  async updateChartTitle() {
    const titleElement = document.querySelector('.chart-title');
    if (titleElement) {
      const coinName = this.currentCoin.charAt(0).toUpperCase() + 
                       this.currentCoin.slice(1);
      const periodText = this.getPeriodText(this.currentPeriod);
      titleElement.textContent = `${coinName} - ${periodText}`;
    }
    
    // Update chart stats
    try {
      const priceData = await cryptoAPI.getMultipleCoinPrices([this.currentCoin]);
      const data = priceData[this.currentCoin];
      
      if (data) {
        const currentPriceElement = document.getElementById('chartCurrentPrice');
        const priceChangeElement = document.getElementById('chartPriceChange');
        
        if (currentPriceElement) {
          currentPriceElement.textContent = cryptoAPI.formatPrice(data.usd);
        }
        
        if (priceChangeElement) {
          const change = data.usd_24h_change || 0;
          priceChangeElement.textContent = cryptoAPI.formatPercentage(change);
          priceChangeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
      }
    } catch (error) {
      console.error('Error updating chart stats:', error);
    }
  }

  // Get period text for display
  getPeriodText(period) {
    const periodMap = {
      '1': '24 Hours',
      '7': '7 Days',
      '30': '30 Days',
      '90': '3 Months',
      '365': '1 Year'
    };
    return periodMap[period] || '7 Days';
  }

  // Update active button styling
  updateActiveButton(period) {
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.period === period.toString()) {
        btn.classList.add('active');
      }
    });
  }

  // Show chart error
  showChartError(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#8b949e';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Chart data unavailable', canvas.width / 2, canvas.height / 2);
    }
  }

  // Destroy all charts
  destroyAllCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }
}

// ================================
//  ALERT MANAGER
// ================================

class AlertManager {
  constructor() {
    this.alerts = JSON.parse(localStorage.getItem('cryptoAlerts')) || [];
    this.notificationPermission = false;
    this.permissionRequested = false;
    
    // Check if notification permission was already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      this.notificationPermission = true;
      this.permissionRequested = true;
    }
  }

  async requestNotificationPermission() {
    if (!('Notification' in window) || this.permissionRequested) {
      return this.notificationPermission;
    }
    
    this.permissionRequested = true;
    const permission = await Notification.requestPermission();
    this.notificationPermission = permission === 'granted';
    return this.notificationPermission;
  }

  addAlert(coinId, targetPrice, condition = 'above') {
    const alert = {
      id: Date.now().toString(),
      coinId,
      targetPrice,
      condition,
      enabled: true,
      created: new Date().toISOString()
    };
    
    this.alerts.push(alert);
    this.saveAlerts();
    return alert;
  }

  removeAlert(alertId) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.saveAlerts();
  }

  toggleAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.enabled = !alert.enabled;
      this.saveAlerts();
    }
  }

  saveAlerts() {
    localStorage.setItem('cryptoAlerts', JSON.stringify(this.alerts));
  }

  async checkAlerts() {
    if (this.alerts.length === 0) return;

    try {
      const coinIds = [...new Set(this.alerts.map(alert => alert.coinId))];
      const prices = await cryptoAPI.getMultipleCoinPrices(coinIds);

      for (const alert of this.alerts) {
        if (!alert.enabled) continue;

        const coinData = prices[alert.coinId];
        if (!coinData) continue;

        const currentPrice = coinData.usd;
        const shouldTrigger = alert.condition === 'above' 
          ? currentPrice >= alert.targetPrice
          : currentPrice <= alert.targetPrice;

        if (shouldTrigger) {
          this.triggerAlert(alert, currentPrice);
          this.removeAlert(alert.id); // Remove after triggering
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  triggerAlert(alert, currentPrice) {
    const message = `${alert.coinId.toUpperCase()} is now ${alert.condition} ${cryptoAPI.formatPrice(alert.targetPrice)} at ${cryptoAPI.formatPrice(currentPrice)}`;
    
    if (this.notificationPermission) {
      new Notification('Price Alert', {
        body: message,
        icon: '/favicon.ico'
      });
    }
    
    console.log('Alert triggered:', message);
  }

  renderAlerts() {
    const container = document.querySelector('.alerts-widget .widget-content');
    if (!container) return;

    if (this.alerts.length === 0) {
      container.innerHTML = '<p class="text-muted">No price alerts set</p>';
      return;
    }

    container.innerHTML = this.alerts.map(alert => `
      <div class="alert-item">
        <div class="alert-info">
          <strong>${alert.coinId.toUpperCase()}</strong>
          <span>${alert.condition} ${cryptoAPI.formatPrice(alert.targetPrice)}</span>
        </div>
        <div class="alert-actions">
          <button onclick="alertManager.toggleAlert('${alert.id}')" class="btn-sm ${alert.enabled ? 'btn-danger' : 'btn-success'}">
            ${alert.enabled ? 'Disable' : 'Enable'}
          </button>
          <button onclick="alertManager.removeAlert('${alert.id}')" class="btn-sm btn-danger">Remove</button>
        </div>
      </div>
    `).join('');
  }

  startNotificationChecks() {
    // Check alerts every 30 seconds
    setInterval(() => this.checkAlerts(), 30000);
  }

  async openAddAlertModal(coinId = null) {
    // Request notification permission when user wants to create an alert
    await this.requestNotificationPermission();
    
    // Simple prompt-based alert creation for now
    const coin = coinId || prompt('Enter coin ID (e.g., bitcoin, ethereum):');
    if (!coin) return;

    const targetPrice = parseFloat(prompt('Enter target price:'));
    if (!targetPrice || targetPrice <= 0) return;

    const condition = confirm('Alert when price goes ABOVE target? (Cancel for BELOW)') ? 'above' : 'below';
    
    this.addAlert(coin.toLowerCase(), targetPrice, condition);
    this.renderAlerts();
  }
}

// ================================
//  MAIN APPLICATION CONTROLLER
// ================================

class CryptoDashboard {
  constructor() {
    this.isInitialized = false;
    this.updateInterval = null;
    this.tickerInterval = null;
    
    // Configuration
    this.config = {
      updateFrequency: 60000, // 1 minute
      tickerSpeed: 30000, // 30 seconds
      topCoinsLimit: 50,
      newsLimit: 6
    };
  }

  // Initialize the dashboard
  async init() {
    if (this.isInitialized) return;
    
    try {
      console.log('🚀 Initializing Crypto Dashboard...');
      
      // Initialize all components
      await Promise.all([
        this.initializeDashboard(),
        this.initializeEventListeners(),
        this.initializeModules()
      ]);
      
      // Start auto-update intervals
      this.startAutoUpdates();
      
      this.isInitialized = true;
      console.log('✅ Dashboard initialized successfully');
      
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      this.showErrorState(error);
    }
  }

  // Initialize dashboard components
  async initializeDashboard() {
    await Promise.all([
      this.renderHeroStats(),
      this.renderMarketOverview(),
      this.renderCryptoTable(),
      this.renderNews(),
      this.startLiveTicker()
    ]);
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Chart time period buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = e.target.dataset.period;
        if (period) {
          chartManager.updateChartPeriod(period);
        }
      });
    });

    // Search functionality
    const searchInput = document.getElementById('cryptoSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Sort filter functionality
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.handleSort(e.target.value);
      });
    }

    // Navigation - removed preventDefault to allow normal page navigation

    // Visibility change handler (pause updates when hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseUpdates();
      } else {
        this.resumeUpdates();
      }
    });
  }

  // Initialize all modules
  async initializeModules() {
    // Initialize charts
    await chartManager.initializeCharts();
    
    // Initialize alerts
    alertManager.renderAlerts();
    alertManager.startNotificationChecks();
  }

  // Render hero section stats
  async renderHeroStats() {
    try {
      const [globalData, btcData, fearGreedData] = await Promise.all([
        cryptoAPI.getGlobalData(),
        cryptoAPI.getMultipleCoinPrices(['bitcoin']),
        cryptoAPI.getFearGreedIndex()
      ]);

      const global = globalData.data;
      const btcPrice = btcData.bitcoin.usd;
      const fearGreed = fearGreedData.data[0];

      // Update hero stats
      document.getElementById('heroMarketCap').textContent = 
        '$' + cryptoAPI.formatLargeNumber(global.total_market_cap.usd);
      document.getElementById('heroVolume').textContent = 
        '$' + cryptoAPI.formatLargeNumber(global.total_volume.usd);
      document.getElementById('heroBtcPrice').textContent = 
        cryptoAPI.formatPrice(btcPrice);
      
      // Format Fear & Greed Index with value and correct classification
      const fearGreedElement = document.getElementById('heroFearGreed');
      if (fearGreedElement) {
        const fearGreedValue = parseInt(fearGreed.value);
        let colorClass = '';
        let textClassification = '';
        
        // Use standard Fear & Greed scale for both color and text
        if (fearGreedValue <= 24) {
          colorClass = 'extreme-fear';
          textClassification = 'Extreme Fear';
        } else if (fearGreedValue <= 49) {
          colorClass = 'fear';
          textClassification = 'Fear';
        } else if (fearGreedValue <= 74) {
          colorClass = 'neutral';
          textClassification = 'Neutral';
        } else {
          colorClass = 'greed';
          textClassification = 'Greed';
        }
        
        fearGreedElement.textContent = `${fearGreed.value} - ${textClassification}`;
        fearGreedElement.className = `stat-value ${colorClass}`;
      }
    } catch (error) {
      console.error('Error rendering hero stats:', error);
    }
  }

  // Render market overview cards
  async renderMarketOverview() {
    const container = document.querySelector('.market-overview');
    if (!container) return;

    try {
      const globalData = await cryptoAPI.getGlobalData();
      const global = globalData.data;

      const cards = [
        {
          title: 'Total Market Cap',
          value: cryptoAPI.formatLargeNumber(global.total_market_cap.usd),
          change: global.market_cap_change_percentage_24h_usd,
          prefix: '$'
        },
        {
          title: '24h Volume',
          value: cryptoAPI.formatLargeNumber(global.total_volume.usd),
          change: null,
          prefix: '$'
        },
        {
          title: 'BTC Dominance',
          value: global.market_cap_percentage.btc.toFixed(1),
          change: null,
          suffix: '%'
        },
        {
          title: 'Active Cryptocurrencies',
          value: global.active_cryptocurrencies.toLocaleString(),
          change: null
        }
      ];

      container.innerHTML = cards.map(card => this.getStatCardHTML(card)).join('');
    } catch (error) {
      console.error('Error rendering market overview:', error);
      container.innerHTML = '<p class="text-center">Error loading market data</p>';
    }
  }

  // Get stat card HTML
  getStatCardHTML(card) {
    const changeClass = card.change ? (card.change >= 0 ? 'positive' : 'negative') : '';
    const changeHTML = card.change ? 
      `<div class="change ${changeClass}">${cryptoAPI.formatPercentage(card.change)}</div>` : '';
    
    return `
      <div class="stat-card ${card.class || ''}">
        <h3>${card.title}</h3>
        <div class="value">
          ${card.prefix || ''}${card.value}${card.suffix || ''}
        </div>
        ${card.subtitle ? `<div class="subtitle">${card.subtitle}</div>` : ''}
        ${changeHTML}
      </div>
    `;
  }

  // Get Fear & Greed classification class
  getFearGreedClass(value) {
    if (value <= 25) return 'fear';
    if (value <= 45) return 'neutral';
    if (value <= 75) return 'greed';
    return 'extreme-greed';
  }

  // Render cryptocurrency table
  async renderCryptoTable() {
    const container = document.querySelector('.price-table tbody');
    if (!container) return;

    // Show loading
    container.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

    try {
      const cryptos = await cryptoAPI.getTopCryptos(this.config.topCoinsLimit);
      
      container.innerHTML = cryptos.map((crypto, index) => 
        this.getCryptoRowHTML(crypto, index + 1)
      ).join('');

    } catch (error) {
      console.error('Error rendering crypto table:', error);
      container.innerHTML = '<tr><td colspan="7" class="text-center">Error loading data</td></tr>';
    }
  }

  // Get cryptocurrency row HTML
  getCryptoRowHTML(crypto, rank) {
    const change24h = crypto.price_change_percentage_24h || 0;
    const changeClass = change24h >= 0 ? 'positive' : 'negative';
    const change24hPrice = (crypto.current_price || 0) * (change24h / 100);
    
    return `
      <tr onclick="chartManager.updateChartCoin('${crypto.id}')" style="cursor: pointer;">
        <td><strong>${rank}</strong></td>
        <td>
          <div class="coin-info">
            <img src="${crypto.image}" alt="${crypto.name}" class="coin-icon">
            <div>
              <div class="coin-name">${crypto.name}</div>
              <div class="coin-symbol">${crypto.symbol.toUpperCase()}</div>
            </div>
          </div>
        </td>
        <td>
          <strong>${cryptoAPI.formatPrice(crypto.current_price)}</strong>
        </td>
        <td class="price-change ${changeClass}">
          <div>${cryptoAPI.formatPercentage(change24h)}</div>
          <small>${change24h >= 0 ? '+' : ''}${cryptoAPI.formatPrice(change24hPrice)}</small>
        </td>
        <td>
          <strong>${cryptoAPI.formatLargeNumber(crypto.market_cap)}</strong>
        </td>
        <td>
          <strong>${cryptoAPI.formatLargeNumber(crypto.total_volume)}</strong>
        </td>
        <td>
          <div class="supply-info">
            <strong>${cryptoAPI.formatLargeNumber(crypto.circulating_supply)}</strong>
            <small>${crypto.symbol.toUpperCase()}</small>
          </div>
        </td>
        <td>
          <div class="mini-chart" style="width: 80px; height: 40px; background: ${change24h >= 0 ? '#238636' : '#da3633'}20; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 0.7rem; color: ${change24h >= 0 ? '#238636' : '#da3633'};">
              ${change24h >= 0 ? '📈' : '📉'} 7d
            </span>
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="set-alert-btn" onclick="event.stopPropagation(); alertManager.openAddAlertModal('${crypto.id}')" title="Set Price Alert">
              🔔
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // Update Fear & Greed meter
  async updateFearGreedMeter() {
    try {
      const fearGreedData = await cryptoAPI.getFearGreedIndex();
      const fearGreed = fearGreedData.data[0];
      
      const value = parseInt(fearGreed.value);
      
      // Use standard Fear & Greed scale for classification
      let label = '';
      if (value <= 24) {
        label = 'Extreme Fear';
      } else if (value <= 49) {
        label = 'Fear';
      } else if (value <= 74) {
        label = 'Neutral';
      } else {
        label = 'Greed';
      }
      
      // Update meter with cool animation
      this.animateFearGreedMeter(value, label);
      
      // Highlight the appropriate scale item
      this.highlightFearGreedScale(value);
      
    } catch (error) {
      console.error('Error updating Fear & Greed meter:', error);
      // Set default values if API fails and animate to them
      this.animateFearGreedMeter(50, 'Neutral');
    }
  }

  // Animate the Fear & Greed meter with cool effects
  animateFearGreedMeter(targetValue, label) {
    const meterFill = document.getElementById('fearGreedMeter');
    const meterValue = document.getElementById('fearGreedValue');
    const meterLabel = document.getElementById('fearGreedLabel');
    
    if (!meterFill || !meterValue || !meterLabel) return;

    // Get current value or start from 0
    const currentValue = parseInt(meterValue.textContent) || 0;
    
    // Set color based on fear/greed level
    let meterColor = '#ff9813';
    let glowColor = 'rgba(255, 152, 19, 0.4)';
    
    if (targetValue <= 24) {
      meterColor = '#ff4444'; // Extreme Fear - Red
      glowColor = 'rgba(255, 68, 68, 0.4)';
    } else if (targetValue <= 49) {
      meterColor = '#ff8800'; // Fear - Orange  
      glowColor = 'rgba(255, 136, 0, 0.4)';
    } else if (targetValue <= 74) {
      meterColor = '#888888'; // Neutral - Gray
      glowColor = 'rgba(136, 136, 136, 0.4)';
    } else {
      meterColor = '#00cc00'; // Greed - Green
      glowColor = 'rgba(0, 204, 0, 0.4)';
    }

    // Add updating class for special animation
    meterValue.classList.add('updating');
    setTimeout(() => meterValue.classList.remove('updating'), 1000);

    // Animate the number counting
    this.animateNumberCount(meterValue, currentValue, targetValue, 1500);
    
    // Update label with fade effect
    meterLabel.style.opacity = '0';
    setTimeout(() => {
      meterLabel.textContent = label;
      meterLabel.style.opacity = '1';
    }, 750);

    // Animate the meter fill
    this.animateMeterFill(meterFill, meterValue, currentValue, targetValue, meterColor, glowColor);
  }

  // Animate number counting
  animateNumberCount(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      element.textContent = Math.round(current);
    }, 16);
  }

  // Animate the meter fill with smooth progression
  animateMeterFill(meterFill, meterValue, startValue, endValue, color, glowColor) {
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smooth animation
      const easeProgress = this.easeOutCubic(progress);
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      const rotation = (currentValue / 100) * 360;
      
      // Update the conic gradient
      meterFill.style.background = `conic-gradient(
        ${color} 0deg ${rotation}deg,
        var(--border-color) ${rotation}deg 360deg
      )`;
      
      // Update glow effect
      meterFill.style.filter = `drop-shadow(0 0 10px ${glowColor})`;
      
      // Update meter value color
      meterValue.style.color = color;
      meterValue.style.textShadow = `0 0 10px ${glowColor}`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Add completion sparkle effect
        this.addSparkleEffect(meterFill);
      }
    };
    
    requestAnimationFrame(animate);
  }

  // Easing function for smooth animation
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Add sparkle effect when animation completes
  addSparkleEffect(element) {
    // Create temporary sparkle elements
    for (let i = 0; i < 6; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: white;
        border-radius: 50%;
        pointer-events: none;
        z-index: 20;
        animation: sparkleAnimation 1s ease-out forwards;
      `;
      
      // Random position around the meter
      const angle = (i / 6) * 360;
      const radius = 110;
      const x = Math.cos(angle * Math.PI / 180) * radius;
      const y = Math.sin(angle * Math.PI / 180) * radius;
      
      sparkle.style.left = `calc(50% + ${x}px)`;
      sparkle.style.top = `calc(50% + ${y}px)`;
      
      element.parentElement.appendChild(sparkle);
      
      // Remove sparkle after animation
      setTimeout(() => sparkle.remove(), 1000);
    }
    
    // Add sparkle animation keyframes if not exists
    if (!document.querySelector('#sparkle-keyframes')) {
      const style = document.createElement('style');
      style.id = 'sparkle-keyframes';
      style.textContent = `
        @keyframes sparkleAnimation {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(360deg);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Highlight the appropriate scale item based on fear/greed value
  highlightFearGreedScale(value) {
    // Remove previous highlights
    document.querySelectorAll('.scale-item-large').forEach(item => {
      item.style.transform = '';
      item.style.boxShadow = '';
    });
    
    // Determine which scale item to highlight
    let targetClass = '';
    if (value <= 24) {
      targetClass = 'extreme-fear';
    } else if (value <= 49) {
      targetClass = 'fear';
    } else if (value <= 74) {
      targetClass = 'neutral';
    } else {
      targetClass = 'greed';
    }
    
    // Highlight the appropriate scale item
    const targetItem = document.querySelector(`.scale-item-large.${targetClass}`);
    if (targetItem) {
      targetItem.style.transform = 'translateY(-4px) scale(1.02)';
      targetItem.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    }
  }

  // Handle sort functionality
  handleSort(sortBy) {
    const tbody = document.querySelector('.price-table tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'price':
          aVal = parseFloat(a.cells[2].textContent.replace(/[$,]/g, ''));
          bVal = parseFloat(b.cells[2].textContent.replace(/[$,]/g, ''));
          break;
        case 'change':
          aVal = parseFloat(a.cells[3].textContent.replace(/[%+]/g, ''));
          bVal = parseFloat(b.cells[3].textContent.replace(/[%+]/g, ''));
          break;
        case 'volume':
          aVal = this.parseValue(a.cells[5].textContent);
          bVal = this.parseValue(b.cells[5].textContent);
          break;
        default: // market_cap
          aVal = this.parseValue(a.cells[4].textContent);
          bVal = this.parseValue(b.cells[4].textContent);
      }
      
      return bVal - aVal; // Descending order
    });
    
    // Re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    
    // Update last update time
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
  }

  // Parse formatted values (e.g., "1.2B", "500M") to numbers
  parseValue(str) {
    const num = parseFloat(str.replace(/[$,]/g, ''));
    if (str.includes('T')) return num * 1e12;
    if (str.includes('B')) return num * 1e9;
    if (str.includes('M')) return num * 1e6;
    if (str.includes('K')) return num * 1e3;
    return num;
  }

  // Start live ticker
  async startLiveTicker() {
    const tickerContainer = document.querySelector('.ticker-content');
    if (!tickerContainer) return;

    const updateTicker = async () => {
      try {
        const topCoins = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 'polkadot', 'chainlink', 'litecoin'];
        const prices = await cryptoAPI.getMultipleCoinPrices(topCoins);
        
        const tickerHTML = Object.entries(prices).map(([coinId, data]) => {
          const change = data.usd_24h_change || 0;
          const changeClass = change >= 0 ? 'positive' : 'negative';
          
          return `
            <div class="ticker-item">
              <span class="ticker-symbol">${coinId.toUpperCase()}</span>
              <span class="ticker-price">${cryptoAPI.formatPrice(data.usd)}</span>
              <span class="ticker-change ${changeClass}">${cryptoAPI.formatPercentage(change)}</span>
            </div>
          `;
        }).join('');
        
        tickerContainer.innerHTML = tickerHTML;
      } catch (error) {
        console.error('Error updating ticker:', error);
      }
    };

    // Initial update
    await updateTicker();
    
    // Set interval for updates
    this.tickerInterval = setInterval(updateTicker, this.config.tickerSpeed);
  }

  // Render news section
  async renderNews() {
    const container = document.querySelector('.news-widget .widget-content');
    if (!container) return;

    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      const articles = await cryptoAPI.getCryptoNews(this.config.newsLimit);
      
      if (articles.length === 0) {
        container.innerHTML = '<p class="text-center">No news available</p>';
        return;
      }

      container.innerHTML = articles.map(article => this.getNewsItemHTML(article)).join('');
    } catch (error) {
      console.error('Error rendering news:', error);
      container.innerHTML = '<p class="text-center">Error loading news</p>';
    }
  }

  // Get news item HTML
  getNewsItemHTML(article) {
    const publishedDate = new Date(article.published_on * 1000);
    const timeAgo = this.getTimeAgo(publishedDate);
    
    return `
      <div class="news-item">
        <img src="${article.imageurl}" alt="News" class="news-image" 
             onerror="this.src='https://via.placeholder.com/80x60/333/fff?text=News'">
        <div class="news-content">
          <h4>${article.title}</h4>
          <p>${article.body.substring(0, 120)}...</p>
          <div class="news-meta">
            <span>${article.source_info.name}</span> • 
            <span>${timeAgo}</span>
          </div>
          <a href="${article.url}" target="_blank" class="news-link">Read More</a>
        </div>
      </div>
    `;
  }

  // Handle search functionality
  handleSearch(query) {
    const rows = document.querySelectorAll('.price-table tbody tr');
    const searchTerm = query.toLowerCase();

    rows.forEach(row => {
      const coinName = row.querySelector('.coin-name')?.textContent.toLowerCase() || '';
      const coinSymbol = row.querySelector('.coin-symbol')?.textContent.toLowerCase() || '';
      
      if (coinName.includes(searchTerm) || coinSymbol.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Navigate to section - removed since we're using multi-page navigation

  // Start auto-updates
  startAutoUpdates() {
    this.updateInterval = setInterval(async () => {
      await Promise.all([
        this.renderHeroStats(),
        this.renderMarketOverview(),
        this.renderCryptoTable(),
        this.updateFearGreedMeter()
      ]);
      
      // Update last update time
      document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    }, this.config.updateFrequency);
  }

  // Pause updates
  pauseUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }

  // Resume updates
  resumeUpdates() {
    if (!this.updateInterval) {
      this.startAutoUpdates();
    }
    if (!this.tickerInterval) {
      this.startLiveTicker();
    }
  }

  // Show error state
  showErrorState(error) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-banner';
    errorContainer.innerHTML = `
      <div class="error-content">
        <h3>⚠️ Dashboard Error</h3>
        <p>${error.message || 'An unexpected error occurred'}</p>
        <button onclick="location.reload()" class="retry-btn">Retry</button>
      </div>
    `;
    document.body.prepend(errorContainer);
  }

  // Utility: Get time ago string
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Clean up on page unload
  cleanup() {
    this.pauseUpdates();
    chartManager.destroyAllCharts();
  }
}

// ================================
//  INITIALIZE APPLICATION
// ================================

// Initialize all managers
// Create global instances
const cryptoAPI = new CryptoAPI();
const chartManager = new ChartManager();
const alertManager = new AlertManager();
const dashboard = new CryptoDashboard();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  dashboard.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  dashboard.cleanup();
});

// Make instances globally available
window.dashboard = dashboard;
window.cryptoAPI = cryptoAPI;
window.chartManager = chartManager;
window.alertManager = alertManager;

// Banner close function
function closeDemoBanner() {
  const demoBanner = document.getElementById('demoBanner');
  if (demoBanner) {
    demoBanner.style.display = 'none';
  }
} 