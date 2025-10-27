/**
 * Performance Configuration
 *
 * This file contains performance thresholds and configuration
 * used across the application for monitoring and testing.
 */

module.exports = {
  // Performance Thresholds
  thresholds: {
    // Target frames per second for smooth UI
    targetFPS: 60,

    // Minimum acceptable FPS before warning
    minFPS: 55,

    // Maximum render time per frame in milliseconds (1000/60 ≈ 16.67ms)
    maxRenderTimeMs: 16.67,

    // Maximum API response time in milliseconds
    maxAPIResponseTimeMs: 3000,

    // Maximum memory usage in megabytes
    maxMemoryMB: 512,

    // Maximum bundle size in megabytes
    maxBundleSizeMB: 5,

    // Maximum initial load time in milliseconds
    maxInitialLoadMs: 2000,
  },

  // Cache Configuration
  cache: {
    // Default TTL for cached items in milliseconds
    defaultTTL: 5 * 60 * 1000, // 5 minutes

    // TTL for specific cache types
    ttl: {
      problemAnalysis: 30 * 60 * 1000, // 30 minutes
      quiz: 60 * 60 * 1000, // 1 hour
      userProfile: 24 * 60 * 60 * 1000, // 24 hours
    },

    // Enable memory cache
    useMemoryCache: true,

    // Maximum items in memory cache
    maxMemoryCacheSize: 100,
  },

  // List Performance Configuration
  list: {
    // FlatList optimization settings
    flatList: {
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 50,
      initialNumToRender: 20,
      windowSize: 21,
    },

    // Virtualization thresholds
    virtualizationThreshold: 50, // Items before virtualization is required
  },

  // PDF Processing Configuration
  pdf: {
    // Number of pages to load per chunk
    chunkSize: 5,

    // Enable lazy loading for large documents
    lazyLoad: true,

    // Maximum concurrent page processing
    maxConcurrentPages: 3,

    // Large document threshold (pages)
    largeDocumentThreshold: 50,
  },

  // Network Configuration
  network: {
    // API timeout in milliseconds
    timeout: 30000,

    // Enable request caching
    enableCaching: true,

    // Retry configuration
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  },

  // Monitoring Configuration
  monitoring: {
    // Enable performance monitoring
    enabled: true,

    // Enable in production
    enableInProduction: false,

    // Sampling rate (0-1)
    samplingRate: 1.0,

    // Maximum metrics to store
    maxMetricsSize: 1000,

    // Enable memory tracking
    trackMemory: true,

    // Memory tracking interval in milliseconds
    memoryTrackingInterval: 5000,
  },

  // Optimization Flags
  optimization: {
    // Enable lazy loading for screens
    lazyLoadScreens: true,

    // Enable component memoization
    memoization: true,

    // Enable image optimization
    optimizeImages: true,

    // Enable code splitting
    codeSplitting: true,
  },

  // Development Settings
  development: {
    // Show performance overlay
    showPerformanceOverlay: true,

    // Log performance metrics
    logMetrics: true,

    // Enable frame rate monitor
    frameRateMonitor: true,

    // Enable memory warnings
    memoryWarnings: true,
  },

  // Test Configuration
  test: {
    // Number of iterations for performance tests
    iterations: 100,

    // Test scenarios
    scenarios: {
      smallList: 10,
      mediumList: 50,
      largeList: 100,
      extraLargeList: 500,
    },

    // Warm-up iterations before measuring
    warmupIterations: 10,
  },
};
