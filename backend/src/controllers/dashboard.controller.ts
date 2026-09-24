import { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";
import { asyncHandler, sendSuccess } from "../utils/response";

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getDashboard(req.user!.id);
  return sendSuccess(res, data);
});
