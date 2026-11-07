# Mask & Maker — Heritage Content & Folklore Microservice (`content-service`)

> **Traditions Documentation, Folklore Essays, Craft Stages & Workshops Microservice**  
> Built with **Node.js + Express + TypeScript + MongoDB (Mongoose)** using the **Model-View-Controller (MVC)** architectural design pattern.

---

## 1. Architectural Overview & MVC Pattern

The `content-service` powers the heritage documentation, ritual folklore, 8 craft stages (*From log to mask*), and experiential workshop reservations for the platform. It persists data in dedicated MongoDB collections.

```
content-service/
├── src/
│   ├── config/
│   │   └── db.ts                   # MongoDB connection management
│   ├── models/                     # [M] MODEL LAYER
│   │   ├── content.entity.ts       # Domain interfaces (TraditionDoc, Article, Stage, Workshop)
│   │   ├── content.schema.ts       # Mongoose Schemas (Tradition, Article, CraftStage, Workshop)
│   │   ├── content.repository.ts   # Database queries & booking operations
│   │   └── seed.data.ts            # Authentic heritage content migration dataset
│   ├── views/                      # [V] VIEW LAYER
│   │   ├── content.dto.ts          # Zod validation schemas & response DTOs
│   │   └── content.view.ts         # Presenter with HATEOAS links
│   ├── controllers/                # [C] CONTROLLER LAYER
│   │   └── content.controller.ts   # Route handlers for traditions, articles, stages, workshops
│   ├── routes/
│   │   └── content.routes.ts       # Express router mounted at /api
│   ├── middleware/
│   │   └── errorHandler.ts         # Centralized Zod & HTTP error handling
│   ├── scripts/
│   │   └── seed.ts                 # Database seeding script (npm run seed)
│   ├── app.ts                      # Express app setup
│   └── server.ts                   # Server listener on PORT 3003 with auto-seeding
├── Dockerfile                      # Multi-stage production container
├── .dockerignore
├── .env                            # Configured for localhost:27017
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. MongoDB Collections

- **Database**: `maskandmaker`
- **Port**: `3003`
- **Collections**:
  - `content-traditions`: Raksha, Sanni, and Kolam tradition documents.
  - `content-articles`: 10 folklore articles, essays, and documentary films.
  - `content-stages`: 8 stages of Kaduru wood mask crafting.
  - `content-workshops`: Hands-on carver and pigment workshop sessions.

---

## 3. REST API Endpoints

| Method | Endpoint | Description | Query Parameters / Body |
|---|---|---|---|
| `GET` | `/health` | Service & database status, total counts across collections | None |
| `GET` | `/api/traditions` | List all 3 traditions (Raksha, Sanni, Kolam) | None |
| `GET` | `/api/traditions/:slug` | Single tradition details by slug | None |
| `GET` | `/api/articles` | List folklore articles with optional filter | `?kind=&tradition=&q=` |
| `GET` | `/api/articles/:slug` | Full article body, reading minutes, author date | None |
| `GET` | `/api/stages` | 8 sequential craft stages from tree selection to awakening | None |
| `GET` | `/api/workshops` | Experiential workshop sessions and available spots | None |
| `POST` | `/api/workshops/:id/book` | Reserve a spot in a workshop session | None |

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Seed MongoDB collections
npm run seed

# 3. Start development server with hot-reload
npm run dev

# 4. Check health endpoint
curl http://localhost:3003/health
```

---

## 5. Docker Deployment

```bash
# Build image
docker build -t mask-and-maker-content-service .

# Run container (connecting to host machine MongoDB at 27017)
docker run -d --name mm-content-svc \
  -p 3003:3003 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  mask-and-maker-content-service

# Check health
curl http://localhost:3003/health
```
