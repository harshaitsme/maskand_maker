# Mask & Maker — NFC/QR Authentication & Provenance Microservice (`verify-service`)

> **Physical-Digital Twin Authentication, NFC Tag Verification, QR Validation & On-Chain Provenance Registry**  
> Built with **Node.js + Express + TypeScript + MongoDB (Mongoose)** using the **Model-View-Controller (MVC)** architectural design pattern.

---

## 1. Architectural Overview & MVC Pattern

The `verify-service` powers physical-digital authenticity verification for Sri Lankan Kaduru wood masks. Every physical mask features an embedded **NFC chip (NTAG 424 DNA)** and a high-resolution **QR code** on its reverse. Scanning either route lands on the public registry page with cryptographic integrity proof.

```
verify-service/
├── src/
│   ├── config/
│   │   └── db.ts                   # MongoDB connection management
│   ├── models/                     # [M] MODEL LAYER
│   │   ├── verify.entity.ts        # Domain entities (CertificateDoc, NfcTagData, ProvenanceEvent)
│   │   ├── verify.schema.ts        # Mongoose Schema & Indexes for 'verify-svc' collection
│   │   ├── verify.repository.ts    # Database lookups, NFC tap increment, digital twin claims
│   │   └── seed.data.ts            # Authentic 18 mask provenance certificates & NFC tag signatures
│   ├── views/                      # [V] VIEW LAYER
│   │   ├── verify.dto.ts           # Zod validation schemas & response DTOs
│   │   └── verify.view.ts          # Presenter formatting cryptographic proof & HATEOAS links
│   ├── controllers/                # [C] CONTROLLER LAYER
│   │   └── verify.controller.ts    # Handlers for NFC tap, QR check, twin claim & tamper reports
│   ├── routes/
│   │   └── verify.routes.ts        # Express router mounted at /api/verify
│   ├── middleware/
│   │   └── errorHandler.ts         # Centralized Zod & HTTP error handling
│   ├── scripts/
│   │   └── seed.ts                 # Database seeding script (npm run seed)
│   ├── app.ts                      # Express app setup with CORS & healthcheck
│   └── server.ts                   # Server listener on PORT 3004 with auto-seeding
├── Dockerfile                      # Multi-stage production container
├── .dockerignore
├── .env                            # Configured for localhost:27017
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. NFC & QR Hardware Authentication Mechanics

### 1. Physical QR Code Scan
- **Mechanism**: High-density QR code etched on the reverse of the mask.
- **Payload**: Canonical URL `https://maskandmaker.com/verify/MM-2024-0117`.
- **Flow**: Direct lookup via `GET /api/verify/:certId`.

### 2. Physical NFC Chip Tap
- **Mechanism**: NTAG 424 DNA / NTAG213 embedded into the Kaduru wood.
- **Payload**: 7-byte factory UID (e.g. `04:1C:8E:9F:3A:42:80`) + dynamic incremental tap counter.
- **Flow**: `POST /api/verify/nfc/authenticate`.
- **Tamper Protection**: If a tag is flagged or reports are filed, status is marked as `isTampered` and physical access is blocked.

---

## 3. MongoDB Collection

- **Database**: `maskandmaker`
- **Port**: `3004`
- **Collection**: `verify-svc`
  - `certId`: Unique uppercase index (e.g. `MM-2024-0117`)
  - `maskSlug`: Indexed catalog link (e.g. `gini-raksha`)
  - `nfcTag.uid`: Indexed NFC chip UID (e.g. `04:1C:8E:9F:3A:42:80`)
  - `artisanSignature`: Cryptographic maker signature
  - `hashProof`: SHA-256 digital fingerprint

---

## 4. REST API Endpoints

| Method | Endpoint | Description | Request Body / Query |
|---|---|---|---|
| `GET` | `/health` | Service health, MongoDB connectivity & registry metrics | None |
| `GET` | `/api/verify` | List registered provenance certificates | `?status=&artisanSlug=&limit=&skip=` |
| `POST` | `/api/verify` | Register / mint a new certificate into registry | JSON Certificate payload |
| `GET` | `/api/verify/stats` | Registry aggregates (claimed, unclaimed, total NFC taps) | None |
| `GET` | `/api/verify/:certId` | Look up certificate by code (`MM-2024-0117`) | None |
| `GET` | `/api/verify/mask/:maskSlug` | Look up certificate by mask slug (`gini-raksha`) | None |
| `POST` | `/api/verify/nfc/authenticate` | Authenticate physical NFC chip tap & increment counter | `{ tagId: "04:1C:8E:9F:3A:42:80" }` |
| `POST` | `/api/verify/:certId/claim` | Claim digital twin ownership after receiving mask | `{ ownerName: "...", ownerWallet: "0x..." }` |
| `POST` | `/api/verify/:certId/report` | Report suspected counterfeit / tampered mask | `{ reason: "...", reporterContact: "..." }` |

---

## 5. Local Development & Testing

```bash
# 1. Install dependencies
npm install

# 2. Seed MongoDB with authentic mask certificates
npm run seed

# 3. Start development server with hot-reload
npm run dev

# 4. Compile TypeScript
npm run build
```

---

## 6. Docker Deployment

```bash
# Build image
docker build -t mask-and-maker-verify-service .

# Run container (connecting to host machine MongoDB at 27017)
docker run -d --name mm-verify-svc \
  -p 3004:3004 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/maskandmaker \
  mask-and-maker-verify-service:latest
```
