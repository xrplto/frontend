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

        if (growthMB > 20) { // Alert for >20MB growth (much reduced sensitivity)
          console.warn(`Memory spike detected: +${growthMB.toFixed(2)}MB`, sample);
        }
      }
    }

    // Check again in 5 seconds (much reduced frequency)
    this.timeoutId = setTimeout(() => this.monitor(), 5000);
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

// Global instances - only create in browser environment
let memoryMonitor, performanceTracker, tokenListPerformance;

if (typeof window !== 'undefined') {
  memoryMonitor = new MemoryMonitor();
  performanceTracker = new PerformanceTracker();
  tokenListPerformance = new TokenListPerformance();

  // Don't start monitoring immediately - only on demand
  // memoryMonitor.start();

  // Add global performance debug functions
  window.getPerformanceReport = () => {
    console.group('Performance Report');
    console.log('Memory:', memoryMonitor.getReport());
    console.log('General:', performanceTracker.getReport());
    console.log('TokenList:', tokenListPerformance.getReport());
    console.groupEnd();
  };

  window.clearPerformanceData = () => {
    memoryMonitor.samples = [];
    performanceTracker.metrics = { vitals: {}, renders: [], interactions: [] };
    tokenListPerformance.renderCount = 0;
    tokenListPerformance.wsMessageCount = 0;
    tokenListPerformance.rowRenderTimes = [];
    console.log('Performance data cleared');
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
}

export { memoryMonitor, performanceTracker, tokenListPerformance };

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
      onRender={performanceTracker.trackRender.bind(performanceTracker)}
    >
      {children}
    </React.Profiler>
  );
};