// News page state
let allNews = [];
let filteredNews = [];
let currentCategory = 'all';
let currentSort = 'newest';
let newsOffset = 0;
const newsLimit = 12;

// News page initialization
document.addEventListener('DOMContentLoaded', () => {
  initNewsPage();
});

async function initNewsPage() {
  try {
    await Promise.all([
      loadNews(),
      updateMarketSentiment(),
      dashboard.startLiveTicker()
    ]);

    console.log('✅ News page initialized');
  } catch (error) {
    console.error('❌ News page error:', error);
    showNewsError();
  }
}

async function loadNews(loadMore = false) {
  try {
    if (!loadMore) {
      document.getElementById('newsGrid').innerHTML = `
        <div class="loading-news">
          <div class="spinner"></div>
          <p>Loading latest crypto news...</p>
        </div>
      `;
    }

    const news = await cryptoAPI.getCryptoNews(newsLimit + newsOffset);
    
    if (!loadMore) {
      allNews = enhanceNewsData(news);
      newsOffset = newsLimit;
    } else {
      const newArticles = enhanceNewsData(news.slice(newsOffset));
      allNews = [...allNews, ...newArticles];
      newsOffset += newsLimit;
    }

    filterAndDisplayNews();
    updateNewsCount();

    // Disable load more if no more news
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (news.length < newsLimit + newsOffset) {
      loadMoreBtn.style.display = 'none';
    }

  } catch (error) {
    console.error('Error loading news:', error);
    showNewsError();
  }
}

function enhanceNewsData(news) {
  return news.map(article => ({
    ...article,
    category: detectCategory(article.title + ' ' + (article.body || '')),
    excerpt: (article.body || '').substring(0, 150) + '...',
    timeAgo: getTimeAgo(new Date(article.published_on * 1000)),
    searchText: (article.title + ' ' + (article.body || '')).toLowerCase()
  }));
}

function detectCategory(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('bitcoin') || lowerText.includes('btc')) return 'bitcoin';
  if (lowerText.includes('ethereum') || lowerText.includes('eth')) return 'ethereum';
  if (lowerText.includes('regulation') || lowerText.includes('sec') || lowerText.includes('government')) return 'regulation';
  if (lowerText.includes('defi') || lowerText.includes('decentralized')) return 'defi';
  if (lowerText.includes('nft') || lowerText.includes('non-fungible')) return 'nft';
  return 'general';
}

function filterAndDisplayNews() {
  // Filter by category
  filteredNews = currentCategory === 'all' 
    ? [...allNews] 
    : allNews.filter(article => article.category === currentCategory);

  // Sort news
  sortNewsData();

  // Display news
  displayNews();
}

function sortNewsData() {
  switch (currentSort) {
    case 'newest':
      filteredNews.sort((a, b) => b.published_on - a.published_on);
      break;
    case 'oldest':
      filteredNews.sort((a, b) => a.published_on - b.published_on);
      break;
    case 'relevance':
      // Simple relevance sort by category match
      filteredNews.sort((a, b) => {
        const aRelevant = a.category === currentCategory ? 1 : 0;
        const bRelevant = b.category === currentCategory ? 1 : 0;
        return bRelevant - aRelevant;
      });
      break;
  }
}

function displayNews() {
  const newsGrid = document.getElementById('newsGrid');
  
  if (filteredNews.length === 0) {
    newsGrid.innerHTML = `
      <div class="loading-news">
        <p>No news found for the selected criteria.</p>
      </div>
    `;
    return;
  }

  newsGrid.innerHTML = filteredNews.map(article => `
    <article class="news-card" onclick="openNewsArticle('${article.url}')">
      <img src="${article.imageurl}" alt="News" class="news-card-image" 
           onerror="this.src='https://via.placeholder.com/400x200/333/fff?text=Crypto+News'">
      <div class="news-card-content">
        <span class="news-card-category">${getCategoryDisplay(article.category)}</span>
        <h3 class="news-card-title">${article.title}</h3>
        <p class="news-card-excerpt">${article.excerpt}</p>
        <div class="news-card-meta">
          <span class="news-source">${article.source_info.name}</span>
          <span class="news-time">🕒 ${article.timeAgo}</span>
        </div>
      </div>
    </article>
  `).join('');
}

function getCategoryDisplay(category) {
  const categories = {
    bitcoin: 'Bitcoin',
    ethereum: 'Ethereum', 
    regulation: 'Regulation',
    defi: 'DeFi',
    nft: 'NFT',
    general: 'General'
  };
  return categories[category] || 'Crypto';
}

function filterNews(category) {
  currentCategory = category;
  
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-category="${category}"]`).classList.add('active');

  filterAndDisplayNews();
}

function sortNews(sortBy) {
  currentSort = sortBy;
  filterAndDisplayNews();
}

function searchNews() {
  const searchTerm = document.getElementById('newsSearch').value.toLowerCase().trim();
  
  if (searchTerm === '') {
    filteredNews = currentCategory === 'all' ? [...allNews] : allNews.filter(article => article.category === currentCategory);
  } else {
    const baseFilter = currentCategory === 'all' ? allNews : allNews.filter(article => article.category === currentCategory);
    filteredNews = baseFilter.filter(article => article.searchText.includes(searchTerm));
  }

  sortNewsData();
  displayNews();
}

function loadMoreNews() {
  loadNews(true);
}

function openNewsArticle(url) {
  window.open(url, '_blank');
}

async function updateMarketSentiment() {
  try {
    const fearGreedData = await cryptoAPI.getFearGreedIndex();
    const fearGreed = fearGreedData.data[0];
    
    const value = parseInt(fearGreed.value);
    
    // Use standard Fear & Greed scale for classification
    let textClassification = '';
    if (value <= 24) {
      textClassification = 'Extreme Fear';
    } else if (value <= 49) {
      textClassification = 'Fear';
    } else if (value <= 74) {
      textClassification = 'Neutral';
    } else {
      textClassification = 'Greed';
    }
    
    document.getElementById('fearGreedValue').textContent = `${fearGreed.value} (${textClassification})`;
    document.getElementById('fearGreedValue').className = `sentiment-value ${getFearGreedClass(value)}`;

  } catch (error) {
    console.error('Error updating market sentiment:', error);
    document.getElementById('fearGreedValue').textContent = 'Loading...';
  }
}

function getFearGreedClass(value) {
  if (value <= 24) return 'negative'; // Extreme Fear
  if (value <= 49) return 'negative'; // Fear
  if (value <= 74) return 'neutral';  // Neutral
  return 'positive'; // Greed
}

function updateNewsCount() {
  document.getElementById('newsCount').textContent = allNews.length;
}

function showNewsError() {
  document.getElementById('newsGrid').innerHTML = `
    <div class="loading-news">
      <p>⚠️ Unable to load news. Please try again later.</p>
      <button onclick="loadNews()" class="load-more-btn">Retry</button>
    </div>
  `;
}

function getTimeAgo(date) {
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

// Search on Enter key
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('newsSearch');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchNews();
      }
    });
  }
});

// Utility functions
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

// Load saved theme
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