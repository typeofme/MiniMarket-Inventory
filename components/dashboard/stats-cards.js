/**
 * Dashboard Stats Cards Controller
 * Handles fetching and displaying real-time product statistics
 */
class DashboardStatsCards {
  constructor() {
    this.stats = {};
    this.isLoading = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.refreshInterval = null;
    
    this.init();
  }
  
  showLoading(message = "Loading dashboard stats...") {
    // Use global shared loading screen
    if (typeof window.showLoading === 'function') {
      window.showLoading(message);
    }
  }

  hideLoading() {
    // Use global shared loading screen
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }
  }
  
  async init() {
    console.log('Initializing Dashboard Stats Cards...');
    
    // Load initial data
    this.showLoading("Loading dashboard statistics...");
    await this.loadStats();
    
    // Set up auto-refresh every 30 seconds
    this.startAutoRefresh();
    
    // Bind refresh events if needed
    this.bindEvents();
  }
  
  async loadStats() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingState();
    this.showLoading("Fetching dashboard metrics...");
    
    try {
      const response = await fetch('/api/products/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.stats = data;
      
      this.updateStatsCards();
      this.hideLoadingState();
      this.hideLoading();
      this.retryCount = 0; // Reset retry count on success

      // Update last updated time
      const lastUpdateElem = document.getElementById('last-update-time');
      if (lastUpdateElem) {
        const now = new Date();
        lastUpdateElem.textContent = now.toLocaleString();
      }

      console.log('Stats loaded successfully:', this.stats);
      
    } catch (error) {
      console.error('Error loading stats:', error);
      this.retryCount++;
      
      if (this.retryCount <= this.maxRetries) {
        console.log(`Retrying stats load... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.loadStats(), 2000 * this.retryCount);
      } else {
        this.showErrorState();
        this.hideLoading();
      }
    } finally {
      this.isLoading = false;
    }
  }
  
  updateStatsCards() {
    // Update Total Products card
    this.updateCard('total-products', {
      value: this.stats.totalProducts || 0,
      trend: `${this.stats.recentProducts || 0} recent`,
      progress: Math.min((this.stats.totalProducts / 100) * 100, 100),
      trendValue: this.stats.productsTrend || 0
    });
    
    // Update Low Stock card
    const lowStockPercentage = this.stats.totalProducts > 0 
      ? (this.stats.lowStockProducts / this.stats.totalProducts) * 100 
      : 0;
    
    this.updateCard('low-stock', {
      value: this.stats.lowStockProducts || 0,
      trend: `${this.stats.outOfStockProducts || 0} out of stock`,
      progress: Math.min(lowStockPercentage, 100),
      isNegative: (this.stats.lowStockProducts || 0) > 0,
      trendValue: this.stats.stockHealthScore || 100
    });
    
    // Update Total Value card (replacing Total Sales)
    this.updateCard('total-value', {
      value: `$${this.formatNumber(this.stats.totalValue || 0)}`,
      trend: `${this.stats.valueTrend || 0}%`,
      progress: Math.min((this.stats.totalValue / 200000) * 100, 100),
      trendValue: this.stats.valueTrend || 0
    });
    
    // Update Average Price card (replacing New Orders)
    this.updateCard('average-price', {
      value: `$${this.formatNumber(this.stats.averagePrice || 0, 2)}`,
      trend: `${this.formatNumber(this.stats.totalStock || 0)} total stock`,
      progress: Math.min((this.stats.averagePrice / 500) * 100, 100),
      trendValue: this.calculatePriceTrend(this.stats.averagePrice)
    });
  }
  
  updateCard(cardType, data) {
    const selectors = {
      'total-products': '.stat-stats-card:nth-child(1)',
      'low-stock': '.stat-stats-card:nth-child(2)',
      'total-value': '.stat-stats-card:nth-child(3)',
      'average-price': '.stat-stats-card:nth-child(4)'
    };
    
    const card = document.querySelector(selectors[cardType]);
    if (!card) return;
    
    // Update value
    const valueElement = card.querySelector('.stat-stats-value');
    if (valueElement) {
      this.animateValue(valueElement, data.value);
    }
    
    // Update trend
    const trendElement = card.querySelector('.stat-stats-trend span');
    if (trendElement) {
      trendElement.textContent = data.trend;
    }
    
    // Update trend direction and color based on trendValue
    const trendContainer = card.querySelector('.stat-stats-trend');
    if (trendContainer && data.trendValue !== undefined) {
      const isPositive = data.trendValue >= 0;
      const isNegativeCard = data.isNegative || false;
      
      // For low stock card, invert the logic (less low stock = positive)
      const shouldShowPositive = isNegativeCard ? !isPositive || data.trendValue > 80 : isPositive;
      
      trendContainer.className = `stat-stats-trend ${shouldShowPositive ? 'positive' : 'negative'}`;
      
      // Update trend icon based on the trend
      const trendIcon = trendContainer.querySelector('i');
      if (trendIcon) {
        if (cardType === 'total-products') {
          trendIcon.className = 'fas fa-check-circle';
        } else if (cardType === 'low-stock') {
          trendIcon.className = shouldShowPositive ? 'fas fa-shield-alt' : 'fas fa-exclamation-triangle';
        } else if (cardType === 'total-value') {
          trendIcon.className = shouldShowPositive ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        } else if (cardType === 'average-price') {
          trendIcon.className = 'fas fa-boxes';
        }
      }
    } else if (trendContainer) {
      trendContainer.className = `stat-stats-trend ${data.isNegative ? 'negative' : 'positive'}`;
    }
    
    // Update progress bar
    const progressElement = card.querySelector('.stat-progress');
    if (progressElement) {
      progressElement.style.width = `${data.progress}%`;
    }
  }
  
  animateValue(element, newValue) {
    if (typeof newValue === 'string' && newValue.includes('$')) {
      // Handle currency values
      element.textContent = newValue;
    } else {
      // Handle numeric values with animation
      const currentValue = parseInt(element.textContent) || 0;
      const targetValue = parseInt(newValue) || 0;
      
      if (currentValue === targetValue) return;
      
      const duration = 1000; // 1 second
      const steps = 30;
      const stepValue = (targetValue - currentValue) / steps;
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        const value = Math.round(currentValue + (stepValue * currentStep));
        element.textContent = currentStep === steps ? targetValue : value;
        
        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, duration / steps);
    }
  }
  
  calculateTrend(current, previous) {
    if (previous === 0) return current > 0 ? current : 0;
    const change = current - previous;
    const percentage = Math.round((change / previous) * 100);
    return Math.abs(percentage);
  }
  
  calculateValueTrend(value) {
    // Use the trend from the API response if available
    return this.stats.valueTrend || 0;
  }
  
  calculatePriceTrend(price) {
    // Calculate trend based on price ranges
    if (price > 300) return 15;
    if (price > 200) return 8;
    if (price > 100) return 3;
    return -2;
  }
  
  formatNumber(num, decimals = 0) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(decimals) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(decimals) + 'K';
    }
    return num.toFixed(decimals);
  }
  
  showLoadingState() {
    const cards = document.querySelectorAll('.stat-stats-card');
    cards.forEach(card => {
      card.style.opacity = '0.6';
      card.style.pointerEvents = 'none';
    });
  }
  
  hideLoadingState() {
    const cards = document.querySelectorAll('.stat-stats-card');
    cards.forEach(card => {
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
    });
  }
  
  showErrorState() {
    this.hideLoadingState();
    
    // Show error in the first card
    const firstCard = document.querySelector('.stat-stats-card .stat-stats-value');
    if (firstCard) {
      firstCard.textContent = 'Error';
      firstCard.style.color = '#FF453A';
    }
  }
  
  bindEvents() {
    // Manual refresh button
    const refreshBtn = document.getElementById('refresh-stats-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const icon = refreshBtn.querySelector('i');
        if (icon && !this.isLoading) {
          icon.classList.add('fa-spin');
          await this.loadStats();
          setTimeout(() => {
            icon.classList.remove('fa-spin');
          }, 500);
        }
      });
    }
    
    // Add click handlers for manual refresh on cards
    const cards = document.querySelectorAll('.stat-stats-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (!this.isLoading) {
          this.loadStats();
        }
      });
      
      // Add hover effect
      card.style.cursor = 'pointer';
    });
    
    // Add tooltips for better UX
    cards.forEach((card, index) => {
      const tooltips = [
        'Total products in inventory',
        'Products with stock ≤ 10 items',
        'Total value of all inventory',
        'Average price per product'
      ];
      
      card.title = tooltips[index];
    });
  }
  
  startAutoRefresh() {
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadStats();
    }, 30000);
  }
  
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  // Public API methods
  async refresh() {
    await this.loadStats();
  }
  
  getStats() {
    return this.stats;
  }
  
  destroy() {
    this.stopAutoRefresh();
  }
}

// Initialize when DOM is ready
(function() {
  let statsCards = null;
  
  function initStatsCards() {
    const statsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    if (statsContainer) {
      statsCards = new DashboardStatsCards();
      
      // Make it globally accessible for debugging
      if (typeof window !== 'undefined') {
        window.dashboardStatsCards = statsCards;
      }
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStatsCards);
  } else {
    initStatsCards();
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (statsCards) {
      statsCards.destroy();
    }
  });
})();
