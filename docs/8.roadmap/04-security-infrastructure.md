---
title: 'Security & Infrastructure'
description: 'Production security hardening, error handling, monitoring, rate limiting, backups, and performance'
navigation:
  title: 'Security & Infrastructure'
  order: 5
---

## Overview

Harden the application for production with security best practices, error handling, monitoring, rate limiting, backups, and performance optimization.

## 4.1 Production Security Hardening

### Environment Variables
- **Ensure all secrets are in environment**:
  - No hardcoded secrets in code
  - Use environment variables for all sensitive data
  - Document required environment variables
- **Secure secret management**:
  - **Option 1**: AWS Secrets Manager
  - **Option 2**: HashiCorp Vault
  - **Option 3**: Secure `.env` files (never commit to git)
  - Use different secrets for dev/staging/production
- **Rotate secrets regularly**:
  - Database passwords
  - API keys
  - JWT secrets
  - OAuth client secrets
  - Document rotation procedures

### HTTPS Enforcement
- **Configure SSL/TLS certificates**:
  - Use Let's Encrypt via Certbot for free certificates
  - Set up auto-renewal for certificates
  - Or use managed certificates (Cloudflare, AWS ACM, etc.)
- **Redirect HTTP to HTTPS**:
  - Configure web server (Nginx/Apache) to redirect
  - Or handle in application middleware
- **Secure cookie flags**:
  - `Secure` - Only send over HTTPS
  - `HttpOnly` - Prevent JavaScript access
  - `SameSite` - CSRF protection (Strict or Lax)
  - Set appropriate cookie expiration

### Security Headers
- **Verify `nuxt-security` module configuration**:
  - Check current security headers
  - Update if needed
- **Essential security headers**:
  - **HSTS** (Strict-Transport-Security): Force HTTPS
  - **CSP** (Content-Security-Policy): Prevent XSS
  - **X-Frame-Options**: Prevent clickjacking
  - **X-Content-Type-Options**: Prevent MIME sniffing
  - **Referrer-Policy**: Control referrer information
  - **Permissions-Policy**: Control browser features
- **Test security headers**:
  - Use securityheaders.com
  - Use browser dev tools to verify

### Database Security
- **Use parameterized queries**:
  - Already implemented via ORM (Lucid)
  - Never use string concatenation for queries
- **Database connection encryption**:
  - Use SSL/TLS for database connections
  - Configure PostgreSQL SSL mode
- **Regular security updates**:
  - Keep database software updated
  - Monitor security advisories
  - Apply security patches promptly

## 4.2 Error Handling & Monitoring

### Error Tracking Service
- **Choose error tracking service**:
  - Sentry (recommended)
  - LogRocket
  - Rollbar
  - Bugsnag
- **Integrate error tracking**:
  - **Frontend**: Capture Vue errors, API errors
  - **Backend**: Capture server errors, exceptions
  - Capture error context (user, request, stack trace)
- **Set up alerts for critical errors**:
  - Alert on new error types
  - Alert on error rate spikes
  - Alert on critical system failures

### Structured Logging
- **Enhance logger**: `apps/backend/config/logger.ts`
  - Add structured logging format (JSON)
  - Include request ID, user ID, timestamp
  - Log levels: DEBUG, INFO, WARN, ERROR
- **Log to centralized service**:
  - CloudWatch (AWS)
  - Datadog
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Or file-based with log rotation
- **Request ID tracing**:
  - Generate unique request ID per request
  - Include in all logs
  - Pass through frontend and backend
  - Use for debugging production issues

### Health Checks
- **Enhanced `/health` endpoint**:
  - Basic health check (server is running)
  - Deep health check (dependencies)
- **Check dependencies**:
  - Database connectivity
  - Redis connectivity
  - Lago API connectivity
  - Directus API connectivity
  - Email service connectivity
- **Return detailed status**:
  - Each service status (up/down)
  - Response times
  - Version information
  - Timestamp
- **Use for monitoring**:
  - Set up health check monitoring
  - Alert on health check failures

## 4.3 Rate Limiting & DDoS Protection

### Application-Level Rate Limiting
- **Implement AdonisJS rate limiter middleware**:
  - Use `@adonisjs/limiter` or Redis-based solution
  - Configure per-endpoint limits
- **Per-user limits**:
  - Limit by user ID
  - Different limits for authenticated vs unauthenticated
- **Per-IP limits**:
  - Limit by IP address
  - Prevent abuse from single IP
- **Configure limits**:
  - API endpoints: 100 requests per minute
  - Auth endpoints: 5 requests per 15 minutes
  - Admin endpoints: 50 requests per minute

### Nginx Rate Limiting (If Using Nginx)
- **Configure rate limits** in `nginx.conf`:
  - Limit requests per IP
  - Limit connections per IP
  - Different limits for different paths
- **Protect against brute force attacks**:
  - Stricter limits on login/signup endpoints
  - Ban IPs after repeated violations

### IP Blocking
- **Block malicious IPs**:
  - Maintain blacklist
  - Automatically block after X violations
  - Manual IP blocking interface (admin)
- **Whitelist trusted IPs**:
  - Whitelist for admin access (optional)
  - Whitelist for webhook endpoints

## 4.4 Backup & Disaster Recovery

### Database Backups
- **Automated daily PostgreSQL backups**:
  - Use `pg_dump` or PostgreSQL backup tools
  - Backup all databases (adonis_db, directus_db, lago_db)
  - Schedule daily backups (e.g., 2 AM)
- **Backup retention policy**:
  - Keep daily backups for 30 days
  - Weekly backups for 12 weeks
  - Monthly backups for 12 months
- **Test restore procedures**:
  - Regularly test restoring from backups
  - Verify data integrity after restore
  - Document restore process
- **Backup storage**:
  - Store backups off-server
  - Encrypt backups
  - Use multiple storage locations (redundancy)

### File Storage Backups
- **Directus uploads folder backup**:
  - Backup `/directus/uploads` directory
  - Include file metadata
  - Schedule regular backups
- **Lago data backup** (if self-hosted):
  - Backup Lago database
  - Backup Lago configuration
- **Backup verification**:
  - Regularly test backups
  - Verify file integrity
  - Check backup sizes are reasonable

### Disaster Recovery Plan
- **Recovery Time Objective (RTO)**: < 1 hour
- **Recovery Point Objective (RPO)**: < 24 hours
- **Document recovery procedures**:
  - Step-by-step recovery process
  - Contact information for team
  - Escalation procedures
- **Regular disaster recovery drills**:
  - Test recovery process quarterly
  - Identify and fix gaps
  - Update documentation

## 4.5 Performance Optimization

### Caching Strategy
- **Redis caching** for frequently accessed data:
  - User session data
  - API responses (where appropriate)
  - Database query results
  - Configuration data
- **API response caching**:
  - Cache public data (plans, pricing)
  - Set appropriate cache TTL
  - Invalidate cache on updates
- **CDN for static assets**:
  - Use CDN for images, CSS, JavaScript
  - CloudFlare, AWS CloudFront, or similar
  - Cache static assets aggressively

### Database Optimization
- **Add indexes** on frequently queried columns:
  - Email (for user lookup)
  - Foreign keys
  - Status fields (active/inactive)
  - Date fields (created_at, updated_at)
  - Composite indexes for common queries
- **Query optimization**:
  - Review slow queries
  - Use EXPLAIN to analyze queries
  - Optimize N+1 queries
  - Use eager loading where appropriate
- **Connection pooling configuration**:
  - Configure appropriate pool size
  - Monitor pool usage
  - Adjust based on load

### Frontend Optimization
- **Code splitting**:
  - Split routes into separate chunks
  - Lazy load admin dashboard
  - Lazy load heavy components
- **Image optimization**:
  - Use modern formats (WebP, AVIF)
  - Compress images
  - Lazy load images
  - Use responsive images
- **Lazy loading**:
  - Lazy load non-critical components
  - Lazy load routes
  - Lazy load heavy libraries

## Implementation Checklist

- [ ] Move all secrets to environment variables
- [ ] Set up secure secret management
- [ ] Configure SSL/TLS certificates
- [ ] Enforce HTTPS redirects
- [ ] Set secure cookie flags
- [ ] Configure security headers
- [ ] Enable database SSL connections
- [ ] Integrate error tracking service
- [ ] Set up structured logging
- [ ] Enhance health check endpoint
- [ ] Implement rate limiting middleware
- [ ] Configure Nginx rate limiting
- [ ] Set up IP blocking system
- [ ] Implement automated database backups
- [ ] Create backup verification process
- [ ] Document disaster recovery plan
- [ ] Implement Redis caching
- [ ] Add database indexes
- [ ] Optimize queries
- [ ] Set up CDN for static assets
- [ ] Implement code splitting
- [ ] Optimize images

---

**Next**: [Testing & Quality Assurance](./05-testing-qa.md)

