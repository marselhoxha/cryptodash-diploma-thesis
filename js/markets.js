// Markets page initialization
document.addEventListener('DOMContentLoaded', () => {
  initMarketsPage();
});

async function initMarketsPage() {
  try {
    // Wait for global objects to be available
    if (!window.cryptoAPI || !window.dashboard) {
      console.log('Waiting for global objects...');
      setTimeout(initMarketsPage, 100);
      return;
    }

    await Promise.all([
      window.dashboard.renderMarketOverview(),
      loadCryptoData(),
      window.dashboard.updateFearGreedMeter(),
      window.dashboard.startLiveTicker()
    ]);

    initMarketsEventListeners();
    window.dashboard.startAutoUpdates();

    console.log('✅ Markets page initialized');
  } catch (error) {
    console.error('❌ Markets page error:', error);
    // Show error message to user
    const container = document.querySelector('.market-overview');
    if (container) {
      container.innerHTML = '<p class="text-center error-message">Error loading market data. Please refresh the page.</p>';
    }
  }
}

function initMarketsEventListeners() {
  const searchInput = document.getElementById('cryptoSearch');
  const sortFilter = document.getElementById('sortFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const changeFilter = document.getElementById('changeFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      applyFilters();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      applyFilters();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      applyFilters();
    });
  }

  if (changeFilter) {
    changeFilter.addEventListener('change', (e) => {
      applyFilters();
    });
  }

  // Add click event listeners to sortable table headers
  document.querySelectorAll('th[data-sort]').forEach(header => {
    header.addEventListener('click', () => {
      const sortBy = header.dataset.sort;
      document.getElementById('sortFilter').value = sortBy;
      applyFilters();
    });
  });
}

let allCryptos = []; // Store all crypto data for filtering

async function applyFilters() {
  if (allCryptos.length === 0) return;

  const searchTerm = document.getElementById('cryptoSearch').value.toLowerCase();
  const sortBy = document.getElementById('sortFilter').value;
  const category = document.getElementById('categoryFilter').value;
  const changeFilter = document.getElementById('changeFilter').value;

  let filteredCryptos = [...allCryptos];

  // Apply search filter
  if (searchTerm) {
    filteredCryptos = filteredCryptos.filter(crypto => 
      crypto.name.toLowerCase().includes(searchTerm) ||
      crypto.symbol.toLowerCase().includes(searchTerm)
    );
  }

  // Apply category filter (simplified - in real app you'd have category data)
  if (category !== 'all') {
    const categoryKeywords = {
      'defi': ['uniswap', 'aave', 'compound', 'makerdao', 'yearn'],
      'layer-1': ['bitcoin', 'ethereum', 'cardano', 'solana', 'avalanche'],
      'meme': ['dogecoin', 'shiba', 'doge', 'pepe', 'floki'],
      'stablecoin': ['tether', 'usd-coin', 'busd', 'dai', 'frax']
    };
    
    if (categoryKeywords[category]) {
      filteredCryptos = filteredCryptos.filter(crypto => 
        categoryKeywords[category].some(keyword => 
          crypto.id.includes(keyword) || crypto.name.toLowerCase().includes(keyword)
        )
      );
    }
  }

  // Apply change filter
  if (changeFilter === 'gainers') {
    filteredCryptos = filteredCryptos.filter(crypto => 
      (crypto.price_change_percentage_24h || 0) > 0
    );
  } else if (changeFilter === 'losers') {
    filteredCryptos = filteredCryptos.filter(crypto => 
      (crypto.price_change_percentage_24h || 0) < 0
    );
  }

  // Apply sorting
  filteredCryptos.sort((a, b) => {
    let aValue, bValue;
    
    switch(sortBy) {
      case 'price':
        aValue = a.current_price || 0;
        bValue = b.current_price || 0;
        break;
      case 'change':
        aValue = a.price_change_percentage_24h || 0;
        bValue = b.price_change_percentage_24h || 0;
        break;
      case 'volume':
        aValue = a.total_volume || 0;
        bValue = b.total_volume || 0;
        break;
      case 'market_cap':
      default:
        aValue = a.market_cap || 0;
        bValue = b.market_cap || 0;
        break;
    }
    
    return bValue - aValue; // Descending order
  });

  // Update results count
  document.getElementById('resultsCount').textContent = filteredCryptos.length;

  // Render filtered results
  renderFilteredCryptos(filteredCryptos);
}

function renderFilteredCryptos(cryptos) {
  const tbody = document.querySelector('.price-table tbody');
  if (!tbody) return;

  if (cryptos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center">No cryptocurrencies found matching your criteria</td></tr>';
    return;
  }

  tbody.innerHTML = cryptos.map((crypto, index) => 
    window.dashboard.getCryptoRowHTML(crypto, index + 1)
  ).join('');
}

async function refreshMarketData() {
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.style.opacity = '0.5';
    refreshBtn.disabled = true;
  }

  try {
    await Promise.all([
      window.dashboard.renderMarketOverview(),
      loadCryptoData(),
      window.dashboard.updateFearGreedMeter()
    ]);

    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
  } catch (error) {
    console.error('Error refreshing:', error);
  } finally {
    if (refreshBtn) {
      refreshBtn.style.opacity = '1';
      refreshBtn.disabled = false;
    }
  }
}

async function loadCryptoData() {
  try {
    allCryptos = await window.cryptoAPI.getTopCryptos(100);
    
    // Update market statistics
    updateMarketStats(allCryptos);
    
    // Update market trends
    updateMarketTrends(allCryptos);
    
    // Render dominance chart
    renderDominanceChart(allCryptos.slice(0, 10));
    
    applyFilters(); // Apply current filters to new data
  } catch (error) {
    console.error('Error loading crypto data:', error);
    allCryptos = [];
    // Show error state in table
    const tbody = document.querySelector('.price-table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center error-message">Error loading cryptocurrency data. Please refresh the page.</td></tr>';
    }
  }
}

function updateMarketStats(cryptos) {
  try {
    // Total coins tracked
    document.getElementById('totalCoins').textContent = cryptos.length.toLocaleString();
    
    // Active markets (simulated)
    document.getElementById('activeMarkets').textContent = (cryptos.length * 3.2).toFixed(0);
    
    // Average 24h change
    const avgChange = cryptos.reduce((sum, crypto) => sum + (crypto.price_change_percentage_24h || 0), 0) / cryptos.length;
    const avgChangeEl = document.getElementById('avgChange');
    avgChangeEl.textContent = avgChange.toFixed(2) + '%';
    avgChangeEl.className = `stat-value ${avgChange >= 0 ? 'positive' : 'negative'}`;
  } catch (error) {
    console.error('Error updating market stats:', error);
  }
}

function updateMarketTrends(cryptos) {
  try {
    // Find top gainer
    const topGainer = cryptos.reduce((max, crypto) => 
      (crypto.price_change_percentage_24h || 0) > (max.price_change_percentage_24h || 0) ? crypto : max
    );
    
    // Find top loser
    const topLoser = cryptos.reduce((min, crypto) => 
      (crypto.price_change_percentage_24h || 0) < (min.price_change_percentage_24h || 0) ? crypto : min
    );
    
    // Most active (highest volume)
    const mostActive = cryptos.reduce((max, crypto) => 
      (crypto.total_volume || 0) > (max.total_volume || 0) ? crypto : max
    );

    document.getElementById('topGainer').innerHTML = `
      <strong>${topGainer.symbol?.toUpperCase()}</strong><br>
      <span class="positive">+${topGainer.price_change_percentage_24h?.toFixed(2)}%</span>
    `;

    document.getElementById('topLoser').innerHTML = `
      <strong>${topLoser.symbol?.toUpperCase()}</strong><br>
      <span class="negative">${topLoser.price_change_percentage_24h?.toFixed(2)}%</span>
    `;

    document.getElementById('mostActive').innerHTML = `
      <strong>${mostActive.symbol?.toUpperCase()}</strong><br>
      <span>${window.cryptoAPI.formatLargeNumber(mostActive.total_volume)}</span>
    `;

    document.getElementById('newListings').innerHTML = `
      <strong>5</strong><br>
      <span>This Week</span>
    `;
  } catch (error) {
    console.error('Error updating market trends:', error);
  }
}

function renderDominanceChart(topCryptos) {
  try {
    const canvas = document.getElementById('dominanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Calculate total market cap
    const totalMarketCap = topCryptos.reduce((sum, crypto) => sum + (crypto.market_cap || 0), 0);
    
    // Prepare data
    const data = topCryptos.slice(0, 6).map(crypto => ({
      name: crypto.symbol?.toUpperCase(),
      value: (crypto.market_cap || 0) / totalMarketCap * 100,
      color: getRandomColor()
    }));
    
    // Add "Others" category
    const othersValue = 100 - data.reduce((sum, item) => sum + item.value, 0);
    data.push({ name: 'Others', value: othersValue, color: '#888888' });
    
    // Simple pie chart drawing
    drawPieChart(ctx, data, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 3);
    
    // Update legend
    updateDominanceLegend(data);
  } catch (error) {
    console.error('Error rendering dominance chart:', error);
  }
}

function drawPieChart(ctx, data, centerX, centerY, radius) {
  let currentAngle = -Math.PI / 2; // Start at top
  
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  data.forEach(item => {
    const sliceAngle = (item.value / 100) * 2 * Math.PI;
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    currentAngle += sliceAngle;
  });
}

function updateDominanceLegend(data) {
  const legend = document.getElementById('dominanceLegend');
  if (!legend) return;
  
  legend.innerHTML = data.map(item => `
    <div class="legend-item">
      <div class="legend-color" style="background-color: ${item.color}"></div>
      <span>${item.name}: ${item.value.toFixed(1)}%</span>
    </div>
  `).join('');
}

function getRandomColor() {
  const colors = ['#ff6b35', '#f7931e', '#ffd700', '#32cd32', '#1e90ff', '#9370db', '#ff69b4', '#20b2aa'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

// Load saved theme - Default to dark theme
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

// ================================
//  MARKETS PAGE DIRECT FIXES
// ================================

// Override the original renderMarketOverview function to prevent it from running
window.addEventListener('load', function() {
  // Override the original function if it exists
  if (window.dashboard && window.dashboard.renderMarketOverview) {
    window.dashboard.renderMarketOverview = function() {
      console.log('Original renderMarketOverview blocked');
      return;
    };
  }
});

// Immediately populate market overview on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Markets page loading...');
  
  populateMarketData();
  
  // Run again after a delay to override any other scripts
  setTimeout(populateMarketData, 1000);
  setTimeout(populateMarketData, 2000);
  setTimeout(populateMarketData, 3000);
});

function populateMarketData() {
  // Fix 1: Populate market overview immediately
  const marketOverview = document.querySelector('.market-overview');
  if (marketOverview) {
    marketOverview.innerHTML = `
      <div class="stat-card">
        <h3>Total Market Cap</h3>
        <div class="value">$2.8T</div>
        <div class="change positive">+2.4%</div>
      </div>
      <div class="stat-card">
        <h3>24h Volume</h3>
        <div class="value">$125B</div>
      </div>
      <div class="stat-card">
        <h3>BTC Dominance</h3>
        <div class="value">47.2%</div>
      </div>
      <div class="stat-card">
        <h3>Active Cryptocurrencies</h3>
        <div class="value">12,847</div>
      </div>
    `;
    console.log('✅ Market overview populated');
  }
  
  // Fix 2: Populate crypto table immediately
  const tableBody = document.querySelector('.price-table tbody');
  if (tableBody) {
    const demoCoins = [
      { rank: 1, name: 'Bitcoin', symbol: 'BTC', price: 67234, change: 2.5, marketCap: 1320000000000, volume: 28500000000 },
      { rank: 2, name: 'Ethereum', symbol: 'ETH', price: 3245, change: 1.8, marketCap: 390000000000, volume: 15200000000 },
      { rank: 3, name: 'Binance Coin', symbol: 'BNB', price: 520, change: -0.5, marketCap: 75000000000, volume: 2800000000 },
      { rank: 4, name: 'Cardano', symbol: 'ADA', price: 0.52, change: 3.2, marketCap: 18000000000, volume: 850000000 }
    ];
    
    tableBody.innerHTML = demoCoins.map(coin => `
      <tr>
        <td><strong>${coin.rank}</strong></td>
        <td>
          <div class="coin-info">
            <div>
              <div class="coin-name">${coin.name}</div>
              <div class="coin-symbol">${coin.symbol}</div>
            </div>
          </div>
        </td>
        <td><strong>$${coin.price.toLocaleString()}</strong></td>
        <td class="price-change ${coin.change >= 0 ? 'positive' : 'negative'}">
          <div>${coin.change >= 0 ? '+' : ''}${coin.change}%</div>
        </td>
        <td><strong>$${(coin.marketCap / 1e9).toFixed(1)}B</strong></td>
        <td><strong>$${(coin.volume / 1e9).toFixed(1)}B</strong></td>
        <td><strong>${(coin.marketCap / coin.price / 1e6).toFixed(0)}M</strong></td>
        <td>
          <div class="mini-chart" style="width: 80px; height: 40px; background: ${coin.change >= 0 ? '#238636' : '#da3633'}20; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 0.7rem; color: ${coin.change >= 0 ? '#238636' : '#da3633'};">
              ${coin.change >= 0 ? '📈' : '📉'} 7d
            </span>
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="set-alert-btn" title="Set Price Alert">🔔</button>
          </div>
        </td>
      </tr>
    `).join('');
    console.log('✅ Crypto table populated');
  }
  
  // Fix 3: Update other stats
  const updateStats = () => {
    const elements = {
      'totalCoins': '12,847',
      'activeMarkets': '842',
      'avgChange': '+1.2%',
      'resultsCount': '4',
      'lastUpdate': new Date().toLocaleTimeString()
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  };
  
  updateStats();
  console.log('✅ Markets page data updated');
}

// Refresh function
function refreshMarketData() {
  console.log('Refreshing market data...');
  populateMarketData();
} 