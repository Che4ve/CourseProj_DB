FROM node:20-alpine AS base

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile

# Build packages
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN cd packages/db && pnpm db:generate

# Build backend
RUN cd apps/backend && pnpm build

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/main.js"]
