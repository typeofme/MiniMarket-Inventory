// JS logic for restock order list (fetch, render, update status)
// To be included in restock.js or as a separate module if needed

async function fetchRestockOrders() {
  try {
    const res = await fetch('/api/restock_orders', {
      headers: { 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching restock orders:', error);
    return [];
  }
}

let cacheOrders = [];

async function loadOrderList() {
  // Show loading state
  const tbody = document.getElementById('orderListTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <div class="flex justify-center items-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span>Loading orders...</span>
          </div>
        </td>
      </tr>
    `;
  }
  
  try {
    cacheOrders = await fetchRestockOrders();
    renderOrderListTable(cacheOrders);
  } catch (error) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-red-500">
            <i class="fas fa-exclamation-circle mr-2"></i>
            Failed to load orders. Please try again.
          </td>
        </tr>
      `;
    }
  }
}

// Helper: get current filter values
function getOrderListFilters() {
  const searchInput = document.getElementById('searchOrderInput');
  const sortSelect = document.getElementById('sortOrderSelect');
  const statusSelect = document.getElementById('statusOrderSelect');
  return {
    search: searchInput ? searchInput.value.trim().toLowerCase() : '',
    sort: sortSelect ? sortSelect.value : 'date-desc',
    status: statusSelect ? statusSelect.value : 'all'
  };
}

function renderOrderListTable(orders) {
  const tbody = document.getElementById('orderListTableBody');
  const noOrders = document.getElementById('noOrders');
  if (!tbody) return;
  
  // Deep copy orders to avoid mutating the original data
  let filteredOrders = JSON.parse(JSON.stringify(orders || []));
  
  if (!filteredOrders.length) {
    tbody.innerHTML = '';
    if (noOrders) noOrders.classList.remove('hidden');
    return;
  }
  
  if (noOrders) noOrders.classList.add('hidden');

  // Apply filters
  const { search, sort, status } = getOrderListFilters();

  // Filter by search (supplier name)
  if (search) {
    const searchLower = search.toLowerCase();
    filteredOrders = filteredOrders.filter(order => 
      order.supplier_name && 
      order.supplier_name.toLowerCase().includes(searchLower)
    );
  }

  // Filter by status
  if (status && status !== 'all') {
    filteredOrders = filteredOrders.filter(order => 
      order.status && order.status === status
    );
  }

  // Sort with proper date handling
  const compareOrders = (a, b, sortBy, direction = 'asc') => {
    const multiplier = direction === 'asc' ? 1 : -1;
    
    switch(sortBy) {
      case 'date':
        const dateA = new Date(a.order_date || 0);
        const dateB = new Date(b.order_date || 0);
        return multiplier * (dateA - dateB);
        
      case 'total':
        const priceA = Number(a.total_price || 0);
        const priceB = Number(b.total_price || 0);
        return multiplier * (priceA - priceB);
        
      default:
        return 0;
    }
  };

  // Apply sorting
  switch (sort) {
    case 'date-desc':
      filteredOrders.sort((a, b) => compareOrders(a, b, 'date', 'desc'));
      break;
    case 'date-asc':
      filteredOrders.sort((a, b) => compareOrders(a, b, 'date', 'asc'));
      break;
    case 'total-desc':
      filteredOrders.sort((a, b) => compareOrders(a, b, 'total', 'desc'));
      break;
    case 'total-asc':
      filteredOrders.sort((a, b) => compareOrders(a, b, 'total', 'asc'));
      break;
  }

  console.log('Rendering table with filtered orders:', filteredOrders.length);
  
  // Format and render rows
  tbody.innerHTML = filteredOrders.map(order => {
    let orderDate = '-';
    if (order.order_date) {
      const d = new Date(order.order_date);
      if (!isNaN(d)) {
        // Format date to local string
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        orderDate = d.toLocaleDateString('id-ID', options);
      }
    }
    
    // Status color classes
    let statusColorClass = '';
    let statusBgClass = '';
    let statusIcon = '';
    
    switch(order.status) {
      case 'Cancelled':
        statusColorClass = 'text-red-600';
        statusBgClass = 'bg-red-50';
        statusIcon = '<i class="fas fa-times-circle mr-1"></i>';
        break;
      case 'Received':
        statusColorClass = 'text-green-600';
        statusBgClass = 'bg-green-50';
        statusIcon = '<i class="fas fa-check-circle mr-1"></i>';
        break;
      case 'Pending':
        statusColorClass = 'text-yellow-600';
        statusBgClass = 'bg-yellow-50';
        statusIcon = '<i class="fas fa-clock mr-1"></i>';
        break;
    }
    
    return `
      <tr data-id="${order.id}" class="border-b hover:bg-gray-50 transition-colors">
        <td class="p-3 text-center">${orderDate}</td>
        <td class="p-3 text-left font-medium">${order.supplier_name || '-'}</td>
        <td class="p-3 text-center">${order.total_products}</td>
        <td class="p-3 text-center font-medium">$${Number(order.total_price).toLocaleString()}</td>
        <td class="p-3 text-center status-cell">
          <span class="status-label ${statusColorClass} ${statusBgClass} px-2 py-1 rounded-full text-xs font-medium inline-flex items-center">
            ${statusIcon}${order.status || '-'}
          </span>
        </td>
        <td class="p-3 text-center action-cell">
          <div class="flex justify-center gap-2">
            <button class="view-details-btn px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
              <i class="fas fa-eye mr-1"></i>Details
            </button>
            <button class="edit-status-btn px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-all">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button class="delete-order-btn px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-all">
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Re-attach all event listeners after rendering
  attachTableEventListeners();
}

// Event listener for search, sort, and status filter to work directly on cached orders
window.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchOrderInput');
  const sortSelect = document.getElementById('sortOrderSelect');
  const statusSelect = document.getElementById('statusOrderSelect');
  
  if (searchInput) {
    searchInput.addEventListener('input', () => renderOrderListTable(cacheOrders));
    // Clear search on 'x' button click
    searchInput.addEventListener('search', () => renderOrderListTable(cacheOrders));
  }
  
  if (sortSelect) sortSelect.addEventListener('change', () => renderOrderListTable(cacheOrders));
  if (statusSelect) statusSelect.addEventListener('change', () => renderOrderListTable(cacheOrders));
});

async function updateOrderStatus(id, status) {
  try {
    // Show loading state on the button
    const actionCell = document.querySelector(`tr[data-id="${id}"] .action-cell`);
    if (actionCell) {
      actionCell.innerHTML = `
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          <span>Updating...</span>
        </div>
      `;
    }
    
    const res = await fetch(`/api/restock_orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      },
      body: JSON.stringify({ status })
    });
    
    if (!res.ok) throw new Error('Failed to update status');
    
    const data = await res.json();
    
    // Show success message with appropriate feedback
    if (window.toast) {
      if (status === 'Received' && data.stockUpdated) {
        window.toast.success('Order received and product stock updated successfully!');
      } else {
        window.toast.success(`Order status updated to ${status}`);
      }
    }
    
    // Re-fetch orders with a nice transition
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      // Apply highlight effect
      row.style.backgroundColor = status === 'Received' ? '#d1fae5' : 
                                 status === 'Cancelled' ? '#fee2e2' : 
                                 '#fef3c7';
      row.style.transition = 'background-color 0.5s ease';
      
      // Return to normal after a delay
      setTimeout(() => {
        row.style.backgroundColor = '';
        // Re-fetch all data and update UI
        loadOrderList();
        if (typeof updateRestockDashboardCards === 'function') {
          updateRestockDashboardCards();
        }
      }, 800);
    } else {
      // If row not found, just reload
      await loadOrderList();
      if (typeof updateRestockDashboardCards === 'function') {
        updateRestockDashboardCards();
      }
    }
  } catch (err) {
    console.error('Error updating order status:', err);
    if (window.toast) {
      window.toast.error('Failed to update order status');
    }
    
    // Restore the action buttons on error
    renderOrderListTable(cacheOrders);
  }
}

async function deleteOrder(id, supplierName) {
  console.log('Deleting order:', id, 'from supplier:', supplierName);
  
  // Improved confirmation dialog with supplier name
  const confirmMessage = `Are you sure you want to delete this order from "${supplierName}"?\n\nThis action cannot be undone.`;
  
  if (!confirm(confirmMessage)) {
    console.log('Delete cancelled by user');
    return false; // User clicked Cancel
  }
  
  try {
    // Show loading state on the button
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      const actionCell = row.querySelector('.action-cell');
      if (actionCell) {
        actionCell.innerHTML = `
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500 mr-2"></div>
            <span>Deleting...</span>
          </div>
        `;
      }
    }
    
    const res = await fetch(`/api/restock_orders/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      }
    });
    
    if (!res.ok) {
      throw new Error(await res.text() || 'Failed to delete order');
    }
    
    // Show success toast
    if (window.toast) {
      window.toast.success(`Order from "${supplierName}" has been deleted successfully`);
    }
    
    // Remove row with animation
    if (row) {
      row.style.backgroundColor = '#FEE2E2'; // Light red background
      row.style.transition = 'all 0.5s ease';
      setTimeout(() => {
        row.style.opacity = '0';
        row.style.maxHeight = '0';
        row.style.overflow = 'hidden';
        setTimeout(() => {
          // Re-fetch all data and update UI
          loadOrderList();
          if (typeof updateRestockDashboardCards === 'function') {
            updateRestockDashboardCards();
          }
        }, 500);
      }, 100);
    }
    
    return true; // Deletion successful
  } catch (err) {
    console.error('Error deleting order:', err);
    if (window.toast) {
      window.toast.error(`Failed to delete order: ${err.message}`);
    }
    return false; // Deletion failed
  }
}

// View order details
async function viewOrderDetails(id) {
  try {
    // Show loading state
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      const actionCell = row.querySelector('.action-cell');
      if (actionCell) {
        const originalContent = actionCell.innerHTML;
        actionCell.innerHTML = `
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
            <span>Loading...</span>
          </div>
        `;
        
        // Fetch order details
        const res = await fetch(`/api/restock_orders/${id}`, {
          headers: { 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch order details');
        }
        
        const orderData = await res.json();
        
        // Create and show modal
        const modalHTML = `
          <div id="orderDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
              <div class="flex justify-between items-center p-4 border-b">
                <h3 class="text-lg font-semibold">Order Details - ${orderData.supplier_name}</h3>
                <button id="closeDetailsModal" class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="p-4">
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p class="text-sm text-gray-500">Order Date</p>
                    <p class="font-medium">${new Date(orderData.order_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Status</p>
                    <p class="font-medium ${orderData.status === 'Received' ? 'text-green-600' : 
                                          orderData.status === 'Cancelled' ? 'text-red-600' : 
                                          'text-yellow-600'}">
                      ${orderData.status}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Total Products</p>
                    <p class="font-medium">${orderData.total_products}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Total Price</p>
                    <p class="font-medium">$${Number(orderData.total_price).toLocaleString()}</p>
                  </div>
                </div>
                
                ${orderData.details && orderData.details.length > 0 ? `
                  <div class="mt-4">
                    <h4 class="font-medium mb-2">Products</h4>
                    <div class="overflow-x-auto">
                      <table class="min-w-full text-sm">
                        <thead>
                          <tr class="bg-gray-50">
                            <th class="p-2 text-left">Product</th>
                            <th class="p-2 text-center">Quantity</th>
                            <th class="p-2 text-right">Price</th>
                            <th class="p-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${orderData.details.map(detail => `
                            <tr class="border-b">
                              <td class="p-2 text-left">${detail.product_name}</td>
                              <td class="p-2 text-center">${detail.quantity}</td>
                              <td class="p-2 text-right">$${Number(detail.price_per_unit).toLocaleString()}</td>
                              <td class="p-2 text-right">$${Number(detail.total_price).toLocaleString()}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ` : '<p class="text-gray-500 mt-4">No product details available for this order.</p>'}
              </div>
              <div class="bg-gray-50 p-4 flex justify-end">
                <button id="closeDetailsBtn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        `;
        
        // Append modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Add event listeners for close buttons
        document.getElementById('closeDetailsModal').addEventListener('click', () => {
          document.body.removeChild(modalContainer);
        });
        
        document.getElementById('closeDetailsBtn').addEventListener('click', () => {
          document.body.removeChild(modalContainer);
        });
        
        // Close on outside click
        document.getElementById('orderDetailsModal').addEventListener('click', (e) => {
          if (e.target.id === 'orderDetailsModal') {
            document.body.removeChild(modalContainer);
          }
        });
        
        // Restore original action buttons
        actionCell.innerHTML = originalContent;
        attachTableEventListeners();
      }
    }
  } catch (error) {
    console.error('Error viewing order details:', error);
    if (window.toast) {
      window.toast.error('Failed to load order details');
    }
    
    // Restore the action buttons on error
    renderOrderListTable(cacheOrders);
  }
}

// Attach event listeners for table actions
function attachTableEventListeners() {
  const tbody = document.getElementById('orderListTableBody');
  if (!tbody) return;

  // View details button handler
  tbody.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const tr = btn.closest('tr');
      const id = tr.getAttribute('data-id');
      if (id) {
        viewOrderDetails(id);
      }
    });
  });

  // Delete button handler
  tbody.querySelectorAll('.delete-order-btn').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const tr = btn.closest('tr');
      const id = tr.getAttribute('data-id');
      const supplierName = tr.querySelector('td:nth-child(2)').textContent.trim();
      
      if (id && supplierName) {
        // Disable button while processing
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Processing...';
        
        const success = await deleteOrder(id, supplierName);
        
        if (!success) {
          // Re-enable button if delete failed
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-trash mr-1"></i>Delete';
        }
      }
    });
  });

  // Edit status button handler
  tbody.querySelectorAll('.edit-status-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tr = btn.closest('tr');
      const id = tr.getAttribute('data-id');
      const statusCell = tr.querySelector('.status-cell');
      const actionCell = tr.querySelector('.action-cell');
      const currentStatus = statusCell.querySelector('.status-label').textContent.trim();
      
      // Replace status cell with dropdown
      statusCell.innerHTML = `
        <select class="order-status-select border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Received" ${currentStatus === 'Received' ? 'selected' : ''}>Received</option>
          <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      `;
      
      // Replace action cell with Save and Cancel buttons
      actionCell.innerHTML = `
        <div class="flex justify-center gap-2">
          <button class="save-status-btn px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors">
            <i class="fas fa-check mr-1"></i>Save
          </button>
          <button class="cancel-status-btn px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors">
            <i class="fas fa-times mr-1"></i>Cancel
          </button>
        </div>
      `;
      
      // Focus dropdown
      statusCell.querySelector('select').focus();
      
      // Save handler
      actionCell.querySelector('.save-status-btn').addEventListener('click', async function() {
        const newStatus = statusCell.querySelector('select').value;
        
        // Show confirmation dialog if changing to Received
        if (newStatus === 'Received' && currentStatus !== 'Received') {
          if (confirm(`This will update product stock quantities. Are you sure you want to mark this order as Received?`)) {
            await updateOrderStatus(id, newStatus);
          } else {
            // Restore the original view if cancelled
            renderOrderListTable(cacheOrders);
          }
        } else {
          await updateOrderStatus(id, newStatus);
        }
      });
      
      // Cancel handler
      actionCell.querySelector('.cancel-status-btn').addEventListener('click', function() {
        renderOrderListTable(cacheOrders);
      });
    });
  });
}

// Initialize table and attach all event listeners
async function initializeOrderList() {
  console.log('Initializing order list...');
  
  // Initial render and attach event listeners
  await loadOrderList();
  attachTableEventListeners();
  
  const searchInput = document.getElementById('searchOrderInput');
  const sortSelect = document.getElementById('sortOrderSelect');
  const statusSelect = document.getElementById('statusOrderSelect');
  
  // Debounce function for search with shorter wait time
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        renderOrderListTable(cacheOrders);
      }, 200); // Reduced debounce time for better responsiveness
    });
    
    // Clear search on 'x' button click
    searchInput.addEventListener('search', () => {
      renderOrderListTable(cacheOrders);
    });
  }
  
  // Event listeners for sort and filter with immediate feedback
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderOrderListTable(cacheOrders);
    });
  }
  
  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      renderOrderListTable(cacheOrders);
    });
  }
  
  // Load initial data
  await loadOrderList();
  
  // Re-render on interval to ensure data stays in sync
  setInterval(async () => {
    await loadOrderList();
  }, 60000); // Refresh every minute
}

// Attach all event handlers when document is ready
window.addEventListener('DOMContentLoaded', () => {
  initializeOrderList().catch(console.error);
});

// Expose for tab switch and global access
window.loadOrderList = loadOrderList;