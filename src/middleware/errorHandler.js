import { ZodError } from "zod";
import { HttpError } from "../errors/HttpError.js";

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details
      }
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues
      }
    });
  }

  return res.status(500).json({
    error: {
      message: "Internal server error"
    }
  });
}
