import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { validate, registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "../utils/validation";
import { asyncHandler, sendSuccess } from "../utils/response";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(registerSchema, req.body);
  const result = await authService.register(input);
  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return sendSuccess(res, { user: result.user, token: result.token }, "Account registered successfully", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(loginSchema, req.body);
  const result = await authService.login(input);
  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return sendSuccess(res, { user: result.user, token: result.token }, "Logged in successfully");
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("token");
  return sendSuccess(res, null, "Logged out successfully");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  return sendSuccess(res, { user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(updateProfileSchema, req.body);
  const user = await authService.updateProfile(req.user!.id, input);
  return sendSuccess(res, { user }, "Profile updated successfully");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(changePasswordSchema, req.body);
  const result = await authService.changePassword(req.user!.id, input);
  return sendSuccess(res, null, result.message);
});
