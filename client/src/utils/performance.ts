// Performance optimization utilities
export const preloadCriticalResources = () => {
  // Preload critical fonts and assets
  const criticalResources = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  ];

  criticalResources.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Optimize wallet initialization
export const optimizeWalletPerformance = () => {
  // Reduce connection timeouts and improve error handling
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await originalFetch(args[0], {
        ...args[1],
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
};

// Debounce function for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  preloadCriticalResources();
  optimizeWalletPerformance();
  
  // Add performance observer for monitoring
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('🚀 Page load time:', entry.duration.toFixed(2) + 'ms');
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });
  }
};
