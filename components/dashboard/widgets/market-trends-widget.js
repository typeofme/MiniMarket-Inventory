class MarketTrendsWidget {
  constructor() {
    this.init();
  }

  async init() {
    console.log('Market Trends Widget initialized');
    await this.loadMarketTrends();
    
    // Refresh trends every 10 minutes
    setInterval(() => {
      this.loadMarketTrends();
    }, 600000);
  }

  async loadMarketTrends() {
    try {
      console.log('Loading market trends...');
      const response = await fetch('/api/reports/market-trends?t=' + Date.now());
      
      if (!response.ok) {
        throw new Error('Failed to fetch market trends');
      }
      
      const trends = await response.json();
      console.log('Market trends loaded:', trends);
      this.updateTrendsDisplay(trends);
    } catch (error) {
      console.error('Error loading market trends:', error);
      this.showErrorState();
    }
  }

  updateTrendsDisplay(trends) {
    const container = document.querySelector('.sf-items-container');
    if (!container) {
      console.error('Market trends container not found');
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    if (!trends || trends.length === 0) {
      container.innerHTML = `
        <div class="sf-trend-item">
          <div class="sf-category">
            <div class="sf-category-icon gray">
              <i class="fas fa-info-circle"></i>
            </div>
            <span class="sf-category-name">No data available</span>
          </div>
        </div>
      `;
      return;
    }

    // Generate trend items
    trends.forEach(trend => {
      const trendItem = this.createTrendItem(trend);
      container.appendChild(trendItem);
    });

    // Add a note at the bottom if we have trends
    if (trends.length > 0) {
      const noteItem = document.createElement('div');
      noteItem.className = 'sf-trend-note';
      noteItem.innerHTML = `
        <div style="text-align: center; padding: 8px; color: #8E8E93; font-size: 12px; border-top: 1px solid rgba(0,0,0,0.05); margin-top: 8px;">
          <i class="fas fa-info-circle"></i> Based on weekly sales comparison
        </div>
      `;
      container.appendChild(noteItem);
    }
  }

  createTrendItem(trend) {
    const item = document.createElement('div');
    item.className = 'sf-trend-item';

    const colorClass = this.getColorClass(trend.category_color);
    const badgeClass = trend.direction === 'positive' ? 'positive' : 
                      trend.direction === 'negative' ? 'negative' : 'neutral';

    item.innerHTML = `
      <div class="sf-category">
        <div class="sf-category-icon ${colorClass}">
          <i class="${trend.category_icon}"></i>
        </div>
        <span class="sf-category-name">${trend.category_name}</span>
      </div>
      <span class="sf-trend-badge ${badgeClass}">
        <i class="${trend.trend_icon}"></i>
        ${trend.change_percentage}%
      </span>
    `;

    return item;
  }

  getColorClass(color) {
    // Map hex colors to CSS classes or use default colors
    const colorMap = {
      '#3B82F6': 'blue',
      '#2563eb': 'blue',
      '#10B981': 'green', 
      '#16a34a': 'green',
      '#F59E0B': 'amber',
      '#ca8a04': 'amber',
      '#8B5CF6': 'purple',
      '#9333ea': 'purple',
      '#9141ac': 'purple',
      '#EF4444': 'red',
      '#DC2626': 'red',
      '#6B7280': 'gray',
      '#db2777': 'red'
    };

    return colorMap[color] || 'blue';
  }

  showErrorState() {
    const container = document.querySelector('.sf-items-container');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-trend-item">
        <div class="sf-category">
          <div class="sf-category-icon red">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <span class="sf-category-name">Error loading trends</span>
        </div>
        <button onclick="location.reload()" class="sf-retry-btn">
          <i class="fas fa-redo"></i>
        </button>
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure the component is fully loaded
  setTimeout(() => {
    new MarketTrendsWidget();
  }, 100);
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      new MarketTrendsWidget();
    }, 100);
  });
} else {
  new MarketTrendsWidget();
}
