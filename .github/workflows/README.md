# GitHub Workflows Documentation

This directory contains all GitHub Actions workflows for the Turborepo SaaS
Starter.

## 🔄 Workflows Overview

### 1. **CI Workflow** (`ci.yml`)

**Trigger:** Push to `main`/`develop` or Pull Requests

**Jobs:**

- ✅ **Lint** - ESLint and Prettier checks
- ✅ **Type Check** - TypeScript validation across all packages
- ✅ **Build** - Build all apps and packages
- ✅ **Test** - Run all tests with coverage

**Features:**

- Parallel job execution for speed
- Turborepo cache optimization
- pnpm store caching
- Artifact uploads for build outputs

### 2. **Deploy Preview** (`deploy-preview.yml`)

**Trigger:** Pull Requests to `main`

**Purpose:** Create preview deployments for PRs

**Features:**

- Automated preview environment creation
- PR comment with preview URL
- Preview URL format: `https://preview-{PR_NUMBER}.example.com`
- Supports Vercel, Netlify, and other platforms

**Setup Required:**

```bash
# Add secrets to your repository:
DIRECTUS_URL - Your Directus CMS URL
# Add deployment provider tokens (Vercel, Netlify, etc.)
```

### 3. **Deploy Production** (`deploy-production.yml`)

**Trigger:** Push to `main` or manual workflow dispatch

**Jobs:**

- 🌐 **Deploy Web** - Deploy Nuxt frontend
- 🔌 **Deploy Backend** - Deploy AdonisJS API

**Features:**

- Sequential deployment (web first, then backend)
- Environment-specific builds
- Deployment summaries
- Support for multiple platforms

**Supported Platforms:**

- Vercel (Frontend)
- Netlify (Frontend)
- Railway (Backend)
- Render (Backend)
- Custom deployment scripts

**Setup Required:**

```bash
# Add secrets:
PRODUCTION_URL - Your production domain
DIRECTUS_URL - Production Directus URL
# Platform-specific tokens
```

### 4. **Dependency Review** (`dependency-review.yml`)

**Trigger:** Pull Requests

**Purpose:** Security review of dependency changes

**Features:**

- Checks for vulnerabilities in new dependencies
- License compliance verification
- Fails on moderate+ severity issues
- Allowed licenses: MIT, Apache-2.0, BSD, ISC

### 5. **CodeQL Security** (`codeql.yml`)

**Trigger:**

- Push to `main`/`develop`
- Pull Requests
- Weekly schedule (Mondays)

**Purpose:** Static security analysis

**Features:**

- JavaScript/TypeScript analysis
- Security-extended query suite
- Automated vulnerability detection
- GitHub Security tab integration

### 6. **Release** (`release.yml`)

**Trigger:** Git tags matching `v*` (e.g., `v1.0.0`)

**Purpose:** Create GitHub releases

**Features:**

- Automatic changelog generation
- Build artifact packaging
- Release notes with changes
- Pre-release detection (alpha, beta, rc)

**Usage:**

```bash
# Create a new release
git tag v1.0.0
git push origin v1.0.0
```

## 📦 Dependabot Configuration

**File:** `dependabot.yml`

**Updates:**

- npm dependencies (root, apps, packages)
- GitHub Actions
- Docker images

**Schedule:** Weekly on Mondays

**Features:**

- Grouped updates (Turborepo, Nuxt, TypeScript, ESLint)
- Separate PRs per workspace
- Automatic version bumps

---

## 🚀 Setup Guide

### 1. Required Secrets

Add these secrets to your GitHub repository:

```bash
# Production
PRODUCTION_URL=https://yourapp.com
DIRECTUS_URL=https://cms.yourapp.com

# Deployment (choose your platform)
VERCEL_TOKEN=xxx
NETLIFY_SITE_ID=xxx
NETLIFY_AUTH_TOKEN=xxx
RAILWAY_TOKEN=xxx
RENDER_SERVICE_ID=xxx
RENDER_API_KEY=xxx
```

### 2. Enable Workflows

1. Go to repository Settings → Actions → General
2. Allow all actions and reusable workflows
3. Set workflow permissions to "Read and write"

### 3. Configure Branch Protection

Recommended settings for `main` branch:

- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass:
  - `Lint`
  - `Type Check`
  - `Build`
  - `Test`
- ✅ Require branches to be up to date
- ✅ Require conversation resolution

### 4. Enable Dependabot

1. Settings → Security & analysis
2. Enable Dependabot alerts
3. Enable Dependabot security updates
4. Enable Dependabot version updates

---

## 🔧 Customization

### Modify CI Checks

Edit `.github/workflows/ci.yml`:

```yaml
# Add custom job
custom-check:
  name: Custom Check
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: pnpm custom-script
```

### Add Deployment Target

Edit `.github/workflows/deploy-production.yml`:

```yaml
# Uncomment and configure your platform
# - name: Deploy to Vercel
#   run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Custom Test Reporter

```yaml
# Add to test job
- name: Test Report
  uses: dorny/test-reporter@v1
  if: success() || failure()
  with:
    name: Test Results
    path: coverage/junit.xml
    reporter: jest-junit
```

---

## 📊 Workflow Status Badges

Add to your README.md:

```markdown
[![CI](https://github.com/yourusername/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/repo/actions/workflows/ci.yml)
[![Deploy Production](https://github.com/yourusername/repo/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/yourusername/repo/actions/workflows/deploy-production.yml)
[![CodeQL](https://github.com/yourusername/repo/actions/workflows/codeql.yml/badge.svg)](https://github.com/yourusername/repo/actions/workflows/codeql.yml)
```

---

## 🐛 Troubleshooting

### Build Fails - Cache Issues

```bash
# Clear GitHub Actions cache manually:
# Settings → Actions → Caches → Delete all caches
```

### Deployment Fails

```bash
# Check deployment logs in Actions tab
# Verify secrets are set correctly
# Test deployment locally first
```

### Dependency Review Fails

```bash
# Check for vulnerable dependencies
pnpm audit

# Update dependencies
pnpm update

# Force allow specific package (not recommended)
# Edit dependency-review.yml allow-licenses
```

---

## 📚 Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Turborepo CI/CD](https://turbo.build/repo/docs/ci)
- [pnpm Action](https://github.com/pnpm/action-setup)
- [Vercel Deploy Action](https://github.com/amondnet/vercel-action)
- [Netlify Deploy Action](https://github.com/netlify/actions)
