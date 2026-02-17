/**
 * Performance Monitor - lightweight runtime profiler for Next.js
 *
 * Usage (from browser console):
 *   window.__PERF__.start()    - Start monitoring (shows overlay)
 *   window.__PERF__.stop()     - Stop monitoring (hides overlay)
 *   window.__PERF__.report()   - Print full report to console
 *   window.__PERF__.renders()  - Show component render log
 *   window.__PERF__.clear()    - Clear collected data
 *   window.__PERF__.slow(ms)   - Set slow render threshold (default: 16ms)
 *
 * Also tracks:
 *   window.__WEB_VITALS__  - Core Web Vitals from reportWebVitals
 */

const SLOW_RENDER_MS = 16; // 1 frame at 60fps

let state = {
  active: false,
  slowThreshold: SLOW_RENDER_MS,
  renderLog: [],
  longTasks: [],
  resourceTimings: [],
  overlay: null,
  rafId: null,
  observer: null,
  frames: [],
  lastFrameTime: 0
};

// ---- FPS Counter ----
function measureFPS() {
  const now = performance.now();
  if (state.lastFrameTime) {
    state.frames.push(now - state.lastFrameTime);
    if (state.frames.length > 120) state.frames.shift();
  }
  state.lastFrameTime = now;
  if (state.active) {
    state.rafId = requestAnimationFrame(measureFPS);
  }
}

function getFPS() {
  if (state.frames.length === 0) return 0;
  const avg = state.frames.reduce((a, b) => a + b, 0) / state.frames.length;
  return Math.round(1000 / avg);
}

// ---- Long Task Observer ----
function startLongTaskObserver() {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    state.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.longTasks.push({
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime),
          name: entry.name,
          timestamp: Date.now()
        });
        if (state.longTasks.length > 100) state.longTasks.shift();
      }
    });
    state.observer.observe({ type: 'longtask', buffered: true });
  } catch (e) {
    // longtask not supported in all browsers
  }
}

// ---- Overlay ----
function createOverlay() {
  if (state.overlay) return;
  const el = document.createElement('div');
  el.id = '__perf-overlay__';
  el.style.cssText = `
    position: fixed; bottom: 8px; right: 8px; z-index: 99999;
    background: rgba(0,0,0,0.85); color: #fff; font-family: monospace;
    font-size: 11px; padding: 8px 12px; border-radius: 8px;
    pointer-events: none; line-height: 1.6; min-width: 180px;
    backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.1);
  `;
  document.body.appendChild(el);
  state.overlay = el;
}

function updateOverlay() {
  if (!state.active) return;
  // Re-attach overlay if it was removed by page navigation
  if (!state.overlay || !document.getElementById('__perf-overlay__')) {
    state.overlay = null;
    createOverlay();
  }

  const fps = getFPS();
  const fpsColor = fps >= 55 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444';

  const mem = performance.memory
    ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB / ${Math.round(performance.memory.jsHeapSizeLimit / 1048576)}MB`
    : 'N/A';

  const recentLong = state.longTasks.filter(t => Date.now() - t.timestamp < 5000);
  const slowRenders = state.renderLog.filter(r => r.duration > state.slowThreshold).length;

  const vitals = typeof window !== 'undefined' && window.__WEB_VITALS__
    ? Object.entries(window.__WEB_VITALS__)
        .map(([k, v]) => {
          const c = v.rating === 'good' ? '#22c55e' : v.rating === 'needs-improvement' ? '#f59e0b' : '#ef4444';
          const val = k === 'CLS' ? v.value.toFixed(3) : Math.round(v.value);
          return `<span style="color:${c}">${k}: ${val}</span>`;
        })
        .join(' &middot; ')
    : '';

  state.overlay.innerHTML = `
    <div style="color:${fpsColor};font-weight:bold;font-size:13px">${fps} FPS</div>
    <div style="color:#94a3b8">Heap: ${mem}</div>
    <div style="color:#94a3b8">Long tasks (5s): <span style="color:${recentLong.length > 0 ? '#ef4444' : '#22c55e'}">${recentLong.length}</span></div>
    <div style="color:#94a3b8">Slow renders: <span style="color:${slowRenders > 0 ? '#f59e0b' : '#22c55e'}">${slowRenders}</span></div>
    ${vitals ? `<div style="margin-top:4px;font-size:10px">${vitals}</div>` : ''}
  `;

  if (state.active) {
    setTimeout(updateOverlay, 500);
  }
}

function removeOverlay() {
  if (state.overlay) {
    state.overlay.remove();
    state.overlay = null;
  }
}

// ---- React Render Profiler ----
// Wrap components with this to track render times
function onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  const entry = {
    component: id,
    phase,
    duration: Math.round(actualDuration * 100) / 100,
    baseDuration: Math.round(baseDuration * 100) / 100,
    startTime: Math.round(startTime),
    commitTime: Math.round(commitTime),
    timestamp: Date.now()
  };
  state.renderLog.push(entry);
  if (state.renderLog.length > 500) state.renderLog.shift();

  if (actualDuration > state.slowThreshold) {
    console.warn(
      `%c[Slow Render] %c${id}%c ${actualDuration.toFixed(1)}ms (${phase})`,
      'color: #f59e0b',
      'color: #ef4444; font-weight: bold',
      'color: #f59e0b'
    );
  }
}

// ---- Public API ----
const perfMonitor = {
  start() {
    state.active = true;
    state.lastFrameTime = 0;
    state.frames = [];
    createOverlay();
    measureFPS();
    startLongTaskObserver();
    updateOverlay();
    console.log('%c[PerfMonitor] Started — overlay visible at bottom-right', 'color: #22c55e; font-weight: bold');
    console.log('%c  Commands: __PERF__.report() | __PERF__.renders() | __PERF__.stop() | __PERF__.slow(ms)', 'color: #6b7280');
  },

  stop() {
    state.active = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    if (state.observer) state.observer.disconnect();
    removeOverlay();
    console.log('%c[PerfMonitor] Stopped', 'color: #ef4444; font-weight: bold');
  },

  report() {
    console.group('%c Performance Report', 'color: #3b82f6; font-weight: bold; font-size: 14px');

    // Web Vitals
    if (window.__WEB_VITALS__) {
      console.group('Core Web Vitals');
      console.table(
        Object.fromEntries(
          Object.entries(window.__WEB_VITALS__).map(([k, v]) => [
            k,
            { value: k === 'CLS' ? v.value.toFixed(3) : Math.round(v.value) + 'ms', rating: v.rating }
          ])
        )
      );
      console.groupEnd();
    }

    // FPS
    console.log(`FPS: ${getFPS()} (${state.frames.length} samples)`);

    // Memory
    if (performance.memory) {
      console.group('Memory');
      console.log(`Used: ${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB`);
      console.log(`Total: ${Math.round(performance.memory.totalJSHeapSize / 1048576)}MB`);
      console.log(`Limit: ${Math.round(performance.memory.jsHeapSizeLimit / 1048576)}MB`);
      console.groupEnd();
    }

    // Long tasks
    if (state.longTasks.length > 0) {
      console.group(`Long Tasks (${state.longTasks.length})`);
      console.table(state.longTasks.slice(-20));
      console.groupEnd();
    }

    // Slow renders
    const slow = state.renderLog.filter(r => r.duration > state.slowThreshold);
    if (slow.length > 0) {
      console.group(`Slow Renders (>${state.slowThreshold}ms): ${slow.length}`);
      console.table(slow.slice(-20));
      console.groupEnd();
    }

    // Resource loading
    const resources = performance.getEntriesByType('resource');
    const slowResources = resources
      .filter(r => r.duration > 500)
      .map(r => ({ name: r.name.split('/').pop(), duration: Math.round(r.duration) + 'ms', size: r.transferSize ? Math.round(r.transferSize / 1024) + 'KB' : 'N/A', type: r.initiatorType }))
      .sort((a, b) => parseInt(b.duration) - parseInt(a.duration));

    if (slowResources.length > 0) {
      console.group(`Slow Resources (>500ms): ${slowResources.length}`);
      console.table(slowResources.slice(0, 20));
      console.groupEnd();
    }

    console.groupEnd();
  },

  renders() {
    if (state.renderLog.length === 0) {
      console.log('%c[PerfMonitor] No renders tracked. Wrap components with <React.Profiler id="Name" onRender={window.__PERF__.onRender}>', 'color: #f59e0b');
      return;
    }

    // Group by component
    const byComponent = {};
    state.renderLog.forEach(r => {
      if (!byComponent[r.component]) byComponent[r.component] = { count: 0, totalMs: 0, maxMs: 0 };
      byComponent[r.component].count++;
      byComponent[r.component].totalMs += r.duration;
      byComponent[r.component].maxMs = Math.max(byComponent[r.component].maxMs, r.duration);
    });

    const table = Object.entries(byComponent)
      .map(([name, data]) => ({
        component: name,
        renders: data.count,
        totalMs: Math.round(data.totalMs * 10) / 10,
        avgMs: Math.round((data.totalMs / data.count) * 10) / 10,
        maxMs: Math.round(data.maxMs * 10) / 10
      }))
      .sort((a, b) => b.totalMs - a.totalMs);

    console.group('%c Component Render Summary', 'color: #3b82f6; font-weight: bold');
    console.table(table);
    console.groupEnd();
  },

  slow(ms) {
    state.slowThreshold = ms;
    console.log(`%c[PerfMonitor] Slow render threshold set to ${ms}ms`, 'color: #3b82f6');
  },

  clear() {
    state.renderLog = [];
    state.longTasks = [];
    state.frames = [];
    console.log('%c[PerfMonitor] Data cleared', 'color: #6b7280');
  },

  // Expose for React.Profiler onRender prop
  onRender: onRenderCallback
};

// Auto-register on window
if (typeof window !== 'undefined') {
  window.__PERF__ = perfMonitor;
}

export default perfMonitor;
