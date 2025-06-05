// ================================
//  PRICE ALERTS MANAGEMENT
// ================================

import cryptoAPI from './api.js';

class AlertsManager {
  constructor() {
    this.alerts = this.loadAlerts();
    this.storageKey = 'crypto-alerts';
    this.checkInterval = null;
    this.notificationPermission = 'default';
    this.requestNotificationPermission();
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
    }
  }

  // Load alerts from localStorage
  loadAlerts() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading alerts:', error);
      return [];
    }
  }

  // Save alerts to localStorage
  saveAlerts() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Error saving alerts:', error);
    }
  }

  // Add new price alert
  addAlert(coinId, targetPrice, condition = 'above', isEnabled = true) {
    const alert = {
      id: Date.now().toString(),
      coinId,
      targetPrice: parseFloat(targetPrice),
      condition, // 'above' or 'below'
      isEnabled,
      isTriggered: false,
      dateCreated: new Date().toISOString(),
      dateTriggered: null
    };

    this.alerts.push(alert);
    this.saveAlerts();
    this.renderAlerts();
    return alert.id;
  }

  // Remove alert
  removeAlert(alertId) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.saveAlerts();
    this.renderAlerts();
  }

  // Toggle alert enabled/disabled
  toggleAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isEnabled = !alert.isEnabled;
      if (alert.isEnabled) {
        alert.isTriggered = false;
        alert.dateTriggered = null;
      }
      this.saveAlerts();
      this.renderAlerts();
    }
  }

  // Check alerts against current prices
  async checkAlerts() {
    const enabledAlerts = this.alerts.filter(alert => 
      alert.isEnabled && !alert.isTriggered
    );

    if (enabledAlerts.length === 0) return;

    try {
      const coinIds = [...new Set(enabledAlerts.map(alert => alert.coinId))];
      const prices = await cryptoAPI.getMultipleCoinPrices(coinIds);

      for (const alert of enabledAlerts) {
        const priceData = prices[alert.coinId];
        if (!priceData) continue;

        const currentPrice = priceData.usd;
        let triggered = false;

        if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
          triggered = true;
        } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
          triggered = true;
        }

        if (triggered) {
          this.triggerAlert(alert, currentPrice);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  // Trigger an alert
  triggerAlert(alert, currentPrice) {
    alert.isTriggered = true;
    alert.dateTriggered = new Date().toISOString();
    alert.triggerPrice = currentPrice;

    this.saveAlerts();
    this.renderAlerts();

    // Show notification
    this.showNotification(alert, currentPrice);

    // Log to console
    console.log(`🚨 Alert triggered for ${alert.coinId}: ${currentPrice}`);
  }

  // Show browser notification
  showNotification(alert, currentPrice) {
    if (this.notificationPermission !== 'granted') return;

    const title = `Price Alert: ${alert.coinId.toUpperCase()}`;
    const message = `${alert.coinId.toUpperCase()} is now ${alert.condition} ${cryptoAPI.formatPrice(alert.targetPrice)}!\nCurrent price: ${cryptoAPI.formatPrice(currentPrice)}`;

    try {
      const notification = new Notification(title, {
        body: message,
        icon: `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`,
        badge: `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`,
        tag: `alert-${alert.id}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Render alerts widget
  renderAlerts() {
    const container = document.querySelector('.alerts-widget .widget-content');
    if (!container) return;

    if (this.alerts.length === 0) {
      container.innerHTML = this.getEmptyAlertsHTML();
      return;
    }

    container.innerHTML = this.getAlertsHTML();
    this.attachAlertEventListeners();
  }

  // Get empty alerts HTML
  getEmptyAlertsHTML() {
    return `
      <div class="empty-alerts text-center">
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
          No price alerts set. Create your first alert!
        </p>
        <button class="add-btn" onclick="alertsManager.openAddAlertModal()">
          Add Alert
        </button>
      </div>
    `;
  }

  // Get alerts HTML
  getAlertsHTML() {
    const sortedAlerts = this.alerts.sort((a, b) => {
      if (a.isTriggered !== b.isTriggered) {
        return a.isTriggered ? 1 : -1; // Non-triggered first
      }
      return new Date(b.dateCreated) - new Date(a.dateCreated);
    });

    return `
      <div class="alerts-header mb-2">
        <button class="add-btn" onclick="alertsManager.openAddAlertModal()">
          Add Alert
        </button>
      </div>
      <div class="alerts-list">
        ${sortedAlerts.map(alert => this.getAlertHTML(alert)).join('')}
      </div>
    `;
  }

  // Get individual alert HTML
  getAlertHTML(alert) {
    const statusClass = alert.isTriggered ? 'triggered' : (alert.isEnabled ? 'active' : 'disabled');
    const conditionText = alert.condition === 'above' ? '↗️' : '↘️';
    
    return `
      <div class="alert-item ${statusClass}" data-alert-id="${alert.id}">
        <div class="alert-info">
          <div class="alert-status ${statusClass}"></div>
          <div class="alert-details">
            <div class="alert-coin">
              ${alert.coinId.toUpperCase()} ${conditionText} ${cryptoAPI.formatPrice(alert.targetPrice)}
            </div>
            <div class="alert-meta">
              ${this.getAlertStatusText(alert)}
            </div>
          </div>
        </div>
        <div class="alert-actions">
          ${!alert.isTriggered ? `
            <button class="toggle-btn" onclick="alertsManager.toggleAlert('${alert.id}')" title="${alert.isEnabled ? 'Disable' : 'Enable'}">
              ${alert.isEnabled ? '⏸️' : '▶️'}
            </button>
          ` : ''}
          <button class="delete-alert" onclick="alertsManager.confirmRemoveAlert('${alert.id}')" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  // Get alert status text
  getAlertStatusText(alert) {
    if (alert.isTriggered) {
      const triggerDate = new Date(alert.dateTriggered);
      const triggerPrice = alert.triggerPrice ? ` at ${cryptoAPI.formatPrice(alert.triggerPrice)}` : '';
      return `Triggered ${this.getRelativeTime(triggerDate)}${triggerPrice}`;
    } else if (alert.isEnabled) {
      return 'Active - monitoring price';
    } else {
      return 'Disabled';
    }
  }

  // Get relative time string
  getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Open add alert modal
  openAddAlertModal() {
    const modal = this.createAddAlertModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';
  }

  // Create add alert modal
  createAddAlertModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Price Alert</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Cryptocurrency</label>
            <input type="text" id="alertCoinInput" placeholder="Search for a coin..." class="form-control">
            <div id="alertCoinResults" class="search-results"></div>
          </div>
          <div class="form-group">
            <label>Condition</label>
            <select id="alertCondition" class="form-control">
              <option value="above">Price goes above</option>
              <option value="below">Price goes below</option>
            </select>
          </div>
          <div class="form-group">
            <label>Target Price (USD)</label>
            <input type="number" id="alertTargetPrice" placeholder="0.00" step="any" class="form-control">
          </div>
          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" id="alertEnabled" checked>
              <label for="alertEnabled">Enable alert immediately</label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn-primary" onclick="alertsManager.addAlertFromModal()">Add Alert</button>
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

  // Setup coin search in modal (reuse from portfolio)
  setupCoinSearch(modal) {
    const searchInput = modal.querySelector('#alertCoinInput');
    const searchResults = modal.querySelector('#alertCoinResults');
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

  // Add alert from modal
  addAlertFromModal() {
    const coinInput = document.getElementById('alertCoinInput');
    const conditionSelect = document.getElementById('alertCondition');
    const targetPriceInput = document.getElementById('alertTargetPrice');
    const enabledCheckbox = document.getElementById('alertEnabled');

    const coinId = coinInput.dataset.coinId;
    const condition = conditionSelect.value;
    const targetPrice = parseFloat(targetPriceInput.value);
    const isEnabled = enabledCheckbox.checked;

    if (!coinId || !targetPrice || targetPrice <= 0) {
      alert('Please select a coin and enter a valid target price');
      return;
    }

    this.addAlert(coinId, targetPrice, condition, isEnabled);
    document.querySelector('.modal').remove();
  }

  // Confirm remove alert
  confirmRemoveAlert(alertId) {
    if (confirm('Delete this price alert?')) {
      this.removeAlert(alertId);
    }
  }

  // Start monitoring alerts
  startMonitoring(intervalMs = 60000) { // Check every minute
    this.stopMonitoring();
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, intervalMs);
    
    // Initial check
    this.checkAlerts();
  }

  // Stop monitoring alerts
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Attach event listeners
  attachAlertEventListeners() {
    // Add any additional event listeners here
  }

  // Clear all triggered alerts
  clearTriggeredAlerts() {
    this.alerts = this.alerts.filter(alert => !alert.isTriggered);
    this.saveAlerts();
    this.renderAlerts();
  }

  // Get alerts summary for display
  getAlertsSummary() {
    const total = this.alerts.length;
    const active = this.alerts.filter(a => a.isEnabled && !a.isTriggered).length;
    const triggered = this.alerts.filter(a => a.isTriggered).length;

    return { total, active, triggered };
  }

  // Export alerts
  exportAlerts() {
    const dataStr = JSON.stringify(this.alerts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crypto-alerts.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Import alerts
  importAlerts(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          this.alerts = [...this.alerts, ...imported];
          this.saveAlerts();
          this.renderAlerts();
          alert('Alerts imported successfully!');
        } else {
          alert('Invalid alerts file format');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing alerts file');
      }
    };
    reader.readAsText(file);
  }
}

// Create and export singleton instance
const alertsManager = new AlertsManager();

export default alertsManager; 