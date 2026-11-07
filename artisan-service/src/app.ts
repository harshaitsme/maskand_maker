import express, { Application, Request, Response } from "express";
import cors from "cors";
import { artisanRoutes } from "./routes/artisan.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { artisanRepository } from "./models/artisan.repository.js";
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
    const count = dbConnected ? await artisanRepository.count() : 0;

    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? "UP" : "DEGRADED",
      service: "artisan-service",
      database: dbConnected ? "CONNECTED" : "DISCONNECTED",
      itemsInCollection: count,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Artisan API Routes
  app.use("/api/artisans", artisanRoutes);

  // 404 Route Catch-All
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "Not Found",
      message: "The requested route does not exist in artisan-service",
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
