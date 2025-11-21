---
title: 'Authentication & Signup (Enhanced Features)'
description: 'Enhanced auth features roadmap: email verification, password security, OAuth, and security enhancements'
navigation:
  title: 'Auth Enhanced Features'
  order: 2
---

# Authentication & Signup (Enhanced Features)

## Overview

> **📋 Prerequisites**: Complete the [Authentication & Registration Plan](../2.authentication/1.authentication-plan.md) first (6 milestones).

This document **tracks progress** on enhanced authentication features. For detailed implementation, see the [Authentication Plan](../2.authentication/1.authentication-plan.md) and milestone docs.

## Implementation Status

- [ ] Email verification system
- [ ] Password security enhancements
- [ ] Complete OAuth flows
- [ ] Password reset and account recovery
- [ ] Session management UI
- [ ] Two-factor authentication (2FA)
- [ ] Security enhancements (rate limiting, audit logs)

---

## 1. Email Verification System

**Status**: Not Started
**Priority**: High

### Goals
- Enable email verification in Better Auth
- Integrate email service (SendGrid/Mailgun/AWS SES/Resend)
- Create email templates in Directus
- Build verification UI pages

### Key Tasks
- [ ] Enable `requireEmailVerification: true` in Better Auth config
- [ ] Create email service (`apps/backend/app/services/email_service.ts`)
- [ ] Create `email_templates` collection in Directus
- [ ] Implement Better Auth email callbacks (`sendVerificationEmail`, `sendResetPassword`)
- [ ] Create verification page (`apps/web/app/pages/verify-email.vue`)
- [ ] Update signup page with verification status
- [ ] Add resend verification email functionality

---

## 2. Password Security

**Status**: Not Started
**Priority**: High

### Goals
- Reject common passwords
- Password strength meter in UI
- Account lockout after failed attempts

### Key Tasks
- [ ] Integrate password strength library (`zxcvbn`)
- [ ] Add common password validation
- [ ] Create password strength meter component
- [ ] Implement account lockout (rate limiting per user/IP)
- [ ] Add password requirements UI checklist

---

## 3. OAuth Providers

**Status**: Partially Configured
**Priority**: Medium

### Goals
- Complete Google OAuth flow
- Complete GitHub OAuth flow
- Handle OAuth user profile sync

### Key Tasks
- [ ] Fix OAuth callback handling
- [ ] Update frontend OAuth buttons (currently show "Coming soon")
- [ ] Test Google OAuth end-to-end
- [ ] Test GitHub OAuth end-to-end
- [ ] Handle email conflicts (OAuth email matches existing account)
- [ ] Optional: Add Microsoft OAuth, Apple Sign-In, Discord

---

## 4. Password Reset & Account Recovery

**Status**: Not Started
**Priority**: Medium

### Goals
- Password reset flow via email
- Account recovery options

### Key Tasks
- [ ] Implement `sendResetPassword` callback
- [ ] Create reset password page (`apps/web/app/pages/reset-password.vue`)
- [ ] Handle reset token validation and expiration
- [ ] Create account recovery page (optional: security questions)

---

## 5. Session Management UI

**Status**: Not Started
**Priority**: Low

### Goals
- Display active sessions
- Allow session revocation

### Key Tasks
- [ ] Create sessions list in user settings
- [ ] Show device, location, last activity
- [ ] Add "Revoke session" functionality
- [ ] Implement "Revoke all other sessions"

---

## 6. Two-Factor Authentication (2FA)

**Status**: Not Started
**Priority**: Low

### Goals
- TOTP support via Better Auth
- Backup codes generation
- 2FA setup wizard

### Key Tasks
- [ ] Enable 2FA in Better Auth config
- [ ] Create 2FA setup UI (QR code generation)
- [ ] Implement backup codes generation
- [ ] Create 2FA verification step on login
- [ ] Add 2FA management in settings

---

## 7. Security Enhancements

**Status**: Not Started
**Priority**: High

### Goals
- Rate limiting on sensitive endpoints
- CSRF protection verification
- Security audit log

### Key Tasks
- [ ] Implement rate limiting middleware
  - Login: 5 attempts per 15 minutes
  - Signup: 3 attempts per hour
  - Password reset: 3 attempts per hour
- [ ] Verify CSRF protection is enabled
- [ ] Create security audit log table
- [ ] Track security events (logins, password changes, etc.)
- [ ] Create admin dashboard for security logs

---

## Implementation Notes

- **Detailed Implementation**: When implementing any feature, create detailed documentation in `docs/2.authentication/` with step-by-step guides
- **Testing**: Each feature should have unit tests, integration tests, and E2E tests
- **Security Review**: All security-related features should be reviewed before production deployment

---

**Next**: [Billing - Full Lago Integration](./02-billing.md)
