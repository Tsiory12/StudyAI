import { Request, Response } from "express";
import { studyService } from "../services/study.service";
import { asyncHandler, sendSuccess } from "../utils/response";
import { getValidatedId } from "../utils/validation";

export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.body as { courseId?: string };
  const session = await studyService.startSession({
    userId: req.user!.id,
    courseId: courseId ?? undefined,
  });
  return sendSuccess(res, session, "Study session started", 201);
});

export const endSession = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const session = await studyService.endSession(req.user!.id, id, new Date());
  return sendSuccess(res, session, "Study session ended");
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await studyService.listSessions({ userId: req.user!.id });
  return sendSuccess(res, sessions);
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await studyService.getStats(req.user!.id);
  return sendSuccess(res, stats);
});
