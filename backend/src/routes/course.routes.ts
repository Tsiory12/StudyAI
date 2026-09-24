import { Router } from "express";
import * as courseController from "../controllers/course.controller";
import * as documentController from "../controllers/document.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", courseController.getCourses);
router.post("/", courseController.createCourse);

router.get("/:id", courseController.getCourse);
router.put("/:id", courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);

router.get("/:courseId/documents", documentController.getDocuments);
router.post("/:courseId/documents", upload.single("file"), documentController.uploadDocument);

export default router;
