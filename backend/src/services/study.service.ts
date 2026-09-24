import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";

export class StudyService {
  async startSession(input: { userId: string; courseId?: string }) {
    let courseId: string | undefined = input.courseId;
    if (courseId) {
      const course = await prisma.course.findFirst({ where: { id: courseId, userId: input.userId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }
    }
    return prisma.studySession.create({
      data: {
        userId: input.userId,
        courseId: courseId ?? null,
      },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  async endSession(userId: string, id: string, endedAt: Date) {
    const session = await prisma.studySession.findFirst({ where: { id, userId } });
    if (!session) {
      throw new AppError("Study session not found", 404);
    }
    const start = new Date(session.startedAt).getTime();
    const end = new Date(endedAt).getTime();
    const duration = Math.max(0, Math.floor((end - start) / 1000));
    return prisma.studySession.update({
      where: { id },
      data: { endedAt, duration },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  async listSessions(input: { userId: string; limit?: number }) {
    return prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: input.limit ?? 50,
      include: { course: { select: { id: true, title: true, subject: true } } },
    });
  }

  async getStats(userId: string) {
    const [sessions, flashcards, reviews] = await Promise.all([
      prisma.studySession.findMany({ where: { userId }, select: { startedAt: true, endedAt: true, duration: true } }),
      prisma.flashcard.findMany({
        where: { userId },
        select: { id: true, reviews: { select: { status: true, reviewedAt: true } } },
      }),
      prisma.flashcardReview.findMany({
        where: { userId },
        select: { status: true, reviewedAt: true },
      }),
    ]);

    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const completedSessions = sessions.filter((s) => s.endedAt !== null).length;
    const totalSessions = sessions.length;

    const dailyMap = new Map<string, number>();
    for (const s of sessions) {
      if (s.endedAt && s.duration) {
        const day = new Date(s.startedAt).toISOString().slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + s.duration);
      }
    }
    const dailyActivity = Array.from(dailyMap.entries()).map(([date, seconds]) => ({
      date,
      seconds,
    }));

    const totalReviews = reviews.length;
    const mastered = flashcards.filter((f) => f.reviews.length > 0).length;

    return {
      totalStudyTimeSeconds: totalSeconds,
      completedSessions,
      totalSessions,
      dailyActivity,
      flashcardsReviewed: totalReviews,
      flashcardsMastered: mastered,
      totalFlashcards: flashcards.length,
    };
  }
}

export const studyService = new StudyService();
