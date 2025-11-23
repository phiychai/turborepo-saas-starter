#!/bin/bash

##############################################################################
# Directus Upgrade Script
#
# Safely upgrades Directus to a new version with automatic backups
#
# Usage:
#   ./upgrade.sh [version]
#
# Examples:
#   ./upgrade.sh latest          # Upgrade to latest
#   ./upgrade.sh 11.12.0         # Upgrade to specific version
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="backups"
DB_CONTAINER="directus-cms-template-database-1"
DIRECTUS_CONTAINER="directus-cms-template-directus-1"
COMPOSE_FILE="docker-compose.yaml"

# Get target version (default: latest)
TARGET_VERSION="${1:-latest}"

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Directus Upgrade Script${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Get current version
CURRENT_VERSION=$(grep "image: directus/directus:" "$COMPOSE_FILE" | sed 's/.*directus://' | tr -d ' ')
echo -e "${BLUE}Current version:${NC} $CURRENT_VERSION"
echo -e "${BLUE}Target version:${NC} $TARGET_VERSION\n"

# Confirmation
echo -e "${YELLOW}⚠️  This will:${NC}"
echo "  1. Stop Directus"
echo "  2. Backup database and files"
echo "  3. Update to version: $TARGET_VERSION"
echo "  4. Start Directus"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Upgrade cancelled${NC}"
    exit 1
fi

# Step 1: Stop Directus
echo -e "\n${BLUE}[1/6]${NC} Stopping Directus..."
docker compose down

# Step 2: Create backups
echo -e "${BLUE}[2/6]${NC} Creating backups..."

mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d-%H%M%S)

# Start database for backup
docker compose up database -d
sleep 5

# Backup database
echo -e "  ${GREEN}→${NC} Backing up database..."
docker exec "$DB_CONTAINER" pg_dump -U directus -d directus > \
  "$BACKUP_DIR/db-$DATE.sql"
echo -e "  ${GREEN}✓${NC} Database backed up: $BACKUP_DIR/db-$DATE.sql"

# Stop database
docker compose down

# Backup uploads
echo -e "  ${GREEN}→${NC} Backing up uploads..."
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" uploads/ 2>/dev/null || echo "  No uploads to backup"
echo -e "  ${GREEN}✓${NC} Uploads backed up: $BACKUP_DIR/uploads-$DATE.tar.gz"

# Backup extensions
echo -e "  ${GREEN}→${NC} Backing up extensions..."
tar -czf "$BACKUP_DIR/extensions-$DATE.tar.gz" extensions/ 2>/dev/null || echo "  No extensions to backup"
echo -e "  ${GREEN}✓${NC} Extensions backed up: $BACKUP_DIR/extensions-$DATE.tar.gz"

# Step 3: Update docker-compose.yaml
echo -e "${BLUE}[3/6]${NC} Updating docker-compose.yaml..."
sed -i.bak "s|image: directus/directus:.*|image: directus/directus:$TARGET_VERSION|" "$COMPOSE_FILE"
echo -e "  ${GREEN}✓${NC} Updated to version: $TARGET_VERSION"

# Step 4: Pull new image
echo -e "${BLUE}[4/6]${NC} Pulling new Directus image..."
docker compose pull directus
echo -e "  ${GREEN}✓${NC} Image pulled"

# Step 5: Start Directus
echo -e "${BLUE}[5/6]${NC} Starting Directus..."
docker compose up -d
echo -e "  ${GREEN}✓${NC} Directus started"

# Step 6: Verify
echo -e "${BLUE}[6/6]${NC} Verifying upgrade..."
sleep 10

# Check if container is running
if docker compose ps directus | grep -q "Up"; then
    echo -e "  ${GREEN}✓${NC} Directus is running"

    # Try to get version
    NEW_VERSION=$(docker exec "$DIRECTUS_CONTAINER" node -e "console.log(require('/directus/package.json').version)" 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}✓${NC} New version: $NEW_VERSION"

    echo -e "\n${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Upgrade successful!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}\n"

    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Check logs: docker compose logs -f directus"
    echo "  2. Visit: http://localhost:8055"
    echo "  3. Test functionality"
    echo ""
    echo -e "${YELLOW}Backups saved to:${NC}"
    echo "  • Database: $BACKUP_DIR/db-$DATE.sql"
    echo "  • Uploads: $BACKUP_DIR/uploads-$DATE.tar.gz"
    echo "  • Extensions: $BACKUP_DIR/extensions-$DATE.tar.gz"

else
    echo -e "  ${RED}✗${NC} Directus failed to start"
    echo -e "\n${RED}════════════════════════════════════════${NC}"
    echo -e "${RED}❌ Upgrade failed!${NC}"
    echo -e "${RED}════════════════════════════════════════${NC}\n"

    echo -e "${YELLOW}To rollback:${NC}"
    echo "  1. Stop: docker compose down"
    echo "  2. Restore docker-compose.yaml: mv docker-compose.yaml.bak docker-compose.yaml"
    echo "  3. Start: docker compose up -d"
    echo ""
    echo -e "${YELLOW}Check logs:${NC}"
    echo "  docker compose logs directus"

    exit 1
fi

