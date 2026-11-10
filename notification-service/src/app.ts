import cors from "cors";
import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import { notificationRoutes } from "./routes/notification.routes.js";

export function createApp(): Express {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.NODE_ENV === "production" 
        ? (process.env.ALLOWED_ORIGINS?.split(",") ?? false) 
        : "*",
    })
  );
  app.use(express.json({ limit: "1mb" }));

  // Healthcheck Endpoint
  app.get("/health", (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        service: "notification-service",
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        channels: ["in_app", "email", "sms", "webhook"],
        subscribedEvents: [
          "order.created",
          "order.status_updated",
          "mask.minted",
          "twin.claimed",
          "settlement.recorded",
          "payout.processed",
          "nfc.tamper_reported",
        ],
      });
    } catch (error) {
      next(error);
    }
  });

  // Notification Routes
  app.use("/api/notifications", notificationRoutes);

  // Catch-all 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ 
      error: "Not Found",
      message: "Route not found in notification-service" 
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
