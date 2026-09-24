import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";

export class CourseService {
  async createCourse(input: { userId: string; title: string; description?: string; subject: string; semester?: string }) {
    return prisma.course.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        subject: input.subject,
        semester: input.semester,
      },
      include: { _count: { select: { documents: true, quizzes: true, flashcards: true } } },
    });
  }

  async getCourses(userId: string) {
    return prisma.course.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { documents: true, quizzes: true, flashcards: true } } },
    });
  }

  async getCourseById(userId: string, id: string) {
    const course = await prisma.course.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { documents: true, quizzes: true, flashcards: true } },
        documents: { orderBy: { createdAt: "desc" } },
        quizzes: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!course) {
      throw new AppError("Course not found", 404);
    }
    return course;
  }

  async updateCourse(userId: string, id: string, input: { title?: string; description?: string; subject?: string; semester?: string }) {
    const course = await prisma.course.findFirst({ where: { id, userId } });
    if (!course) {
      throw new AppError("Course not found", 404);
    }
    return prisma.course.update({
      where: { id },
      data: input,
      include: { _count: { select: { documents: true, quizzes: true, flashcards: true } } },
    });
  }

  async deleteCourse(userId: string, id: string) {
    const course = await prisma.course.findFirst({ where: { id, userId } });
    if (!course) {
      throw new AppError("Course not found", 404);
    }
    await prisma.course.delete({ where: { id } });
    return { message: "Course deleted successfully" };
  }
}

export const courseService = new CourseService();
