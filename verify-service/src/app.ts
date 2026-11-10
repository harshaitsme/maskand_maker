import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet"; // Recommended addition for security
import { verifyRoutes } from "./routes/verify.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isDBConnected } from "./config/db.js";
import { VerifyEventConsumer } from "./config/rabbitmq.js";
import { verifyRepository } from "./models/verify.repository.js";

const app: Express = express();

// Security Middlewares
app.use(helmet()); // Sets various secure HTTP headers
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? (process.env.ALLOWED_ORIGINS?.split(",") ?? false) 
      : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "1mb" })); // Added payload size limit

// Health Check Endpoint
app.get("/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbConnected = isDBConnected();
    let stats = null;

    if (dbConnected) {
      stats = await verifyRepository.getStats().catch(() => null);
    }

    const isRabbitConnected = VerifyEventConsumer.isConnected();
    
    // Return 503 if critical dependencies are down
    const isHealthy = dbConnected && isRabbitConnected;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "UP" : "DOWN",
      service: "verify-service",
      domain: "nfc-qr-authentication",
      database: dbConnected ? "CONNECTED" : "DISCONNECTED",
      eventBus: {
        type: "RabbitMQ",
        status: isRabbitConnected ? "CONNECTED" : "DISCONNECTED",
        queue: "q.verify.order-events",
      },
      registry: stats,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error); // Pass unexpected errors to the centralized handler
  }
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
