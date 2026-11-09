import cors from "cors";
import express, { Express, Request, Response } from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { settlementRoutes } from "./routes/settlement.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Healthcheck Endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      service: "settlement-service",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      fairTradeRates: {
        primaryArtisanPercent: 61,
        reforestationPercent: 19,
        guildPercent: 12,
        platformPercent: 8,
        secondaryRoyaltyPercent: 7.5,
      },
    });
  });

  // Settlement Routes
  app.use("/api/settlement", settlementRoutes);

  // Catch-all 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found in settlement-service" });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
