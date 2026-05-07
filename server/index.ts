import app, { prisma } from "./app.js";

const isProductionStart =
  process.env.NODE_ENV === "production" || process.env.npm_lifecycle_event === "start";
const fallbackPort = isProductionStart ? 8080 : 3001;
const PORT = Number(process.env.PORT ?? fallbackPort);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
