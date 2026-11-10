import cors from "cors";
import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import { settlementRoutes } from "./routes/settlement.routes.js";

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
    } catch (error) {
      next(error);
    }
  });

  // Settlement Routes
  app.use("/api/settlement", settlementRoutes);

  // Catch-all 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ 
      error: "Not Found",
      message: "Route not found in settlement-service" 
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
