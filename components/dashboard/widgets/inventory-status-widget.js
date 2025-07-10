class InventoryStatusWidget {
  constructor(containerId) {
    console.log('InventoryStatusWidget constructor called');
    this.container = document.getElementById(containerId) || document.querySelector('.inventory-status-widget');
    this.chart = null;
    this.chartCanvas = null;
    
    if (!this.container) {
      console.error('Inventory status widget container not found');
      return;
    }
    
    console.log('Inventory status widget container found:', this.container);
    this.init();
  }

  init() {
    console.log('Initializing inventory status widget...');
    this.setupElements();
    this.loadInventoryStatusData();
  }

  setupElements() {
    this.loader = this.container.querySelector('#status-loader');
    this.errorDisplay = this.container.querySelector('#status-error');
    this.chartCanvas = this.container.querySelector('#inventory-status-chart');
    
    // Text display elements
    this.healthyStockEl = this.container.querySelector('.healthy-stock');
    this.mediumStockEl = this.container.querySelector('.medium-stock');
    this.lowStockEl = this.container.querySelector('.low-stock');
    this.totalStockEl = this.container.querySelector('.total-stock');
  }

  async loadInventoryStatusData() {
    try {
      console.log('Loading inventory status data...');
      this.showLoader();

      const response = await fetch('/api/products/inventory-status');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Inventory status data loaded:', data);
      
      this.renderInventoryStatus(data);
      this.hideLoader();
      
    } catch (error) {
      console.error('Error loading inventory status:', error);
      this.renderError();
      this.hideLoader();
    }
  }

  renderInventoryStatus(data) {
    console.log('Rendering inventory status:', data);
    
    // Update text displays
    if (this.healthyStockEl) {
      this.healthyStockEl.textContent = `${data.healthy.count} items`;
    }
    if (this.mediumStockEl) {
      this.mediumStockEl.textContent = `${data.medium.count} items`;
    }
    if (this.lowStockEl) {
      this.lowStockEl.textContent = `${data.low.count} items`;
    }
    if (this.totalStockEl) {
      this.totalStockEl.textContent = `${data.total.count} items`;
    }

    // Render chart
    this.renderChart(data);
  }

  renderChart(data) {
    console.log('Rendering inventory status chart...');
    
    if (!this.chartCanvas) {
      console.error('Chart canvas not found');
      return;
    }

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded yet. Retrying in 500ms...');
      setTimeout(() => this.renderChart(data), 500);
      return;
    }

    try {
      // Destroy existing chart if it exists
      if (this.chart) {
        this.chart.destroy();
      }

      const chartData = [data.healthy.count, data.medium.count, data.low.count];
      
      // Create the doughnut chart
      this.chart = new Chart(this.chartCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Healthy Stock', 'Medium Stock', 'Low Stock'],
          datasets: [{
            data: chartData,
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',  // Green - Healthy
              'rgba(245, 158, 11, 0.8)', // Amber - Medium
              'rgba(239, 68, 68, 0.8)'   // Red - Low
            ],
            borderWidth: 1,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: {
                  size: 10
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${label}: ${value} items (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true
          }
        }
      });

      console.log('Inventory status chart rendered successfully');
      
    } catch (error) {
      console.error('Error creating inventory status chart:', error);
      this.renderError();
    }
  }

  showLoader() {
    if (this.loader) {
      this.loader.style.display = 'flex';
    }
    if (this.errorDisplay) {
      this.errorDisplay.classList.add('hidden');
    }
  }

  hideLoader() {
    if (this.loader) {
      this.loader.style.display = 'none';
    }
  }

  renderError() {
    console.log('Rendering error state for inventory status');
    
    if (this.errorDisplay) {
      this.errorDisplay.classList.remove('hidden');
      
      // Add retry functionality
      const retryBtn = this.errorDisplay.querySelector('.retry-btn');
      if (!retryBtn) {
        const retryButton = document.createElement('button');
        retryButton.className = 'retry-btn text-xs text-blue-600 hover:underline mt-2';
        retryButton.textContent = 'Retry';
        retryButton.addEventListener('click', () => {
          console.log('Retrying to load inventory status data...');
          this.loadInventoryStatusData();
        });
        this.errorDisplay.querySelector('div').appendChild(retryButton);
      }
    }

    // Update text displays with error state
    if (this.healthyStockEl) this.healthyStockEl.textContent = '-- items';
    if (this.mediumStockEl) this.mediumStockEl.textContent = '-- items';
    if (this.lowStockEl) this.lowStockEl.textContent = '-- items';
    if (this.totalStockEl) this.totalStockEl.textContent = '-- items';
  }

  // Method to refresh the widget data
  refresh() {
    console.log('Refreshing inventory status widget...');
    this.loadInventoryStatusData();
  }

  // Method to destroy the widget
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize inventory status widget if container exists
  const inventoryStatusContainer = document.querySelector('.inventory-status-widget') || 
                                  document.querySelector('[data-widget="inventory-status"]') ||
                                  document.getElementById('inventory-status-chart')?.closest('.dashboard-card');
  
  if (inventoryStatusContainer) {
    console.log('Initializing inventory status widget...');
    window.inventoryStatusWidget = new InventoryStatusWidget();
  } else {
    console.log('Inventory status widget container not found');
  }
});

// Also try to initialize when the component is loaded
setTimeout(() => {
  const inventoryStatusContainer = document.querySelector('.inventory-status-widget') || 
                                  document.querySelector('[data-widget="inventory-status"]') ||
                                  document.getElementById('inventory-status-chart')?.closest('.dashboard-card');
  
  if (inventoryStatusContainer && !window.inventoryStatusWidget) {
    console.log('Late initializing inventory status widget...');
    window.inventoryStatusWidget = new InventoryStatusWidget();
  }
}, 1000);
