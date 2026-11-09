# Mask & Maker - Identity & Authentication Microservice

The **Identity Service** (`identity-service`) manages user identity, accounts, JWT authentication, Role-Based Access Control (RBAC), user address books, and cross-device persistent wishlists for the **Mask & Maker** digital heritage platform.

---

## 🏛️ Architecture

- **Pattern**: Strict MVC (Model-View-Controller)
- **Runtime**: Node.js v22+ (TypeScript ES2022/NodeNext)
- **Database**: MongoDB collection `identity-svc`
- **Default Port**: `3007`
- **Authentication**: JWT (JSON Web Tokens) with symmetric HS256 encryption (`7d` validity)
- **Hashing**: bcryptjs (10 salt rounds)

---

## 👥 Personas & Pre-Seeded Accounts

All seeded accounts have the default password: `password123`

| Email | Persona | Role | Location | Description |
| :--- | :--- | :--- | :--- | :--- |
| `r.jayasuriya@holding.lk` | Ruwin Jayasuriya | `buyer` | Colombo 07 | VIP mask collector, certificate owner (`MM-2023-0845`) |
| `c.bandara@traditionalcarvers.lk` | Chandana Bandara | `artisan` | Ambalangoda | Master woodcarver linked to artisan profile |
| `verifier@maskandmaker.lk` | Dr. Ananda Verifier | `verifier` | Battaramulla | National Crafts Council certifier |
| `admin@maskandmaker.lk` | System Administrator | `admin` | Colombo HQ | Platform operator with full administrative privileges |

---

## 🚀 API Endpoints

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new buyer or artisan account |
| `POST` | `/api/auth/login` | Public | Authenticate with email and password, receive JWT |
| `GET` | `/api/auth/me` | Bearer Token | Retrieve currently authenticated user profile |
| `PATCH` | `/api/auth/profile` | Bearer Token | Update profile details (name, initials, location) |

### 2. User & Wishlist Management (`/api/users`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/stats` | Public | High-level platform user metrics & role breakdown |
| `GET` | `/api/users` | Admin Role | Paginated list of registered users |
| `GET` | `/api/users/wishlist` | Bearer Token | Retrieve authenticated user's wishlist slugs |
| `POST` | `/api/users/wishlist/:maskSlug` | Bearer Token | Add mask slug to wishlist |
| `DELETE` | `/api/users/wishlist/:maskSlug` | Bearer Token | Remove mask slug from wishlist |
| `GET` | `/api/users/addresses` | Bearer Token | List all saved shipping/billing addresses |
| `POST` | `/api/users/addresses` | Bearer Token | Add new delivery address to address book |
| `PUT` | `/api/users/addresses/:id` | Bearer Token | Update existing address |
| `DELETE` | `/api/users/addresses/:id` | Bearer Token | Remove address from address book |

### 3. Service Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health status and MongoDB connectivity |

---

## 💻 Local Development

```bash
cd identity-service

# Install dependencies
npm install

# Seed the database
npm run seed

# Run in watch mode
npm run dev

# Build TypeScript to /dist
npm run build
```

---

## 🐳 Docker Deployment

```bash
docker build -t mask-and-maker-identity-service:latest .

docker run -d \
  --name mm-identity-svc \
  -p 3007:3007 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  mask-and-maker-identity-service:latest
```
