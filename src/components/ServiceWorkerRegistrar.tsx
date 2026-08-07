'use client';

import { useEffect } from 'react';

// Register service worker + handle SW messaging
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Only register in production (or explicitly in dev with SW_DEV=true)
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && typeof window !== 'undefined' && !(window as Window & { SW_DEV?: boolean }).SW_DEV) {
      console.log('[SW] Skipped in dev mode. Set window.SW_DEV=true to test.');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Registered. Scope:', registration.scope);

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available. Refresh to update.');
            }
          });
        });
      })
      .catch((err) => console.error('[SW] Registration failed:', err));
  }, []);

  return null;
}
