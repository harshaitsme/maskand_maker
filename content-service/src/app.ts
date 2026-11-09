import express, { Application, Request, Response } from "express";
import cors from "cors";
import { contentRoutes } from "./routes/content.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { contentRepository } from "./models/content.repository.js";
import { isDBConnected } from "./config/db.js";

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Request Logger
  app.use((req: Request, _res: Response, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Health check endpoint
  app.get("/health", async (_req: Request, res: Response) => {
    const dbConnected = isDBConnected();
    const stats = dbConnected
      ? await contentRepository.countAll()
      : { traditions: 0, articles: 0, stages: 0, workshops: 0 };

    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? "UP" : "DEGRADED",
      service: "content-service",
      database: dbConnected ? "CONNECTED" : "DISCONNECTED",
      itemsInCollections: stats,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Content API Routes under /api
  app.use("/api", contentRoutes);

  // 404 Route Catch-All
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "Not Found",
      message: "The requested route does not exist in content-service",
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
