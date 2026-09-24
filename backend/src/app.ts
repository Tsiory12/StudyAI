import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import courseRoutes from "./routes/course.routes";
import documentRoutes from "./routes/document.routes";
import aiRoutes from "./routes/ai.routes";
import quizRoutes from "./routes/quiz.routes";
import flashcardRoutes from "./routes/flashcard.routes";
import studyRoutes from "./routes/study.routes";
import dashboardRoutes from "./routes/dashboard.routes";

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  app.use("/uploads", express.static(env.UPLOAD_DIR));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  app.get("/", (_req: Request, res: Response) => {
    res.json({ success: true, message: "StudyAI API is running", version: "1.0.0" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/quizzes", quizRoutes);
  app.use("/api/flashcards", flashcardRoutes);
  app.use("/api/study", studyRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
