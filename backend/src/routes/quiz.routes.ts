import { Router } from "express";
import * as quizController from "../controllers/quiz.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", quizController.getQuizzes);
router.post("/", quizController.createQuiz);

router.get("/:id", quizController.getQuiz);
router.delete("/:id", quizController.deleteQuiz);

router.get("/:id/attempts", quizController.getAttempts);
router.post("/:id/attempts", quizController.createAttempt);

export default router;
