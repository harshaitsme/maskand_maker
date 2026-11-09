import cors from "cors";
import express, { Express, Request, Response } from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { notificationRoutes } from "./routes/notification.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Healthcheck Endpoint
  app.get("/health", (_req: Request, res: Response) => {
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
  });

  // Notification Routes
  app.use("/api/notifications", notificationRoutes);

  // Catch-all 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found in notification-service" });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
