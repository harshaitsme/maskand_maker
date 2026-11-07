import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

/**
 * Centralized Error Handler Middleware
 * Formats errors into clean, readable JSON structures for API consumers
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation Error",
      message: "One or more request parameters failed validation",
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  // Handle Domain / Business Logic Errors
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${err.name || "Exception"}: ${message}`);
  if (status === 500 && process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(status).json({
    error: err.name || "ServerError",
    message,
  });
}
