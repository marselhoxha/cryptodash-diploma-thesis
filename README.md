# 🚀 CryptoDash - Cryptocurrency Dashboard

A comprehensive real-time cryptocurrency tracking platform with portfolio management, interactive charts, latest news, and market analysis.

## 🌟 Features

- **Real-time Market Data** - Live prices, market caps, and trading volumes
- **Portfolio Tracking** - Monitor investments with P&L calculations
- **Interactive Charts** - Multiple timeframes and technical analysis
- **Latest News** - Crypto news with filtering options
- **Price Alerts** - Custom notifications for target prices
- **Dark/Light Theme** - Modern responsive design

## 🚨 CORS Issue Fix

If you're getting CORS errors when opening the HTML files directly in your browser, you need to run a local HTTP server.

### Method 1: Using Python (Recommended)

**Option A: Automatic Script**
```bash
# Make the script executable (Mac/Linux)
chmod +x start-server.py

# Run the server
python3 start-server.py
```

**Option B: Manual Command**
```bash
# Navigate to the project directory
cd /path/to/your/project

# Start the server
python3 -m http.server 8000

# Or for Python 2
python -m SimpleHTTPServer 8000
```

**Windows Users:**
- Double-click `start-server.bat`
- Or run `python -m http.server 8000` in Command Prompt

### Method 2: Using Node.js
```bash
# Install http-server globally
npm install -g http-server

# Run the server
http-server -p 8000
```

### Method 3: Using VS Code
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 🌐 Access the Website

After starting the server, open your browser and go to:
**http://localhost:8000**

## 📁 Project Structure

```
cryptocurrency-dashboard/
├── index.html          # Home page
├── markets.html        # Market overview and crypto table
├── charts.html         # Interactive price charts
├── portfolio.html      # Portfolio tracking
├── news.html           # Latest crypto news
├── about.html          # About page
├── styles.css          # Main stylesheet
├── js/
│   └── app.js          # All JavaScript functionality
├── start-server.py     # Python server script
├── start-server.bat    # Windows batch file
└── README.md           # This file
```

## 🔧 Technical Details

### APIs Used
- **CoinGecko API** - Primary data source for prices and market data
- **CryptoCompare API** - News and additional market data
- **Alternative.me API** - Fear & Greed Index

### Technologies
- HTML5, CSS3, JavaScript ES6+
- Chart.js for data visualization
- Responsive design with CSS Grid and Flexbox
- Local storage for portfolio and settings

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement

## 📊 Data Sources

- **Market Data**: CoinGecko API (100+ cryptocurrencies)
- **News**: CryptoCompare API
- **Sentiment**: Alternative.me Fear & Greed Index
- **Charts**: Real-time price data with multiple timeframes

## ⚠️ Disclaimer

This platform is for informational purposes only. Cryptocurrency investments carry high risk. Always do your own research before making investment decisions.

## 🛠️ Development

To contribute or modify:

1. Clone/download the repository
2. Start the local server using any method above
3. Make your changes
4. Test in the browser at `http://localhost:8000`

## 📝 License

This project is open source and available under the MIT License.

---

**Data provided by CoinGecko, CryptoCompare, and Alternative.me APIs** 