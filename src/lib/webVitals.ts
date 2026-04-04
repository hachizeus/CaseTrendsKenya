/**
 * Web Vitals Performance Monitoring
 * Measures Core Web Vitals and sends metrics for analysis
 */

export interface WebVitalsMetrics {
  name: string;
  value: number;
  id: string;
  navigationType?: string;
}

// Core Web Vitals tracking
let vitalsReported = false;

export function trackWebVitals(callback?: (metric: WebVitalsMetrics) => void) {
  try {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (callback && lastEntry.renderTime || lastEntry.loadTime) {
          callback({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            id: `lcp-${Date.now()}`,
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            if (callback) {
              callback({
                name: 'CLS',
                value: clsValue,
                id: `cls-${Date.now()}`,
              });
            }
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // First Input Delay (FID) / Interaction to Next Paint (INP)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (callback) {
            callback({
              name: entry.name === 'first-input' ? 'FID' : 'INP',
              value: entry.processingDuration,
              id: `fid-${Date.now()}`,
            });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input', 'event'] });
    }
  } catch (error) {
    console.warn('Web Vitals tracking error:', error);
  }
}

export function reportMetric(metric: WebVitalsMetrics) {
  try {
    // Send to analytics or monitoring service
    if (navigator.sendBeacon) {
      const payload = JSON.stringify(metric);
      navigator.sendBeacon('/api/metrics', payload);
    }
  } catch (error) {
    console.warn('Metric reporting error:', error);
  }
}
