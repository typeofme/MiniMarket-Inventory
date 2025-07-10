window.products = [];
window.categories = [];

window.editMode = false;
window.currentProductId = null;

document.addEventListener('DOMContentLoaded', function() {
  // Initialize services when they become available
  function initializeServices() {
    if (typeof CategoryService !== 'undefined') {
      window.categoryService = new CategoryService();
    } else {
      setTimeout(initializeServices, 100);
      return;
    }
    
    if (typeof ProductService !== 'undefined') {
      window.productService = new ProductService();
    } else {
      setTimeout(initializeServices, 100);
      return;
    }
    
    // Initialize category management once services are ready
    setTimeout(() => {
      if (window.categoryManagement && typeof window.categoryManagement.init === 'function') {
        window.categoryManagement.init();
      }
    }, 200);
  }
  
  // Start service initialization
  initializeServices();
  
  // Make sure window.editProduct can be accessed from anywhere
  if (typeof window.editProduct === 'function') {
    const originalEditProduct = window.editProduct;
    window.editProduct = function(id) {
      try {
        return originalEditProduct(id);
      } catch (error) {
        // Ignore errors in editProduct
      }
    };
  }
  
  ComponentLoader.onAllLoaded(function() {
    // Make sure CategoryService is loaded
    function ensureServices() {
      if (typeof CategoryService === 'undefined') {
        setTimeout(ensureServices, 100);
        return;
      }
      
      if (typeof ProductService === 'undefined') {
        setTimeout(ensureServices, 100);
        return;
      }
      
      // Initialize services if not already done
      if (!window.categoryService && typeof CategoryService !== 'undefined') {
        window.categoryService = new CategoryService();
      }
      
      if (!window.productService && typeof ProductService !== 'undefined') {
        window.productService = new ProductService();
      }
      
      // Show loading screen only for initial load
      if (typeof showLoading === 'function') {
        showLoading("Loading products data...");
      }
      
      // Load categories first, then products
      loadCategories().then(() => {
        loadProducts().finally(() => {
          // Hide loading screen after initial products are loaded
          setTimeout(() => {
            if (typeof hideLoading === 'function') {
              hideLoading();
            }
            
            // Mark that initial loading is complete
            window.productsInitialLoadComplete = true;
          }, 100);
        });
        // Initialize category management after everything is loaded
        initializeCategoryManagement();
      }).catch(err => {
        console.error('Error in data loading sequence:', err);
        // Hide loading screen even if there's an error
        setTimeout(() => {
          if (typeof hideLoading === 'function') {
            hideLoading();
          }
          // Mark that initial loading is complete even on error
          window.productsInitialLoadComplete = true;
        }, 100);
      });
    }
    
    ensureServices();
  });
});

async function loadCategories() {
  try {
    // Ensure category service is available
    if (!window.categoryService) {
      if (typeof CategoryService !== 'undefined') {
        window.categoryService = new CategoryService();
      } else {
        const response = await fetch('/api/categories/active');
        if (response.ok) {
          window.categories = await response.json();
          renderCategoryDropdown();
          
          // Also populate the filter dropdown on the product list
          if (typeof window.populateCategoryFilterDropdown === 'function') {
            window.populateCategoryFilterDropdown();
          }
          
          return;
        } else {
          throw new Error('Failed to fetch categories');
        }
      }
    }
    
    if (window.categoryService) {
      window.categories = await window.categoryService.getActiveCategories();
      renderCategoryDropdown();
      
      // Also populate the filter dropdown on the product list
      if (typeof window.populateCategoryFilterDropdown === 'function') {
        window.populateCategoryFilterDropdown();
      } else {
        console.warn('populateCategoryFilterDropdown function not available');
      }
    }
  } catch (error) {
    // Try direct API call as fallback
    try {
      const response = await fetch('/api/categories/active');
      if (response.ok) {
        window.categories = await response.json();
        renderCategoryDropdown();
        
        // Also populate the filter dropdown on the product list
        if (typeof window.populateCategoryFilterDropdown === 'function') {
          window.populateCategoryFilterDropdown();
        }
      } else {
        window.categories = [];
        renderCategoryDropdown();
      }
    } catch (fallbackError) {
      window.categories = [];
      renderCategoryDropdown();
    }
  }
}

function renderCategoryDropdown() {
  const categorySelect = document.getElementById('productCategory');
  
  if (!categorySelect) {
    return;
  }
  
  if (!window.categories) {
    return;
  }
  
  if (!Array.isArray(window.categories)) {
    return;
  }
  
  // Save the currently selected category ID if any
  const currentCategoryId = categorySelect.value;
  
  // Clear existing options except the first one
  categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
  
  // Add category options
  window.categories.forEach(category => {
    try {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      
      // If this is the previously selected category, select it again
      if (currentCategoryId && String(category.id) === String(currentCategoryId)) {
        option.selected = true;
      }
      
      if (category.icon) option.setAttribute('data-icon', category.icon);
      if (category.color) option.setAttribute('data-color', category.color);
      categorySelect.appendChild(option);
    } catch (err) {
      console.error(`Error adding category ${JSON.stringify(category)}:`, err);
    }
  });
  
  // If we have a currentCategoryId but none was selected above, try one more time
  if (currentCategoryId && categorySelect.value !== currentCategoryId) {
    try {
      categorySelect.value = currentCategoryId;
    } catch (err) {
      console.error(`Failed to re-select category ID ${currentCategoryId}:`, err);
    }
  }
}

async function loadProducts(showLoadingScreen = null) {
  try {
    // Determine whether to show loading screen
    // Show by default only if initial load is not complete and not explicitly set to false
    const shouldShowLoading = showLoadingScreen === null ? 
      !window.productsInitialLoadComplete : 
      showLoadingScreen;
    
    // Show loading screen with specific message only if needed
    if (shouldShowLoading && typeof showLoading === 'function') {
      showLoading("Fetching product data...");
    }
    
    const products = await window.productService.getProducts();
    
    // Ensure all products have category information if they have category_id
    if (products && products.length > 0 && window.categories && window.categories.length > 0) {
      if (shouldShowLoading && typeof showLoading === 'function') {
        showLoading("Processing product data...");
      }
      
      products.forEach(product => {
        if (product.category_id && !product.category_name) {
          const category = window.categories.find(c => c.id == product.category_id);
          if (category) {
            product.category_name = category.name;
            product.category_icon = category.icon;
            product.category_color = category.color;
            product.category_slug = category.slug;
          }
        }
      });
    }
    
    window.products = products;
    
    if (typeof window.renderProducts === 'function') {
      window.renderProducts();
    }
    
    if (typeof window.updateDashboardStats === 'function') {
      window.updateDashboardStats();
    }

    // Hide loading screen only if we showed it
    if (shouldShowLoading && typeof hideLoading === 'function') {
      hideLoading();
    }
    
    return products;
  } catch (error) {
    // Hide loading screen on error if we showed it
    const shouldShowLoading = showLoadingScreen === null ? 
      !window.productsInitialLoadComplete : 
      showLoadingScreen;
      
    if (shouldShowLoading && typeof hideLoading === 'function') {
      hideLoading();
    }
    
    if (typeof window.toast !== 'undefined') {
      window.toast.error('Failed to load products from the server. Please refresh the page.');
    }
    return [];
  }
}

window.loadProducts = loadProducts;

// Global function to refresh category dropdowns
window.populateCategories = function() {
  // Refresh the product form category dropdown
  if (typeof renderCategoryDropdown === 'function') {
    renderCategoryDropdown();
  }
  
  // Refresh the product list filter dropdown
  if (typeof window.populateCategoryFilterDropdown === 'function') {
    window.populateCategoryFilterDropdown();
  }
};

function setupEventListeners() {
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
}

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
          <td class="p-3 font-medium">$${parseFloat(product.price).toFixed(2)}</td>
          <td class="p-3 hidden md:table-cell text-gray-600">${product.description || '-'}</td>
          <td class="p-3 hidden md:table-cell">
            ${(() => {
                // If we have a category_id, try to display the category info
                if (product.category_id) {
                  // If we have complete category data on the product, use it
                  if (product.category_name && product.category_icon && product.category_color) {
                    return `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm" style="background-color: ${product.category_color}20; color: ${product.category_color};">
                      <i class="${product.category_icon} mr-1"></i>
                      ${product.category_name}
                    </span>`;
                  }
                  // Otherwise try to look it up from window.categories
                  else if (window.categories && window.categories.length > 0) {
                    const category = window.categories.find(c => c.id == product.category_id);
                    if (category) {
                      return `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm" style="background-color: ${category.color}20; color: ${category.color};">
                        <i class="${category.icon} mr-1"></i>
                        ${category.name}
                      </span>`;
                    } else {
                      // We have a category_id but couldn't find the category
                      return `<span class="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        Category ID: ${product.category_id}
                      </span>`;
                    }
                  }
                }
                
                // No category_id or couldn't find category info
                return `<span class="px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                  Uncategorized
                </span>`;
              })()
            }
          </td>
          <td class="p-3">
            <button onclick="window.editProduct('${product.id}')" class="edit-product-btn text-blue-600 hover:bg-blue-100 p-2 rounded-lg mr-1 transition-all" data-id="${product.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="window.deleteProduct('${product.id}')" class="delete-product-btn text-red-600 hover:bg-red-100 p-2 rounded-lg transition-all" data-id="${product.id}">
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

window.updateDashboardStats = async function() {
  try {
    const stats = await window.productService.getProductStats();
    
    const totalProductsEl = document.getElementById('totalProducts');
    if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts;
    
    const totalStockEl = document.getElementById('totalStock');
    if (totalStockEl) totalStockEl.textContent = stats.totalStock;
    
    const avgPriceEl = document.getElementById('avgPrice');
    if (avgPriceEl) avgPriceEl.textContent = `$${stats.averagePrice.toFixed(2)}`;
  } catch (error) {
    if (window.products && window.products.length > 0) {
      const totalProductsEl = document.getElementById('totalProducts');
      if (totalProductsEl) totalProductsEl.textContent = window.products.length;
      
      const totalStock = window.products.reduce((sum, product) => sum + product.stock, 0);
      const totalStockEl = document.getElementById('totalStock');
      if (totalStockEl) totalStockEl.textContent = totalStock;
      
      const totalPrice = window.products.reduce((sum, product) => sum + parseFloat(product.price || 0), 0);
      const avgPrice = window.products.length > 0 ? totalPrice / window.products.length : 0;
      const avgPriceEl = document.getElementById('avgPrice');
      if (avgPriceEl) avgPriceEl.textContent = `$${avgPrice.toFixed(2)}`;
    }
  }
};

window.addProductNotification = function(product) {
  if (typeof window.toast !== 'undefined') {
    window.toast.success(`Product "${product.name}" has been added to your inventory`);
  }
};

window.editProductNotification = function(product) {
  if (typeof window.toast !== 'undefined') {
    window.toast.info(`Product "${product.name}" has been updated successfully`);
  }
};

window.deleteProductNotification = function(product) {
  if (typeof window.toast !== 'undefined') {
    window.toast.warning(`Product "${product.name}" has been removed from your inventory`);
  }
};



window.deleteProduct = async function(id) {
  window.currentProductId = id;
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.classList.remove('hidden');
  }
};

window.confirmDeleteProduct = async function() {
  if (window.currentProductId) {
    try {
      const product = window.products.find(p => p.id === window.currentProductId);
      
      await window.productService.deleteProduct(window.currentProductId);
      
      const deleteModal = document.getElementById('deleteModal');
      if (deleteModal) deleteModal.classList.add('hidden');
      
      if (product && typeof window.deleteProductNotification === 'function') {
        window.deleteProductNotification(product);
      }
      
      window.currentProductId = null;
      
      // Refresh product data without showing loading screen
      await loadProducts(false);
    } catch (error) {
      // Hide the modal even when there's an error
      const deleteModal = document.getElementById('deleteModal');
      if (deleteModal) deleteModal.classList.add('hidden');
      
      if (typeof window.toast !== 'undefined') {
        window.toast.error('Failed to delete product. Please try again.');
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
  const form = document.getElementById('simple-product-form');
  
  if (formTitle) formTitle.textContent = 'Add New Product';
  if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus mr-1.5"></i>Add Product';
  if (cancelEdit) cancelEdit.classList.add('hidden');
  
  if (form) {
    form.reset();
    
    const productIdInput = document.getElementById('productId');
    if (productIdInput) productIdInput.value = '';
    
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    if (imagePreviewContainer) {
      imagePreviewContainer.classList.add('hidden');
      imagePreviewContainer.style.display = 'none';
    }
    
    const imageDropArea = document.getElementById('imageDropArea');
    if (imageDropArea) {
      imageDropArea.style.display = 'block';
    }
    
    const previewImg = document.getElementById('previewImg');
    if (previewImg) previewImg.src = '';
    
    const imageFileName = document.getElementById('imageFileName');
    const imageFileSize = document.getElementById('imageFileSize');
    if (imageFileName) imageFileName.textContent = '';
    if (imageFileSize) imageFileSize.textContent = '';
  }
  
  if (typeof showStatus === 'function') {
    showStatus('Edit canceled', 'info');
  }
};

window.editProduct = async function(id) {
  const productId = String(id);
  
  try {
    let product = window.products.find(p => String(p.id) === productId);
    
    if (!product) {
      product = window.products.find(p => p.id == id);
    }
    
    // Ensure product has complete category information if it has category_id
    if (product && product.category_id && !product.category_name && window.categories) {
      const category = window.categories.find(c => String(c.id) === String(product.category_id));
      if (category) {
        product.category_name = category.name;
        product.category_icon = category.icon;
        product.category_color = category.color;
        product.category_slug = category.slug;
      }
    }
    
    if (product) {
      const nameInput = document.getElementById('productName');
      const stockInput = document.getElementById('productStock');
      const priceInput = document.getElementById('productPrice');
      const descInput = document.getElementById('productDescription');
      const categoryInput = document.getElementById('productCategory');
      const idInput = document.getElementById('productId');
      const formTitle = document.getElementById('formTitle');
      const submitBtn = document.getElementById('submitBtn');
      const cancelEdit = document.getElementById('cancelEdit');
      
      if (nameInput) nameInput.value = product.name;
      if (stockInput) stockInput.value = product.stock;
      if (priceInput) priceInput.value = product.price;
      if (descInput) descInput.value = product.description || '';
      if (categoryInput) categoryInput.value = product.category_id || '';
      if (idInput) {
        idInput.value = product.id;
      }
      
      // Update category dropdown display
      if (product.category_id) {
        // For the simple select dropdown, just set the value
        if (categoryInput) {
          // Handle possible type inconsistencies by trying different approaches
          try {
            categoryInput.value = product.category_id;
            
            // Double check if the value was set correctly
            if (categoryInput.value != product.category_id) {
              categoryInput.value = String(product.category_id);
            }
          } catch (err) {
            console.error(`Error setting category value:`, err);
          }
        }
      } else {
        // Reset category dropdown to default
        if (categoryInput) {
          categoryInput.value = '';
        }
      }
      
      if (product.image) {
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        const previewImg = document.getElementById('previewImg');
        const imageFileName = document.getElementById('imageFileName');
        const imageFileSize = document.getElementById('imageFileSize');
        const imageDropArea = document.getElementById('imageDropArea');
        
        // Create or update the base64 input for editing
        const base64Input = document.getElementById('base64ImageInput') || document.createElement('input');
        base64Input.type = 'hidden';
        base64Input.id = 'base64ImageInput';
        base64Input.name = 'image';
        base64Input.value = product.image;
        
        const form = document.getElementById('simple-product-form');
        if (form && !document.getElementById('base64ImageInput')) {
          form.appendChild(base64Input);
        }
        
        if (imagePreviewContainer && previewImg) {
          previewImg.src = product.image;
          
          imagePreviewContainer.classList.remove('hidden');
          imagePreviewContainer.style.display = 'block';
          
          // Display file info for base64
          if (imageFileName) {
            imageFileName.textContent = 'Product Image';
          }
          
          if (imageFileSize) {
            const sizeInKB = Math.round(product.image.length * 0.75 / 1024); // Approx base64 size
            imageFileSize.textContent = `${sizeInKB} KB`;
          }
          
          if (imageDropArea) {
            imageDropArea.style.display = 'none';
          }
        }
      }
      
      window.editMode = true;
      window.currentProductId = product.id;
      
      if (formTitle) formTitle.textContent = 'Edit Product';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save mr-1.5"></i>Update Product';
      if (cancelEdit) cancelEdit.classList.remove('hidden');
      
      // Add debugging function to help diagnose category selection issues
      window.debugFixCategory = function() {
        if (window.currentProductId && window.editMode) {
          const p = window.products.find(p => String(p.id) === String(window.currentProductId));
          if (p && p.category_id) {
            const catDropdown = document.getElementById('productCategory');
            if (catDropdown) {
              catDropdown.value = p.category_id;
              return true;
            }
          }
        }
        return false;
      };
      
      setTimeout(() => {
        const formContainer = document.getElementById('product-form-container');
        if (formContainer) {
          formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      // Make sure we have the latest category information
      if (typeof loadCategories === 'function') {
        loadCategories().then(() => {
          // Re-set the category value again after categories are reloaded
          if (categoryInput && product.category_id) {
            categoryInput.value = product.category_id;
          }
        }).catch(err => {
          console.error('Error refreshing categories:', err);
        });
      }
    }
  } catch (error) {
    console.error('Error in editProduct:', error);
    if (typeof window.toast !== 'undefined') {
      window.toast.error('Failed to load product for editing. Please try again.');
    }
  }
};

function highlightProductInList(productId) {
  // Try multiple methods to find the product row
  let productRow = 
    // Try the new data-id approach first
    document.querySelector(`button[data-id="${productId}"]`)?.closest('tr') ||
    // Fall back to the onclick attribute approach
    document.evaluate(
      `//button[contains(@onclick, "${productId}")]`, 
      document, 
      null, 
      XPathResult.FIRST_ORDERED_NODE_TYPE
    ).singleNodeValue?.closest('tr');
  
  if (productRow) {
    productRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    productRow.classList.add('bg-blue-50');
    
    productRow.animate(
      [
        { transform: 'scale(1)', backgroundColor: 'rgba(219, 234, 254, 1)' },
        { transform: 'scale(1.02)', backgroundColor: 'rgba(191, 219, 254, 1)' },
        { transform: 'scale(1)', backgroundColor: 'rgba(219, 234, 254, 1)' }
      ],
      {
        duration: 1500,
        iterations: 2
      }
    );
    
    setTimeout(() => {
      productRow.classList.remove('bg-blue-50');
    }, 3000);
  }
}

if (typeof window.submitProductForm !== 'function') {
  window.submitProductForm = async function() {
    try {
      const form = document.getElementById('simple-product-form');
      if (!form) return;
      
      const productIdInput = document.getElementById('productId');
      const isEditMode = productIdInput && productIdInput.value.trim() !== '';
      const nameInput = document.getElementById('productName');
      const stockInput = document.getElementById('productStock');
      const priceInput = document.getElementById('productPrice');
      const descInput = document.getElementById('productDescription');
      const categoryInput = document.getElementById('productCategory');
      
      if (!nameInput.value) {
        if (typeof showStatus === 'function') {
          showStatus('Please enter a product name', 'error');
        }
        return;
      }
      
      if (!categoryInput.value) {
        if (typeof showStatus === 'function') {
          showStatus('Please select a category', 'error');
        }
        return;
      }
      
      if (!stockInput.value || isNaN(parseInt(stockInput.value))) {
        if (typeof showStatus === 'function') {
          showStatus('Please enter valid stock quantity', 'error');
        }
        return;
      }
      
      if (!priceInput.value || isNaN(parseFloat(priceInput.value))) {
        if (typeof showStatus === 'function') {
          showStatus('Please enter valid price', 'error');
        }
        return;
      }
      
      const formData = new FormData(form);
      
      // Debug log for category
      if (categoryInput.value) {
        // Verify the selected category exists in our list
        if (window.categories) {
          const matchingCategory = window.categories.find(c => String(c.id) === String(categoryInput.value));
          if (matchingCategory) {
          } else {
            console.warn(`Warning: Selected category ID ${categoryInput.value} not found in available categories`);
          }
        }
        if (window.categories) {
          const selectedCategory = window.categories.find(c => c.id == categoryInput.value);
          if (selectedCategory) {
          } else {
            console.warn(`Category with ID ${categoryInput.value} not found in window.categories`);
          }
        } else {
          console.warn('window.categories is not available');
        }
      } else {
        console.warn('No category selected');
      }
      
      if (typeof showStatus === 'function') {
        showStatus(`${isEditMode ? 'Updating' : 'Creating'} product...`, 'info');
      }
      
      if (window.productService) {
        let result;
        
        if (isEditMode) {
          const productId = productIdInput.value;
          const existingProductIndex = window.products.findIndex(p => p.id === productId);
          
          if (existingProductIndex !== -1) {
            const fileInput = document.getElementById('productImageUpload');
            const hasNewImage = fileInput && fileInput.files && fileInput.files.length > 0;
            const existingImage = window.products[existingProductIndex].image;
            
            // Get the selected category information
            let categoryInfo = null;
            const selectedCategoryId = categoryInput.value;
            
            if (selectedCategoryId && window.categories) {
              categoryInfo = window.categories.find(cat => cat.id == selectedCategoryId);
            }
            
            const updatedProduct = {
              ...window.products[existingProductIndex],
              name: nameInput.value,
              stock: parseInt(stockInput.value),
              price: parseFloat(priceInput.value),
              description: descInput.value || '',
              category_id: selectedCategoryId || null,
              image: existingImage
            };
            
            // Add category information if available
            if (categoryInfo) {
              updatedProduct.category_name = categoryInfo.name;
              updatedProduct.category_icon = categoryInfo.icon;
              updatedProduct.category_color = categoryInfo.color;
              updatedProduct.category_slug = categoryInfo.slug;
            }
            
            window.products[existingProductIndex] = updatedProduct;
            
            window.renderProducts();
            
            result = await window.productService.updateProduct(productId, formData);
            
            if (typeof window.editProductNotification === 'function') {
              window.editProductNotification(result);
            }
          }
        } else {
          try {
            result = await window.productService.createProduct(formData);
            
            if (result) {
              // Append category information if not already included in the response
              if (result.category_id && !result.category_name && window.categories) {
                const categoryInfo = window.categories.find(cat => cat.id == result.category_id);
                if (categoryInfo) {
                  result.category_name = categoryInfo.name;
                  result.category_icon = categoryInfo.icon;
                  result.category_color = categoryInfo.color;
                  result.category_slug = categoryInfo.slug;
                }
              }
              
              window.products.unshift(result);
              window.renderProducts();
              
              if (typeof window.addProductNotification === 'function') {
                window.addProductNotification(result);
              }
            } else {
              console.error('No product data returned after creation');
              if (typeof showStatus === 'function') {
                showStatus('Product created but no data returned', 'warning');
              }
            }
          } catch (error) {
            console.error('Failed to create product:', error);
            if (typeof showStatus === 'function') {
              showStatus(`Failed to create product: ${error.message}`, 'error');
            }
            return; // Stop processing on error
          }
        }
        
        if (typeof showStatus === 'function') {
          showStatus(`Product ${isEditMode ? 'updated' : 'created'} successfully`, 'success');
        }
        
        // Reload all products to ensure we get fresh data with complete category information
        setTimeout(() => {
          loadProducts(false).then(products => {
            // Find the updated product and highlight it
            const updatedProductIndex = products.findIndex(p => p.id === result.id);
            if (updatedProductIndex !== -1) {
              // Ensure the category information is displayed correctly
              const product = products[updatedProductIndex];
              highlightProductInList(result.id);
            }
          });
        }, 300);
        
        form.reset();
        if (productIdInput) productIdInput.value = '';
        
        const formTitle = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');
        const cancelEdit = document.getElementById('cancelEdit');
        
        if (formTitle) formTitle.textContent = 'Add New Product';
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus mr-1.5"></i>Add Product';
        if (cancelEdit) cancelEdit.classList.add('hidden');
        
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        if (imagePreviewContainer) {
          imagePreviewContainer.classList.add('hidden');
          imagePreviewContainer.style.display = 'none';
        }
        
        const imageDropArea = document.getElementById('imageDropArea');
        if (imageDropArea) {
          imageDropArea.style.display = 'block';
        }
        
        const previewImg = document.getElementById('previewImg');
        if (previewImg) previewImg.src = '';
      } else {
        if (typeof showStatus === 'function') {
          showStatus('Error: ProductService not available', 'error');
        }
      }
    } catch (error) {
      if (typeof showStatus === 'function') {
        showStatus(`Error: ${error.message}`, 'error');
      }
    }
  };
}

// Initialize category management after components load
function initializeCategoryManagement() {
  // Wait for the component to be fully loaded
  const checkForButton = () => {
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    if (manageCategoriesBtn && window.categoryManagement) {
      // Initialize category management if not already done
      if (typeof window.categoryManagement.init === 'function') {
        window.categoryManagement.init();
      }
      // Run debug function
      window.debugCategoryButton();
    } else {
      // Keep checking until elements are available
      setTimeout(checkForButton, 200);
    }
  };
  checkForButton();
}

// Call the initialization function for category management
initializeCategoryManagement();

// Debug function for category management button
window.debugCategoryButton = function() {
  const btn = document.getElementById('manageCategoriesBtn');
  console.log('Category button element:', btn);
  console.log('Category management object:', window.categoryManagement);
  
  if (btn) {
    // Add a direct click handler as backup
    btn.onclick = function() {
      console.log('Button clicked!');
      if (window.categoryManagement && typeof window.categoryManagement.openModal === 'function') {
        window.categoryManagement.openModal();
      } else {
        console.error('Category management not available');
      }
    };
  }
};