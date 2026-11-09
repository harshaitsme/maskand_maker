# Mask & Maker - Media & 3D AR Assets Microservice

The **Media Service** (`media-service`) manages asset ingestion, S3/MinIO bucket storage, 3D photogrammetry mesh (`.glb`) distribution, and pre-signed uploads for the **Mask & Maker** digital heritage platform.

---

## 🏛️ Architecture & Highlights

- **Pattern**: Strict MVC (Model-View-Controller)
- **Runtime**: Node.js v22+ (TypeScript ES2022 / NodeNext)
- **Database**: MongoDB (`media-svc` collection)
- **Object Storage**: MinIO / Amazon S3 (`maskandmaker-media` bucket)
- **Port**: `3009`
- **Event Bus**: RabbitMQ (`maskandmaker.events` topic exchange)
  - Emits `media.uploaded` with routing key `media.image` or `media.model-3d`
- **Streaming & AR Support**: Direct binary streaming proxy with CORS headers for `<model-viewer>` and WebXR

---

## 🚀 API Endpoints

### 1. Ingestion & Pre-Signed Uploads (`/api/media`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/media/upload` | Multipart file upload (`multer`) with automatic MIME detection and SHA-256 fingerprinting |
| `POST` | `/api/media/presigned-upload` | Generates pre-signed S3 PUT URL for direct browser uploads (15-min expiry) |
| `POST` | `/api/media/register` | Register metadata for direct-uploaded S3 asset |
| `GET` | `/api/media/files` | List tracked assets (supports filtering by `assetType`, `maskSlug`, `artisanSlug`) |
| `GET` | `/api/media/files/:id` | Retrieve single asset metadata |
| `DELETE` | `/api/media/files/:id` | Remove asset from MinIO storage and MongoDB registry |
| `GET` | `/api/media/stats` | Storage breakdown (total bytes, images count, 3D models count) |
| `GET` | `/api/media/stream/*` | High-performance binary stream proxy with open CORS headers for 3D viewers |

### 2. Service Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health status reporting MongoDB, MinIO, and RabbitMQ connectivity |

---

## 💻 Local Development

```bash
cd media-service

# Install dependencies
npm install

# Seed metadata
npm run seed

# Run in watch mode
npm run dev

# Build TypeScript to /dist
npm run build
```

---

## 🐳 Docker Deployment

```bash
docker build -t mask-and-maker-media-service:latest .

docker run -d \
  --name mm-media-svc \
  -p 3009:3009 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  -e RABBITMQ_URI=amqp://guest:guest@host.docker.internal:5672 \
  -e MINIO_ENDPOINT=host.docker.internal \
  -e MINIO_PORT=9000 \
  mask-and-maker-media-service:latest
```
