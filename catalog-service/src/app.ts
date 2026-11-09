import express, { Application, Request, Response } from "express";
import cors from "cors";
import { maskRoutes } from "./routes/mask.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { maskRepository } from "./models/mask.repository.js";
import { isDBConnected } from "./config/db.js";
import { CatalogEventConsumer } from "./config/rabbitmq.js";

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Simple Request Logger
  app.use((req: Request, _res: Response, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Health check endpoint (for Docker / Load Balancer)
  app.get("/health", async (_req: Request, res: Response) => {
    const dbConnected = isDBConnected();
    const count = dbConnected ? await maskRepository.count() : 0;

    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? "UP" : "DEGRADED",
      service: "catalog-service",
      database: dbConnected ? "CONNECTED" : "DISCONNECTED",
      eventBus: {
        type: "RabbitMQ",
        status: CatalogEventConsumer.isConnected() ? "CONNECTED" : "DISCONNECTED",
        queue: "q.catalog.order-events",
      },
      itemsInCollection: count,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Catalog API Routes
  app.use("/api/masks", maskRoutes);

  // 404 Route Catch-All
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "Not Found",
      message: "The requested route does not exist in catalog-service",
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
