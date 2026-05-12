import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { createRouteHandler } from "uploadthing/express";

import { apiLogger } from "./middlewares/apiLogger.js";
import { securityHeaders } from "./middlewares/securityHeaders.js";
import { requireAuth } from "./neonAuth.js";
import { registerRoutes } from "./routes/index.js";
import { uploadRouter } from "./uploadthing.js";

const app = express();
const distPath = path.resolve(process.cwd(), "dist");
const indexHtmlPath = path.join(distPath, "index.html");

const envOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const allowedOrigins = new Set(
  [
    process.env.APP_BASE_URL,
    ...envOrigins,
  ].filter(Boolean),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(securityHeaders);

const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many auth requests. Please try again later." },
});

// Feature: invite-family — tighter limit to blunt brute-force guessing of codes.
const joinLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many join attempts. Please try again later." },
});

app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/invites/join", joinLimiter);
app.use("/api", apiLogger);
app.use(express.json({ limit: "2mb" }));

app.use(
  "/api/uploadthing",
  requireAuth,
  createRouteHandler({
    router: uploadRouter,
    config: { token: process.env.UPLOADTHING_TOKEN },
  }),
);

registerRoutes(app);

app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path === "/api" || req.path.startsWith("/api/")) {
    next();
    return;
  }

  res.sendFile(indexHtmlPath);
});

export { prisma } from "./db.js";
export default app;
