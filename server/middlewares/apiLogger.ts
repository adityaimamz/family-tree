import type { RequestHandler } from "express";

export const apiLogger: RequestHandler = (req, res, next) => {
  const startedAt = performance.now();

  res.on("finish", () => {
    if (process.env.NODE_ENV === "production" && process.env.API_DEBUG !== "1") return;

    const durationMs = Math.round(performance.now() - startedAt);
    const level = durationMs > 1_000 || res.statusCode >= 500 ? "warn" : "info";
    console[level]("[api]", {
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
};
