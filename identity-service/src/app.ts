import express, { Application, Request, Response } from "express";
import cors from "cors";
import { UserRepository } from "./models/user.repository.js";
import { UserController } from "./controllers/user.controller.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createUserRouter } from "./routes/user.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isDBConnected } from "./config/db.js";

export function createApp(): Application {
  const app = express();

  // Global middlewares
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    const dbStatus = isDBConnected() ? "connected" : "disconnected";
    const statusCode = isDBConnected() ? 200 : 503;

    res.status(statusCode).json({
      status: isDBConnected() ? "ok" : "degraded",
      service: "identity-service",
      port: process.env.PORT || 3007,
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Dependencies
  const userRepo = new UserRepository();
  const userController = new UserController(userRepo);

  // Mount API routes
  app.use("/api/auth", createAuthRouter(userController));
  app.use("/api/users", createUserRouter(userController));

  // 404 handler for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "NotFound",
      message: "The requested route does not exist in Identity Service",
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
