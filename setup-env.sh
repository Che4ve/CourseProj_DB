#!/bin/bash

# Setup .env files for local development

echo "Setting up environment files..."

# Root .env
cat > .env << 'ENVFILE'
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/habit_tracker?schema=public"

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secret-key-change-in-production

# Backend API URL (for local development)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Node Environment
NODE_ENV=development
ENVFILE

# Frontend .env
cat > apps/frontend/.env << 'ENVFILE'
# Backend API URL (for local development)
NEXT_PUBLIC_API_URL=http://localhost:3001

# JWT Secret (must match backend)
JWT_SECRET=your-secret-key-change-in-production
ENVFILE

# Backend .env
cat > apps/backend/.env << 'ENVFILE'
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/habit_tracker?schema=public"

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Port
PORT=3001
ENVFILE

echo "✅ Environment files created!"
echo ""
echo "⚠️  IMPORTANT: Change JWT_SECRET in production!"
echo ""
echo "For Docker Compose, update NEXT_PUBLIC_API_URL to: http://backend:3001"

chmod +x setup-env.sh
