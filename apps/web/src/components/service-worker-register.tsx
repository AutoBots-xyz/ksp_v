'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker required for Catalyst Web Push Notifications.
 *
 * Without a registered service worker, Catalyst push notifications silently fail
 * even when the console-side configuration is correct.
 *
 * Doc: https://docs.catalyst.zoho.com/en/cloud-scale/help/push-notifications/web/
 *
 * The Catalyst Web SDK's enableNotification() snippet (pasted from the console)
 * handles user-device subscription; this component only ensures the base
 * service worker (public/sw.js) is registered so push events have a target.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          // Non-fatal: push notifications degrade gracefully to absent.
          console.warn('SW registration failed — push notifications will be unavailable.', err);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
