FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and initialize dummy DB for build
RUN npx prisma generate --url file:./dev.db
RUN npx prisma db push --accept-data-loss --url file:./dev.db

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN DATABASE_URL=file:./dev.db NEXT_PRIVATE_SKIP_TYPESCRIPT_CHECK=1 NEXT_PRIVATE_SKIP_LINT=1 npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# We need to copy prisma schema for runtime if we use it, 
# but usually with standalone we don't need it for execution,
# however for SQLite we need the DB file.
# The volume will handle the DB file.

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
