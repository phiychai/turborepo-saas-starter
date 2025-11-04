import vine from "@vinejs/vine";

/**
 * Validator for updating user profile
 * Note: Registration and login are handled by Better Auth, which has its own validation
 */
export const updateProfileValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(1).maxLength(100).optional(),
    lastName: vine.string().trim().minLength(1).maxLength(100).optional(),
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (db, value, field) => {
        const user = await db
          .from("users")
          .where("email", value)
          .whereNot("id", field.meta.userId)
          .first();
        return !user;
      })
      .optional(),
    avatarUrl: vine.string().url().optional(),
    preferences: vine.any().optional(),
  })
);

/**
 * Note: Password changes are handled by Better Auth, which has its own validation
 * See: /api/auth/change-password (Better Auth endpoint)
 */
