import { Request, Response } from "express";
import { flashcardService } from "../services/flashcard.service";
import { validate, reviewSchema } from "../utils/validation";
import { asyncHandler, sendSuccess } from "../utils/response";
import { getValidatedId } from "../utils/validation";
import { z } from "zod";

const createFlashcardSchema = z.object({
  courseId: z.string().uuid("Invalid course id"),
  question: z.string().min(1, "Question is required").max(2000),
  answer: z.string().min(1, "Answer is required").max(5000),
});

export const createFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(createFlashcardSchema, req.body);
  const flashcard = await flashcardService.createFlashcard({
    userId: req.user!.id,
    courseId: input.courseId,
    question: input.question,
    answer: input.answer,
  });
  return sendSuccess(res, flashcard, "Flashcard created successfully", 201);
});

export const getFlashcards = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.query.courseId ? String(req.query.courseId) : undefined;
  const flashcards = await flashcardService.getFlashcards({ userId: req.user!.id, courseId });
  return sendSuccess(res, flashcards);
});

export const getFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const flashcard = await flashcardService.getFlashcardById(req.user!.id, id);
  return sendSuccess(res, flashcard);
});

export const deleteFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const result = await flashcardService.deleteFlashcard(req.user!.id, id);
  return sendSuccess(res, null, result.message);
});

export const reviewFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const input = validate(reviewSchema, req.body);
  const result = await flashcardService.reviewFlashcard({
    userId: req.user!.id,
    flashcardId: id,
    status: input.status,
  });
  return sendSuccess(res, result, "Review recorded");
});
