import UserPolicy from '#policies/user_policy';

/**
 * Export all policies
 */
export const policies = {
  UserPolicy,
} as {
  UserPolicy: typeof UserPolicy;
};
