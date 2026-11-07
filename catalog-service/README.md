# Mask & Maker — Catalog Microservice (`catalog-service`)

> **Digital Heritage Mask Catalog & Inventory Microservice**  
> Built with **Node.js + Express + TypeScript + MongoDB (Mongoose)** using the **Model-View-Controller (MVC)** architectural design pattern.

---

## 1. Architectural Overview & MVC Pattern

The `catalog-service` manages Sri Lankan hand-carved Kaduru wood masks (*Raksha*, *Sanni*, and *Kolam*), querying and persisting real data inside a dedicated MongoDB collection called `catalog-svc`.

```
catalog-service/
├── src/
│   ├── config/                # Database configuration & connection lifecycle
│   │   └── db.ts              # Mongoose connect, disconnect, and health status
│   ├── models/                # [M] MODEL LAYER: Mongoose Schemas & Data Access
│   │   ├── mask.entity.ts     # Domain interfaces (Mask, Tradition, MaskSize)
│   │   ├── mask.schema.ts     # Mongoose Schema mapping to collection 'catalog-svc'
│   │   ├── mask.repository.ts # MongoDB Data Access Layer (queries, filters, atomic updates)
│   │   └── seed.data.ts       # 18 authentic masks migration dataset
│   ├── views/                 # [V] VIEW LAYER: Presentation, Serializers & DTOs
│   │   ├── mask.dto.ts        # Zod validation schemas & API data contracts
│   │   └── mask.view.ts       # Presenter: USD conversions, computed sizeCategory, HATEOAS links
│   ├── controllers/           # [C] CONTROLLER LAYER: HTTP Request Handlers
│   │   └── mask.controller.ts # Route logic, validation orchestration, response dispatching
│   ├── routes/                # Express Route declarations mapping to Controllers
│   │   └── mask.routes.ts     # /api/masks, /api/masks/:slug, /featured, etc.
│   ├── scripts/               # Utility & migration scripts
│   │   └── seed.ts            # Seeds/resets the 'catalog-svc' MongoDB collection
│   ├── middleware/            # Cross-cutting concerns
│   │   └── errorHandler.ts    # Centralized Zod & HTTP error handling
│   ├── app.ts                 # Express application configuration & CORS
│   └── server.ts              # HTTP listener & auto-seeding bootstrap
├── Dockerfile                 # Multi-stage production Docker container
├── .dockerignore
├── .env                       # Local environment variables
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 2. MongoDB Configuration & Data Storage

- **Database**: `maskandmaker`
- **Collection Name**: `catalog-svc`
- **Connection URL**: Configured via `.env` file (`MONGODB_URI=mongodb://localhost:27017/maskandmaker`)
- **Indexes**:
  - `slug`: Unique index for $O(1)$ fast lookups.
  - `tradition`: Single index for category filtering.
  - `artisanSlug`: Single index for artisan bench searches.
  - `featured`: Single index for gallery pieces.
  - `arAvailable`: Single index for 3D/AR pieces.
  - Text Index (`name`, `sinhala`, `story`, `region`, `wood`): Full-text search across cultural fields.

---

## 3. Environment Variables (`.env`)

Create a `.env` file in the root of `catalog-service`:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/maskandmaker
MONGODB_COLLECTION=catalog-svc
```

---

## 4. Seeding the Database

To populate or reset the `catalog-svc` MongoDB collection with the 18 authentic masks:

```bash
npm run seed
```

*Note: The server also auto-seeds `catalog-svc` on startup if the collection is empty.*

---

## 5. REST API Endpoints

| Method | Endpoint | Description | Query Parameters / Body |
|---|---|---|---|
| `GET` | `/health` | Service & MongoDB connection health check | None |
| `GET` | `/api/masks` | Filterable & sortable list of masks from MongoDB | `?tradition=&artisan=&q=&arOnly=&verifiedOnly=&maxPriceLKR=&sizes=&sort=` |
| `GET` | `/api/masks/featured` | Highlighted museum-grade pieces | None |
| `GET` | `/api/masks/:slug` | Get full mask details by unique slug | None |
| `GET` | `/api/masks/:slug/related` | Up to 3 related pieces in same tradition | None |
| `GET` | `/api/masks/artisan/:artisanSlug` | All masks carved by a specific artisan | None |
| `POST` | `/api/masks` | Add new mask to MongoDB (Portal Listing Flow) | `CreateMaskPayload` JSON body |
| `PATCH` | `/api/masks/:slug/stock` | Atomic stock decrement in MongoDB | `{"delta": -1}` |

---

## 6. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Seed MongoDB collection 'catalog-svc'
npm run seed

# 3. Start development server with hot-reload
npm run dev

# 4. Check health endpoint
curl http://localhost:3001/health
```

---

## 7. Docker Deployment

Build and run using the multi-stage `Dockerfile`:

```bash
# Build image
docker build -t mask-and-maker-catalog-service .

# Run container (connecting to host machine MongoDB at 27017)
docker run -d --name mm-catalog-svc \
  -p 3001:3001 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  -e MONGODB_COLLECTION=catalog-svc \
  mask-and-maker-catalog-service

# Check health
curl http://localhost:3001/health
```
