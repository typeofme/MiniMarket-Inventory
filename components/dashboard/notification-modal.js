/**
 * NotificationModal - A reusable notification system
 * Features:
 * - Show different types of notifications (info, success, warning, error)
 * - Animated entrance and exit
 * - Auto-dismiss with configurable timeout
 * - Mark as read functionality
 * - Notification grouping
 */

class NotificationModal {
  constructor(options = {}) {
    // Default options
    this.options = {
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left
      maxNotifications: 5,   // Maximum number of notifications to show at once
      autoHideTimeout: 5000, // Auto-hide timeout in ms (0 to disable)
      zIndex: 1000,          // z-index for the notification container
      sounds: false,         // Play sounds on notification
      animation: true,       // Enable animations
      ...options
    };
    
    this.notifications = [];
    this.unreadCount = 0;
    this.containerEl = null;
    this.isVisible = false;
    
    // Create the container element
    this.init();
  }
  
  init() {
    // Create container if it doesn't exist
    if (!this.containerEl) {
      this.containerEl = document.createElement('div');
      this.containerEl.className = `notification-modal-container ${this.options.position}`;
      this.containerEl.style.zIndex = this.options.zIndex;
      document.body.appendChild(this.containerEl);
      
      // Create main panel
      this.panelEl = document.createElement('div');
      this.panelEl.className = 'notification-panel';
      this.panelEl.innerHTML = `
        <div class="notification-header">
          <h3>Notifications</h3>
          <div class="notification-actions">
            <button class="mark-all-read" title="Mark all as read">
              <i class="fas fa-check-double"></i>
            </button>
            <button class="close-panel" title="Close">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="notification-tabs">
          <button class="tab active" data-tab="all">All</button>
          <button class="tab" data-tab="unread">Unread</button>
        </div>
        <div class="notification-list"></div>
        <div class="notification-footer">
          <button class="view-all">View All Notifications</button>
        </div>
      `;
      this.containerEl.appendChild(this.panelEl);
      
      // Add event listeners
      this.panelEl.querySelector('.close-panel').addEventListener('click', () => this.hidePanel());
      this.panelEl.querySelector('.mark-all-read').addEventListener('click', () => this.markAllAsRead());
      this.panelEl.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
      });
      
      // Prevent clicks inside the panel from closing it
      this.panelEl.addEventListener('click', (e) => e.stopPropagation());
      
      // Add overlay to close panel when clicking outside
      this.overlayEl = document.createElement('div');
      this.overlayEl.className = 'notification-overlay';
      this.overlayEl.addEventListener('click', () => this.hidePanel());
      document.body.appendChild(this.overlayEl);
      
      // Add styles if not already added
      this.addStyles();
    }
    
    return this;
  }
  
  addStyles() {
    if (document.getElementById('notification-modal-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'notification-modal-styles';
    styleEl.textContent = `
      .notification-modal-container {
        position: fixed;
        pointer-events: none;
        z-index: ${this.options.zIndex};
      }
      
      .notification-modal-container.top-right {
        top: 1rem;
        right: 1rem;
      }
      
      .notification-modal-container.top-left {
        top: 1rem;
        left: 1rem;
      }
      
      .notification-modal-container.bottom-right {
        bottom: 1rem;
        right: 1rem;
      }
      
      .notification-modal-container.bottom-left {
        bottom: 1rem;
        left: 1rem;
      }
      
      .notification-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(2px);
        z-index: ${this.options.zIndex - 1};
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .notification-overlay.visible {
        opacity: 1;
        visibility: visible;
      }
      
      .notification-panel {
        position: absolute;
        width: 380px;
        max-width: calc(100vw - 2rem);
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        pointer-events: auto;
        transform: translateY(-20px);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .notification-modal-container.top-right .notification-panel {
        right: 0;
        top: 0;
      }
      
      .notification-modal-container.top-left .notification-panel {
        left: 0;
        top: 0;
      }
      
      .notification-modal-container.bottom-right .notification-panel {
        right: 0;
        bottom: 0;
        transform: translateY(20px);
      }
      
      .notification-modal-container.bottom-left .notification-panel {
        left: 0;
        bottom: 0;
        transform: translateY(20px);
      }
      
      .notification-panel.visible {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
      }
      
      .notification-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid #f1f5f9;
      }
      
      .notification-header h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        color: #1e293b;
      }
      
      .notification-actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .notification-actions button {
        background: none;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .notification-actions button:hover {
        background: #f1f5f9;
        color: #334155;
      }
      
      .notification-tabs {
        display: flex;
        padding: 0.5rem 1rem;
        gap: 0.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #f1f5f9;
      }
      
      .notification-tabs .tab {
        padding: 0.5rem 1rem;
        background: none;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .notification-tabs .tab:hover {
        background: #f1f5f9;
      }
      
      .notification-tabs .tab.active {
        background: white;
        color: #3b82f6;
        font-weight: 500;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      }
      
      .notification-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 0.5rem 0;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f8fafc;
      }
      
      .notification-list::-webkit-scrollbar {
        width: 6px;
      }
      
      .notification-list::-webkit-scrollbar-track {
        background: #f8fafc;
      }
      
      .notification-list::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 6px;
      }
      
      .notification-item {
        display: flex;
        padding: 1rem;
        gap: 0.75rem;
        border-bottom: 1px solid #f1f5f9;
        transition: background-color 0.2s ease;
        cursor: pointer;
        position: relative;
      }
      
      .notification-item:last-child {
        border-bottom: none;
      }
      
      .notification-item:hover {
        background-color: #f8fafc;
      }
      
      .notification-item.unread {
        background-color: #f0f9ff;
      }
      
      .notification-item.unread:hover {
        background-color: #e0f2fe;
      }
      
      .notification-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      
      .notification-icon.info {
        background-color: #e0f2fe;
        color: #0ea5e9;
      }
      
      .notification-icon.success {
        background-color: #dcfce7;
        color: #22c55e;
      }
      
      .notification-icon.warning {
        background-color: #fef3c7;
        color: #f59e0b;
      }
      
      .notification-icon.error {
        background-color: #fee2e2;
        color: #ef4444;
      }
      
      .notification-content {
        flex-grow: 1;
      }
      
      .notification-title {
        font-weight: 500;
        font-size: 0.9rem;
        color: #334155;
        margin-bottom: 0.25rem;
      }
      
      .notification-message {
        font-size: 0.8rem;
        color: #64748b;
        line-height: 1.4;
      }
      
      .notification-time {
        font-size: 0.7rem;
        color: #94a3b8;
        margin-top: 0.25rem;
      }
      
      .notification-actions-item {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .notification-item:hover .notification-actions-item {
        opacity: 1;
      }
      
      .notification-mark-read,
      .notification-delete {
        background: none;
        border: none;
        width: 26px;
        height: 26px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .notification-mark-read:hover,
      .notification-delete:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #334155;
      }
      
      .notification-footer {
        padding: 0.75rem 1rem;
        display: flex;
        justify-content: center;
        border-top: 1px solid #f1f5f9;
      }
      
      .view-all {
        padding: 0.5rem 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        color: #3b82f6;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        font-weight: 500;
      }
      
      .view-all:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }
      
      .notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transform: scale(0);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .notification-badge.visible {
        transform: scale(1);
      }
      
      /* Toast notifications */
      .notification-toast {
        pointer-events: auto;
        width: 350px;
        max-width: calc(100vw - 2rem);
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05);
        margin-bottom: 0.75rem;
        overflow: hidden;
        display: flex;
        transform: translateX(100%);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      }
      
      .notification-modal-container.top-left .notification-toast,
      .notification-modal-container.bottom-left .notification-toast {
        transform: translateX(-100%);
      }
      
      .notification-toast.visible {
        transform: translateX(0);
        opacity: 1;
      }
      
      .notification-toast-icon {
        width: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      
      .notification-toast-icon.info {
        background-color: #e0f2fe;
        color: #0ea5e9;
      }
      
      .notification-toast-icon.success {
        background-color: #dcfce7;
        color: #22c55e;
      }
      
      .notification-toast-icon.warning {
        background-color: #fef3c7;
        color: #f59e0b;
      }
      
      .notification-toast-icon.error {
        background-color: #fee2e2;
        color: #ef4444;
      }
      
      .notification-toast-content {
        padding: 1rem;
        flex-grow: 1;
      }
      
      .notification-toast-title {
        font-weight: 600;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
      }
      
      .notification-toast-message {
        font-size: 0.8rem;
        color: #64748b;
      }
      
      .notification-toast-close {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        font-size: 0.8rem;
        color: #94a3b8;
        cursor: pointer;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .notification-toast-close:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #64748b;
      }
      
      /* Empty state */
      .notification-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        color: #94a3b8;
      }
      
      .notification-empty-icon {
        font-size: 2rem;
        margin-bottom: 1rem;
        background: #f1f5f9;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .notification-empty-text {
        font-size: 0.9rem;
        text-align: center;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  // Show the notification panel
  showPanel() {
    this.panelEl.classList.add('visible');
    this.overlayEl.classList.add('visible');
    this.isVisible = true;
    this.renderNotifications();
    return this;
  }
  
  // Hide the notification panel
  hidePanel() {
    this.panelEl.classList.remove('visible');
    this.overlayEl.classList.remove('visible');
    this.isVisible = false;
    return this;
  }
  
  // Toggle the notification panel
  togglePanel() {
    if (this.isVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
    return this;
  }
  
  // Add a notification
  add(options) {
    const defaultOptions = {
      id: Date.now().toString(),
      title: 'Notification',
      message: '',
      type: 'info',  // info, success, warning, error
      time: new Date(),
      read: false,
      showToast: true,
      autoHide: this.options.autoHideTimeout > 0,
      autoHideTimeout: this.options.autoHideTimeout,
      onClick: null
    };
    
    const notification = { ...defaultOptions, ...options };
    
    // Add to the list
    this.notifications.unshift(notification);
    
    // Limit the number of notifications
    if (this.options.maxNotifications > 0 && this.notifications.length > this.options.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.options.maxNotifications);
    }
    
    // Update unread count
    if (!notification.read) {
      this.unreadCount++;
      this.updateBadge();
    }
    
    // Show toast if enabled
    if (notification.showToast) {
      this.showToast(notification);
    }
    
    // Render notifications if panel is visible
    if (this.isVisible) {
      this.renderNotifications();
    }
    
    return this;
  }
  
  // Show a toast notification
  showToast(notification) {
    const toastEl = document.createElement('div');
    toastEl.className = 'notification-toast';
    toastEl.setAttribute('data-id', notification.id);
    
    // Icons for different notification types
    const icons = {
      info: 'fa-info-circle',
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      error: 'fa-exclamation-circle'
    };
    
    toastEl.innerHTML = `
      <div class="notification-toast-icon ${notification.type}">
        <i class="fas ${icons[notification.type]}"></i>
      </div>
      <div class="notification-toast-content">
        <div class="notification-toast-title">${notification.title}</div>
        <div class="notification-toast-message">${notification.message}</div>
      </div>
      <button class="notification-toast-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to container
    this.containerEl.appendChild(toastEl);
    
    // Show with animation
    setTimeout(() => {
      toastEl.classList.add('visible');
    }, 10);
    
    // Add event listeners
    toastEl.querySelector('.notification-toast-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideToast(toastEl);
    });
    
    toastEl.addEventListener('click', () => {
      // Mark as read
      this.markAsRead(notification.id);
      
      // Execute onClick callback if provided
      if (typeof notification.onClick === 'function') {
        notification.onClick(notification);
      }
      
      // Hide toast
      this.hideToast(toastEl);
    });
    
    // Auto hide if enabled
    if (notification.autoHide) {
      setTimeout(() => {
        this.hideToast(toastEl);
      }, notification.autoHideTimeout);
    }
    
    return toastEl;
  }
  
  // Hide a toast notification
  hideToast(toastEl) {
    toastEl.classList.remove('visible');
    toastEl.style.opacity = '0';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 300);
  }
  
  // Mark a notification as read
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.updateBadge();
      
      if (this.isVisible) {
        this.renderNotifications();
      }
    }
    return this;
  }
  
  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.unreadCount = 0;
    this.updateBadge();
    
    if (this.isVisible) {
      this.renderNotifications();
    }
    return this;
  }
  
  // Remove a notification
  remove(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      const notification = this.notifications[index];
      if (!notification.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateBadge();
      }
      
      this.notifications.splice(index, 1);
      
      if (this.isVisible) {
        this.renderNotifications();
      }
    }
    return this;
  }
  
  // Clear all notifications
  clear() {
    this.notifications = [];
    this.unreadCount = 0;
    this.updateBadge();
    
    if (this.isVisible) {
      this.renderNotifications();
    }
    return this;
  }
  
  // Switch between tabs (All/Unread)
  switchTab(tab) {
    const tabs = this.panelEl.querySelectorAll('.tab');
    tabs.forEach(t => {
      if (t.dataset.tab === tab) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
    
    this.activeTab = tab;
    this.renderNotifications();
    return this;
  }
  
  // Render notifications in the panel
  renderNotifications() {
    const listEl = this.panelEl.querySelector('.notification-list');
    const filteredNotifications = this.activeTab === 'unread' 
      ? this.notifications.filter(n => !n.read) 
      : this.notifications;
    
    if (filteredNotifications.length === 0) {
      listEl.innerHTML = `
        <div class="notification-empty">
          <div class="notification-empty-icon">
            <i class="fas fa-bell-slash"></i>
          </div>
          <div class="notification-empty-text">
            No notifications to display
          </div>
        </div>
      `;
      return this;
    }
    
    // Icons for different notification types
    const icons = {
      info: 'fa-info-circle',
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      error: 'fa-exclamation-circle'
    };
    
    // Format time
    const formatTime = (date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      if (diff < 60 * 1000) {
        return 'Just now';
      } else if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days} day${days > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    };
    
    // Render notifications
    listEl.innerHTML = filteredNotifications.map(notification => `
      <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
        <div class="notification-icon ${notification.type}">
          <i class="fas ${icons[notification.type]}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${formatTime(new Date(notification.time))}</div>
        </div>
        <div class="notification-actions-item">
          ${notification.read ? 
            `<button class="notification-delete" title="Remove">
              <i class="fas fa-trash-alt"></i>
            </button>` : 
            `<button class="notification-mark-read" title="Mark as read">
              <i class="fas fa-check"></i>
            </button>`
          }
        </div>
      </div>
    `).join('');
    
    // Add event listeners
    const notificationItems = listEl.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
      const id = item.dataset.id;
      
      // Click on notification
      item.addEventListener('click', () => {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
          this.markAsRead(id);
          
          if (typeof notification.onClick === 'function') {
            notification.onClick(notification);
          }
        }
      });
      
      // Mark as read button
      const markReadBtn = item.querySelector('.notification-mark-read');
      if (markReadBtn) {
        markReadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.markAsRead(id);
        });
      }
      
      // Delete button
      const deleteBtn = item.querySelector('.notification-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.remove(id);
        });
      }
    });
    
    return this;
  }
  
  // Update the notification badge
  updateBadge() {
    const trigger = document.querySelector('[data-notification-trigger]');
    if (!trigger) return this;
    
    let badge = trigger.querySelector('.notification-badge');
    
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notification-badge';
      trigger.appendChild(badge);
    }
    
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
    
    return this;
  }
  
  // Set up a trigger element
  setTrigger(selector) {
    const trigger = document.querySelector(selector);
    if (!trigger) return this;
    
    trigger.setAttribute('data-notification-trigger', '');
    
    // Add badge to trigger
    if (this.unreadCount > 0) {
      this.updateBadge();
    }
    
    // Toggle panel on click
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePanel();
    });
    
    return this;
  }
}

// Make NotificationModal available globally
if (typeof window !== 'undefined') {
  window.NotificationModal = NotificationModal;
}
