---
title: 'Admin Dashboard'
description: 'User management, subscription management, Directus integration, analytics, and permissions'
navigation:
  title: 'Admin Dashboard'
  order: 4
---

# Admin Dashboard

## Overview

Build a comprehensive admin dashboard with user management, subscription management, Directus integration, analytics, and proper permissions.

## 3.1 User Management

### User Listing
- **Location**: `apps/web/app/pages/admin/users.vue`
- **Replace placeholder data** with real API calls:
  - Fetch users from backend API
  - Display real user data
- **Pagination**:
  - Implement server-side pagination
  - Configurable page size (10, 25, 50, 100)
  - Page navigation controls
- **Search functionality**:
  - Search by email, name
  - Real-time search with debouncing
  - Clear search option
- **Filtering**:
  - Filter by role (user, admin)
  - Filter by status (active, inactive)
  - Filter by subscription status
  - Date range filters (created date, last login)
- **Display columns**:
  - Email address
  - Full name
  - Role (user/admin badge)
  - Subscription status (active, trial, canceled)
  - Last login date/time
  - Account created date
  - Actions column

### User CRUD Operations
- **View user details**:
  - View full user profile
  - View subscription details
  - View activity history
  - View security events
- **Edit user profile**:
  - Edit name, email
  - Change user role
  - Update account status
  - Save changes with validation
- **Toggle user active/inactive status**:
  - Activate suspended accounts
  - Deactivate problematic accounts
  - Show status change confirmation
- **Impersonate user** (if needed):
  - Secure impersonation feature
  - Clear audit trail when impersonating
  - Easy exit from impersonation
  - Security restrictions during impersonation
- **Delete/archive users**:
  - Soft delete (archive) users
  - Hard delete with confirmation
  - Handle related data (subscriptions, invoices)

### Bulk Operations
- **Bulk activate/deactivate**:
  - Select multiple users
  - Apply status change to selected users
  - Confirmation dialog
  - Batch processing with progress indicator
- **Bulk role assignment**:
  - Change role for multiple users
  - Confirmation before applying
- **Export user list**:
  - CSV export functionality
  - Include selected fields
  - Email export option

## 3.2 Subscription Management (Admin)

### View All Subscriptions
- **Create page**: `apps/web/app/pages/admin/subscriptions.vue`
- **List all subscriptions**:
  - Active subscriptions
  - Canceled subscriptions
  - Trial subscriptions
  - Past due subscriptions
- **Filter by**:
  - Plan type
  - Status (active, canceled, trial, etc.)
  - Date range (created, canceled, next billing)
  - Customer email/name
- **Display subscription details**:
  - Customer information
  - Plan name and pricing
  - Subscription status
  - Start date, next billing date
  - Last payment status
  - Total revenue from subscription

### Manual Subscription Operations
- **Create subscription for user**:
  - Select user
  - Choose plan
  - Set start date
  - Apply discounts/coupons
  - Create subscription in Lago
- **Cancel subscription**:
  - Cancel immediately or at period end
  - Reason for cancellation
  - Update subscription status
- **Update subscription plan**:
  - Change plan for existing subscription
  - Handle proration
  - Schedule plan change
- **Apply discounts/coupons**:
  - Apply percentage or fixed discounts
  - Set discount duration
  - Track discount usage

### Revenue Analytics
- **Monthly Recurring Revenue (MRR)**:
  - Calculate total MRR
  - MRR growth trends
  - MRR by plan
  - MRR chart over time
- **Revenue charts and trends**:
  - Revenue over time (daily, weekly, monthly)
  - Revenue by plan
  - Revenue comparison (current vs previous period)
  - Revenue forecast
- **Customer Lifetime Value (LTV)**:
  - Calculate average LTV
  - LTV by acquisition channel
  - LTV trends

## 3.3 Directus Integration in Admin

### Directus Content Management UI
- **Embed Directus admin or create proxy UI**:
  - Option 1: Iframe embed Directus admin (requires auth)
  - Option 2: Create custom UI using Directus API
  - Option 3: Hybrid approach for specific features
- **Manage email templates**:
  - List email templates from Directus collections
  - Edit templates directly
  - Preview templates with sample data
  - Test email sending
- **Content management for marketing pages**:
  - Manage blog posts
  - Edit landing page content
  - Update documentation pages
  - Manage navigation menus
- **Media library access**:
  - View and manage uploaded files
  - Upload new assets
  - Organize media into folders
  - Delete unused assets

### Directus API Integration
- **Service location**: `apps/backend/app/services/directus_service.ts` (partially exists)
- **Admin endpoints** to sync/manage Directus content:
  - `GET /api/admin/cms/collections` - List collections
  - `GET /api/admin/cms/items/:collection` - List items
  - `POST /api/admin/cms/items/:collection` - Create item
  - `PATCH /api/admin/cms/items/:collection/:id` - Update item
  - `DELETE /api/admin/cms/items/:collection/:id` - Delete item
- **Cache Directus content appropriately**:
  - Cache frequently accessed content
  - Invalidate cache on updates
  - Cache strategy for static vs dynamic content

## 3.4 Admin Analytics & Reports

### Dashboard Stats
- **Location**: `apps/web/app/pages/admin/index.vue`
- **Replace placeholder data** with real metrics:
  - **Real-time user count**:
    - Total registered users
    - Active users (logged in last 30 days)
    - New users this month
    - Growth percentage
  - **Active subscriptions count**:
    - Total active subscriptions
    - Trial subscriptions
    - Canceled subscriptions this month
    - Subscription growth rate
  - **Monthly revenue** (from Lago):
    - Current month revenue
    - Previous month comparison
    - Revenue growth percentage
    - Revenue chart
  - **Support tickets** (if implemented):
    - Open tickets
    - Resolved today/this week
    - Average resolution time

### User Activity Logs
- **Track user actions**:
  - Logins (successful and failed)
  - Purchases/subscriptions
  - Profile changes
  - Password changes
  - Email changes
  - Feature usage
- **Admin action audit trail**:
  - Track all admin actions
  - Who did what and when
  - Changes to user accounts
  - Subscription modifications
  - System configuration changes
- **Activity log UI**:
  - Filter by user, action type, date range
  - Search functionality
  - Export logs

### System Health Monitoring
- **Database status**:
  - Connection status
  - Query performance
  - Database size
  - Connection pool usage
- **Service connectivity**:
  - Lago API connectivity
  - Directus API connectivity
  - Email service status
  - Redis connection status
- **Error rates**:
  - API error rate
  - Failed requests percentage
  - Error types breakdown
  - Recent errors log

## 3.5 Admin Permissions

### Role-Based Access Control
- **Verify admin middleware**: `apps/web/app/middleware/admin.ts`
  - Ensure it properly checks user role
  - Handle unauthorized access
  - Redirect non-admins appropriately
- **Granular permissions**:
  - **View-only admin**: Can view but not edit
  - **Full admin**: Can perform all operations
  - **Limited admin**: Specific permissions (e.g., user management only)
- **Protect admin routes properly**:
  - Server-side validation (not just client-side)
  - API endpoints check permissions
  - Audit all admin actions

### Permission Management
- **Permission system design**:
  - Define permission roles
  - Map permissions to features
  - User role assignment
- **Admin user management**:
  - Create new admin users
  - Modify admin permissions
  - Remove admin access
  - Track admin access changes

## Implementation Checklist

- [ ] Replace placeholder data with real API calls in admin dashboard
- [ ] Implement user listing with pagination and search
- [ ] Create user CRUD operations UI
- [ ] Add bulk operations functionality
- [ ] Build subscription management page
- [ ] Implement revenue analytics and charts
- [ ] Integrate Directus content management
- [ ] Create Directus API service endpoints
- [ ] Build activity logs and audit trail
- [ ] Implement system health monitoring
- [ ] Set up granular admin permissions
- [ ] Protect all admin routes with proper middleware

---

**Next**: [Security & Infrastructure](./04-security-infrastructure.md)

