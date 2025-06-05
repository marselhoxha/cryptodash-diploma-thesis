// Markets page initialization
document.addEventListener('DOMContentLoaded', () => {
  initMarketsPage();
});

async function initMarketsPage() {
  try {
    await Promise.all([
      dashboard.renderMarketOverview(),
      loadCryptoData(),
      dashboard.updateFearGreedMeter(),
      dashboard.startLiveTicker()
    ]);

    initMarketsEventListeners();
    dashboard.startAutoUpdates();

    console.log('✅ Markets page initialized');
  } catch (error) {
    console.error('❌ Markets page error:', error);
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
    dashboard.getCryptoRowHTML(crypto, index + 1)
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
      dashboard.renderMarketOverview(),
      loadCryptoData(),
      dashboard.updateFearGreedMeter()
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
    allCryptos = await cryptoAPI.getTopCryptos(100);
    
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
      <span>${cryptoAPI.formatLargeNumber(mostActive.total_volume)}</span>
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