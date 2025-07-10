class InventoryValueWidget {
  constructor() {
    this.chart = null;
    this.init();
  }

  async init() {
    console.log('Inventory Value Widget initialized');
    await this.loadInventoryData();
  }

  async loadInventoryData() {
    try {
      console.log('Loading inventory value data...');
      const response = await fetch('/api/products/inventory-value?t=' + Date.now());
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory value data');
      }
      
      const data = await response.json();
      console.log('Inventory value data loaded:', data);
      
      this.updateDisplay(data);
      this.updateChart(data);
    } catch (error) {
      console.error('Error loading inventory value data:', error);
      this.showErrorState();
    }
  }

  updateDisplay(data) {
    // Update main value
    const valueElement = document.getElementById('inventory-value-amount');
    if (valueElement) {
      valueElement.textContent = '$' + data.currentValue.toLocaleString();
    }
    
    // Update category information
    const highestCategoryElement = document.getElementById('highest-category');
    if (highestCategoryElement && data.highestCategory) {
      highestCategoryElement.textContent = `${data.highestCategory.name} ($${data.highestCategory.value.toLocaleString()})`;
    }
    
    const lowestCategoryElement = document.getElementById('lowest-category');
    if (lowestCategoryElement && data.lowestCategory) {
      lowestCategoryElement.textContent = `${data.lowestCategory.name} ($${data.lowestCategory.value.toLocaleString()})`;
    }
  }

  updateChart(data) {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded yet. Retrying in 500ms...');
      setTimeout(() => this.updateChart(data), 500);
      return;
    }

    const ctx = document.getElementById('inventory-value-chart');
    
    if (!ctx) {
      console.error('Canvas element not found');
      return;
    }

    // Prepare chart data
    const months = data.historicalData.map(item => item.month);
    const values = data.historicalData.map(item => item.value);

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    try {
      // Create new chart
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Total Value ($)',
            data: values,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'white',
            pointBorderColor: '#10b981',
            pointRadius: 4,
            pointHoverRadius: 6
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
                label: function(context) {
                  return `Value: $${context.raw.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              grid: {
                color: 'rgba(0,0,0,0.1)'
              },
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });

      console.log('Chart created successfully');
    } catch (error) {
      console.error('Error creating chart:', error);
      this.showErrorState();
    }
  }

  showErrorState() {
    // Update main value
    const valueElement = document.getElementById('inventory-value-amount');
    if (valueElement) {
      valueElement.textContent = 'Error loading data';
      valueElement.style.color = '#EF4444';
    }
    
    // Update category information
    const highestCategoryElement = document.getElementById('highest-category');
    if (highestCategoryElement) {
      highestCategoryElement.textContent = 'Error';
      highestCategoryElement.style.color = '#EF4444';
    }
    
    const lowestCategoryElement = document.getElementById('lowest-category');
    if (lowestCategoryElement) {
      lowestCategoryElement.textContent = 'Error';
      lowestCategoryElement.style.color = '#EF4444';
    }

    // Show error message in chart area
    const canvas = document.getElementById('inventory-value-chart');
    if (canvas) {
      const fallback = document.createElement('div');
      fallback.className = 'flex items-center justify-center h-full text-gray-500';
      fallback.innerHTML = '<div class="text-center"><i class="fas fa-exclamation-triangle text-2xl mb-2 text-red-500"></i><br>Failed to load chart data</div>';
      canvas.parentNode.replaceChild(fallback, canvas);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure Chart.js is loaded
  setTimeout(() => {
    new InventoryValueWidget();
  }, 300);
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
  setTimeout(() => {
    new InventoryValueWidget();
  }, 300);
}
