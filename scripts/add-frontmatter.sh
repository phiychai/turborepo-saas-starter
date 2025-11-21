#!/bin/bash

##############################################################################
# Add Frontmatter to Documentation Files
#
# This script adds Nuxt Content frontmatter to markdown files that don't
# have it yet, making them compatible with the Nuxt Content module
#
# Usage: ./scripts/add-frontmatter.sh
##############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📝 Adding frontmatter to documentation files...${NC}\n"

# Function to add frontmatter to a file
add_frontmatter() {
  local file=$1
  local title=$2
  local description=$3
  local order=${4:-1}

  # Check if file already has frontmatter
  if head -n 1 "$file" | grep -q "^---$"; then
    echo -e "  ${BLUE}→${NC} Already has frontmatter: $(basename "$file")"
    return
  fi

  # Create temp file with frontmatter
  {
    echo "---"
    echo "title: '$title'"
    echo "description: '$description'"
    echo "navigation:"
    echo "  title: '$title'"
    echo "  order: $order"
    echo "---"
    echo ""
    cat "$file"
  } > "$file.tmp"

  mv "$file.tmp" "$file"
  echo -e "${GREEN}✓${NC} Added frontmatter: $(basename "$file")"
}

# Add frontmatter to all documentation sections

# Getting Started
if [ -d "docs/getting-started" ]; then
  echo -e "${BLUE}Processing getting-started docs...${NC}"

  if [ -f "docs/getting-started/QUICK_START.md" ]; then
    add_frontmatter "docs/getting-started/QUICK_START.md" \
      "Quick Start" \
      "Get up and running with the SaaS starter in minutes" \
      1
  fi
fi

# Authentication
if [ -d "docs/authentication" ]; then
  echo -e "${BLUE}Processing authentication docs...${NC}"

  if [ -f "docs/authentication/AUTHENTICATION.md" ]; then
    add_frontmatter "docs/authentication/AUTHENTICATION.md" \
      "Authentication Guide" \
      "Complete guide to Better Auth integration with AdonisJS and Nuxt" \
      1
  fi

  if [ -f "docs/authentication/BETTER_AUTH_ARCHITECTURE.md" ]; then
    add_frontmatter "docs/authentication/BETTER_AUTH_ARCHITECTURE.md" \
      "Architecture & Flow Diagrams" \
      "Quick reference with authentication flow diagrams and file structure" \
      2
  fi

  if [ -f "docs/authentication/BETTER_AUTH_INTEGRATION.md" ]; then
    add_frontmatter "docs/authentication/BETTER_AUTH_INTEGRATION.md" \
      "Integration Details" \
      "Technical implementation details of Better Auth integration" \
      3
  fi

  if [ -f "docs/authentication/BETTER_AUTH_FIXES.md" ]; then
    add_frontmatter "docs/authentication/BETTER_AUTH_FIXES.md" \
      "Troubleshooting & Fixes" \
      "Issues resolved during Better Auth integration" \
      4
  fi
fi

# Architecture
if [ -d "docs/architecture" ]; then
  echo -e "${BLUE}Processing architecture docs...${NC}"

  if [ -f "docs/architecture/ARCHITECTURE.md" ]; then
    add_frontmatter "docs/architecture/ARCHITECTURE.md" \
      "Architecture Overview" \
      "System architecture and design decisions" \
      1
  fi

  if [ -f "docs/architecture/IMPLEMENTATION_SUMMARY.md" ]; then
    add_frontmatter "docs/architecture/IMPLEMENTATION_SUMMARY.md" \
      "Implementation Summary" \
      "Summary of key implementation details and patterns" \
      2
  fi

  if [ -f "docs/architecture/PACKAGE_STRUCTURE.md" ]; then
    add_frontmatter "docs/architecture/PACKAGE_STRUCTURE.md" \
      "Package Structure" \
      "Monorepo organization and package management" \
      3
  fi

  if [ -f "docs/architecture/MIGRATION_PROGRESS.md" ]; then
    add_frontmatter "docs/architecture/MIGRATION_PROGRESS.md" \
      "Migration Progress" \
      "Development migration notes and progress tracking" \
      4
  fi

  if [ -f "docs/architecture/PINIA_STATE_MANAGEMENT.md" ]; then
    add_frontmatter "docs/architecture/PINIA_STATE_MANAGEMENT.md" \
      "Pinia State Management" \
      "Comprehensive guide to state management with Pinia stores" \
      5
  fi

  if [ -f "docs/architecture/ROUTING_SYSTEM.md" ]; then
    add_frontmatter "docs/architecture/ROUTING_SYSTEM.md" \
      "Smart Routing System" \
      "Dynamic routing based on authentication status and user roles" \
      6
  fi
fi

# Integrations
if [ -d "docs/integrations" ]; then
  echo -e "${BLUE}Processing integration docs...${NC}"

  if [ -f "docs/integrations/LAGO_INTEGRATION.md" ]; then
    add_frontmatter "docs/integrations/LAGO_INTEGRATION.md" \
      "Lago Billing" \
      "Billing and subscription management with Lago" \
      1
  fi

  if [ -f "docs/integrations/DIRECTUS_UPGRADE.md" ]; then
    add_frontmatter "docs/integrations/DIRECTUS_UPGRADE.md" \
      "Directus Upgrade" \
      "How to safely upgrade Directus CMS to the latest version" \
      2
  fi

  if [ -f "docs/integrations/LAGO_SETUP.md" ]; then
    add_frontmatter "docs/integrations/LAGO_SETUP.md" \
      "Lago Setup" \
      "Complete guide to setting up and configuring Lago for billing" \
      3
  fi
fi

# Deployment
if [ -d "docs/deployment" ]; then
  echo -e "${BLUE}Processing deployment docs...${NC}"

  if [ -f "docs/deployment/PRODUCTION_DEPLOYMENT.md" ]; then
    add_frontmatter "docs/deployment/PRODUCTION_DEPLOYMENT.md" \
      "Production Deployment" \
      "Complete guide to deploying to production" \
      1
  fi
fi

# Testing
if [ -d "docs/testing" ]; then
  echo -e "${BLUE}Processing testing docs...${NC}"

  if [ -f "docs/testing/TESTING.md" ]; then
    add_frontmatter "docs/testing/TESTING.md" \
      "Testing Guide" \
      "Vitest and Playwright testing setup and best practices" \
      1
  fi
fi

# Tooling
if [ -d "docs/tooling" ]; then
  echo -e "${BLUE}Processing tooling docs...${NC}"

  if [ -f "docs/tooling/ESLINT_PRETTIER_SETUP.md" ]; then
    add_frontmatter "docs/tooling/ESLINT_PRETTIER_SETUP.md" \
      "ESLint & Prettier" \
      "Code formatting and linting configuration" \
      1
  fi

  if [ -f "docs/tooling/CONFIG_FILES.md" ]; then
    add_frontmatter "docs/tooling/CONFIG_FILES.md" \
      "Configuration Files" \
      "Documentation for configuration files in the project" \
      2
  fi

  if [ -f "docs/tooling/MODULE_TYPES.md" ]; then
    add_frontmatter "docs/tooling/MODULE_TYPES.md" \
      "Module Types" \
      "Module system and type definitions" \
      3
  fi

  if [ -f "docs/tooling/WORKAROUNDS.md" ]; then
    add_frontmatter "docs/tooling/WORKAROUNDS.md" \
      "Workarounds" \
      "Temporary fixes and workarounds for known issues" \
      4
  fi
fi

echo -e "\n${GREEN}✅ Frontmatter added successfully!${NC}"

