// Inventory Alerts Component JavaScript
class InventoryAlertsComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId) || document.querySelector('.inventory-alerts-component');
    this.lowStockThreshold = 10;
    this.criticalStockThreshold = 5;
    this.init();
  }

  showLoading(message = "Loading inventory alerts...") {
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
    this.showLoading();
    await this.loadInventoryAlerts();
    this.hideLoading();
    this.attachEventListeners();
  }

  async loadInventoryAlerts() {
    try {
      this.showLoading("Fetching inventory status...");
      const response = await fetch(`/api/products/low-stock?threshold=${this.lowStockThreshold}&limit=20`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const lowStockProducts = await response.json();
      this.renderInventoryAlerts(lowStockProducts);
      this.hideLoading();
    } catch (error) {
      console.error('Error loading inventory alerts:', error);
      this.renderError();
      this.hideLoading();
    }
  }

  renderInventoryAlerts(products) {
    if (!this.container) return;

    const alertsContainer = this.container.querySelector('.inventory-alerts-list') || 
                          this.container.querySelector('.space-y-4');

    if (!alertsContainer) return;

    if (products.length === 0) {
      alertsContainer.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-check-circle text-green-500 text-3xl mb-3"></i>
          <h4 class="text-lg font-medium text-gray-700 mb-2">All Good!</h4>
          <p class="text-sm text-gray-500">No inventory alerts at this time.</p>
        </div>
      `;
      return;
    }

    alertsContainer.innerHTML = products.map(product => {
      const isCritical = product.stock <= this.criticalStockThreshold;
      const alertLevel = isCritical ? 'red' : 'amber';
      const alertIcon = isCritical ? 'fas fa-exclamation-circle' : 'fas fa-exclamation-triangle';
      const categoryIcon = product.category_icon || 'fas fa-box';
      
      return `
        <div class="flex items-center justify-between p-4 bg-${alertLevel}-50 rounded-lg border border-${alertLevel}-200">
          <div class="flex items-center">
            <div class="bg-${alertLevel}-100 p-2.5 rounded-lg mr-4">
              <i class="${alertIcon} text-${alertLevel}-600"></i>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-800">${product.name}</h4>
              <p class="text-xs text-gray-600">Only ${product.stock} units remaining</p>
              ${product.category_name ? `<p class="text-xs text-gray-500 mt-1">Category: ${product.category_name}</p>` : ''}
              <div class="flex items-center mt-2">
                <div class="w-20 h-2 bg-gray-200 rounded-full mr-2">
                  <div class="h-2 bg-${alertLevel}-500 rounded-full" style="width: ${Math.min((product.stock / this.lowStockThreshold) * 100, 100)}%"></div>
                </div>
                <span class="text-xs text-gray-500">${product.stock}/${this.lowStockThreshold}</span>
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <button class="restock-btn text-xs bg-white border border-${alertLevel}-300 hover:bg-${alertLevel}-50 text-${alertLevel}-700 py-2 px-4 rounded-lg transition-all mb-2" 
                    data-product-id="${product.id}" 
                    data-product-name="${product.name}">
              <i class="fas fa-plus mr-1"></i>Restock Now
            </button>
            <span class="text-xs text-gray-500">$${parseFloat(product.price).toFixed(2)} each</span>
          </div>
        </div>
      `;
    }).join('');

    // Update alert count in header if element exists
    this.updateAlertCount(products.length);
  }

  updateAlertCount(count) {
    const countElement = this.container.querySelector('.alert-count');
    if (countElement) {
      countElement.textContent = count;
    }

    // Update page title element if exists
    const titleElement = this.container.querySelector('.alerts-title');
    if (titleElement) {
      titleElement.textContent = `Inventory Alerts (${count})`;
    }
  }

  renderError() {
    if (!this.container) return;

    const alertsContainer = this.container.querySelector('.inventory-alerts-list') || 
                          this.container.querySelector('.space-y-4');

    if (!alertsContainer) return;

    alertsContainer.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
        <h4 class="text-lg font-medium text-gray-700 mb-2">Error Loading Alerts</h4>
        <p class="text-sm text-gray-500 mb-4">Unable to load inventory alerts at this time.</p>
        <button class="retry-btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-refresh mr-2"></i>Retry
        </button>
      </div>
    `;

    // Add retry functionality
    const retryBtn = alertsContainer.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadInventoryAlerts());
    }
  }

  attachEventListeners() {
    if (!this.container) return;

    // Handle restock button clicks
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('restock-btn') || e.target.closest('.restock-btn')) {
        const btn = e.target.classList.contains('restock-btn') ? e.target : e.target.closest('.restock-btn');
        const productId = btn.dataset.productId;
        const productName = btn.dataset.productName;
        this.handleRestockClick(productId, productName);
      }
    });

    // Handle refresh button if exists
    const refreshBtn = this.container.querySelector('.refresh-alerts-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadInventoryAlerts();
        // Add loading state
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Refreshing...';
        setTimeout(() => {
          refreshBtn.innerHTML = '<i class="fas fa-refresh mr-2"></i>Refresh';
        }, 1000);
      });
    }
  }

  handleRestockClick(productId, productName) {
    // Create restock modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="flex items-center mb-4">
          <i class="fas fa-box text-blue-600 text-xl mr-3"></i>
          <h3 class="text-lg font-semibold">Restock Product</h3>
        </div>
        <p class="text-gray-600 mb-4">Create a restock order for <strong>${productName}</strong>?</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Quantity to order:</label>
          <input type="number" id="restock-quantity" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                 value="25" min="1">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Priority:</label>
          <select id="restock-priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <div class="flex justify-end space-x-3">
          <button class="cancel-btn px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button class="confirm-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create Order
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
      const priority = modal.querySelector('#restock-priority').value;
      this.processRestockOrder(productId, productName, quantity, priority);
      document.body.removeChild(modal);
    });

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  async processRestockOrder(productId, productName, quantity, priority) {
    try {
      // Show processing notification
      this.showNotification('Processing restock order...', 'info');
      
      // This would typically make an API call to create a restock order
      // For now, we'll simulate the process
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success notification
      this.showNotification(
        `Restock order created: ${quantity} units of ${productName} (${priority} priority)`, 
        'success'
      );
      
      // Refresh the alerts data
      setTimeout(() => {
        this.loadInventoryAlerts();
      }, 1500);
      
    } catch (error) {
      console.error('Error processing restock order:', error);
      this.showNotification('Failed to create restock order. Please try again.', 'error');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
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
        <span class="text-sm">${message}</span>
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

  // Public method to refresh alerts
  refresh() {
    this.loadInventoryAlerts();
  }

  // Public method to update thresholds
  updateThresholds(lowStock, criticalStock) {
    this.lowStockThreshold = lowStock;
    this.criticalStockThreshold = criticalStock;
    this.loadInventoryAlerts();
  }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const inventoryAlertsContainer = document.querySelector('.inventory-alerts-component') || 
                                 document.querySelector('[data-component="inventory-alerts"]');
  
  if (inventoryAlertsContainer) {
    window.inventoryAlertsComponent = new InventoryAlertsComponent();
  }
});

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InventoryAlertsComponent;
}
