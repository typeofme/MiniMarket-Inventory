/**
 * Performance Optimization Utility
 * Adapts animations and effects based on device capabilities
 */

class PerformanceOptimizer {
  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.isLowEndDevice = this.checkLowEndDevice();
    this.preferReducedMotion = this.checkReducedMotion();
    
    this.init();
  }

  /**
   * Detect device capabilities
   */
  detectDeviceCapabilities() {
    const capabilities = {
      memory: navigator.deviceMemory || 4, // Default to 4GB if not supported
      cores: navigator.hardwareConcurrency || 4,
      connection: this.getConnectionSpeed(),
      battery: null,
      gpu: this.checkGPUSupport()
    };

    // Get battery info if available
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        capabilities.battery = {
          level: battery.level,
          charging: battery.charging
        };
        this.adaptToBatteryLevel(battery.level, battery.charging);
      });
    }

    return capabilities;
  }

  /**
   * Check if device is considered low-end
   */
  checkLowEndDevice() {
    const { memory, cores, connection } = this.deviceCapabilities;
    
    // Consider low-end if:
    // - Less than 2GB RAM
    // - Less than 4 CPU cores
    // - Slow connection
    return memory < 2 || cores < 4 || connection === 'slow';
  }

  /**
   * Check if user prefers reduced motion
   */
  checkReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get connection speed category
   */
  getConnectionSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return 'slow';
      } else if (effectiveType === '3g') {
        return 'medium';
      } else {
        return 'fast';
      }
    }
    return 'unknown';
  }

  /**
   * Check GPU support for hardware acceleration
   */
  checkGPUSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return false;
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    
    // Check for software rendering
    return !renderer.includes('Software') && !renderer.includes('Microsoft');
  }

  /**
   * Initialize performance optimizations
   */
  init() {
    this.applyOptimizations();
    this.setupEventListeners();
    this.monitorPerformance();
  }

  /**
   * Apply optimizations based on device capabilities
   */
  applyOptimizations() {
    const body = document.body;
    
    // Add performance classes to body
    if (this.isLowEndDevice) {
      body.classList.add('low-end-device');
    }
    
    if (this.preferReducedMotion) {
      body.classList.add('reduced-motion');
    }
    
    if (this.deviceCapabilities.connection === 'slow') {
      body.classList.add('slow-connection');
    }
    
    if (!this.deviceCapabilities.gpu) {
      body.classList.add('no-gpu-acceleration');
    }

    // Apply specific optimizations
    if (this.isLowEndDevice || this.preferReducedMotion) {
      this.disableComplexAnimations();
    }
    
    if (this.deviceCapabilities.memory < 1) {
      this.enableMemoryOptimizations();
    }

    if (this.deviceCapabilities.connection === 'slow') {
      this.enableNetworkOptimizations();
    }
  }

  /**
   * Disable complex animations for low-end devices
   */
  disableComplexAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      .low-end-device .pulse,
      .low-end-device .stat-icon,
      .low-end-device .fade-in {
        animation: none !important;
      }
      
      .low-end-device .dashboard-card:hover,
      .low-end-device .product-stat-card:hover {
        transform: none !important;
      }
      
      .low-end-device .custom-select-options,
      .low-end-device .product-modal-overlay {
        backdrop-filter: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enable memory optimizations
   */
  enableMemoryOptimizations() {
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-card,
      .product-stat-card {
        contain: layout style !important;
        will-change: auto !important;
      }
      
      .sidebar::before {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enable network optimizations
   */
  enableNetworkOptimizations() {
    const style = document.createElement('style');
    style.textContent = `
      .slow-connection .dashboard-card,
      .slow-connection .product-modal {
        backdrop-filter: none !important;
      }
      
      .slow-connection .fade-in {
        animation: none !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Adapt to battery level changes
   */
  adaptToBatteryLevel(level, charging) {
    if (level < 0.2 && !charging) {
      // Battery is low, enable power saving mode
      document.body.classList.add('power-saving');
      
      const style = document.createElement('style');
      style.textContent = `
        .power-saving * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
        
        .power-saving .pulse,
        .power-saving .stat-icon {
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('power-saving');
    }
  }

  /**
   * Setup event listeners for dynamic optimization
   */
  setupEventListeners() {
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    });

    // Listen for reduced motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addListener((e) => {
      if (e.matches) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    });

    // Listen for connection changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        const newSpeed = this.getConnectionSpeed();
        document.body.classList.toggle('slow-connection', newSpeed === 'slow');
      });
    }
  }

  /**
   * Pause animations when page is not visible
   */
  pauseAnimations() {
    document.querySelectorAll('.pulse, .stat-icon, [class*="animate"]').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
  }

  /**
   * Resume animations when page becomes visible
   */
  resumeAnimations() {
    if (!this.isLowEndDevice && !this.preferReducedMotion) {
      document.querySelectorAll('.pulse, .stat-icon, [class*="animate"]').forEach(el => {
        el.style.animationPlayState = 'running';
      });
    }
  }

  /**
   * Monitor performance and adjust accordingly
   */
  monitorPerformance() {
    if ('PerformanceObserver' in window) {
      // Monitor frame drops
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.duration > 16.67) {
            // Frame took longer than 16.67ms (60fps), consider reducing animations
            console.warn('Performance: Frame drop detected', entry);
            this.reducePerfomanceOnFrameDrop();
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
    }

    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = performance.memory;
        const usedPercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 80) {
          console.warn('Performance: High memory usage detected');
          this.enableMemoryOptimizations();
        }
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Reduce performance when frame drops are detected
   */
  reducePerfomanceOnFrameDrop() {
    document.body.classList.add('performance-reduced');
    
    const style = document.createElement('style');
    style.textContent = `
      .performance-reduced .dashboard-card:hover,
      .performance-reduced .product-stat-card:hover {
        transform: none !important;
      }
      
      .performance-reduced .pulse,
      .performance-reduced .stat-icon {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get current device performance score
   */
  getPerformanceScore() {
    let score = 100;
    
    if (this.deviceCapabilities.memory < 2) score -= 30;
    if (this.deviceCapabilities.cores < 4) score -= 20;
    if (this.deviceCapabilities.connection === 'slow') score -= 25;
    if (!this.deviceCapabilities.gpu) score -= 15;
    if (this.preferReducedMotion) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * Apply optimizations based on performance score
   */
  applyScoreBasedOptimizations() {
    const score = this.getPerformanceScore();
    
    if (score < 30) {
      // Very low performance
      this.disableComplexAnimations();
      this.enableMemoryOptimizations();
      this.enableNetworkOptimizations();
    } else if (score < 60) {
      // Medium performance
      this.disableComplexAnimations();
    }
    // High performance (score >= 60) - keep all animations
  }
}

// Initialize performance optimizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.performanceOptimizer = new PerformanceOptimizer();
  //console.log('Performance Optimizer initialized with score:', window.performanceOptimizer.getPerformanceScore());
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
}
