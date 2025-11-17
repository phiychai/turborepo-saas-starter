import { BaseCommand, args, flags } from '@adonisjs/core/ace';

import type { CommandOptions } from '@adonisjs/core/types/ace';

import { auth } from '#config/better_auth';
import User from '#models/user';
import { UserSyncService } from '#services/user_sync_service';

export default class CreateAdmin extends BaseCommand {
  static commandName = 'create:admin';
  static description = 'Create an admin user in AdonisJS and Better Auth';

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({ description: 'Email address for the admin user' })
  declare email: string;

  @args.string({ description: 'Password for the admin user' })
  declare password: string;

  @flags.string({ description: 'First name' })
  declare firstName: string;

  @flags.string({ description: 'Last name' })
  declare lastName: string;

  @flags.string({ description: 'Username (optional)' })
  declare username: string;

  async run() {
    try {
      // Check if user already exists
      const existingUser = await User.findBy('email', this.email);
      if (existingUser) {
        this.logger.error(`User with email ${this.email} already exists`);
        this.logger.info('Updating to admin role...');

        existingUser.role = 'admin';
        await existingUser.save();

        this.logger.success(`User ${this.email} updated to admin role`);
        return;
      }

      // Create user in Better Auth first
      this.logger.info('Creating user in Better Auth...');

      // Use Better Auth's API directly (preferred over auth.handler)
      this.logger.info('Calling Better Auth sign-up API...');
      let betterAuthUser;
      let betterAuthUserId;

      try {
        // Try using signUpEmail API if available
        if (auth.api.signUpEmail) {
          const result = await auth.api.signUpEmail({
            body: {
              email: this.email,
              password: this.password,
              name:
                this.firstName && this.lastName
                  ? `${this.firstName} ${this.lastName}`.trim()
                  : this.firstName || this.lastName || this.email,
            },
          });
          betterAuthUser = result?.user;
          betterAuthUserId = betterAuthUser?.id;
        } else {
          // Fallback: create user manually via Better Auth signup
          throw new Error('Better Auth signup failed and createUser API not available');
        }
      } catch (error: any) {
        const errorMessage = error?.message || error?.error?.message || 'Unknown error';
        throw new Error(`Better Auth sign-up failed: ${errorMessage}`);
      }

      if (!betterAuthUserId) {
        throw new Error('Better Auth user creation succeeded but no user ID returned');
      }

      // Better Auth sign-up hook (onAfterSignUp) will create the Adonis user automatically
      // Wait for the hook to complete - retry a few times since hooks are async
      this.logger.info('Waiting for user sync hook to complete...');

      let adonisUser = null;
      let attempts = 0;
      const maxAttempts = 10;

      while (!adonisUser && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        adonisUser = await User.findBy('email', this.email);
        attempts++;
      }

      if (!adonisUser) {
        // If hook didn't fire, try to get Better Auth user and manually sync
        this.logger.info('Sync hook did not create user, attempting manual sync...');

        // Manually sync the user using the Better Auth user data we got
        if (betterAuthUser) {
          adonisUser = await UserSyncService.syncUser({
            betterAuthUser: betterAuthUser as any,
            provider: 'email',
            requestPath: undefined,
            clientIp: undefined,
          });
        } else {
          // Fallback: construct user object from available data
          const fallbackUser = {
            id: betterAuthUserId,
            email: this.email,
            name:
              this.firstName && this.lastName
                ? `${this.firstName} ${this.lastName}`.trim()
                : this.firstName || this.lastName || undefined,
            username: this.username || undefined,
            image: null,
          };

          adonisUser = await UserSyncService.syncUser({
            betterAuthUser: fallbackUser as any,
            provider: 'email',
            requestPath: undefined,
            clientIp: undefined,
          });
        }

        if (!adonisUser) {
          throw new Error(
            `User was created in Better Auth but sync hook did not create Adonis user. ` +
              `Please check logs and try again, or manually create user in AdonisJS with role='admin'.`
          );
        }
      }

      // User exists (from hook), update role to admin
      this.logger.info('User found, updating to admin role...');
      adonisUser.role = 'admin';
      await adonisUser.save();

      this.logger.success(`Admin user created successfully!`);
      this.logger.info(`  Email: ${adonisUser.email}`);
      this.logger.info(`  Role: ${adonisUser.role}`);
      this.logger.info(`  ID: ${adonisUser.id}`);

      if (adonisUser.username) {
        this.logger.info(`  Username: ${adonisUser.username}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to create admin user: ${error.message}`);
      this.exitCode = 1;
    }
  }
}
