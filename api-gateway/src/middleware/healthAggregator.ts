import { Request, Response } from "express";
import { services } from "../config/services.js";

export async function aggregateHealth(_req: Request, res: Response): Promise<void> {
  const serviceKeys = Object.keys(services);

  const checks = await Promise.all(
    serviceKeys.map(async (key) => {
      const svc = services[key];
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(svc.healthUrl, { signal: controller.signal });
        clearTimeout(timeout);
        const durationMs = Date.now() - start;

        if (response.ok) {
          const body = await response.json().catch(() => null);
          return {
            service: svc.name,
            key,
            url: svc.url,
            status: "UP",
            statusCode: response.status,
            latencyMs: durationMs,
            details: body,
          };
        } else {
          return {
            service: svc.name,
            key,
            url: svc.url,
            status: "DEGRADED",
            statusCode: response.status,
            latencyMs: durationMs,
          };
        }
      } catch (err: any) {
        return {
          service: svc.name,
          key,
          url: svc.url,
          status: "DOWN",
          error: err.name === "AbortError" ? "Timeout after 2000ms" : err.message,
          latencyMs: Date.now() - start,
        };
      }
    })
  );

  const total = checks.length;
  const upCount = checks.filter((c) => c.status === "UP").length;
  const isHealthy = upCount >= total * 0.7; // Healthy if at least 70% of microservices are UP

  res.status(isHealthy ? 200 : 503).json({
    gateway: "mask-and-maker-api-gateway",
    status: isHealthy ? "healthy" : "degraded",
    clusterHealth: `${upCount}/${total} services UP`,
    timestamp: new Date().toISOString(),
    services: checks,
  });
}
