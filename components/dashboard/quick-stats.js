class QuickStats {
  constructor() {
    console.log('QuickStats constructor called');
    this.init();
  }

  showLoading(message = "Loading statistics...") {
    // Use global shared loading screen
    if (typeof window.showLoading === 'function') {
      window.showLoading(message);
    }
  }

  hideLoading() {
    // Use global shared loading screen
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }
  }

  async init() {
    console.log('QuickStats init started');
    this.updateCurrentDate();
    this.showLoading("Fetching today's statistics...");
    await this.loadTodayStats();
    this.hideLoading();
    
    // Refresh stats every 5 minutes
    setInterval(() => {
      console.log('Refreshing stats...');
      this.showLoading("Refreshing statistics...");
      this.loadTodayStats().finally(() => this.hideLoading());
    }, 300000);
  }

  updateCurrentDate() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateString = now.toLocaleDateString('en-US', options);
    
    const dateElement = document.getElementById('current-date');
    console.log('Date element found:', dateElement);
    if (dateElement) {
      dateElement.textContent = dateString;
      console.log('Updated date to:', dateString);
    }
  }

  async loadTodayStats() {
    try {
      console.log('Fetching today stats from API...');
      this.showLoading("Fetching today's data...");
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/reports/today-stats?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch today stats: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data from API:', data);
      this.updateStatsDisplay(data);
      this.hideLoading();
    } catch (error) {
      console.error('Error loading today stats:', error);
      this.showErrorState();
      this.hideLoading();
    }
  }

  updateStatsDisplay(data) {
    console.log('Updating display with data:', data);
    
    // Update sales
    const salesAmount = document.getElementById('today-sales-amount');
    const salesChange = document.getElementById('today-sales-change');
    const salesIcon = document.getElementById('today-sales-icon');
    
    console.log('Sales elements found:', { salesAmount, salesChange, salesIcon });
    
    if (salesAmount) {
      salesAmount.textContent = `$${data.todaySales}`;
      console.log('Updated sales amount to:', `$${data.todaySales}`);
    }
    
    if (salesChange && salesIcon) {
      const changeText = `${Math.abs(data.salesChange.percentage)}% from yesterday`;
      salesChange.textContent = changeText;
      
      if (data.salesChange.direction === 'up') {
        salesIcon.className = 'fas fa-arrow-up text-green-500 mr-1';
      } else {
        salesIcon.className = 'fas fa-arrow-down text-red-500 mr-1';
      }
    }

    // Update orders
    const ordersAmount = document.getElementById('today-orders-amount');
    const ordersChange = document.getElementById('today-orders-change');
    const ordersIcon = document.getElementById('today-orders-icon');
    
    console.log('Orders elements found:', { ordersAmount, ordersChange, ordersIcon });
    
    if (ordersAmount) {
      ordersAmount.textContent = data.todayOrders;
      console.log('Updated orders amount to:', data.todayOrders);
    }
    
    if (ordersChange && ordersIcon) {
      const changeText = `${data.ordersChange.value} ${data.ordersChange.comparison}`;
      ordersChange.textContent = changeText;
      
      if (data.ordersChange.direction === 'up') {
        ordersIcon.className = 'fas fa-arrow-up text-blue-500 mr-1';
      } else {
        ordersIcon.className = 'fas fa-arrow-down text-red-500 mr-1';
      }
    }
  }

  showErrorState() {
    // Show default values when there's an error
    const salesAmount = document.getElementById('today-sales-amount');
    const ordersAmount = document.getElementById('today-orders-amount');
    
    if (salesAmount) {
      salesAmount.textContent = '$0.00';
    }
    
    if (ordersAmount) {
      ordersAmount.textContent = '0';
    }
  }
}

// Initialize immediately since the component is loaded after DOM is ready
console.log('QuickStats script loaded, initializing immediately...');
new QuickStats();
