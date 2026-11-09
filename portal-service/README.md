# Mask & Maker - Artisan Workbench Portal & Blockchain Provenance Minting Microservice

The **Portal & Mint Service** (`portal-service` / `mint-service`) powers the artisan workbench desk and the 4-step cryptographic provenance minting workflow for the **Mask & Maker** digital heritage platform.

---

## 🏛️ Architecture & Highlights

- **Pattern**: Strict MVC (Model-View-Controller)
- **Runtime**: Node.js v22+ (TypeScript ES2022 / NodeNext)
- **Databases**: MongoDB (`portal-listings`, `portal-bench-orders`, `portal-onboardings`, `portal-settlements`)
- **Port**: `3008`
- **Event Bus**: RabbitMQ (`maskandmaker.events` topic exchange)
  - Emits `listing.minted` (consumed by catalog and verify services)
  - Emits `listing.published` (notifies catalog service to publish to marketplace)
- **Blockchain**: Polygon PoS (Amoy Testnet / Mainnet) & Pinata IPFS metadata generation
- **NFC Support**: NTAG 424 DNA tag UID binding & QR verification links

---

## 🪵 Key Workflows Supported

### 1. Artisan Workbench Desk (`src/pages/Portal.tsx`)
- **Key Metrics**: Settled this month (LKR), lifetime revenue through registry, active orders on the bench, certificate scans in 30 days.
- **Bench Orders**: Real-time tracking of pieces (`In carving` → `Hand-over Friday` → `Export papers` → `Delivered`).
- **Fair-Trade Settlement Ledger**: Tracks 61% primary sales payout policy for woodcarvers within 14 days.

### 2. Low-Literacy Onboarding Wizard
- Trilingual portal support (**EN**, **සිංහල**, **தமிழ்**).
- Traditional village geolocation tagging (**Ambalangoda**, **Wathugedara**, **Balapitiya**, **Meetiyagoda**).
- Cryptographic Maker's Stamp generation and verification seal.

### 3. Four-Step Listing & Provenance Minting Pipeline
1. **01 Photographs**: Daylight photography ingestion and SHA-256 asset digest creation.
2. **02 3D Scan**: Photogrammetry `.glb` mesh upload and validation.
3. **03 Cryptographic Minting**:
   - `Step 1`: Fingerprinting photographs (`SHA-256`).
   - `Step 2`: Pinning study metadata bundle to IPFS (`ipfs://bafybei...`).
   - `Step 3`: Minting ERC-721 token on Polygon with gasless relayer wallet.
   - `Step 4`: Pairing physical NTAG 424 DNA chip and tamper-resistant QR code.
4. **04 Tag & Publish**: Submits the mask to the heritage review queue and emits RabbitMQ events.

---

## 🚀 API Endpoints

### 1. Workbench Desk & Orders (`/api/portal`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/portal/dashboard` | High-level artisan workbench stats, bench orders, active listings |
| `GET` | `/api/portal/bench-orders` | Active bench carving orders |
| `PATCH` | `/api/portal/bench-orders/:orderId/status` | Advance bench order state (`In carving` → `Hand-over Friday` → `Delivered`) |
| `GET` | `/api/portal/settlement/ledger` | 61% fair-trade workshop payout ledger |
| `GET` | `/api/portal/onboarding` | Retrieve artisan onboarding profile and maker stamp |
| `POST` | `/api/portal/onboarding` | Submit onboarding wizard responses and generate maker stamp |

### 2. Listing Creation & Minting (`/api/portal/listing` & `/api/mint`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/portal/listings` | Retrieve all listings for artisan |
| `GET` | `/api/portal/listings/:id` | Retrieve single listing by ID or slug |
| `POST` | `/api/portal/listing` | Create a new draft listing |
| `PUT` | `/api/portal/listing/:id/photos` | Upload workshop photographs (Stage 01) |
| `PUT` | `/api/portal/listing/:id/scan` | Upload 3D mesh photogrammetry study (Stage 02) |
| `POST` | `/api/portal/listing/:id/mint` | Execute 4-step cryptographic minting (Stage 03) |
| `POST` | `/api/portal/listing/mint` | Direct 4-step minting endpoint |
| `POST` | `/api/mint` | Dedicated mint alias endpoint |
| `POST` | `/api/portal/listing/:id/publish` | Tag and publish listing to heritage registry (Stage 04) |

### 3. Service Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health status, MongoDB connection, and RabbitMQ connectivity |

---

## 💻 Local Development

```bash
cd portal-service

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
docker build -t mask-and-maker-portal-service:latest .

docker run -d \
  --name mm-portal-svc \
  -p 3008:3008 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  -e RABBITMQ_URI=amqp://guest:guest@host.docker.internal:5672 \
  mask-and-maker-portal-service:latest
```
