import http from "http";
import { env } from "./config/env";
import { prisma } from "./config/database";
import createApp from "./app";

async function main() {
  await prisma.$connect();
  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.info(`[server] StudyAI backend listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    console.info("\n[server] Shutting down...");
    await prisma.$disconnect();
    server.close(() => {
      console.info("[server] Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[server] Fatal error on startup:", err);
  process.exit(1);
});
