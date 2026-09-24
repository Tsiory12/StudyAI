import { Router } from "express";
import * as studyController from "../controllers/study.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/sessions", studyController.startSession);
router.get("/sessions", studyController.listSessions);
router.patch("/sessions/:id/end", studyController.endSession);
router.get("/stats", studyController.getStats);

export default router;
