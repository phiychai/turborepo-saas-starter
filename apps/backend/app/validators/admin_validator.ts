import vine from '@vinejs/vine';

/**
 * Validator for admin user creation
 */
export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().minLength(8),
    firstName: vine.string().trim().minLength(1).maxLength(100).optional(),
    lastName: vine.string().trim().minLength(1).maxLength(100).optional(),
    username: vine.string().trim().minLength(3).maxLength(30).optional(),
    role: vine.enum(['user', 'admin', 'content_admin', 'editor', 'writer']),
  })
);
