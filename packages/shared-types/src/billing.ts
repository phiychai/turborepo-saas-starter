/**
 * Shared billing types
 * Used by both frontend stores and backend billing service
 */

export interface Plan {
  code: string;
  name: string;
  interval: 'monthly' | 'yearly' | 'weekly';
  amount_cents: number;
  amount_currency: string;
  description?: string;
}

export interface Subscription {
  external_id: string;
  plan_code: string;
  status: string;
  name?: string;
  created_at: string;
  started_at?: string;
  ending_at?: string;
  // Additional fields from Lago
  external_customer_id?: string;
  billing_time?: 'calendar' | 'anniversary';
  subscription_at?: string;
}

export interface Invoice {
  lago_id: string;
  number: string;
  issuing_date: string;
  payment_status: string;
  amount_cents: number;
  currency: string;
  file_url?: string;
}

