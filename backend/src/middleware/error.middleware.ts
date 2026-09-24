import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ValidationError } from "../utils/validation";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string") {
    const code = (err as { code: string }).code;
    if (code.startsWith("LIMIT_")) {
      const message =
        code === "LIMIT_FILE_SIZE"
          ? "File is too large"
          : code === "LIMIT_FILE_COUNT"
            ? "Too many files"
            : "Upload limit exceeded";
      res.status(413).json({ success: false, message });
      return;
    }
    if (code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({ success: false, message: "Unexpected file field" });
      return;
    }
  }

  let error = err as Error;
  let statusCode = 500;
  let message = "Internal server error";
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err instanceof ValidationError || err instanceof ZodError) {
    const zodErr = err instanceof ValidationError ? err.zodError : err;
    const issues = zodErr.issues.map((issue) => ({
      path: issue.path.join(".") || "root",
      message: issue.message,
    }));
    res.status(400).json({ success: false, message: "Validation error", errors: issues });
    return;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid request data";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "A resource with this value already exists";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Resource not found";
    } else {
      statusCode = 400;
      message = "Database error";
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.error("[ERROR]", error);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && !isOperational ? { stack: error.stack } : {}),
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Endpoint not found" });
}
