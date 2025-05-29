
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const cryptoDetails = document.getElementById('cryptoDetails');
const popularCryptos = document.getElementById('popularCryptos');
const cryptoGrid = document.getElementById('cryptoGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const priceChart = document.getElementById('priceChart');
const oneMonthBtn = document.getElementById('oneMonth');
const sixMonthsBtn = document.getElementById('sixMonths');
const timeRangeText = document.getElementById('timeRangeText');


let cryptoData = [];
let selectedCrypto = null;
let historicalData = null;
let timeRange = '30';
let chart = null;


document.addEventListener('DOMContentLoaded', () => {
  fetchCryptoData();
  setupEventListeners();
});

function setupEventListeners() {
  searchInput.addEventListener('input', handleSearchInput);
  oneMonthBtn.addEventListener('click', () => handleTimeRangeChange('30'));
  sixMonthsBtn.addEventListener('click', () => handleTimeRangeChange('180'));
  

  document.addEventListener('click', (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.classList.add('hidden');
    }
  });
}


async function fetchCryptoData() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=7d,30d'
    );
    cryptoData = await response.json();
    renderPopularCryptos();
  } catch (error) {
    console.error('Error fetching crypto data:', error);
  }
}


function handleSearchInput() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  
  if (searchTerm === '') {
    searchResults.classList.add('hidden');
    return;
  }
  
  const filteredResults = cryptoData
    .filter(crypto => 
      crypto.name.toLowerCase().includes(searchTerm) || 
      crypto.symbol.toLowerCase().includes(searchTerm)
    )
    .slice(0, 8);
  
  if (filteredResults.length > 0) {
    renderSearchResults(filteredResults);
    searchResults.classList.remove('hidden');
  } else {
    searchResults.classList.add('hidden');
  }
}


function renderSearchResults(results) {
  searchResults.innerHTML = '';
  
  results.forEach((crypto, index) => {
    const resultItem = document.createElement('button');
    resultItem.className = 'search-result-item';
    resultItem.style.animationDelay = `${index * 50}ms`;
    
    const isPricePositive = crypto.price_change_percentage_24h >= 0;
    
    resultItem.innerHTML = `
      <img src="${crypto.image}" alt="${crypto.name}" class="result-image spin-slow">
      <div class="result-info">
        <div class="result-name">${crypto.name.toLowerCase()}</div>
        <div class="result-symbol">${crypto.symbol.toLowerCase()}</div>
      </div>
      <div class="result-price">
        <div class="result-price-value pulse-price">${formatPrice(crypto.current_price)}</div>
        <div class="result-price-change ${isPricePositive ? 'positive' : 'negative'} bounce-subtle">
          ${isPricePositive ? '+' : ''}${crypto.price_change_percentage_24h.toFixed(2)}%
        </div>
      </div>
    `;
    
    resultItem.addEventListener('click', () => handleCryptoSelect(crypto));
    searchResults.appendChild(resultItem);
  });
}


function handleCryptoSelect(crypto) {
  selectedCrypto = crypto;
  searchInput.value = '';
  searchResults.classList.add('hidden');
  fetchHistoricalData(crypto.id, timeRange);
  renderCryptoDetails();
  popularCryptos.classList.add('hidden');
  cryptoDetails.classList.remove('hidden');
}


async function fetchHistoricalData(cryptoId, days) {
  showLoading(true);
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`
    );
    historicalData = await response.json();
    renderChart();
  } catch (error) {
    console.error('Error fetching historical data:', error);
  } finally {
    showLoading(false);
  }
}


function handleTimeRangeChange(days) {
  timeRange = days;
  timeRangeText.textContent = days === '30' ? '1 month' : '6 months';
  
  
  oneMonthBtn.classList.toggle('active', days === '30');
  sixMonthsBtn.classList.toggle('active', days === '180');
  
  if (selectedCrypto) {
    fetchHistoricalData(selectedCrypto.id, days);
  }
}


function renderCryptoDetails() {
  if (!selectedCrypto) return;
  
  document.getElementById('cryptoImage').src = selectedCrypto.image;
  document.getElementById('cryptoName').textContent = selectedCrypto.name.toLowerCase();
  document.getElementById('cryptoSymbol').textContent = selectedCrypto.symbol.toLowerCase();
  document.getElementById('currentPrice').textContent = formatPrice(selectedCrypto.current_price);
  
  const priceChange24h = selectedCrypto.price_change_percentage_24h;
  const priceChange30d = selectedCrypto.price_change_percentage_30d_in_currency;
  
  document.getElementById('priceChange24hIcon').innerHTML = priceChange24h >= 0 
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trend-icon positive bounce-subtle"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trend-icon negative bounce-subtle"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>';
  
  document.getElementById('priceChange24h').textContent = `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`;
  document.getElementById('priceChange24h').className = `stat-value pulse-price ${priceChange24h >= 0 ? 'positive' : 'negative'}`;
  
  document.getElementById('priceChange30d').textContent = `${priceChange30d >= 0 ? '+' : ''}${priceChange30d.toFixed(2)}%`;
  document.getElementById('priceChange30d').className = `stat-value pulse-price ${priceChange30d >= 0 ? 'positive' : 'negative'}`;
  
  document.getElementById('marketCap').textContent = formatMarketCap(selectedCrypto.market_cap);
}


function renderChart() {
  if (!historicalData) return;
  
  const ctx = priceChart.getContext('2d');
  

  if (chart) {
    chart.destroy();
  }
  
  const chartData = historicalData.prices.map(([timestamp, price]) => ({
    x: new Date(timestamp),
    y: price
  }));
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'price',
        data: chartData,
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#A855F7',
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: timeRange === '30' ? 'day' : 'week'
          },
          grid: {
            color: 'rgba(55, 65, 81, 0.5)'
          },
          ticks: {
            color: '#9CA3AF'
          }
        },
        y: {
          grid: {
            color: 'rgba(55, 65, 81, 0.5)'
          },
          ticks: {
            color: '#9CA3AF',
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          backgroundColor: '#1F2937',
          borderColor: '#374151',
          borderWidth: 1,
          titleColor: '#F9FAFB',
          bodyColor: '#F9FAFB',
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: function(context) {
              return 'price: ' + formatPrice(context.parsed.y);
            }
          }
        },
        legend: {
          display: false
        }
      }
    }
  });
}


function renderPopularCryptos() {
  cryptoGrid.innerHTML = '';
  
  cryptoData.slice(0, 9).forEach((crypto, index) => {
    const card = document.createElement('div');
    card.className = 'crypto-card fade-in-stagger';
    card.style.animationDelay = `${index * 100}ms`;
    
    const isPricePositive = crypto.price_change_percentage_24h >= 0;
    
    card.innerHTML = `
      <div class="crypto-card-header">
        <img src="${crypto.image}" alt="${crypto.name}" class="crypto-card-image spin-slow">
        <div>
          <h3 class="crypto-card-name glow">${crypto.name.toLowerCase()}</h3>
          <p class="crypto-card-symbol pulse-slow">${crypto.symbol.toLowerCase()}</p>
        </div>
      </div>
      <div class="crypto-card-stats">
        <div class="crypto-card-stat">
          <span class="crypto-card-stat-label">price</span>
          <span class="crypto-card-stat-value pulse-price">${formatPrice(crypto.current_price)}</span>
        </div>
        <div class="crypto-card-stat">
          <span class="crypto-card-stat-label">24h</span>
          <span class="badge ${isPricePositive ? 'badge-positive' : 'badge-negative'} bounce-subtle">
            ${isPricePositive ? '+' : ''}${crypto.price_change_percentage_24h.toFixed(2)}%
          </span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => handleCryptoSelect(crypto));
    cryptoGrid.appendChild(card);
  });
}


function showLoading(isLoading) {
  if (isLoading) {
    loadingIndicator.classList.remove('hidden');
    priceChart.classList.add('hidden');
  } else {
    loadingIndicator.classList.add('hidden');
    priceChart.classList.remove('hidden');
  }
}


function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 6 : 2
  }).format(price);
}


function formatMarketCap(marketCap) {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}t`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}b`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}m`;
  return `$${marketCap.toLocaleString()}`;
}