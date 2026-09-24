import { Router } from "express";
import * as documentController from "../controllers/document.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:id", documentController.getDocument);
router.delete("/:id", documentController.deleteDocument);
router.post("/:id/summarize", documentController.summarizeDocument);

export default router;
