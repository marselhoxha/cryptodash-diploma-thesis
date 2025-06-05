// ================================
//  CHART UTILITIES & RENDERING
// ================================

import cryptoAPI from './api.js';

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
    await Promise.all([
      this.renderMainChart(),
      this.renderMiniCharts()
    ]);
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
      this.updateChartTitle();
    } catch (error) {
      console.error('Error rendering main chart:', error);
      this.showChartError('mainChart');
    }
  }

  // Render mini charts for the overview
  async renderMiniCharts() {
    const miniCoins = ['bitcoin', 'ethereum', 'binancecoin', 'cardano'];
    const promises = miniCoins.map(coin => this.renderMiniChart(coin));
    await Promise.all(promises);
  }

  // Render individual mini chart
  async renderMiniChart(coinId) {
    const canvas = document.getElementById(`miniChart-${coinId}`);
    if (!canvas) return;

    try {
      const data = await cryptoAPI.getMarketChart(coinId, 7);
      const ctx = canvas.getContext('2d');

      // Destroy existing chart if it exists
      const chartKey = `mini-${coinId}`;
      if (this.charts.has(chartKey)) {
        this.charts.get(chartKey).destroy();
      }

      const chart = new Chart(ctx, {
        type: 'line',
        data: this.formatMiniChartData(data, coinId),
        options: this.getMiniChartOptions()
      });

      this.charts.set(chartKey, chart);
    } catch (error) {
      console.error(`Error rendering mini chart for ${coinId}:`, error);
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

  // Format data for mini charts
  formatMiniChartData(data, coinId) {
    const prices = data.prices || [];
    
    return {
      labels: prices.map(() => ''), // No labels for mini charts
      datasets: [{
        data: prices.map(point => point[1]),
        borderColor: this.chartColors[coinId] || '#f7931a',
        backgroundColor: `${this.chartColors[coinId] || '#f7931a'}20`,
        borderWidth: 1.5,
        fill: true,
        tension: 0.1,
        pointRadius: 0
      }]
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
      },
      elements: {
        line: {
          borderJoinStyle: 'round'
        }
      }
    };
  }

  // Get mini chart options
  getMiniChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: false
        }
      },
      elements: {
        point: {
          radius: 0
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
  updateChartTitle() {
    const titleElement = document.querySelector('.chart-title');
    if (titleElement) {
      const coinName = this.currentCoin.charAt(0).toUpperCase() + 
                       this.currentCoin.slice(1);
      const periodText = this.getPeriodText(this.currentPeriod);
      titleElement.textContent = `${coinName} - ${periodText}`;
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
      if (btn.dataset.period === period) {
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

  // Get chart instance
  getChart(key) {
    return this.charts.get(key);
  }

  // Update chart theme (for future dark/light mode toggle)
  updateChartTheme(isDark = true) {
    const textColor = isDark ? '#8b949e' : '#333333';
    const gridColor = isDark ? '#30363d' : '#e1e8ed';
    
    this.charts.forEach(chart => {
      if (chart.options.scales) {
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.grid.color = gridColor;
      }
      chart.update();
    });
  }
}

// Create and export singleton instance
const chartManager = new ChartManager();

export default chartManager;

// Charts page initialization
document.addEventListener('DOMContentLoaded', () => {
  initChartsPage();
});

async function initChartsPage() {
  try {
    await Promise.all([
      chartManager.initializeCharts(),
      dashboard.startLiveTicker(),
      updateMiniCharts(),
      updateAnalysisData()
    ]);

    initChartsEventListeners();

    console.log('✅ Charts page initialized');
  } catch (error) {
    console.error('❌ Charts page error:', error);
  }
}

function initChartsEventListeners() {
  // Time period buttons
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const period = e.target.dataset.period;
      if (period) {
        chartManager.updateChartPeriod(period);
      }
    });
  });

  // Coin selector
  const coinSelect = document.getElementById('coinSelect');
  if (coinSelect) {
    coinSelect.addEventListener('change', (e) => {
      chartManager.updateChartCoin(e.target.value);
      updateAnalysisData(e.target.value);
    });
  }
}

async function updateMiniCharts() {
  try {
    const [ethData, bnbData] = await Promise.all([
      cryptoAPI.getMultipleCoinPrices(['ethereum']),
      cryptoAPI.getMultipleCoinPrices(['binancecoin'])
    ]);

    // Update Ethereum mini chart
    const ethPrice = ethData.ethereum.usd;
    const ethChange = ethData.ethereum.usd_24h_change || 0;
    document.getElementById('ethPrice').textContent = cryptoAPI.formatPrice(ethPrice);
    document.getElementById('ethChange').textContent = cryptoAPI.formatPercentage(ethChange);
    document.getElementById('ethChange').className = `mini-change ${ethChange >= 0 ? 'positive' : 'negative'}`;

    // Update BNB mini chart
    const bnbPrice = bnbData.binancecoin.usd;
    const bnbChange = bnbData.binancecoin.usd_24h_change || 0;
    document.getElementById('bnbPrice').textContent = cryptoAPI.formatPrice(bnbPrice);
    document.getElementById('bnbChange').textContent = cryptoAPI.formatPercentage(bnbChange);
    document.getElementById('bnbChange').className = `mini-change ${bnbChange >= 0 ? 'positive' : 'negative'}`;

    // Render mini charts
    await renderMiniChart('ethChart', 'ethereum');
    await renderMiniChart('bnbChart', 'binancecoin');

  } catch (error) {
    console.error('Error updating mini charts:', error);
  }
}

async function renderMiniChart(canvasId, coinId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  try {
    const data = await cryptoAPI.getMarketChart(coinId, 7);
    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (window[`${canvasId}Instance`]) {
      window[`${canvasId}Instance`].destroy();
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.prices.map(point => new Date(point[0]).toLocaleDateString()),
        datasets: [{
          data: data.prices.map(point => point[1]),
          borderColor: '#f7931a',
          backgroundColor: '#f7931a20',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });

    window[`${canvasId}Instance`] = chart;
  } catch (error) {
    console.error(`Error rendering ${canvasId}:`, error);
  }
}

async function updateAnalysisData(coinId = 'bitcoin') {
  try {
    const [priceData, chartData] = await Promise.all([
      cryptoAPI.getMultipleCoinPrices([coinId]),
      cryptoAPI.getMarketChart(coinId, 1)
    ]);

    const coinData = priceData[coinId];
    const prices = chartData.prices.map(p => p[1]);
    const high24h = Math.max(...prices);
    const low24h = Math.min(...prices);

    document.getElementById('high24h').textContent = cryptoAPI.formatPrice(high24h);
    document.getElementById('low24h').textContent = cryptoAPI.formatPrice(low24h);
    document.getElementById('volume24h').textContent = cryptoAPI.formatLargeNumber(coinData.usd_24h_vol || 0);
    document.getElementById('marketCap').textContent = cryptoAPI.formatLargeNumber(coinData.usd_market_cap || 0);

  } catch (error) {
    console.error('Error updating analysis data:', error);
  }
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  
  // Ensure dark theme is default
  if (!savedTheme) {
    localStorage.setItem('theme', 'dark');
  }
  
  // Only apply light theme if explicitly saved
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    // Ensure dark theme by removing any light-theme class
    document.body.classList.remove('light-theme');
  }
}); 