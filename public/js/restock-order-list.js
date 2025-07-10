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
  if (!orders || !orders.length) {
    tbody.innerHTML = '';
    if (noOrders) noOrders.classList.remove('hidden');
    return;
  }
  if (noOrders) noOrders.classList.add('hidden');

  // Ambil filter
  const { search, sort, status } = getOrderListFilters();

  // Filter by search (supplier name)
  let filteredOrders = orders.filter(order =>
    !search || (order.supplier_name && order.supplier_name.toLowerCase().includes(search))
  );

  // Filter by status
  if (status && status !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }

  // Sort
  switch (sort) {
    case 'date-desc':
      filteredOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
      break;
    case 'date-asc':
      filteredOrders.sort((a, b) => new Date(a.order_date) - new Date(b.order_date));
      break;
    case 'total-desc':
      filteredOrders.sort((a, b) => Number(b.total_price) - Number(a.total_price));
      break;
    case 'total-asc':
      filteredOrders.sort((a, b) => Number(a.total_price) - Number(b.total_price));
      break;
  }

  tbody.innerHTML = filteredOrders.map(order => {
    let orderDate = '-';
    if (order.order_date) {
      const d = new Date(order.order_date);
      if (!isNaN(d)) {
        orderDate = d.toISOString().slice(0, 10);
      } else if (typeof order.order_date === 'string' && order.order_date.length >= 10) {
        orderDate = order.order_date.slice(0, 10);
      }
    }
    return `
      <tr data-id="${order.id}">
        <td class="p-3 text-center">${orderDate}</td>
        <td class="p-3 text-left">${order.supplier_name || '-'}</td>
        <td class="p-3 text-center">${order.total_products}</td>
        <td class="p-3 text-center">$${Number(order.total_price).toLocaleString()}</td>
        <td class="p-3 text-center status-cell">
          <span class="status-label">${order.status || '-'}</span>
        </td>
        <td class="p-3 text-center action-cell">
          <button class="edit-status-btn px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Edit Status</button>
        </td>
      </tr>
    `;
  }).join('');

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
  await fetch(`/api/restock_orders/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify({ status })
  });
  // Optionally, re-fetch orders
  loadOrderList();
  if (typeof updateRestockDashboardCards === 'function') updateRestockDashboardCards();
}

window.loadOrderList = loadOrderList; // Expose for tab switch
