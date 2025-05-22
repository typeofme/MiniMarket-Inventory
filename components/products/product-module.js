window.products = [
  {
    id: 1,
    name: "Indomie Goreng",
    stock: 24,
    price: 3500,
    image: "",
    description: "Popular instant noodles",
    bv: "Food"
  },
  {
    id: 2,
    name: "Rice Cooker",
    stock: 10,
    price: 25000,
    image: "",
    description: "5-cup automatic rice cooker",
    bv: "Appliance"
  },
  {
    id: 3,
    name: "Cooking Oil",
    stock: 50,
    price: 8000,
    image: "",
    description: "2L vegetable cooking oil",
    bv: "Food"
  },
  {
    id: 4,
    name: "Electric Kettle",
    stock: 15,
    price: 18000,
    image: "",
    description: "1.7L stainless steel kettle",
    bv: "Appliance"
  },
  {
    id: 5,
    name: "Sari Roti Bread",
    stock: 30,
    price: 12000,
    image: "",
    description: "Soft wheat bread loaf",
    bv: "Food"
  },
  {
    id: 6,
    name: "Galon Aqua",
    stock: 8,
    price: 30000,
    image: "",
    description: "19L purified drinking water",
    bv: "Beverage"
  },
  {
    id: 7,
    name: "Indonesian Coffee",
    stock: 40,
    price: 15000,
    image: "",
    description: "200g ground coffee beans",
    bv: "Beverage"
  },
  {
    id: 8,
    name: "Toilet Paper (12 rolls)",
    stock: 20,
    price: 25000,
    image: "",
    description: "Soft quilted toilet paper",
    bv: "Household"
  },
  {
    id: 9,
    name: "Sunlight Dish Soap",
    stock: 25,
    price: 7000,
    image: "",
    description: "450ml lemon-scented dishwashing liquid",
    bv: "Household"
  },
  {
    id: 10,
    name: "Kopi Sachet ABC",
    stock: 100,
    price: 3000,
    image: "",
    description: "Single-serve coffee mix",
    bv: "Beverage"
  },
  {
    id: 11,
    name: "Bimoli Margarine",
    stock: 18,
    price: 10000,
    image: "",
    description: "Blue tub margarine 250g",
    bv: "Food"
  },
  {
    id: 12,
    name: "Milo Drink Mix",
    stock: 22,
    price: 20000,
    image: "",
    description: "400g chocolate malt powder",
    bv: "Beverage"
  },
  {
    id: 13,
    name: "Santory Sunnah Tissue",
    stock: 12,
    price: 8000,
    image: "",
    description: "Pocket tissue pack x10",
    bv: "Household"
  },
  {
    id: 14,
    name: "Baygon Insect Spray",
    stock: 14,
    price: 25000,
    image: "",
    description: "Anti-mosquito indoor spray",
    bv: "Household"
  },
  {
    id: 15,
    name: "Prima Taste Chili Crab Paste",
    stock: 9,
    price: 45000,
    image: "",
    description: "Authentic Singapore chili crab sauce",
    bv: "Food"
  },
  {
    id: 16,
    name: "Ultra Milk",
    stock: 28,
    price: 12000,
    image: "",
    description: "1L full cream UHT milk",
    bv: "Beverage"
  },
  {
    id: 17,
    name: "Nutella Hazelnut Spread",
    stock: 16,
    price: 55000,
    image: "",
    description: "400g chocolate-hazelnut spread",
    bv: "Food"
  },
  {
    id: 18,
    name: "Samsung USB Flash Drive",
    stock: 30,
    price: 50000,
    image: "",
    description: "32GB USB 3.0 flash drive",
    bv: "Electronics"
  },
  {
    id: 19,
    name: "Panasonic AA Batteries (4pcs)",
    stock: 40,
    price: 15000,
    image: "",
    description: "AA alkaline batteries pack",
    bv: "Electronics"
  },
  {
    id: 20,
    name: "Logitech M220 Mouse",
    stock: 13,
    price: 90000,
    image: "",
    description: "Silent wireless mouse",
    bv: "Electronics"
  },
  {
    id: 21,
    name: "A4 80gsm Paper Ream",
    stock: 25,
    price: 35000,
    image: "",
    description: "500 sheets white printer paper",
    bv: "Stationery"
  },
  {
    id: 22,
    name: "Faber-Castell Pencils (12pcs)",
    stock: 20,
    price: 20000,
    image: "",
    description: "HB graphite pencils set",
    bv: "Stationery"
  },
  {
    id: 23,
    name: "Pilot Black Pen (5pcs)",
    stock: 30,
    price: 15000,
    image: "",
    description: "0.5mm ballpoint pens",
    bv: "Stationery"
  }
];


window.editMode = false;
window.currentProductId = null;

document.addEventListener('DOMContentLoaded', function() {
  ComponentLoader.onAllLoaded(function() {
    if (typeof window.renderProducts === 'function') {
      window.renderProducts();
    }
    if (typeof window.updateDashboardStats === 'function') {
      window.updateDashboardStats();
    }
    document.getElementById('sidebar-overlay')?.addEventListener('click', function() {
      document.querySelector('.sidebar')?.classList.remove('mobile-active');
      this.classList.remove('active');
    });
    window.addEventListener('resize', function() {
      if (window.innerWidth <= 640) {
        document.body.classList.remove('sidebar-closed');
      } else if (window.innerWidth <= 1024) {
        document.querySelector('.sidebar')?.classList.remove('mobile-active');
        document.getElementById('sidebar-overlay')?.classList.remove('active');
      }
    });
  });
});

window.renderProducts = function() {
  if (document.getElementById('productTableBody')) {
    const productTableBody = document.getElementById('productTableBody');
    const noProducts = document.getElementById('noProducts');
    if (window.products && window.products.length > 0) {
      if (noProducts) noProducts.classList.add('hidden');
      productTableBody.innerHTML = window.products.map(product => `
        <tr class="border-t hover:bg-gray-50 transition-colors">
          <td class="p-3">
            ${product.image 
              ? `<img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-contain rounded-lg shadow" />` 
              : `<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"><i class="fas fa-image text-gray-400"></i></div>`
            }
          </td>
          <td class="p-3 font-medium">${product.name}</td>
          <td class="p-3">
            <span class="px-3 py-1 rounded-full ${product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
              ${product.stock}
            </span>
          </td>
          <td class="p-3 font-medium">$${product.price.toFixed(2)}</td>
          <td class="p-3 hidden md:table-cell text-gray-600">${product.description || '-'}</td>
          <td class="p-3">
            <button onclick="window.editProduct(${product.id})" class="text-blue-600 hover:bg-blue-100 p-2 rounded-lg mr-1 transition-all">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="window.deleteProduct(${product.id})" class="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-all">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      if (noProducts) noProducts.classList.remove('hidden');
      productTableBody.innerHTML = '';
    }
  }
};

window.updateDashboardStats = function() {
  if (window.products && window.products.length > 0) {
    const totalProductsEl = document.getElementById('totalProducts');
    if (totalProductsEl) totalProductsEl.textContent = window.products.length;
    const totalStock = window.products.reduce((sum, product) => sum + product.stock, 0);
    const totalStockEl = document.getElementById('totalStock');
    if (totalStockEl) totalStockEl.textContent = totalStock;
    const totalPrice = window.products.reduce((sum, product) => sum + product.price, 0);
    const avgPrice = window.products.length > 0 ? totalPrice / window.products.length : 0;
    const avgPriceEl = document.getElementById('avgPrice');
    if (avgPriceEl) avgPriceEl.textContent = `$${avgPrice.toFixed(2)}`;
  }
};

window.addProductNotification = function(product) {
  if (typeof NotificationModal !== 'undefined' && window.notificationSystem) {
    window.notificationSystem.add({
      title: 'Product Added',
      message: `${product.name} has been added to your inventory`,
      type: 'success',
      time: new Date(),
    });
  }
};

window.editProductNotification = function(product) {
  if (typeof NotificationModal !== 'undefined' && window.notificationSystem) {
    window.notificationSystem.add({
      title: 'Product Updated',
      message: `${product.name} has been updated in your inventory`,
      type: 'info',
      time: new Date(),
    });
  }
};

window.deleteProductNotification = function(product) {
  if (typeof NotificationModal !== 'undefined' && window.notificationSystem) {
    window.notificationSystem.add({
      title: 'Product Deleted',
      message: `${product.name} has been removed from your inventory`,
      type: 'error',
      time: new Date(),
    });
  }
};

function setupNotifications() {
  if (typeof NotificationModal !== 'undefined') {
    window.notificationSystem = new NotificationModal({
      position: 'top-right',
      maxNotifications: 10,
      autoHideTimeout: 3000
    });
    setTimeout(() => {
      const notificationButton = document.getElementById('notification-btn');
      if (notificationButton) {
        window.notificationSystem.setTrigger('#notification-btn');
        window.notificationSystem.add({
          title: 'New Order Received',
          message: 'Customer Adit placed an order for 5 items',
          type: 'success',
          time: new Date(Date.now() - 15 * 60 * 1000),
        });
        window.notificationSystem.add({
          title: 'Low Stock Alert',
          message: 'Indomie Goreng is running low on stock (5 remaining)',
          type: 'warning',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        });
      }
    }, 500);
  }
}

function loadNotifications() {
  const script = document.createElement('script');
  script.src = '/components/dashboard/notification-modal.js';
  script.onload = function() {
    setupNotifications();
  };
  script.onerror = function() {};
  document.head.appendChild(script);
}

window.deleteProduct = function(id) {
  window.currentProductId = id;
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.classList.remove('hidden');
  }
};

window.confirmDeleteProduct = function() {
  if (window.currentProductId) {
    const product = window.products.find(p => p.id === window.currentProductId);
    if (product) {
      window.products = window.products.filter(p => p.id !== window.currentProductId);
      const deleteModal = document.getElementById('deleteModal');
      if (deleteModal) deleteModal.classList.add('hidden');
      if (typeof window.deleteProductNotification === 'function') {
        window.deleteProductNotification(product);
      }
      window.currentProductId = null;
      if (typeof window.renderProducts === 'function') {
        window.renderProducts();
      }
      if (typeof window.updateDashboardStats === 'function') {
        window.updateDashboardStats();
      }
    }
  }
};

window.cancelEditProduct = function() {
  window.editMode = false;
  window.currentProductId = null;
  const formTitle = document.getElementById('formTitle');
  const submitBtn = document.getElementById('submitBtn');
  const cancelEdit = document.getElementById('cancelEdit');
  const productForm = document.getElementById('productForm');
  if (formTitle) formTitle.textContent = 'Add New Product';
  if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus mr-1.5"></i>Add Product';
  if (cancelEdit) cancelEdit.classList.add('hidden');
  if (productForm) {
    productForm.reset();
    if (typeof window.resetImagePreview === 'function') {
      window.resetImagePreview();
    } else {
      const imagePreview = document.getElementById('imagePreview');
      if (imagePreview) {
        imagePreview.innerHTML = `
          <div class="h-48 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
            <span class="text-gray-400">No image selected</span>
          </div>
          <button type="button" id="removeImage" class="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hidden hover:bg-red-500 hover:text-white transition-colors">
            <i class="fas fa-times"></i>
          </button>
        `;
      }
    }
    const currentImageUrl = document.getElementById('currentImageUrl');
    if (currentImageUrl) currentImageUrl.value = '';
  }
};

window.editProduct = function(id) {
  const product = window.products.find(p => p.id === id);
  if (product) {
    const nameInput = document.getElementById('productName');
    const stockInput = document.getElementById('productStock');
    const priceInput = document.getElementById('productPrice');
    const descInput = document.getElementById('productDescription');
    const idInput = document.getElementById('productId');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelEdit = document.getElementById('cancelEdit');
    if (nameInput) nameInput.value = product.name;
    if (stockInput) stockInput.value = product.stock;
    if (priceInput) priceInput.value = product.price;
    if (descInput) descInput.value = product.description || '';
    if (idInput) idInput.value = product.id;
    if (product.image) {
      const imagePreview = document.getElementById('imagePreview');
      if (imagePreview) {
        imagePreview.innerHTML = `<div class="h-48 bg-gray-100 rounded-xl overflow-hidden">
          <img src="${product.image}" alt="${product.name}" class="h-full w-full object-contain mx-auto" />
        </div>`;
        const removeImageBtn = document.getElementById('removeImage');
        if (removeImageBtn) removeImageBtn.classList.remove('hidden');
      }
    }
    window.editMode = true;
    window.currentProductId = product.id;
    if (formTitle) formTitle.textContent = 'Edit Product';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save mr-1.5"></i>Update Product';
    if (cancelEdit) cancelEdit.classList.remove('hidden');
  }
};