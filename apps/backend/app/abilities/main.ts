import { Bouncer } from "@adonisjs/bouncer";

import type User from "#models/user";

/**
 * Define abilities for authorization
 * All abilities receive the authenticated user as first argument
 */
export const manageUsers = Bouncer.ability((user: User) => user.role === "admin");

export const editProfile = Bouncer.ability((user: User, targetUser?: User) => {
  // Users can edit their own profile, admins can edit any profile
  if (user.role === "admin") {
    return true;
  }

  // Users can only edit their own profile
  if (!targetUser) {
    return false;
  }

  return user.id === targetUser.id;
});

export const viewUsers = Bouncer.ability(
  (user: User) =>
    // Admins can view all users, regular users cannot
    user.role === "admin"
);

export const toggleUserStatus = Bouncer.ability(
  (user: User) =>
    // Only admins can activate/deactivate users
    user.role === "admin"
);

export const manageBilling = Bouncer.ability(
  (user: User) =>
    // For now, all authenticated users can manage their billing
    // Later, you might want to check subscription status
    true
);

export const viewDashboard = Bouncer.ability(
  (user: User) =>
    // All authenticated users can view dashboard
    user.isActive
);
