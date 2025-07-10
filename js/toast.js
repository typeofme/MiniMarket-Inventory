/**
 * Simple Toast/Popup System for warnings, errors, and alerts
 * Usage: 
 * - Toast.success('Message')
 * - Toast.error('Message') 
 * - Toast.warning('Message')
 * - Toast.info('Message')
 */

class Toast {
  static container = null;
  
  static init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }
  
  static show(message, type = 'info', duration = 5000) {
    this.init();
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      margin-bottom: 10px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      pointer-events: auto;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    // Set colors and icons based on type
    const configs = {
      success: {
        bg: '#10b981',
        icon: 'fas fa-check-circle'
      },
      error: {
        bg: '#ef4444', 
        icon: 'fas fa-exclamation-circle'
      },
      warning: {
        bg: '#f59e0b',
        icon: 'fas fa-exclamation-triangle'
      },
      info: {
        bg: '#3b82f6',
        icon: 'fas fa-info-circle'
      }
    };
    
    const config = configs[type] || configs.info;
    toast.style.backgroundColor = config.bg;
    
    toast.innerHTML = `
      <i class="${config.icon}"></i>
      <span>${message}</span>
      <i class="fas fa-times" style="margin-left: auto; cursor: pointer; opacity: 0.7; hover:opacity: 1;"></i>
    `;
    
    // Add click to close functionality
    toast.addEventListener('click', () => {
      this.remove(toast);
    });
    
    this.container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
    
    return toast;
  }
  
  static remove(toast) {
    if (toast && toast.parentNode) {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }
  
  static success(message, duration = 5000) {
    return this.show(message, 'success', duration);
  }
  
  static error(message, duration = 7000) {
    return this.show(message, 'error', duration);
  }
  
  static warning(message, duration = 6000) {
    return this.show(message, 'warning', duration);
  }
  
  static info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }
  
  // Clear all toasts
  static clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Auto initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Toast.init());
} else {
  Toast.init();
}

// Make it globally available
window.Toast = Toast;
