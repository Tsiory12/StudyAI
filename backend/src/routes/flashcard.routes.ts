import { Router } from "express";
import * as flashcardController from "../controllers/flashcard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", flashcardController.getFlashcards);
router.post("/", flashcardController.createFlashcard);

router.get("/:id", flashcardController.getFlashcard);
router.delete("/:id", flashcardController.deleteFlashcard);
router.post("/:id/review", flashcardController.reviewFlashcard);

export default router;
