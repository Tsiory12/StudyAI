import { Request, Response, NextFunction } from "express";
import { documentService } from "../services/document.service";
import { validate, documentSummarizeSchema } from "../utils/validation";
import { asyncHandler, sendSuccess } from "../utils/response";
import { getValidatedId } from "../utils/validation";
import { AppError } from "../middleware/error.middleware";

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const courseId = getValidatedId(req, "courseId");
  const documents = await documentService.getDocumentsByCourse(req.user!.id, courseId);
  return sendSuccess(res, documents);
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const courseId = getValidatedId(req, "courseId");
  if (!req.file) {
    throw new AppError("No file provided", 400);
  }
  const document = await documentService.createDocument({
    courseId,
    userId: req.user!.id,
    file: req.file as Express.Multer.File,
  });
  return sendSuccess(res, document, "Document uploaded successfully", 201);
});

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const document = await documentService.getDocumentById(req.user!.id, id);
  return sendSuccess(res, document);
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const result = await documentService.deleteDocument(req.user!.id, id);
  return sendSuccess(res, null, result.message);
});

export const summarizeDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const input = validate(documentSummarizeSchema, req.body);
  const { text } = await documentService.summarize(req.user!.id, id, input.maxLength);
  return sendSuccess(res, text, "Document text retrieved for summarization");
});
