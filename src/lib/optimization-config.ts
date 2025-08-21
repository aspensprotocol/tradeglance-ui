// Performance optimization configuration
// Adjust these values based on your performance requirements

export const PERFORMANCE_CONFIG = {
  // React Query optimizations
  reactQuery: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  // Orderbook optimizations
  orderbook: {
    maxRetries: 3,
    requestTimeout: 10000, // 10 seconds
    minFetchInterval: 1000, // 1 second
    maxEntriesToRender: 100, // Limit rendered entries for performance
    virtualScrollThreshold: 50, // Enable virtualization after this many items
  },

  // Data processing optimizations
  dataProcessing: {
    batchSize: 10,
    debounceDelay: 300, // ms
    throttleDelay: 100, // ms
    memoizationEnabled: true,
  },

  // UI optimizations
  ui: {
    enableVirtualization: true,
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enablePerformanceMonitoring: import.meta.env.DEV,
    enableReactDevTools: import.meta.env.DEV,
  },

  // Network optimizations
  network: {
    enableRequestCaching: true,
    enableResponseCompression: true,
    maxConcurrentRequests: 5,
    requestTimeout: 15000, // 15 seconds
  },

  // Bundle optimizations
  bundle: {
    enableTreeShaking: true,
    enableMinification: true,
    enableSourceMaps: !import.meta.env.PROD,
    enableCodeSplitting: true,
    chunkSizeWarningLimit: 1000,
  },
} as const;

// Performance thresholds for monitoring
export const PERFORMANCE_THRESHOLDS = {
  // Render performance
  maxRenderTime: 16, // 16ms (60fps target)
  maxComponentRenderTime: 8, // 8ms per component
  
  // Data processing
  maxDataProcessingTime: 50, // 50ms
  maxOrderbookProcessingTime: 100, // 100ms
  
  // Network
  maxNetworkRequestTime: 2000, // 2 seconds
  maxNetworkResponseTime: 5000, // 5 seconds
  
  // Memory
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  maxHeapSize: 50 * 1024 * 1024, // 50MB
} as const;

// Performance monitoring configuration
export const MONITORING_CONFIG = {
  enabled: import.meta.env.DEV,
  logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
  metrics: {
    renderTime: true,
    dataProcessingTime: true,
    networkTime: true,
    memoryUsage: true,
    componentRenders: true,
  },
  alerts: {
    performanceDegradation: true,
    memoryLeaks: true,
    slowRenders: true,
  },
} as const;

export default PERFORMANCE_CONFIG;
