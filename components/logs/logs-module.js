class LogsModule {
  constructor() {
    this.logs = [];
    this.currentPage = 1;
    this.logsPerPage = 20;
    this.totalLogs = 0;
    this.totalPages = 0;
    this.filters = {
      search: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    };
    
    this.init();
  }

  async init() {
    try {
      // Wait a bit for components to be ready
      await this.waitForComponents();
      this.bindEvents();
      this.loadStats();
      this.loadLogs();
    } catch (error) {
      console.error('Error initializing logs module:', error);
    }
  }

  async waitForComponents() {
    // Wait for sidebar and other components to be loaded
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const sidebar = document.querySelector('.sidebar, #sidebar-component .sidebar');
      if (sidebar) {
        this.setupSidebar();
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  setupSidebar() {
    // Add active state to logs navigation
    const sidebar = document.querySelector('.sidebar, #sidebar-component .sidebar');
    if (sidebar) {
      // Remove active state from all nav items
      const navItems = sidebar.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.classList.remove('active', 'active-nav-item');
      });
      
      // Add active state to logs navigation
      const logsNav = sidebar.querySelector('#nav-user, [data-page="logs"]');
      if (logsNav) {
        logsNav.classList.add('active', 'active-nav-item');
      }
    }
  }

  bindEvents() {
    // Refresh button
    document.getElementById('refresh-logs')?.addEventListener('click', () => {
      this.loadLogs();
      this.loadStats();
    });

    // Export button
    document.getElementById('export-logs')?.addEventListener('click', () => {
      this.exportLogs();
    });

    // Search input
    const searchInput = document.getElementById('search-logs');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.currentPage = 1;
          this.loadLogs();
        }, 500);
      });
    }

    // Filter dropdowns and date inputs
    document.getElementById('filter-action')?.addEventListener('change', (e) => {
      this.filters.action = e.target.value;
      this.currentPage = 1;
      this.loadLogs();
    });

    document.getElementById('filter-date-from')?.addEventListener('change', (e) => {
      this.filters.dateFrom = e.target.value;
      this.currentPage = 1;
      this.loadLogs();
    });

    document.getElementById('filter-date-to')?.addEventListener('change', (e) => {
      this.filters.dateTo = e.target.value;
      this.currentPage = 1;
      this.loadLogs();
    });

    // Clear filters
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      this.clearFilters();
    });

    // Logs per page
    document.getElementById('logs-per-page')?.addEventListener('change', (e) => {
      this.logsPerPage = parseInt(e.target.value);
      this.currentPage = 1;
      this.loadLogs();
    });

    // Pagination
    document.getElementById('prev-page')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadLogs();
      }
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadLogs();
      }
    });

    document.getElementById('prev-page-mobile')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadLogs();
      }
    });

    document.getElementById('next-page-mobile')?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadLogs();
      }
    });

    // Modal close
    document.getElementById('close-log-modal')?.addEventListener('click', () => {
      this.closeLogModal();
    });

    // Close modal on backdrop click
    document.getElementById('log-detail-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'log-detail-modal') {
        this.closeLogModal();
      }
    });
  }

  async loadStats() {
    try {
      const token = window.authService ? window.authService.getToken() : localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const response = await fetch('/api/logs/summary/activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        return;
      }

      if (response.ok) {
        const stats = await response.json();
        this.renderStats(stats);
      } else {
        console.error('Failed to load stats:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  renderStats(stats) {
    // Calculate various stats
    const totalActions = stats.reduce((sum, stat) => sum + stat.count, 0);
    const createCount = stats.find(s => s.action === 'create')?.count || 0;
    const updateCount = stats.find(s => s.action === 'update')?.count || 0;
    const editCount = stats.find(s => s.action === 'edit')?.count || 0;
    const restockCount = stats.find(s => s.action === 'restock')?.count || 0;
    const deleteCount = stats.find(s => s.action === 'delete')?.count || 0;

    // Update the stats cards
    document.getElementById('total-logs-stat').textContent = totalActions.toLocaleString();
    
    // Get today's activity from actual logs
    this.getTodayActivity().then(todayCount => {
      document.getElementById('today-logs-stat').textContent = todayCount.toLocaleString();
      
      // Update today's progress bar
      const maxValue = Math.max(totalActions, 100);
      const todayProgressBar = document.getElementById('today-progress');
      if (todayProgressBar) {
        todayProgressBar.style.width = `${Math.min((todayCount / maxValue) * 100, 100)}%`;
      }
    });
    
    // Recent updates (create + update + edit)
    const recentUpdates = createCount + updateCount + editCount;
    document.getElementById('updates-logs-stat').textContent = recentUpdates.toLocaleString();
    
    // Critical actions (deletions)
    document.getElementById('critical-logs-stat').textContent = deleteCount.toLocaleString();

    // Update progress bars
    const maxValue = Math.max(totalActions, 100);
    
    const updatesProgressBar = document.getElementById('updates-progress');
    if (updatesProgressBar) {
      updatesProgressBar.style.width = `${Math.min((recentUpdates / maxValue) * 100, 100)}%`;
    }
    
    const criticalProgressBar = document.getElementById('critical-progress');
    if (criticalProgressBar) {
      criticalProgressBar.style.width = `${Math.min((deleteCount / maxValue) * 100, 100)}%`;
    }
  }

  async getTodayActivity() {
    try {
      const token = window.authService ? window.authService.getToken() : localStorage.getItem('token');
      
      if (!token) return 0;

      const response = await fetch(`/api/logs/summary/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
    } catch (error) {
      console.error('Error getting today activity:', error);
    }
    return 0;
  }

  async loadLogs() {
    this.showLoading();

    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.logsPerPage
      });

      // Add filters
      if (this.filters.search) params.append('search', this.filters.search);
      if (this.filters.action) params.append('action', this.filters.action);
      if (this.filters.dateFrom) params.append('start_date', this.filters.dateFrom);
      if (this.filters.dateTo) params.append('end_date', this.filters.dateTo);

      const token = window.authService ? window.authService.getToken() : localStorage.getItem('token');
      if (!token) {
        this.hideLoading();
        return;
      }

      const response = await fetch(`/api/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.hideLoading();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      this.logs = data.logs || [];
      this.totalLogs = data.pagination?.total || 0;
      this.totalPages = data.pagination?.totalPages || 0;
      
      this.renderLogs();
      this.renderPagination();
      this.hideLoading();
    } catch (error) {
      console.error('Error loading logs:', error);
      this.showError(`Failed to load activity logs: ${error.message}`);
      this.hideLoading();
    }
  }

  renderLogs() {
    const tbody = document.getElementById('logs-table-body');
    const emptyState = document.getElementById('logs-empty');
    
    if (!tbody) return;

    if (this.logs.length === 0) {
      tbody.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }

    emptyState?.classList.add('hidden');

    tbody.innerHTML = this.logs.map(log => `
      <tr class="log-table-row">
        <td class="table-cell">
          <div class="log-timestamp">
            <span class="log-timestamp-date">${this.formatDate(log.created_at)}</span>
            <span class="log-timestamp-time">${this.formatTime(log.created_at)}</span>
          </div>
        </td>
        <td class="table-cell">
          <div class="log-user">
            <div class="log-user-name">${log.user_name || 'Unknown User'}</div>
            ${log.user_email ? `<div class="log-user-email">${log.user_email}</div>` : ''}
          </div>
        </td>
        <td class="table-cell">
          <span class="action-badge ${log.action}">${log.action}</span>
        </td>
        <td class="table-cell">
          <div class="log-product">${log.product_name || `${log.entity_type} #${log.entity_id}`}</div>
        </td>
        <td class="table-cell">
          <div class="log-description" title="${log.description || 'No description'}">${log.description || 'No description'}</div>
        </td>
        <td class="table-cell">
          <button class="btn btn-outline" onclick="logsModule.viewLogDetails(${log.id})">
            <i class="fas fa-eye"></i>
            <span>View</span>
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    const showingFrom = ((this.currentPage - 1) * this.logsPerPage) + 1;
    const showingTo = Math.min(this.currentPage * this.logsPerPage, this.totalLogs);

    // Update pagination info
    document.getElementById('showing-from').textContent = showingFrom;
    document.getElementById('showing-to').textContent = showingTo;
    document.getElementById('total-logs').textContent = this.totalLogs;

    // Update pagination buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const prevBtnMobile = document.getElementById('prev-page-mobile');
    const nextBtnMobile = document.getElementById('next-page-mobile');

    if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    if (prevBtnMobile) prevBtnMobile.disabled = this.currentPage <= 1;
    if (nextBtnMobile) nextBtnMobile.disabled = this.currentPage >= this.totalPages;

    // Generate page numbers
    this.renderPageNumbers();
  }

  renderPageNumbers() {
    const pageNumbersContainer = document.getElementById('page-numbers');
    if (!pageNumbersContainer) return;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    let html = '';

    if (startPage > 1) {
      html += `<button class="page-btn" onclick="logsModule.goToPage(1)">1</button>`;
      if (startPage > 2) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="logsModule.goToPage(${i})">${i}</button>`;
    }

    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
      html += `<button class="page-btn" onclick="logsModule.goToPage(${this.totalPages})">${this.totalPages}</button>`;
    }

    pageNumbersContainer.innerHTML = html;
  }

  goToPage(page) {
    this.currentPage = page;
    this.loadLogs();
  }

  async viewLogDetails(logId) {
    try {
      const token = window.authService ? window.authService.getToken() : localStorage.getItem('token');
      if (!token) {
        this.showError('Authentication required to view log details');
        return;
      }

      const response = await fetch(`/api/logs/${logId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.showError('Authentication failed. Please log in again.');
        return;
      }

      if (response.ok) {
        const log = await response.json();
        this.showLogModal(log);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to load log details: ${errorText}`);
      }
    } catch (error) {
      console.error('Error loading log details:', error);
      this.showError('Failed to load log details');
    }
  }

  showLogModal(log) {
    const modal = document.getElementById('log-detail-modal');
    const content = document.getElementById('log-detail-content');
    
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="log-detail-section">
        <h4 class="log-detail-title">Basic Information</h4>
        <div class="log-detail-grid">
          <div class="log-detail-item">
            <div class="log-detail-label">Date & Time</div>
            <div class="log-detail-value">${this.formatFullDateTime(log.created_at)}</div>
          </div>
          <div class="log-detail-item">
            <div class="log-detail-label">User</div>
            <div class="log-detail-value">${log.user_name || 'Unknown User'}</div>
          </div>
          <div class="log-detail-item">
            <div class="log-detail-label">Action</div>
            <div class="log-detail-value">
              <span class="action-badge ${log.action}">${log.action}</span>
            </div>
          </div>
          <div class="log-detail-item">
            <div class="log-detail-label">Entity</div>
            <div class="log-detail-value">${log.entity_type} #${log.entity_id}</div>
          </div>
          <div class="log-detail-item">
            <div class="log-detail-label">Product</div>
            <div class="log-detail-value">${log.product_name || 'N/A'}</div>
          </div>
          <div class="log-detail-item">
            <div class="log-detail-label">IP Address</div>
            <div class="log-detail-value">${this.formatIpAddress(log.ip_address)}</div>
          </div>
        </div>
      </div>

      ${log.description ? `
        <div class="log-detail-section">
          <h4 class="log-detail-title">Description</h4>
          <div class="log-detail-item">
            <div class="log-detail-value">${log.description}</div>
          </div>
        </div>
      ` : ''}

      ${(log.old_values || log.new_values) ? `
        <div class="log-detail-section">
          <h4 class="log-detail-title">Changes</h4>
          <div class="log-changes-container">
            ${log.old_values ? `
              <div class="log-changes-section">
                <div class="log-changes-title">
                  <i class="fas fa-minus-circle text-red-500"></i>
                  Old Values
                </div>
                <div class="log-changes-content">
                  <div class="json-display">${this.formatJsonWithHighlight(this.cleanJsonForDisplay(log.old_values))}</div>
                </div>
              </div>
            ` : ''}
            ${log.new_values ? `
              <div class="log-changes-section">
                <div class="log-changes-title">
                  <i class="fas fa-plus-circle text-green-500"></i>
                  New Values
                </div>
                <div class="log-changes-content">
                  <div class="json-display">${this.formatJsonWithHighlight(this.cleanJsonForDisplay(log.new_values))}</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      ${log.user_agent ? `
        <div class="log-detail-section">
          <h4 class="log-detail-title">Technical Details</h4>
          <div class="log-detail-item">
            <div class="log-detail-label">User Agent</div>
            <div class="log-detail-value" style="word-break: break-all;">${log.user_agent}</div>
          </div>
        </div>
      ` : ''}
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeLogModal() {
    const modal = document.getElementById('log-detail-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  }

  clearFilters() {
    this.filters = {
      search: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    };

    document.getElementById('search-logs').value = '';
    document.getElementById('filter-action').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';

    this.currentPage = 1;
    this.loadLogs();
  }

  async exportLogs() {
    try {
      const token = window.authService ? window.authService.getToken() : localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found for export');
        return;
      }

      const params = new URLSearchParams();
      
      // Add current filters to export
      if (this.filters.search) params.append('search', this.filters.search);
      if (this.filters.action) params.append('action', this.filters.action);
      if (this.filters.dateFrom) params.append('start_date', this.filters.dateFrom);
      if (this.filters.dateTo) params.append('end_date', this.filters.dateTo);

      // Get all logs (no pagination for export)
      const response = await fetch(`/api/logs?${params}&limit=10000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.warn('Authentication failed for export');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        this.downloadCSV(data.logs);
      } else {
        throw new Error('Failed to export logs');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      this.showError('Failed to export logs');
    }
  }

  downloadCSV(logs) {
    const headers = ['Date', 'Time', 'User', 'Action', 'Entity Type', 'Entity ID', 'Product', 'Description'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        this.formatDate(log.created_at),
        this.formatTime(log.created_at),
        `"${log.user_name || 'Unknown User'}"`,
        log.action,
        log.entity_type,
        log.entity_id,
        `"${log.product_name || 'N/A'}"`,
        `"${(log.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  showLoading() {
    document.getElementById('logs-loading')?.classList.remove('hidden');
    document.getElementById('logs-empty')?.classList.add('hidden');
  }

  hideLoading() {
    document.getElementById('logs-loading')?.classList.add('hidden');
  }

  showError(message) {
    // You can implement a toast notification here
    console.error(message);
    alert(message);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFullDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Helper function to clean JSON data for display (replace base64 images with placeholder)
  cleanJsonForDisplay(obj) {
    if (!obj) return obj;
    
    // Handle both string and object inputs
    let cleaned;
    if (typeof obj === 'string') {
      try {
        // Try to parse if it's a JSON string
        cleaned = JSON.parse(obj);
      } catch (e) {
        // If parsing fails, return the string as is
        return obj;
      }
    } else {
      // Create a deep copy to avoid modifying original
      cleaned = JSON.parse(JSON.stringify(obj));
    }
    
    // Function to recursively clean the object
    const cleanObject = (target) => {
      if (typeof target === 'object' && target !== null) {
        for (const key in target) {
          if (target.hasOwnProperty(key)) {
            if (typeof target[key] === 'string' && target[key].startsWith('data:image/')) {
              // Replace base64 image with placeholder
              const imageType = target[key].split(';')[0].replace('data:image/', '');
              const sizeKB = Math.round(target[key].length / 1024);
              target[key] = `[${imageType.toUpperCase()} Image - ${sizeKB}KB]`;
            } else if (typeof target[key] === 'object') {
              cleanObject(target[key]);
            }
          }
        }
      }
    };
    
    cleanObject(cleaned);
    return cleaned;
  }

  // Helper function to format JSON with beautiful syntax highlighting
  formatJsonWithHighlight(obj) {
    return this.renderJsonObject(obj, 0);
  }

  // Recursive function to render JSON objects with proper indentation
  renderJsonObject(obj, depth = 0) {
    const indent = '&nbsp;&nbsp;'.repeat(depth * 2);
    const nextIndent = '&nbsp;&nbsp;'.repeat((depth + 1) * 2);
    
    if (obj === null) {
      return '<span class="json-null">null</span>';
    }
    
    if (typeof obj === 'string') {
      return `<span class="json-string">"${this.escapeHtml(obj)}"</span>`;
    }
    
    if (typeof obj === 'number') {
      return `<span class="json-number">${obj}</span>`;
    }
    
    if (typeof obj === 'boolean') {
      return `<span class="json-boolean">${obj}</span>`;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return '<span class="json-bracket">[]</span>';
      }
      
      let result = '<span class="json-bracket">[</span><br>';
      obj.forEach((item, index) => {
        result += nextIndent + this.renderJsonObject(item, depth + 1);
        if (index < obj.length - 1) {
          result += '<span class="json-punctuation">,</span>';
        }
        result += '<br>';
      });
      result += indent + '<span class="json-bracket">]</span>';
      return result;
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return '<span class="json-bracket">{}</span>';
      }
      
      let result = '<span class="json-bracket">{</span><br>';
      keys.forEach((key, index) => {
        result += nextIndent;
        result += `<span class="json-key">"${this.escapeHtml(key)}"</span>`;
        result += '<span class="json-punctuation">: </span>';
        result += this.renderJsonObject(obj[key], depth + 1);
        if (index < keys.length - 1) {
          result += '<span class="json-punctuation">,</span>';
        }
        result += '<br>';
      });
      result += indent + '<span class="json-bracket">}</span>';
      return result;
    }
    
    return String(obj);
  }

  // Helper function to escape HTML characters
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper function to format IP address for display
  formatIpAddress(ip) {
    if (!ip) return 'N/A';
    if (ip === 'localhost') return 'localhost (local)';
    if (ip === '127.0.0.1') return 'localhost (127.0.0.1)';
    if (ip === '::1') return 'localhost (IPv6)';
    return ip;
  }
}

// Initialize the logs module when the page loads
let logsModule;

document.addEventListener('DOMContentLoaded', function() {
  logsModule = new LogsModule();
  // Make it globally accessible for onclick handlers
  window.logsModule = logsModule;
});

// Also make it available immediately if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM not ready yet
} else {
  // DOM already loaded
  logsModule = new LogsModule();
  window.logsModule = logsModule;
}
