/**
 * Catalyst Auth SDK wrapper (conceptual).
 * Reference: FRONTEND_ARCHITECTURE.md #4, CATALYST_INTEGRATION.md #2.
 *
 * STUB until 0C: real Catalyst Auth SDK init + session/token handling.
 */
declare global {
  interface Window {
    catalyst?: any;
  }
}

export const catalystAuth = {
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.catalyst?.auth?.isUserAuthenticated());
  },

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

  signIn: async (redirectUrl: string = '/hub') => {
    if (typeof window !== 'undefined') {
      if (window.catalyst?.auth) {
        window.catalyst.auth.signIn(redirectUrl);
      } else if (process.env.NODE_ENV !== 'production') {
        // Local dev fallback only (non-production environment)
        window.location.href = redirectUrl;
      } else {
        console.error('Catalyst Auth SDK not loaded in production environment.');
      }
    }
  },

  signOut: async (redirectUrl: string = '/login') => {
    if (typeof window !== 'undefined') {
      if (window.catalyst?.auth) {
        window.catalyst.auth.signOut(redirectUrl);
      } else {
        window.location.href = redirectUrl;
      }
    }
  },
};

