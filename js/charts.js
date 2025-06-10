// ================================
//  UNIFIED CHARTS SYSTEM
// ================================

class ChartsPageManager {
  constructor() {
    this.charts = {};
    this.currentCoin = 'bitcoin';
    this.currentPeriod = 7;
    this.updateInterval = null;
    
    // Coin configuration with real data
    this.coinConfig = {
      bitcoin: { name: 'Bitcoin', symbol: 'BTC', color: '#f7931a' },
      ethereum: { name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
      binancecoin: { name: 'Binance Coin', symbol: 'BNB', color: '#f3ba2f' },
      cardano: { name: 'Cardano', symbol: 'ADA', color: '#0033ad' },
      solana: { name: 'Solana', symbol: 'SOL', color: '#14f195' },
      polkadot: { name: 'Polkadot', symbol: 'DOT', color: '#e6007a' },
      chainlink: { name: 'Chainlink', symbol: 'LINK', color: '#375bd2' },
      litecoin: { name: 'Litecoin', symbol: 'LTC', color: '#bfbbbb' }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Charts Page Manager...');
    
    // Wait for CryptoAPI to be available
    await this.waitForAPI();
    
    // Initialize all components
    await this.createAllCharts();
    this.setupEventListeners();
    this.startAutoUpdates();
    
    console.log('✅ Charts Page Manager initialized');
  }

  async waitForAPI() {
    let attempts = 0;
    while (!window.cryptoAPI && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!window.cryptoAPI) {
      throw new Error('CryptoAPI not available');
    }
  }

  async createAllCharts() {
    try {
      // Check if Chart.js is available
      if (typeof Chart === 'undefined') {
        console.error('Chart.js not available');
        return;
      }

      // Get current coin data
      const coinData = await this.getCoinData(this.currentCoin);
      
      // Create main chart
      await this.createMainChart(coinData);
      
      // Create mini charts for top 3 coins
      await this.createMiniCharts();
      
      // Update technical analysis
      this.updateTechnicalAnalysis(coinData);
      
      console.log('✅ All charts created successfully');
    } catch (error) {
      console.error('❌ Error creating charts:', error);
      this.showErrorState();
    }
  }

  async getCoinData(coinId) {
    try {
      // Try API first, but handle structure carefully
      const priceData = await window.cryptoAPI.getMultipleCoinPrices([coinId]);
      
      // Check if data exists and has expected structure
      if (priceData && priceData[coinId] && priceData[coinId].usd) {
        const chartData = await window.cryptoAPI.getMarketChart(coinId, this.currentPeriod);
        const coin = priceData[coinId];
        
        return {
          id: coinId,
          name: this.coinConfig[coinId]?.name || coinId,
          symbol: this.coinConfig[coinId]?.symbol || coinId.toUpperCase(),
          color: this.coinConfig[coinId]?.color || '#666',
          price: coin.usd,
          change24h: coin.usd_24h_change || 0,
          marketCap: coin.usd_market_cap || 0,
          volume24h: coin.usd_24h_vol || 0,
          chartData: chartData.prices || []
        };
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error(`API failed for ${coinId}, using demo data:`, error);
      return this.getDemoData(coinId);
    }
  }

  getDemoData(coinId) {
    const demoData = {
      bitcoin: { price: 67234, change24h: 2.5, marketCap: 1320000000000, volume24h: 28500000000 },
      ethereum: { price: 3245, change24h: 1.8, marketCap: 390000000000, volume24h: 15200000000 },
      binancecoin: { price: 520, change24h: -0.5, marketCap: 75000000000, volume24h: 2800000000 },
      cardano: { price: 0.52, change24h: 3.2, marketCap: 18000000000, volume24h: 850000000 }
    };

    const data = demoData[coinId] || demoData.bitcoin;
    return {
      id: coinId,
      name: this.coinConfig[coinId]?.name || coinId,
      symbol: this.coinConfig[coinId]?.symbol || coinId.toUpperCase(),
      color: this.coinConfig[coinId]?.color || '#666',
      price: data.price,
      change24h: data.change24h,
      marketCap: data.marketCap,
      volume24h: data.volume24h,
      chartData: this.generateDemoChartData(data.price, data.change24h)
    };
  }

  generateDemoChartData(basePrice, change24h) {
    const points = this.currentPeriod === 1 ? 24 : 30; // 24 hours or 30 days worth of data
    const data = [];
    const now = Date.now();
    
    for (let i = points - 1; i >= 0; i--) {
      const hoursBack = this.currentPeriod === 1 ? i : i * 24; // Hourly for 24h, daily for longer periods
      const timestamp = now - (hoursBack * 60 * 60 * 1000);
      
      // Create realistic price movement
      const progress = (points - 1 - i) / (points - 1); // 0 to 1
      const trendFactor = (change24h / 100) * progress; // Apply gradual trend
      const randomVariation = (Math.random() - 0.5) * 0.05; // ±2.5% random variation
      
      const price = basePrice * (1 + trendFactor + randomVariation);
      data.push([timestamp, Math.max(0, price)]); // Ensure no negative prices
    }
    
    return data;
  }

  async createMainChart(coinData) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;

    // Properly destroy existing chart
    if (this.charts.main) {
      this.charts.main.destroy();
      this.charts.main = null;
    }

    // Prepare chart data
    const chartData = this.formatChartData(coinData.chartData);

    this.charts.main = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: coinData.name,
          data: chartData.prices,
          borderColor: coinData.color,
          backgroundColor: `${coinData.color}20`,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: '#333' },
            ticks: { color: '#999' }
          },
          x: {
            grid: { color: '#333' },
            ticks: { color: '#999' }
          }
        }
      }
    });

    // Update chart info
    this.updateChartInfo(coinData);
  }

  async createMiniCharts() {
    // Simple demo data that works immediately
    const miniData = [
      { id: 'ethChart', priceId: 'ethPrice', changeId: 'ethChange', price: 3245, change: 1.8, color: '#627eea', data: [3100, 3150, 3200, 3180, 3220, 3245] },
      { id: 'bnbChart', priceId: 'bnbPrice', changeId: 'bnbChange', price: 520, change: -0.5, color: '#f3ba2f', data: [530, 525, 522, 518, 521, 520] },
      { id: 'adaChart', priceId: 'adaPrice', changeId: 'adaChange', price: 0.52, change: 3.2, color: '#0033ad', data: [0.50, 0.51, 0.515, 0.518, 0.522, 0.52] }
    ];

    miniData.forEach((item, index) => {
      const canvas = document.getElementById(item.id);
      if (canvas) {
        try {
          // Properly destroy existing chart
          if (this.charts[`mini${index}`]) {
            this.charts[`mini${index}`].destroy();
            this.charts[`mini${index}`] = null;
          }

          // Create chart immediately
          this.charts[`mini${index}`] = new Chart(canvas, {
            type: 'line',
            data: {
              labels: ['', '', '', '', '', ''],
              datasets: [{
                data: item.data,
                borderColor: item.color,
                backgroundColor: `${item.color}20`,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { x: { display: false }, y: { display: false } }
            }
          });

          // Update text immediately
          const priceEl = document.getElementById(item.priceId);
          const changeEl = document.getElementById(item.changeId);
          
          if (priceEl) priceEl.textContent = `$${item.price.toLocaleString()}`;
          if (changeEl) {
            changeEl.textContent = `${item.change >= 0 ? '+' : ''}${item.change}%`;
            changeEl.className = `mini-change ${item.change >= 0 ? 'positive' : 'negative'}`;
          }
        } catch (error) {
          console.error(`Error creating mini chart ${item.id}:`, error);
        }
      }
    });
  }

  formatChartData(rawData) {
    if (!rawData || rawData.length === 0) {
      return { labels: [], prices: [] };
    }

    const labels = [];
    const prices = [];

    rawData.forEach(([timestamp, price]) => {
      const date = new Date(timestamp);
      labels.push(date.toLocaleDateString());
      prices.push(price);
    });

    return { labels, prices };
  }

  updateChartInfo(coinData) {
    const periodText = this.getPeriodText(this.currentPeriod);
    
    // Update chart title
    const titleEl = document.querySelector('.chart-title');
    if (titleEl) {
      titleEl.textContent = `${coinData.name} - ${periodText}`;
    }

    // Update price info
    this.safeSetText('chartCurrentPrice', window.cryptoAPI.formatPrice(coinData.price));
    this.safeSetText('chartPriceChange', window.cryptoAPI.formatPercentage(coinData.change24h));
    this.safeSetClass('chartPriceChange', `price-change ${coinData.change24h >= 0 ? 'positive' : 'negative'}`);
  }

  updateTechnicalAnalysis(coinData) {
    if (!coinData.chartData || coinData.chartData.length === 0) {
      // Fallback to approximations if no chart data
      const high24h = coinData.price * 1.02;
      const low24h = coinData.price * 0.98;
      
      this.safeSetText('high24h', window.cryptoAPI.formatPrice(high24h));
      this.safeSetText('low24h', window.cryptoAPI.formatPrice(low24h));
    } else {
      // Use actual data from the current coin
      const prices = coinData.chartData.map(([timestamp, price]) => price);
      const high24h = Math.max(...prices);
      const low24h = Math.min(...prices);
      
      this.safeSetText('high24h', window.cryptoAPI.formatPrice(high24h));
      this.safeSetText('low24h', window.cryptoAPI.formatPrice(low24h));
    }
    
    this.safeSetText('volume24h', window.cryptoAPI.formatLargeNumber(coinData.volume24h));
    this.safeSetText('marketCap', window.cryptoAPI.formatLargeNumber(coinData.marketCap));
  }

  setupEventListeners() {
    // Time period buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        this.currentPeriod = parseInt(e.target.dataset.period);
        await this.updateCharts();
      });
    });

    // Coin selector
    const coinSelect = document.getElementById('coinSelect');
    if (coinSelect) {
      coinSelect.addEventListener('change', async (e) => {
        this.currentCoin = e.target.value;
        await this.updateCharts();
      });
    }
  }

  async updateCharts() {
    try {
      const coinData = await this.getCoinData(this.currentCoin);
      await this.createMainChart(coinData);
      this.updateTechnicalAnalysis(coinData);
    } catch (error) {
      console.error('Error updating charts:', error);
    }
  }

  startAutoUpdates() {
    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.createAllCharts();
    }, 30000);
  }

  getPeriodText(period) {
    const periods = {
      1: '24 Hours',
      7: '7 Days', 
      30: '30 Days',
      90: '3 Months',
      365: '1 Year'
    };
    return periods[period] || '7 Days';
  }

  safeSetText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
      return true;
    }
    return false;
  }

  safeSetClass(id, className) {
    const element = document.getElementById(id);
    if (element) {
      element.className = className;
      return true;
    }
    return false;
  }

  showErrorState() {
    console.log('Showing error state with demo data...');
    // Fallback to demo data
    const demoBitcoin = this.getDemoData('bitcoin');
    this.createMainChart(demoBitcoin);
    this.updateTechnicalAnalysis(demoBitcoin);
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    // Properly destroy all charts
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}

// ================================
//  INITIALIZATION
// ================================

let chartsManager;

// Initialize when page loads
window.addEventListener('load', async () => {
  console.log('Charts page loading...');
  
  // Wait a bit for other scripts to load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    chartsManager = new ChartsPageManager();
    await chartsManager.initialize();
  } catch (error) {
    console.error('Failed to initialize charts:', error);
    // Immediate fallback - create simple mini charts
    createSimpleMiniCharts();
  }
});

// Simple fallback function for mini charts
function createSimpleMiniCharts() {
  const miniData = [
    { id: 'ethChart', priceId: 'ethPrice', changeId: 'ethChange', price: 3245, change: 1.8, color: '#627eea' },
    { id: 'bnbChart', priceId: 'bnbPrice', changeId: 'bnbChange', price: 520, change: -0.5, color: '#f3ba2f' },
    { id: 'adaChart', priceId: 'adaPrice', changeId: 'adaChange', price: 0.52, change: 3.2, color: '#0033ad' }
  ];

  miniData.forEach((item, index) => {
    // Update text first
    const priceEl = document.getElementById(item.priceId);
    const changeEl = document.getElementById(item.changeId);
    
    if (priceEl) priceEl.textContent = `$${item.price.toLocaleString()}`;
    if (changeEl) {
      changeEl.textContent = `${item.change >= 0 ? '+' : ''}${item.change}%`;
      changeEl.className = `mini-change ${item.change >= 0 ? 'positive' : 'negative'}`;
    }

    // Create simple chart if Chart.js is available
    const canvas = document.getElementById(item.id);
    if (canvas && typeof Chart !== 'undefined') {
      new Chart(canvas, {
        type: 'line',
        data: {
          labels: ['', '', '', '', '', ''],
          datasets: [{
            data: [90, 92, 88, 95, 98, 100],
            borderColor: item.color,
            backgroundColor: `${item.color}20`,
            fill: true,
            pointRadius: 0,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    }
  });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (chartsManager) {
    chartsManager.cleanup();
  }
});

// Theme toggle function (keep for compatibility)
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-theme');
}

// ================================
//  CHARTS PAGE DIRECT FIXES
// ================================

// Immediate fix for mini charts
document.addEventListener('DOMContentLoaded', function() {
  console.log('Charts page loading...');
  
  // Fix mini charts immediately
  setTimeout(() => {
    fixMiniChartsNow();
    fixCoinSelector();
    fixMainChart();
    fixTechnicalAnalysis();
  }, 100);
});

function fixMiniChartsNow() {
  console.log('Fixing mini charts now...');
  
  // Update mini chart prices and changes immediately
  const miniData = [
    { priceId: 'ethPrice', changeId: 'ethChange', canvasId: 'ethChart', name: 'Ethereum', price: '$3,245', change: '+1.8%', isPositive: true, color: '#627eea' },
    { priceId: 'bnbPrice', changeId: 'bnbChange', canvasId: 'bnbChart', name: 'Binance Coin', price: '$520', change: '-0.5%', isPositive: false, color: '#f3ba2f' },
    { priceId: 'adaPrice', changeId: 'adaChange', canvasId: 'adaChart', name: 'Cardano', price: '$0.52', change: '+3.2%', isPositive: true, color: '#0033ad' }
  ];
  
  miniData.forEach((item, index) => {
    // Update price text
    const priceEl = document.getElementById(item.priceId);
    if (priceEl) {
      priceEl.textContent = item.price;
      console.log(`✅ Updated ${item.name} price: ${item.price}`);
    }
    
    // Update change text and class
    const changeEl = document.getElementById(item.changeId);
    if (changeEl) {
      changeEl.textContent = item.change;
      changeEl.className = `mini-change ${item.isPositive ? 'positive' : 'negative'}`;
      console.log(`✅ Updated ${item.name} change: ${item.change}`);
    }
    
    // Create responsive mini chart
    const canvas = document.getElementById(item.canvasId);
    if (canvas && typeof Chart !== 'undefined') {
      try {
        // Destroy any existing chart
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }
        
        // Create responsive mini chart
        new Chart(canvas, {
          type: 'line',
          data: {
            labels: ['', '', '', '', '', ''],
            datasets: [{
              data: item.isPositive ? [85, 88, 92, 89, 95, 100] : [100, 95, 92, 88, 85, 82],
              borderColor: item.color,
              backgroundColor: `${item.color}20`,
              fill: true,
              pointRadius: 0,
              tension: 0.4,
              borderWidth: window.innerWidth < 768 ? 1.5 : 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { display: false },
              tooltip: { enabled: false }
            },
            scales: { 
              x: { display: false }, 
              y: { display: false } 
            },
            elements: {
              point: { radius: 0 }
            },
            interaction: {
              intersect: false
            }
          }
        });
        console.log(`✅ Created responsive ${item.name} chart`);
      } catch (error) {
        console.error(`Error creating ${item.name} chart:`, error);
      }
    }
  });
  
  console.log('✅ Mini charts fix completed');
}

function fixCoinSelector() {
  const coinSelect = document.getElementById('coinSelect');
  if (coinSelect) {
    coinSelect.addEventListener('change', function(e) {
      const selectedCoin = e.target.value;
      console.log('Coin selected:', selectedCoin);
      updateMainChartForCoin(selectedCoin);
      updateTechnicalAnalysisForCoin(selectedCoin);
    });
    console.log('✅ Coin selector fixed');
  }

  // Add time period button listeners
  const timeButtons = document.querySelectorAll('.time-btn');
  timeButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Update active button
      timeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Get selected period and current coin
      const period = parseInt(this.dataset.period);
      const coinSelect = document.getElementById('coinSelect');
      const currentCoin = coinSelect ? coinSelect.value : 'bitcoin';
      
      console.log('Time period selected:', period, 'for coin:', currentCoin);
      updateMainChartForPeriod(currentCoin, period);
    });
  });
  console.log('✅ Time period buttons fixed');
}

function fixMainChart() {
  // Initialize with Bitcoin
  updateMainChartForCoin('bitcoin');
}

function fixTechnicalAnalysis() {
  // Initialize with Bitcoin
  updateTechnicalAnalysisForCoin('bitcoin');
}

function updateMainChartForCoin(coinId) {
  const coinData = {
    bitcoin: { name: 'Bitcoin', price: 67234, change: 2.5, color: '#f7931a', data: [65000, 66000, 67000, 68000, 67234] },
    ethereum: { name: 'Ethereum', price: 3245, change: 1.8, color: '#627eea', data: [3100, 3150, 3200, 3180, 3245] },
    binancecoin: { name: 'Binance Coin', price: 520, change: -0.5, color: '#f3ba2f', data: [530, 525, 522, 518, 520] },
    cardano: { name: 'Cardano', price: 0.52, change: 3.2, color: '#0033ad', data: [0.50, 0.51, 0.515, 0.518, 0.52] },
    solana: { name: 'Solana', price: 145, change: 4.1, color: '#14f195', data: [140, 142, 144, 143, 145] },
    polkadot: { name: 'Polkadot', price: 7.2, change: -1.2, color: '#e6007a', data: [7.5, 7.3, 7.1, 7.0, 7.2] },
    chainlink: { name: 'Chainlink', price: 14.5, change: 2.8, color: '#375bd2', data: [14.1, 14.2, 14.4, 14.3, 14.5] },
    litecoin: { name: 'Litecoin', price: 72, change: 1.5, color: '#bfbbbb', data: [71, 71.5, 72.2, 71.8, 72] }
  };

  const coin = coinData[coinId] || coinData.bitcoin;

  // Update chart title and info
  const titleEl = document.querySelector('.chart-title');
  if (titleEl) titleEl.textContent = `${coin.name} - 7 Days`;

  const priceEl = document.getElementById('chartCurrentPrice');
  if (priceEl) priceEl.textContent = `$${coin.price.toLocaleString()}`;

  const changeEl = document.getElementById('chartPriceChange');
  if (changeEl) {
    changeEl.textContent = `${coin.change >= 0 ? '+' : ''}${coin.change}%`;
    changeEl.className = `price-change ${coin.change >= 0 ? 'positive' : 'negative'}`;
  }

  // Update main chart with responsive options
  const canvas = document.getElementById('mainChart');
  if (canvas && typeof Chart !== 'undefined') {
    try {
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }

      new Chart(canvas, {
        type: 'line',
        data: {
          labels: ['3 days ago', '2 days ago', 'Yesterday', '12h ago', 'Now'],
          datasets: [{
            label: coin.name,
            data: coin.data,
            borderColor: coin.color,
            backgroundColor: `${coin.color}20`,
            fill: true,
            tension: 0.4,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: { 
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a1a1a',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: coin.color,
              borderWidth: 1
            }
          },
          scales: {
            y: { 
              grid: { color: '#333' }, 
              ticks: { 
                color: '#999',
                font: {
                  size: window.innerWidth < 768 ? 10 : 12
                }
              }
            },
            x: { 
              grid: { color: '#333' }, 
              ticks: { 
                color: '#999',
                font: {
                  size: window.innerWidth < 768 ? 10 : 12
                },
                maxTicksLimit: window.innerWidth < 768 ? 3 : 5
              }
            }
          },
          elements: {
            point: {
              radius: window.innerWidth < 768 ? 2 : 4,
              hoverRadius: window.innerWidth < 768 ? 4 : 6
            }
          }
        }
      });
      console.log(`✅ Main chart updated for ${coin.name}`);
    } catch (error) {
      console.error('Error updating main chart:', error);
    }
  }
}

function updateTechnicalAnalysisForCoin(coinId) {
  const coinData = {
    bitcoin: { price: 67234, high: 68500, low: 66200, volume: 28500000000, marketCap: 1320000000000 },
    ethereum: { price: 3245, high: 3300, low: 3180, volume: 15200000000, marketCap: 390000000000 },
    binancecoin: { price: 520, high: 535, low: 515, volume: 2800000000, marketCap: 75000000000 },
    cardano: { price: 0.52, high: 0.54, low: 0.50, volume: 850000000, marketCap: 18000000000 },
    solana: { price: 145, high: 148, low: 142, volume: 3200000000, marketCap: 63000000000 },
    polkadot: { price: 7.2, high: 7.5, low: 7.0, volume: 420000000, marketCap: 9800000000 },
    chainlink: { price: 14.5, high: 14.8, low: 14.1, volume: 680000000, marketCap: 8500000000 },
    litecoin: { price: 72, high: 74, low: 70, volume: 1200000000, marketCap: 5400000000 }
  };

  const coin = coinData[coinId] || coinData.bitcoin;

  // Update technical analysis
  const high24h = document.getElementById('high24h');
  if (high24h) high24h.textContent = `$${coin.high.toLocaleString()}`;

  const low24h = document.getElementById('low24h');
  if (low24h) low24h.textContent = `$${coin.low.toLocaleString()}`;

  const volume24h = document.getElementById('volume24h');
  if (volume24h) volume24h.textContent = `$${(coin.volume / 1e9).toFixed(1)}B`;

  const marketCap = document.getElementById('marketCap');
  if (marketCap) marketCap.textContent = `$${(coin.marketCap / 1e9).toFixed(1)}B`;

  console.log(`✅ Technical analysis updated for ${coinId}`);
}

function updateMainChartForPeriod(coinId, period) {
  const coinData = {
    bitcoin: { name: 'Bitcoin', price: 67234, change: 2.5, color: '#f7931a' },
    ethereum: { name: 'Ethereum', price: 3245, change: 1.8, color: '#627eea' },
    binancecoin: { name: 'Binance Coin', price: 520, change: -0.5, color: '#f3ba2f' },
    cardano: { name: 'Cardano', price: 0.52, change: 3.2, color: '#0033ad' },
    solana: { name: 'Solana', price: 145, change: 4.1, color: '#14f195' },
    polkadot: { name: 'Polkadot', price: 7.2, change: -1.2, color: '#e6007a' },
    chainlink: { name: 'Chainlink', price: 14.5, change: 2.8, color: '#375bd2' },
    litecoin: { name: 'Litecoin', price: 72, change: 1.5, color: '#bfbbbb' }
  };

  const coin = coinData[coinId] || coinData.bitcoin;
  
  // Generate different data based on period
  let chartData = [];
  let labels = [];
  
  switch(period) {
    case 1: // 24H
      labels = ['6h ago', '4h ago', '2h ago', '1h ago', 'Now'];
      chartData = generatePeriodData(coin.price, period, 5);
      break;
    case 7: // 7D
      labels = ['6 days ago', '5 days ago', '3 days ago', 'Yesterday', 'Now'];
      chartData = generatePeriodData(coin.price, period, 5);
      break;
    case 30: // 30D
      labels = ['4 weeks ago', '3 weeks ago', '2 weeks ago', '1 week ago', 'Now'];
      chartData = generatePeriodData(coin.price, period, 5);
      break;
    case 90: // 3M
      labels = ['3 months ago', '2 months ago', '6 weeks ago', '1 month ago', 'Now'];
      chartData = generatePeriodData(coin.price, period, 5);
      break;
    case 365: // 1Y
      labels = ['10 months ago', '8 months ago', '6 months ago', '3 months ago', 'Now'];
      chartData = generatePeriodData(coin.price, period, 5);
      break;
    default:
      labels = ['3 days ago', '2 days ago', 'Yesterday', '12h ago', 'Now'];
      chartData = generatePeriodData(coin.price, 7, 5);
  }

  // Update chart title
  const periodText = getPeriodText(period);
  const titleEl = document.querySelector('.chart-title');
  if (titleEl) titleEl.textContent = `${coin.name} - ${periodText}`;

  // Update the chart
  const canvas = document.getElementById('mainChart');
  if (canvas && typeof Chart !== 'undefined') {
    try {
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }

      new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: coin.name,
            data: chartData,
            borderColor: coin.color,
            backgroundColor: `${coin.color}20`,
            fill: true,
            tension: 0.4,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: { 
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a1a1a',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: coin.color,
              borderWidth: 1
            }
          },
          scales: {
            y: { 
              grid: { color: '#333' }, 
              ticks: { 
                color: '#999',
                font: {
                  size: window.innerWidth < 768 ? 10 : 12
                }
              }
            },
            x: { 
              grid: { color: '#333' }, 
              ticks: { 
                color: '#999',
                font: {
                  size: window.innerWidth < 768 ? 10 : 12
                },
                maxTicksLimit: window.innerWidth < 768 ? 3 : 5
              }
            }
          },
          elements: {
            point: {
              radius: window.innerWidth < 768 ? 2 : 4,
              hoverRadius: window.innerWidth < 768 ? 4 : 6
            }
          }
        }
      });
      console.log(`✅ Chart updated for ${coin.name} - ${periodText}`);
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }
}

function generatePeriodData(basePrice, period, points) {
  const data = [];
  const volatility = period === 1 ? 0.02 : period === 7 ? 0.05 : period === 30 ? 0.08 : period === 90 ? 0.12 : 0.15; // More volatility for longer periods
  
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trend = (Math.random() - 0.5) * volatility * 2; // Random trend
    const noise = (Math.random() - 0.5) * volatility * 0.5; // Small random variations
    const price = basePrice * (1 + trend + noise);
    data.push(Math.max(0, price)); // Ensure no negative prices
  }
  
  return data;
}

function getPeriodText(period) {
  const periods = {
    1: '24 Hours',
    7: '7 Days', 
    30: '30 Days',
    90: '3 Months',
    365: '1 Year'
  };
  return periods[period] || '7 Days';
} 