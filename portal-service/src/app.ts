import express, { Application, Request, Response } from "express";
import cors from "cors";
import { PortalRepository } from "./models/portal.repository.js";
import { PortalController } from "./controllers/portal.controller.js";
import { createPortalRouter } from "./routes/portal.routes.js";
import { createMintRouter } from "./routes/mint.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isDBConnected } from "./config/db.js";
import { isRabbitMQConnected } from "./config/rabbitmq.js";

export function createApp(): Application {
  const app = express();

  // Global middlewares
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    const dbStatus = isDBConnected() ? "connected" : "disconnected";
    const rabbitStatus = isRabbitMQConnected() ? "connected" : "disconnected";
    const isHealthy = isDBConnected();

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "ok" : "degraded",
      service: "portal-service",
      role: "artisan-workbench-and-provenance-minting",
      port: process.env.PORT || 3008,
      database: dbStatus,
      rabbitmq: rabbitStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Dependencies
  const portalRepo = new PortalRepository();
  const portalController = new PortalController(portalRepo);

  // Mount API routes
  app.use("/api/portal", createPortalRouter(portalController));
  app.use("/api/mint", createMintRouter(portalController));

  // 404 handler for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "NotFound",
      message: "The requested route does not exist in Portal/Mint Service",
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
