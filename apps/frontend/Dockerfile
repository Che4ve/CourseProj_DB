FROM node:20-alpine AS base

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/frontend

# Set build-time environment variable
ARG NEXT_PUBLIC_API_URL=http://backend:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build

# Production image
FROM base AS runner
ENV NODE_ENV=production

WORKDIR /app/apps/frontend

# Copy necessary files
COPY --from=builder /app/apps/frontend/next.config.ts ./
COPY --from=builder /app/apps/frontend/package.json ./
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
