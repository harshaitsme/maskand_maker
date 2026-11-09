# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript to JavaScript in /dist
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Production Environment Settings
ENV NODE_ENV=production
ENV PORT=5000
ENV CATALOG_SVC_URL=http://catalog-service:3001
ENV ARTISAN_SVC_URL=http://artisan-service:3002
ENV CONTENT_SVC_URL=http://content-service:3003
ENV ORDER_SVC_URL=http://order-service:3004
ENV SEARCH_SVC_URL=http://search-service:3005
ENV VERIFY_SVC_URL=http://verify-service:3006
ENV PORTAL_SVC_URL=http://portal-service:3007
ENV IDENTITY_SVC_URL=http://identity-service:3008
ENV MEDIA_SVC_URL=http://media-service:3009
ENV SETTLEMENT_SVC_URL=http://settlement-service:3010
ENV NOTIFICATION_SVC_URL=http://notification-service:3011
ENV AI_3D_SVC_URL=http://image-to-3d-service:8000

# Copy package manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user for security
USER node

EXPOSE 5000

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/health || exit 1

# Start the API gateway
CMD ["node", "dist/server.js"]
