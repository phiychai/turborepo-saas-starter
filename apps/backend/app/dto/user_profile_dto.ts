import type User from '#models/user';
import type { UserProfile } from '@turborepo-saas-starter/shared-types';

// Use shared UserProfile type - it matches the DTO structure
export type UserProfileDTO = UserProfile;

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
      bio: user.bio,
      fullName: user.fullName,
      displayName: user.displayName,

      // Authorization
      role: user.role,
      isActive: user.isActive,

      // Preferences
      preferences: user.preferences,

      // Timestamps
      createdAt: user.createdAt?.toISO() || new Date().toISOString(),
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
