#!/bin/bash

##############################################################################
# Documentation Sync Script
#
# This script synchronizes documentation from the root docs/ folder
# to the Nuxt Content folder (apps/web/content/1.docs/) for web display
#
# Usage: ./scripts/sync-docs.sh
##############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories
DOCS_SOURCE="docs"
NUXT_CONTENT_DEST="apps/web/content/1.docs"

echo -e "${BLUE}📚 Syncing documentation to Nuxt Content...${NC}\n"

# Create destination directory if it doesn't exist
mkdir -p "$NUXT_CONTENT_DEST"

# Function to sync a documentation section
sync_section() {
  local section=$1
  local dest_folder=$2

  if [ -d "$DOCS_SOURCE/$section" ]; then
    echo -e "${GREEN}✓${NC} Syncing ${section}..."

    # Create destination folder
    mkdir -p "$NUXT_CONTENT_DEST/$dest_folder"

    # Copy all markdown files
    find "$DOCS_SOURCE/$section" -name "*.md" -type f | while read -r file; do
      filename=$(basename "$file")
      cp "$file" "$NUXT_CONTENT_DEST/$dest_folder/$filename"
      echo -e "  ${BLUE}→${NC} Copied $filename"
    done
  fi
}

# Function to sync individual files
sync_file() {
  local source_file=$1
  local dest_folder=$2
  local dest_name=$3

  if [ -f "$source_file" ]; then
    echo -e "${GREEN}✓${NC} Syncing $(basename "$source_file")..."
    mkdir -p "$NUXT_CONTENT_DEST/$dest_folder"

    if [ -n "$dest_name" ]; then
      cp "$source_file" "$NUXT_CONTENT_DEST/$dest_folder/$dest_name"
    else
      cp "$source_file" "$NUXT_CONTENT_DEST/$dest_folder/"
    fi
  fi
}

# Sync all documentation sections
echo -e "${GREEN}✓${NC} Syncing documentation sections..."
# 1. Getting Started
sync_section "0.workflow" "0.workflow"
# 1. Getting Started
sync_section "1.getting-started" "1.getting-started"

# 2. Authentication
sync_section "2.authentication" "2.authentication"

# 3. Architecture
sync_section "3.architecture" "3.architecture"

# 4. Integrations
sync_section "4.integrations" "4.integrations"

# 5. Deployment
sync_section "5.deployment" "5.deployment"

# 6. Testing
sync_section "6.testing" "6.testing"

# 7. Tooling
sync_section "7.tooling" "7.tooling"

# 7. Roadmap
sync_section "8.roadmap" "8.roadmap"

echo -e "\n${GREEN}✅ Documentation sync complete!${NC}"
echo -e "\n${YELLOW}Note:${NC} Documentation is now available at:"
echo -e "  ${BLUE}→${NC} Source: $DOCS_SOURCE/"
echo -e "  ${BLUE}→${NC} Web: http://localhost:3000/docs"

