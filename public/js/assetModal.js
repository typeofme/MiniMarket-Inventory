// Asset Modal Manager - Clean Implementation (disesuaikan dengan struktur MiniMarket)

// Icon helper functions - available globally
function getTypeIcon(type) {
  const icons = {
    'Electronics': 'fas fa-laptop',
    'Equipment': 'fas fa-tools',
    'Furniture': 'fas fa-chair',
    'Vehicles': 'fas fa-car',
    'Machinery': 'fas fa-cogs',
    'Tools': 'fas fa-hammer'
  };
  return icons[type] || 'fas fa-box';
}

function getTypeIconColor(type) {
  const colors = {
    'Electronics': 'text-blue-600',
    'Equipment': 'text-orange-600',
    'Furniture': 'text-brown-600',
    'Vehicles': 'text-green-600',
    'Machinery': 'text-purple-600',
    'Tools': 'text-red-600'
  };
  return colors[type] || 'text-gray-600';
}

function getTypeIconBackground(type) {
  const backgrounds = {
    'Electronics': 'bg-blue-100',
    'Equipment': 'bg-orange-100',
    'Furniture': 'bg-amber-100',
    'Vehicles': 'bg-green-100',
    'Machinery': 'bg-purple-100',
    'Tools': 'bg-red-100'
  };
  return backgrounds[type] || 'bg-gray-100';
}

class AssetModalManager {
  constructor() {
    if (AssetModalManager.instance) return AssetModalManager.instance;
    this.modal = null;
    this.form = null;
    this.isEditing = false;
    this.currentAssetId = null;
    this.isSubmitting = false;
    this.eventsAttached = false;
    this.init();
    AssetModalManager.instance = this;
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.modal = document.getElementById('assetModal');
    this.form = document.getElementById('assetForm');
    if (!this.modal || !this.form) return;
    this.bindEvents();
  }

  bindEvents() {
    if (this.eventsAttached) return;
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });
    const assetTypeSelect = this.form.querySelector('#assetType');
    if (assetTypeSelect) {
      assetTypeSelect.addEventListener('change', (e) => {
        this.updateIconPreview(e.target.value);
      });
    }
    this.eventsAttached = true;
  }

  updateIconPreview(assetType) {
    const iconPreview = document.getElementById('assetIconPreview');
    if (iconPreview) {
      const iconClass = getTypeIcon(assetType);
      const iconColor = getTypeIconColor(assetType);
      const bgColor = getTypeIconBackground(assetType);
      iconPreview.className = `rounded-full p-3 flex items-center justify-center ${bgColor}`;
      iconPreview.innerHTML = `<i class="${iconClass} ${iconColor} text-lg"></i>`;
    }
  }

  open(mode = 'add', assetData = null) {
    if (!this.modal) {
      this.modal = document.getElementById('assetModal');
      if (!this.modal) return;
    }
    this.isEditing = mode === 'edit';
    this.currentAssetId = assetData?.id || null;
    const title = document.getElementById('modalTitle') || document.getElementById('formTitle');
    if (title) title.textContent = this.isEditing ? 'Edit Asset' : 'Add New Asset';
    const submitText = document.getElementById('submitText') || document.querySelector('#assetForm button[type="submit"]');
    if (submitText) submitText.textContent = this.isEditing ? 'Update Asset' : 'Save Asset';
    if (this.isEditing && assetData) {
      this.populateForm(assetData);
    } else {
      this.clearForm();
    }
    this.modal.classList.remove('hidden');
    this.modal.classList.add('active');
    this.modal.style.display = 'flex';
    this.modal.style.visibility = 'visible';
    this.modal.style.opacity = '1';
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    this.modal.classList.add('hidden');
    this.modal.style.display = 'none';
    this.modal.style.visibility = 'hidden';
    this.modal.style.opacity = '0';
    document.body.style.overflow = '';
    setTimeout(() => {
      this.isEditing = false;
      this.currentAssetId = null;
      this.clearForm();
    }, 300);
  }

  isOpen() {
    return this.modal && this.modal.classList.contains('active');
  }

  populateForm(asset) {
    if (!this.form) return;
    // Set all fields explicitly to avoid select bug
    this.form.querySelector('#assetName').value = asset.name || '';
    this.form.querySelector('#assetType').value = asset.type || '';
    this.form.querySelector('#placementLocation').value = asset.placement_location || '';
    this.form.querySelector('#purchaseDate').value = asset.purchase_date ? asset.purchase_date.split('T')[0] : '';
    // For select fields, force value
    const cond = this.form.querySelector('#condition');
    if (cond) cond.value = asset.condition || '';
    const stat = this.form.querySelector('#assetStatus');
    if (stat) stat.value = asset.status || '';
    if (asset.type) this.updateIconPreview(asset.type);
  }

  clearForm() {
    if (!this.form) return;
    this.form.reset();
    const hiddenId = this.form.querySelector('#assetId');
    if (hiddenId) hiddenId.value = '';
    this.updateIconPreview('');
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData.entries());
      // Hanya field yang fix
      const assetData = {
        name: data.assetName,
        type: data.assetType,
        placement_location: data.placementLocation,
        purchase_date: data.purchaseDate,
        condition: data.condition,
        status: data.assetStatus
      };
      let result;
      if (this.isEditing && this.currentAssetId) {
        result = await window.assetService.updateAsset(this.currentAssetId, assetData);
        this.showNotification('Asset updated successfully!', 'success');
      } else {
        result = await window.assetService.createAsset(assetData);
        this.showNotification('Asset created successfully!', 'success');
      }
      if (window.refreshAllComponents) await window.refreshAllComponents();
      this.close();
    } catch (error) {
      this.showNotification('Error saving asset: ' + error.message, 'error');
    } finally {
      this.isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  }
  async deleteAsset(assetId) {
    try {
      await window.assetService.deleteAsset(assetId);
      this.showNotification('Asset deleted successfully!', 'success');
      if (window.refreshAllComponents) await window.refreshAllComponents();
      this.close();
    } catch (error) {
      this.showNotification('Error deleting asset: ' + error.message, 'error');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 1001; padding: 12px 16px; border-radius: 8px; color: white; font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); transform: translateX(100%); transition: transform 0.3s ease; background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};`;
    document.body.appendChild(notification);
    requestAnimationFrame(() => { notification.style.transform = 'translateX(0)'; });
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 300);
    }, 3000);
  }
}

// Inisialisasi modal manager
const AssetModal = new AssetModalManager();
window.AssetModal = AssetModal;
window.openAddAssetModal = () => AssetModal.open('add');
window.editAsset = async (id) => {
  try {
    const asset = await window.assetService.getAsset(id);
    AssetModal.open('edit', asset);
  } catch (error) {
    AssetModal.showNotification('Error loading asset: ' + error.message, 'error');
  }
};
window.deleteAsset = async (id) => {
  if (!id) return;
  if (confirm('Are you sure you want to delete this asset?')) {
    await AssetModal.deleteAsset(id);
  }
};
