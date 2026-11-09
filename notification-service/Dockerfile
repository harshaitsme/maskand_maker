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
ENV PORT=3011
ENV MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker
ENV RABBITMQ_URI=amqp://guest:guest@host.docker.internal:5672
ENV RABBITMQ_EXCHANGE=maskandmaker.events

# Copy package manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user for security
USER node

EXPOSE 3011

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3011/health || exit 1

# Start the notification microservice
CMD ["node", "dist/server.js"]
