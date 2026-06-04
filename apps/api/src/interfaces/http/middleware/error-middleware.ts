import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "#src/shared/errors/app-error.js";

export function errorMiddleware(error: Error, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof multer.MulterError) {
    response.status(400).json({
      success: false,
      message: error.code === "LIMIT_FILE_SIZE" ? "Uploaded file is too large" : "Invalid file upload",
      details: { code: error.code, field: error.field }
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      message: "Validation failed",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details
    });
    return;
  }

  response.status(500).json({
    success: false,
    message: "Internal server error"
  });
}
