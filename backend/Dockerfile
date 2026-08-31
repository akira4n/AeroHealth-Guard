# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Use non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 expressjs
USER expressjs

COPY --from=deps --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --chown=expressjs:nodejs src ./src
COPY --chown=expressjs:nodejs prisma ./prisma
COPY --chown=expressjs:nodejs server.js ./
COPY --chown=expressjs:nodejs package.json ./

EXPOSE 5000
ENV PORT=5000

CMD ["npm", "start"]
