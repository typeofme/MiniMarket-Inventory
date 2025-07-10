// Restock Page Logic (Order Form + Product List)
// This script manages the restock order form, product selection, and product list for the order

// State
let restockOrderProducts = [];
let lowStockProductsInOrder = new Set(); // Track product IDs added from low stock

// Fetch products from API or window.productService
async function fetchAllProducts() {
  if (window.productService && typeof window.productService.getProducts === 'function') {
    return await window.productService.getProducts();
  } else if (window.fetch) {
    const res = await fetch('/api/products');
    return await res.json();
  }
  return [];
}

// Render product dropdown in the order form
async function renderProductDropdown() {
  const products = await fetchAllProducts();
  // Filter out products already in the order list
  const filteredProducts = products.filter(p => !restockOrderProducts.some(o => String(o.id) === String(p.id)));
  // Bisa ada lebih dari satu dropdown (karena row add product bisa muncul ulang)
  const dropdowns = document.querySelectorAll('#productDropdown');
  dropdowns.forEach(dropdown => {
    const current = dropdown.value;
    dropdown.innerHTML = '<option value="">-- Select Product --</option>' +
      filteredProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    dropdown.value = current;
    dropdown.onchange = function() {
      if (this.value) addProductToOrder(this.value);
      this.value = '';
    };
  });
}

// Add product to order list
async function addProductToOrder(productId, fromLowStock = false) {
  const products = await fetchAllProducts();
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;
  // Prevent duplicate
  if (restockOrderProducts.some(p => String(p.id) === String(productId))) return;
  restockOrderProducts.push({
    ...product,
    orderQuantity: 1,
    total: Number(product.price) || 0 // Ensure total is always a number
  });
  if (fromLowStock) {
    lowStockProductsInOrder.add(String(productId));
    removeLowStockRow(productId);
  } else {
    // If not from low stock, also remove from low stock table if present
    removeLowStockRow(productId);
  }
  renderOrderProductList();
  renderProductDropdown(); // Always update dropdown after add
}

// Remove product from order list
function removeProductFromOrder(productId) {
  restockOrderProducts = restockOrderProducts.filter(p => String(p.id) !== String(productId));
  // If this product was from low stock, restore it
  if (lowStockProductsInOrder.has(String(productId))) {
    lowStockProductsInOrder.delete(String(productId));
    restoreLowStockRow(productId);
  } else {
    // If not from low stock, just update dropdown
    renderProductDropdown();
  }
  renderOrderProductList();
}

// Update quantity and total
function updateOrderQuantity(productId, qty) {
  restockOrderProducts = restockOrderProducts.map(p => {
    if (String(p.id) === String(productId)) {
      const quantity = Math.max(1, Number(qty) || 1);
      return {
        ...p,
        orderQuantity: quantity,
        total: quantity * (p.price || 0)
      };
    }
    return p;
  });
  renderOrderProductList();
}

// Render product list in order
function renderOrderProductList() {
  const listDiv = document.getElementById('orderProductList');
  if (!listDiv) return;
  if (!restockOrderProducts.length) {
    listDiv.innerHTML = `<tr id="addProductRow">
      <td colspan="8" class="py-4">
        <div class="flex items-center gap-2">
          <label for="productDropdown" class="font-medium text-gray-700">Add Product:</label>
          <select id="productDropdown" class="border rounded p-2 min-w-[200px]">
            <option value="">-- Select Product --</option>
          </select>
        </div>
      </td>
    </tr>`;
    renderProductDropdown();
    // Order summary kosong
    const orderSummaryDiv = document.getElementById('orderSummary');
    if (orderSummaryDiv) orderSummaryDiv.innerHTML = '';
    return;
  }
  let html = '';
  restockOrderProducts.forEach((p) => {
    html += `<tr class="border-b hover:bg-gray-50">
      <td class="px-4 py-3">${p.image ? `<img src="${p.image}" alt="${p.name || ''}" class="w-12 h-12 object-cover rounded border" />` : '<div class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400"><i class=\"fas fa-image\"></i></div>'}</td>
      <td class="px-4 py-3 font-medium text-gray-800">${p.name || '-'}</td>
      <td class="px-4 py-3">${p.stock}</td>
      <td class="px-4 py-3 text-gray-600">${p.description || '-'}</td>
      <td class="px-4 py-3 text-green-700 font-semibold">${p.price ? '$' + Number(p.price).toLocaleString() : '-'}</td>
      <td class="px-4 py-3"><input type="number" min="1" value="${p.orderQuantity}" class="w-16 border rounded p-1 text-center" onchange="updateOrderQuantity('${p.id}', this.value)" /></td>
      <td class="px-4 py-3 text-blue-700 font-semibold">${typeof p.total === 'number' && !isNaN(p.total) ? '$' + Number(p.total).toLocaleString() : '-'}</td>
      <td class="px-4 py-3">
        <button class="text-red-600 hover:text-red-800" title="Remove" onclick="removeProductFromOrder('${p.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  });
  // Add product dropdown row always at the end
  html += `<tr id="addProductRow">
    <td colspan="8" class="py-4">
      <div class="flex items-center gap-2">
        <label for="productDropdown" class="font-medium text-gray-700">Add Product:</label>
        <select id="productDropdown" class="border rounded p-2 min-w-[200px]">
          <option value="">-- Select Product --</option>
        </select>
      </div>
    </td>
  </tr>`;
  listDiv.innerHTML = html;
  renderProductDropdown();
  // Order summary
  const orderSummaryDiv = document.getElementById('orderSummary');
  if (orderSummaryDiv) {
    const totalQty = restockOrderProducts.reduce((sum, p) => sum + (Number(p.orderQuantity) || 0), 0);
    const totalPrice = restockOrderProducts.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    orderSummaryDiv.innerHTML = `<span>Total Items: <b>${totalQty}</b></span><span>Total Price: <b>$${Number(totalPrice).toLocaleString()}</b></span>`;
  }
}

// Clear all products from order
function clearAllOrderProducts() {
  // Restore all low stock products that were added
  restockOrderProducts.forEach(p => {
    if (lowStockProductsInOrder.has(String(p.id))) {
      restoreLowStockRow(p.id);
    }
  });
  restockOrderProducts = [];
  lowStockProductsInOrder.clear();
  renderOrderProductList();
  renderProductDropdown();
}

// Handle order submit
async function handleOrderSubmit(e) {
  e.preventDefault();
  // Collect form data
  const supplier = document.getElementById('supplierSelect')?.value;
  const orderDate = document.getElementById('orderDate')?.value;
  if (!supplier || !orderDate) {
    alert('Please fill all order details.');
    return;
  }
  if (!restockOrderProducts.length) {
    alert('Please add at least one product to the order.');
    return;
  }
  // Calculate total products and total price
  const totalProducts = restockOrderProducts.reduce((sum, p) => sum + (Number(p.orderQuantity) || 0), 0);
  const totalPrice = restockOrderProducts.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  // Prepare order data for backend
  const order = {
    supplier_name: supplier,
    order_date: orderDate,
    total_products: totalProducts,
    total_price: totalPrice
  };
  // Send order to backend
  try {
    const res = await fetch('/api/restock_orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Failed to create order');
    // Notifikasi sukses
    const notif = document.getElementById('orderSuccessNotif');
    if (notif) {
      notif.classList.remove('hidden');
      setTimeout(() => notif.classList.add('hidden'), 2500);
    }
    clearAllOrderProducts();
    document.getElementById('orderForm').reset();
    renderOrderProductList();
    if (window.loadOrderList) window.loadOrderList();
    updateRestockDashboardCards(); // Tambahkan ini
  } catch (err) {
    alert('Failed to create order. Please try again.');
  }
}

// Update dashboard cards for restock page
async function updateRestockDashboardCards() {
  // Items needing restock: gunakan filter yang sama dengan tab low stock
  let products = [];
  try {
    products = await fetchAllProducts();
  } catch {}
  // Ikuti filter tab low stock (stock !== undefined && stock <= 10)
  const lowStock = products.filter(p => p.stock !== undefined && p.stock <= 10);
  const itemsNeedingRestock = document.getElementById('itemsNeedingRestock');
  if (itemsNeedingRestock) itemsNeedingRestock.textContent = lowStock.length;

  // Fetch restock orders
  let orders = [];
  try {
    const res = await fetch('/api/restock_orders', {
      headers: { 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' }
    });
    if (res.ok) orders = await res.json();
  } catch {}

  // Pending restock orders
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const pendingRestockOrders = document.getElementById('pendingRestockOrders');
  if (pendingRestockOrders) pendingRestockOrders.textContent = pendingCount;

  // Total price (sum all orders)
  const totalPrice = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
  const averageLeadTime = document.getElementById('averageLeadTime');
  if (averageLeadTime) averageLeadTime.textContent = `$${totalPrice.toLocaleString()}`;
}

// On DOM ready, setup events
window.addEventListener('DOMContentLoaded', () => {
  renderProductDropdown();
  renderOrderProductList();
  updateRestockDashboardCards();
  // Auto set expected arrival when order date changes
  const orderDateInput = document.getElementById('orderDate');
  const expectedArrivalInput = document.getElementById('expectedArrival');
  function setExpectedArrival() {
    if (orderDateInput && expectedArrivalInput && orderDateInput.value) {
      const date = new Date(orderDateInput.value);
      date.setDate(date.getDate() + 5);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      expectedArrivalInput.value = `${yyyy}-${mm}-${dd}`;
    } else if (expectedArrivalInput) {
      expectedArrivalInput.value = '';
    }
  }
  if (orderDateInput && expectedArrivalInput) {
    orderDateInput.addEventListener('change', setExpectedArrival);
  }
  // Product dropdown change
  const dropdown = document.getElementById('productDropdown');
  if (dropdown) {
    dropdown.addEventListener('change', function() {
      if (this.value) addProductToOrder(this.value);
      this.value = '';
    });
  }
  // Order form submit
  const form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', handleOrderSubmit);
    form.addEventListener('reset', function() {
      setTimeout(() => {
        if (orderDateInput) orderDateInput.value = '';
        setExpectedArrival();
      }, 0);
    });
  }
  // Clear all button (all with class)
  document.querySelectorAll('.clearAllBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      clearAllOrderProducts();
    });
  });
  // Order button (all with class)
  document.querySelectorAll('.submitBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      handleOrderSubmit(e);
    });
  });

  // Patch: Intercept low stock restock button
  window.addEventListener('loadLowStockTable', () => {
    setTimeout(() => {
      document.querySelectorAll('.restock-btn-lowstock').forEach(btn => {
        btn.onclick = function() {
          addProductToOrder(this.dataset.id, true);
        };
      });
    }, 100);
  });
});

// Remove a row from the low stock table (by productId)
function removeLowStockRow(productId) {
  const row = document.querySelector(`#restockLowStockTable tr[data-id='${productId}']`);
  if (row) row.remove();
}

// Restore a row to the low stock table (by productId)
async function restoreLowStockRow(productId) {
  // Only restore if the table is visible
  const tableDiv = document.getElementById('restockLowStockTable');
  if (!tableDiv) return;
  // Fetch product info
  const products = await fetchAllProducts();
  const p = products.find(p => String(p.id) === String(productId));
  if (!p) return;
  // Only restore if product is still low stock
  if (p.stock > 10) return;
  // If table is empty, re-render
  if (!tableDiv.querySelector('table')) {
    window.loadLowStockTable && window.loadLowStockTable();
    return;
  }
  // Insert row at the end
  const tbody = tableDiv.querySelector('tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.className = 'border-b hover:bg-gray-50';
  tr.setAttribute('data-id', p.id);
  tr.innerHTML = `
    <td class="px-4 py-3">${p.image ? `<img src="${p.image}" alt="${p.name || ''}" class="w-12 h-12 object-cover rounded border" />` : '<div class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400"><i class=\"fas fa-image\"></i></div>'}</td>
    <td class="px-4 py-3 font-medium text-gray-800">${p.name || '-'}</td>
    <td class="px-4 py-3">${p.stock}</td>
    <td class="px-4 py-3 text-green-700 font-semibold">${p.price ? 'Rp ' + Number(p.price).toLocaleString() : '-'}</td>
    <td class="px-4 py-3 text-gray-600">${p.description || '-'}</td>
    <td class="px-4 py-3"><button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition restock-btn-lowstock" data-id="${p.id}">Restock</button></td>
  `;
  tbody.appendChild(tr);
  // Re-attach event
  tr.querySelector('.restock-btn-lowstock').onclick = function() {
    addProductToOrder(p.id, true);
  };
}

// Expose for inline event handlers
window.updateOrderQuantity = updateOrderQuantity;
window.removeProductFromOrder = removeProductFromOrder;
window.clearAllOrderProducts = clearAllOrderProducts;
window.addProductToOrder = addProductToOrder;
window.removeLowStockRow = removeLowStockRow;
window.restoreLowStockRow = restoreLowStockRow;

// Patch: Expose for low stock table reload
window.loadLowStockTable = function() {
  const event = new Event('loadLowStockTable');
  window.dispatchEvent(event);
};
