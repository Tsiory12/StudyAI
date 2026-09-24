import { prisma } from "../src/config/database";
import { env } from "../src/config/env";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

async function main() {
  const passwordHash = await bcrypt.hash("password123", env.BCRYPT_ROUNDS);
  const user = await prisma.user.upsert({
    where: { email: "dev@studyai.test" },
    update: { name: "Dev User", passwordHash },
    create: {
      name: "Dev User",
      email: "dev@studyai.test",
      passwordHash,
    },
  });

  console.log("👤 Seeded user:", user.email);

  const courses = await prisma.course.upsert({
    where: { id: "course-1" },
    update: {},
    create: {
      id: "course-1",
      userId: user.id,
      title: "HTTP Fundamentals",
      description: "Introduction to REST APIs, HTTP methods, and status codes.",
      subject: "Computer Science",
      semester: "Fall 2024",
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: "course-2" },
    update: {},
    create: {
      id: "course-2",
      userId: user.id,
      title: "Biology 101",
      description: "Cell biology and genetics basics.",
      subject: "Biology",
      semester: "Spring 2024",
    },
  });

  console.log("📚 Seeded courses:", courses.title, "+", course2.title);

  const notesText =
    "REST (Representational State Transfer) is an architectural style for designing networked applications. " +
    "It relies on a stateless, client-server protocol — typically HTTP. REST APIs use standard HTTP methods: " +
    "GET (retrieve), POST (create), PUT (replace), PATCH (partial update), DELETE. Resources are identified by URIs. " +
    "HTTP status codes signal results: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error. " +
    "A key constraint is statelessness: each request contains all the information needed to process it.";

  const txtPath = path.join(env.UPLOAD_DIR, "rest-notes.txt");
  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
  await fs.writeFile(txtPath, notesText, "utf-8");

  await prisma.document.create({
    data: {
      id: "doc-1",
      courseId: courses.id,
      name: "rest-notes.txt",
      originalName: "rest-notes.txt",
      filePath: txtPath,
      mimeType: "text/plain",
      size: Buffer.byteLength(notesText),
      extractedText: notesText,
    },
  });

  console.log("📄 Seeded document: rest-notes.txt");

  const quiz = await prisma.quiz.create({
    data: {
      id: "quiz-1",
      userId: user.id,
      courseId: courses.id,
      title: "HTTP Fundamentals Quiz",
      difficulty: "MEDIUM",
      questionCount: 2,
      questions: {
        create: [
          {
            id: "q-1",
            question: "Which HTTP method is used to retrieve a resource?",
            type: "MULTIPLE_CHOICE",
            options: ["POST", "GET", "PUT", "DELETE"],
            correctAnswer: "GET",
            explanation: "GET is the standard method for retrieving a representation of a resource.",
          },
          {
            id: "q-2",
            question: "HTTP responses are stateless.",
            type: "TRUE_FALSE",
            options: ["True", "False"],
            correctAnswer: "False",
            explanation: "HTTP is stateless by itself, but sessions/cookies add state.",
          },
        ],
      },
    },
  });

  await prisma.quizAttempt.create({
    data: {
      id: "attempt-1",
      userId: user.id,
      quizId: quiz.id,
      score: 2,
      totalQuestions: 2,
      percentage: 100,
      answers: {
        results: [
          { questionId: "q-1", selectedAnswer: "GET", correctAnswer: "GET", isCorrect: true },
          { questionId: "q-2", selectedAnswer: "False", correctAnswer: "False", isCorrect: true },
        ],
      },
    },
  });

  console.log("🧪 Seeded quiz with attempt: HTTP Fundamentals Quiz");

  const fc1 = await prisma.flashcard.create({
    data: {
      id: "fc-1",
      userId: user.id,
      courseId: courses.id,
      question: "What does REST stand for?",
      answer: "Representational State Transfer.",
    },
  });
  const fc2 = await prisma.flashcard.create({
    data: {
      id: "fc-2",
      userId: user.id,
      courseId: courses.id,
      question: "What HTTP status code means Created?",
      answer: "201 Created.",
    },
  });

  await prisma.flashcardReview.createMany({
    data: [
      { id: "rev-1", flashcardId: fc1.id, userId: user.id, status: "GOOD" },
      { id: "rev-2", flashcardId: fc2.id, userId: user.id, status: "EASY" },
    ],
  });

  console.log("🗂️ Seeded flashcards with reviews");

  const started = new Date();
  started.setHours(started.getHours() - 1);
  const ended = new Date();

  await prisma.studySession.create({
    data: {
      id: "session-1",
      userId: user.id,
      courseId: courses.id,
      startedAt: started,
      endedAt: ended,
      duration: 3600,
    },
  });

  console.log("⏱️ Seeded study session");
  console.log("\n✅ Seed complete! Login with dev@studyai.test / password123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
