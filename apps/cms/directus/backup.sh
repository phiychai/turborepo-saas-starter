#!/bin/bash

##############################################################################
# Directus Backup Script
#
# Creates backups of Directus database, uploads, and extensions
#
# Usage: ./backup.sh
##############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d-%H%M%S)
DB_CONTAINER="fce6678496a91cf06dce336f501787b185326d729fb05ae81d88266ffe5ded03"

echo -e "${BLUE}🔄 Creating Directus backup...${NC}\n"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo -e "${GREEN}📦 Backing up database...${NC}"
docker exec "$DB_CONTAINER" pg_dump -U directus -d directus > \
  "$BACKUP_DIR/db-$DATE.sql"

# Backup uploads
echo -e "${GREEN}📦 Backing up uploads...${NC}"
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" uploads/ 2>/dev/null || echo "  No uploads to backup"

# Backup extensions
echo -e "${GREEN}📦 Backing up extensions...${NC}"
tar -czf "$BACKUP_DIR/extensions-$DATE.tar.gz" extensions/ 2>/dev/null || echo "  No extensions to backup"

echo -e "\n${GREEN}✅ Backup complete!${NC}"
echo -e "Database: $BACKUP_DIR/db-$DATE.sql"
echo -e "Uploads: $BACKUP_DIR/uploads-$DATE.tar.gz"
echo -e "Extensions: $BACKUP_DIR/extensions-$DATE.tar.gz"

# Clean old backups (keep last 10)
echo -e "\n${BLUE}🧹 Cleaning old backups (keeping last 10)...${NC}"
ls -t "$BACKUP_DIR"/db-*.sql 2>/dev/null | tail -n +11 | xargs -r rm
ls -t "$BACKUP_DIR"/uploads-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
ls -t "$BACKUP_DIR"/extensions-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm

echo -e "${GREEN}✅ Done!${NC}"

