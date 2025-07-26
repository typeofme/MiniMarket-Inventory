// Low Stock Widget JavaScript
class LowStockWidget {
  constructor(containerId) {
    console.log('LowStockWidget constructor called');
    this.container = document.getElementById(containerId) || document.querySelector('.low-stock-widget');
    this.threshold = 10; // Default threshold for low stock
    this.limit = 5; // Number of items to display
    
    if (!this.container) {
      console.error('Low stock widget container not found');
      return;
    }
    
    console.log('Low stock widget container found:', this.container);
    this.init();
  }

  async init() {
    await this.loadLowStockData();
    this.attachEventListeners();
  }

  async loadLowStockData() {
    try {
      console.log('Loading low stock data...');
      const response = await fetch(`/api/products/low-stock?threshold=${this.threshold}&limit=${this.limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const lowStockProducts = await response.json();
      console.log('Low stock products loaded:', lowStockProducts);
      this.renderLowStockItems(lowStockProducts);
    } catch (error) {
      console.error('Error loading low stock data:', error);
      this.renderError();
    }
  }

  renderLowStockItems(products) {
    console.log('Rendering low stock items:', products);
    
    if (!this.container) {
      console.error('Container not found for rendering');
      return;
    }

    const itemsContainer = this.container.querySelector('.low-stock-items') || 
                          this.container.querySelector('.space-y-3');

    if (!itemsContainer) {
      console.error('Items container not found');
      return;
    }

    console.log('Items container found, rendering products...');

    if (products.length === 0) {
      itemsContainer.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
          <p class="text-sm text-gray-500">All products are well stocked!</p>
        </div>
      `;
      return;
    }

    itemsContainer.innerHTML = products.map(product => {
      const stockPercentage = Math.min((product.stock / this.threshold) * 100, 100);
      const alertLevel = product.stock <= 5 ? 'red' : 'amber';
      const categoryIcon = product.category_icon || 'fas fa-box';
      const price = product.price ? `$${parseFloat(product.price).toFixed(2)}` : '';
      
      return `
        <div class="flex items-center justify-between p-3 bg-${alertLevel}-50 rounded-lg border border-${alertLevel}-100">
          <div class="flex items-center flex-1">
            <div class="bg-${alertLevel}-100 p-2 rounded-lg mr-3">
              <i class="${categoryIcon} text-${alertLevel}-600 text-sm"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-800">${product.name}</h4>
                ${price ? `<span class="text-xs text-gray-500 font-medium">${price}</span>` : ''}
              </div>
              <div class="flex items-center mt-1">
                <div class="w-20 h-2 bg-gray-200 rounded-full mr-2">
                  <div class="h-2 bg-${alertLevel}-500 rounded-full" style="width: ${stockPercentage}%"></div>
                </div>
                <span class="text-xs text-${alertLevel}-600 font-medium">${product.stock} left</span>
              </div>
              ${product.category_name ? `<span class="inline-block px-2 py-0.5 text-xs bg-white text-gray-600 rounded-full border mt-1">${product.category_name}</span>` : ''}
            </div>
          </div>
          <button class="restock-btn text-xs bg-white border border-${alertLevel}-300 hover:bg-${alertLevel}-50 text-${alertLevel}-700 py-1.5 px-3 rounded-lg transition-all font-medium ml-3" 
                  data-product-id="${product.id}" 
                  data-product-name="${product.name}">
            <i class="fas fa-plus mr-1"></i>Restock
          </button>
        </div>
      `;
    }).join('');
    
    console.log('Low stock items rendered successfully');
  }

  renderError() {
    console.log('Rendering error state');
    
    if (!this.container) {
      console.error('Container not found for error rendering');
      return;
    }

    const itemsContainer = this.container.querySelector('.low-stock-items') || 
                          this.container.querySelector('.space-y-3');

    if (!itemsContainer) {
      console.error('Items container not found for error rendering');
      return;
    }

    itemsContainer.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
        <p class="text-sm text-gray-500">Unable to load low stock data</p>
        <button class="retry-btn text-xs text-blue-600 hover:underline mt-2">Retry</button>
      </div>
    `;

    // Add retry functionality
    const retryBtn = itemsContainer.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        console.log('Retrying to load low stock data...');
        this.loadLowStockData();
      });
    }
  }

  attachEventListeners() {
    if (!this.container) return;

    // Handle restock button clicks
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('restock-btn')) {
        window.location.href = '/restock';
      }
    });

    // Handle widget header click to navigate to restock page
    const widgetHeader = this.container.querySelector('h3');
    if (widgetHeader) {
      widgetHeader.addEventListener('click', () => {
        window.location.href = '/restock';
      });
    }
  }

  handleRestockClick(productId, productName) {
    // Create a more sophisticated restock modal/action
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="flex items-center mb-4">
          <i class="fas fa-box text-blue-600 text-xl mr-3"></i>
          <h3 class="text-lg font-semibold">Restock Product</h3>
        </div>
        <p class="text-gray-600 mb-4">Initiate restock order for <strong>${productName}</strong>?</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Quantity to order:</label>
          <input type="number" id="restock-quantity" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                 value="20" min="1">
        </div>
        <div class="flex justify-end space-x-3">
          <button class="cancel-btn px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button class="confirm-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Confirm Order
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle modal actions
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.confirm-btn').addEventListener('click', () => {
      const quantity = modal.querySelector('#restock-quantity').value;
      this.processRestockOrder(productId, productName, quantity);
      document.body.removeChild(modal);
    });

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  async processRestockOrder(productId, productName, quantity) {
    try {
      // This would typically make an API call to create a restock order
      // For now, we'll show a success message and refresh the data
      
      // Show success notification
      this.showNotification(`Restock order for ${quantity} units of ${productName} has been initiated.`, 'success');
      
      // Refresh the low stock data
      setTimeout(() => {
        this.loadLowStockData();
      }, 1000);
      
    } catch (error) {
      console.error('Error processing restock order:', error);
      this.showNotification('Failed to process restock order. Please try again.', 'error');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${
          type === 'success' ? 'fa-check-circle' : 
          type === 'error' ? 'fa-exclamation-circle' : 
          'fa-info-circle'
        } mr-3"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }

  // Method to refresh data (can be called externally)
  refresh() {
    this.loadLowStockData();
  }

  // Method to update threshold (can be called externally)
  updateThreshold(newThreshold) {
    this.threshold = newThreshold;
    this.loadLowStockData();
  }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize low stock widget if container exists
  const lowStockContainer = document.querySelector('.low-stock-widget') || 
                           document.querySelector('[data-widget="low-stock"]');
  
  if (lowStockContainer) {
    console.log('Initializing low stock widget...');
    window.lowStockWidget = new LowStockWidget();
  } else {
    console.log('Low stock widget container not found');
  }
});

// Also try to initialize when the component is loaded
setTimeout(() => {
  const lowStockContainer = document.querySelector('.low-stock-widget') || 
                           document.querySelector('[data-widget="low-stock"]');
  
  if (lowStockContainer && !window.lowStockWidget) {
    console.log('Late initializing low stock widget...');
    window.lowStockWidget = new LowStockWidget();
  }
}, 1000);

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LowStockWidget;
}
