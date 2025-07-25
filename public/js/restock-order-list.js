// JS logic for restock order list (fetch, render, update status)
// To be included in restock.js or as a separate module if needed

async function fetchRestockOrders() {
  const res = await fetch('/api/restock_orders', {
    headers: { 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' }
  });
  if (!res.ok) return [];
  return await res.json();
}

let cacheOrders = [];

async function loadOrderList() {
  cacheOrders = await fetchRestockOrders();
  renderOrderListTable(cacheOrders);
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
  
  // Deep copy orders untuk menghindari mutasi data asli
  let filteredOrders = JSON.parse(JSON.stringify(orders || []));
  
  if (!filteredOrders.length) {
    tbody.innerHTML = '';
    if (noOrders) noOrders.classList.remove('hidden');
    return;
  }
  
  if (noOrders) noOrders.classList.add('hidden');

  // Ambil filter
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
  
  // Format dan render rows
  tbody.innerHTML = filteredOrders.map(order => {
    console.log('Rendering order:', order.id);
    let orderDate = '-';
    if (order.order_date) {
      const d = new Date(order.order_date);
      if (!isNaN(d)) {
        // Format tanggal ke lokal string
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        orderDate = d.toLocaleDateString('id-ID', options);
      }
    }
    
    // Status color classes
    let statusColorClass = '';
    switch(order.status) {
      case 'Cancelled':
        statusColorClass = 'text-red-600 font-medium';
        break;
      case 'Received':
        statusColorClass = 'text-green-600 font-medium';
        break;
      case 'Pending':
        statusColorClass = 'text-yellow-600 font-medium';
        break;
    }
    
    return `
      <tr data-id="${order.id}" class="border-b hover:bg-gray-50">
        <td class="p-3 text-center">${orderDate}</td>
        <td class="p-3 text-left font-medium">${order.supplier_name || '-'}</td>
        <td class="p-3 text-center">${order.total_products}</td>
        <td class="p-3 text-center font-medium">$${Number(order.total_price).toLocaleString()}</td>
        <td class="p-3 text-center status-cell">
          <span class="status-label ${statusColorClass}">${order.status || '-'}</span>
        </td>
        <td class="p-3 text-center action-cell flex justify-center gap-2">
          <button class="edit-status-btn px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-all">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
          <button class="delete-order-btn px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-all">
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Re-attach all event listeners after rendering
  attachTableEventListeners();
  
  // Attach event listeners for edit status
  tbody.querySelectorAll('.edit-status-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tr = btn.closest('tr');
      const id = tr.getAttribute('data-id');
      const statusCell = tr.querySelector('.status-cell');
      const actionCell = tr.querySelector('.action-cell');
      const currentStatus = statusCell.querySelector('.status-label').textContent.trim();
      // Replace status cell with dropdown
      statusCell.innerHTML = `
        <select class="order-status-select">
          <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Received" ${currentStatus === 'Received' ? 'selected' : ''}>Received</option>
          <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      `;
      // Replace action cell with Save button
      actionCell.innerHTML = `<button class="save-status-btn px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition">Simpan</button>`;
      // Focus dropdown
      statusCell.querySelector('select').focus();
      // Save handler
      actionCell.querySelector('.save-status-btn').addEventListener('click', async function() {
        const newStatus = statusCell.querySelector('select').value;
        await updateOrderStatus(id, newStatus);
      });
    });
  });
}

// Event listener agar search, sort, dan status filter langsung berfungsi pada cacheOrders
window.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchOrderInput');
  const sortSelect = document.getElementById('sortOrderSelect');
  const statusSelect = document.getElementById('statusOrderSelect');
  if (searchInput) searchInput.addEventListener('input', () => renderOrderListTable(cacheOrders));
  if (sortSelect) sortSelect.addEventListener('change', () => renderOrderListTable(cacheOrders));
  if (statusSelect) statusSelect.addEventListener('change', () => renderOrderListTable(cacheOrders));
});

async function updateOrderStatus(id, status) {
  try {
    const res = await fetch(`/api/restock_orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      },
      body: JSON.stringify({ status })
    });
    
    if (!res.ok) throw new Error('Failed to update status');
    
    // Show success message
    if (window.toast) {
      window.toast.success('Order status updated successfully');
    }
    
    // Re-fetch orders
    await loadOrderList();
    if (typeof updateRestockDashboardCards === 'function') {
      updateRestockDashboardCards();
    }
  } catch (err) {
    console.error('Error updating order status:', err);
    if (window.toast) {
      window.toast.error('Failed to update order status');
    }
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
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      row.style.backgroundColor = '#FEE2E2'; // Light red background
      row.style.transition = 'all 0.5s ease';
      setTimeout(() => {
        row.style.opacity = '0';
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

// Attach event listeners for table actions
function attachTableEventListeners() {
  const tbody = document.getElementById('orderListTableBody');
  if (!tbody) return;

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
        <select class="order-status-select border rounded px-2 py-1">
          <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Received" ${currentStatus === 'Received' ? 'selected' : ''}>Received</option>
          <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      `;
      
      // Replace action cell with Save and Cancel buttons
      actionCell.innerHTML = `
        <div class="flex justify-center gap-2">
          <button class="save-status-btn px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition">
            <i class="fas fa-check mr-1"></i>Save
          </button>
          <button class="cancel-status-btn px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition">
            <i class="fas fa-times mr-1"></i>Cancel
          </button>
        </div>
      `;
      
      // Focus dropdown
      statusCell.querySelector('select').focus();
      
      // Save handler
      actionCell.querySelector('.save-status-btn').addEventListener('click', async function() {
        const newStatus = statusCell.querySelector('select').value;
        await updateOrderStatus(id, newStatus);
      });
      
      // Cancel handler
      actionCell.querySelector('.cancel-status-btn').addEventListener('click', function() {
        renderOrderListTable(cacheOrders);
      });
    });
  });
}

// Event listener untuk search dan filter
// Initialize table and attach all event listeners
async function initializeOrderList() {
  console.log('Initializing order list...');
  
  // Initial render and attach event listeners
  await loadOrderList();
  attachTableEventListeners();
  
  const searchInput = document.getElementById('searchOrderInput');
  const sortSelect = document.getElementById('sortOrderSelect');
  const statusSelect = document.getElementById('statusOrderSelect');
  
  // Debounce function untuk search dengan waktu tunggu yang lebih pendek
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
  
  // Event listeners untuk sort dan filter dengan immediate feedback
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
  
  // Re-render pada interval untuk memastikan data tetap sinkron
  setInterval(async () => {
    await loadOrderList();
  }, 30000); // Refresh every 30 seconds
}

// Attach all event handlers when document is ready
window.addEventListener('DOMContentLoaded', () => {
  initializeOrderList().catch(console.error);
});

// Expose for tab switch and global access
window.loadOrderList = loadOrderList;