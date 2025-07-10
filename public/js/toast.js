/**
 * Modern Toast Notification System
 * A beautiful and modern popup notification system for user feedback
 */

class Toast {
  constructor() {
    this.containerCreated = false;
    this.init();
    this.injectStyles();
  }

  init() {
    // Wait for DOM to be ready before creating container
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createContainer());
    } else {
      this.createContainer();
    }
  }

  injectStyles() {
    if (document.getElementById('toast-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast-container {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        max-width: 420px;
      }

      .toast {
        pointer-events: auto;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
        border-radius: 16px;
        padding: 20px 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--toast-border);
        backdrop-filter: blur(20px);
        transform: translateX(100%) scale(0.95);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        opacity: 0;
        min-width: 350px;
        position: relative;
        overflow: hidden;
        cursor: pointer;
      }

      .toast.show {
        transform: translateX(0) scale(1);
        opacity: 1;
      }

      .toast:hover {
        transform: translateX(-6px) scale(1.03);
        box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--toast-border);
        filter: brightness(1.05);
      }

      .toast:hover .toast-icon {
        animation: bounce 0.6s ease-in-out;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-4px); }
        60% { transform: translateY(-2px); }
      }

      .toast::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: var(--toast-gradient);
        border-radius: 16px 16px 0 0;
        animation: shimmer 2s ease-in-out infinite;
      }

      @keyframes shimmer {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }

      .toast-content {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .toast-icon {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 600;
        background: var(--toast-icon-bg);
        color: var(--toast-icon-color);
        box-shadow: 0 8px 25px -5px var(--toast-shadow);
        position: relative;
        overflow: hidden;
        animation: pulse 2s ease-in-out infinite;
      }

      .toast-icon::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        animation: shine 3s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      @keyframes shine {
        0% { left: -100%; }
        100% { left: 100%; }
      }

      .toast-body {
        flex: 1;
        min-width: 0;
      }

      .toast-title {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 6px 0;
        line-height: 1.3;
      }

      .toast-message {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
        font-size: 14px;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
        word-wrap: break-word;
      }

      .toast-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.2s ease;
        opacity: 0.7;
      }

      .toast-close:hover {
        background: #f3f4f6;
        color: #6b7280;
        opacity: 1;
      }

      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 4px;
        background: var(--toast-gradient);
        border-radius: 0 0 16px 16px;
        transition: width linear;
        animation: progressGlow 1s ease-in-out infinite alternate;
      }

      @keyframes progressGlow {
        0% { box-shadow: 0 0 5px var(--toast-glow); }
        100% { box-shadow: 0 0 15px var(--toast-glow); }
      }

      /* Success Toast */
      .toast.success {
        --toast-color: #10b981;
        --toast-gradient: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
        --toast-icon-bg: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        --toast-icon-color: #047857;
        --toast-shadow: rgba(16, 185, 129, 0.4);
        --toast-glow: rgba(16, 185, 129, 0.6);
        --toast-border: rgba(16, 185, 129, 0.3);
      }

      /* Error Toast */
      .toast.error {
        --toast-color: #ef4444;
        --toast-gradient: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
        --toast-icon-bg: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        --toast-icon-color: #b91c1c;
        --toast-shadow: rgba(239, 68, 68, 0.4);
        --toast-glow: rgba(239, 68, 68, 0.6);
        --toast-border: rgba(239, 68, 68, 0.3);
      }

      /* Warning Toast */
      .toast.warning {
        --toast-color: #f59e0b;
        --toast-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
        --toast-icon-bg: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        --toast-icon-color: #b45309;
        --toast-shadow: rgba(245, 158, 11, 0.4);
        --toast-glow: rgba(245, 158, 11, 0.6);
        --toast-border: rgba(245, 158, 11, 0.3);
      }

      /* Info Toast */
      .toast.info {
        --toast-color: #3b82f6;
        --toast-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
        --toast-icon-bg: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        --toast-icon-color: #1d4ed8;
        --toast-shadow: rgba(59, 130, 246, 0.4);
        --toast-glow: rgba(59, 130, 246, 0.6);
        --toast-border: rgba(59, 130, 246, 0.3);
      }

      /* Mobile responsive */
      @media (max-width: 640px) {
        .toast-container {
          left: 16px;
          right: 16px;
          top: 16px;
          max-width: none;
        }

        .toast {
          min-width: auto;
          width: 100%;
        }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .toast {
          background: #1f2937;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .toast-title {
          color: #f9fafb;
        }

        .toast-message {
          color: #d1d5db;
        }

        .toast-close {
          color: #9ca3af;
        }

        .toast-close:hover {
          background: #374151;
          color: #f3f4f6;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  createContainer() {
    // Create toast container if it doesn't exist
    if (!this.containerCreated && !document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
      this.containerCreated = true;
    }
  }

  show(message, type = 'info', duration = 5000) {
    // Ensure container exists before showing toast
    if (!this.containerCreated || !document.getElementById('toast-container')) {
      this.createContainer();
    }
    
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Toast configuration
    const config = {
      success: {
        title: 'Success',
        icon: '✓'
      },
      error: {
        title: 'Error',
        icon: '✕'
      },
      warning: {
        title: 'Warning',
        icon: '⚠'
      },
      info: {
        title: 'Information',
        icon: 'ℹ'
      }
    };

    const toastConfig = config[type] || config.info;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `
      <button class="toast-close" type="button" aria-label="Close">×</button>
      <div class="toast-content">
        <div class="toast-icon">${toastConfig.icon}</div>
        <div class="toast-body">
          <div class="toast-title">${toastConfig.title}</div>
          <div class="toast-message">${message}</div>
        </div>
      </div>
      ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
    `;

    // Click to dismiss
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismiss(toast);
    });

    toast.addEventListener('click', () => {
      this.dismiss(toast);
    });

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Progress bar animation and auto dismiss
    if (duration > 0) {
      const progressBar = toast.querySelector('.toast-progress');
      if (progressBar) {
        progressBar.style.width = '100%';
        setTimeout(() => {
          progressBar.style.width = '0%';
        }, 100);
      }

      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  }

  dismiss(toast) {
    if (!toast || !toast.parentElement) return;

    toast.classList.remove('show');

    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 400);
  }

  success(message, duration = 5000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 7000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 6000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }
}

// Create global instance when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.Toast = new Toast();
    initializeGlobalToast();
  });
} else {
  window.Toast = new Toast();
  initializeGlobalToast();
}

function initializeGlobalToast() {
  // Also expose individual methods for convenience
  window.toast = {
    success: (message, duration) => window.Toast.success(message, duration),
    error: (message, duration) => window.Toast.error(message, duration),
    warning: (message, duration) => window.Toast.warning(message, duration),
    info: (message, duration) => window.Toast.info(message, duration),
    show: (message, type, duration) => window.Toast.show(message, type, duration)
  };
}
