FROM node:22-alpine AS base

# Node 22 on Alpine (musl). The critical Image Optimizer SVG RCE
# (GHSA-2464-fhr4-w9xw / CVE-2026-96889) is glibc-specific; musl is not
# affected, and package-lock.json pins sharp 0.35.5 including the
# @img/sharp-linuxmusl-* binaries that this image installs.
# libc6-compat covers native addons that still expect glibc symbols.
# openssl is required by the Prisma library engine.
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create a temporary database for build-time static generation
RUN npx prisma db push --accept-data-loss --url file:./dev.db

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN DATABASE_URL=file:./dev.db NEXT_PRIVATE_SKIP_TYPESCRIPT_CHECK=1 NEXT_PRIVATE_SKIP_LINT=1 npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs \
  && adduser -S -u 1001 -G nodejs nextjs

# Copy static assets and public folder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy standalone build and prisma schema
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Ensure Prisma client is available and has all necessary files
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
