import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { aiService } from "../services/ai/ai.service";
import { documentService } from "../services/document.service";
import { courseService } from "../services/course.service";
import { quizService } from "../services/quiz.service";
import { flashcardService } from "../services/flashcard.service";
import {
  validate,
  aiChatSchema,
  aiExplainSchema,
  aiSummarizeSchema,
  aiGenerateFlashcardsSchema,
} from "../utils/validation";
import { asyncHandler, sendSuccess } from "../utils/response";

const aiGenerateQuizBodySchema = z.object({
  courseId: z.string().uuid().optional(),
  content: z.string().min(10, "Content is required").max(50000),
  questionCount: z.coerce.number().int().min(3).max(20).default(10),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  title: z.string().min(1, "Title is required").max(200),
});

async function buildContentWithContext(userId: string, courseId: string | undefined, content: string): Promise<string> {
  if (!courseId) return content;
  const course = await courseService.getCourseById(userId, courseId);
  const docs = await prisma.document.findMany({
    where: { courseId: course.id, extractedText: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  const docTexts = docs.map((d) => d.extractedText).filter(Boolean).join("\n\n");
  return docTexts ? `${content}\n\n--- Course documents ---\n${docTexts}` : content;
}

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(aiChatSchema, req.body);

  let context = input.context;

  if (input.documentId) {
    const document = await documentService.getDocumentById(req.user!.id, input.documentId);
    if (!document.extractedText) {
      await documentService.extractText(req.user!.id, input.documentId);
    }
    const refreshed = await documentService.getDocumentById(req.user!.id, input.documentId);
    context = refreshed.extractedText ?? context;
  }

  if (input.courseId && !context) {
    context = await buildContentWithContext(req.user!.id, input.courseId, "");
  }

  const result = await aiService.chat({ question: input.question, context });
  return sendSuccess(res, result);
});

export const explain = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(aiExplainSchema, req.body);
  const result = await aiService.explain({
    subject: input.subject,
    difficulty: input.difficulty,
    context: input.context,
  });
  return sendSuccess(res, result);
});

export const summarize = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(aiSummarizeSchema, req.body);
  const result = await aiService.summarize({ text: input.text, maxLength: input.maxLength });
  return sendSuccess(res, result);
});

export const generateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(aiGenerateQuizBodySchema, req.body);
  const content = await buildContentWithContext(req.user!.id, input.courseId, input.content);
  const generated = await aiService.generateQuiz({
    content,
    questionCount: input.questionCount,
    difficulty: input.difficulty,
    title: input.title,
  });

  const quiz = await quizService.createFromGenerated({
    userId: req.user!.id,
    courseId: input.courseId,
    title: generated.title,
    difficulty: input.difficulty,
    questions: generated.questions,
  });

  return sendSuccess(res, quiz, "Quiz generated successfully", 201);
});

export const generateFlashcards = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(aiGenerateFlashcardsSchema, req.body);
  const content = await buildContentWithContext(req.user!.id, input.courseId, input.content);
  const generated = await aiService.generateFlashcards({ content, count: input.count });

  const created = await flashcardService.createMany(req.user!.id, input.courseId, generated.flashcards);
  return sendSuccess(res, created, "Flashcards generated successfully", 201);
});
