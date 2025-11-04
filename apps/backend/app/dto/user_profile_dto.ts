import type User from '#models/user';

export interface UserProfileDTO {
  // Profile data (from Adonis User - canonical)
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  displayName: string;

  // Authorization (from Adonis User)
  role: 'user' | 'admin';
  isActive: boolean;

  // Preferences (from Adonis User)
  preferences: Record<string, any> | null;

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

export class UserProfileDTOBuilder {
  /**
   * Build UserProfileDTO from Adonis User and Better Auth data
   */
  static build(user: User, betterAuthUser: any, session: any): UserProfileDTO {
    return {
      // Profile data
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      fullName: user.fullName,
      displayName: user.displayName,

      // Authorization
      role: user.role,
      isActive: user.isActive,

      // Preferences
      preferences: user.preferences,

      // Timestamps
      createdAt: user.createdAt.toISO(),
      updatedAt: user.updatedAt?.toISO() || null,

      // Auth metadata
      auth: {
        provider: this.getProvider(betterAuthUser),
        mfaEnabled: betterAuthUser?.mfaEnabled || false,
        emailVerified: betterAuthUser?.emailVerified || false,
        tokenExpiresAt: session?.expiresAt ? new Date(session.expiresAt).toISOString() : null,
      },
    };
  }

  /**
   * Determine auth provider from Better Auth user/account
   */
  private static getProvider(betterAuthUser: any): string | null {
    // Better Auth might store provider in account or user object
    // Adjust based on Better Auth structure
    if (betterAuthUser?.account?.providerId) {
      return betterAuthUser.account.providerId;
    }
    if (betterAuthUser?.provider) {
      return betterAuthUser.provider;
    }
    // Default to email if no provider found
    return 'email';
  }
}
