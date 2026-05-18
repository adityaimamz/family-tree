import type { Request } from "express";

const SENSITIVE_QUERY_KEYS = new Set([
  "code",
  "token",
  "key",
  "api_key",
  "apikey",
  "authorization",
  "password",
  "secret",
]);

const INVITE_CODE_PATTERN = /\b[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}\b/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/g;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+?\.[A-Za-z0-9_-]+?\.[A-Za-z0-9_-]+?\b/g;

export const redactSensitiveText = (value: string) =>
  value
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(JWT_PATTERN, "[JWT_REDACTED]")
    .replace(INVITE_CODE_PATTERN, "[INVITE_CODE_REDACTED]");

export const safeRequestPath = (req: Request) => {
  const rawPath = req.originalUrl || req.url || req.path;

  try {
    const url = new URL(rawPath, "http://localhost");
    for (const key of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, "[REDACTED]");
      }
    }
    return redactSensitiveText(`${url.pathname}${url.search}`);
  } catch {
    return redactSensitiveText(rawPath);
  }
};

export const isHttpsUrl = (value: string | null, maxLength = 2048): value is string => {
  if (!value || value.length > maxLength) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export const clampString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
};

export const limitedStringArray = (value: unknown, maxItems: number, maxItemLength: number): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= maxItemLength)
        .slice(0, maxItems)
    : [];
