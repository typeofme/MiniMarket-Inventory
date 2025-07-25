// Restock Page Logic (Order Form + Product List)
// This script manages the restock order form, product selection, and product list for the order

// State
let restockOrderProducts = [];
let lowStockProductsInOrder = new Set(); // Track product IDs added from low stock
let isProcessingOrder = false; // Prevent multiple submissions

// Ensure document is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add global event listener for ComponentLoader
  ComponentLoader.onAllLoaded(function() {
    setupOrderDateHandler();
    setupButtonHandlers();
  });

  // Setup order date handler
  function setupOrderDateHandler() {
    const orderDateInput = document.getElementById('orderDate');
    const expectedArrivalInput = document.getElementById('expectedArrival');
    
    if (orderDateInput && expectedArrivalInput) {
      // Initial setup if date already selected
      if (orderDateInput.value) {
        updateExpectedArrival();
      }
      
      // Add event listeners
      ['change', 'input'].forEach(eventType => {
        orderDateInput.addEventListener(eventType, function() {
          if (this.value) {
            const date = new Date(this.value);
            date.setDate(date.getDate() + 5);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            expectedArrivalInput.value = `${yyyy}-${mm}-${dd}`;
          } else {
            expectedArrivalInput.value = '';
          }
        });
      });
    }
  }

  // Setup tab change handlers
  function setupTabHandlers() {
    const tabs = ['tabLowStock', 'tabCreateOrder', 'tabOrderList'];
    tabs.forEach(tabId => {
      const tab = document.getElementById(tabId);
      if (tab) {
        tab.addEventListener('click', function() {
          // Re-initialize handlers when switching to Create Order tab
          if (tabId === 'tabCreateOrder') {
            setTimeout(() => {
              setupOrderDateHandler();
              setupButtonHandlers();
            }, 100);
          }
        });
      }
    });
  }
  
  // Setup button handlers
  function setupButtonHandlers() {
    // Clear All button
    document.querySelectorAll('#clearAllBtn, .clearAllBtn').forEach(btn => {
      if (btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          if (confirm('Are you sure you want to clear all items? This will reset the entire form.')) {
            clearAllOrderProducts();
          }
        });
      }
    });
    
    // Submit Order button
    document.querySelectorAll('#submitBtn, .submitBtn').forEach(btn => {
      if (btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          if (!isProcessingOrder) {
            if (confirm('Are you sure you want to create this order?')) {
              handleOrderSubmit(e);
            }
          }
        });
      }
    });
  }
  
  // Initial setup
  setupTabHandlers();
  setupButtonHandlers();
  setupOrderDateHandler();
});

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
  console.log(`addProductToOrder called with productId: ${productId}, fromLowStock: ${fromLowStock}`);
  const products = await fetchAllProducts();
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) {
    console.warn(`Product with ID ${productId} not found`);
    return;
  }
  
  // Prevent duplicate
  if (restockOrderProducts.some(p => String(p.id) === String(productId))) {
    console.log(`Product with ID ${productId} already in order`);
    return;
  }
  
  restockOrderProducts.push({
    ...product,
    orderQuantity: 1,
    total: Number(product.price) || 0
  });

  // Jika dari low stock atau produk memang low stock, hapus dari tabel
  if (fromLowStock || (product.stock !== undefined && product.stock <= 10)) {
    console.log(`Product with ID ${productId} added from low stock`);
    lowStockProductsInOrder.add(String(productId));
    
    // Update low stock table
    const lowStockTable = document.getElementById('restockLowStockTable');
    if (lowStockTable) {
      const rows = lowStockTable.querySelectorAll(`tr[data-id="${productId}"]`);
      rows.forEach(row => {
        row.style.display = 'none'; // Hide instead of remove
      });
    }
  }

  // Switch to Create Order tab after hiding the row
  const tabCreateOrder = document.getElementById('tabCreateOrder');
  if (tabCreateOrder) {
    tabCreateOrder.click();
  }
  
  renderOrderProductList();
  renderProductDropdown();
}

// Remove product from order list
function removeProductFromOrder(productId) {
  console.log(`removeProductFromOrder called with productId: ${productId}`);
  restockOrderProducts = restockOrderProducts.filter(p => String(p.id) !== String(productId));
  // If this product was from low stock, restore it
  if (lowStockProductsInOrder.has(String(productId))) {
    console.log(`Restoring product with ID ${productId} to low stock`);
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
async function clearAllOrderProducts() {
  console.log('clearAllOrderProducts called');
  
  // Reset form fields first
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.reset();
    const expectedArrivalInput = document.getElementById('expectedArrival');
    if (expectedArrivalInput) {
      expectedArrivalInput.value = '';
    }
  }

  if (restockOrderProducts.length === 0) {
    if (window.toast) {
      window.toast.info('No products to clear');
    }
    return;
  }
  
  // Store products to restore
  const lowStockProducts = restockOrderProducts.filter(p => 
    lowStockProductsInOrder.has(String(p.id))
  );
  
  // Clear arrays
  restockOrderProducts = [];
  lowStockProductsInOrder.clear();
  
  // Update product list UI
  renderOrderProductList();
  renderProductDropdown();
  
  // Restore low stock products in the table
  const lowStockTable = document.getElementById('restockLowStockTable');
  if (lowStockTable) {
    // Show all hidden rows
    const hiddenRows = lowStockTable.querySelectorAll('tr[style*="display: none"]');
    hiddenRows.forEach(row => {
      row.style.display = ''; // Show previously hidden rows
    });
  }
  
  // Switch to Low Stock tab if there were low stock products
  if (lowStockProducts.length > 0) {
    const tabLowStock = document.getElementById('tabLowStock');
    if (tabLowStock) {
      setTimeout(() => tabLowStock.click(), 100);
    }
  }
  
  if (window.toast) {
    window.toast.success('Form cleared and products restored');
  }
}


// Update expected arrival date when order date changes
function updateExpectedArrival() {
  const orderDateInput = document.getElementById('orderDate');
  const expectedArrivalInput = document.getElementById('expectedArrival');
  
  if (orderDateInput && expectedArrivalInput) {
    if (orderDateInput.value) {
      const orderDate = new Date(orderDateInput.value);
      const arrivalDate = new Date(orderDate);
      arrivalDate.setDate(orderDate.getDate() + 5); // Add 5 days
      
      const yyyy = arrivalDate.getFullYear();
      const mm = String(arrivalDate.getMonth() + 1).padStart(2, '0');
      const dd = String(arrivalDate.getDate()).padStart(2, '0');
      expectedArrivalInput.value = `${yyyy}-${mm}-${dd}`;
    } else {
      expectedArrivalInput.value = '';
    }
  }
  
  // Trigger change event to ensure any listeners are notified
  if (expectedArrivalInput) {
    expectedArrivalInput.dispatchEvent(new Event('change'));
  }
}

// Handle order submit
async function handleOrderSubmit(e) {
  if (e) e.preventDefault();
  
  if (isProcessingOrder) {
    return;
  }
  
  // Validate form fields
  const supplier = document.getElementById('supplierSelect')?.value;
  const orderDate = document.getElementById('orderDate')?.value;
  const expectedArrival = document.getElementById('expectedArrival')?.value;
  
  if (!supplier || !orderDate || !expectedArrival) {
    if (window.toast) {
      window.toast.error('Please fill all order details');
    }
    return;
  }
  
  if (!restockOrderProducts.length) {
    if (window.toast) {
      window.toast.error('Please add at least one product to the order');
    }
    return;
  }

  // Set processing flag
  isProcessingOrder = true;

  // Calculate totals
  const totalProducts = restockOrderProducts.reduce((sum, p) => sum + (Number(p.orderQuantity) || 0), 0);
  const totalPrice = restockOrderProducts.reduce((sum, p) => sum + (Number(p.total) || 0), 0);

  // Prepare order data
  const order = {
    supplier_name: supplier,
    order_date: orderDate,
    expected_arrival: expectedArrival,
    total_products: totalProducts,
    total_price: totalPrice,
    products: restockOrderProducts.map(p => ({
      product_id: p.id,
      quantity: p.orderQuantity,
      price: p.price,
      total: p.total,
      name: p.name,
      current_stock: p.stock
    })),
    status: 'Pending'
  };

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

    // Order berhasil dibuat
    if (window.toast) {
      window.toast.success('Order created successfully');
    }
    
    // Show success notification
    const orderSuccessNotif = document.getElementById('orderSuccessNotif');
    if (orderSuccessNotif) {
      orderSuccessNotif.classList.remove('hidden');
      setTimeout(() => {
        orderSuccessNotif.classList.add('hidden');
      }, 3000);
    }
    
    // Reset form dan clear products (tapi jangan restore low stock products karena sudah diorder)
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
      orderForm.reset();
      document.getElementById('expectedArrival').value = '';
    }
    
    restockOrderProducts = [];
    lowStockProductsInOrder.clear();
    renderOrderProductList();
    
    // Switch to order list tab dan refresh datanya
    const tabOrderList = document.getElementById('tabOrderList');
    if (tabOrderList) {
      setTimeout(() => {
        tabOrderList.click();
        // Refresh order list setelah tab switch selesai
        setTimeout(() => {
          if (typeof window.loadOrderList === 'function') {
            window.loadOrderList();
          }
        }, 100);
      }, 100);
    }
    
    // Update dashboard stats
    updateRestockDashboardCards();
    
  } catch (err) {
    if (window.toast) {
      window.toast.error('Failed to create order. Please try again.');
    }
    console.error('Order creation error:', err);
  } finally {
    // Reset processing flag
    isProcessingOrder = false;
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
  
  // Setup order date change handler
  function setupOrderDateHandler() {
    const orderDateInput = document.getElementById('orderDate');
    const expectedArrivalInput = document.getElementById('expectedArrival');
    
    if (orderDateInput && expectedArrivalInput) {
      // Initial setup if date already selected
      if (orderDateInput.value) {
        updateExpectedArrival();
      }
      
      // Add event listeners
      ['change', 'input'].forEach(eventType => {
        orderDateInput.addEventListener(eventType, function() {
          if (this.value) {
            const date = new Date(this.value);
            date.setDate(date.getDate() + 5);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            expectedArrivalInput.value = `${yyyy}-${mm}-${dd}`;
          } else {
            expectedArrivalInput.value = '';
          }
        });
      });
    }
  }
  
  // Call setup immediately
  setupOrderDateHandler();
  
  // Re-setup when switching to create order tab
  const tabCreateOrder = document.getElementById('tabCreateOrder');
  if (tabCreateOrder) {
    tabCreateOrder.addEventListener('click', () => {
      setTimeout(setupOrderDateHandler, 100);
    });
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
    console.log('Found clearAllBtn:', btn); // Check if button is found
    btn.addEventListener('click', function(e) {
      console.log('clearAllBtn clicked'); // Check if event is triggered
      e.preventDefault();
      clearAllOrderProducts();
    });
  });
  // Order button (try both ID and class)
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function(e) {
      console.log('submitBtn clicked');
      e.preventDefault();
      handleOrderSubmit(e);
    });
  }
  document.querySelectorAll('.submitBtn').forEach(btn => {
    if (btn !== submitBtn) { // Don't double-bind if we already bound by ID
      console.log('Found submitBtn by class:', btn);
      btn.addEventListener('click', function(e) {
        console.log('submitBtn clicked');
        e.preventDefault();
        handleOrderSubmit(e);
      });
    }
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

  // Initialize expected arrival date
  const dateInput = document.getElementById('orderDate');
  if (dateInput) {
    dateInput.addEventListener('change', updateExpectedArrival);
  }
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