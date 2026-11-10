import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

/**
 * Centralized Error Handler Middleware for artisan-service
 */
export function errorHandler(
  err: unknown,
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

  // Safely extract error properties
  const errorObj = err instanceof Error ? err : new Error(String(err));
  const status = (errorObj as any).statusCode || (errorObj as any).status || 500;
  const message = errorObj.message || "Internal Server Error";

  // Log the error
  console.error(`[Error] ${errorObj.name || "Exception"}: ${message}`);
  if (status === 500 && process.env.NODE_ENV !== "production") {
    console.error(errorObj.stack);
  }

  // Respond to the client
  res.status(status).json({
    error: errorObj.name || "ServerError",
    message: status === 500 && process.env.NODE_ENV === "production" 
      ? "Internal Server Error" 
      : message,
  });
}
