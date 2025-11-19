/**
 * API request/response types
 */

/**
 * API request body type
 * Supports JSON objects, arrays, primitives, FormData (for file uploads), and Blob
 *
 * Why Record<string, unknown> instead of Record<string, any>?
 * - `unknown` is type-safe: requires type checking before use
 * - `any` disables type checking entirely
 * - This forces developers to validate data before accessing properties
 */
export type ApiRequestBody =
  | Record<string, unknown> // JSON objects
  | unknown[] // JSON arrays
  | FormData // File uploads
  | Blob // Binary data
  | string // Raw string body
  | number
  | boolean
  | null
  | undefined;

/**
 * API query parameters type
 */
export type ApiQueryParams = Record<string, string | number | boolean | string[] | undefined>;

/**
 * API error response interface
 */
export interface ApiErrorResponse {
  message: string;
  error?: string;
  data?: unknown;
  statusCode?: number;
}
