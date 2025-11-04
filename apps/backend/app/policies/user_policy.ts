import { BasePolicy } from "@adonisjs/bouncer";

import type User from "#models/user";

export default class UserPolicy extends BasePolicy {
  /**
   * Check if user can view the user list
   */
  viewList(user: User) {
    return user.role === "admin";
  }

  /**
   * Check if user can view a specific user
   */
  view(user: User, targetUser: User) {
    // Admins can view anyone, users can view themselves
    return user.role === "admin" || user.id === targetUser.id;
  }

  /**
   * Check if user can update a user
   */
  update(user: User, targetUser: User) {
    // Admins can update anyone, users can update themselves
    return user.role === "admin" || user.id === targetUser.id;
  }

  /**
   * Check if user can delete a user
   */
  delete(user: User, targetUser: User) {
    // Only admins can delete users, and cannot delete themselves
    return user.role === "admin" && user.id !== targetUser.id;
  }

  /**
   * Check if user can toggle user status
   */
  toggleStatus(user: User, targetUser: User) {
    // Only admins can toggle status, and cannot toggle their own
    return user.role === "admin" && user.id !== targetUser.id;
  }
}
