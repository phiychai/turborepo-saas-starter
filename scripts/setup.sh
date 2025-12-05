#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Turborepo SaaS Starter Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to generate random secret
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

# Step 1: Copy environment files
echo -e "${YELLOW}Step 1: Setting up environment files...${NC}"

# Root .env
if [ ! -f ".env" ]; then
    cp env.example .env
    echo -e "${GREEN}✓ Created root .env file${NC}"

    # Generate and replace secrets
    APP_KEY=$(generate_secret)
    JWT_SECRET=$(generate_secret)
    DIRECTUS_SECRET=$(generate_secret)

    # Update .env with generated secrets (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-32-character-secret-key-here/$APP_KEY/" .env
        sed -i '' "s/your-jwt-secret-key-here/$JWT_SECRET/" .env
        sed -i '' "s/your-directus-secret-key-here/$DIRECTUS_SECRET/" .env
    else
        # Linux
        sed -i "s/your-32-character-secret-key-here/$APP_KEY/" .env
        sed -i "s/your-jwt-secret-key-here/$JWT_SECRET/" .env
        sed -i "s/your-directus-secret-key-here/$DIRECTUS_SECRET/" .env
    fi

    echo -e "${GREEN}✓ Generated secure secrets${NC}"
else
    echo -e "${YELLOW}⚠ Root .env already exists, skipping...${NC}"
fi

# Backend .env
if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/env.example apps/backend/.env

    # Generate and replace secrets
    APP_KEY=$(generate_secret)
    JWT_SECRET=$(generate_secret)

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/change-me-in-production-use-32-chars/$APP_KEY/" apps/backend/.env
        sed -i '' "s/change-me-in-production/$JWT_SECRET/" apps/backend/.env
    else
        sed -i "s/change-me-in-production-use-32-chars/$APP_KEY/" apps/backend/.env
        sed -i "s/change-me-in-production/$JWT_SECRET/" apps/backend/.env
    fi

    echo -e "${GREEN}✓ Created backend .env file${NC}"
else
    echo -e "${YELLOW}⚠ Backend .env already exists, skipping...${NC}"
fi

# Web .env
if [ ! -f "apps/web/.env" ]; then
    cp apps/web/env.example apps/web/.env
    echo -e "${GREEN}✓ Created web .env file${NC}"
else
    echo -e "${YELLOW}⚠ Web .env already exists, skipping...${NC}"
fi

echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ pnpm not found. Please install pnpm first: npm install -g pnpm${NC}"
    exit 1
fi

echo ""

# Step 3: Make init-db script executable
echo -e "${YELLOW}Step 3: Setting up database initialization...${NC}"
chmod +x scripts/init-db.sh
echo -e "${GREEN}✓ Database init script is executable${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Review and update passwords in .env files"
echo -e "  2. Start services: ${YELLOW}pnpm docker:up${NC}"
echo -e "  3. Run migrations: ${YELLOW}docker-compose exec backend node ace migration:run${NC}"
echo -e "  4. Access your app at http://localhost:3000"
echo ""
echo -e "For more information, see ${YELLOW}QUICK_START.md${NC}"
echo ""

