import { createAuthClient } from 'better-auth/client';
import { usernameClient } from 'better-auth/client/plugins';
import { emailOTPClient } from 'better-auth/client/plugins';

// Create auth client
// Always use relative URLs to go through the Nuxt server proxy
// This ensures cookies work correctly in both dev and production
export const authClient = createAuthClient({
  // Don't set baseURL - use relative URLs (same origin)
  // This makes all requests go to the same origin as the frontend
  baseURL: undefined,
  plugins: [usernameClient(), emailOTPClient()],
  fetchOptions: {
    // Include credentials for cookie-based auth
    credentials: 'include',
  },
});

// Export individual methods for convenience
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
