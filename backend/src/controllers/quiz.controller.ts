import { Request, Response } from "express";
import { z } from "zod";
import { quizService } from "../services/quiz.service";
import { validate, quizAttemptSchema } from "../utils/validation";
import { asyncHandler, sendSuccess } from "../utils/response";
import { getValidatedId } from "../utils/validation";

const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  courseId: z.string().uuid().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]),
        options: z.array(z.string()).min(2),
        correctAnswer: z.string().min(1),
        explanation: z.string().optional(),
      }),
    )
    .min(1),
});

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(createQuizSchema, req.body);
  const quiz = await quizService.createQuiz({ userId: req.user!.id, ...input });
  return sendSuccess(res, quiz, "Quiz created successfully", 201);
});

export const getQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.query.courseId ? String(req.query.courseId) : undefined;
  const quizzes = await quizService.getQuizzes(req.user!.id, courseId);
  return sendSuccess(res, quizzes);
});

export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const quiz = await quizService.getQuizById(req.user!.id, id);
  return sendSuccess(res, quiz);
});

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const result = await quizService.deleteQuiz(req.user!.id, id);
  return sendSuccess(res, null, result.message);
});

export const createAttempt = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const input = validate(quizAttemptSchema, req.body);
  const result = await quizService.createAttempt({
    userId: req.user!.id,
    quizId: id,
    answers: input.answers as Array<{ questionId: string; selectedAnswer: string }>,
  });
  return sendSuccess(res, result, "Quiz attempt recorded", 201);
});

export const getAttempts = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const attempts = await quizService.getAttempts(req.user!.id, id);
  return sendSuccess(res, attempts);
});
