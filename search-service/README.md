# Mask & Maker — Unified Search Microservice (`search-service`)

> **Multi-Domain Full-Text Search across Masks, Master Artisans, and Folklore Essays**  
> Built with **Node.js + Express + TypeScript + MongoDB (Mongoose)** using the **Model-View-Controller (MVC)** architectural design pattern.

---

## 1. Architectural Overview & MVC Pattern

The `search-service` powers the global search bar and the **Command Palette (`Cmd+K` / `Ctrl+K`)** on the platform. It executes cross-collection search queries across `catalog-svc`, `artisan-svc`, `content-articles`, and platform routes.

```
search-service/
├── src/
│   ├── config/
│   │   └── db.ts                   # MongoDB connection management
│   ├── models/                     # [M] MODEL LAYER
│   │   ├── search.entity.ts        # Domain models (SearchHit, SearchSuggestion, SearchStats)
│   │   ├── search.schema.ts        # Cross-collection read schemas
│   │   └── search.repository.ts    # Multi-domain text queries and autocomplete ranking
│   ├── views/                      # [V] VIEW LAYER
│   │   ├── search.dto.ts           # Zod query validation & SearchResponseDto
│   │   └── search.view.ts          # Presenter formatting hits for CommandPalette UI
│   ├── controllers/                # [C] CONTROLLER LAYER
│   │   └── search.controller.ts    # Handlers for /api/search, /api/search/suggest, /stats
│   ├── routes/
│   │   └── search.routes.ts        # Express router mounted at /api/search
│   ├── middleware/
│   │   └── errorHandler.ts         # Centralized Zod & HTTP error handling
│   ├── app.ts                      # Express app setup with CORS & healthcheck
│   └── server.ts                   # Server listener on PORT 3006
├── Dockerfile                      # Multi-stage production container
├── .dockerignore
├── .env                            # Configured for localhost:27017
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. REST API Endpoints (Port 3006)

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/health` | Service health, MongoDB connectivity & searchable counts | None |
| `GET` | `/api/search` | Unified full-text search across masks, artisans & folklore | `?q=query&kind=&limit=&format=` |
| `GET` | `/api/search/suggest` | Fast prefix autocomplete for search suggestions | `?q=prefix` |
| `GET` | `/api/search/stats` | Aggregated count of all searchable entities | None |

### Example Response: `GET /api/search?q=raksha`
```json
{
  "query": "raksha",
  "count": 5,
  "hits": [
    {
      "kind": "mask",
      "title": "Naga Raksha",
      "subtitle": "Raksha · Sirisena Apuhamy",
      "href": "/masks/naga-raksha",
      "tradition": "raksha"
    },
    {
      "kind": "mask",
      "title": "Gini Raksha",
      "subtitle": "Raksha · Chandana Bandara",
      "href": "/masks/gini-raksha",
      "tradition": "raksha"
    },
    {
      "kind": "mask",
      "title": "Maru Raksha",
      "subtitle": "Raksha · Ranjith Sirimanne",
      "href": "/masks/maru-raksha",
      "tradition": "raksha"
    },
    {
      "kind": "article",
      "title": "The Ritual Cosmology of Raksha Masks",
      "subtitle": "Essay · 5 min read",
      "href": "/heritage?article=the-ritual-cosmology-of-raksha-masks",
      "tradition": "raksha"
    }
  ]
}
```

---

## 3. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server with hot-reload
npm run dev

# 3. Test search endpoint
curl "http://localhost:3006/api/search?q=gini"
```

---

## 4. Docker Deployment

```bash
# Build image
docker build -t mask-and-maker-search-service .

# Run container (connecting to host MongoDB at 27017)
docker run -d --name mm-search-svc \
  -p 3006:3006 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  mask-and-maker-search-service:latest
```
