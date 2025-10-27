import vine from "@vinejs/vine";

/**
 * Validator for user registration
 */
export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const user = await db.from("users").where("email", value).first();
        return !user;
      }),
    password: vine.string().minLength(8).maxLength(100),
  })
);

/**
 * Validator for user login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
  })
);

/**
 * Validator for updating user profile
 */
export const updateProfileValidator = vine.compile(
  vine.object({
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
  })
);

/**
 * Validator for password change
 */
export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8).maxLength(100),
  })
);

