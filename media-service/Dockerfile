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
ENV PORT=3009
ENV MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker
ENV RABBITMQ_URI=amqp://guest:guest@host.docker.internal:5672
ENV RABBITMQ_EXCHANGE=maskandmaker.events
ENV MINIO_ENDPOINT=host.docker.internal
ENV MINIO_PORT=9000
ENV MINIO_USE_SSL=false
ENV MINIO_ACCESS_KEY=minioadmin
ENV MINIO_SECRET_KEY=minioadmin
ENV MINIO_BUCKET=maskandmaker-media
ENV PUBLIC_MEDIA_BASE_URL=http://localhost:3009/api/media/stream

# Copy package manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user for security
USER node

EXPOSE 3009

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3009/health || exit 1

# Start the media microservice
CMD ["node", "dist/server.js"]
