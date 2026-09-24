import { prisma } from "../config/database";

export class DashboardService {
  async getDashboard(userId: string) {
    const [
      courseCount,
      documentCount,
      quizCount,
      completedQuizCount,
      avgScore,
      studyTime,
      recentActivity,
      recentCourses,
    ] = await Promise.all([
      prisma.course.count({ where: { userId } }),
      prisma.document.count({ where: { course: { userId } } }),
      prisma.quiz.count({ where: { userId } }),
      prisma.quizAttempt.count({ where: { userId } }),
      prisma.quizAttempt.aggregate({
        where: { userId },
        _avg: { percentage: true },
      }),
      prisma.studySession.aggregate({
        where: { userId, endedAt: { not: null } },
        _sum: { duration: true },
      }),
      this.getRecentActivity(userId),
      prisma.course.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { _count: { select: { documents: true, quizzes: true, flashcards: true } } },
      }),
    ]);

    return {
      courses: courseCount,
      documents: documentCount,
      quizzes: quizCount,
      quizzesCompleted: completedQuizCount,
      averageScore: avgScore.percentage ?? 0,
      studyTimeSeconds: studyTime.duration ?? 0,
      recentActivity,
      recentCourses,
    };
  }

  private async getRecentActivity(userId: string, limit = 10) {
    const activities: Array<{ type: string; message: string; createdAt: Date }> = [];

    const courses = await prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { title: true, createdAt: true },
    });
    for (const c of courses) {
      activities.push({ type: "course", message: `Created course "${c.title}"`, createdAt: c.createdAt });
    }

    const documents = await prisma.document.findMany({
      where: { course: { userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { originalName: true, createdAt: true },
    });
    for (const d of documents) {
      activities.push({ type: "document", message: `Uploaded "${d.originalName}"`, createdAt: d.createdAt });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { title: true, createdAt: true },
    });
    for (const q of quizzes) {
      activities.push({ type: "quiz", message: `Generated quiz "${q.title}"`, createdAt: q.createdAt });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: limit,
      select: { percentage: true, completedAt: true, quiz: { select: { title: true } } },
    });
    for (const a of attempts) {
      activities.push({
        type: "attempt",
        message: `Completed quiz "${a.quiz.title}" with ${a.percentage.toFixed(0)}%`,
        createdAt: a.completedAt,
      });
    }

    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }
}

export const dashboardService = new DashboardService();
