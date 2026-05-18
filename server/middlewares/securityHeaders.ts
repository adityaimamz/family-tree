import type { RequestHandler } from "express";

const originFrom = (value: string | undefined) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const cspConnectSources = () =>
  [
    "'self'",
    originFrom(process.env.VITE_NEON_AUTH_URL),
    originFrom(process.env.APP_BASE_URL),
    "https://generativelanguage.googleapis.com",
    "https://*.uploadthing.com",
    "https://*.ufs.sh",
  ]
    .filter(Boolean)
    .join(" ");

const csp = () =>
  [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${cspConnectSources()}`,
    "form-action 'self'",
  ].join("; ");

export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Content-Security-Policy-Report-Only", csp());
  if (req.path === "/api" || req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
};
