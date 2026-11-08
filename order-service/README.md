# Mask & Maker — Order & Courier Tracking Microservice (`order-service`)

> **Checkout Processing, Multi-Currency Order State Machine, Courier Tracking & RabbitMQ Event Bus**  
> Built with **Node.js + Express + TypeScript + MongoDB (Mongoose) + RabbitMQ (amqplib)** using the **Model-View-Controller (MVC)** architectural design pattern.

---

## 1. Architectural Overview & MVC Pattern

The `order-service` powers the checkout process, courier tracking timeline, and order status transitions (`preparing` → `in-transit` → `delivered`). It acts as an **event publisher** on the RabbitMQ event bus to orchestrate inter-service actions asynchronously.

```
order-service/
├── src/
│   ├── config/
│   │   ├── db.ts                   # MongoDB connection management
│   │   └── rabbitmq.ts             # RabbitMQ AMQP connection & event publisher
│   ├── models/                     # [M] MODEL LAYER
│   │   ├── order.entity.ts         # Domain models (OrderDoc, OrderEvent, ShippingAddress)
│   │   ├── order.schema.ts         # Mongoose Schema & Indexes (collection: 'order-svc')
│   │   ├── order.repository.ts     # DB queries, status progression, ID generation
│   │   └── seed.data.ts            # Realistic order mock migration data
│   ├── views/                      # [V] VIEW LAYER
│   │   ├── order.dto.ts            # Zod validation schemas & response contracts
│   │   └── order.view.ts           # Presenter formatting order DTOs & HATEOAS links
│   ├── controllers/                # [C] CONTROLLER LAYER
│   │   └── order.controller.ts     # Handlers for checkout, listing, and status updates
│   ├── routes/
│   │   └── order.routes.ts         # Express router mounted at /api/orders
│   ├── middleware/
│   │   └── errorHandler.ts         # Centralized Zod & HTTP error handling
│   ├── scripts/
│   │   └── seed.ts                 # Database migration script (npm run seed)
│   ├── app.ts                      # Express app setup with CORS, RabbitMQ & healthcheck
│   └── server.ts                   # Server listener on PORT 3005 with auto-seeding
├── Dockerfile                      # Multi-stage production container
├── .dockerignore
├── .env                            # Configured for localhost:27017 & localhost:5672
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. RabbitMQ Event-Driven Architecture

When orders are created or updated, `order-service` broadcasts events onto a RabbitMQ **topic exchange**:

- **Exchange**: `maskandmaker.events` (Topic)
- **Events Published**:
  1. `order.created`:
     - **Trigger**: Customer completes checkout (`POST /api/orders`).
     - **Payload**: `{ orderId, placedAt, items: [{ slug, qty, priceLKR }], totalLKR, customerName }`
     - **Subscribers**:
       - `catalog-service`: Automatically decrements inventory (`stock`).
       - `verify-service`: Appends `"Purchased & packaged for dispatch"` to mask provenance.
  2. `order.status_updated`:
     - **Trigger**: Courier marks order as `in-transit` or `delivered` (`PATCH /api/orders/:id/status`).
     - **Payload**: `{ orderId, previousStatus, newStatus, updatedAt }`

---

## 3. MongoDB Collection

- **Database**: `maskandmaker`
- **Port**: `3005`
- **Collection**: `order-svc`
  - `id`: Unique uppercase index (e.g. `MM-ORD-3358`)
  - `status`: Indexed status (`preparing`, `in-transit`, `delivered`)
  - `items`: Mask slugs and quantities
  - `shippingAddress`: Buyer name, address, city, country
  - `courier`: Carrier (`Island Express`, `DHL Express`), tracking number
  - `events`: Ordered tracking milestones for the frontend timeline

---

## 4. REST API Endpoints

| Method | Endpoint | Description | Request Body / Query |
|---|---|---|---|
| `GET` | `/health` | Service health, MongoDB & RabbitMQ connection status | None |
| `GET` | `/api/orders` | List orders with optional status filter | `?status=&limit=&skip=` |
| `POST` | `/api/orders` | Place new order & publish `order.created` RabbitMQ event | JSON Order payload |
| `GET` | `/api/orders/stats` | Order aggregates (revenue, status breakdown) | None |
| `GET` | `/api/orders/:id` | Fetch single order details & tracking timeline | None |
| `PATCH` | `/api/orders/:id/status` | Update courier status (`in-transit` or `delivered`) | `{"status": "in-transit"}` |

---

## 5. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Seed initial mock orders into MongoDB
npm run seed

# 3. Start development server with hot-reload
npm run dev

# 4. Check health endpoint (verifies MongoDB & RabbitMQ)
curl http://localhost:3005/health
```

---

## 6. Docker Deployment

```bash
# Build image
docker build -t mask-and-maker-order-service .

# Run container (connecting to host MongoDB & RabbitMQ)
docker run -d --name mm-order-svc \
  -p 3005:3005 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  -e RABBITMQ_URI=amqp://guest:guest@host.docker.internal:5672 \
  mask-and-maker-order-service:latest
```
