import { z, ZodError, ZodSchema } from "zod";
import { Request } from "express";

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(public readonly zodError: ZodError) {
    super("Validation error");
    this.name = "ValidationError";
  }
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function getValidatedId(req: Request, paramName: string): string {
  const id = req.params[paramName];
  if (!id || !isUuid(id)) {
    throw new ValidationError(
      new ZodError([
        {
          code: "invalid_string",
          message: `${paramName} must be a valid UUID`,
          path: [paramName],
          inclusive: false,
          type: "uuid",
          exact: true,
          fatal: false,
        },
      ]),
    );
  }
  return id;
}

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Invalid email").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  subject: z.string().min(1, "Subject is required").max(100),
  semester: z.string().max(100).optional(),
});

export const documentSummarizeSchema = z.object({
  maxLength: z.coerce.number().min(50).max(2000).optional(),
});

export const quizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  courseId: z.string().uuid("Invalid course id"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questionCount: z.coerce.number().int().min(3).max(20).default(10),
});

export const quizAttemptSchema = z.object({
  answers: z.array(z.any()).min(1, "Answers are required"),
});

export const aiGenerateQuizSchema = z.object({
  courseId: z.string().uuid("Invalid course id").optional(),
  content: z.string().min(10, "Content is required").max(50000),
  questionCount: z.coerce.number().int().min(3).max(20).default(10),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  title: z.string().min(1, "Title is required").max(200),
});

export const aiGenerateFlashcardsSchema = z.object({
  courseId: z.string().uuid("Invalid course id").optional(),
  content: z.string().min(10, "Content is required").max(50000),
  count: z.coerce.number().int().min(3).max(30).default(10),
});

export const aiChatSchema = z.object({
  question: z.string().min(1, "Question is required").max(5000),
  context: z.string().max(10000).optional(),
  courseId: z.string().uuid("Invalid course id").optional(),
  documentId: z.string().uuid("Invalid document id").optional(),
});

export const aiExplainSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  context: z.string().max(10000).optional(),
});

export const aiSummarizeSchema = z.object({
  text: z.string().min(10, "Text is required").max(100000),
  maxLength: z.coerce.number().min(50).max(2000).optional(),
});

export const reviewSchema = z.object({
  status: z.enum(["AGAIN", "GOOD", "EASY"]),
  flashcardId: z.string().uuid("Invalid flashcard id").optional(),
});

export const studySessionSchema = z.object({
  courseId: z.string().uuid("Invalid course id").optional(),
});
