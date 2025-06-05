// ================================
//  MAIN APPLICATION CONTROLLER
// ================================

import cryptoAPI from './api.js';
import chartManager from './charts.js';
import portfolioManager from './portfolio.js';
import alertsManager from './alerts.js';

class CryptoDashboard {
  constructor() {
    this.isInitialized = false;
    this.updateInterval = null;
    this.tickerInterval = null;
    this.currentView = 'dashboard';
    
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
      
      // Show loading state
      this.showLoadingState();
      
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

    // Table sorting
    document.querySelectorAll('.price-table th[data-sort]').forEach(th => {
      th.addEventListener('click', (e) => {
        const sortBy = e.target.dataset.sort;
        this.sortTable(sortBy);
      });
    });

    // Navigation
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.getAttribute('href').substring(1);
        this.navigateToSection(section);
      });
    });

    // Global error handler
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
    });

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
    
    // Initialize portfolio
    await portfolioManager.renderPortfolio();
    portfolioManager.startAutoUpdate();
    
    // Initialize alerts
    alertsManager.renderAlerts();
    alertsManager.startMonitoring();
  }

  // Render market overview cards
  async renderMarketOverview() {
    const container = document.querySelector('.market-overview');
    if (!container) return;

    try {
      const [globalData, fearGreedData] = await Promise.all([
        cryptoAPI.getGlobalData(),
        cryptoAPI.getFearGreedIndex()
      ]);

      const global = globalData.data;
      const fearGreed = fearGreedData.data[0];

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
          title: 'Fear & Greed',
          value: fearGreed.value,
          change: null,
          subtitle: fearGreed.value_classification,
          class: this.getFearGreedClass(fearGreed.value)
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
    
    return `
      <tr onclick="chartManager.updateChartCoin('${crypto.id}')" style="cursor: pointer;">
        <td>${rank}</td>
        <td>
          <div class="coin-info">
            <img src="${crypto.image}" alt="${crypto.name}" class="coin-icon">
            <div>
              <div class="coin-name">${crypto.name}</div>
              <div class="coin-symbol">${crypto.symbol.toUpperCase()}</div>
            </div>
          </div>
        </td>
        <td>${cryptoAPI.formatPrice(crypto.current_price)}</td>
        <td class="price-change ${changeClass}">
          ${cryptoAPI.formatPercentage(change24h)}
        </td>
        <td>${cryptoAPI.formatLargeNumber(crypto.market_cap)}</td>
        <td>${cryptoAPI.formatLargeNumber(crypto.total_volume)}</td>
        <td>
          <div class="mini-chart" style="width: 100px; height: 30px;">
            <canvas id="miniChart-${crypto.id}" width="100" height="30"></canvas>
          </div>
        </td>
      </tr>
    `;
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

  // Sort table
  sortTable(sortBy) {
    // Implementation for table sorting
    console.log('Sorting by:', sortBy);
    // Add sorting logic here
  }

  // Navigate to section
  navigateToSection(section) {
    // Update active nav link
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.classList.remove('active');
    });
    
    document.querySelector(`[href="#${section}"]`)?.classList.add('active');
    
    // Scroll to section
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Start auto-updates
  startAutoUpdates() {
    this.updateInterval = setInterval(async () => {
      await Promise.all([
        this.renderMarketOverview(),
        this.renderCryptoTable()
      ]);
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

  // Show loading state
  showLoadingState() {
    document.body.classList.add('loading');
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
    portfolioManager.stopAutoUpdate();
    alertsManager.stopMonitoring();
    chartManager.destroyAllCharts();
  }
}

// Create dashboard instance
const dashboard = new CryptoDashboard();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  dashboard.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  dashboard.cleanup();
});

// Export for global access
window.dashboard = dashboard;
window.cryptoAPI = cryptoAPI;
window.chartManager = chartManager;
window.portfolioManager = portfolioManager;
window.alertsManager = alertsManager;

export default dashboard; 