import express, { Application, Request, Response } from "express";
import cors from "cors";
import { MediaRepository } from "./models/media.repository.js";
import { MediaController } from "./controllers/media.controller.js";
import { createMediaRouter } from "./routes/media.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isDBConnected } from "./config/db.js";
import { isMinioConnected, MINIO_BUCKET } from "./config/minio.js";
import { isRabbitMQConnected } from "./config/rabbitmq.js";

export function createApp(): Application {
  const app = express();

  // Global middlewares with CORS support for 3D viewers and cross-origin WebXR
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
      allowedHeaders: ["Content-Type", "Authorization", "Range"],
      exposedHeaders: ["Content-Length", "Content-Type", "ETag"],
    })
  );
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    const dbStatus = isDBConnected() ? "connected" : "disconnected";
    const minioStatus = isMinioConnected() ? "connected" : "disconnected";
    const rabbitStatus = isRabbitMQConnected() ? "connected" : "disconnected";
    const isHealthy = isDBConnected() && isMinioConnected();

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "ok" : "degraded",
      service: "media-service",
      role: "object-storage-and-3d-asset-pipeline",
      port: process.env.PORT || 3009,
      storage: {
        provider: "MinIO S3",
        bucket: MINIO_BUCKET,
        status: minioStatus,
      },
      database: dbStatus,
      rabbitmq: rabbitStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Dependencies
  const mediaRepo = new MediaRepository();
  const mediaController = new MediaController(mediaRepo);

  // Mount API routes
  app.use("/api/media", createMediaRouter(mediaController));

  // 404 handler for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "NotFound",
      message: "The requested route does not exist in Media Service",
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
