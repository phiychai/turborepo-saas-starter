import type User from '#models/user';
import type { BetterAuthUser } from '#services/user_sync_service';
import type { BetterAuthSession } from '#types/context';
import type { UserProfile } from '@turborepo-saas-starter/shared-types';

// Use shared UserProfile type - it matches the DTO structure
export type UserProfileDTO = UserProfile;

export class UserProfileDTOBuilder {
  /**
   * Build UserProfileDTO from Adonis User and Better Auth data
   */
  static build(
    user: User,
    betterAuthUser: BetterAuthUser | null,
    session: BetterAuthSession | null
  ): UserProfileDTO {
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
  private static getProvider(betterAuthUser: BetterAuthUser | null): string | null {
    if (!betterAuthUser) {
      return 'email';
    }
    // Better Auth might store provider in account or user object
    // Adjust based on Better Auth structure
    if (
      'account' in betterAuthUser &&
      betterAuthUser.account &&
      typeof betterAuthUser.account === 'object' &&
      'providerId' in betterAuthUser.account
    ) {
      return String(betterAuthUser.account.providerId);
    }
    if ('provider' in betterAuthUser && betterAuthUser.provider) {
      return String(betterAuthUser.provider);
    }
    // Default to email if no provider found
    return 'email';
  }
}
