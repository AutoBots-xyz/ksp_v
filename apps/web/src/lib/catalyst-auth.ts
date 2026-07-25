/**
 * Catalyst Auth SDK wrapper.
 * Reference: FRONTEND_ARCHITECTURE.md #4, CATALYST_INTEGRATION.md #2.
 *
 * Exposes type-safe helpers over `window.catalyst.auth`.
 */
declare global {
  interface Window {
    catalyst?: {
      auth?: {
        isUserAuthenticated: () => boolean | Promise<boolean>;
        getCurrentUser: () => Promise<any>;
        signIn: (containerIdOrUrl: string, config?: Record<string, any>) => void;
        signOut: (redirectUrl?: string) => void;
      };
    };
  }
}

export const catalystAuth = {
  /** Check whether session is active in browser via Catalyst Auth SDK */
  isAuthenticated: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.catalyst?.auth) return false;
    try {
      const res = await window.catalyst.auth.isUserAuthenticated();
      return Boolean(res);
    } catch {
      return false;
    }
  },

  /** Fetch current authenticated user details from Catalyst SDK */
  getCurrentUser: async () => {
    if (typeof window === 'undefined' || !window.catalyst?.auth) {
      return null;
    }
    try {
      const user = await window.catalyst.auth.getCurrentUser();
      return user;
    } catch {
      return null;
    }
  },

  /** Render embedded iframe login or invoke signIn redirect */
  signIn: (containerIdOrUrl: string = 'loginDivElementId', config?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      if (window.catalyst?.auth) {
        window.catalyst.auth.signIn(containerIdOrUrl, config);
      } else if (process.env.NODE_ENV !== 'production') {
        const targetUrl = typeof config?.service_url === 'string' ? config.service_url : '/hub';
        window.location.href = targetUrl;
      } else {
        console.error('Catalyst Auth SDK not loaded in production environment.');
      }
    }
  },

  /** Sign out and redirect */
  signOut: (redirectUrl: string = '/login') => {
    if (typeof window !== 'undefined') {
      if (window.catalyst?.auth) {
        window.catalyst.auth.signOut(redirectUrl);
      } else {
        window.location.href = redirectUrl;
      }
    }
  },
};
