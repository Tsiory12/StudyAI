import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { ValidationError } from "../utils/validation";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

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
  let error = err as Error;
  let statusCode = 500;
  let message = "Internal server error";
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err instanceof ValidationError || err instanceof ZodError) {
    const zodErr = err instanceof ZodError ? err : (err as ValidationError).zodError;
    const issues = zodErr.issues.map((issue) => ({
      path: issue.path.join(".") || "root",
      message: issue.message,
    }));
    statusCode = 400;
    message = "Validation error";
    res.status(statusCode).json({ success: false, message, errors: issues });
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
    statusCode = statusCode;
    isOperational = isOperational;
  }

  if (!isOperational && process.env.NODE_ENV === "production") {
    error = new Error("Something went wrong");
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
