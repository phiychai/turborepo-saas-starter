/**
 * Billing service types for Lago API
 */

/**
 * Generic Lago API response wrapper
 */
export interface LagoApiResponse<T> {
  [key: string]: T | unknown;
}

/**
 * Lago event for batch operations
 */
export interface LagoEvent {
  transaction_id: string;
  external_customer_id: string;
  code: string;
  timestamp?: number;
  properties?: Record<string, string | number | boolean | null>;
}

/**
 * Lago charge definition
 */
export interface LagoCharge {
  billable_metric_code: string;
  charge_model?: 'standard' | 'graduated' | 'package' | 'percentage';
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Lago account/customer response structure
 */
export interface LagoAccountResponse {
  customer?: {
    external_id?: string;
    id?: string;
    name?: string;
    email?: string;
    [key: string]: unknown;
  };
  external_id?: string;
  [key: string]: unknown;
}

