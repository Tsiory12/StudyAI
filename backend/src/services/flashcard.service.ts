import { ReviewStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { aiService } from "./ai/ai.service";

export class FlashcardService {
  async createFlashcard(input: {
    userId: string;
    courseId: string;
    question: string;
    answer: string;
  }) {
    const course = await prisma.course.findFirst({
      where: { id: input.courseId, userId: input.userId },
    });
    if (!course) {
      throw new AppError("Course not found", 404);
    }
    return prisma.flashcard.create({
      data: {
        userId: input.userId,
        courseId: input.courseId,
        question: input.question,
        answer: input.answer,
      },
    });
  }

  async createMany(
    userId: string,
    courseId: string | undefined,
    items: Array<{ question: string; answer: string }>,
  ) {
    if (courseId) {
      const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }
    }
    return prisma.$transaction(async (tx) => {
      const created: Array<unknown> = [];
      for (const item of items) {
        const fc = await tx.flashcard.create({
          data: { userId, courseId: courseId ?? null, question: item.question, answer: item.answer },
        });
        created.push(fc);
      }
      return created;
    });
  }

  async generateFlashcards(input: {
    userId: string;
    courseId?: string;
    content: string;
    count: number;
  }) {
    const generated = await aiService.generateFlashcards({
      content: input.content,
      count: input.count,
    });
    return generated;
  }

  async getFlashcards(input: { userId: string; courseId?: string }) {
    return prisma.flashcard.findMany({
      where: {
        userId: input.userId,
        ...(input.courseId ? { courseId: input.courseId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { reviews: true } },
        reviews: { orderBy: { reviewedAt: "desc" }, take: 1 },
      },
    });
  }

  async getFlashcardById(userId: string, id: string) {
    const flashcard = await prisma.flashcard.findFirst({
      where: { id, userId },
      include: { course: { select: { id: true, title: true } } },
    });
    if (!flashcard) {
      throw new AppError("Flashcard not found", 404);
    }
    return flashcard;
  }

  async deleteFlashcard(userId: string, id: string) {
    const flashcard = await prisma.flashcard.findFirst({ where: { id, userId } });
    if (!flashcard) {
      throw new AppError("Flashcard not found", 404);
    }
    await prisma.flashcard.delete({ where: { id } });
    return { message: "Flashcard deleted successfully" };
  }

  async reviewFlashcard(input: {
    userId: string;
    flashcardId: string;
    status: ReviewStatus;
  }) {
    const flashcard = await this.getFlashcardById(input.userId, input.flashcardId);
    await prisma.flashcardReview.create({
      data: {
        flashcardId: flashcard.id,
        userId: input.userId,
        status: input.status,
      },
    });
    return { message: "Review recorded", flashcardId: flashcard.id };
  }
}

export const flashcardService = new FlashcardService();
