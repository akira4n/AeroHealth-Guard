# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
# Note: Ensure you have .dockerignore to exclude node_modules, .git, etc.
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Use non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 expressjs
USER expressjs

COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=expressjs:nodejs /app/package.json ./

EXPOSE 5000
ENV PORT=5000

# CMD is overridden in docker-compose.yml to run prisma migrate before start
CMD ["npm", "start"]
