---
title: 'Billing - Full Lago Integration'
description: 'Webhook integration, payment methods UI, subscription management, and lifecycle handling'
navigation:
  title: 'Billing'
  order: 3
---

# Billing - Full Lago Integration

## Overview

Complete the Lago billing integration with webhook handling, payment methods UI, subscription management, and full lifecycle support.

## 2.1 Webhook Integration

### Lago Webhook Handler
- **Location**: `apps/backend/app/controllers/billing_controller.ts`
- **Create endpoint**: `POST /api/billing/webhooks`
  - Verify webhook signatures using Lago webhook secret
  - Handle webhook events idempotently
  - Return 200 OK quickly to prevent timeouts
- **Handle webhook events**:
  - `subscription.created` - New subscription created
  - `subscription.updated` - Subscription plan/status changed
  - `subscription.canceled` - Subscription canceled
  - `invoice.created` - New invoice generated
  - `invoice.payment_failed` - Payment failed
  - `invoice.payment_succeeded` - Payment succeeded
  - `customer.created` - Customer created in Lago
  - `customer.updated` - Customer updated
- **Update local database/user state**:
  - Sync subscription status to user record
  - Update subscription metadata
  - Log webhook events for debugging

### Webhook Testing
- **Test webhook delivery** from Lago:
  - Use ngrok or similar for local testing
  - Verify webhook signature validation
  - Test all event types
- **Handle retries**:
  - Lago will retry failed webhooks
  - Ensure idempotency to prevent duplicate processing
  - Log failed webhook attempts

## 2.2 Payment Methods UI

### Frontend Payment Method Management
- **Create page**: `apps/web/app/pages/dashboard/billing/payment-methods.vue`
- **List saved payment methods**:
  - Display card type, last 4 digits, expiry date
  - Show which is the default payment method
  - Display payment method status
- **Add new payment method**:
  - Stripe Elements integration for secure card input
  - Form validation
  - Secure token creation
  - Send to backend for Lago customer linking
- **Set default payment method**:
  - Allow users to change default
  - Update Lago customer billing configuration
- **Remove payment methods**:
  - Confirmation dialog before removal
  - Cannot remove if it's the only payment method
  - Cannot remove if it's the default and others exist

### Stripe Integration
- **Integrate Stripe.js** in frontend:
  - Load Stripe.js SDK
  - Initialize Stripe with publishable key
  - Create Stripe Elements for card input
- **Create payment method tokens**:
  - Use Stripe.js to tokenize card data
  - Never send raw card data to backend
- **Send to backend** for Lago customer linking:
  - Backend creates payment method in Stripe
  - Link to Lago customer via billing configuration
- **Handle 3D Secure authentication**:
  - Support SCA (Strong Customer Authentication)
  - Handle authentication flow
  - Confirm payment method setup after authentication

## 2.3 Subscription Management UI

### Current State
- Basic billing service exists but needs UI

### Subscription Dashboard
- **Location**: `apps/web/app/pages/dashboard/billing/index.vue`
- **Display current subscription status**:
  - Current plan name and pricing
  - Subscription status (active, trial, canceled, etc.)
  - Next billing date
  - Subscription renewal date
  - Trial days remaining (if applicable)
- **List available plans**:
  - Fetch plans from Lago API
  - Display plan features comparison
  - Show pricing (monthly/yearly)
  - Highlight current plan
- **Upgrade/downgrade subscription flow**:
  - Plan comparison view
  - Proration information
  - Confirmation step
  - Success/error handling
- **Cancel subscription**:
  - Confirmation dialog with warnings
  - Option to cancel immediately or at period end
  - Show what features will be lost
  - Allow reactivation within grace period
- **Proration display**:
  - Show prorated charges for plan changes
  - Explain proration calculation
  - Display next billing amount

### Invoice Management
- **Create page**: `apps/web/app/pages/dashboard/billing/invoices.vue`
- **List invoices for user**:
  - Display invoice number, date, amount, status
  - Filter by status (paid, pending, failed)
  - Pagination for invoice list
- **Download invoice PDFs**:
  - Link to Lago invoice download endpoint
  - Or serve PDFs through backend proxy
  - Cache PDFs for performance
- **Payment retry for failed invoices**:
  - Allow user to retry payment
  - Update payment method if needed
  - Show payment status after retry

### Usage Tracking (If Using Metered Billing)
- **Display usage metrics**:
  - Current period usage
  - Usage limits/billing thresholds
  - Usage breakdown by metric
- **Usage history charts**:
  - Graph usage over time
  - Compare periods
  - Usage trends visualization

## 2.4 Subscription Lifecycle

### Trial Periods
- **Configure trial periods** in Lago plans:
  - Set trial duration (7, 14, 30 days, etc.)
  - Trial pricing (free or discounted)
- **Track trial status in UI**:
  - Display trial days remaining
  - Show when trial ends
  - Convert to paid subscription before trial ends
- **Send trial ending notifications**:
  - Email reminder 3 days before trial ends
  - In-app notification
  - Trial expiration warning

### Grace Periods and Dunning
- **Handle failed payments gracefully**:
  - Show clear error messages
  - Provide payment update flow
  - Explain what happens if payment continues to fail
- **Automatic retry logic**:
  - Lago handles automatic retries
  - UI should show retry status
  - Display next retry attempt date
- **Account suspension** after grace period:
  - Clear messaging about suspension
  - Provide path to reactivation
  - Preserve account data during suspension

### Plan Change Handling
- **Immediate vs. end-of-period changes**:
  - Allow users to choose timing
  - Explain proration for immediate changes
  - Schedule changes for period end
- **Proration calculations display**:
  - Show current period charges
  - Show prorated amount
  - Display next full billing amount
  - Total amount due now

## 2.5 Lago Customer Sync

### Ensure Customer Sync on User Creation
- **Verify**: `apps/backend/app/controllers/auth_controller.ts`
  - Already creates Lago customer on registration
  - Check for error handling
  - Verify customer creation success
- **Handle failures gracefully**:
  - Implement retry queue for failed customer creation
  - Log failures for admin review
  - Don't fail user registration if Lago is down
  - Retry mechanism (exponential backoff)

### Customer Update Sync
- **Sync user profile changes** to Lago customer:
  - Update name, email in Lago when changed in app
  - Keep customer data in sync
  - Handle conflicts (email already exists, etc.)
- **Update billing address** if applicable:
  - Collect billing address during subscription
  - Sync to Lago customer
  - Allow users to update billing address

## Implementation Checklist

- [ ] Create webhook handler endpoint
- [ ] Implement webhook signature verification
- [ ] Handle all webhook event types
- [ ] Test webhook delivery and retries
- [ ] Create payment methods UI page
- [ ] Integrate Stripe.js and Stripe Elements
- [ ] Implement 3D Secure support
- [ ] Create subscription dashboard UI
- [ ] Build plan comparison and upgrade flow
- [ ] Implement invoice management page
- [ ] Add usage tracking UI (if applicable)
- [ ] Configure trial periods in Lago
- [ ] Implement trial ending notifications
- [ ] Handle grace periods and dunning in UI
- [ ] Create customer sync on user creation
- [ ] Implement profile change sync to Lago

---

**Next**: [Admin Dashboard](./03-admin-dashboard.md)

