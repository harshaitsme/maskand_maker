# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy only dependency manifests first to leverage Docker cache
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

# Install tini to properly handle signals as PID 1
RUN apk add --no-cache tini

WORKDIR /app

# Production Environment Settings
ENV NODE_ENV=production
ENV PORT=3001

# Copy package manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Ensure the node user owns the application directory
RUN chown -R node:node /app

# Run as non-root user for security
USER node

EXPOSE 3001

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health || exit 1

# Use tini to start the catalog microservice
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
