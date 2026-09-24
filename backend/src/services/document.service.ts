import fs from "fs/promises";
import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { ExtractedText, extractTextFromFile } from "./document-extractor";

export class DocumentService {
  async createDocument(input: {
    courseId: string;
    userId: string;
    file: Express.Multer.File;
  }) {
    const course = await prisma.course.findFirst({
      where: { id: input.courseId, userId: input.userId },
    });
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const document = await prisma.document.create({
      data: {
        courseId: input.courseId,
        name: input.file.filename,
        originalName: input.file.originalname,
        filePath: input.file.path,
        mimeType: input.file.mimetype,
        size: input.file.size,
      },
    });

    return document;
  }

  async getDocumentsByCourse(userId: string, courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
    });
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    return prisma.document.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDocumentById(userId: string, documentId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId },
      include: { course: { where: { userId } } },
    });
    if (!document || !document.course) {
      throw new AppError("Document not found", 404);
    }
    return document;
  }

  async deleteDocument(userId: string, documentId: string) {
    const document = await this.getDocumentById(userId, documentId);
    await prisma.$transaction(async (tx) => {
      await tx.document.delete({ where: { id: document.id } });
      try {
        await fs.unlink(document.filePath);
      } catch {
        // file may not exist; ignore
      }
    });
    return { message: "Document deleted successfully" };
  }

  async extractText(userId: string, documentId: string): Promise<ExtractedText> {
    const document = await this.getDocumentById(userId, documentId);
    const result = await extractTextFromFile(document.filePath, document.mimeType);
    if (result.text) {
      await prisma.document.update({
        where: { id: document.id },
        data: { extractedText: result.text },
      });
    }
    return result;
  }

  async summarize(userId: string, documentId: string) {
    const document = await this.getDocumentById(userId, documentId);
    let text = document.extractedText;
    if (!text) {
      const result = await this.extractText(userId, documentId);
      text = result.text;
    }
    if (!text) {
      throw new AppError("No extractable text could be retrieved from this document.", 422);
    }
    return { text };
  }
}

export const documentService = new DocumentService();

