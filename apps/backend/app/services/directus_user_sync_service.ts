import logger from '@adonisjs/core/services/logger';

import type User from '#models/user';

import directusService from '#services/directus_service';

/**
 * Directus User Sync Service
 *
 * Handles synchronization of users between AdonisJS and Directus.
 * Only users with content roles (admin, content_admin, editor, writer) are synced to Directus.
 */
export class DirectusUserSyncService {
  // Directus role IDs (from apps/cms/directus/template/src/roles.json)
  // These are fallback IDs if fetching from API fails
  private static readonly FALLBACK_ROLE_IDS = {
    administrator: 'ef049c8b-546b-4bbc-9cd7-b05d77e58b66',
    content_admin: 'd70780bd-f3ed-418b-98c2-f5354fd3fa68',
    editor: '4516009c-8a04-49e4-b4ac-fd4883da6064',
    writer: '3a4464fb-2189-4710-a164-2503eed88ae7',
  } as const;

  // Cache for role IDs fetched from Directus
  private static roleIdCache: Map<string, string> = new Map();

  /**
   * Map Adonis role name to Directus role name
   */
  private static getDirectusRoleName(adonisRole: string): string | null {
    switch (adonisRole) {
      case 'admin':
        return 'Administrator';
      case 'content_admin':
        return 'Content Admin';
      case 'editor':
        return 'Editor';
      case 'writer':
        return 'Writer';
      case 'user':
        return null; // General users don't get Directus accounts
      default:
        logger.warn(`Unknown role for Directus mapping: ${adonisRole}`);
        return null;
    }
  }

  /**
   * Fetch Directus role ID by name from the API
   */
  private static async fetchDirectusRoleId(roleName: string): Promise<string | null> {
    // Check cache first
    if (this.roleIdCache.has(roleName)) {
      return this.roleIdCache.get(roleName) || null;
    }

    try {
      // Fetch roles from Directus API
      const response = await directusService.proxyRequest(
        `/roles?filter[name][_eq]=${encodeURIComponent(roleName)}&limit=1&fields[]=id&fields[]=name`,
        'GET',
        undefined,
        undefined
      );

      if (response.status === 200 && Array.isArray(response.data?.data)) {
        const roles = response.data.data;
        if (roles.length > 0 && roles[0].id) {
          const roleId = roles[0].id;
          // Cache the result
          this.roleIdCache.set(roleName, roleId);
          logger.info(`Fetched Directus role ID for "${roleName}": ${roleId}`);
          return roleId;
        }
      }

      // If not found, try fallback IDs
      const fallbackMap: Record<string, string> = {
        Administrator: this.FALLBACK_ROLE_IDS.administrator,
        'Content Admin': this.FALLBACK_ROLE_IDS.content_admin,
        Editor: this.FALLBACK_ROLE_IDS.editor,
        Writer: this.FALLBACK_ROLE_IDS.writer,
      };

      if (fallbackMap[roleName]) {
        logger.warn(
          `Role "${roleName}" not found in Directus, using fallback ID: ${fallbackMap[roleName]}`
        );
        return fallbackMap[roleName];
      }

      logger.error(`Directus role "${roleName}" not found and no fallback available`);
      return null;
    } catch (error) {
      logger.error(`Failed to fetch Directus role "${roleName}": ${error}`);
      // Try fallback
      const fallbackMap: Record<string, string> = {
        Administrator: this.FALLBACK_ROLE_IDS.administrator,
        'Content Admin': this.FALLBACK_ROLE_IDS.content_admin,
        Editor: this.FALLBACK_ROLE_IDS.editor,
        Writer: this.FALLBACK_ROLE_IDS.writer,
      };

      if (fallbackMap[roleName]) {
        logger.warn(`Using fallback role ID for "${roleName}": ${fallbackMap[roleName]}`);
        return fallbackMap[roleName];
      }

      return null;
    }
  }

  /**
   * Map Adonis role to Directus role ID (fetches from API)
   */
  static async getDirectusRoleId(adonisRole: string): Promise<string | null> {
    const roleName = this.getDirectusRoleName(adonisRole);
    if (!roleName) {
      return null;
    }

    return await this.fetchDirectusRoleId(roleName);
  }

  /**
   * Check if a role requires Directus user
   */
  static requiresDirectusUser(role: string): boolean {
    return ['admin', 'content_admin', 'editor', 'writer'].includes(role);
  }

  /**
   * Find Directus user by email
   * Uses REST API directly since directus_users is a core collection
   */
  static async findDirectusUserByEmail(email: string): Promise<string | null> {
    try {
      // Use filter query parameter to find user by email
      const filterResponse = await directusService.proxyRequest(
        `/users?filter[email][_eq]=${encodeURIComponent(email)}&limit=1&fields[]=id`,
        'GET',
        undefined,
        undefined
      );

      if (filterResponse.status === 200 && Array.isArray(filterResponse.data?.data)) {
        const users = filterResponse.data.data;
        if (users.length > 0 && users[0].id) {
          return users[0].id;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Failed to find Directus user by email: ${error}`);
      return null;
    }
  }

  /**
   * Create or update Directus user
   */
  static async syncUserToDirectus(
    user: User,
    role: string
  ): Promise<{ directusUserId: string | null; spaceId: string | null }> {
    // Only create Directus users for content roles
    if (!this.requiresDirectusUser(role)) {
      return { directusUserId: null, spaceId: null };
    }

    const directusRoleId = await this.getDirectusRoleId(role);
    if (!directusRoleId) {
      logger.warn(`Cannot sync user ${user.id} to Directus: invalid role ${role}`);
      return { directusUserId: null, spaceId: null };
    }

    try {
      // Check if Directus user already exists
      let directusUserId = user.directusUserId || (await this.findDirectusUserByEmail(user.email));

      if (directusUserId) {
        // Update existing Directus user using REST API (core collection)
        // Build payload, omitting null/undefined values
        const updatePayload: Record<string, unknown> = {
          email: user.email,
          role: directusRoleId,
          status: 'active',
        };

        if (user.firstName) {
          updatePayload.first_name = user.firstName;
        }
        if (user.lastName) {
          updatePayload.last_name = user.lastName;
        }

        const updateResponse = await directusService.proxyRequest(
          `/users/${directusUserId}`,
          'PATCH',
          updatePayload,
          undefined
        );

        if (updateResponse.status !== 200) {
          const errorMessage =
            updateResponse.data?.errors?.[0]?.message ||
            updateResponse.data?.error?.message ||
            updateResponse.data?.message ||
            `HTTP ${updateResponse.status}`;
          logger.error(`Directus user update failed: ${errorMessage}`, updateResponse.data);
          throw new Error(`Failed to update Directus user: ${errorMessage}`);
        }

        logger.info(`Updated Directus user ${directusUserId} for Adonis user ${user.id}`);
      } else {
        // Create new Directus user using REST API (core collection)
        // Build payload, omitting null/undefined values
        const userPayload: Record<string, unknown> = {
          email: user.email,
          role: directusRoleId,
          status: 'active',
        };

        if (user.firstName) {
          userPayload.first_name = user.firstName;
        }
        if (user.lastName) {
          userPayload.last_name = user.lastName;
        }

        const createResponse = await directusService.proxyRequest(
          '/users',
          'POST',
          userPayload,
          undefined
        );

        if (createResponse.status !== 200 && createResponse.status !== 201) {
          const errorMessage =
            createResponse.data?.errors?.[0]?.message ||
            createResponse.data?.error?.message ||
            createResponse.data?.message ||
            JSON.stringify(createResponse.data) ||
            `HTTP ${createResponse.status}`;
          logger.error(`Directus user creation failed for ${user.email}: ${errorMessage}`, {
            status: createResponse.status,
            response: createResponse.data,
            payload: userPayload,
          });
          throw new Error(`Failed to create Directus user: ${errorMessage}`);
        }

        // Directus API returns user data directly in response.data or response.data.data
        directusUserId = createResponse.data?.data?.id || createResponse.data?.id || null;
        if (!directusUserId) {
          logger.error('Directus user creation response structure:', {
            status: createResponse.status,
            data: createResponse.data,
            payload: userPayload,
          });
          throw new Error('Directus user created but no ID returned in response');
        }

        logger.info(`Created Directus user ${directusUserId} for Adonis user ${user.id}`);
      }

      // Update Adonis user with Directus user ID
      user.directusUserId = directusUserId;
      await user.save();

      // Create default space for Writer role (Substack-style)
      let spaceId: string | null = null;
      if (role === 'writer') {
        spaceId = await this.createDefaultSpaceForWriter(
          directusUserId,
          user.firstName,
          user.lastName,
          user.email
        );
      }

      return { directusUserId, spaceId };
    } catch (error) {
      logger.error(`Failed to sync user ${user.id} to Directus: ${error}`);
      return { directusUserId: null, spaceId: null };
    }
  }

  /**
   * Create default space for Writer role (Substack-style)
   * Uses user's first name for the space name
   */
  static async createDefaultSpaceForWriter(
    directusUserId: string,
    firstName: string | null,
    lastName: string | null,
    email: string
  ): Promise<string | null> {
    try {
      // Check if user already has a default space
      const existingSpaces = await directusService.getItems('spaces', {
        filter: {
          owner: { _eq: directusUserId },
          is_default: { _eq: true },
        },
        limit: 1,
        fields: ['id'],
      });

      if (existingSpaces && existingSpaces.length > 0) {
        return existingSpaces[0].id;
      }

      // Get user name for space (prefer first name, fallback to last name, then email prefix)
      const userName = firstName || lastName || email.split('@')[0] || 'User';

      // Create default space
      const space = await directusService.createItem('spaces', {
        slug: 'article',
        name: `${userName}'s Articles`,
        description: 'Default space for general articles',
        owner: directusUserId,
        is_default: true,
      });

      logger.info(`Created default space ${space.id} for Writer ${directusUserId}`);
      return space.id;
    } catch (error) {
      logger.error(`Failed to create default space for Writer ${directusUserId}: ${error}`);
      return null;
    }
  }

  /**
   * Update Directus user email
   * Uses REST API directly since directus_users is a core collection
   */
  static async updateDirectusUserEmail(directusUserId: string, email: string): Promise<boolean> {
    try {
      const response = await directusService.proxyRequest(
        `/users/${directusUserId}`,
        'PATCH',
        { email },
        undefined
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update Directus user email: ${response.status}`);
      }

      logger.info(`Updated Directus user ${directusUserId} email to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update Directus user ${directusUserId} email: ${error}`);
      return false;
    }
  }

  /**
   * Update Directus user role
   * Uses REST API directly since directus_users is a core collection
   */
  static async updateDirectusUserRole(
    directusUserId: string,
    adonisRole: string
  ): Promise<boolean> {
    const directusRoleId = await this.getDirectusRoleId(adonisRole);
    if (!directusRoleId) {
      logger.warn(`Cannot update Directus user role: invalid role ${adonisRole}`);
      return false;
    }

    try {
      const response = await directusService.proxyRequest(
        `/users/${directusUserId}`,
        'PATCH',
        { role: directusRoleId },
        undefined
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update Directus user role: ${response.status}`);
      }

      logger.info(`Updated Directus user ${directusUserId} role to ${adonisRole}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update Directus user ${directusUserId} role: ${error}`);
      return false;
    }
  }
}
