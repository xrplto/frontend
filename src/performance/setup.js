// Performance monitoring setup for TokenList components
import React from 'react';

// Why Did You Render setup - disabled due to React 19 compatibility issues
// if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
//   import('@welldone-software/why-did-you-render').then((whyDidYouRender) => {
//     whyDidYouRender.default(React, {
//       trackAllPureComponents: false,
//       trackHooks: true,
//       logOnDifferentValues: true,
//       logOwnerReasons: true,
//       include: [/TokenRow/, /TokenList/, /VirtualizedTokenList/],
//       exclude: [/^Connect/, /^Router/]
//     });
//   });
// }

// Memory usage tracking
class MemoryMonitor {
  constructor() {
    this.samples = [];
    this.isMonitoring = false;
    this.timeoutId = null;
  }

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.monitor();
  }

  stop() {
    this.isMonitoring = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  monitor() {
    if (!this.isMonitoring) return;

    if ('memory' in performance) {
      const memory = performance.memory;
      const sample = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };

      this.samples.push(sample);

      // Keep only last 20 samples to reduce memory usage
      if (this.samples.length > 20) {
        this.samples.shift();
      }

      // Log memory spikes
      if (this.samples.length > 1) {
        const prev = this.samples[this.samples.length - 2];
        const growth = sample.usedJSHeapSize - prev.usedJSHeapSize;
        const growthMB = growth / (1024 * 1024);

        if (growthMB > 50) { // Alert for >50MB growth (only major spikes)
          console.warn(`Memory spike detected: +${growthMB.toFixed(2)}MB`, sample);
        }
      }
    }

    // Check again in 10 seconds (reduced frequency to minimize overhead)
    this.timeoutId = setTimeout(() => this.monitor(), 10000);
  }

  getReport() {
    if (this.samples.length === 0) return null;

    const latest = this.samples[this.samples.length - 1];
    const oldest = this.samples[0];
    const growth = latest.usedJSHeapSize - oldest.usedJSHeapSize;

    return {
      currentUsage: (latest.usedJSHeapSize / (1024 * 1024)).toFixed(2) + 'MB',
      totalGrowth: (growth / (1024 * 1024)).toFixed(2) + 'MB',
      samples: this.samples.length,
      timespan: latest.timestamp - oldest.timestamp
    };
  }
}

// Performance metrics collection
class PerformanceTracker {
  constructor() {
    this.metrics = {
      vitals: {},
      renders: [],
      interactions: []
    };

    this.setupVitals();
    this.setupRenderTracking();
  }

  setupVitals() {
    // Core Web Vitals - simplified without import issues
    if (typeof window !== 'undefined') {
      // Basic performance metrics using native APIs
      if ('performance' in window && 'PerformanceObserver' in window) {
        try {
          // Track LCP
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('Performance observer not supported');
        }
      }
    }
  }

  setupRenderTracking() {
    // Track React renders - only in browser environment
    if (typeof window !== 'undefined' && window.React && window.React.Profiler) {
      this.originalRender = window.React.render;
    }
  }

  trackRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
    const renderData = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      timestamp: Date.now()
    };

    this.metrics.renders.push(renderData);

    // Keep only last 25 renders to reduce memory
    if (this.metrics.renders.length > 25) {
      this.metrics.renders.shift();
    }

    // Alert on very slow renders only
    if (actualDuration > 50) { // >50ms is significantly janky
      console.warn(`Slow render detected in ${id}: ${actualDuration.toFixed(2)}ms`, renderData);
    }
  }

  trackInteraction(name, duration) {
    const interaction = {
      name,
      duration,
      timestamp: Date.now()
    };

    this.metrics.interactions.push(interaction);

    // Keep only last 20 interactions
    if (this.metrics.interactions.length > 20) {
      this.metrics.interactions.shift();
    }

    // Alert on slow interactions
    if (duration > 100) { // >100ms feels slow
      console.warn(`Slow interaction: ${name} took ${duration}ms`);
    }
  }

  getReport() {
    return {
      vitals: this.metrics.vitals,
      avgRenderTime: this.metrics.renders.length > 0
        ? (this.metrics.renders.reduce((sum, r) => sum + r.actualDuration, 0) / this.metrics.renders.length).toFixed(2) + 'ms'
        : 'N/A',
      slowRenders: this.metrics.renders.filter(r => r.actualDuration > 16).length,
      totalRenders: this.metrics.renders.length,
      slowInteractions: this.metrics.interactions.filter(i => i.duration > 100).length,
      totalInteractions: this.metrics.interactions.length
    };
  }
}

// TokenList specific performance tracking
class TokenListPerformance {
  constructor() {
    this.renderCount = 0;
    this.wsMessageCount = 0;
    this.lastWSMessage = 0;
    this.rowRenderTimes = [];
  }

  onTokenListRender() {
    this.renderCount++;
    const now = performance.now();

    // Track render frequency
    if (this.lastRender) {
      const timeSinceLastRender = now - this.lastRender;
      if (timeSinceLastRender < 16) { // <16ms = >60fps
        console.warn(`TokenList rendering too frequently: ${timeSinceLastRender.toFixed(2)}ms since last render`);
      }
    }

    this.lastRender = now;
  }

  onWSMessage() {
    this.wsMessageCount++;
    this.lastWSMessage = Date.now();
  }

  onRowRender(duration) {
    this.rowRenderTimes.push(duration);

    // Keep only last 50 row renders
    if (this.rowRenderTimes.length > 50) {
      this.rowRenderTimes.shift();
    }
  }

  getReport() {
    const avgRowRender = this.rowRenderTimes.length > 0
      ? (this.rowRenderTimes.reduce((sum, t) => sum + t, 0) / this.rowRenderTimes.length).toFixed(2) + 'ms'
      : 'N/A';

    return {
      totalRenders: this.renderCount,
      wsMessages: this.wsMessageCount,
      lastWSMessage: this.lastWSMessage ? new Date(this.lastWSMessage).toLocaleTimeString() : 'N/A',
      avgRowRenderTime: avgRowRender,
      slowRows: this.rowRenderTimes.filter(t => t > 5).length // >5ms per row is slow
    };
  }
}

// TokenDetail specific performance tracking
class TokenDetailPerformance {
  constructor() {
    this.componentMetrics = {};
    this.chartRenders = [];
    this.wsUpdates = [];
    this.apiCalls = [];
    this.tabSwitches = [];
    this.heavyOperations = [];
  }

  // Track component-specific renders
  trackComponentRender(componentName, duration) {
    if (!this.componentMetrics[componentName]) {
      this.componentMetrics[componentName] = {
        renders: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        slowRenders: 0
      };
    }

    const metric = this.componentMetrics[componentName];
    metric.renders++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.renders;
    metric.maxTime = Math.max(metric.maxTime, duration);

    if (duration > 16) { // Slow render threshold
      metric.slowRenders++;
      console.warn(`TokenDetail: Slow render in ${componentName}: ${duration.toFixed(2)}ms`);
    }
  }

  // Track chart rendering performance
  trackChartRender(chartType, dataPoints, duration) {
    const chartData = {
      type: chartType,
      dataPoints,
      duration,
      timestamp: Date.now()
    };

    this.chartRenders.push(chartData);

    // Keep last 30 chart renders
    if (this.chartRenders.length > 30) {
      this.chartRenders.shift();
    }

    // Alert for slow chart renders
    if (duration > 100) {
      console.warn(`TokenDetail: Slow chart render (${chartType}): ${duration.toFixed(2)}ms with ${dataPoints} points`);
    }
  }

  // Track WebSocket updates
  trackWSUpdate(updateType, processingTime) {
    const update = {
      type: updateType,
      processingTime,
      timestamp: Date.now()
    };

    this.wsUpdates.push(update);

    // Keep last 50 updates
    if (this.wsUpdates.length > 50) {
      this.wsUpdates.shift();
    }

    // Alert for slow updates
    if (processingTime > 10) {
      console.warn(`TokenDetail: Slow WS update (${updateType}): ${processingTime.toFixed(2)}ms`);
    }
  }

  // Track API call performance
  trackAPICall(endpoint, duration, dataSize) {
    const apiCall = {
      endpoint,
      duration,
      dataSize,
      timestamp: Date.now()
    };

    this.apiCalls.push(apiCall);

    // Keep last 30 API calls
    if (this.apiCalls.length > 30) {
      this.apiCalls.shift();
    }

    // Alert for slow API calls
    if (duration > 1000) {
      console.warn(`TokenDetail: Slow API call to ${endpoint}: ${duration.toFixed(2)}ms`);
    }
  }

  // Track tab switching performance
  trackTabSwitch(fromTab, toTab, duration) {
    const tabSwitch = {
      from: fromTab,
      to: toTab,
      duration,
      timestamp: Date.now()
    };

    this.tabSwitches.push(tabSwitch);

    // Keep last 20 tab switches
    if (this.tabSwitches.length > 20) {
      this.tabSwitches.shift();
    }

    // Alert for slow tab switches
    if (duration > 50) {
      console.warn(`TokenDetail: Slow tab switch from ${fromTab} to ${toTab}: ${duration.toFixed(2)}ms`);
    }
  }

  // Track heavy operations like data processing
  trackHeavyOperation(operation, itemsProcessed, duration) {
    const op = {
      operation,
      itemsProcessed,
      duration,
      throughput: itemsProcessed / (duration / 1000), // items per second
      timestamp: Date.now()
    };

    this.heavyOperations.push(op);

    // Keep last 20 operations
    if (this.heavyOperations.length > 20) {
      this.heavyOperations.shift();
    }

    // Alert for slow operations
    if (duration > 100) {
      console.warn(`TokenDetail: Heavy operation ${operation} took ${duration.toFixed(2)}ms for ${itemsProcessed} items`);
    }
  }

  // Get comprehensive report
  getReport() {
    // Calculate component metrics summary
    const componentSummary = Object.entries(this.componentMetrics).map(([name, metrics]) => ({
      component: name,
      renders: metrics.renders,
      avgTime: metrics.avgTime.toFixed(2) + 'ms',
      maxTime: metrics.maxTime.toFixed(2) + 'ms',
      slowRenders: metrics.slowRenders
    }));

    // Calculate chart metrics
    const chartMetrics = this.chartRenders.length > 0 ? {
      totalRenders: this.chartRenders.length,
      avgDuration: (this.chartRenders.reduce((sum, c) => sum + c.duration, 0) / this.chartRenders.length).toFixed(2) + 'ms',
      avgDataPoints: Math.round(this.chartRenders.reduce((sum, c) => sum + c.dataPoints, 0) / this.chartRenders.length),
      slowRenders: this.chartRenders.filter(c => c.duration > 100).length
    } : null;

    // Calculate WS metrics
    const wsMetrics = this.wsUpdates.length > 0 ? {
      totalUpdates: this.wsUpdates.length,
      avgProcessingTime: (this.wsUpdates.reduce((sum, u) => sum + u.processingTime, 0) / this.wsUpdates.length).toFixed(2) + 'ms',
      slowUpdates: this.wsUpdates.filter(u => u.processingTime > 10).length
    } : null;

    // Calculate API metrics
    const apiMetrics = this.apiCalls.length > 0 ? {
      totalCalls: this.apiCalls.length,
      avgDuration: (this.apiCalls.reduce((sum, a) => sum + a.duration, 0) / this.apiCalls.length).toFixed(2) + 'ms',
      slowCalls: this.apiCalls.filter(a => a.duration > 1000).length
    } : null;

    // Calculate tab switch metrics
    const tabMetrics = this.tabSwitches.length > 0 ? {
      totalSwitches: this.tabSwitches.length,
      avgDuration: (this.tabSwitches.reduce((sum, t) => sum + t.duration, 0) / this.tabSwitches.length).toFixed(2) + 'ms',
      slowSwitches: this.tabSwitches.filter(t => t.duration > 50).length
    } : null;

    return {
      components: componentSummary,
      charts: chartMetrics,
      websocket: wsMetrics,
      api: apiMetrics,
      tabs: tabMetrics,
      heavyOps: this.heavyOperations.slice(-5) // Last 5 heavy operations
    };
  }

  // Clear all metrics
  clear() {
    this.componentMetrics = {};
    this.chartRenders = [];
    this.wsUpdates = [];
    this.apiCalls = [];
    this.tabSwitches = [];
    this.heavyOperations = [];
  }
}

// Global instances - only create in browser environment
let memoryMonitor, performanceTracker, tokenListPerformance, tokenDetailPerformance;

if (typeof window !== 'undefined') {
  memoryMonitor = new MemoryMonitor();
  performanceTracker = new PerformanceTracker();
  tokenListPerformance = new TokenListPerformance();
  tokenDetailPerformance = new TokenDetailPerformance();

  // Don't start monitoring immediately - only on demand
  // memoryMonitor.start();

  // Add global performance debug functions
  window.getPerformanceReport = () => {
    console.group('Performance Report');
    console.log('Memory:', memoryMonitor.getReport());
    console.log('General:', performanceTracker.getReport());
    console.log('TokenList:', tokenListPerformance.getReport());
    console.log('TokenDetail:', tokenDetailPerformance.getReport());
    console.groupEnd();
  };

  window.clearPerformanceData = () => {
    memoryMonitor.samples = [];
    performanceTracker.metrics = { vitals: {}, renders: [], interactions: [] };
    tokenListPerformance.renderCount = 0;
    tokenListPerformance.wsMessageCount = 0;
    tokenListPerformance.rowRenderTimes = [];
    tokenDetailPerformance.clear();
    console.log('Performance data cleared');
  };

  // Add TokenDetail specific debug function
  window.getTokenDetailMetrics = () => {
    const report = tokenDetailPerformance.getReport();
    console.group('TokenDetail Performance Metrics');

    if (report.components.length > 0) {
      console.table(report.components);
    }

    if (report.charts) {
      console.log('Chart Metrics:', report.charts);
    }

    if (report.websocket) {
      console.log('WebSocket Metrics:', report.websocket);
    }

    if (report.api) {
      console.log('API Metrics:', report.api);
    }

    if (report.tabs) {
      console.log('Tab Switch Metrics:', report.tabs);
    }

    if (report.heavyOps.length > 0) {
      console.log('Recent Heavy Operations:');
      console.table(report.heavyOps);
    }

    console.groupEnd();
  };
} else {
  // Server-side fallbacks
  memoryMonitor = {
    start: () => {},
    stop: () => {},
    getReport: () => null
  };
  performanceTracker = {
    trackRender: () => {},
    trackInteraction: () => {},
    getReport: () => null
  };
  tokenListPerformance = {
    onTokenListRender: () => {},
    onWSMessage: () => {},
    onRowRender: () => {},
    getReport: () => null
  };
  tokenDetailPerformance = {
    trackComponentRender: () => {},
    trackChartRender: () => {},
    trackWSUpdate: () => {},
    trackAPICall: () => {},
    trackTabSwitch: () => {},
    trackHeavyOperation: () => {},
    getReport: () => null,
    clear: () => {}
  };
}

export { memoryMonitor, performanceTracker, tokenListPerformance, tokenDetailPerformance };

// React Profiler component for wrapping TokenList
export const TokenListProfiler = ({ children }) => {
  // Disable profiler in production and when not debugging
  if (typeof window === 'undefined' || !React.Profiler || !performanceTracker || process.env.NODE_ENV === 'production') {
    return children;
  }

  // Only profile if explicitly enabled via localStorage
  const profilingEnabled = typeof window !== 'undefined' && window.localStorage?.getItem('enableProfiling') === 'true';

  if (!profilingEnabled) {
    return children;
  }

  return (
    <React.Profiler
      id="TokenList"
      onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) =>
        performanceTracker.trackRender(id, phase, actualDuration, baseDuration, startTime, commitTime)
      }
    >
      {children}
    </React.Profiler>
  );
};

// React Profiler component for wrapping TokenDetail components
export const TokenDetailProfiler = ({ children, componentName }) => {
  // Disable profiler in production and when not debugging
  if (typeof window === 'undefined' || !React.Profiler || !tokenDetailPerformance || process.env.NODE_ENV === 'production') {
    return children;
  }

  // Only profile if explicitly enabled via localStorage
  const profilingEnabled = typeof window !== 'undefined' && window.localStorage?.getItem('enableTokenDetailProfiling') === 'true';

  if (!profilingEnabled) {
    return children;
  }

  const handleRender = (id, phase, actualDuration) => {
    tokenDetailPerformance.trackComponentRender(componentName || id, actualDuration);
  };

  return (
    <React.Profiler
      id={componentName || "TokenDetailComponent"}
      onRender={handleRender}
    >
      {children}
    </React.Profiler>
  );
};

// Hook for tracking TokenDetail performance
export const useTokenDetailPerformance = () => {
  const startTime = React.useRef(0);

  const startOperation = () => {
    startTime.current = performance.now();
  };

  const endOperation = (operationType, details = {}) => {
    if (startTime.current === 0) return;

    const duration = performance.now() - startTime.current;
    startTime.current = 0;

    if (!tokenDetailPerformance) return;

    switch (operationType) {
      case 'chart':
        tokenDetailPerformance.trackChartRender(details.chartType, details.dataPoints || 0, duration);
        break;
      case 'ws':
        tokenDetailPerformance.trackWSUpdate(details.updateType, duration);
        break;
      case 'api':
        tokenDetailPerformance.trackAPICall(details.endpoint, duration, details.dataSize || 0);
        break;
      case 'tab':
        tokenDetailPerformance.trackTabSwitch(details.from, details.to, duration);
        break;
      case 'heavy':
        tokenDetailPerformance.trackHeavyOperation(details.operation, details.items || 0, duration);
        break;
      default:
        tokenDetailPerformance.trackComponentRender(operationType, duration);
    }
  };

  return { startOperation, endOperation };
};