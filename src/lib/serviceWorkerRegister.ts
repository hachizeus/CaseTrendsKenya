/**
 * Register service worker for offline support and caching
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registered:', registration);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed:', error);
        });
    });
  }
}

/**
 * Unregister all service workers
 */
export function unregisterServiceWorkers() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
}

/**
 * Check if the service worker is available
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator && 'caches' in window;
}
