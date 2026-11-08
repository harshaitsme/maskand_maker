import express, { Express, Request, Response } from "express";
import cors from "cors";
import { verifyRoutes } from "./routes/verify.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isDBConnected } from "./config/db.js";
import { verifyRepository } from "./models/verify.repository.js";

const app: Express = express();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());

// Health Check Endpoint
app.get("/health", async (_req: Request, res: Response) => {
  const dbConnected = isDBConnected();
  let stats = null;

  if (dbConnected) {
    try {
      stats = await verifyRepository.getStats();
    } catch {
      // ignore
    }
  }

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "UP" : "DOWN",
    service: "verify-service",
    domain: "nfc-qr-authentication",
    database: dbConnected ? "CONNECTED" : "DISCONNECTED",
    registry: stats,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/verify", verifyRoutes);

// Catch-all 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "Requested API endpoint does not exist on verify-service",
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
