# Mask & Maker — Artisan & Workshop Microservice (`artisan-service`)

> **Master Carver Profiles, Multi-Generational Lineages & Workbench Metrics Microservice**  
> Built with **Node.js + Express + TypeScript + MongoDB (Mongoose)** using the **Model-View-Controller (MVC)** architectural design pattern.

---

## 1. Architectural Overview & MVC Pattern

The `artisan-service` manages the identities, lineages, workshops, tools, and workbench metrics for Sri Lanka's master carvers and pigment grinders. It stores and queries data inside the **`artisan-svc`** collection in MongoDB.

```
artisan-service/
├── src/
│   ├── config/                # Database configuration & connection lifecycle
│   │   └── db.ts              # Mongoose connect, disconnect, and health status
│   ├── models/                # [M] MODEL LAYER: Mongoose Schemas & Data Access
│   │   ├── artisan.entity.ts  # Domain interfaces (Artisan, ArtisanGeneration)
│   │   ├── artisan.schema.ts  # Mongoose Schema mapping to collection 'artisan-svc'
│   │   ├── artisan.repository.ts # MongoDB Data Access Layer (queries, filters, metrics)
│   │   └── seed.data.ts       # 8 authentic master artisans migration dataset
│   ├── views/                 # [V] VIEW LAYER: Presentation, Serializers & DTOs
│   │   ├── artisan.dto.ts     # Zod validation schemas & API data contracts
│   │   └── artisan.view.ts    # Presenter: computed yearsOfMastery, HATEOAS links
│   ├── controllers/           # [C] CONTROLLER LAYER: HTTP Request Handlers
│   │   └── artisan.controller.ts # Route logic, validation orchestration, response dispatching
│   ├── routes/                # Express Route declarations mapping to Controllers
│   │   └── artisan.routes.ts  # /api/artisans, /api/artisans/:slug, /:slug/stats
│   ├── scripts/               # Utility & migration scripts
│   │   └── seed.ts            # Seeds/resets the 'artisan-svc' MongoDB collection
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
- **Collection Name**: `artisan-svc`
- **Port**: `3002`
- **Connection URL**: Configured via `.env` file (`MONGODB_URI=mongodb://localhost:27017/maskandmaker`)
- **Indexes**:
  - `slug`: Unique index for fast lookups.
  - `region`: Filter by carving village (`Ambalangoda`, `Balapitiya`, `Mirissa`, `Meetiyagoda`, `Elpitiya`, `Wathugedara`).
  - `focusTraditions`: Filter by tradition (`raksha`, `sanni`, `kolam`).
  - `rating` & `ordersFulfilled`: Indexed for sorted directory views.
  - Text Index (`name`, `sinhalaName`, `village`, `bio`, `story`): Full-text search across master carvers.

---

## 3. REST API Endpoints

| Method | Endpoint | Description | Query Parameters / Body |
|---|---|---|---|
| `GET` | `/health` | Service & MongoDB connection health check | None |
| `GET` | `/api/artisans` | Filterable list of master carvers & painters | `?tradition=&region=&verifiedOnly=&q=&sort=` |
| `GET` | `/api/artisans/:slug` | Full profile with generations, tools, and bio | None |
| `GET` | `/api/artisans/:slug/stats` | Workshop workbench metrics for Artisan Portal | None |
| `POST` | `/api/artisans` | Register new artisan (Portal Onboarding) | `CreateArtisanPayload` JSON body |
| `PATCH` | `/api/artisans/:slug/metrics` | Update fulfilled orders / customer rating | `{"deltaOrders": 1, "rating": 4.9}` |

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Seed MongoDB collection 'artisan-svc'
npm run seed

# 3. Start development server with hot-reload
npm run dev

# 4. Check health endpoint
curl http://localhost:3002/health
```

---

## 5. Docker Deployment

```bash
# Build image
docker build -t mask-and-maker-artisan-service .

# Run container (connecting to host machine MongoDB at 27017)
docker run -d --name mm-artisan-svc \
  -p 3002:3002 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  -e MONGODB_COLLECTION=artisan-svc \
  mask-and-maker-artisan-service

# Check health
curl http://localhost:3002/health
```
