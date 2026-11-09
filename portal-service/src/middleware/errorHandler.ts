import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("[Portal Service Error]", err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation Error",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      error: "Invalid Parameter",
      message: `Invalid format for field: ${err.path}`,
    });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({
      success: false,
      error: "Conflict",
      message: "A record with this identifier already exists in Portal database.",
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred in Portal/Mint Service",
  });
};
