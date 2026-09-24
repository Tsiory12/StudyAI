import { Request, Response } from "express";
import { courseService } from "../services/course.service";
import { validate, courseSchema } from "../utils/validation";
import { asyncHandler, sendSuccess } from "../utils/response";
import { getValidatedId } from "../utils/validation";

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const input = validate(courseSchema, req.body);
  const course = await courseService.createCourse({ userId: req.user!.id, ...input });
  return sendSuccess(res, course, "Course created successfully", 201);
});

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const courses = await courseService.getCourses(req.user!.id);
  return sendSuccess(res, courses);
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const course = await courseService.getCourseById(req.user!.id, id);
  return sendSuccess(res, course);
});

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const input = validate(courseSchema, req.body);
  const course = await courseService.updateCourse(req.user!.id, id, input);
  return sendSuccess(res, course, "Course updated successfully");
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req, "id");
  const result = await courseService.deleteCourse(req.user!.id, id);
  return sendSuccess(res, null, result.message);
});
