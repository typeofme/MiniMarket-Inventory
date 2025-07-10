/**
 * Category Distribution Widget Controller
 * Handles data fetching, chart rendering, and interactivity for the category distribution widget
 */
class CategoryDistributionWidget {
  constructor() {
    this.chart = null;
    this.categories = [];
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Color palette for categories
    this.colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(34, 197, 94, 0.8)',    // Green
      'rgba(245, 158, 11, 0.8)',   // Amber
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(6, 182, 212, 0.8)',    // Cyan
      'rgba(16, 185, 129, 0.8)',   // Emerald
      'rgba(251, 146, 60, 0.8)',   // Orange
      'rgba(156, 163, 175, 0.8)'   // Gray
    ];
    
    this.init();
  }
  
  async init() {
    console.log('CategoryWidget: Initializing...');
    
    // Wait for Chart.js to be available
    await this.waitForChartJS();
    console.log('CategoryWidget: Chart.js is available');
    
    // Bind event listeners
    this.bindEvents();
    console.log('CategoryWidget: Event listeners bound');
    
    // Load initial data
    await this.loadCategoryData();
    
    this.isInitialized = true;
    console.log('CategoryWidget: Initialization complete');
  }
  
  async waitForChartJS() {
    return new Promise((resolve) => {
      const checkChart = () => {
        if (typeof Chart !== 'undefined') {
          resolve();
        } else {
          setTimeout(checkChart, 100);
        }
      };
      checkChart();
    });
  }
  
  bindEvents() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-chart-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
    }
    
    // Retry button
    const retryBtn = document.getElementById('retry-chart-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadCategoryData());
    }
  }
  
  async loadCategoryData() {
    console.log('CategoryWidget: Loading category data...');
    this.showLoader();
    this.hideError();
    this.hideNoData();
    
    try {
      const response = await fetch('/api/categories/with-counts');
      console.log('CategoryWidget: API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('CategoryWidget: API response data:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch category data');
      }
      
      this.categories = data.data || [];
      console.log('CategoryWidget: Loaded categories:', this.categories.length);
      
      if (this.categories.length === 0) {
        console.log('CategoryWidget: No categories found, showing no data message');
        this.showNoData();
        return;
      }
      
      this.renderChart();
      this.renderLegend();
      this.hideLoader();
      this.retryCount = 0; // Reset retry count on success
      console.log('CategoryWidget: Successfully rendered chart and legend');
      
    } catch (error) {
      console.error('CategoryWidget: Error loading category data:', error);
      this.retryCount++;
      
      if (this.retryCount <= this.maxRetries) {
        console.log(`CategoryWidget: Retrying... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.loadCategoryData(), 2000 * this.retryCount);
      } else {
        console.log('CategoryWidget: Max retries reached, showing error');
        this.showError();
      }
    }
  }
  
  renderChart() {
    const ctx = document.getElementById('category-distribution-chart');
    if (!ctx) {
      console.error('Chart canvas not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Prepare data for chart
    const labels = this.categories.map(cat => cat.name);
    const data = this.categories.map(cat => cat.product_count || 0);
    const total = data.reduce((sum, count) => sum + count, 0);
    const percentages = data.map(count => total > 0 ? Math.round((count / total) * 100) : 0);
    
    // Assign colors (use category color if available, otherwise fall back to default colors)
    const backgroundColors = this.categories.map((category, index) => {
      if (category.color && category.color.startsWith('#')) {
        // Convert hex color to rgba format
        const hex = category.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, 0.8)`;
      }
      return this.colors[index % this.colors.length];
    });
    
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: percentages,
          backgroundColor: backgroundColors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const category = this.categories[context.dataIndex];
                const count = category.product_count || 0;
                const percentage = context.raw || 0;
                return `${context.label}: ${count} products (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 800
        },
        onHover: (event, elements) => {
          ctx.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            this.selectCategory(index);
          }
        }
      }
    });
  }
  
  renderLegend() {
    const legendContainer = document.getElementById('category-legend');
    if (!legendContainer) return;
    
    legendContainer.innerHTML = '';
    
    this.categories.forEach((category, index) => {
      let color;
      if (category.color && category.color.startsWith('#')) {
        // Convert hex color to rgba format for legend
        const hex = category.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        color = `rgba(${r}, ${g}, ${b}, 0.8)`;
      } else {
        color = this.colors[index % this.colors.length];
      }
      
      const count = category.product_count || 0;
      const total = this.categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      
      const legendItem = document.createElement('div');
      legendItem.className = 'flex items-center space-x-2 p-1 rounded cursor-pointer hover:bg-gray-100 transition-colors';
      legendItem.onclick = () => this.selectCategory(index);
      
      legendItem.innerHTML = `
        <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
        <span class="text-gray-700 truncate flex-1">${category.name}</span>
        <span class="text-gray-500 text-xs">${count}</span>
      `;
      
      legendContainer.appendChild(legendItem);
    });
  }
  
  selectCategory(index) {
    if (index < 0 || index >= this.categories.length) return;
    
    const category = this.categories[index];
    const detailsContainer = document.getElementById('category-details');
    
    if (!detailsContainer) return;
    
    // Update category details
    const iconElement = document.getElementById('selected-category-icon');
    const nameElement = document.getElementById('selected-category-name');
    const descElement = document.getElementById('selected-category-desc');
    const countElement = document.getElementById('selected-category-count');
    
    if (iconElement) {
      // Handle both FontAwesome icons and emoji
      if (category.icon && category.icon.startsWith('fas ')) {
        iconElement.innerHTML = `<i class="${category.icon}"></i>`;
      } else {
        iconElement.textContent = category.icon || '📦';
      }
    }
    if (nameElement) nameElement.textContent = category.name;
    if (descElement) descElement.textContent = category.description || 'No description available';
    if (countElement) countElement.textContent = category.product_count || 0;
    
    // Show details with animation
    detailsContainer.classList.remove('hidden');
    
    // Highlight chart segment
    if (this.chart) {
      // Reset all segments to original colors
      this.chart.data.datasets[0].backgroundColor = this.categories.map((cat, i) => {
        if (cat.color && cat.color.startsWith('#')) {
          const hex = cat.color.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          return `rgba(${r}, ${g}, ${b}, 0.8)`;
        }
        return this.colors[i % this.colors.length];
      });
      
      // Highlight selected segment (make it more opaque)
      const selectedCategory = this.categories[index];
      if (selectedCategory.color && selectedCategory.color.startsWith('#')) {
        const hex = selectedCategory.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        this.chart.data.datasets[0].backgroundColor[index] = `rgba(${r}, ${g}, ${b}, 1.0)`;
      } else {
        this.chart.data.datasets[0].backgroundColor[index] = this.colors[index % this.colors.length].replace('0.8', '1.0');
      }
      
      this.chart.update('none');
      
      // Reset after 3 seconds
      setTimeout(() => {
        if (this.chart) {
          this.chart.data.datasets[0].backgroundColor = this.categories.map((cat, i) => {
            if (cat.color && cat.color.startsWith('#')) {
              const hex = cat.color.replace('#', '');
              const r = parseInt(hex.substr(0, 2), 16);
              const g = parseInt(hex.substr(2, 2), 16);
              const b = parseInt(hex.substr(4, 2), 16);
              return `rgba(${r}, ${g}, ${b}, 0.8)`;
            }
            return this.colors[i % this.colors.length];
          });
          this.chart.update('none');
          detailsContainer.classList.add('hidden');
        }
      }, 3000);
    }
    
    // Analytics tracking (if available)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'category_selected', {
        category_name: category.name,
        product_count: category.product_count
      });
    }
  }
  
  async refresh() {
    const refreshBtn = document.getElementById('refresh-chart-btn');
    if (refreshBtn) {
      refreshBtn.classList.add('animate-spin');
    }
    
    this.retryCount = 0; // Reset retry count
    await this.loadCategoryData();
    
    if (refreshBtn) {
      refreshBtn.classList.remove('animate-spin');
    }
  }
  
  showLoader() {
    const loader = document.getElementById('chart-loader');
    if (loader) loader.style.display = 'flex';
  }
  
  hideLoader() {
    const loader = document.getElementById('chart-loader');
    if (loader) loader.style.display = 'none';
  }
  
  showError() {
    this.hideLoader();
    const errorDisplay = document.getElementById('chart-error');
    if (errorDisplay) errorDisplay.classList.remove('hidden');
  }
  
  hideError() {
    const errorDisplay = document.getElementById('chart-error');
    if (errorDisplay) errorDisplay.classList.add('hidden');
  }
  
  showNoData() {
    this.hideLoader();
    const noDataDisplay = document.getElementById('chart-no-data');
    if (noDataDisplay) noDataDisplay.classList.remove('hidden');
  }
  
  hideNoData() {
    const noDataDisplay = document.getElementById('chart-no-data');
    if (noDataDisplay) noDataDisplay.classList.add('hidden');
  }
  
  // Public API methods
  getCategoryData() {
    return this.categories;
  }
  
  async updateData() {
    await this.loadCategoryData();
  }
  
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.isInitialized = false;
  }
}

// Initialize the widget when DOM is ready
(function() {
  let widget = null;
  
  function initWidget() {
    console.log('CategoryWidget: Checking for widget container...');
    if (document.getElementById('category-distribution-chart')) {
      console.log('CategoryWidget: Container found, creating widget instance...');
      widget = new CategoryDistributionWidget();
      
      // Make it globally accessible for debugging
      if (typeof window !== 'undefined') {
        window.categoryDistributionWidget = widget;
        console.log('CategoryWidget: Widget available globally as window.categoryDistributionWidget');
      }
    } else {
      console.log('CategoryWidget: Container not found, widget not initialized');
    }
  }
  
  if (document.readyState === 'loading') {
    console.log('CategoryWidget: DOM still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    console.log('CategoryWidget: DOM already loaded, initializing immediately...');
    initWidget();
  }
  
  // Auto-refresh every 5 minutes
  setInterval(() => {
    if (widget && widget.isInitialized) {
      console.log('CategoryWidget: Auto-refreshing data...');
      widget.updateData();
    }
  }, 5 * 60 * 1000);
})();
