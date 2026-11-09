import cors from "cors";
import express, { Express, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { services } from "./config/services.js";
import { aggregateHealth } from "./middleware/healthAggregator.js";

export function createApp(): Express {
  const app = express();

  // Allow Cross-Origin Requests from Frontend
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );

  // Gateway Diagnostics
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      gateway: "mask-and-maker-api-gateway",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      routes: [
        "/api/masks",
        "/api/artisans",
        "/api/traditions",
        "/api/articles",
        "/api/content",
        "/api/orders",
        "/api/search",
        "/api/verify",
        "/api/portal",
        "/api/mint",
        "/api/auth",
        "/api/users",
        "/api/identity",
        "/api/media",
        "/api/settlement",
        "/api/notifications",
        "/api/ai-3d",
      ],
    });
  });

  // Cluster-Wide Aggregated Health
  app.get("/health/all", aggregateHealth);

  // 1. Catalog Service (/api/masks)
  app.use(
    createProxyMiddleware({
      target: services.catalog.url,
      changeOrigin: true,
      pathFilter: "/api/masks",
    })
  );

  // 2. Artisan Service (/api/artisans)
  app.use(
    createProxyMiddleware({
      target: services.artisan.url,
      changeOrigin: true,
      pathFilter: "/api/artisans",
    })
  );

  // 3. Content Service (/api/traditions, /api/articles, /api/content)
  app.use(
    createProxyMiddleware({
      target: services.content.url,
      changeOrigin: true,
      pathFilter: ["/api/traditions", "/api/articles", "/api/content"],
    })
  );

  // 4. Order Service (/api/orders)
  app.use(
    createProxyMiddleware({
      target: services.order.url,
      changeOrigin: true,
      pathFilter: "/api/orders",
    })
  );

  // 5. Search Service (/api/search)
  app.use(
    createProxyMiddleware({
      target: services.search.url,
      changeOrigin: true,
      pathFilter: "/api/search",
    })
  );

  // 6. Verify Service (/api/verify)
  app.use(
    createProxyMiddleware({
      target: services.verify.url,
      changeOrigin: true,
      pathFilter: "/api/verify",
    })
  );

  // 7. Portal & Mint Service (/api/portal, /api/mint)
  app.use(
    createProxyMiddleware({
      target: services.portal.url,
      changeOrigin: true,
      pathFilter: "/api/portal",
    })
  );
  app.use(
    createProxyMiddleware({
      target: services.portal.url,
      changeOrigin: true,
      pathFilter: "/api/mint",
      pathRewrite: { "^/api/mint": "/api/portal/listing/mint" },
    })
  );

  // 8. Identity & Auth Service (/api/auth, /api/users, /api/identity)
  app.use(
    createProxyMiddleware({
      target: services.identity.url,
      changeOrigin: true,
      pathFilter: ["/api/auth", "/api/users", "/api/identity"],
    })
  );

  // 9. Media & Storage Service (/api/media)
  app.use(
    createProxyMiddleware({
      target: services.media.url,
      changeOrigin: true,
      pathFilter: "/api/media",
    })
  );

  // 10. Fair-Trade Settlement Service (/api/settlement)
  app.use(
    createProxyMiddleware({
      target: services.settlement.url,
      changeOrigin: true,
      pathFilter: "/api/settlement",
    })
  );

  // 11. Notification Service (/api/notifications)
  app.use(
    createProxyMiddleware({
      target: services.notification.url,
      changeOrigin: true,
      pathFilter: "/api/notifications",
    })
  );

  // 12. 3D AI Conversion (/api/ai-3d)
  app.use(
    createProxyMiddleware({
      target: process.env.AI_3D_SVC_URL || "http://localhost:8000",
      changeOrigin: true,
      pathFilter: "/api/ai-3d",
      pathRewrite: { "^/api/ai-3d": "/convert" },
    })
  );

  // Default Fallback
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "Route not found on Mask & Maker API Gateway",
      availableRoutes: [
        "/api/masks",
        "/api/artisans",
        "/api/traditions",
        "/api/articles",
        "/api/content",
        "/api/orders",
        "/api/search",
        "/api/verify",
        "/api/portal",
        "/api/auth",
        "/api/users",
        "/api/media",
        "/api/settlement",
        "/api/notifications",
        "/api/ai-3d",
      ],
      healthCheck: "/health/all",
    });
  });

  return app;
}
