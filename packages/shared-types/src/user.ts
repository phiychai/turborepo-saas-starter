/**
 * Shared user types
 * Aligned with backend UserProfileDTO structure
 */

export interface UserProfile {
  // Profile data (from Adonis User - canonical)
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  fullName: string | null;
  displayName: string;

  // Authorization (from Adonis User)
  role: 'user' | 'admin';
  isActive: boolean;

  // Preferences (from Adonis User)
  preferences: import('./preferences').UserPreferences | null;

  // Timestamps
  createdAt: string;
  updatedAt: string | null;

  // Auth metadata (from Better Auth)
  auth: {
    provider: string | null; // 'email', 'google', 'github', etc.
    mfaEnabled: boolean;
    emailVerified: boolean;
    tokenExpiresAt: string | null;
  };
}
