class InventoryTurnoverWidget {
  constructor() {
    this.chart = null;
    this.init();
  }

  async init() {
    console.log('Inventory Turnover Widget initialized');
    await this.loadTurnoverData();
    
    // Refresh data every 15 minutes
    setInterval(() => {
      this.loadTurnoverData();
    }, 900000);
  }

  async loadTurnoverData() {
    try {
      console.log('Loading inventory turnover data...');
      const response = await fetch('/api/reports/inventory-turnover?t=' + Date.now());
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory turnover data');
      }
      
      const data = await response.json();
      console.log('Inventory turnover data loaded:', data);
      this.updateChart(data);
      this.updateStats(data.statistics);
    } catch (error) {
      console.error('Error loading inventory turnover data:', error);
      this.showErrorState();
    }
  }

  updateChart(data) {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded yet. Retrying in 500ms...');
      setTimeout(() => this.updateChart(data), 500);
      return;
    }

    const ctx = document.getElementById('inventory-turnover-chart');
    const loader = document.getElementById('turnover-loader');
    
    if (!ctx) {
      console.error('Canvas element not found');
      return;
    }

    // Prepare chart data
    const categories = data.categories || [];
    
    // Handle extreme values by capping them and showing indication
    const processedData = categories.map(cat => {
      const turnoverDays = cat.turnover_days;
      const isExtreme = turnoverDays > 50; // Cap at 50 days for better visualization
      
      return {
        ...cat,
        displayValue: isExtreme ? 50 : turnoverDays,
        actualValue: turnoverDays,
        isExtreme: isExtreme,
        label: cat.category_name + (isExtreme ? ' (>50d)' : '')
      };
    });

    const labels = processedData.map(cat => cat.label);
    const turnoverData = processedData.map(cat => cat.displayValue);
    const colors = processedData.map(cat => this.getCategoryColor(cat.category_color));

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    try {
      // Create new chart
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Days',
            data: turnoverData,
            backgroundColor: colors.map((color, index) => {
              // Make extreme values more transparent and add pattern
              return processedData[index].isExtreme ? color + '40' : color + '80';
            }),
            borderColor: colors,
            borderWidth: processedData.map(cat => cat.isExtreme ? 3 : 2),
            borderRadius: 4,
            borderDash: processedData.map(cat => cat.isExtreme ? [5, 5] : [])
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  const actualValue = processedData[index].actualValue;
                  const isExtreme = processedData[index].isExtreme;
                  
                  if (isExtreme) {
                    return `Turnover: ${actualValue} days (slow moving)`;
                  } else {
                    return `Turnover: ${actualValue} days`;
                  }
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: true,
                color: 'rgba(0,0,0,0.1)'
              },
              ticks: {
                callback: function(value) {
                  if (value >= 50) {
                    return '50+ d';
                  }
                  return value + 'd';
                }
              },
              max: 55 // Set a reasonable maximum
            },
            y: {
              grid: {
                display: false
              }
            }
          },
          animation: {
            duration: 1000,
            onComplete: () => {
              if (loader) loader.style.display = 'none';
            }
          }
        }
      });

      console.log('Chart created successfully with processed data');
    } catch (error) {
      console.error('Error creating chart:', error);
      this.showErrorState();
    }
  }

  updateStats(statistics) {
    if (!statistics) return;

    // Update average turnover
    const avgElement = document.querySelector('.bg-blue-50 p.font-bold.text-blue-700');
    if (avgElement && statistics.average_turnover) {
      avgElement.textContent = `${statistics.average_turnover} days`;
    }

    // Update fastest category
    const fastestElement = document.querySelector('.bg-green-50 p.font-bold.text-green-700');
    if (fastestElement && statistics.fastest_category) {
      const fastest = statistics.fastest_category;
      fastestElement.textContent = `${fastest.name} (${fastest.turnover_days}d)`;
    }
  }

  getCategoryColor(hexColor) {
    // Convert hex colors to chart-friendly colors
    const colorMap = {
      '#3B82F6': '#3B82F6',
      '#2563eb': '#2563EB',
      '#10B981': '#10B981',
      '#16a34a': '#16A34A',
      '#F59E0B': '#F59E0B',
      '#ca8a04': '#CA8A04',
      '#8B5CF6': '#8B5CF6',
      '#9333ea': '#9333EA',
      '#9141ac': '#9141AC',
      '#EF4444': '#EF4444',
      '#DC2626': '#DC2626',
      '#6B7280': '#6B7280',
      '#db2777': '#DB2777'
    };

    return colorMap[hexColor] || '#6B7280';
  }

  showErrorState() {
    const loader = document.getElementById('turnover-loader');
    const errorDisplay = document.getElementById('turnover-error');
    
    if (loader) loader.style.display = 'none';
    if (errorDisplay) errorDisplay.classList.remove('hidden');

    // Update stats with error message
    const statElements = document.querySelectorAll('.grid.grid-cols-2 p.font-bold');
    statElements.forEach(el => {
      el.textContent = 'Error';
      el.style.color = '#EF4444';
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure Chart.js is loaded
  setTimeout(() => {
    new InventoryTurnoverWidget();
  }, 200);
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
  setTimeout(() => {
    new InventoryTurnoverWidget();
  }, 200);
}
