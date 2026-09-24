import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/chat", aiController.chat);
router.post("/explain", aiController.explain);
router.post("/summarize", aiController.summarize);
router.post("/generate-quiz", aiController.generateQuiz);
router.post("/generate-flashcards", aiController.generateFlashcards);

export default router;
