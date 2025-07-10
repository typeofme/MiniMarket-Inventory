// State for edit/delete & global asset cache
let editingAssetId = null;
let deletingAssetId = null;
let globalAssets = [];
let isComponentsLoaded = false;
// let currentFilter = { type: '', status: '', search: '' };

// Utility function to wait for element
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// REMOVE openAssetModal: all modal open/edit/add/delete should use AssetModalManager only
window.openAssetModal = undefined;

// Close modal
function closeAssetModal() {
  const modal = document.getElementById('assetModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 350);
    modal.classList.add('hidden');
  }
}

// REMOVE all form submit/cancelEdit/closeBtn handler: handled by AssetModalManager

// (Hapus event handler submitBtn.onclick yang menyebabkan double submit)


// Asset List Loader with search & filter
window.loadAndRenderAssets = async function() {
  const grid = document.getElementById('assetCardGrid');
  if (!grid) {
    console.warn('Asset card grid not found');
    return;
  }
  
  try {
    // Fetch and cache assets globally
    globalAssets = await window.assetService.getAssets();

    
    // Apply filters
    let filteredAssets = [...globalAssets];
    
    // Search
    const searchInput = document.getElementById('searchAssetInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  
    if (searchTerm) {
      filteredAssets = filteredAssets.filter(a =>
        (a.name && a.name.toLowerCase().includes(searchTerm)) ||
        (a.type && a.type.toLowerCase().includes(searchTerm)) ||
        (a.placement_location && a.placement_location.toLowerCase().includes(searchTerm))
      );
    }


    // Search filter
    if (currentFilter.search) {
      filteredAssets = filteredAssets.filter(a =>
        (a.name && a.name.toLowerCase().includes(currentFilter.search.toLowerCase())) ||
        (a.type && a.type.toLowerCase().includes(currentFilter.search.toLowerCase())) ||
        (a.placement_location && a.placement_location.toLowerCase().includes(currentFilter.search.toLowerCase()))
      );
    }

    // Type filter
    if (currentFilter.type) {
      filteredAssets = filteredAssets.filter(a => 
        (a.type || '').toLowerCase() === currentFilter.type.toLowerCase()
      );
    }

    // Status filter
    if (currentFilter.status) {
      filteredAssets = filteredAssets.filter(a => 
        (a.status || '').toLowerCase() === currentFilter.status.toLowerCase()
      );
    }

    // Render results
    const noAssets = document.getElementById('noAssets');
    if (!filteredAssets.length) {
      if (noAssets) noAssets.style.display = 'block';
      grid.innerHTML = '';
    } else {
      if (noAssets) noAssets.style.display = 'none';
      grid.innerHTML = filteredAssets.map(asset => {
        // Sanitize function to remove stray '}' and trim
        const sanitize = val => (val || '').toString().replace(/}/g, '').trim();
        // Status badge
        let statusLabel = 'Inactive', statusColor = 'bg-gray-400', statusText = 'text-gray-700';
        const assetStatus = sanitize(asset.status).toLowerCase();
        if (assetStatus === 'active') {
          statusLabel = 'Active';
          statusColor = 'bg-green-100';
          statusText = 'text-green-700';
        } else if (assetStatus === 'inactive') {
          statusLabel = 'Inactive';
          statusColor = 'bg-gray-100';
          statusText = 'text-gray-700';
        }

        // Category badge
        const category = sanitize(asset.type) || '-';
        const iconClass = getAssetIcon(category);
        const badgeColor = getCategoryBadgeColor(category);

        // Condition badge
        let conditionColor = 'bg-gray-100 text-gray-700';
        const conditionVal = sanitize(asset.condition).toLowerCase();
        if (conditionVal === 'excellent') conditionColor = 'bg-green-100 text-green-700';
        else if (conditionVal === 'good') conditionColor = 'bg-blue-100 text-blue-700';
        else if (conditionVal === 'fair') conditionColor = 'bg-yellow-100 text-yellow-700';
        else if (conditionVal === 'poor') conditionColor = 'bg-red-100 text-red-700';

        // Location
        const location = sanitize(asset.placement_location) || '-';
        // Purchase date
        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-';
        // Condition
        const condition = sanitize(asset.condition) || '-';
        // Age calculation
        let age = '-';
        let lifecycle = 8;
        if (asset.purchase_date) {
          const purchase = new Date(asset.purchase_date);
          const now = new Date();
          age = now.getFullYear() - purchase.getFullYear();
        }
        let progress = 0;
        if (age !== '-' && !isNaN(age)) {
          progress = Math.min(100, Math.round((age / lifecycle) * 100));
        }

        // Card layout (clean, no stray '}' and no trailing artifacts)
        return `
        <div class="asset-card bg-white rounded-lg shadow p-4 flex flex-col gap-2 mb-3 relative group transition hover:shadow-lg" data-id="${asset.id}">
          <div class="flex items-center gap-3 mb-2">
            <span class="inline-flex items-center justify-center w-10 h-10 rounded-full ${badgeColor}">
              <i class="fas ${iconClass}"></i>
            </span>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-gray-800 truncate">${sanitize(asset.name) || '-'}</div>
              <div class="text-xs text-gray-500 truncate">${location}</div>
            </div>
            <span class="ml-2 px-2 py-1 rounded text-xs font-medium ${statusColor} ${statusText}">${statusLabel}</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="px-2 py-1 rounded ${badgeColor}">${category}</span>
            <span class="px-2 py-1 rounded ${conditionColor}">${(condition.charAt(0).toUpperCase() + condition.slice(1))}</span>
            <span class="px-2 py-1 rounded bg-gray-50 text-gray-500">${purchaseDate}</span>
          </div>
          <div class="flex gap-2 mt-3">
            <button class="edit-asset-btn px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-xs font-medium" data-id="${asset.id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="delete-asset-btn px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-xs font-medium" data-id="${asset.id}"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </div>
        `;
      }).join('');
    }
    
    // Ensure event listeners are attached after render
    setTimeout(() => {
      attachAssetCardEventListeners();
    }, 100);
    
  } catch (err) {
    console.error('Failed to load assets:', err);
    grid.innerHTML = '<div class="text-red-500">Failed to load assets</div>';
  }
}

// Attach event listeners to asset cards
function attachAssetCardEventListeners() {
  console.log('Attaching event listeners to asset cards...');
  
  // Edit buttons
  const editButtons = document.querySelectorAll('.edit-asset-btn');
  editButtons.forEach(btn => {
    btn.removeEventListener('click', handleEditClick); // Remove existing
    btn.addEventListener('click', handleEditClick);
  });
  
  // Delete buttons
  const deleteButtons = document.querySelectorAll('.delete-asset-btn');
  deleteButtons.forEach(btn => {
    btn.removeEventListener('click', handleDeleteClick); // Remove existing
    btn.addEventListener('click', handleDeleteClick);
  });
  
  console.log(`Attached listeners to ${editButtons.length} edit buttons and ${deleteButtons.length} delete buttons`);
}

// Handle edit click
function handleEditClick(e) {
  e.preventDefault();
  e.stopPropagation();
  const id = this.getAttribute('data-id');
  const asset = globalAssets.find(a => String(a.id) === String(id));
  if (asset) {
    // Use AssetModalManager for edit, and ensure select fields are populated
    if (window.AssetModal && typeof window.AssetModal.open === 'function') {
      window.AssetModal.open('edit', asset);
    } else if (window.assetModalManager && typeof window.assetModalManager.open === 'function') {
      window.assetModalManager.open('edit', asset);
    }
  }
}

// Handle delete click
function handleDeleteClick(e) {
  e.preventDefault();
  e.stopPropagation();
  const id = this.getAttribute('data-id');
  console.log('Delete button clicked for asset ID:', id);
  showDeleteConfirmation(id);
}

// Show delete confirmation modal
function showDeleteConfirmation(assetId) {
  console.log('Showing delete confirmation for asset ID:', assetId);
  deletingAssetId = assetId;
  
  const asset = globalAssets.find(a => String(a.id) === String(assetId));
  const assetName = asset ? asset.name : 'this asset';
  
  const modal = document.getElementById('assetDeleteModal');
  
  if (modal) {
    // Update modal content if needed
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      const messageEl = modalContent.querySelector('.delete-message');
      if (messageEl) {
        messageEl.textContent = `Are you sure you want to delete "${assetName}"? This action cannot be undone.`;
      }
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.add('show');
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
    }, 10);
    
    const confirmBtn = document.getElementById('confirmDeleteAsset');
    if (confirmBtn) confirmBtn.focus();
  } else {
    console.error('Delete modal not found, using fallback confirm dialog');
    // Fallback to browser confirm
    if (confirm(`Are you sure you want to delete "${assetName}"?`)) {
      handleDeleteAsset(assetId);
    }
  }
}

// Handle asset deletion
async function handleDeleteAsset(assetId) {
  console.log('Deleting asset with ID:', assetId);
  
  if (!window.assetService || typeof window.assetService.deleteAsset !== 'function') {
    alert('Asset service is not available!');
    return;
  }
  
  try {
    await window.assetService.deleteAsset(assetId);
    // Use AssetModalManager notification for consistency
    if (window.AssetModal && typeof window.AssetModal.showNotification === 'function') {
      window.AssetModal.showNotification('Asset deleted successfully!', 'success');
    } else if (typeof Toast !== 'undefined' && Toast.success) {
      Toast.success('Asset deleted successfully!');
    } else {
      alert('Asset deleted successfully!');
    }
    // Refresh all dashboard/statistics/components
    if (typeof refreshAllComponents === 'function') {
      await refreshAllComponents();
    }
  } catch (err) {
    console.error('Delete error:', err);
    if (window.AssetModal && typeof window.AssetModal.showNotification === 'function') {
      window.AssetModal.showNotification('Failed to delete asset: ' + (err && err.message ? err.message : err), 'error');
    } else {
      alert('Failed to delete asset: ' + (err && err.message ? err.message : err));
    }
  }
}

// Close delete modal
function closeDeleteModal() {
  const modal = document.getElementById('assetDeleteModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
  deletingAssetId = null;
}

// Initialize delete modal events
async function initDeleteModalEvents() {
  try {
    await waitForElement('#assetDeleteModal');
    
    const confirmDelete = document.getElementById('confirmDeleteAsset');
    const cancelDelete = document.getElementById('cancelDeleteAsset');
    const deleteModal = document.getElementById('assetDeleteModal');
    
    if (confirmDelete) {
      confirmDelete.onclick = async function(e) {
        e.preventDefault();
        if (deletingAssetId) {
          await handleDeleteAsset(deletingAssetId);
          closeDeleteModal();
        }
      };
    }
    
    if (cancelDelete) {
      cancelDelete.onclick = function(e) {
        e.preventDefault();
        closeDeleteModal();
      };
    }
    
    if (deleteModal) {
      deleteModal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeDeleteModal();
        }
      });
    }
    
    console.log('Delete modal events initialized');
  } catch (err) {
    console.error('Failed to initialize delete modal events:', err);
  }
}

// Helper functions
function getAssetIcon(type) {
  const icons = {
    'Electronics': 'fa-laptop',
    'Equipment': 'fa-tools',
    'Furniture': 'fa-chair',
    'Vehicles': 'fa-car',
    'Machinery': 'fa-cogs',
    'Tools': 'fa-wrench'
  };
  return icons[type] || 'fa-box';
}

function getCategoryBadgeColor(type) {
  const colors = {
    'Electronics': 'bg-blue-100 text-blue-700',
    'Equipment': 'bg-indigo-100 text-indigo-700',
    'Furniture': 'bg-yellow-100 text-yellow-700',
    'Vehicles': 'bg-green-100 text-green-700',
    'Machinery': 'bg-red-100 text-red-700',
    'Tools': 'bg-gray-100 text-gray-700'
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}

// Update dashboard stats
async function updateDashboardStats() {
  try {
    const assets = await window.assetService.getAssets();
    const stats = {
      total: assets.length,
      active: assets.filter(a => (a.status || '').toLowerCase() === 'active').length,
      inactive: assets.filter(a => (a.status || '').toLowerCase() === 'inactive').length
    };
    
    const totalEl = document.getElementById('totalAssets');
    const activeEl = document.getElementById('activeAssets');
    const inactiveEl = document.getElementById('inactiveAssets');
    
    if (totalEl) totalEl.textContent = stats.total;
    if (activeEl) activeEl.textContent = stats.active;
    if (inactiveEl) inactiveEl.textContent = stats.inactive;
  } catch (err) {
    console.error('Failed to update dashboard stats:', err);
  }
}

// Update health overview
async function updateHealthOverview() {
  try {
    const assets = await window.assetService.getAssets();
    const healthy = assets.filter(a => ["excellent","good"].includes((a.condition || '').toLowerCase())).length;
    const attention = assets.filter(a => (a.condition || '').toLowerCase() === 'fair').length;
    const critical = assets.filter(a => (a.condition || '').toLowerCase() === 'poor').length;
    
    const healthyEl = document.getElementById('countHealthy');
    const attentionEl = document.getElementById('countAttention');
    const criticalEl = document.getElementById('countCritical');
    
    if (healthyEl) healthyEl.textContent = healthy;
    if (attentionEl) attentionEl.textContent = attention;
    if (criticalEl) criticalEl.textContent = critical;
  } catch (err) {
    console.error('Failed to update health overview:', err);
  }
}

// Update asset categories
async function updateAssetCategories() {
  try {
    const fixedCategories = [
      { name: 'Electronics', icon: 'fa-laptop', color: 'bg-blue-100 text-blue-700' },
      { name: 'Equipment', icon: 'fa-tools', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Furniture', icon: 'fa-chair', color: 'bg-yellow-100 text-yellow-700' },
      { name: 'Vehicles', icon: 'fa-car', color: 'bg-green-100 text-green-700' },
      { name: 'Machinery', icon: 'fa-cogs', color: 'bg-red-100 text-red-700' },
      { name: 'Tools', icon: 'fa-wrench', color: 'bg-gray-100 text-gray-700' }
    ];
    
    // Count assets per category
    const assets = await window.assetService.getAssets();
    const typeCounts = {};
    
    fixedCategories.forEach(cat => {
      typeCounts[cat.name] = assets.filter(a => 
        (a.type || '').toLowerCase() === cat.name.toLowerCase()
      ).length;
    });
    
    // Update sidebar categories list
    const list = document.getElementById('assetCategoriesList');
    if (list) {
      list.innerHTML = '';
      
      // Add "All Categories" option
      const allLi = document.createElement('li');
      allLi.className = 'category-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-green-50 cursor-pointer transition group';
      allLi.setAttribute('data-category', '');
      allLi.innerHTML = `
        <span class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 mr-2">
            <i class="fas fa-th-large"></i>
          </span>
          <span class="font-medium">All Categories</span>
        </span>
        <span class="text-xs text-gray-500 group-hover:text-green-600 transition">${assets.length}</span>
      `;
      list.appendChild(allLi);
      
      // Add category options
      fixedCategories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-green-50 cursor-pointer transition group';
        li.setAttribute('data-category', cat.name);
        li.innerHTML = `
          <span class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full ${cat.color} mr-2">
              <i class="fas ${cat.icon}"></i>
            </span>
            <span class="font-medium">${cat.name}</span>
          </span>
          <span class="text-xs text-gray-500 group-hover:text-green-600 transition">${typeCounts[cat.name]}</span>
        `;
        list.appendChild(li);
      });
      
      // Attach click events to category items
      setTimeout(() => {
        attachCategoryClickEvents();
      }, 100);
    }
    
    // Update filter dropdown
    const filterType = document.getElementById('filterType');
    if (filterType) {
      const currentValue = filterType.value;
      filterType.innerHTML = '<option value="">All Categories</option>' +
        fixedCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
      filterType.value = currentValue;
    }
    
  } catch (err) {
    console.error('Failed to update asset categories:', err);
  }
}

// Attach click events to category items
function attachCategoryClickEvents() {
  const categoryItems = document.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    item.removeEventListener('click', handleCategoryClick);
    item.addEventListener('click', handleCategoryClick);
  });
  console.log(`Attached click events to ${categoryItems.length} category items`);
}

// Handle category click
function handleCategoryClick(e) {
  e.preventDefault();
  const categoryType = this.getAttribute('data-category');
  console.log('Category clicked:', categoryType);
  filterAssetsByType(categoryType);
}

// Filter assets by type
function filterAssetsByType(type) {
  console.log('Filtering assets by type:', type);
  
  // Update current filter
  currentFilter.type = type;
  
  // Update filter dropdown
  const filterType = document.getElementById('filterType');
  if (filterType) {
    filterType.value = type;
  }
  
  // Update sidebar highlighting
  const categoryItems = document.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    const itemCategory = item.getAttribute('data-category');
    if (itemCategory === type) {
      item.classList.add('bg-blue-100', 'text-blue-700');
      item.classList.remove('hover:bg-green-50');
    } else {
      item.classList.remove('bg-blue-100', 'text-blue-700');
      item.classList.add('hover:bg-green-50');
    }
  });
  
  // Trigger asset list update
  loadAndRenderAssets();
}

// Initialize search and filter
async function initializeSearchAndFilter() {
  try {
    // Wait for elements to be available
    await waitForElement('#searchAssetInput');
    
    const searchInput = document.getElementById('searchAssetInput');
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');
    
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        currentFilter.search = e.target.value.trim();
        loadAndRenderAssets();
      });
    }
    
    if (filterType) {
      filterType.addEventListener('change', function(e) {
        filterAssetsByType(e.target.value);
      });
    }
    
    if (filterStatus) {
      filterStatus.addEventListener('change', function(e) {
        currentFilter.status = e.target.value;
        loadAndRenderAssets();
      });
    }
    
    console.log('Search and filter initialized');
  } catch (err) {
    console.error('Failed to initialize search and filter:', err);
  }
}

// Initialize Add Asset button
async function initAddAssetBtn() {
  try {
    await waitForElement('#addAssetBtn');
    
    const addBtn = document.getElementById('addAssetBtn');
    if (addBtn) {
      addBtn.onclick = function(e) {
        e.preventDefault();
        if (window.AssetModal && typeof window.AssetModal.open === 'function') {
          window.AssetModal.open('add');
        } else if (window.assetModalManager && typeof window.assetModalManager.open === 'function') {
          window.assetModalManager.open('add');
        }
      };
      console.log('Add asset button initialized');
    }
  } catch (err) {
    console.error('Failed to initialize add asset button:', err);
  }
}

// Refresh all components
async function refreshAllComponents() {
  console.log('Refreshing all components...');
  try {
    await Promise.all([
      loadAndRenderAssets(),
      updateDashboardStats(),
      updateHealthOverview(),
      updateAssetCategories()
    ]);
    console.log('All components refreshed successfully');
  } catch (err) {
    console.error('Failed to refresh components:', err);
  }
}

// Ensure components are always visible
function ensureComponentsVisible() {
  const componentsToShow = [
    'assetActionsCategories',
    'assetList',
    'searchAssetInput',
    'filterType',
    'filterStatus',
    'assetCardGrid'
  ];
  
  componentsToShow.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = '';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      console.log(`Made ${id} visible`);
    }
  });
}

// Main initialization function
async function initAssetPage() {
  console.log('Initializing Asset Page...');
  
  try {
    // Ensure components are visible
    ensureComponentsVisible();
    
    // Initialize functionality with proper timing
    await Promise.all([
      initAddAssetBtn(),
      initializeSearchAndFilter(),
      initDeleteModalEvents()
    ]);
    
    // Load initial data
    await refreshAllComponents();
    
    isComponentsLoaded = true;
    console.log('Asset Page initialized successfully');
    
  } catch (err) {
    console.error('Failed to initialize Asset Page:', err);
  }
}

// Wait for components to load
function waitForComponents() {
  return new Promise((resolve) => {
    const checkComponents = () => {
      const requiredComponents = [
        'assetActionsCategories',
        'assetList',
        'assetDashboardCards',
        'assetHealthOverviewSection'
      ];
      
      const allComponentsLoaded = requiredComponents.every(id => {
        const element = document.getElementById(id);
        return element && element.innerHTML.trim() !== '';
      });
      
      if (allComponentsLoaded) {
        console.log('All components loaded successfully');
        resolve();
      } else {
        setTimeout(checkComponents, 100);
      }
    };
    
    checkComponents();
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM Content Loaded, waiting for components...');
  
  try {
    await waitForComponents();
    // Add additional delay to ensure all components are fully rendered
    setTimeout(async () => {
      await initAssetPage();
    }, 500);
  } catch (err) {
    console.error('Failed to initialize after DOM load:', err);
    // Fallback initialization
    setTimeout(initAssetPage, 3000);
  }
});

// Also initialize when components are loaded (backup)
if (window.ComponentLoader && typeof window.ComponentLoader.onAllLoaded === 'function') {
  window.ComponentLoader.onAllLoaded(async () => {
    if (!isComponentsLoaded) {
      console.log('Components loaded via ComponentLoader');
      await initAssetPage();
    }
  });
}