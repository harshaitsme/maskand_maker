import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error("💥 [notification-service] Unhandled Error:", err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation Error",
      issues: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
    statusCode,
  });
}
