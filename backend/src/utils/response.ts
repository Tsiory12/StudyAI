import { Request, Response, NextFunction } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function sendSuccess(res: Response, data: unknown, message?: string, statusCode = 200) {
  const body: { success: boolean; message?: string; data: unknown } = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}
