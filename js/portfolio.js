// ================================
//  PORTFOLIO MANAGEMENT
// ================================

import cryptoAPI from './api.js';

class PortfolioManager {
  constructor() {
    this.portfolio = this.loadPortfolio();
    this.storageKey = 'crypto-portfolio';
    this.updateInterval = null;
  }

  // Load portfolio from localStorage
  loadPortfolio() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading portfolio:', error);
      return [];
    }
  }

  // Save portfolio to localStorage
  savePortfolio() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.portfolio));
    } catch (error) {
      console.error('Error saving portfolio:', error);
    }
  }

  // Add coin to portfolio
  addCoin(coinId, amount, purchasePrice = null) {
    const existingIndex = this.portfolio.findIndex(item => item.coinId === coinId);
    
    if (existingIndex !== -1) {
      // Update existing holding
      const existing = this.portfolio[existingIndex];
      const totalAmount = existing.amount + amount;
      const avgPrice = purchasePrice ? 
        ((existing.amount * existing.purchasePrice) + (amount * purchasePrice)) / totalAmount :
        existing.purchasePrice;
      
      this.portfolio[existingIndex] = {
        ...existing,
        amount: totalAmount,
        purchasePrice: avgPrice,
        dateUpdated: new Date().toISOString()
      };
    } else {
      // Add new holding
      this.portfolio.push({
        coinId,
        amount,
        purchasePrice: purchasePrice || 0,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString()
      });
    }
    
    this.savePortfolio();
    this.renderPortfolio();
  }

  // Remove coin from portfolio
  removeCoin(coinId) {
    this.portfolio = this.portfolio.filter(item => item.coinId !== coinId);
    this.savePortfolio();
    this.renderPortfolio();
  }

  // Update coin amount
  updateCoinAmount(coinId, newAmount) {
    const index = this.portfolio.findIndex(item => item.coinId === coinId);
    if (index !== -1) {
      if (newAmount <= 0) {
        this.removeCoin(coinId);
      } else {
        this.portfolio[index].amount = newAmount;
        this.portfolio[index].dateUpdated = new Date().toISOString();
        this.savePortfolio();
        this.renderPortfolio();
      }
    }
  }

  // Get portfolio value and stats
  async getPortfolioStats() {
    if (this.portfolio.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        holdings: []
      };
    }

    try {
      const coinIds = this.portfolio.map(item => item.coinId);
      const prices = await cryptoAPI.getMultipleCoinPrices(coinIds);
      
      let totalValue = 0;
      let totalCost = 0;
      const holdings = [];

      for (const holding of this.portfolio) {
        const priceData = prices[holding.coinId];
        if (!priceData) continue;

        const currentPrice = priceData.usd;
        const currentValue = holding.amount * currentPrice;
        const costBasis = holding.amount * holding.purchasePrice;
        const pnl = currentValue - costBasis;
        const pnlPercentage = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

        holdings.push({
          ...holding,
          currentPrice,
          currentValue,
          costBasis,
          pnl,
          pnlPercentage,
          change24h: priceData.usd_24h_change || 0
        });

        totalValue += currentValue;
        totalCost += costBasis;
      }

      const totalPnL = totalValue - totalCost;
      const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

      return {
        totalValue,
        totalCost,
        totalPnL,
        totalPnLPercentage,
        holdings: holdings.sort((a, b) => b.currentValue - a.currentValue)
      };
    } catch (error) {
      console.error('Error calculating portfolio stats:', error);
      return {
        totalValue: 0,
        totalCost: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        holdings: []
      };
    }
  }

  // Render portfolio widget
  async renderPortfolio() {
    const container = document.querySelector('.portfolio-widget .widget-content');
    if (!container) return;

    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      const stats = await this.getPortfolioStats();
      
      if (stats.holdings.length === 0) {
        container.innerHTML = this.getEmptyPortfolioHTML();
        return;
      }

      container.innerHTML = this.getPortfolioHTML(stats);
      this.attachPortfolioEventListeners();
    } catch (error) {
      console.error('Error rendering portfolio:', error);
      container.innerHTML = '<p class="text-center">Error loading portfolio</p>';
    }
  }

  // Get empty portfolio HTML
  getEmptyPortfolioHTML() {
    return `
      <div class="empty-portfolio text-center">
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
          No holdings yet. Start tracking your crypto portfolio!
        </p>
        <button class="add-btn" onclick="portfolioManager.openAddCoinModal()">
          Add First Coin
        </button>
      </div>
    `;
  }

  // Get portfolio HTML
  getPortfolioHTML(stats) {
    const totalPnLClass = stats.totalPnL >= 0 ? 'positive' : 'negative';
    
    return `
      <div class="portfolio-summary mb-2">
        <div class="portfolio-total">
          <div class="portfolio-value">
            ${cryptoAPI.formatPrice(stats.totalValue)}
          </div>
          <div class="portfolio-change ${totalPnLClass}">
            ${cryptoAPI.formatPrice(stats.totalPnL)} (${cryptoAPI.formatPercentage(stats.totalPnLPercentage)})
          </div>
        </div>
        <button class="add-btn" onclick="portfolioManager.openAddCoinModal()">
          Add Coin
        </button>
      </div>
      <div class="portfolio-holdings">
        ${stats.holdings.map(holding => this.getHoldingHTML(holding)).join('')}
      </div>
    `;
  }

  // Get individual holding HTML
  getHoldingHTML(holding) {
    const changeClass = holding.pnl >= 0 ? 'positive' : 'negative';
    const change24hClass = holding.change24h >= 0 ? 'positive' : 'negative';
    
    return `
      <div class="portfolio-item" data-coin-id="${holding.coinId}">
        <div class="portfolio-coin">
          <img src="https://assets.coingecko.com/coins/images/${this.getCoinImageId(holding.coinId)}/small/${holding.coinId}.png" 
               alt="${holding.coinId}" 
               class="coin-icon"
               onerror="this.src='https://via.placeholder.com/32x32/f7931a/ffffff?text=${holding.coinId.charAt(0).toUpperCase()}'">
          <div>
            <div class="coin-name">${holding.coinId.toUpperCase()}</div>
            <div class="coin-amount">${holding.amount.toFixed(6)}</div>
          </div>
        </div>
        <div class="portfolio-stats">
          <div class="portfolio-value">
            ${cryptoAPI.formatPrice(holding.currentValue)}
          </div>
          <div class="portfolio-change ${changeClass}">
            ${cryptoAPI.formatPrice(holding.pnl)} (${cryptoAPI.formatPercentage(holding.pnlPercentage)})
          </div>
          <div class="portfolio-24h ${change24hClass}">
            24h: ${cryptoAPI.formatPercentage(holding.change24h)}
          </div>
        </div>
        <div class="portfolio-actions">
          <button class="edit-btn" onclick="portfolioManager.editHolding('${holding.coinId}')">
            ✏️
          </button>
          <button class="delete-btn" onclick="portfolioManager.confirmRemoveHolding('${holding.coinId}')">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  // Get coin image ID (simplified mapping)
  getCoinImageId(coinId) {
    const imageIds = {
      'bitcoin': '1',
      'ethereum': '279',
      'binancecoin': '825',
      'cardano': '975',
      'solana': '4128',
      'polkadot': '12171'
    };
    return imageIds[coinId] || '1';
  }

  // Open add coin modal
  openAddCoinModal() {
    const modal = this.createAddCoinModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';
  }

  // Create add coin modal
  createAddCoinModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Coin to Portfolio</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Cryptocurrency</label>
            <input type="text" id="coinSearchInput" placeholder="Search for a coin..." class="form-control">
            <div id="coinSearchResults" class="search-results"></div>
          </div>
          <div class="form-group">
            <label>Amount</label>
            <input type="number" id="coinAmount" placeholder="0.00" step="any" class="form-control">
          </div>
          <div class="form-group">
            <label>Purchase Price (Optional)</label>
            <input type="number" id="purchasePrice" placeholder="0.00" step="any" class="form-control">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn-primary" onclick="portfolioManager.addCoinFromModal()">Add Coin</button>
        </div>
      </div>
    `;

    // Add modal styles
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    // Setup search functionality
    setTimeout(() => {
      this.setupCoinSearch(modal);
    }, 100);

    return modal;
  }

  // Setup coin search in modal
  setupCoinSearch(modal) {
    const searchInput = modal.querySelector('#coinSearchInput');
    const searchResults = modal.querySelector('#coinSearchResults');
    let searchTimeout;

    searchInput.addEventListener('input', async (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
      }

      searchTimeout = setTimeout(async () => {
        try {
          const results = await cryptoAPI.searchCoins(query);
          this.renderSearchResults(results.slice(0, 5), searchResults, searchInput);
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 300);
    });
  }

  // Render search results
  renderSearchResults(results, container, input) {
    container.innerHTML = results.map(coin => `
      <div class="search-result-item" data-coin-id="${coin.id}">
        <img src="${coin.thumb}" alt="${coin.name}" class="coin-icon">
        <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
      </div>
    `).join('');

    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.textContent;
        input.dataset.coinId = item.dataset.coinId;
        container.innerHTML = '';
      });
    });
  }

  // Add coin from modal
  addCoinFromModal() {
    const coinInput = document.getElementById('coinSearchInput');
    const amountInput = document.getElementById('coinAmount');
    const priceInput = document.getElementById('purchasePrice');

    const coinId = coinInput.dataset.coinId;
    const amount = parseFloat(amountInput.value);
    const price = parseFloat(priceInput.value) || null;

    if (!coinId || !amount || amount <= 0) {
      alert('Please select a coin and enter a valid amount');
      return;
    }

    this.addCoin(coinId, amount, price);
    document.querySelector('.modal').remove();
  }

  // Edit holding
  editHolding(coinId) {
    const holding = this.portfolio.find(item => item.coinId === coinId);
    if (!holding) return;

    const newAmount = prompt(`Enter new amount for ${coinId.toUpperCase()}:`, holding.amount);
    if (newAmount !== null) {
      const amount = parseFloat(newAmount);
      if (!isNaN(amount) && amount >= 0) {
        this.updateCoinAmount(coinId, amount);
      }
    }
  }

  // Confirm remove holding
  confirmRemoveHolding(coinId) {
    if (confirm(`Remove ${coinId.toUpperCase()} from portfolio?`)) {
      this.removeCoin(coinId);
    }
  }

  // Start auto-update
  startAutoUpdate(intervalMs = 60000) {
    this.stopAutoUpdate();
    this.updateInterval = setInterval(() => {
      this.renderPortfolio();
    }, intervalMs);
  }

  // Stop auto-update
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Attach event listeners
  attachPortfolioEventListeners() {
    // Add any additional event listeners here
  }

  // Export portfolio data
  exportPortfolio() {
    const dataStr = JSON.stringify(this.portfolio, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crypto-portfolio.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Import portfolio data
  importPortfolio(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          this.portfolio = imported;
          this.savePortfolio();
          this.renderPortfolio();
          alert('Portfolio imported successfully!');
        } else {
          alert('Invalid portfolio file format');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing portfolio file');
      }
    };
    reader.readAsText(file);
  }
}

// Create and export singleton instance
const portfolioManager = new PortfolioManager();

export default portfolioManager; 