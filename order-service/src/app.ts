import express, { Express, Request, Response } from "express";
import cors from "cors";
import { orderRoutes } from "./routes/order.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isDBConnected } from "./config/db.js";
import { RabbitMQClient } from "./config/rabbitmq.js";
import { orderRepository } from "./models/order.repository.js";

const app: Express = express();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());

// Health Check Endpoint
app.get("/health", async (_req: Request, res: Response) => {
  const dbConnected = isDBConnected();
  const mqConnected = RabbitMQClient.isConnected();
  let stats = null;

  if (dbConnected) {
    try {
      stats = await orderRepository.getStats();
    } catch {
      // ignore
    }
  }

  const isHealthy = dbConnected && mqConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "UP" : "DEGRADED",
    service: "order-service",
    domain: "checkout-and-courier-tracking",
    database: dbConnected ? "CONNECTED" : "DISCONNECTED",
    eventBus: {
      type: "RabbitMQ",
      status: mqConnected ? "CONNECTED" : "DISCONNECTED",
      exchange: process.env.RABBITMQ_EXCHANGE || "maskandmaker.events",
    },
    orders: stats,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/orders", orderRoutes);

// Catch-all 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "Requested API endpoint does not exist on order-service",
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
