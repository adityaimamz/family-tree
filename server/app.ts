import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { createRouteHandler } from "uploadthing/express";
import { loadAppUser, requireSpaceMembership } from "./authorization.js";

import { handleError } from "./http/error.js";
import { apiLogger } from "./middlewares/apiLogger.js";
import { securityHeaders } from "./middlewares/securityHeaders.js";
import { spaceSlugFromQuery } from "./middlewares/spaceSlugFromQuery.js";
import { requireAuth } from "./neonAuth.js";
import { registerRoutes } from "./routes/index.js";
import { safeFilename } from "./routes/shared.js";
import { uploadContentTypes, uploadOptimizedImage, uploadRouter } from "./uploadthing.js";

const app = express();
const distPath = path.resolve(process.cwd(), "dist");
const indexHtmlPath = path.join(distPath, "index.html");

const allowedOrigins = new Set(
  [
    process.env.APP_BASE_URL,
    "https://warisan-ai-558467708906.asia-southeast2.run.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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

app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);
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

app.post(
  "/api/uploads/photos",
  requireAuth,
  loadAppUser,
  spaceSlugFromQuery,
  requireSpaceMembership,
  express.raw({
    limit: "4mb",
    type: [...uploadContentTypes],
  }),
  async (req, res) => {
    try {
      const folder = String(req.query.folder ?? "");
      if (folder !== "members" && folder !== "gallery") {
        res.status(400).json({ error: "Invalid upload folder. Use members or gallery." });
        return;
      }

      const contentType = req.headers["content-type"]?.split(";")[0];
      if (!contentType || !uploadContentTypes.includes(contentType as (typeof uploadContentTypes)[number])) {
        res.status(415).json({ error: "Only JPEG, PNG, and WebP images are supported." });
        return;
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: "No image file received." });
        return;
      }

      const filename = safeFilename(String(req.query.filename ?? "photo"));
      const upload = await uploadOptimizedImage({
        body: req.body,
        filename,
        folder,
      });

      res.json(upload);
    } catch (error) {
      handleError(res, error, "Failed to upload image");
    }
  },
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
