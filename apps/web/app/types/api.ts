/**
 * API request/response types
 */

/**
 * API request body type
 */
export type ApiRequestBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

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

