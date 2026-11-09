import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("[Media Service Error]", err);

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

  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({
      success: false,
      error: "PayloadTooLarge",
      message: "Uploaded file exceeds 50 MB limit",
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

  res.status(err.status || 500).json({
    success: false,
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred in Media Service",
  });
};
