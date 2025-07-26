// Vendor Performance Widget
console.log('[VendorPerformanceWidget] Script loaded');
(function() {
  let vendorPerformanceData = [];

  async function loadVendorPerformance() {
    console.log('[VendorPerformanceWidget] loadVendorPerformance called');
    try {
      const widget = document.querySelector('.vendor-performance-widget');
      if (!widget) {
        console.error('[VendorPerformanceWidget] Widget container not found');
        return;
      }
      console.log('[VendorPerformanceWidget] Widget container found:', widget);

      // Show loading state
      showLoadingState(widget);

      // Fetch supplier performance data from API with Authorization header
      let token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      console.log('[VendorPerformanceWidget] Token:', token);
      if (!token) {
        console.error('[VendorPerformanceWidget] No auth token found in localStorage or sessionStorage.');
        showErrorState(widget, 'No auth token found. Please log in.');
        return;
      }
      let data = null;
      try {
        const response = await fetch('/api/suppliers/stats', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('[VendorPerformanceWidget] Fetch response:', response);
        if (response.status === 401 || response.status === 403) {
          console.error('[VendorPerformanceWidget] Unauthorized. Status:', response.status);
          showErrorState(widget, 'Unauthorized. Please log in again.');
          return;
        }
        if (!response.ok) {
          console.error('[VendorPerformanceWidget] Fetch failed. Status:', response.status);
          showErrorState(widget, 'Failed to fetch supplier performance data.');
          return;
        }
        data = await response.json();
        console.log('[VendorPerformanceWidget] Data received:', data);
        if (!data || !data.suppliers || !Array.isArray(data.suppliers)) {
          showErrorState(widget, 'No supplier data received.');
          return;
        }
      } catch (err) {
        console.error('[VendorPerformanceWidget] Network error:', err);
        showErrorState(widget, 'Network error. Please try again.');
        return;
      }
      vendorPerformanceData = data;
      renderVendorPerformance(widget, data);

    } catch (error) {
      console.error('Error loading vendor performance:', error);
      showErrorState(widget, 'Failed to load supplier performance data');
    }
  }

  function showLoadingState(widget) {
    const container = widget.querySelector('.vendor-performance-items');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-gray-400 text-xl mb-2"></i>
          <p class="text-sm text-gray-500">Loading supplier performance...</p>
        </div>
      `;
    }
  }

  function showErrorState(widget, message) {
    const container = widget.querySelector('.vendor-performance-items');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-exclamation-triangle text-amber-500 text-xl mb-2"></i>
          <p class="text-sm text-gray-500">${message}</p>
        </div>
      `;
    }
  }

  function renderVendorPerformance(widget, data) {
    const container = widget.querySelector('.vendor-performance-items');
    if (!container) return;

    const suppliers = data.suppliers || [];
    if (suppliers.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-truck text-gray-300 text-2xl mb-2"></i>
          <p class="text-sm text-gray-500">No supplier data available</p>
        </div>
      `;
      return;
    }
    container.innerHTML = suppliers.map(supplier => `
      <div class="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
        <div class="flex items-center">
          <div class="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-8 h-8 flex items-center justify-center mr-3">
            <span class="text-xs font-bold text-blue-700">${supplier.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-800" title="${supplier.name}">${supplier.name.length > 20 ? supplier.name.substring(0, 20) + '...' : supplier.name}</p>
            <div class="text-xs text-gray-500">
              <span>Status: <span class="font-semibold">${supplier.status || '-'}</span></span><br>
              <span>Email: <span class="font-semibold">${supplier.email || '-'}</span></span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Add click handler for widget
  function addClickHandler() {
    const widget = document.querySelector('.vendor-performance-widget');
    if (widget) {
      console.log('[VendorPerformanceWidget] Adding click handlers');
      // Make the entire widget clickable
      widget.style.cursor = 'pointer';
      widget.addEventListener('click', function(e) {
        // Don't navigate if clicking on interactive elements
        if (e.target.closest('.refresh-btn')) return;
        window.location.href = '/suppliers';
      });
      // Add refresh button functionality
      const refreshBtn = widget.querySelector('.refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent widget click
          loadVendorPerformance();
        });
      }
    } else {
      console.error('[VendorPerformanceWidget] Widget container not found for click handler');
    }
  }

  // Initialize when DOM is loaded

  function tryInitVendorWidget() {
    console.log('[VendorPerformanceWidget] tryInitVendorWidget called');
    addClickHandler();
    loadVendorPerformance();
  }

  // Try to initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function() {
    tryInitVendorWidget();
  });
  // Try again after a short delay in case widget loads late
  setTimeout(tryInitVendorWidget, 1000);
  // Auto-refresh every 5 minutes
  setInterval(loadVendorPerformance, 5 * 60 * 1000);

})();
