import { Difficulty } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { aiService } from "./ai/ai.service";
import { AIGeneratedQuiz } from "./ai/types";

export class QuizService {
  async generateQuiz(input: {
    userId: string;
    courseId?: string;
    title: string;
    content: string;
    questionCount: number;
    difficulty: Difficulty;
  }): Promise<AIGeneratedQuiz> {
    const generated = await aiService.generateQuiz({
      content: input.content,
      questionCount: input.questionCount,
      difficulty: input.difficulty,
      title: input.title,
    });
    return generated;
  }

  async createQuiz(input: {
    userId: string;
    courseId?: string;
    title: string;
    difficulty: Difficulty;
    questions: {
      question: string;
      type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
      options: string[];
      correctAnswer: string;
      explanation?: string;
    }[];
  }) {
    if (input.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: input.courseId, userId: input.userId },
      });
      if (!course) {
        throw new AppError("Course not found", 404);
      }
    }

    return prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          userId: input.userId,
          courseId: input.courseId,
          title: input.title,
          difficulty: input.difficulty,
          questionCount: input.questions.length,
        },
      });

      const questionsData = input.questions.map((q) => ({
        quizId: quiz.id,
        question: q.question,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }));

      await tx.question.createMany({ data: questionsData });

      return tx.quiz.findUnique({
        where: { id: quiz.id },
        include: { questions: true, course: { select: { id: true, title: true } } },
      });
    });
  }

  async createFromGenerated(input: {
    userId: string;
    courseId?: string;
    title: string;
    difficulty: Difficulty;
    questions: {
      question: string;
      type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
      options: string[];
      correctAnswer: string;
      explanation?: string;
    }[];
  }) {
    return this.createQuiz(input);
  }

  async getQuizzes(userId: string) {
    return prisma.quiz.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { attempts: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async getQuizById(userId: string, id: string) {
    const quiz = await prisma.quiz.findFirst({
      where: { id, userId },
      include: {
        questions: { orderBy: { id: "asc" } },
        course: { select: { id: true, title: true } },
        _count: { select: { attempts: true } },
      },
    });
    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }
    return quiz;
  }

  async deleteQuiz(userId: string, id: string) {
    const quiz = await prisma.quiz.findFirst({ where: { id, userId } });
    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }
    await prisma.quiz.delete({ where: { id } });
    return { message: "Quiz deleted successfully" };
  }

  async createAttempt(input: {
    userId: string;
    quizId: string;
    answers: { questionId: string; selectedAnswer: string }[];
  }) {
    const quiz = await this.getQuizById(input.userId, input.quizId);
    const questions = quiz.questions;

    let score = 0;
    const results = questions.map((q) => {
      const attempt = input.answers.find((a) => a.questionId === q.id);
      const selected = attempt?.selectedAnswer ?? null;
      const isCorrect = selected !== null && selected === q.correctAnswer;
      if (isCorrect) score += 1;
      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: selected,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions === 0 ? 0 : (score / totalQuestions) * 100;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: input.userId,
        quizId: quiz.id,
        score,
        totalQuestions,
        percentage,
        answers: results,
      },
    });

    return {
      attempt,
      results,
      score,
      totalQuestions,
      percentage,
    };
  }

  async getAttempts(userId: string, quizId: string) {
    const quiz = await this.getQuizById(userId, quizId);
    return prisma.quizAttempt.findMany({
      where: { quizId: quiz.id, userId },
      orderBy: { completedAt: "desc" },
    });
  }
}

export const quizService = new QuizService();
